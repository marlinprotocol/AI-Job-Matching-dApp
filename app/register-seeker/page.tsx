'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getContract } from '../utils/web3';
import { extractSkillsFromResume } from '../utils/llmService';

export default function RegisterJobSeeker() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    resume: '',
    skills: '',
    location: '',
    expectedSalary: '',
  });
  const [loading, setLoading] = useState(false);
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [error, setError] = useState('');
  const [skillExtractionError, setSkillExtractionError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const extractSkills = async () => {
    if (!formData.resume) {
      setSkillExtractionError('Please enter your resume first');
      return;
    }

    try {
      setExtractingSkills(true);
      setSkillExtractionError('');
      
      const result = await extractSkillsFromResume(formData.resume);
      
      if (result.success) {
        // Clean up the response and convert to a properly formatted comma-separated list
        const skillsArray = result.response
          .split(',')
          .map((skill: string) => skill.trim())
          .filter((skill: string) => skill.length > 0);
        
        // Join the array back into a comma-separated string
        const formattedSkills = skillsArray.join(', ');
        
        setFormData(prev => ({ ...prev, skills: formattedSkills }));
      } else {
        setSkillExtractionError(result.error || 'Failed to extract skills. Please try again or enter skills manually.');
      }
    } catch (err: any) {
      console.error("Error extracting skills:", err);
      setSkillExtractionError(err.message || 'An error occurred while extracting skills');
    } finally {
      setExtractingSkills(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Get contract instance
      const contract = await getContract();
      if (!contract) {
        throw new Error("Failed to get contract instance. Make sure your wallet is connected.");
      }
      
      // Format the data for the contract
      const { name, location, expectedSalary } = formData;
      const skills = formData.skills.split(',').map(skill => skill.trim());
      
      // Call the contract method to register as a job seeker
      const tx = await contract.registerAsJobSeeker(
        name,
        skills,
        location,
        parseInt(expectedSalary, 10)
      );
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Redirect to candidates page
      // router.push('/candidates');
      setLoading(false);
      alert("Registration successful!");
      
    } catch (err: any) {
      console.error("Error registering job seeker:", err);
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Register as Job Seeker</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1 font-medium">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label htmlFor="resume" className="block mb-1 font-medium">
            Resume / Professional Summary
          </label>
          <textarea
            id="resume"
            name="resume"
            value={formData.resume}
            onChange={handleChange}
            required
            rows={6}
            placeholder="Paste your resume content, work experience, education, projects, and skills here..."
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Click "Extract Skills" to use AI to extract skills from your resume
          </p>
        </div>
        
        <div>
          <label htmlFor="skills" className="block mb-1 font-medium">
            Skills (comma-separated)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              required
              placeholder="e.g. JavaScript, React, Solidity"
              className="w-full px-3 py-2 border rounded-md"
            />
            <button
              type="button"
              onClick={extractSkills}
              disabled={extractingSkills || !formData.resume}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded disabled:opacity-50 whitespace-nowrap"
            >
              {extractingSkills ? 'Extracting...' : 'Extract Skills'}
            </button>
          </div>
          {skillExtractionError && (
            <p className="text-red-600 text-sm mt-1">{skillExtractionError}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="location" className="block mb-1 font-medium">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label htmlFor="expectedSalary" className="block mb-1 font-medium">
            Expected Salary (USD)
          </label>
          <input
            type="number"
            id="expectedSalary"
            name="expectedSalary"
            value={formData.expectedSalary}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
} 