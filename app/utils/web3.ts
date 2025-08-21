import { ethers } from 'ethers';
import JobMarketplaceABI from './JobMarketplaceABI.json';
import EnclaveResponseVerifierABI from './EnclaveResponseVerifier.json';

// The contract address will be set after deployment
//let contractAddress = '0xdE84fdD72B0502dbBC1070bC9A6eB78CC51d7b61';
let contractAddress = '0x172e19E8959E7D3D325fe70A6A0a1b2667931977';

// EnclaveResponseVerifier contract address
const enclaveVerifierAddress = '0xBe4784F8c75949c7D543FaE2995061B853BfbAeD';

// Function to set contract address after deployment
export const setContractAddress = (address: string) => {
  contractAddress = address;
};

// Function to get provider
export const getProvider = () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
};

// Function to get signer
export const getSigner = async () => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    const signer = await provider.getSigner();
    return signer;
  } catch (error) {
    console.error("Error getting signer:", error);
    return null;
  }
};

// Function to get contract instance
export const getContract = async (withSigner = true) => {
  if (!contractAddress) {
    console.error("Contract address not set");
    return null;
  }

  try {
    if (withSigner) {
      const signer = await getSigner();
      if (!signer) return null;
      return new ethers.Contract(contractAddress, JobMarketplaceABI.abi, signer);
    } else {
      const provider = getProvider();
      if (!provider) return null;
      return new ethers.Contract(contractAddress, JobMarketplaceABI.abi, provider);
    }
  } catch (error) {
    console.error("Error getting contract:", error);
    return null;
  }
};

// Function to connect wallet
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      return { success: true, address };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      return { success: false, error };
    }
  } else {
    return { success: false, error: "MetaMask not installed" };
  }
};

// Function to get EnclaveResponseVerifier contract instance
export const getEnclaveVerifierContract = async (withSigner = false) => {
  try {
    if (withSigner) {
      const signer = await getSigner();
      if (!signer) return null;
      return new ethers.Contract(enclaveVerifierAddress, EnclaveResponseVerifierABI, signer);
    } else {
      const provider = getProvider();
      if (!provider) return null;
      return new ethers.Contract(enclaveVerifierAddress, EnclaveResponseVerifierABI, provider);
    }
  } catch (error) {
    console.error("Error getting EnclaveResponseVerifier contract:", error);
    return null;
  }
};

// Function to verify enclave response
export const verifyEnclaveResponse = async (
  receiptData: string | Uint8Array,
  timestamp: number | bigint,
  signature: string | Uint8Array,
  enclavePubKey: string | Uint8Array
) => {
  try {
    console.log('=== Verifying Enclave Response ===');
    console.log('Receipt Data:', receiptData);
    console.log('Timestamp:', timestamp);
    console.log('Signature:', signature);
    console.log('Enclave Public Key:', enclavePubKey);
    
    // Get contract instance (read-only, no signer needed for pure functions)
    const contract = await getEnclaveVerifierContract(false);
    if (!contract) {
      console.error("Failed to get EnclaveResponseVerifier contract instance");
      return false;
    }

    // Call the verifyEnclaveResponse function
    console.log('Calling contract function with:');
    console.log('- Receipt Data:', typeof receiptData, receiptData);
    console.log('- Timestamp:', typeof timestamp, timestamp.toString());
    console.log('- Signature:', typeof signature, signature);
    console.log('- Enclave PubKey:', typeof enclavePubKey, enclavePubKey);
    
    const result = await contract.verifyEnclaveResponse(
      receiptData,
      timestamp,
      signature,
      enclavePubKey
    );

    console.log('=== Verification Result ===');
    console.log('Is Valid:', result);
    console.log('Contract Address:', enclaveVerifierAddress);
    console.log('================================');

    return result;
  } catch (error) {
    console.error("Error verifying enclave response:", error);
    console.log('=== Verification Failed ===');
    console.log('Error:', error);
    console.log('================================');
    return false;
  }
};

