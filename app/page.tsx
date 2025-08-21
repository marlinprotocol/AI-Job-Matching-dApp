'use client';

import Link from 'next/link';
import { useState } from 'react';
import { callOysterAPI, performAttestation } from './utils/llmService';

export default function Home() {
  const [apiResult, setApiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [attestationResult, setAttestationResult] = useState<any>(null);
  const [attestationLoading, setAttestationLoading] = useState(false);
  const [attestationError, setAttestationError] = useState<string>('');

  const testOysterAPI = async () => {
    setLoading(true);
    setError('');
    setApiResult(null);
    
    try {
      const result = await callOysterAPI("What is Ethereum?");
      setApiResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to call Oyster API');
    } finally {
      setLoading(false);
    }
  };

  const testAttestation = async () => {
    setAttestationLoading(true);
    setAttestationError('');
    setAttestationResult(null);
    
    try {
      const result = await performAttestation();
      setAttestationResult(result);
    } catch (err: any) {
      setAttestationError(err.message || 'Failed to perform attestation');
    } finally {
      setAttestationLoading(false);
    }
  };
  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Decentralized Job Marketplace</h1>
        <p className="text-xl max-w-3xl mx-auto mb-6">
          A blockchain-powered platform connecting job seekers and employers with smart-contract based 
          matching using an efficient O(n²) algorithm.
        </p>
        
        {/* New AI Feature Highlight */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">🤖 NEW: AI-Powered Matching</h2>
          <p className="text-lg">
            Now featuring Llama 3.2 AI that intelligently analyzes job requirements and candidate profiles 
            for smarter, more accurate matches beyond traditional algorithms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">For Job Seekers</h2>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Create your profile with skills, experience, and salary expectations</li>
            <li>Get matched with jobs based on your qualifications</li>
            <li>Smart contract ensures transparent, bias-free matching</li>
            <li>Connect directly with employers once matched</li>
          </ul>
          <Link 
            href="/register-seeker" 
            className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg no-underline"
          >
            Register as Job Seeker
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">For Employers</h2>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>Post job openings with required skills and compensation</li>
            <li>Our algorithm matches you with qualified candidates</li>
            <li>Save time with algorithmic pre-screening</li>
            <li>Pay only for successful matches</li>
          </ul>
          <Link 
            href="/post-job" 
            className="block text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg no-underline"
          >
            Post a Job
          </Link>
        </div>
      </div>
      
      {/* <div className="mt-12 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Test Oyster API</h2>
        <p className="text-gray-600 mb-6">Test the Marlin Oyster CVM Llama API integration</p>
        
        <button
          onClick={testOysterAPI}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg mb-6"
        >
          {loading ? 'Calling API...' : 'Test Oyster API'}
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {apiResult && (
          <div className="bg-gray-50 border rounded-lg p-6 text-left">
            <h3 className="text-lg font-semibold mb-4">API Response:</h3>
            
            {apiResult.oysterSignature && (
              <div className="mb-4">
                <p className="font-medium text-purple-700">Oyster Signature:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                  {apiResult.oysterSignature}
                </p>
              </div>
            )}
            
            {apiResult.oysterTimestamp && (
              <div className="mb-4">
                <p className="font-medium text-purple-700">Oyster Timestamp:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {apiResult.oysterTimestamp}
                </p>
              </div>
            )}
            
            <div className="mb-4">
              <p className="font-medium text-green-700">LLM Response:</p>
              <div className="text-sm bg-green-50 p-4 rounded border max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{apiResult.response}</pre>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>Success: {apiResult.success ? 'Yes' : 'No'}</p>
              {apiResult.error && <p>Error: {apiResult.error}</p>}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-12 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Test Attestation & Verification</h2>
        <p className="text-gray-600 mb-6">Test the Oyster attestation and verification process</p>
        
        <button
          onClick={testAttestation}
          disabled={attestationLoading}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold py-3 px-6 rounded-lg mb-6"
        >
          {attestationLoading ? 'Processing...' : 'Test Attestation'}
        </button>

        {attestationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error:</p>
            <p>{attestationError}</p>
          </div>
        )}

        {attestationResult && (
          <div className="bg-gray-50 border rounded-lg p-6 text-left">
            <h3 className="text-lg font-semibold mb-4">Attestation Results:</h3>
            
            <div className="mb-4">
              <p className="font-medium text-orange-700">Success:</p>
              <p className={`text-sm font-mono p-2 rounded ${attestationResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {attestationResult.success ? 'Yes' : 'No'}
              </p>
            </div>

            {attestationResult.attestationSize && (
              <div className="mb-4">
                <p className="font-medium text-orange-700">Attestation Data Size:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {attestationResult.attestationSize} bytes
                </p>
              </div>
            )}

            {attestationResult.enclavePublicKey && (
              <div className="mb-4">
                <p className="font-medium text-orange-700">Enclave Public Key:</p>
                <p className="text-sm font-mono bg-green-100 p-2 rounded break-all">
                  {attestationResult.enclavePublicKey}
                </p>
              </div>
            )}
            
            {attestationResult.verificationResult && (
              <div className="mb-4">
                <p className="font-medium text-orange-700">Verification Result:</p>
                <div className="text-sm bg-blue-50 p-4 rounded border max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{attestationResult.verificationResult}</pre>
                </div>
              </div>
            )}

            {attestationResult.attestationIp && (
              <div className="mb-4">
                <p className="font-medium text-orange-700">Attestation IP:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {attestationResult.attestationIp}:1301
                </p>
              </div>
            )}

            {attestationResult.verificationIp && (
              <div className="mb-4">
                <p className="font-medium text-orange-700">Verification IP:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {attestationResult.verificationIp}:1400
                </p>
              </div>
            )}

            {attestationResult.responseHeaders && Object.keys(attestationResult.responseHeaders).length > 0 && (
              <div className="mb-4">
                <p className="font-medium text-orange-700">Response Headers:</p>
                <div className="text-xs bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
                  {Object.entries(attestationResult.responseHeaders).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <span className="font-semibold">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              <p>{attestationResult.message}</p>
              {attestationResult.error && <p>Error: {attestationResult.error}</p>}
            </div>
          </div>
        )}
      </div> */}
      
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="bg-slate-100 p-4 rounded-lg max-w-xs mb-10">
            <div className="font-bold text-xl bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">1</div>
            <h3 className="font-medium mb-2">Register</h3>
            <p>Create a profile or post a job using your Ethereum wallet&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
          </div>
            <div className="bg-slate-100 p-4 rounded-lg max-w-xs">
            <div className="font-bold text-xl bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">2</div>
            <h3 className="font-medium mb-2">Smart Matching</h3>
            <p>Choose between O(n²) algorithm or AI-powered matching using Llama 3.2 for optimal results</p>
            </div>
            <div className="w-4" /> {/* Spacer */}
            <div className="bg-slate-100 p-4 rounded-lg max-w-xs">
            <div className="font-bold text-xl bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">3</div>
            <h3 className="font-medium mb-2">Connect</h3>
            <p>Review your matches and connect with candidates or employers directly</p>
            </div>
        </div>
      </div>
    </div>
  );
} 