import { NextRequest, NextResponse } from 'next/server';

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

interface AIMatch {
  jobId: number;
  seekerId: number;
  score: number;
  reasoning: string;
  jobTitle: string;
  seekerName: string;
  detailedEvaluation?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { jobs, candidates } = await request.json();

    if (!jobs || !candidates || !Array.isArray(jobs) || !Array.isArray(candidates)) {
      return NextResponse.json(
        { error: 'Invalid input: jobs and candidates arrays are required' },
        { status: 400 }
      );
    }

    // Filter active jobs and candidates
    const activeJobs = jobs.filter((job: JobPosting) => job.isActive);
    const activeCandidates = candidates.filter((candidate: JobSeeker) => candidate.isActive);

    if (activeJobs.length === 0 || activeCandidates.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: 'No active jobs or candidates found'
      });
    }

    const allMatches: AIMatch[] = [];

    // Process each job
    for (const job of activeJobs) {
      try {
        // Create a comprehensive prompt for the AI to analyze candidates
        const candidatesInfo = activeCandidates.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          skills: candidate.skills.join(', '),
          location: candidate.location,
          expectedSalary: candidate.expectedSalary
        }));

        const prompt = `You are an expert HR consultant and technical recruiter. Analyze the following job posting and candidates to find the best matches.

JOB POSTING:
Title: ${job.title}
Description: ${job.description}
Required Skills: ${job.requiredSkills.join(', ')}
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

Please evaluate each candidate and provide:
1. A match score from 0-100 for each candidate
2. Brief reasoning for each score
3. Detailed evaluation covering technical skills, location fit, salary match, and overall assessment
4. Consider: technical skill alignment, location compatibility, salary expectations, and overall fit

Format your response EXACTLY as follows for each candidate:
CANDIDATE_ID: [id]
SCORE: [0-100]
REASONING: [brief explanation in 1-2 sentences]
DETAILED_EVALUATION: [comprehensive analysis covering technical skills (rate 1-10), location compatibility, salary expectations match, overall fit assessment, strengths for this role, potential concerns, and final recommendation (Strong Fit/Good Fit/Partial Fit/Poor Fit)]
---

Only include candidates with scores of 30 or higher. Be selective and realistic with scoring.`;

        // Call the AI API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate`, {
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
          console.error(`AI API error for job ${job.id}:`, response.statusText);
          continue;
        }

        const aiResponse = await response.json();
        const aiResult = aiResponse.response || '';

        // Parse AI response
        const candidateMatches = parseAIResponse(aiResult, job, activeCandidates);
        allMatches.push(...candidateMatches);

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        continue;
      }
    }

    // Sort matches by score (highest first)
    allMatches.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      matches: allMatches,
      totalMatches: allMatches.length
    });

  } catch (error) {
    console.error('Error in AI candidates API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function parseAIResponse(aiResult: string, job: JobPosting, candidates: JobSeeker[]): AIMatch[] {
  const matches: AIMatch[] = [];
  
  try {
    // Split by candidate sections
    const sections = aiResult.split('---').filter(section => section.trim());
    
    for (const section of sections) {
      const lines = section.trim().split('\n').filter(line => line.trim());
      
      let candidateId: number | null = null;
      let score: number | null = null;
      let reasoning = '';
      let detailedEvaluation = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('CANDIDATE_ID:')) {
          candidateId = parseInt(line.split(':')[1].trim());
        } else if (line.startsWith('SCORE:')) {
          score = parseInt(line.split(':')[1].trim());
        } else if (line.startsWith('REASONING:')) {
          reasoning = line.split(':').slice(1).join(':').trim();
        } else if (line.startsWith('DETAILED_EVALUATION:')) {
          // Collect the detailed evaluation which might span multiple lines
          detailedEvaluation = line.split(':').slice(1).join(':').trim();
          // Continue reading subsequent lines until we hit another field or end
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].startsWith('CANDIDATE_ID:') || lines[j].startsWith('SCORE:') || 
                lines[j].startsWith('REASONING:') || lines[j].startsWith('DETAILED_EVALUATION:')) {
              break;
            }
            detailedEvaluation += '\n' + lines[j];
          }
        }
      }
      
      // Validate and find candidate
      if (candidateId !== null && score !== null && score >= 30) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
          matches.push({
            jobId: job.id,
            seekerId: candidateId,
            score: Math.min(100, Math.max(0, score)), // Ensure score is between 0-100
            reasoning: reasoning || 'AI-generated match',
            jobTitle: job.title,
            seekerName: candidate.name,
            detailedEvaluation: detailedEvaluation.trim() || 'Detailed evaluation not available'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Fallback: try to extract any numbers that might be scores
    const numbers = aiResult.match(/\b\d{1,3}\b/g);
    if (numbers && numbers.length > 0) {
      // Simple fallback - create matches for candidates mentioned
      candidates.slice(0, Math.min(3, candidates.length)).forEach((candidate, index) => {
        const score = parseInt(numbers[index] || '50');
        if (score >= 30) {
          matches.push({
            jobId: job.id,
            seekerId: candidate.id,
            score: Math.min(100, score),
            reasoning: 'AI analysis with basic scoring',
            jobTitle: job.title,
            seekerName: candidate.name,
            detailedEvaluation: 'Basic fallback evaluation - detailed analysis unavailable'
          });
        }
      });
    }
  }
  
  return matches;
}
