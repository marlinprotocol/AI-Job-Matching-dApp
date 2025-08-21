// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title JobMarketplace
 * @dev A decentralized job marketplace with O(n²) matching algorithm for job seekers and postings
 */
contract JobMarketplace {
    // Structs
    struct JobPosting {
        uint256 id;
        address employer;
        string title;
        string description;
        string[] requiredSkills;
        string location;
        uint256 salary;
        bool isActive;
    }

    struct JobSeeker {
        uint256 id;
        address user;
        string name;
        string[] skills;
        string location;
        uint256 expectedSalary;
        bool isActive;
    }

    struct Match {
        uint256 jobId;
        uint256 seekerId;
        uint256 score;
    }

    // State variables
    uint256 private jobIdCounter;
    uint256 private seekerIdCounter;
    
    mapping(uint256 => JobPosting) public jobPostings;
    mapping(uint256 => JobSeeker) public jobSeekers;
    
    // Keep track of all job IDs and seeker IDs for matching
    uint256[] private allJobIds;
    uint256[] private allSeekerIds;
    
    // Store matches
    Match[] public matches;
    mapping(uint256 => mapping(uint256 => bool)) public isMatched; // jobId => seekerId => isMatched
    
    // Events
    event JobPostingCreated(uint256 indexed jobId, address indexed employer);
    event JobSeekerRegistered(uint256 indexed seekerId, address indexed user);
    event MatchCreated(uint256 indexed jobId, uint256 indexed seekerId, uint256 score);
    
    // Modifiers
    modifier onlyJobOwner(uint256 jobId) {
        require(jobPostings[jobId].employer == msg.sender, "Not job owner");
        _;
    }
    
    modifier onlyJobSeeker(uint256 seekerId) {
        require(jobSeekers[seekerId].user == msg.sender, "Not job seeker");
        _;
    }
    
    // Functions
    
    /**
     * @dev Create a new job posting
     */
    function createJobPosting(
        string memory title,
        string memory description,
        string[] memory requiredSkills,
        string memory location,
        uint256 salary
    ) external returns (uint256) {
        jobIdCounter++;
        uint256 jobId = jobIdCounter;
        
        jobPostings[jobId] = JobPosting({
            id: jobId,
            employer: msg.sender,
            title: title,
            description: description,
            requiredSkills: requiredSkills,
            location: location,
            salary: salary,
            isActive: true
        });
        
        allJobIds.push(jobId);
        
        emit JobPostingCreated(jobId, msg.sender);
        
        return jobId;
    }
    
    /**
     * @dev Register as a job seeker
     */
    function registerAsJobSeeker(
        string memory name,
        string[] memory skills,
        string memory location,
        uint256 expectedSalary
    ) external returns (uint256) {
        seekerIdCounter++;
        uint256 seekerId = seekerIdCounter;
        
        jobSeekers[seekerId] = JobSeeker({
            id: seekerId,
            user: msg.sender,
            name: name,
            skills: skills,
            location: location,
            expectedSalary: expectedSalary,
            isActive: true
        });
        
        allSeekerIds.push(seekerId);
        
        emit JobSeekerRegistered(seekerId, msg.sender);
        
        return seekerId;
    }
    
    /**
     * @dev Calculate the match score between a job posting and a job seeker
     * This is a local view function used by the matching algorithm
     */
    function calculateMatchScore(uint256 jobId, uint256 seekerId) public view returns (uint256) {
        JobPosting storage job = jobPostings[jobId];
        JobSeeker storage seeker = jobSeekers[seekerId];
        
        // Skip if either are inactive
        if (!job.isActive || !seeker.isActive) {
            return 0;
        }
        
        uint256 score = 0;
        
        // Skills matching (50% of total score)
        uint256 skillsScore = 0;
        for (uint256 i = 0; i < job.requiredSkills.length; i++) {
            for (uint256 j = 0; j < seeker.skills.length; j++) {
                // Compare strings (case-sensitive)
                if (keccak256(bytes(job.requiredSkills[i])) == keccak256(bytes(seeker.skills[j]))) {
                    skillsScore += 10;
                    break;
                }
            }
        }
        
        // Location matching (30% of score)
        uint256 locationScore = 0;
        if (keccak256(bytes(job.location)) == keccak256(bytes(seeker.location))) {
            locationScore = 30;
        }
        
        // Salary matching (20% of score)
        uint256 salaryScore = 0;
        if (job.salary >= seeker.expectedSalary) {
            salaryScore = 20;
        } else if (job.salary >= seeker.expectedSalary * 90 / 100) {
            // If at least 90% of expected salary
            salaryScore = 10;
        }
        
        // Combine scores
        score = skillsScore + locationScore + salaryScore;
        
        return score;
    }
    
    /**
     * @dev Run the O(n²) matching algorithm to match all jobs and seekers
     * Uses the algorithm similar to the one in the image
     */
    function calculateMatches() external {
        // Clear existing matches
        delete matches;
        
        // O(n²) matching algorithm
        for (uint256 i = 0; i < allJobIds.length; i++) {
            uint256 jobId = allJobIds[i];
            
            for (uint256 j = 0; j < allSeekerIds.length; j++) {
                uint256 seekerId = allSeekerIds[j];
                
                // Calculate match score
                uint256 score = calculateMatchScore(jobId, seekerId);
                
                // Only store matches with a score above threshold
                if (score >= 30) {
                    matches.push(Match({
                        jobId: jobId,
                        seekerId: seekerId,
                        score: score
                    }));
                    
                    isMatched[jobId][seekerId] = true;
                    
                    emit MatchCreated(jobId, seekerId, score);
                }
            }
        }
    }
    
    /**
     * @dev Get all matches
     */
    function getAllMatches() external view returns (Match[] memory) {
        return matches;
    }
    
    /**
     * @dev Get all jobs for a specific employer
     */
    function getEmployerJobs() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count jobs for this employer
        for (uint256 i = 0; i < allJobIds.length; i++) {
            if (jobPostings[allJobIds[i]].employer == msg.sender) {
                count++;
            }
        }
        
        // Create result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        // Fill result array
        for (uint256 i = 0; i < allJobIds.length; i++) {
            if (jobPostings[allJobIds[i]].employer == msg.sender) {
                result[index] = allJobIds[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get job seeker profile
     */
    function getSeekerProfile(uint256 seekerId) external view 
        returns (
            string memory name,
            string[] memory skills,
            string memory location,
            uint256 expectedSalary,
            bool isActive
        ) 
    {
        JobSeeker storage seeker = jobSeekers[seekerId];
        return (
            seeker.name,
            seeker.skills,
            seeker.location,
            seeker.expectedSalary,
            seeker.isActive
        );
    }
    
    /**
     * @dev Get job posting details
     */
    function getJobPosting(uint256 jobId) external view 
        returns (
            address employer,
            string memory title,
            string memory description,
            string[] memory requiredSkills,
            string memory location,
            uint256 salary,
            bool isActive
        ) 
    {
        JobPosting storage job = jobPostings[jobId];
        return (
            job.employer,
            job.title,
            job.description,
            job.requiredSkills,
            job.location,
            job.salary,
            job.isActive
        );
    }
    
    /**
     * @dev Toggle job posting active status
     */
    function toggleJobActive(uint256 jobId) external onlyJobOwner(jobId) {
        jobPostings[jobId].isActive = !jobPostings[jobId].isActive;
    }
    
    /**
     * @dev Toggle job seeker active status
     */
    function toggleSeekerActive(uint256 seekerId) external onlyJobSeeker(seekerId) {
        jobSeekers[seekerId].isActive = !jobSeekers[seekerId].isActive;
    }
} 
