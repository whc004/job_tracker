// LinkedIn Job Extractor - Complete Fixed Version with Duplicate Detection
console.log('Job Tracker content script loading...');

// global variable for common keyword
const API_URL = 'https://jobtracker-production-2ed3.up.railway.app/api/applications';
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
    
    let jobUrl = this.extractJobURL(window.location.href);
    if (!jobUrl) jobUrl = window.location.href;
    
    // Extract LinkedIn Job ID for duplicate detection
    const linkedinJobId = this.extractJobId(jobUrl);
    console.log('LinkedIn Job ID:', linkedinJobId);
    
    const currentTimestamp = new Date().toISOString();
    
    const data = {
      // Core job information
      position: this.extractJobposition(),
      company: this.extractCompanyName(),
      location: this.extractLocation(),
      jobType: this.extractJobType(),
      salary: this.extractSalary(),
      experienceLevel: this.extractExperienceLevel(),
      workArrangement: this.extractWorkArrangement(),
      
      // Skills and keywords
      keywords: this.extractKeywords(),
      
      // Metadata
      url: jobUrl,
      linkedinJobId: linkedinJobId, // for duplicate detection
      extractedAt: currentTimestamp,
        
      // Application tracking fields
      applicationStatus: 'Applied',
      applicationDate: new Date().toISOString().split('T')[0],
      notes: '',
      priority: 'medium',
      
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

  extractJobType() {
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    
    for (const button of preferenceButtons) {
      const text = button.textContent.trim().toLowerCase();
      
      if (text.includes('full-time') || text.includes('full time')) return 'Full-time';
      if (text.includes('part-time') || text.includes('part time')) return 'Part-time';
      if (text.includes('contract')) return 'Contract';
      if (text.includes('temporary') || text.includes('temp')) return 'Temporary';
      if (text.includes('internship') || text.includes('intern')) return 'Internship';
    }
    
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
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    
    for (const button of preferenceButtons) {
      const text = button.textContent.trim().toLowerCase();
      
      if (text === 'remote' || text === 'fully remote') return 'Remote';
      if (text === 'hybrid') return 'Hybrid';
      if (text === 'on-site' || text === 'onsite') return 'On-site';
    }
    
    const pageText = document.body.textContent.toLowerCase();
    
    if (pageText.includes('fully remote') || pageText.includes('100% remote')) return 'Remote';
    if (pageText.includes('hybrid')) return 'Hybrid';
    if (pageText.includes('on-site') || pageText.includes('onsite')) return 'On-site';
    
    return 'Not specified';
  }

  extractSalary() {
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    
    for (const button of preferenceButtons) {
      const text = button.textContent.trim();
      if (/\$[\d,]+[Kk]?/.test(text)) {
        return text;
      }
    }
    
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
    const preferenceButtons = document.querySelectorAll('.job-details-fit-level-preferences .tvm__text strong');
    
    for (const button of preferenceButtons) {
      const text = button.textContent.trim().toLowerCase();
      
      if (text.includes('entry level') || text.includes('junior')) return 'Entry Level';
      if (text.includes('senior') || text.includes('lead')) return 'Senior Level';
      if (text.includes('mid level') || text.includes('mid-level')) return 'Mid Level';
      if (text.includes('director') || text.includes('principal')) return 'Executive Level';
    }
    
    const position = this.extractJobposition().toLowerCase();
    if (position.includes('senior') || position.includes('sr.') || position.includes('staff')) return 'Senior Level';
    if (position.includes('junior') || position.includes('jr.')) return 'Entry Level';
    if (position.includes('lead') || position.includes('principal')) return 'Senior Level';
    if (position.includes('director')) return 'Executive Level';
    if (position.includes('intern')) return 'Entry Level';
    
    return 'Not specified';
  }

  extractKeywords() {
    const keywords = new Set();
    
    const pattern = new RegExp(`\\b(${TECHNICAL_TERMS.join('|')})\\b`, 'gi');
    
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
        if (cleaned.length > 2 && !this.isCommonWord(cleaned)) {
          keywords.add(cleaned);
        }
      });
    }
  
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
    
    if (!this.userId) {
      this.showNotification('⚠️ Please set your User ID in the extension popup first!');
      return;
    }
    const data = this.extractJobData();
    await this.saveToServer(data);
  }

  // ⭐ UPDATED: Handle duplicate detection responses from server
  async saveToServer(data) {
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
          status: data.applicationStatus || 'Applied',
          dateApplied: data.applicationDate,
          notes: data.notes || '',
          priority: data.priority?.charAt(0).toUpperCase() + data.priority?.slice(1) || 'Medium',
          technicalDetails: data.keywords || [],
          jobType: data.jobType,
          experienceLevel: data.experienceLevel,
          workArrangement: data.workArrangement,
          contactPerson: '',
          followUpDate: null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Job saved to server!', result);
        
        // Different messages for update vs new save
        if (result.isUpdate) {
          this.showNotification('🔄 Job updated in tracker!');
        } else {
          this.showNotification('✅ Job saved to tracker!');
        }
        return true;
      } else {
        console.error('❌ Server error:', result);
        
        // Handle duplicate case with specific message
        if (result.isDuplicate) {
          this.showNotification('ℹ️ ' + result.message);
        } else {
          this.showNotification('❌ Failed to save: ' + (result.message || 'Unknown error'));
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