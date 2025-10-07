// Popup with User ID Setup Screen
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
                <input type="text" id="userIdInput" placeholder="user_123456_abcdef" 
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
    
    // Simple format validation (customize as needed)
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

function showMainInterface(userId) {
    // Load the main popup interface
    document.body.innerHTML = `
        <div style="width: 420px; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; background: #f8f9fa;">
            <div style="text-align: center; margin-bottom: 16px; background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="margin: 0; color: #0073b1; font-size: 18px;">Job Tracker</h2>
            </div>

            <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; color: #1976d2;">
                User ID: <strong>${userId}</strong>
                <button id="changeUserIdBtn" style="float: right; background: none; border: none; color: #1976d2; cursor: pointer; font-size: 10px; text-decoration: underline;">Change</button>
            </div>

            <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 16px; text-align: center; font-size: 14px; color: #333; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <span id="jobCount">0</span> jobs saved
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button id="refreshData" style="flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; background: white; color: #666; border: 1px solid #ddd;">Refresh</button>
                <button id="viewConsole" style="flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; background: white; color: #666; border: 1px solid #ddd;">View Data</button>
                <button id="clearAll" style="flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; background: #dc3545; color: white;">Clear All</button>
            </div>

            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-height: 300px; overflow-y: auto;">
                <div style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #333; font-size: 13px;">Saved Jobs</div>
                <div id="jobsList"></div>
                <div id="noJobs" style="text-align: center; color: #666; font-size: 13px; padding: 30px 20px;">
                    No saved jobs yet. Visit LinkedIn job pages to start tracking!
                </div>
            </div>

            <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 10px; color: #666;">
                <button id="toggleDebug" style="background: none; border: none; color: #0073b1; cursor: pointer; font-size: 10px; text-decoration: underline;">Show Debug Info</button>
                <div id="debugInfo" style="display: none;"></div>
            </div>
        </div>
    `;
    
    // Set up event listeners for main interface
    setupMainInterfaceEvents(userId);
    
    // Load initial data
    loadSavedJobs();
}

function setupMainInterfaceEvents(userId) {
    // Change user ID button
    document.getElementById('changeUserIdBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to change your User ID? This will clear all saved jobs.')) {
            chrome.storage.local.clear(function() {
                showSetupScreen();
            });
        }
    });
    
    // Refresh button - Reloads saved jobs from storage
    document.getElementById('refreshData').addEventListener('click', loadSavedJobs);
    
    // Clear all button - Deletes all saved jobs
    document.getElementById('clearAll').addEventListener('click', function() {
        if (confirm('Clear all saved jobs? This cannot be undone.')) {
            chrome.storage.local.set({ savedJobs: [] }, loadSavedJobs);
        }
    });
    
    // View Data button - Shows all jobs in console table format
    document.getElementById('viewConsole').addEventListener('click', function() {
        chrome.storage.local.get(['savedJobs'], function(result) {
            const jobs = result.savedJobs || [];
            
            if (jobs.length === 0) {
                alert('No saved jobs to display');
                return;
            }
            
            // Log to console in table format
            console.clear();
            console.log('%c=== ALL SAVED JOBS ===', 'color: green; font-size: 16px; font-weight: bold;');
            console.log('Total jobs:', jobs.length);
            console.table(jobs.map(job => ({
                Title: job.title,
                Company: job.company,
                Location: job.location,
                Salary: job.salary,
                Type: job.jobType,
                Experience: job.experienceLevel,
                Arrangement: job.workArrangement,
                Date: job.applicationDate,
                URL: job.url
            })));
            console.log('Full data with keywords:', jobs);
            
            alert(`Viewing ${jobs.length} jobs in console. Press F12 to see the data table.`);
        });
    });
    
    // Toggle debug info
    document.getElementById('toggleDebug').addEventListener('click', function() {
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo.style.display === 'none') {
            showDebugInfo();
            this.textContent = 'Hide Debug Info';
        } else {
            debugInfo.style.display = 'none';
            this.textContent = 'Show Debug Info';
        }
    });
}

function loadSavedJobs() {
    chrome.storage.local.get(['savedJobs'], function(result) {
        const savedJobs = result.savedJobs || [];
        
        // Update job count
        document.getElementById('jobCount').textContent = savedJobs.length;
        
        const jobsList = document.getElementById('jobsList');
        const noJobs = document.getElementById('noJobs');
        
        if (savedJobs.length === 0) {
            jobsList.innerHTML = '';
            noJobs.style.display = 'block';
            return;
        }
        
        noJobs.style.display = 'none';
        
        // Sort jobs by most recent first
        savedJobs.sort((a, b) => new Date(b.extractedAt) - new Date(a.extractedAt));
        
        jobsList.innerHTML = '';
        savedJobs.slice(0, 10).forEach(job => {
            const div = document.createElement('div');
            div.style.cssText = 'padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background-color 0.2s;';
            div.innerHTML = `
                <div style="font-weight: 600; color: #333; font-size: 13px; margin-bottom: 4px;">${job.title || 'No title'}</div>
                <div style="color: #0073b1; font-size: 12px; margin-bottom: 2px;">${job.company || 'No company'}</div>
                <div style="color: #666; font-size: 11px; margin-bottom: 4px;">${job.location || 'No location'}</div>
                <div style="color: #999; font-size: 10px;">Saved: ${new Date(job.extractedAt).toLocaleDateString()}</div>
            `;
            
            div.addEventListener('mouseover', () => div.style.backgroundColor = '#f8f9fa');
            div.addEventListener('mouseout', () => div.style.backgroundColor = '');
            
            if (job.url) {
                div.addEventListener('click', () => {
                    chrome.tabs.create({ url: job.url });
                    window.close();
                });
            }
            
            jobsList.appendChild(div);
        });
    });
}

function showDebugInfo() {
    chrome.storage.local.get(null, function(result) {
        const debugInfo = document.getElementById('debugInfo');
        debugInfo.innerHTML = `
            <strong>Debug Information:</strong><br>
            User ID Set: ${result.userIdSet || false}<br>
            User ID: ${result.userId || 'Not set'}<br>
            Jobs Count: ${result.savedJobs?.length || 0}<br>
            Storage Keys: ${Object.keys(result).join(', ')}<br>
        `;
        debugInfo.style.display = 'block';
    });
}