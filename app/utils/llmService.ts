/**
 * LLM service to interact with Marlin Oyster CVM's Llama model
 */

interface LlamaGenerateResponse {
  response: string;
  success: boolean;
  error?: string;
}

interface OysterApiResponse extends LlamaGenerateResponse {
  oysterSignature?: string;
  oysterTimestamp?: string;
}

interface AttestationResponse {
  success: boolean;
  attestationSize?: number;
  verificationResult?: string;
  enclavePublicKey?: string;
  responseHeaders?: Record<string, string>;
  attestationIp?: string;
  verificationIp?: string;
  message?: string;
  error?: string;
}

/**
 * Extract skills from a job description using Llama LLM
 * @param jobDescription - The job description text
 * @returns An object with the LLM response containing extracted skills
 */
export async function extractSkillsFromDescription(jobDescription: string): Promise<LlamaGenerateResponse> {
  try {
    const prompt = `Analyze the following job description and extract only the technical skills, technologies, frameworks, programming languages, and tools mentioned or required.

Your response should ONLY contain the extracted skills as a comma-separated list with no additional text, explanations, or formatting.

For example, a good response would be: "JavaScript, React, Node.js, TypeScript, Git, AWS"

Job Description:
${jobDescription}`;
    
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    let skillsText = data.response || data.generated_text || "";
      // Clean up the response to ensure it's just a comma-separated list
    // Remove any leading/trailing text that's not part of the skills list
    skillsText = skillsText.replace(/^.*?(?=[\w])/, ''); // Remove text before first word
    skillsText = skillsText.replace(/[.:](?:\s*$|\s*\n.*$)/, ''); // Remove trailing periods or any text after
    
    return {
      response: skillsText.trim(),
      success: true
    };
  } catch (error: any) {
    console.error("Error extracting skills:", error);
    return {
      response: "",
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate a job description from a list of skills using Llama LLM
 * @param skills - Comma-separated list of skills
 * @param jobTitle - Optional job title to provide context
 * @returns An object with the LLM response containing generated job description
 */
export async function generateJobDescriptionFromSkills(skills: string, jobTitle?: string): Promise<LlamaGenerateResponse> {
  try {
    const titleContext = jobTitle ? `for a ${jobTitle} position` : "";
    
    const prompt = `Create a comprehensive job description ${titleContext} that requires the following skills and technologies: ${skills}

Your response should be a well-structured job description that includes:
- Key responsibilities
- Required qualifications
- Technical requirements
- What the candidate will work on

Make it professional and detailed, focusing on how these skills will be used in the role.

Skills: ${skills}`;
    
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const jobDescription = data.response || data.generated_text || "";
    
    return {
      response: jobDescription.trim(),
      success: true
    };
  } catch (error: any) {
    console.error("Error generating job description:", error);
    return {
      response: "",
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract skills from a resume using Llama LLM
 * @param resume - The resume text content
 * @returns An object with the LLM response containing extracted skills
 */
export async function extractSkillsFromResume(resume: string): Promise<LlamaGenerateResponse> {
  try {
    const prompt = `Analyze the following resume and extract all relevant technical skills, programming languages, frameworks, libraries, tools, technologies, certifications, and professional competencies mentioned.

Your response should ONLY contain the extracted skills as a comma-separated list with no additional text, explanations, or formatting.

Include:
- Programming languages (e.g., JavaScript, Python, Java)
- Frameworks and libraries (e.g., React, Angular, Django)
- Tools and platforms (e.g., Git, Docker, AWS)
- Databases (e.g., MySQL, MongoDB, PostgreSQL)
- Methodologies (e.g., Agile, Scrum)
- Certifications and qualifications
- Soft skills if clearly mentioned

For example, a good response would be: "JavaScript, React, Node.js, Python, AWS, Git, MySQL, Agile, Project Management"

Resume:
${resume}`;
    
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    let skillsText = data.response || data.generated_text || "";
    
    // Clean up the response to ensure it's just a comma-separated list
    // Remove any leading/trailing text that's not part of the skills list
    skillsText = skillsText.replace(/^.*?(?=[\w])/, ''); // Remove text before first word
    skillsText = skillsText.replace(/[.:](?:\s*$|\s*\n.*$)/, ''); // Remove trailing periods or any text after
    
    return {
      response: skillsText.trim(),
      success: true
    };
  } catch (error: any) {
    console.error("Error extracting skills from resume:", error);
    return {
      response: "",
      success: false,
      error: error.message
    };
  }
}

/**
 * Direct API call to Oyster Llama instance with header extraction
 * Equivalent to: curl http://52.66.152.131:5000/api/generate -v -d '{"model": "llama3.2","prompt":"What is Ethereum?"}'
 * @param prompt - The prompt to send to the LLM
 * @param model - The model to use (defaults to "llama3.2")
 * @param instanceIp - The instance IP (defaults to env variable)
 * @returns An object with the LLM response and extracted Oyster headers
 */
export async function callOysterAPI(
  prompt: string, 
  model: string = "llama3.2",
  instanceIp?: string
): Promise<OysterApiResponse> {
  try {
    const response = await fetch('/api/oyster', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract headers from response headers or from the data object
    const oysterSignature = response.headers.get('x-oyster-signature') || data.oysterSignature;
    const oysterTimestamp = response.headers.get('x-oyster-timestamp') || data.oysterTimestamp;
    
    // Log the extracted headers
    console.log('Extracted Oyster Headers:');
    console.log('x-oyster-signature:', oysterSignature);
    console.log('x-oyster-timestamp:', oysterTimestamp);

    const responseText = data.response || "";
    console.log('LLM Response:', responseText);

    return {
      response: responseText,
      success: true,
      oysterSignature: oysterSignature || undefined,
      oysterTimestamp: oysterTimestamp || undefined
    };
  } catch (error: any) {
    console.error("Error calling Oyster API:", error);
    return {
      response: "",
      success: false,
      error: error.message
    };
  }
}

/**
 * Find the best candidates for each job using AI analysis with Llama 3.2
 * @param jobs - Array of job postings
 * @param candidates - Array of job seekers
 * @returns An object with AI-generated matches including raw response and verification data
 */
export async function findBestCandidatesWithAI(jobs: any[], candidates: any[]): Promise<{
  success: boolean;
  matches: any[];
  rawResponse?: string;
  verificationData?: {
    prompt: string;
    response: string;
    context: string;
    oysterSignature?: string;
    oysterTimestamp?: string;
  };
  error?: string;
}> {
  try {
    console.log('=== AI Matching Debug ===');
    console.log('Input jobs:', jobs.length);
    console.log('Input candidates:', candidates.length);
    
    if (!jobs || !candidates || jobs.length === 0 || candidates.length === 0) {
      console.log('No jobs or candidates provided');
      return {
        success: true,
        matches: [],
        rawResponse: 'No jobs or candidates provided',
        error: 'No jobs or candidates provided'
      };
    }

    let combinedResponse = '';
    let firstPrompt = '';
    let firstResponse = '';
    let firstContext = '';
    let firstOysterSignature = '';
    let firstOysterTimestamp = '';

    // Process each job
    for (let jobIndex = 0; jobIndex < jobs.length; jobIndex++) {
      const job = jobs[jobIndex];
      console.log(`Processing job ${jobIndex + 1}/${jobs.length}: ${job.title}`);
      
      if (!job.isActive) {
        console.log(`Job ${job.title} is not active, skipping`);
        continue;
      }

      // Filter active candidates
      const activeCandidates = candidates.filter(candidate => candidate.isActive);
      console.log(`Found ${activeCandidates.length} active candidates for job ${job.title}`);
      
      if (activeCandidates.length === 0) {
        console.log('No active candidates found, skipping job');
        continue;
      }

      // Create detailed prompt for AI analysis
      const candidatesInfo = activeCandidates.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills,
        location: candidate.location,
        expectedSalary: candidate.expectedSalary
      }));

      const prompt = `You are an expert HR consultant and technical recruiter. Analyze the following job posting and candidates to find the best matches.

JOB POSTING:
Title: ${job.title}
Description: ${job.description}
Required Skills: ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : job.requiredSkills}
Location: ${job.location}
Salary: $${job.salary}

CANDIDATES:
${candidatesInfo.map((candidate, index) => 
  `${index + 1}. ID: ${candidate.id}
   Name: ${candidate.name}
   Skills: ${candidate.skills}
   Location: ${candidate.location}
   Expected Salary: $${candidate.expectedSalary}`
).join('\n\n')}

TASK: Evaluate each candidate for this job and provide matches with scores from 0-100.

Consider:
- Technical skill alignment (how well candidate skills match job requirements)
- Location compatibility (same location gets higher score)
- Salary expectations vs job salary
- Overall fit and experience level

Format your response EXACTLY as follows for each candidate with score 30 or higher:
CANDIDATE_ID: [id]
SCORE: [0-100]
REASONING: [brief 1-2 sentence explanation]
DETAILED_EVALUATION: [comprehensive analysis including technical skills rating (1-10), location compatibility, salary match, strengths, concerns, and final recommendation (Strong Fit/Good Fit/Partial Fit/Poor Fit)]
---

Only include candidates with scores of 30 or higher. Be selective and realistic with scoring.`;

      console.log('Sending prompt to AI:', prompt.substring(0, 200) + '...');

      // Call Llama 3.2 model directly
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: prompt
        }),
      });

      console.log('AI API response status:', response.status);

      if (!response.ok) {
        console.error(`AI API error for job ${job.id}:`, response.statusText);
        combinedResponse += `\n\nERROR for job ${job.title}: API error ${response.status}\n`;
        continue;
      }

      const aiResponse = await response.json();
      const aiResult = aiResponse.response || '';

      // Log the full AI response to see what we're getting
      console.log('Full AI Response object:', aiResponse);
      console.log('AI Response keys:', Object.keys(aiResponse));

      // Capture data for the first job for verification
      if (jobIndex === 0) {
        firstPrompt = prompt.replace(/\r\n/g, '\n'); // Normalize line endings
        firstResponse = aiResult.replace(/\r\n/g, '\n'); // Normalize line endings
        
        // Try to get context from various possible fields
        firstContext = aiResponse.context || aiResponse.tokens || aiResponse.tokenized || '';
        
        // If context is not available or empty, try to get it from the response itself
        if (!firstContext || firstContext === '') {
          // Check if the aiResponse has any field that looks like tokenized data
          if (aiResponse.input_ids) {
            firstContext = JSON.stringify(aiResponse.input_ids);
          } else if (aiResponse.token_ids) {
            firstContext = JSON.stringify(aiResponse.token_ids);
          } else {
            // Fallback to empty array format like the working example
            firstContext = '[]';
          }
        }
        
        // Ensure context is a string representation of an array
        if (typeof firstContext === 'object' && Array.isArray(firstContext)) {
          firstContext = JSON.stringify(firstContext);
        } else if (typeof firstContext === 'object') {
          firstContext = JSON.stringify(firstContext);
        }
        
        console.log('Captured context for verification:', firstContext);
        console.log('Context type:', typeof firstContext);
        
        firstOysterSignature = response.headers.get('x-oyster-signature') || aiResponse.oysterSignature || '';
        firstOysterTimestamp = response.headers.get('x-oyster-timestamp') || aiResponse.oysterTimestamp || '';
        
        console.log('Captured verification data:');
        console.log('- Signature:', firstOysterSignature);
        console.log('- Timestamp:', firstOysterTimestamp);
      }

      // Extract enclave public key from verification result
      let ResponseContext = aiResponse.context || '';
      console.log('AI Response context for current job:', ResponseContext);
      // if (aiResult) {
      //   try {
      //     const verificationObj = JSON.parse(aiResult);
      //     enclavePublicKey = verificationObj.secp256k1_public || '';
      //   } catch (parseError) {
      //     console.error('Error parsing verification result:', parseError);
      //   }
      // }

      // Extract headers from response headers or from the data object
      const oysterSignature = response.headers.get('x-oyster-signature') || aiResponse.oysterSignature;
      const oysterTimestamp = response.headers.get('x-oyster-timestamp') || aiResponse.oysterTimestamp;
      
      // Log the extracted headers
      console.log('=== Oyster Headers for Job:', job.title, '===');
      console.log('x-oyster-signature:', oysterSignature);
      console.log('x-oyster-timestamp:', oysterTimestamp);

      console.log('AI Response length:', aiResult.length);
      console.log('AI Response:', aiResult);

      // Add job header and response to combined output
      combinedResponse += `\n\n=== JOB: ${job.title} ===\n`;
      combinedResponse += `Job ID: ${job.id}\n`;
      combinedResponse += `Location: ${job.location}\n`;
      combinedResponse += `Salary: $${job.salary}\n`;
      combinedResponse += `Required Skills: ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : job.requiredSkills}\n`;
      
      // Add Oyster verification headers if available
      if (oysterSignature || oysterTimestamp) {
        combinedResponse += `\nOYSTER VERIFICATION:\n`;
        if (oysterSignature) combinedResponse += `Signature: ${oysterSignature}\n`;
        if (oysterTimestamp) combinedResponse += `Timestamp: ${oysterTimestamp}\n`;
      }
      
      combinedResponse += `\nAI ANALYSIS:\n${aiResult}\n`;
      combinedResponse += `\n${'='.repeat(50)}\n`;
    }

    console.log('Combined AI Response:', combinedResponse);

    // Create a simple match structure for display
    const simpleMatches = [{
      jobId: 0,
      seekerId: 0,
      score: 0,
      reasoning: 'Raw AI response - see detailed view',
      jobTitle: 'AI Analysis Results',
      seekerName: 'Multiple Candidates',
      detailedEvaluation: combinedResponse
    }];

    return {
      success: true,
      matches: simpleMatches,
      rawResponse: combinedResponse,
      error: undefined,
      verificationData: {
        prompt: firstPrompt,
        response: firstResponse,
        context: firstContext,
        oysterSignature: firstOysterSignature,
        oysterTimestamp: firstOysterTimestamp
      }
    };

  } catch (error: any) {
    console.error("Error finding candidates with AI:", error);
    return {
      success: false,
      matches: [],
      rawResponse: `Error: ${error.message}`,
      error: error.message,
      verificationData: {
        prompt: '',
        response: '',
        context: '',
        oysterSignature: '',
        oysterTimestamp: ''
      }
    };
  }
}

