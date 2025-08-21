'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllActiveJobs } from '../utils/web3';

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

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        // Use the utility function to get all active jobs
        const fetchedJobs = await getAllActiveJobs();
        console.log('Fetched jobs:', fetchedJobs);
        setJobs(fetchedJobs);
        
      } catch (err: any) {
        console.error("Error fetching jobs:", err);
        setError(err.message || "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Loading jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <p className="mt-2">Please make sure you have MetaMask installed and connected to the correct network.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Available Jobs</h1>
        <Link 
          href="/post-job" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Post a Job
        </Link>
      </div>
      
      {jobs.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded text-center">
          <p className="text-lg">No jobs found</p>
          <p className="mt-2">Be the first to post a job!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
              <p className="text-gray-500 mb-3">{job.location} • ${job.salary.toLocaleString()}</p>
              
              <div className="mb-3">
                <p className="font-medium">Required Skills:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {job.requiredSkills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
              
              <Link 
                href={`/jobs/${job.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 