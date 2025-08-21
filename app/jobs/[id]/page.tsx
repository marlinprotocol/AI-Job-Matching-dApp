'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getContract } from '../../utils/web3';

interface Job {
  id: number;
  employer: string;
  title: string;
  description: string;
  requiredSkills: string[];
  location: string;
  salary: number;
  isActive: boolean;
}

export default function JobDetails() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        
        const jobId = parseInt(params.id as string);
        if (isNaN(jobId)) {
          throw new Error("Invalid job ID");
        }

        // Get contract instance
        const contract = await getContract(false);
        if (!contract) {
          throw new Error("Failed to get contract instance.");
        }

        console.log(`Fetching job details for ID: ${jobId}`);
        const jobData = await contract.getJobPosting(jobId);
        
        if (!jobData.isActive) {
          throw new Error("This job posting is no longer active.");
        }
        
        setJob({
          id: jobId,
          employer: jobData.employer,
          title: jobData.title,
          description: jobData.description,
          requiredSkills: jobData.requiredSkills,
          location: jobData.location,
          salary: Number(jobData.salary),
          isActive: jobData.isActive
        });
        
      } catch (err: any) {
        console.error("Error fetching job details:", err);
        setError(err.message || "Failed to load job details.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchJobDetails();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <div className="mt-4">
            <Link 
              href="/jobs" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              ← Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-10 text-center">
        <p>Job not found</p>
        <Link 
          href="/jobs" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mt-4 inline-block"
        >
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <Link 
          href="/jobs" 
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to All Jobs
        </Link>
        
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {job.location}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-1.092a4.535 4.535 0 001.676-.662C13.398 12.766 14 11.991 14 11c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 8.092V6.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V4z" clipRule="evenodd" />
                </svg>
                ${job.salary.toLocaleString()}
              </span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                Active
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Job Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Employer Information</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Employer Address:</p>
              <p className="font-mono text-sm break-all">{job.employer}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/register-seeker" 
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-medium"
              >
                Apply as Job Seeker
              </Link>
              <Link 
                href="/matches" 
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md font-medium"
              >
                View All Matches
              </Link>
              <button 
                onClick={() => router.back()} 
                className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-md font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
