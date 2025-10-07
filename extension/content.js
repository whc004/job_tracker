// LinkedIn Job Extractor - Complete Fixed Version
console.log('Job Tracker content script loading...');

// global variable for common keyword
const FRONTEND_URL = 'https://google.com';
const TECHNICAL_TERMS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 
  'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Objective-C', 'Dart', 'Elixir',
  
  // Frontend
  'React', 'Angular', 'Vue', 'Svelte', 'Next\\.js', 'Nuxt', 'HTML', 'CSS', 'SASS', 'SCSS', 
  'Tailwind', 'Bootstrap', 'jQuery', 'Webpack', 'Vite', 'Babel', 'Redux', 'MobX',
  
  // Backend/Frameworks
  'Node\\.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'ASP\\.NET', 'Rails', 
  'Laravel', 'NestJS', 'Gin', 'Fiber',
  
  // Databases
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 
  'DynamoDB', 'Oracle', 'SQLite', 'MariaDB', 'Neo4j', 'Snowflake',
  
  // Cloud/DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'CircleCI', 
  'Terraform', 'Ansible', 'CI/CD', 'DevOps', 'Prometheus', 'Grafana', 'ELK',
  
  // Data Science/ML
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Keras', 'Spark', 
  'Hadoop', 'Airflow', 'Tableau', 'Power BI', 'Machine Learning', 'Deep Learning',
  'AI', 'Data Science', 'NLP', 'Computer Vision',
  
  // Mobile
  'iOS', 'Android', 'React Native', 'Flutter', 'SwiftUI', 'Jetpack Compose',
  
  // Tools & Practices
  'Git', 'GitHub', 'Jira', 'Confluence', 'Agile', 'Scrum', 'Kanban', 'API', 'REST', 
  'GraphQL', 'gRPC', 'Microservices', 'Linux', 'Bash', 'Shell',
  
  // Design
  'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InVision'
];

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
          console.log('User ID loaded:', this.userId);
        } else {
          this.userId = null;
          console.log('No User ID set - user needs to configure it in popup');
        }
        resolve(this.userId);
      });
    });
  }

  setupExtractor() {
    console.log('Setting up extractor...');
    
    // Add button with delay to ensure page is loaded
    setTimeout(() => this.addExtractButton(), 500);
    
    // Set up observers for dynamic content
    this.observeJobSelection();
    
    // Initial data extraction
    setTimeout(() => this.extractJobData(), 500);
  }

  addExtractButton() {
    const existingButton = document.getElementById('job-tracker-extract-btn');
    if (existingButton) existingButton.remove();

    const saveButton = document.querySelector('.jobs-save-button');
    if (!saveButton) return;
    
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
    `;
    
    button.addEventListener('click', () => this.extractAndSave());
    
    // Find the .display-flex parent and insert AFTER it, not inside it
    const displayFlexContainer = saveButton.closest('.display-flex');
    if (displayFlexContainer && displayFlexContainer.parentElement) {
      // Insert after the entire flex container
      displayFlexContainer.insertAdjacentElement('afterend', button);
      console.log('Button added after flex container');
    } else {
      // Fallback
      saveButton.parentElement.appendChild(button);
    }
  }

  extractJobData() {
    console.log('Extracting job data...');
    
    let jobUrl = this.extractJobURL(window.location.href);
    if (!jobUrl) jobUrl = window.location.href;
    const currentTimestamp = new Date().toISOString();
    
    const data = {
      // Core job information
      title: this.extractJobTitle(),
      company: this.extractCompanyName(),
      location: this.extractLocation(),
      jobType: this.extractJobType(),
      salary: this.extractSalary(),
      experienceLevel: this.extractExperienceLevel(),
      workArrangement: this.extractWorkArrangement(),
      
      // Skills and keywords
      // optional
      keywords: this.extractKeywords(),
      
      // Metadata
      url: jobUrl,
      extractedAt: currentTimestamp,
        
      // Application tracking fields
      applicationStatus: 'applied',
      applicationDate: new Date().toISOString().split('T')[0],
      notes: '',
      // optional
      priority: 'medium',
      
      // User identification
      userId: this.userId
    };

    this.jobData = data;
    console.log('Job data extracted:', data);
    return data;
  }

extractJobURL(currentUrl) {
  //console.log('=== Extracting Job URL ===');
  //console.log('Current URL:', currentUrl);
  
  // Check current URL first
  if (currentUrl.includes('/jobs/view/')) {
    const match = currentUrl.match(/\/jobs\/view\/\d+/);
    if (match) {
      return `https://www.linkedin.com${match[0]}`;
    }
  }
  
  // Find any link with /jobs/view/ in href
  const link = document.querySelector('a[href*="/jobs/view/"]');
  //console.log('link : ', link);
  if (link) {
    const href = link.getAttribute('href');
    // Split by "/" and find the job ID
    // href looks like: "/jobs/view/3711904257/?alternateChannel=..."
    const parts = href.split('/');
    const viewIndex = parts.indexOf('view');
    
    if (viewIndex !== -1 && parts[viewIndex + 1]) {
      // Get the ID (might have query params, so clean it)
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

extractJobTitle() {
  const link = document.querySelector('a[href*="/jobs/view/"]');
  if (link && link.textContent.trim()) {
    const title = link.textContent.trim();
    return title;
  }
  // if the title is not with the link
  const selectors = [
    'h1.job-details-jobs-unified-top-card__job-title',
    'h1.jobs-unified-top-card__job-title',
    '.job-details-jobs-unified-top-card__job-title h1',
    'h1[class*="job-title"]',
    '.jobs-unified-top-card__job-title h1'
  ];
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    console.log(`Trying selector ${i + 1}/${selectors.length}: ${selector}`);
    
    const element = document.querySelector(selector);
    
    if (element && element.textContent.trim()) {
      const title = element.textContent.trim();
      console.log('✓ SUCCESS - Title found:', title);
      console.log('Selector used:', selector);
      return title;
    } 
    else {
      console.log('✗ Failed - No element or empty text');
    }
  }
  
  console.log('All selectors failed - returning fallback');
  return 'Job Title Not Found';
}

extractCompanyName() {
  //console.log('=== Extracting Company Name ===');
  const selectors = [
    '.job-details-jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    'a[data-test-id="job-company-name"]'
  ];
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    //console.log(`Trying selector ${i + 1}/${selectors.length}: ${selector}`);
    
    const element = document.querySelector(selector);
    
    if (element && element.textContent.trim()) {
      const company = element.textContent.trim();
      //console.log('✓ SUCCESS - Company found:', company);
      //console.log('Selector used:', selector);
      return company;
    } else {
      console.log('✗ Failed - No element or empty text');
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
        
        // Check if it looks like a location (contains a comma and short words)
        if (text.includes(',') && text.length < 50) {
          // Simple validation: should have format like "City, ST"
          const parts = text.split(',');
          if (parts.length === 2 && parts[1].trim().length === 2) {
            //console.log('Found location:', text);
            return text;
          }
        }
      }
    }
    
    return 'Location Not Found';
  }

  extractJobType() {
    // Look in the preferences section first (most reliable)
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    
    for (const button of preferenceButtons) {
      const text = button.textContent.trim().toLowerCase();
      
      if (text.includes('full-time') || text.includes('full time')) return 'Full-time';
      if (text.includes('part-time') || text.includes('part time')) return 'Part-time';
      if (text.includes('contract')) return 'Contract';
      if (text.includes('temporary') || text.includes('temp')) return 'Temporary';
      if (text.includes('internship') || text.includes('intern')) return 'Internship';
    }
    
    // Fallback to other selectors
    const selectors = [
      '.job-details-jobs-unified-top-card__job-insight .tvm__text',
      '.jobs-unified-top-card__job-insight .tvm__text'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.toLowerCase().trim();
        
        if (text.includes('full-time') || text.includes('full time')) return 'Full-time';
        if (text.includes('part-time') || text.includes('part time')) return 'Part-time';
        if (text.includes('contract')) return 'Contract';
        if (text.includes('temporary') || text.includes('temp')) return 'Temporary';
        if (text.includes('intern') || text.includes('internship')) return 'Internship';
      }
    }
    
    return 'Not specified';
  }

  extractWorkArrangement() {
    // Check the preferences section first
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    
    for (const button of preferenceButtons) {
      const text = button.textContent.trim().toLowerCase();
      
      if (text === 'remote' || text === 'fully remote') return 'Remote';
      if (text === 'hybrid') return 'Hybrid';
      if (text === 'on-site' || text === 'onsite') return 'On-site';
    }
    
    // Fallback to page text search
    const pageText = document.body.textContent.toLowerCase();
    
    if (pageText.includes('fully remote') || pageText.includes('100% remote')) return 'Remote';
    if (pageText.includes('hybrid')) return 'Hybrid';
    if (pageText.includes('on-site') || pageText.includes('onsite')) return 'On-site';
    
    return 'Not specified';
  }

  extractSalary() {
    // Check the preferences section first - most accurate
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    // Match salary patterns like: $50K, $150,000, $75k, $100K/yr
    // \$ - literal dollar sign
    // [\d,]+ - one or more digits or commas (handles: 50000 or 50,000)
    // [Kk]? - optional K or k for thousands (handles: $50K or $50000)
    // (/\$[\d,]+[Kk]?/.test(text)) 
    for (const button of preferenceButtons) {
      const text = button.textContent.trim();
      // Check if it contains salary pattern
      if (/\$[\d,]+[Kk]?/.test(text)) {
        return text;
      }
    }
    
    // Fallback to other locations
    const selectors = [
      '.job-details-jobs-unified-top-card__job-insight .tvm__text',
      '.jobs-unified-top-card__job-insight .tvm__text'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        if (/\$[\d,]+[Kk]?/.test(text)) {
          return text;
        }
      }
    }
    
    return 'Not specified';
  }

  extractExperienceLevel() {
    // Check preferences section first (most reliable)
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    
    for (const button of preferenceButtons) {
      const text = button.textContent.trim().toLowerCase();
      
      if (text.includes('entry level') || text.includes('junior')) return 'Entry Level';
      if (text.includes('senior') || text.includes('lead')) return 'Senior Level';
      if (text.includes('mid level') || text.includes('mid-level')) return 'Mid Level';
      if (text.includes('director') || text.includes('principal')) return 'Executive Level';
    }
    
    // Fallback: check job title for experience indicators
    const title = this.extractJobTitle().toLowerCase();
    if (title.includes('senior') || title.includes('sr.') || title.includes('staff')) return 'Senior Level';
    if (title.includes('junior') || title.includes('jr.')) return 'Entry Level';
    if (title.includes('lead') || title.includes('principal')) return 'Senior Level';
    if (title.includes('director')) return 'Executive Level';
    if (title.includes('intern')) return 'Entry Level';
    
    return 'Not specified';
  }

  extractKeywords() {
    const keywords = new Set();
    
    // Create regex pattern from technical terms
    const pattern = new RegExp(`\\b(${TECHNICAL_TERMS.join('|')})\\b`, 'gi');
    
    // Extract from job description
    const content = document.querySelector('.jobs-description-content__text, .jobs-box__html-content');
    if (content) {
      const matches = content.textContent.match(pattern);
      if (matches) {
        // Normalize case (capitalize first letter for consistency)
        matches.forEach(term => {
          const normalized = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
          keywords.add(normalized);
        });
      }
    }
    
    // Extract meaningful words from title (exclude common words and company names)
    const title = this.extractJobTitle();
    if (title !== 'Job Title Not Found') {
      title.split(/[\s,\-\(\)]+/).forEach(word => {
        // Remove punctuation like !, ., ?
        const cleaned = word.replace(/[!.?]/g, '').trim();
        // Only add if length > 2 and not a common word
        if (cleaned.length > 2 && !this.isCommonWord(cleaned)) {
          keywords.add(cleaned);
        }
      });
    }
  
    // Return all unique keywords
    return Array.from(keywords);
  }

  isCommonWord(word) {
    const commonWords = [
      'the', 'and', 'for', 'with', 'you', 'are', 'will', 'have', 'this', 'that', 
      'our', 'we', 'all', 'can', 'your', 'from', 'not', 'but', 'Inc', 'LLC', 'Ltd'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  async extractAndSave() {
    console.log('Extract and save triggered...');
    
    // Check if user ID is set
    if (!this.userId) {
      this.showNotification('⚠️ Please set your User ID in the extension popup first!');
      return;
    }
    
    const data = this.extractJobData();
    
    // Save to local storage
    await this.saveToLocal(data);
  }

  async saveToLocal(data) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['savedJobs'], (result) => {
        const savedJobs = result.savedJobs || [];
        
        // Check for duplicates
        const exists = savedJobs.some(job => job.url === data.url);
        
        if (!exists) {
          savedJobs.push(data);
          chrome.storage.local.set({ savedJobs }, () => {
            console.log('Job saved locally:', data);
            this.showNotification('✅ Job saved to tracker! Click to view', FRONTEND_URL);
            
            // Notify popup to refresh
            chrome.runtime.sendMessage({ action: 'jobSaved' }).catch(() => {
              // Ignore errors if popup is closed
            });
            
            resolve(true);
          });
        } else {
          this.showNotification('ℹ️ Job already saved');
          resolve(false);
        }
      });
    });
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
    }, 7000); // Slightly longer since it's interactive
  }

  observeJobSelection() {
    const observer = new MutationObserver(() => {
      const jobDetails = document.querySelector('.jobs-search__job-details--container, .job-details-jobs-unified-top-card__container');
      if (jobDetails) {
        setTimeout(() => {
          this.addExtractButton();
          this.extractJobData();
        }, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize the extractor
const jobExtractor = new LinkedInJobExtractor();
window.jobExtractor = jobExtractor;

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received:', request);
  
  if (request.action === 'getCurrentJob') {
    const jobData = jobExtractor.extractJobData();
    sendResponse({jobData: jobData});
  } else if (request.action === 'logDebugData') {
    console.log('%c=== JOB TRACKER DEBUG ===', 'color: blue; font-size: 16px; font-weight: bold;');
    console.log('User ID:', jobExtractor.userId);
    console.log('Current Job Data:', jobExtractor.extractJobData());
    
    chrome.storage.local.get(['savedJobs', 'userId'], (result) => {
      console.log('Storage User ID:', result.userId);
      console.log('Stored Jobs:', result.savedJobs);
      console.log('Total Jobs:', result.savedJobs?.length || 0);
    });
    
    sendResponse({success: true});
  }
});

console.log('Job Tracker content script loaded successfully');