// ========================================
// POPUP.JS - HYBRID APPROACH
// Job Tracker Extension
// ========================================

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loading...');
    
    // Check if user ID is set
    chrome.storage.local.get(['userId', 'userIdSet'], function(result) {
        if (result.userIdSet && result.userId) {
            // User ID is set - show main interface
            showMainInterface(result.userId);
        } else {
            // No user ID - show setup screen
            showSetupScreen();
        }
    });
});

// ========================================
// SETUP SCREEN
// ========================================
function showSetupScreen() {
    document.body.innerHTML = `
        <div style="width: 400px; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #0073b1; margin: 0;">Job Tracker Setup</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
                <strong>Welcome to Job Tracker!</strong><br><br>
                To use this extension, you need a User ID from the developer.<br><br>
                <strong>How to get your User ID:</strong><br>
                1. Email: your-email@example.com<br>
                2. Request access to Job Tracker<br>
                3. You'll receive your unique User ID
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Enter Your User ID:</label>
                <input type="text" id="userIdInput" placeholder="job-tracker_yourname" 
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            
            <button id="setUserIdBtn" 
                    style="width: 100%; padding: 12px; background: #0073b1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                Set User ID
            </button>
            
            <div id="errorMessage" style="color: #dc3545; margin-top: 10px; font-size: 12px; display: none;"></div>
            
            <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px; font-size: 12px; color: #1976d2;">
                <strong>Privacy Note:</strong> Your job data will be associated with this User ID and stored on our servers. We only collect job information you explicitly save.
            </div>
        </div>
    `;
    
    // Set up event listeners for setup screen
    document.getElementById('setUserIdBtn').addEventListener('click', handleUserIdSubmission);
    document.getElementById('userIdInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserIdSubmission();
        }
    });
}

