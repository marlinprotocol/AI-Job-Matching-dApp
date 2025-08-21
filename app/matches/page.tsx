'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContract, getAllActiveJobs, getAllActiveCandidates, getEnclaveVerifierContract } from '../utils/web3';
import { findBestCandidatesWithAI, performAttestation } from '../utils/llmService';

interface Match {
  jobId: number;
  seekerId: number;
  score: number;
  jobTitle?: string;
  seekerName?: string;
}

interface AIMatch extends Match {
  reasoning: string;
  detailedEvaluation?: string;
  verificationResult?: string;
  verificationData?: {
    prompt?: string;
    response?: string;
    context?: string;
    oysterSignature?: string;
    oysterTimestamp?: string;
    enclavePublicKey?: string;
  };
}

interface JobPosting {
  id: number;
  employer: string;
  title: string;
  description: string;
  requiredSkills: string[];
  location: string;
  salary: number;
  isActive: boolean;
}

interface JobSeeker {
  id: number;
  user: string;
  name: string;
  skills: string[];
  location: string;
  expectedSalary: number;
  isActive: boolean;
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [aiMatches, setAiMatches] = useState<AIMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [aiCalculating, setAiCalculating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'traditional' | 'ai'>('traditional');
  const [selectedMatch, setSelectedMatch] = useState<AIMatch | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get contract instance
      const contract = await getContract(false);
      if (!contract) {
        throw new Error("Failed to get contract instance.");
      }

      // Get all matches
      const matchesData = await contract.getAllMatches();
      
      // Format matches
      const formattedMatches = await Promise.all(
        matchesData.map(async (match: any) => {
          const jobId = Number(match.jobId);
          const seekerId = Number(match.seekerId);
          
          // Fetch additional details
          let jobTitle = '';
          let seekerName = '';
          
          try {
            const jobData = await contract.getJobPosting(jobId);
            jobTitle = jobData.title;
          } catch (err) {
            console.error(`Error fetching job ${jobId}:`, err);
          }
          
          try {
            const seekerData = await contract.getSeekerProfile(seekerId);
            seekerName = seekerData.name;
          } catch (err) {
            console.error(`Error fetching seeker ${seekerId}:`, err);
          }
          
          return {
            jobId,
            seekerId,
            score: Number(match.score),
            jobTitle,
            seekerName
          };
        })
      );
      
      setMatches(formattedMatches);
      
    } catch (err: any) {
      console.error("Error fetching matches:", err);
      setError(err.message || "Failed to load matches.");
    } finally {
      setLoading(false);
    }
  };

  const runMatchingAlgorithm = async () => {
    try {
      setCalculating(true);
      setError('');
      
      // Get contract instance with signer
      const contract = await getContract(true);
      if (!contract) {
        throw new Error("Failed to get contract instance. Make sure your wallet is connected.");
      }

      // Run the O(n²) matching algorithm
      const tx = await contract.calculateMatches();
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Fetch updated matches
      await fetchMatches();
      
    } catch (err: any) {
      console.error("Error running matching algorithm:", err);
      setError(err.message || "Failed to run matching algorithm.");
    } finally {
      setCalculating(false);
    }
  };

  const runAIMatching = async () => {
    try {
      setAiCalculating(true);
      setError('');
      
      console.log('=== Starting AI Matching ===');
      
      // Fetch all jobs and candidates from contract using utility functions
      console.log('Fetching jobs and candidates...');
      const jobs = await getAllActiveJobs();
      const candidates = await getAllActiveCandidates();

      console.log('Jobs fetched:', jobs.length, jobs);
      console.log('Candidates fetched:', candidates.length, candidates);

      if (jobs.length === 0 || candidates.length === 0) {
        throw new Error("No active jobs or candidates found for AI matching.");
      }

      // Run AI matching
      console.log('Running AI matching...');
      const aiResult = await findBestCandidatesWithAI(jobs, candidates);
      
      console.log('AI Result:', aiResult);
      
      if (!aiResult.success) {
        throw new Error(aiResult.error || "AI matching failed");
      }

      console.log('Setting AI matches:', aiResult.matches);
      setAiMatches(aiResult.matches);
      
      // If we have verification data, call the verification function
      if (aiResult.verificationData && 
          aiResult.verificationData.prompt && 
          aiResult.verificationData.response &&
          aiResult.verificationData.oysterSignature &&
          aiResult.verificationData.oysterTimestamp) {
        console.log('Performing enclave verification...');
        try {
          // First, get the enclave public key from attestation
          console.log('Getting enclave public key from attestation...');
          const attestationResult = await performAttestation();
          
          if (!attestationResult.success || !attestationResult.enclavePublicKey) {
            throw new Error('Failed to get enclave public key from attestation');
          }
          
          console.log('Enclave public key obtained:', attestationResult.enclavePublicKey);
          
          const verifyContract = await getEnclaveVerifierContract(false);
          if (!verifyContract) {
            throw new Error('Contract not available for verification');
          }
          
          const { ethers } = await import('ethers');

          console.log('=== VERIFICATION DEBUG START ===');
          console.log('Raw verification data:');
          console.log('- Raw Signature:', aiResult.verificationData.oysterSignature);
          console.log('- Raw Timestamp:', aiResult.verificationData.oysterTimestamp);
          console.log('- Raw Enclave Key:', attestationResult.enclavePublicKey);
          
          // Check if values are valid
          if (!aiResult.verificationData.oysterSignature) {
            throw new Error('Missing oyster signature');
          }
          if (!aiResult.verificationData.oysterTimestamp) {
            throw new Error('Missing oyster timestamp');
          }
          if (!attestationResult.enclavePublicKey) {
            throw new Error('Missing enclave public key');
          }

          console.log('Original prompt length:', aiResult.verificationData.prompt.length);
          console.log('Original response length:', aiResult.verificationData.response.length);
          console.log('Original context:', aiResult.verificationData.context);
          console.log('Context type:', typeof aiResult.verificationData.context);
          
          // Use the original prompt and response from AI
          const originalPrompt = aiResult.verificationData.prompt;
          const originalResponse = aiResult.verificationData.response;
          
          // Handle context properly - ensure it's in the right format
          let contextValue = aiResult.verificationData.context;
          
          // If context is empty, undefined, or not in expected format, use empty array
          if (!contextValue || contextValue === '' || contextValue === 'undefined' || contextValue === null) {
            contextValue = '[]';
            console.log('Using fallback context value: []');
          } else if (typeof contextValue === 'object') {
            // If it's an object/array, stringify it
            contextValue = JSON.stringify(contextValue);
            console.log('Stringified context object');
          }
          
          console.log('Using values for encoding:');
          console.log('- Prompt (first 100 chars):', originalPrompt.substring(0, 100));
          console.log('- Response (first 100 chars):', originalResponse.substring(0, 100));
          console.log('- Context value:', contextValue);
          
          // Encode the receipt data using ABI encoder - same format as deploy/page.tsx
          const receiptData = ethers.AbiCoder.defaultAbiCoder().encode(
            ['string', 'string', 'string', 'string', 'string'],
            [
              'llama3.2',
              originalPrompt,
              '[]',
              originalResponse,
              contextValue
            ]
          );
          
          console.log('Encoded receipt data:');
          console.log('- Length:', receiptData.length);
          console.log('- First 200 chars:', receiptData.substring(0, 200));
          console.log('receiptData:', receiptData);
          
          // Use real signature and timestamp from AI response
          const signature = aiResult.verificationData.oysterSignature && aiResult.verificationData.oysterSignature.startsWith('0x') 
            ? aiResult.verificationData.oysterSignature 
            : `0x${aiResult.verificationData.oysterSignature || ''}`;
            
          const enclavePubKey = attestationResult.enclavePublicKey.startsWith('0x')
            ? attestationResult.enclavePublicKey
            : `0x${attestationResult.enclavePublicKey}`;
          
          const timestamp = BigInt(aiResult.verificationData.oysterTimestamp || '0');
          
          console.log('Using real AI data for verification:');
          console.log('- Signature:', signature);
          console.log('- Timestamp:', timestamp.toString());
          console.log('- Enclave Key:', enclavePubKey);
          
          console.log('Final parameters for verification:');
          console.log('- Receipt data type:', typeof receiptData);
          console.log('- Timestamp type:', typeof timestamp, 'value:', timestamp.toString());
          console.log('- Signature type:', typeof signature, 'length:', signature.length);
          console.log('- Enclave key type:', typeof enclavePubKey, 'length:', enclavePubKey.length);
          
          console.log('Calling contract verifyEnclaveResponse...');
          const verificationResult = await verifyContract.verifyEnclaveResponse(
            receiptData,
            timestamp,
            signature,
            enclavePubKey
          );
          
          console.log('Contract verification result:', verificationResult);
          console.log('Result type:', typeof verificationResult);
          console.log('=== VERIFICATION DEBUG END ===');
          console.log('Result type:', typeof verificationResult);
          console.log('=== VERIFICATION DEBUG END ===');
          
          // Update the AI matches with verification info
          setAiMatches(prev => prev.map(match => ({
            ...match,
            verificationResult: verificationResult.toString(),
            verificationData: {
              ...aiResult.verificationData,
              enclavePublicKey: enclavePubKey,
              usedSignature: signature,
              usedTimestamp: timestamp.toString()
            }
          })));
          
        } catch (verifyError: any) {
          console.error('Verification error:', verifyError);
          // Don't fail the whole process if verification fails
          setAiMatches(prev => prev.map(match => ({
            ...match,
            verificationResult: `Verification failed: ${verifyError?.message || 'Unknown error'}`,
            verificationData: aiResult.verificationData
          })));
        }
      }
      
    } catch (err: any) {
      console.error("Error running AI matching:", err);
      setError(err.message || "Failed to run AI matching algorithm.");
    } finally {
      setAiCalculating(false);
    }
  };

  const handleEvaluateMatch = async (match: AIMatch) => {
    setSelectedMatch(match);
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Matching System</h1>
        <div className="flex gap-3">
          <button 
            onClick={runMatchingAlgorithm}
            disabled={calculating}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {calculating ? 'Calculating...' : 'Run O(n²) Algorithm'}
          </button>
          <button 
            onClick={runAIMatching}
            disabled={aiCalculating}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {aiCalculating ? 'AI Analyzing...' : 'Run AI Matching'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('traditional')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'traditional'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Traditional O(n²) Matching ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-2 px-4 font-medium ${
            activeTab === 'ai'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          AI-Powered Matching ({aiMatches.length})
        </button>
      </div>

      {/* Traditional Matching Tab */}
      {activeTab === 'traditional' && (
        <div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-medium mb-2">O(n²) Matching Algorithm</h2>
            <p>
              This algorithm compares each job with each candidate, calculating a match score 
              based on skills (50%), location (30%), and salary (20%). Higher scores indicate better matches.
            </p>
          </div>
          
          {matches.length === 0 ? (
            <div className="bg-gray-100 p-6 rounded text-center">
              <p className="text-lg">No traditional matches found</p>
              <p className="mt-2">
                Add more jobs and candidates, then run the matching algorithm to find matches.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border-b text-left">Match Score</th>
                    <th className="py-3 px-4 border-b text-left">Job Role</th>
                    <th className="py-3 px-4 border-b text-left">Candidate Name</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">
                        <div className="flex items-center">
                          <span className={`text-lg font-bold ${
                            match.score >= 70 ? 'text-green-600' : 
                            match.score >= 40 ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {match.score}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        {match.jobTitle || `Job #${match.jobId}`}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {match.seekerName || `Candidate #${match.seekerId}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AI Matching Tab */}
      {activeTab === 'ai' && (
        <div>
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-medium mb-2">🤖 AI-Powered Matching</h2>
            <p>
              Uses Llama 3.2 model to intelligently analyze job requirements and candidate profiles. 
              The AI considers technical skills, experience fit, location, salary expectations, and provides 
              detailed reasoning for each match.
            </p>
          </div>
          
          {aiMatches.length === 0 ? (
            <div className="bg-gray-100 p-6 rounded text-center">
              <p className="text-lg">No AI matches found</p>
              <p className="mt-2">
                Run the AI matching algorithm to get intelligent candidate recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiMatches.map((match, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{match.jobTitle}</h3>
                          <p className="text-gray-600">{match.seekerName}</p>
                        </div>
                        {match.verificationResult && (
                          <div className="ml-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Enclave Verified
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded italic">
                        "{match.reasoning}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleEvaluateMatch(match)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Evaluation Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">AI Analysis Details</h2>
                  <p className="text-gray-600">
                    Complete AI response and verification status
                  </p>
                  {selectedMatch.verificationResult && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✓ Enclave Verified Response
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="prose max-w-none">
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <h3 className="font-semibold">AI Assessment Summary:</h3>
                  <p className="italic">"{selectedMatch.reasoning}"</p>
                </div>
                
                {selectedMatch.verificationData && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
                    <h3 className="font-semibold mb-3">🔒 Enclave Verification Data:</h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Verification Result:</span>
                        <span className="ml-2 text-green-600">
                          {selectedMatch.verificationResult || 'Processing...'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Oyster Signature:</span>
                        <span className="ml-2 font-mono text-xs break-all">
                          {selectedMatch.verificationData.oysterSignature || 'Not available'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Oyster Timestamp:</span>
                        <span className="ml-2">
                          {selectedMatch.verificationData.oysterTimestamp || 'Not available'}
                        </span>
                      </div>
                      {selectedMatch.verificationData.enclavePublicKey && (
                        <div>
                          <span className="font-medium">Enclave Public Key:</span>
                          <span className="ml-2 font-mono text-xs break-all">
                            {selectedMatch.verificationData.enclavePublicKey}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedMatch.detailedEvaluation && (
                  <div className="bg-white border p-4 rounded">
                    <h3 className="font-semibold mb-3">Complete AI Response:</h3>
                    <div className="whitespace-pre-wrap text-gray-700 font-mono text-sm bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
                      {selectedMatch.detailedEvaluation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 