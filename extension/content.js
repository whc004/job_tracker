// LinkedIn Job Extractor - Complete Fixed Version
console.log('Job Tracker content script loading...');

// global variable for common keyword
const API_URL = 'https://jobtracker-production-2ed3.up.railway.app/api/applications';

// Wait for constants to be available
const getConstants = () => {
  if (typeof window.JobTrackerConstants === 'undefined') {
    console.warn('JobTrackerConstants not yet available');
    return null;
  }
  return window.JobTrackerConstants;
};

(function() {
  let lastUrl = location.href;
  
  // Check for URL changes every 500ms
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('📄 URL changed:', lastUrl);
      
      // Wait a bit for LinkedIn to load content, then try adding button
      setTimeout(() => {
        if (window.jobExtractor) {
          window.jobExtractor.waitForSaveButton();
        }
      }, 1000);
    }
  }, 500);
})();

class LinkedInJobExtractor {
  constructor() {
    this.jobData = {};
    this.userId = null;
    this.buttonAdded = false;
    this.init();
  }

  async init() {
    console.log('LinkedInJobExtractor initializing...');
    
    // Initialize user ID first
    await this.initializeUserId();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupExtractor());
    } else {
      this.setupExtractor();
    }
  }

  async initializeUserId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userId', 'userIdSet'], (result) => {
        if (result.userIdSet && result.userId) {
          this.userId = result.userId;
          console.log('✅ User ID loaded:', this.userId);
        } else {
          this.userId = null;
          console.log('⚠️ No User ID set - user needs to configure it in popup');
        }
        resolve(this.userId);
      });
    });
  }

  waitForSaveButton(maxAttempts = 15) {
    let attempts = 0;
    
    const checkForButton = () => {
      attempts++;
      const saveButton = document.querySelector('.jobs-save-button');
      const existingButton = document.getElementById('job-tracker-extract-btn');
      
      if (saveButton && !existingButton) {
        console.log(`✅ Found save button on attempt ${attempts}`);
        // Only add button if user has set their ID
        if (this.userId) {
          this.addExtractButton();
        }
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(checkForButton, 500);
      }
    };
    
    checkForButton();
  }

  setupExtractor() {
    console.log('Setting up extractor...');
    
    // If no user ID, don't try to add button
    if (!this.userId) {
      console.log('⏳ Waiting for user ID to be set before adding button...');
      
      // Listen for storage changes (user sets ID in popup)
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.userId) {
          this.userId = changes.userId.newValue;
          console.log('✅ User ID updated via popup:', this.userId);
          this.waitForSaveButton();
        }
      });
      
      return;
    }
    
    // Retry adding button multiple times with increasing delays
    const retryAddButton = (attempt = 1, maxAttempts = 5) => {
      const delay = attempt * 500; // 500ms, 1000ms, 1500ms, etc.
      
      setTimeout(() => {
        const success = this.addExtractButton();
        
        if (!success && attempt < maxAttempts) {
          console.log(`Button add attempt ${attempt} failed, retrying...`);
          retryAddButton(attempt + 1, maxAttempts);
        } else if (success) {
          console.log('✅ Button successfully added');
        } else {
          console.log('⚠️ Failed to add button after all attempts');
        }
      }, delay);
    };
    
    retryAddButton();
    
    // Set up observers for dynamic content
    this.observeJobSelection();
    
    // Initial data extraction
    setTimeout(() => this.extractJobData(), 500);
  }

  addExtractButton() {
    // Check if button already exists - don't recreate it
    const existingButton = document.getElementById('job-tracker-extract-btn');
    if (existingButton) {
      console.log('⭐️ Button already exists, skipping...');
      return true; // Button exists, success
    }

    // Try multiple possible container locations
    const saveButton = document.querySelector('.jobs-save-button');
    if (!saveButton) {
      console.log('⚠️ Save button not found, will retry...');
      return false; // Indicate failure
    }
    
    const button = document.createElement('button');
    button.id = 'job-tracker-extract-btn';
    button.innerHTML = '✅ Mark as Applied';
    button.className = 'artdeco-button artdeco-button--secondary artdeco-button--3';
    button.type = 'button';
    
    button.style.cssText = `
      height: 40px !important;
      padding: 10px 20px !important;
      border: none !important;
      background: linear-gradient(135deg, #0073b1, #005885) !important;
      color: white !important;
      margin-left: 8px !important;
      margin-top: 8px !important;
      display: inline-block !important;
      vertical-align: middle !important;
      box-sizing: border-box !important;
      cursor: pointer !important;
      transition: opacity 0.2s ease !important;
    `;
    
    // Add hover effect
    button.onmouseenter = () => button.style.opacity = '0.9';
    button.onmouseleave = () => button.style.opacity = '1';
    
    button.addEventListener('click', () => this.extractAndSave());
    
    // Strategy 1: Try to insert after the flex container
    const displayFlexContainer = saveButton.closest('.display-flex');
    if (displayFlexContainer && displayFlexContainer.parentElement) {
      displayFlexContainer.insertAdjacentElement('afterend', button);
      console.log('✅ Button added successfully');
      return true;
    }
    
    // Strategy 2: Insert in the same parent as save button
    const saveButtonParent = saveButton.parentElement;
    if (saveButtonParent) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display: inline-block; margin-left: 8px;';
      wrapper.appendChild(button);
      saveButtonParent.appendChild(wrapper);
      console.log('✅ Button added (fallback method)');
      return true;
    }
    
    console.log('❌ Could not find container for button');
    return false;
  }

  // Extract LinkedIn Job ID from URL
  extractJobId(url) {
    if (!url) return null;
    
    // Match pattern: /jobs/view/123456
    const match = url.match(/\/jobs\/view\/(\d+)/);
    
    if (match && match[1]) {
      console.log('✅ Job ID extracted:', match[1]);
      return match[1]; // Returns just the ID: "123456"
    }
    
    console.log('❌ No job ID found in URL:', url);
    return null;
  }

  extractJobData() {
    console.log('Extracting job data...');
    
    // Get constants safely
    const constants = getConstants();
    if (!constants) {
      console.error('❌ Constants not available yet');
      return null;
    }
    
    let jobUrl = this.extractJobURL(window.location.href);
    if (!jobUrl) jobUrl = window.location.href;
    
    // Extract LinkedIn Job ID for duplicate detection
    const linkedinJobId = this.extractJobId(jobUrl);
    console.log('LinkedIn Job ID:', linkedinJobId);
    
    const currentTimestamp = new Date().toLocaleString();
    const jobDetails = this.extractJobDetails();

    const data = {
      // Core job information
      position: this.extractJobposition(),
      company: this.extractCompanyName(),
      location: this.extractLocation(),

      jobType: jobDetails.jobType,
      salary: jobDetails.salary,
      experienceLevel: jobDetails.experienceLevel,
      workArrangement: jobDetails.workArrangement,
      
      // Skills and keywords
      keywords: this.extractKeywords(),
      
      // Metadata
      url: jobUrl,
      linkedinJobId: linkedinJobId, // for duplicate detection
      extractedAt: currentTimestamp,
        
      // Application tracking fields
      applicationStatus: constants.JOB_STATUS.APPLIED,
      applicationDate: new Date().toISOString().split('T')[0],
      notes: '',
      priority: constants.PRIORITY_LEVELS.NORMAL,
      
      // User identification
      userId: this.userId
    };

    this.jobData = data;
    console.log('Job data extracted:', data);
    return data;
  }

  extractJobURL(currentUrl) {
    // Check current URL first
    if (currentUrl.includes('/jobs/view/')) {
      const match = currentUrl.match(/\/jobs\/view\/\d+/);
      if (match) {
        return `https://www.linkedin.com${match[0]}`;
      }
    }
    
    // Find any link with /jobs/view/ in href
    const link = document.querySelector('a[href*="/jobs/view/"]');
    if (link) {
      const href = link.getAttribute('href');
      const parts = href.split('/');
      const viewIndex = parts.indexOf('view');
      
      if (viewIndex !== -1 && parts[viewIndex + 1]) {
        const idPart = parts[viewIndex + 1].split('?')[0];
        const jobId = idPart.match(/\d+/);
        
        if (jobId) {
          const cleanUrl = `https://www.linkedin.com/jobs/view/${jobId[0]}`;
          return cleanUrl;
        }
      }
    }
    
    console.log('No job URL found');
    return null;
  }

  extractJobposition() {
    const link = document.querySelector('a[href*="/jobs/view/"]');
    if (link && link.textContent.trim()) {
      const position = link.textContent.trim();
      return position;
    }
    
    const selectors = [
      'h1.job-details-jobs-unified-top-card__job-title',
      'h1.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card__job-title h1',
      'h1[class*="job-title"]',
      '.jobs-unified-top-card__job-title h1'
    ];
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const element = document.querySelector(selector);
      
      if (element && element.textContent.trim()) {
        const position = element.textContent.trim();
        console.log('✓ SUCCESS - position found:', position);
        return position;
      }
    }
    
    console.log('All selectors failed - returning fallback');
    return 'Job position Not Found';
  }

  extractCompanyName() {
    const selectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      'a[data-test-id="job-company-name"]'
    ];
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const element = document.querySelector(selector);
      
      if (element && element.textContent.trim()) {
        const company = element.textContent.trim();
        return company;
      }
    }
    
    console.log('All selectors failed - returning fallback');
    return 'Company Not Found';
  }

  extractLocation() {
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
      '.jobs-unified-top-card__primary-description .tvm__text',
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet'
    ];
    
    for (const selector of locationSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        
        if (text.includes(',') && text.length < 50) {
          const parts = text.split(',');
          if (parts.length === 2 && parts[1].trim().length === 2) {
            return text;
          }
        }
      }
    }
    
    return 'Location Not Found';
  }

  // Extract all job details using SYNONYMS from constants
  extractJobDetails() {
    const constants = window.JobTrackerConstants;
    if (!constants) {
      return {
        jobType: 'Not specified',
        workArrangement: 'Not specified',
        experienceLevel: 'Not specified',
        salary: ''
      };
    }
    const result = {
      jobType: constants.JOB_TYPES.NOT_SPECIFIED,
      workArrangement: constants.WORK_ARRANGEMENTS.NOT_SPECIFIED,
      experienceLevel: constants.EXPERIENCE_LEVELS.NOT_SPECIFIED,
      salary: ''
    };

    // Single query for preference buttons
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    for (const button of preferenceButtons) {
      const text = (button.textContent || '').trim().toLowerCase();
      
      // ========== JOB TYPE ==========
      if (result.jobType === constants.JOB_TYPES.NOT_SPECIFIED) {
        for (const [typeKey, synonyms] of Object.entries(constants.JOB_TYPE_SYNONYMS || {})) {
          if (synonyms.some(syn => text.includes(syn))) {
            result.jobType = constants.JOB_TYPES[typeKey];
            break;
          }
        }
      }

      // ========== WORK ARRANGEMENT ==========
      if (result.workArrangement === constants.WORK_ARRANGEMENTS.NOT_SPECIFIED) {
        for (const [arrangementKey, synonyms] of Object.entries(constants.WORK_ARRANGEMENT_SYNONYMS || {})) {
          if (synonyms.some(syn => text.includes(syn))) {
            result.workArrangement = constants.WORK_ARRANGEMENTS[arrangementKey];
            break;
          }
        }
      }

      // ========== SALARY ==========
      if (!result.salary && /\$[\d,]+[Kk]?/.test(text)) {
        result.salary = (button.textContent || '').trim();
      }

      // ========== EXPERIENCE LEVEL ==========
      if (result.experienceLevel === constants.EXPERIENCE_LEVELS.NOT_SPECIFIED) {
        for (const [levelKey, synonyms] of Object.entries(constants.EXPERIENCE_SYNONYMS || {})) {
          if (synonyms.some(syn => text.includes(syn))) {
            result.experienceLevel = constants.EXPERIENCE_LEVELS[levelKey];
            break;
          }
        }
      }
    }

    // Second pass: check job insight sections if we missed anything
    const selectors = constants.SELECTORS?.INSIGHT_TEXT || [
      '.job-details-jobs-unified-top-card__job-insight .tvm__text',
      '.jobs-unified-top-card__job-insight .tvm__text'];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = (element.textContent || '').toLowerCase().trim();

        // Fill in missing job type
        if (result.jobType === constants.JOB_TYPES.NOT_SPECIFIED) {
          for (const [typeKey, synonyms] of Object.entries(constants.JOB_TYPE_SYNONYMS || {})) {
            if (synonyms.some(syn => text.includes(syn))) {
              result.jobType = constants.JOB_TYPES[typeKey];
              break;
            }
          }
        }

        // Fill in missing salary
        if (!result.salary && /\$[\d,]+[Kk]?/.test(text)) {
          result.salary = (element.textContent || '').trim();
        }
      }
    }

    // Third pass: Check page text and position
    const pageText = (document.body.textContent || '').toLowerCase();
    const position = this.extractJobposition().toLowerCase();

    // ========== WORK ARRANGEMENT (from page text) ==========
    if (result.workArrangement === constants.WORK_ARRANGEMENTS.NOT_SPECIFIED) {
      for (const [arrangementKey, synonyms] of Object.entries(constants.WORK_ARRANGEMENT_SYNONYMS || {})) {
        if (synonyms.some(syn => pageText.includes(syn))) {
          result.workArrangement = constants.WORK_ARRANGEMENTS[arrangementKey];
          break;
        }
      }
    }

    // ========== EXPERIENCE LEVEL (from position title) ==========
    if (result.experienceLevel === constants.EXPERIENCE_LEVELS.NOT_SPECIFIED) {
      for (const [levelKey, synonyms] of Object.entries(constants.EXPERIENCE_SYNONYMS || {})) {
        if (synonyms.some(syn => position.includes(syn))) {
          result.experienceLevel = constants.EXPERIENCE_LEVELS[levelKey];
          break;
        }
      }
    }

    // Fallback: check page text for experience level
    if (result.experienceLevel === constants.EXPERIENCE_LEVELS.NOT_SPECIFIED) {
      for (const [levelKey, synonyms] of Object.entries(constants.EXPERIENCE_SYNONYMS || {})) {
        if (synonyms.some(syn => pageText.includes(syn))) {
          result.experienceLevel = constants.EXPERIENCE_LEVELS[levelKey];
          break;
        }
      }
    }

    return result;
  }


  extractKeywords() {
    const constants = window.JobTrackerConstants;
    if (!constants) return {};

    const keywords = new Set();
    const pattern = new RegExp(`\\b(${constants.TECHNICAL_TERMS.join('|')})\\b`, 'gi');
    
    const content = document.querySelector('.jobs-description-content__text, .jobs-box__html-content');
    if (content) {
      const matches = content.textContent.match(pattern);
      if (matches) {
        matches.forEach(term => {
          const normalized = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
          keywords.add(normalized);
        });
      }
    }
    
    const position = this.extractJobposition();
    if (position !== 'Job position Not Found') {
      position.split(/[\s,\-\(\)]+/).forEach(word => {
        const cleaned = word.replace(/[!.?]/g, '').trim();
        if (cleaned.length > 2 && !(constants.COMMON_WORDS.includes(word.toLowerCase()))) {
          keywords.add(cleaned);
        }
      });
    }
  
    return Array.from(keywords);
  }

  async extractAndSave() {
    console.log('Extract and save triggered...');
    
    if (!this.userId) {
      this.showNotification('⚠️ Please set your User ID in the extension popup first!');
      return;
    }

    const constants = getConstants();
    if (!constants) {
      this.showNotification('❌ Extension not fully initialized. Refresh the page and try again.');
      return;
    }

    const data = this.extractJobData();
    if (!data) {
      this.showNotification('❌ Could not extract job data.');
      return;
    }

    await this.saveToServer(data, constants);
  }

  // Handle duplicate detection responses from server
  async saveToServer(data, constants) {
    try {
      console.log('Sending job to server:', data);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: data.userId,
          linkedinJobId: data.linkedinJobId, // Send LinkedIn Job ID
          company: data.company,
          position: data.position,
          location: data.location,
          salary: data.salary,
          jobUrl: data.url,
          status: data.applicationStatus || constants.JOB_STATUS.APPLIED,
          dateApplied: data.applicationDate,
          notes: data.notes || '',
          priority: data.priority || constants.PRIORITY_LEVELS.NORMAL,
          technicalDetails: data.keywords || [],
          jobType: data.jobType || constants.JOB_TYPES.NOT_SPECIFIED,
          experienceLevel: data.experienceLevel || constants.EXPERIENCE_LEVELS.NOT_SPECIFIED,
          workArrangement: data.workArrangement || constants.WORK_ARRANGEMENTS.NOT_SPECIFIED,
          contactPerson: '',
          followUpDate: null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Job saved to server!', result);
        
        // Different messages for update vs new save
        if (result.isUpdate) {
          this.showNotification('📄 Job updated in tracker!');
        } else {
          this.showNotification('✅ Job saved to tracker!');
        }
        return true;
      } 
      else {
        console.error('❌ Server error:', result);
        
        const errorMsg = result.message || JSON.stringify(result) || 'Unknown error';
  
        if (result.isDuplicate) {
          this.showNotification('ℹ️ ' + errorMsg);
        } 
        else {
          this.showNotification('❌ Failed: ' + errorMsg);
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      this.showNotification('❌ Connection failed. Check your internet.');
      return false;
    }
  }

  showNotification(message, linkUrl = null, linkText = null) {
    const existingNotif = document.getElementById('job-tracker-notification');
    if (existingNotif) existingNotif.remove();

    const notification = document.createElement('div');
    notification.id = 'job-tracker-notification';
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: #0073b1 !important;
      color: white !important;
      padding: 14px 24px !important;
      border-radius: 8px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 4px 20px rgba(0, 115, 177, 0.4) !important;
      z-index: 10000 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
      ${linkUrl ? 'cursor: pointer !important;' : ''}
    `;
    
    notification.innerHTML = linkUrl 
      ? `${message} <span style="text-decoration: underline;">${linkText || 'View Dashboard'}</span>`
      : message;
    
    if (linkUrl) {
      notification.addEventListener('click', () => {
        window.open(linkUrl, '_blank');
        notification.remove();
      });
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 7000);
  }

  observeJobSelection() {
    let debounceTimer = null;
    let lastJobUrl = window.location.href;
    let isProcessing = false;
    
    const observer = new MutationObserver((mutations) => {
      if (isProcessing) return;
      
      const hasSignificantChange = mutations.some(mutation => {
        if (mutation.addedNodes.length > 0) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              if (node.classList?.contains('jobs-save-button') ||
                  node.classList?.contains('jobs-search__job-details--container') ||
                  node.classList?.contains('job-details-jobs-unified-top-card__container') ||
                  node.querySelector?.('.jobs-save-button')) {
                return true;
              }
            }
          }
        }
        return false;
      });
      
      const currentUrl = window.location.href;
      const urlChanged = currentUrl !== lastJobUrl;
      
      if (!hasSignificantChange && !urlChanged) {
        return;
      }
      
      if (urlChanged) {
        lastJobUrl = currentUrl;
        console.log('📄 URL changed:', currentUrl);
      }
      
      clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(() => {
        isProcessing = true;
        
        const saveButton = document.querySelector('.jobs-save-button');
        const existingButton = document.getElementById('job-tracker-extract-btn');
        
        if (saveButton && !existingButton && this.userId) {
          console.log('➕ Adding button to new job...');
          this.addExtractButton();
          this.extractJobData();
        } else if (existingButton && !saveButton) {
          console.log('🗑️ Removing orphaned button...');
          existingButton.remove();
        }
        
        isProcessing = false;
      }, 200);
    });

    const targetNode = document.querySelector('.jobs-search__job-details--container') || document.body;
    
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    console.log('✅ Observer initialized');
  }
}

// CRITICAL: Wait for constants before initializing - DO NOT PROCEED WITHOUT THEM
const waitForConstants = async () => {
  let attempts = 0;
  const maxAttempts = 100; // 10 seconds max
  
  while (!window.JobTrackerConstants && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }
  
  if (!window.JobTrackerConstants) {
    const errorMsg = '❌ CRITICAL: Constants failed to load. This is a manifest/loading order issue.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log('✅ Constants loaded successfully');
  return window.JobTrackerConstants;
};

// Initialize the extractor after constants are ready
(async () => {
  try {
    await waitForConstants();
    const jobExtractor = new LinkedInJobExtractor();
    window.jobExtractor = jobExtractor;
  } catch (error) {
    console.error('Failed to initialize Job Extractor:', error);
  }
})();

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received:', request);
  
  if (request.action === 'getCurrentJob') {
    const jobData = window.jobExtractor ? window.jobExtractor.extractJobData() : null;
    sendResponse({jobData: jobData});
  } else if (request.action === 'logDebugData') {
    console.log('%c=== JOB TRACKER DEBUG ===', 'color: blue; font-size: 16px; font-weight: bold;');
    console.log('User ID:', window.jobExtractor?.userId);
    console.log('Current Job Data:', window.jobExtractor?.extractJobData());
    
    chrome.storage.local.get(['savedJobs', 'userId'], (result) => {
      console.log('Storage User ID:', result.userId);
      console.log('Stored Jobs:', result.savedJobs);
      console.log('Total Jobs:', result.savedJobs?.length || 0);
    });
    
    sendResponse({success: true});
  }
});

console.log('Job Tracker content script loaded successfully');