function handleUserIdSubmission() {
    const userIdInput = document.getElementById('userIdInput');
    const errorMessage = document.getElementById('errorMessage');
    const setBtn = document.getElementById('setUserIdBtn');
    
    const inputValue = userIdInput.value.trim();
    
    // Basic validation
    if (!inputValue) {
        showError('Please enter a User ID');
        return;
    }
    
    if (inputValue.length < 5) {
        showError('User ID must be at least 5 characters long');
        return;
    }
    
    // Simple format validation
    if (!/^[a-zA-Z0-9_-]+$/.test(inputValue)) {
        showError('User ID can only contain letters, numbers, underscores, and dashes');
        return;
    }
    
    // Save the user ID
    setBtn.textContent = 'Setting up...';
    setBtn.disabled = true;
    
    chrome.storage.local.set({
        userId: inputValue,
        userIdSet: true,
        userIdSetAt: new Date().toISOString()
    }, function() {
        console.log('User ID saved:', inputValue);
        
        // Show success and reload to main interface
        setBtn.textContent = 'Success!';
        setTimeout(() => {
            showMainInterface(inputValue);
        }, 1000);
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        userIdInput.focus();
    }
}

// ========================================
// MAIN INTERFACE - HYBRID APPROACH
// ========================================
async function showMainInterface(userId) {
    // First, show loading state
    document.body.innerHTML = `
        <div style="width: 420px; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f8f9fa;">
            <div style="text-align: center; margin-bottom: 16px; background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="margin: 0; color: #0073b1; font-size: 18px;">Job Tracker</h2>
            </div>

            <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; color: #1976d2;">
                User ID: <strong>${userId}</strong>
                <button id="changeUserIdBtn" style="float: right; background: none; border: none; color: #1976d2; cursor: pointer; font-size: 10px; text-decoration: underline;">Change</button>
            </div>

            <div style="background: white; padding: 16px; border-radius: 6px; margin-bottom: 16px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 32px; font-weight: bold; color: #0073b1;" id="jobCount">...</div>
                <div style="color: #666; font-size: 14px;">Jobs Saved</div>
            </div>

            <button id="openDashboard" style="width: 100%; padding: 12px; background: #0073b1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; margin-bottom: 16px;">
                📊 Open Dashboard
            </button>

            <div id="dynamicContent" style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; color: #999;">Loading...</div>
            </div>
        </div>
    `;
    
    // Set up event listeners
    setupEventListeners(userId);
    
    // Fetch stats and decide what to show
    try {
        const stats = await fetchJobStats(userId);
        
        if (stats.total === 0) {
            // New user - show instructions
            renderInstructions();
        } else {
            // Active user - show recent jobs
            const recentJobs = await fetchRecentJobs(userId, 3);
            renderRecentJobs(stats.total, recentJobs);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        renderError(userId);
    }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners(userId) {
    // Change User ID button
    document.getElementById('changeUserIdBtn').addEventListener('click', function() {
        if (confirm('Change User ID? Your saved jobs will remain on the server.')) {
            chrome.storage.local.remove(['userId', 'userIdSet'], function() {
                showSetupScreen();
            });
        }
    });
    
    // Open Dashboard button
    document.getElementById('openDashboard').addEventListener('click', function() {
        // TODO: Replace with your actual dashboard URL when ready
        const dashboardUrl = `https://your-dashboard.railway.app?userId=${userId}`;
        chrome.tabs.create({ url: dashboardUrl });
        window.close();
    });
}

// ========================================
// API FUNCTIONS
// ========================================

// Fetch job statistics from server
async function fetchJobStats(userId) {
    try {
        const response = await fetch('https://jobtracker-production-2ed3.up.railway.app/api/stats', {
            headers: {
                'x-user-id': userId
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update the job count display
            document.getElementById('jobCount').textContent = result.data.total;
            return result.data;
        } else {
            throw new Error('Failed to fetch stats');
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
        document.getElementById('jobCount').textContent = '?';
        throw error;
    }
}

// Fetch recent jobs from server
async function fetchRecentJobs(userId, limit = 3) {
    try {
        const response = await fetch(`https://jobtracker-production-2ed3.up.railway.app/api/applications?userId=${userId}`, {
            headers: {
                'x-user-id': userId
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Return only the most recent jobs
            return result.data.slice(0, limit);
        } else {
            throw new Error('Failed to fetch jobs');
        }
    } catch (error) {
        console.error('Error fetching recent jobs:', error);
        throw error;
    }
}

// ========================================
// RENDERING FUNCTIONS
// ========================================

// Render instructions for new users (0 jobs)
function renderInstructions() {
    const dynamicContent = document.getElementById('dynamicContent');
    
    dynamicContent.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
            <h3 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">Get Started</h3>
            <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 16px; line-height: 1.6;">
                <div style="margin-bottom: 8px;">
                    <strong>1.</strong> Visit any LinkedIn job posting
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>2.</strong> Click <span style="background: #0073b1; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">✅ Mark as Applied</span>
                </div>
                <div>
                    <strong>3.</strong> Job saved automatically!
                </div>
            </div>
            <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; font-size: 12px; color: #1976d2; text-align: left;">
                💡 <strong>Tip:</strong> Your first saved job will appear here instantly!
            </div>
        </div>
    `;
}

// Render recent jobs for active users (1+ jobs)
function renderRecentJobs(totalCount, jobs) {
    const dynamicContent = document.getElementById('dynamicContent');
    
    if (!jobs || jobs.length === 0) {
        renderInstructions();
        return;
    }
    
    dynamicContent.innerHTML = `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
            <div style="font-weight: 600; color: #333; font-size: 14px;">Recent Activity</div>
        </div>
        
        <div id="jobList"></div>
        
        <div style="text-align: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
            <button id="viewAllBtn" style="background: none; border: none; color: #0073b1; cursor: pointer; font-size: 12px; text-decoration: underline;">
                View all ${totalCount} jobs →
            </button>
        </div>
    `;
    
    // Render each job
    const jobList = document.getElementById('jobList');
    jobs.forEach((job, index) => {
        const jobCard = createJobCard(job);
        jobList.appendChild(jobCard);
        
        // Add separator except for last item
        if (index < jobs.length - 1) {
            const separator = document.createElement('div');
            separator.style.cssText = 'height: 1px; background: #f0f0f0; margin: 8px 0;';
            jobList.appendChild(separator);
        }
    });
    
    // View all button handler
    document.getElementById('viewAllBtn').addEventListener('click', function() {
        document.getElementById('openDashboard').click();
    });
}

// Create individual job card component
function createJobCard(job) {
    const card = document.createElement('div');
    card.style.cssText = 'cursor: pointer; padding: 8px; border-radius: 4px; transition: background-color 0.2s;';
    
    // Use createdAt for "time ago" (when saved)
    const savedDate = new Date(job.createdAt);
    const timeAgo = getTimeAgo(savedDate);
    
    // Use dateApplied for "applied date" (when user applied)
    const appliedDate = new Date(job.dateApplied);
    const appliedDateStr = appliedDate.toLocaleDateString();
    
    card.innerHTML = `
        <div style="font-weight: 600; color: #333; font-size: 13px; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${job.position}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 2px;">
            <span style="color: #0073b1; font-weight: 500;">${job.company}</span>
            <span style="color: #999;">${timeAgo}</span>
        </div>
        <div style="font-size: 10px; color: #999;">
            Applied: ${appliedDateStr}
        </div>
    `;
    
    // Hover effect
    card.addEventListener('mouseenter', () => {
        card.style.backgroundColor = '#f8f9fa';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.backgroundColor = 'transparent';
    });
    
    // Click to open job URL
    if (job.jobUrl) {
        card.addEventListener('click', () => {
            chrome.tabs.create({ url: job.jobUrl });
            window.close();
        });
    }
    
    return card;
}

// Helper function to format time ago
function getTimeAgo(date) {
    const now = new Date();
    const jobDate = new Date(date);
    
    // Calculate difference in milliseconds
    const diffMs = now - jobDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // For very recent jobs (< 1 hour)
    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        // Use toLocaleDateString() which automatically uses local timezone
        return jobDate.toLocaleDateString();
    }
}

// Render error state
function renderError(userId) {
    const dynamicContent = document.getElementById('dynamicContent');
    
    dynamicContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
            <div style="color: #666; font-size: 14px; margin-bottom: 12px;">
                Unable to load your jobs
            </div>
            <button id="retryBtn" style="background: #0073b1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Retry
            </button>
        </div>
    `;
    
    document.getElementById('retryBtn').addEventListener('click', function() {
        showMainInterface(userId);
    });
}