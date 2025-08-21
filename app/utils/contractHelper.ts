import { setContractAddress } from './web3';

// This file is used to set the contract address after deployment
// In a production application, this would be configured differently
// such as through environment variables

// Function to set the contract address (used after deployment)
export const initializeContract = (address: string) => {
  console.log(`Initializing contract with address: ${address}`);
  setContractAddress(address);
  
  // Store in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('contractAddress', address);
  }
};

// Auto-initialize from localStorage if available
export const loadContractAddress = () => {
  if (typeof window !== 'undefined') {
    const storedAddress = localStorage.getItem('contractAddress');
    if (storedAddress) {
      setContractAddress(storedAddress);
      return true;
    }
  }
  return false;
};

// Development helper to clear the contract address
export const clearContractAddress = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('contractAddress');
  }
}; 