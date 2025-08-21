# Decentralized Job Marketplace with AI-Powered Matching & Enclave Verification

A comprehensive blockchain-based job marketplace that implements both traditional O(n²) matching and advanced AI-powered matching using Llama 3.2 with Marlin Oyster CVM for secure, verifiable AI computations. The platform connects job seekers with employers through intelligent analysis and cryptographic verification.

## 🚀 Key Features

### Core Functionality
- **Smart Contract-Based**: Decentralized job postings and candidate profiles on Ethereum
- **Dual Matching Algorithms**: Traditional rule-based O(n²) and AI-powered intelligent matching
- **Wallet Integration**: Seamless MetaMask connectivity for secure transactions
- **Modern UI**: Next.js TypeScript frontend with responsive Tailwind CSS design

### AI-Powered Matching System
- **Llama 3.2 Integration**: Advanced language model for intelligent candidate-job analysis
- **Marlin Oyster CVM**: Secure, verifiable AI computations with cryptographic proofs
- **Enclave Verification**: On-chain verification of AI responses using smart contracts
- **Detailed Analysis**: Comprehensive reasoning and candidate evaluation beyond simple scoring

### Advanced Features
- **Job Detail Pages**: Individual job viewing with complete information
- **Skill Extraction**: AI-powered skill extraction from job descriptions and resumes
- **Real-time Verification**: Live verification of AI responses with signature validation
- **Attestation System**: Cryptographic attestation for AI computation integrity
- **Header Extraction**: Oyster signature and timestamp capture for verification

## 🏗️ Project Architecture

```
AI-Job-Matching-DApp/
├── Contracts/
│   ├── JobMarketplace.sol          # Main contract with O(n²) matching
│   └── LlamaResponseVerify.sol     # Enclave verification contract
├── app/
│   ├── api/
│   │   ├── ai-candidates/          # AI matching endpoint
│   │   ├── attestation/            # Attestation API
│   │   ├── generate/               # LLM generation API
│   │   └── oyster/                 # Direct Oyster API proxy
│   ├── components/
│   │   └── Header.tsx              # Navigation component
│   ├── deploy/                     # Verification testing page
│   ├── jobs/
│   │   ├── page.tsx               # Job listing page
│   │   └── [id]/page.tsx          # Individual job details
│   ├── matches/                    # Dual algorithm matching page
│   ├── post-job/                   # Job posting interface
│   ├── register-seeker/            # Job seeker registration
│   ├── setup/                      # Contract setup page
│   └── utils/
│       ├── contractHelper.ts       # Contract interaction utilities
│       ├── llmService.ts          # AI and verification services
│       └── web3.ts                # Ethereum integration
└── public/                        # Static assets
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask extension installed in your browser

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd AI-job-Matching-dApp/
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

5. On first use, you'll be asked to enter the contract address from the deployment step. Enter the address and connect your MetaMask.

## 🎯 Using the Application

### As an Employer

1. **Connect Wallet**: Connect your Ethereum wallet (MetaMask)
2. **Post Jobs**: Navigate to "Post a Job" and fill in details
   - Job title, description, and requirements
   - Required skills (with AI-powered skill extraction)
   - Location and salary information
3. **Browse Applications**: View candidate matches through the AI matching system
4. **Track Verification**: See cryptographic proofs of AI analysis integrity

### As a Job Seeker

1. **Connect Wallet**: Connect your Ethereum wallet (MetaMask)
2. **Create Profile**: Navigate to "Register as Job Seeker"
   - Personal information and skills
   - AI-powered skill extraction from resume text
   - Location and salary expectations
3. **Browse Jobs**: View all available positions with detailed job pages
4. **Get Matched**: Benefit from both traditional and AI-powered matching

### Job Browsing & Details

1. **Browse All Jobs**: Navigate to "Browse Jobs" to see all active positions
2. **View Details**: Click "View Details" on any job for comprehensive information
3. **Smart Filtering**: Jobs are automatically filtered to show only active positions
4. **Real-time Updates**: Job information is fetched directly from the blockchain

### Advanced Matching & Verification

1. **Navigate to Matches**: Go to "View Matches" page
2. **Choose Algorithm**:
   - **Traditional O(n²)**: Fast, rule-based matching with on-chain storage
   - **AI-Powered**: Intelligent analysis with Llama 3.2 and cryptographic verification
3. **AI Matching Process**:
   - System calls Llama 3.2 model via Marlin Oyster CVM
   - Captures Oyster signatures and timestamps
   - Performs enclave attestation for public key verification
   - Verifies AI responses on-chain using smart contracts
4. **View Results**: 
   - Traditional matches show scores and basic reasoning
   - AI matches include detailed evaluation and verification status
5. **Verification Status**: See cryptographic proof of AI computation integrity

### Testing Enclave Verification

1. **Deploy Page**: Navigate to "Deploy on Oyster" for verification testing
2. **Test Known Values**: Uses hardcoded working values to verify contract functionality
3. **Debug Tools**: Comprehensive logging for troubleshooting verification issues

## 🔍 Matching Algorithms

### Traditional O(n²) Algorithm
- Compares each job with each candidate systematically
- Calculates scores based on:
  - Skills matching (50% of total score) - exact string matching
  - Location matching (30% of score) - exact location match
  - Salary matching (20% of score) - salary range compatibility
- Fast and deterministic results
- Stored on-chain in smart contract

### AI-Powered Matching (Enhanced)
- Uses Llama 3.2 LLM running on Marlin Oyster CVM
- Intelligently analyzes job descriptions and candidate profiles
- Considers context, synonyms, and semantic relationships
- Provides detailed reasoning for each match
- Offers comprehensive candidate evaluations on demand
- Scores candidates holistically beyond simple rule matching
- **NEW**: Cryptographic verification of AI responses
- **NEW**: On-chain verification using enclave signatures

## 🔐 Enclave Verification System

### How It Works
1. **AI Computation**: Llama 3.2 processes job-candidate matching in secure enclave
2. **Signature Capture**: Oyster headers (signature + timestamp) are captured from AI responses
3. **Attestation**: System performs cryptographic attestation to get enclave public key
4. **Receipt Creation**: ABI-encoded receipt data combines prompt, response, and context
5. **On-Chain Verification**: Smart contract verifies the signature using the enclave public key

### Verification Components
- **Oyster Headers**: `x-oyster-signature` and `x-oyster-timestamp` from AI responses
- **Receipt Data**: ABI-encoded data containing model, prompt, context, response, and tokenization
- **Enclave Public Key**: Retrieved through attestation process
- **Smart Contract**: `LlamaResponseVerify.sol` contract performs cryptographic verification

## 🛠️ Development

### Smart Contract Architecture

#### JobMarketplace.sol
- **Main Functions**: Job posting, candidate registration, O(n²) matching
- **Matching Algorithm**: `calculateMatches()` function implements traditional scoring
- **Score Calculation**: Skills (50%), location (30%), salary (20%)
- **Data Storage**: On-chain storage of jobs, candidates, and match results

#### LlamaResponseVerify.sol (EnclaveResponseVerifier)
- **Verification Function**: `verifyEnclaveResponse()` validates AI computation signatures
- **Cryptographic Verification**: Uses ECDSA signature verification
- **Receipt Validation**: Validates ABI-encoded receipt data format
- **Integration**: Works with Marlin Oyster CVM verification system

### Frontend Architecture
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Blockchain**: ethers.js for Ethereum integration
- **State Management**: React hooks for component state
- **API Routes**: Server-side API endpoints for AI and verification services

### LLM Integration and AI Matching

#### Setup Requirements
1. Copy `env.example` to `.env.local`
2. Set `NEXT_PUBLIC_LLAMA_INSTANCE_IP` to your Llama instance IP
3. Ensure Marlin Oyster CVM is properly configured
4. Deploy both JobMarketplace and EnclaveResponseVerifier contracts

#### Available AI Features
1. **Skill Extraction**: Extract skills from job descriptions and resumes
2. **AI-Powered Matching**: Intelligent candidate-job matching with reasoning
3. **Detailed Evaluation**: Comprehensive analysis beyond simple scoring
4. **Cryptographic Verification**: On-chain verification of AI computations
5. **Oyster Integration**: Secure and verifiable AI computations

#### Example API Calls

**Basic LLM Query:**
```bash
curl http://{{instance-ip}}:5000/api/generate -d '{
  "model": "llama3.2",
  "prompt":"What is Ethereum?"
}'
```

**AI Candidate Matching:**
```javascript
// Via frontend API with verification
const result = await fetch('/api/ai-candidates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobs: jobsArray, candidates: candidatesArray })
});