/**
 * Perform attestation and verification operation
 * Equivalent to: curl <ip>:1301/attestation/raw -vs | curl -H "Content-Type: application/octet-stream" --data-binary @- 13.201.207.60:1400/verify/raw -vs
 * @param attestationIp - The IP for attestation endpoint (defaults to env variable)
 * @param verificationIp - The IP for verification endpoint (defaults to 13.201.207.60)
 * @returns An object with the attestation and verification results
 */
export async function performAttestation(
  attestationIp?: string,
  verificationIp?: string
): Promise<AttestationResponse> {
  try {
    const response = await fetch('/api/attestation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attestationIp: attestationIp,
        verificationIp: verificationIp
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract enclave public key from verification result
    let enclavePublicKey = '';
    if (data.verificationResult) {
      try {
        const verificationObj = JSON.parse(data.verificationResult);
        enclavePublicKey = verificationObj.secp256k1_public || '';
      } catch (parseError) {
        console.error('Error parsing verification result:', parseError);
      }
    }
    
    // Log the results
    console.log('Attestation Results:');
    console.log('Success:', data.success);
    console.log('Attestation Size:', data.attestationSize, 'bytes');
    console.log('Verification Result:', data.verificationResult);
    console.log('Enclave Public Key:', enclavePublicKey);
    console.log('Response Headers:', data.responseHeaders);
    
    return {
      ...data,
      enclavePublicKey: enclavePublicKey
    };
  } catch (error: any) {
    console.error("Error performing attestation:", error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to perform attestation and verification'
    };
  }
}