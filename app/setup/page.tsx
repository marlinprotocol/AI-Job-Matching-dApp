'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeContract, loadContractAddress } from '../utils/contractHelper';

export default function Setup() {
  const router = useRouter();
  const [contractAddress, setContractAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if contract address is already set
    const isContractSet = loadContractAddress();
    if (isContractSet) {
      router.push('/');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate Ethereum address (simple validation)
      if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid Ethereum address format');
      }
      
      // Initialize the contract
      initializeContract(contractAddress);
      
      // Redirect to home page
      router.push('/');
      
    } catch (err: any) {
      console.error('Error setting contract address:', err);
      setError(err.message || 'Failed to set contract address');
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Setup Contract</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          You need to connect to a deployed JobMarketplace contract. Enter the contract address below.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="contractAddress" className="block mb-2 font-medium">
            Contract Address
          </label>
          <input
            type="text"
            id="contractAddress"
            placeholder="0x..."
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Connect to Contract
        </button>
      </form>
      
      <div className="mt-6 text-center text-gray-600">
        <p>Don't have a contract deployed yet?</p>
        <p className="mt-1">
          Follow the instructions in the README to deploy the JobMarketplace contract.
        </p>
      </div>
    </div>
  );
} 