// Result includes matches and verification data
const { matches, verificationData } = await result.json();
```

**Enclave Verification:**
```javascript
// Verify AI response on-chain
const verified = await verifyEnclaveResponse(
  receiptData,    // ABI-encoded receipt
  timestamp,      // Oyster timestamp
  signature,      // Oyster signature
  enclavePublicKey // From attestation
);
```

## 🚀 Deployment

### Contract Deployment
1. Deploy `JobMarketplace.sol` to your target network
2. Deploy `LlamaResponseVerify.sol` for enclave verification
3. Update contract addresses in `web3.ts`
4. Set up Marlin Oyster CVM instance

### Frontend Deployment
1. Configure environment variables
2. Build the Next.js application: `npm run build`
3. Deploy to your preferred hosting platform
4. Ensure MetaMask connectivity for users

## 🔧 Configuration

### Environment Variables
```bash
NEXT_PUBLIC_LLAMA_INSTANCE_IP=your-llama-instance-ip
NEXT_PUBLIC_CONTRACT_ADDRESS=your-contract-address
NEXT_PUBLIC_VERIFIER_CONTRACT=your-verifier-address
```

### Network Configuration
- Ensure MetaMask is connected to the correct network
- Contract addresses must match deployed instances
- RPC endpoints should be properly configured

## 🏆 Key Innovations

1. **Dual Algorithm Approach**: Traditional + AI matching for comprehensive coverage
2. **Cryptographic Verification**: On-chain verification of AI computations
3. **Marlin Oyster Integration**: Secure enclave computations with proof generation
4. **Comprehensive Analysis**: Beyond simple scoring to detailed candidate evaluation
5. **Real-time Verification**: Live verification of AI responses with signature validation
6. **Modular Architecture**: Separate contracts for core functionality and verification

