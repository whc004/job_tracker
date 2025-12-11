const DEBUG_LOGGING = true;
const debugLog = (...args) => { if (DEBUG_LOGGING) console.log(...args); };
const debugError = (...args) => { if (DEBUG_LOGGING) console.error(...args); };
const debugWarn = (...args) => { if (DEBUG_LOGGING) console.warn(...args); };


// LinkedIn Job Extractor - Complete Fixed Version
debugLog('Job Tracker content script loading...');

// Wait for constants to be available
const getConstants = () => {
  if (typeof window.JobTrackerConstants === 'undefined') {
    debugWarn('JobTrackerConstants not yet available');
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
      debugLog('📄 URL changed:', lastUrl);
      
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
    debugLog('LinkedInJobExtractor initializing...');
    
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
          debugLog('✅ User ID loaded:', this.userId);
        } else {
          this.userId = null;
          debugLog('⚠️ No User ID set - user needs to configure it in popup');
        }
        resolve(this.userId);
      });
    });
  }

  waitForSaveButton(maxAttempts = 15) {
    let attempts = 0;
    
    const checkForButton = () => {
      attempts++;
      const saveButton = document.querySelector('.jobs-save-button') || document.querySelector('[data-view-name="job-save-button"]');
      const existingButton = document.getElementById('job-tracker-extract-btn');
      
      if (saveButton && !existingButton) {
        debugLog(`✅ Found save button on attempt ${attempts}`);
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
    debugLog('Setting up extractor...');
    
    // If no user ID, don't try to add button
    if (!this.userId) {
      debugLog('⏳ Waiting for user ID to be set before adding button...');
      
      // Listen for storage changes (user sets ID in popup)
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.userId) {
          this.userId = changes.userId.newValue;
          debugLog('✅ User ID updated via popup:', this.userId);
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
          debugLog(`Button add attempt ${attempt} failed, retrying...`);
          retryAddButton(attempt + 1, maxAttempts);
        } else if (success) {
          debugLog('✅ Button successfully added');
        } else {
          debugLog('⚠️ Failed to add button after all attempts');
        }
      }, delay);
    };
    
    retryAddButton();

    // Set up observers for dynamic content
    this.observeJobSelection();
  }

  addExtractButton() {
    // Check if button already exists - don't recreate it
    const existingButton = document.getElementById('job-tracker-extract-btn');
    if (existingButton) {
      debugLog('⭐️ Button already exists, skipping...');
      return true; // Button exists, success
    }

    // Try multiple possible container locations
    const saveButton = document.querySelector('.jobs-save-button') || document.querySelector('[data-view-name="job-save-button"]');
    if (!saveButton) {
      debugLog('⚠️ Save button not found, will retry...');
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
      debugLog('✅ Button added successfully');
      return true;
    }
    
    // Strategy 2: Insert in the same parent as save button
    const saveButtonParent = saveButton.parentElement;
    if (saveButtonParent) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display: inline-block; margin-left: 8px;';
      wrapper.appendChild(button);
      saveButtonParent.appendChild(wrapper);
      debugLog('✅ Button added (fallback method)');
      return true;
    }
    debugLog('🔍 saveButton:', saveButton);
    debugLog('🔍 saveButton.parentElement:', saveButton.parentElement);
    debugLog('🔍 displayFlexContainer:', saveButton.closest('.display-flex'));
    

    debugLog('❌ Could not find container for button');
    return false;
  }

  // Extract LinkedIn Job ID from URL
  extractJobId(url) {
    if (!url) return null;
    
    // Match pattern: /jobs/view/123456
    const match = url.match(/\/jobs\/view\/(\d+)/);
    
    if (match && match[1]) {
      debugLog('✅ Job ID extracted:', match[1]);
      return match[1]; // Returns just the ID: "123456"
    }
    
    debugLog('❌ No job ID found in URL:', url);
    return null;
  }

  extractJobData() {
    debugLog('Extracting job data...');
    
    // Get constants safely
    const constants = getConstants();
    if (!constants) {
      debugError('❌ Constants not available yet');
      return null;
    }
    
    let jobUrl = this.extractJobURL(window.location.href);
    if (!jobUrl) jobUrl = window.location.href;
    debugLog(' URL : ' + jobUrl);
    
    // Extract LinkedIn Job ID for duplicate detection
    const linkedinJobId = this.extractJobId(jobUrl);
    debugLog('LinkedIn Job ID:', linkedinJobId);
    
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
      applicationDate: new Date().toISOString(),
      notes: '',
      priority: constants.PRIORITY_LEVELS.NORMAL,
      
      // User identification
      userId: this.userId
    };

    this.jobData = data;
    debugLog('Job data extracted:', data);
    return data;
  }

  extractJobURL(currentUrl) {
    debugLog('🔍 Extracting job URL from:', currentUrl);
  
    // ========== PRIMARY: Check for currentJobId parameter (search results page) ==========
    const currentJobIdMatch = currentUrl.match(/currentJobId=(\d+)/);
    if (currentJobIdMatch && currentJobIdMatch[1]) {
      const jobId = currentJobIdMatch[1];
      const jobUrl = `https://www.linkedin.com/jobs/view/${jobId}`;
      debugLog('✅ Job URL from currentJobId:', jobUrl);
      return jobUrl;
    }
    
    // ========== SECONDARY: Check for /jobs/view/ in URL (direct job page) ==========
    if (currentUrl.includes('/jobs/view/')) {
      const match = currentUrl.match(/\/jobs\/view\/\d+/);
      if (match) {
        const jobUrl = `https://www.linkedin.com${match[0]}`;
        debugLog('✅ Job URL from /jobs/view/:', jobUrl);
        return jobUrl;
      }
    }
    
    // ========== TERTIARY: Fallback to DOM link (last resort) ==========
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
          debugLog('✅ Job URL from DOM link:', cleanUrl);
          return cleanUrl;
        }
      }
    }
    
    debugLog('❌ No job URL found');
    return null;
  }

  extractJobposition() {
    debugLog('🔍 Extracting job position...');
    
    // Helper function to clean position text
    const cleanPosition = (text) => {
      if (!text) return '';
      // Remove extra whitespace and newlines
      text = text.trim();
      // Split by newline and take only the first meaningful line
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length > 0) {
        return lines[0];
      }
      return text;
    };
    debugLog(' Go PRIMARY ');
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
        const position = cleanPosition(element.textContent);
        if (position && position.length > 0) {
          debugLog('✅ Position from selector:', position);
          return position;
        }
      }
    }
    
    debugLog(' Go SECONDARY ');
    const link = document.querySelector('a[href*="/jobs/view/"]');
    if (link && link.textContent.trim()) {
      const position = cleanPosition(link.textContent);
      if (position && position.length > 0) {
        debugLog('✅ Position from link:', position);
        return position;
      }
    }
    
    debugLog('❌ All selectors failed - returning fallback');
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
    
    debugLog('All selectors failed - returning fallback');
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
      /*
      if (!result.salary) {
        const salaryMatch = button.textContent.match( /\$[\d,]+(?:\.\d{1,2})?[Kk]?\/(?:yr|year|hr)\s*-\s*\$[\d,]+(?:\.\d{1,2})?[Kk]?\/(?:yr|year|hr)|\$[\d,]+(?:\.\d{1,2})?[Kk]?\s*-\s*\$[\d,]+(?:\.\d{1,2})?[Kk]?|\$[\d,]+(?:\.\d{1,2})?[Kk]?\/(?:yr|year|hr)|\$[\d,]+(?:\.\d{1,2})?[Kk]?/ );
        
        if (salaryMatch) {
          result.salary = salaryMatch[0].trim();
          debugLog('✅ Salary found (preference button):', result.salary);
        }
      }
        */
       

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
        /*
        // Fill in missing salary
        if (!result.salary) {
          const salaryMatch = element.textContent.match(/\$[\d,]+(?:\.\d{1,2})?\/(?:yr|year|hr)\s*-\s*\$[\d,]+(?:\.\d{1,2})?\/(?:yr|year|hr)|\$[\d,]+(?:\.\d{1,2})?[Kk]?\s*-\s*\$[\d,]+(?:\.\d{1,2})?[Kk]?|\$[\d,]+(?:\.\d{1,2})?\/(?:yr|year|hr)|\$[\d,]+(?:\.\d{1,2})?[Kk]?/);
          
          if (salaryMatch) {
            result.salary = salaryMatch[0].trim();
            debugLog('✅ Salary found ( second button):', result.salary);
          }
        }
          */
      }
    }

    // Third pass: Check page text and position
    const pageText = (document.body.textContent || '').toLowerCase();
    const position = this.extractJobposition().toLowerCase();

    const desc = document.querySelector('.jobs-description-content__text') || 
             document.querySelector('.jobs-box__html-content') ||
             document.querySelector('.jobs-description__content');

    console.log('Job description element found:', desc);
    console.log('Job description text:', desc?.innerText?.substring(0, 500) + '...');

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
    debugLog('Extract and save triggered...');
    
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
      debugLog('Sending job to server:', data);
      
      const response = await fetch(constants.API_BASE_URL, {
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
        debugLog('✅ Job saved to server!', result);
        
        // Different messages for update vs new save
        if (result.isUpdate) {
          this.showNotification('📄 Job updated in tracker!');
        } else {
          this.showNotification('✅ Job saved to tracker!');
        }
        return true;
      } 
      else {
        debugError('❌ Server error:', result);
        
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
      debugError('❌ Network error:', error);
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
        debugLog('📄 URL changed:', currentUrl);
      }
      
      clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(() => {
        isProcessing = true;
        
        const saveButton = document.querySelector('.jobs-save-button') || document.querySelector('[data-view-name="job-save-button"]');
        const existingButton = document.getElementById('job-tracker-extract-btn');
        
        if (saveButton && !existingButton && this.userId) {
          debugLog('➕ Adding button to new job...');
          this.addExtractButton();
        } 
        debugLog('🔄 Refreshing job snapshot...');

        
        if (existingButton && !saveButton) {
          debugLog('🗑️ Removing orphaned button...');
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
    
    debugLog('✅ Observer initialized');
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
    debugError(errorMsg);
    throw new Error(errorMsg);
  }
  
  debugLog('✅ Constants loaded successfully');
  return window.JobTrackerConstants;
};

// Initialize the extractor after constants are ready
(async () => {
  try {
    await waitForConstants();
    const jobExtractor = new LinkedInJobExtractor();
    window.jobExtractor = jobExtractor;
  } catch (error) {
    debugError('Failed to initialize Job Extractor:', error);
  }
})();

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  debugLog('Message received:', request);

  if (request.action === 'getCurrentJob') {
    const jobData = window.jobExtractor ? window.jobExtractor.extractJobData() : null;
    sendResponse({jobData: jobData});
  } else if (request.action === 'getJobDescription') {
    // Extract job description for AI analysis (using same selectors as extractKeywords)
    try {
      const descriptionElement = document.querySelector('.jobs-description-content__text') ||
                                 document.querySelector('.jobs-box__html-content') ||
                                 document.querySelector('.jobs-description__content') ||
                                 document.querySelector('[class*="job-details"]');

      if (descriptionElement) {
        const description = descriptionElement.innerText || descriptionElement.textContent;
        debugLog('📄 Job description extracted:', description.substring(0, 100) + '...');
        sendResponse({ success: true, description: description.trim() });
      } else {
        debugError('❌ Could not find job description element');
        sendResponse({ success: false, description: null });
      }
    } catch (error) {
      debugError('Error extracting job description:', error);
      sendResponse({ success: false, description: null });
    }
  } else if (request.action === 'logDebugData') {
    debugLog('%c=== JOB TRACKER DEBUG ===', 'color: blue; font-size: 16px; font-weight: bold;');
    debugLog('User ID:', window.jobExtractor?.userId);
    debugLog('Current Job Data:', window.jobExtractor?.extractJobData());

    chrome.storage.local.get(['savedJobs', 'userId'], (result) => {
      debugLog('Storage User ID:', result.userId);
      debugLog('Stored Jobs:', result.savedJobs);
      debugLog('Total Jobs:', result.savedJobs?.length || 0);
    });

    sendResponse({success: true});
  }

  return true; // Keep message channel open for async response
});

debugLog('Job Tracker content script loaded successfully');