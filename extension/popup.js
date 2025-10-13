// ========================================
// POPUP.JS - SERVER-SYNCED APPROACH
// Job Tracker Extension
// ========================================

const API_URL = 'https://jobtracker-production-2ed3.up.railway.app/api';

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Popup loading...');
    
    // Check if user ID is set
    chrome.storage.local.get(['userId', 'userIdSet'], function(result) {
        if (result.userIdSet && result.userId) {
            console.log('✅ User ID found:', result.userId);
            // User ID is set - show main interface and sync with server
            showMainInterface(result.userId);
        } else {
            console.log('⚠️ No User ID set');
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
                1. Email: vincent0109ccc@gmail.com<br>
                2. Request access to Job Tracker and send the user-id<br>
                3. I'll add you in the user list
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Enter Your User ID:</label>
                <input type="text" id="userIdInput" placeholder="User-ID" 
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

async function handleUserIdSubmission() {
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
    
    if (!/^[a-zA-Z0-9_-]+$/.test(inputValue)) {
        showError('User ID can only contain letters, numbers, underscores, and dashes');
        return;
    }
    
    // Update UI
    setBtn.textContent = 'Verifying with server...';
    setBtn.disabled = true;
    userIdInput.disabled = true;
    
    // ⭐ IMPORTANT: Verify User ID with server before saving
    try {
        console.log('🔍 Verifying User ID with server:', inputValue);
        
        const response = await fetch(`${API_URL}/stats`, {
            method: 'GET',
            headers: {
                'x-user-id': inputValue,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ User ID verified with server');
            
            // Save the user ID to local storage
            chrome.storage.local.set({
                userId: inputValue,
                userIdSet: true,
                userIdSetAt: new Date().toISOString()
            }, function() {
                console.log('💾 User ID saved to local storage');
                
                // Reload all LinkedIn tabs to inject new userId
                chrome.tabs.query({url: "*://*.linkedin.com/*"}, function(tabs) {
                    console.log(`🔄 Reloading ${tabs.length} LinkedIn tabs...`);
                    tabs.forEach(tab => {
                        chrome.tabs.reload(tab.id);
                    });
                });
                
                // Show success message
                setBtn.textContent = '✅ Success! Loading your data...';
                
                // Transition to main interface
                setTimeout(() => {
                    showMainInterface(inputValue);
                }, 1500);
            });
        } else {
            // Server rejected the User ID
            console.error('❌ Server rejected User ID:', result.message);
            showError(result.message || 'Invalid User ID. Please check and try again.');
            setBtn.textContent = 'Set User ID';
            setBtn.disabled = false;
            userIdInput.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Error verifying User ID:', error);
        showError('Could not connect to server. Please check your internet connection and try again.');
        setBtn.textContent = 'Set User ID';
        setBtn.disabled = false;
        userIdInput.disabled = false;
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        userIdInput.focus();
    }
}

// ========================================
// MAIN INTERFACE - ALWAYS SYNC WITH SERVER
// ========================================
async function showMainInterface(userId) {
    console.log('🎨 Rendering main interface for:', userId);
    
    // First, show loading state immediately
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
                <div style="font-size: 32px; font-weight: bold; color: #0073b1;" id="jobCount">
                    <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #0073b1; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
                <div style="color: #666; font-size: 14px;">Jobs Saved</div>
            </div>

            <button id="openDashboard" style="width: 100%; padding: 12px; background: #0073b1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; margin-bottom: 16px;">
                📊 Open Dashboard
            </button>
            
            <button id="refreshBtn" style="width: 100%; padding: 10px; background: white; color: #0073b1; border: 1px solid #0073b1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; margin-bottom: 16px;">
                🔄 Refresh from Server
            </button>

            <div id="dynamicContent" style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; color: #999;">
                    <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #0073b1; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                    Syncing with server...
                </div>
            </div>
            
            <div id="lastSync" style="text-align: center; color: #999; font-size: 11px; margin-top: 8px;">
                Last synced: Loading...
            </div>
        </div>
        
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    // Set up event listeners FIRST
    setupEventListeners(userId);
    
    // Then fetch and sync with server
    await syncWithServer(userId);
}

// ========================================
// SERVER SYNC FUNCTION
// ========================================
async function syncWithServer(userId) {
    console.log('🔄 Syncing with server for user:', userId);
    
    try {
        // Fetch stats from server
        const stats = await fetchJobStats(userId);
        console.log('📊 Stats received:', stats);
        
        // Update last sync time
        updateLastSyncTime();
        
        if (stats.total === 0) {
            // New user - show instructions
            renderInstructions();
        } else {
            // Active user - fetch and show recent jobs
            console.log('📥 Fetching recent jobs...');
            const recentJobs = await fetchRecentJobs(userId, 3);
            console.log('✅ Recent jobs received:', recentJobs.length, 'jobs');
            renderRecentJobs(stats.total, recentJobs, userId);
        }
        
    } catch (error) {
        console.error('❌ Error syncing with server:', error);
        renderError(userId);
    }
}

function updateLastSyncTime() {
    const lastSyncElement = document.getElementById('lastSync');
    if (lastSyncElement) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        lastSyncElement.textContent = `Last synced: ${timeStr}`;
    }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners(userId) {
    // Change User ID button
    const changeBtn = document.getElementById('changeUserIdBtn');
    if (changeBtn) {
        changeBtn.addEventListener('click', function() {
            if (confirm('Change User ID? Your saved jobs will remain on the server.')) {
                chrome.storage.local.remove(['userId', 'userIdSet'], function() {
                    console.log('🗑️ User ID removed from local storage');
                    showSetupScreen();
                });
            }
        });
    }
    
    // Open Dashboard button
    const dashboardBtn = document.getElementById('openDashboard');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function() {
            const dashboardUrl = `${window.JobTrackerConstants.DASHBOARD_URL}?userId=${userId}`;
            chrome.tabs.create({ url: dashboardUrl });
            window.close();
        });
    }
    
    // ⭐ NEW: Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            console.log('🔄 Manual refresh triggered');
            refreshBtn.textContent = '⏳ Syncing...';
            refreshBtn.disabled = true;
            
            await syncWithServer(userId);
            
            refreshBtn.textContent = '🔄 Refresh from Server';
            refreshBtn.disabled = false;
        });
    }
}

// ========================================
// API FUNCTIONS WITH RETRY LOGIC
// ========================================

async function fetchJobStats(userId, retryCount = 0) {
    try {
        console.log(`📊 Fetching stats (attempt ${retryCount + 1})...`);
        
        const response = await fetch(`${API_URL}/stats`, {
            method: 'GET',
            headers: {
                'x-user-id': userId,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Update the job count display
            const jobCountElement = document.getElementById('jobCount');
            if (jobCountElement) {
                jobCountElement.innerHTML = result.data.total;
            }
            return result.data;
        } else {
            throw new Error(result.message || 'Failed to fetch stats');
        }
    } catch (error) {
        console.error(`❌ Error fetching stats (attempt ${retryCount + 1}):`, error);
        
        // Retry up to 2 times with exponential backoff
        if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchJobStats(userId, retryCount + 1);
        }
        
        // All retries failed
        const jobCountElement = document.getElementById('jobCount');
        if (jobCountElement) {
            jobCountElement.textContent = '?';
        }
        throw error;
    }
}

async function fetchRecentJobs(userId, limit = 3, retryCount = 0) {
    try {
        console.log(`📥 Fetching recent jobs (attempt ${retryCount + 1})...`);
        
        const response = await fetch(
            `${API_URL}/applications?userId=${userId}`,
            {
                method: 'GET',
                headers: {
                    'x-user-id': userId,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Return only the most recent jobs
            return result.data.slice(0, limit);
        } else {
            throw new Error(result.message || 'Failed to fetch jobs');
        }
    } catch (error) {
        console.error(`❌ Error fetching recent jobs (attempt ${retryCount + 1}):`, error);
        
        // Retry up to 2 times
        if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchRecentJobs(userId, limit, retryCount + 1);
        }
        
        // All retries failed
        throw error;
    }
}

// ========================================
// RENDERING FUNCTIONS
// ========================================

function renderInstructions() {
    const dynamicContent = document.getElementById('dynamicContent');
    if (!dynamicContent) return;
    
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

function renderRecentJobs(totalCount, jobs, userId) {
    const dynamicContent = document.getElementById('dynamicContent');
    if (!dynamicContent) return;
    
    if (!jobs || jobs.length === 0) {
        renderInstructions();
        return;
    }
    
    dynamicContent.innerHTML = `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
            <div style="font-weight: 600; color: #333; font-size: 14px;">Recent Activity</div>
            <div style="font-size: 11px; color: #999; margin-top: 4px;">Synced from server</div>
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
    if (jobList) {
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
    }
    
    // View all button handler
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            const dashboardUrl = `${window.JobTrackerConstants.DASHBOARD_URL}?userId=${userId}`;
            chrome.tabs.create({ url: dashboardUrl });
            window.close();
        });
    }
}

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
        <div style="font-weight: 600; color: #333; font-size: 14px; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
            ${job.position}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
            <span style="color: #0073b1; font-weight: 500;">${job.company}</span>
            <span style="color: #999; flex-shrink: 0; margin-left: 12px;">${timeAgo}</span>
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

function getTimeAgo(date) {
    const now = new Date();
    const jobDate = new Date(date);
    
    const diffMs = now - jobDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
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
        return jobDate.toLocaleDateString();
    }
}

function renderError(userId) {
    const dynamicContent = document.getElementById('dynamicContent');
    if (!dynamicContent) return;
    
    dynamicContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
            <div style="color: #666; font-size: 14px; margin-bottom: 12px;">
                Unable to sync with server
            </div>
            <div style="font-size: 12px; color: #999; margin-bottom: 16px;">
                Check your internet connection
            </div>
            <button id="retryBtn" style="background: #0073b1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Try Again
            </button>
        </div>
    `;
    
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', async function() {
            retryBtn.textContent = '⏳ Syncing...';
            retryBtn.disabled = true;
            await syncWithServer(userId);
        });
    }
}