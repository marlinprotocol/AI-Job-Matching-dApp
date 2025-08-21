# AI Job Matching - Demo Guide

This guide helps you test the new AI-powered job matching feature.

## Quick Test Setup

### 1. Deploy and Setup Contract
- Follow the README to deploy the smart contract
- Connect your wallet and set the contract address

### 2. Create Sample Data

**Sample Job Posting:**
- Title: "Senior Full Stack Developer"
- Description: "We're looking for an experienced developer with React, Node.js, and Python experience. Must be familiar with cloud technologies like AWS and have experience with microservices architecture."
- Skills: React, Node.js, Python, AWS, Microservices
- Location: "San Francisco"
- Salary: $120,000

**Sample Candidate Profile:**
- Name: "Alice Johnson"
- Skills: React, JavaScript, Node.js, Python, Docker, AWS
- Location: "San Francisco"
- Expected Salary: $110,000

### 3. Test Both Matching Systems

1. **Traditional O(n²) Matching:**
   - Go to "View Matches" page
   - Click "Run O(n²) Algorithm"
   - See rule-based scoring

2. **AI-Powered Matching:**
   - Click "Run AI Matching"
   - See intelligent analysis with reasoning
   - Click "Detailed Analysis" for comprehensive evaluation

## Expected AI Behavior

The AI should:
- Recognize semantic relationships (React + JavaScript)
- Consider experience level from descriptions
- Evaluate location and salary compatibility
- Provide detailed reasoning for each match
- Offer comprehensive candidate evaluations

## Features to Test

- [ ] AI matches with reasoning
- [ ] Detailed candidate evaluations
- [ ] Comparison with traditional matching
- [ ] Error handling for no matches
- [ ] Modal with detailed analysis
- [ ] Tab switching between algorithms

## Troubleshooting

If AI matching fails:
1. Check console for API errors
2. Verify Llama instance is running
3. Ensure jobs and candidates exist in contract
4. Check environment variables are set

The AI system gracefully falls back to basic scoring if parsing fails.