// Add TypeScript types for window
declare global {
  interface Window {
    ethereum: any;
  }
}

// Utility function to fetch all active jobs from contract
export const getAllActiveJobs = async () => {
  try {
    const contract = await getContract(false);
    if (!contract) {
      console.error("Contract not available");
      return [];
    }

    const jobs = [];
    let jobId = 1;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5; // Stop after 5 consecutive errors

    console.log("Fetching all active jobs from contract...");
    
    // Try to fetch jobs up to ID 100 (reasonable limit)
    while (jobId <= 20 && consecutiveErrors < maxConsecutiveErrors) {
      try {
        console.log(`Trying to fetch job ID: ${jobId}`);
        const jobData = await contract.getJobPosting(jobId);
        
        console.log(`Job ${jobId} found:`, {
          title: jobData.title,
          isActive: jobData.isActive,
          employer: jobData.employer
        });
        
        if (jobData.isActive) {
          jobs.push({
            id: jobId,
            employer: jobData.employer,
            title: jobData.title,
            description: jobData.description,
            requiredSkills: jobData.requiredSkills,
            location: jobData.location,
            salary: Number(jobData.salary),
            isActive: jobData.isActive
          });
          console.log(`Added active job: ${jobData.title}`);
        } else {
          console.log(`Job ${jobId} is inactive, skipping`);
        }
        
        consecutiveErrors = 0; // Reset error count on success
        jobId++;
      } catch(error: any) {
        console.log(`Job ID ${jobId} not found or error:`, error?.message || error);
        consecutiveErrors++;
        jobId++;
        
        // If we hit too many consecutive errors, likely no more jobs exist
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.log(`Stopping after ${maxConsecutiveErrors} consecutive errors`);
          break;
        }
      }
    }
    
    console.log(`Fetched ${jobs.length} active jobs from contract`);
    return jobs;
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    return [];
  }
};

// Utility function to fetch all active candidates from contract
export const getAllActiveCandidates = async () => {
  try {
    const contract = await getContract(false);
    if (!contract) {
      console.error("Contract not available");
      return [];
    }

    const candidates = [];
    let seekerId = 1;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5; // Stop after 5 consecutive errors

    console.log("Fetching all active candidates from contract...");
    
    // Try to fetch candidates up to ID 100 (reasonable limit)
    while (seekerId <= 20 && consecutiveErrors < maxConsecutiveErrors) {
      try {
        console.log(`Trying to fetch candidate ID: ${seekerId}`);
        const seekerData = await contract.getSeekerProfile(seekerId);
        
        console.log(`Candidate ${seekerId} found:`, {
          name: seekerData.name,
          isActive: seekerData.isActive,
          location: seekerData.location
        });
        
        if (seekerData.isActive) {
          candidates.push({
            id: seekerId,
            user: '', // Not returned by getSeekerProfile
            name: seekerData.name,
            skills: seekerData.skills,
            location: seekerData.location,
            expectedSalary: Number(seekerData.expectedSalary),
            isActive: seekerData.isActive
          });
          console.log(`Added active candidate: ${seekerData.name}`);
        } else {
          console.log(`Candidate ${seekerId} is inactive, skipping`);
        }
        
        consecutiveErrors = 0; // Reset error count on success
        seekerId++;
      } catch (error: any) {
        console.log(`Candidate ID ${seekerId} not found or error:`, error?.message || error);
        consecutiveErrors++;
        seekerId++;
        
        // If we hit too many consecutive errors, likely no more candidates exist
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.log(`Stopping after ${maxConsecutiveErrors} consecutive errors`);
          break;
        }
      }
    }
    
    console.log(`Fetched ${candidates.length} active candidates from contract`);
    return candidates;
  } catch (error) {
    console.error("Error fetching all candidates:", error);
    return [];
  }
}; 
