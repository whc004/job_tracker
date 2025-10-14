// THIS IS A COPY OF ../shared-constants.js
// Edit the root file and run: cp ../shared-constants.js 

// ==================== JOB STATUS ====================
const JOB_STATUS = {
  APPLIED: 'Applied',
  INTERVIEW_ROUND_1: 'Interview - Round 1',
  INTERVIEW_ROUND_2: 'Interview - Round 2',
  INTERVIEW_ROUND_3: 'Interview - Round 3',
  INTERVIEW_ROUND_4: 'Interview - Round 4',
  INTERVIEW_ROUND_5_TO_10: 'Interview - Round 5-10',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  NO_RESPONSE: 'No Response'
};

const STATUS_OPTIONS = [
  JOB_STATUS.APPLIED,
  JOB_STATUS.INTERVIEW_ROUND_1,
  JOB_STATUS.INTERVIEW_ROUND_2,
  JOB_STATUS.INTERVIEW_ROUND_3,
  JOB_STATUS.INTERVIEW_ROUND_4,
  JOB_STATUS.INTERVIEW_ROUND_5_TO_10,
  JOB_STATUS.OFFER,
  JOB_STATUS.REJECTED,
  JOB_STATUS.NO_RESPONSE
];

const INTERVIEW_STATUSES = [
  JOB_STATUS.INTERVIEW_ROUND_1,
  JOB_STATUS.INTERVIEW_ROUND_2,
  JOB_STATUS.INTERVIEW_ROUND_3,
  JOB_STATUS.INTERVIEW_ROUND_4,
  JOB_STATUS.INTERVIEW_ROUND_5_TO_10
];


// Status colors for UI (for client and extension)
const STATUS_COLORS = {
  [JOB_STATUS.APPLIED]: '#3b82f6', // blue
  [JOB_STATUS.INTERVIEW_ROUND_1]: '#8b5cf6', // purple
  [JOB_STATUS.INTERVIEW_ROUND_2]: '#8b5cf6',
  [JOB_STATUS.INTERVIEW_ROUND_3]: '#8b5cf6',
  [JOB_STATUS.INTERVIEW_ROUND_4]: '#8b5cf6',
  [JOB_STATUS.INTERVIEW_ROUND_5_TO_10]: '#8b5cf6',
  [JOB_STATUS.OFFER]: '#10b981', // green
  [JOB_STATUS.REJECTED]: '#ef4444', // red
  [JOB_STATUS.NO_RESPONSE]: '#6b7280' // gray
};

// ==================== PRIORITY LEVELS (SIMPLIFIED) ====================
const PRIORITY_LEVELS = {
  NORMAL: 'Normal',
  STAR: 'Star'
};

const PRIORITY_OPTIONS = [
  PRIORITY_LEVELS.NORMAL,
  PRIORITY_LEVELS.STAR
];

const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.NORMAL]: '#6b7280', // gray
  [PRIORITY_LEVELS.STAR]: '#fbbf24' // yellow/gold star
};

const PRIORITY_ICONS = {
  [PRIORITY_LEVELS.NORMAL]: '○',
  [PRIORITY_LEVELS.STAR]: '★'
};

// ==================== JOB TYPES ====================
const JOB_TYPES = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
  TEMPORARY: 'Temporary'
};

const JOB_TYPE_OPTIONS = [
  JOB_TYPES.FULL_TIME,
  JOB_TYPES.PART_TIME,
  JOB_TYPES.CONTRACT,
  JOB_TYPES.INTERNSHIP,
  JOB_TYPES.FREELANCE,
  JOB_TYPES.TEMPORARY
];

// ==================== WORK ARRANGEMENT ====================
const WORK_ARRANGEMENTS = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ON_SITE: 'On-site'
};

const WORK_ARRANGEMENT_OPTIONS = [
  WORK_ARRANGEMENTS.REMOTE,
  WORK_ARRANGEMENTS.HYBRID,
  WORK_ARRANGEMENTS.ON_SITE
];

// ==================== EXPERIENCE LEVELS ====================
const EXPERIENCE_LEVELS = {
  ENTRY: 'Entry level',
  ASSOCIATE: 'Associate',
  MID_SENIOR: 'Mid-Senior level',
  DIRECTOR: 'Director',
  EXECUTIVE: 'Executive',
  INTERNSHIP: 'Internship'
};

const EXPERIENCE_LEVEL_OPTIONS = [
  EXPERIENCE_LEVELS.INTERNSHIP,
  EXPERIENCE_LEVELS.ENTRY,
  EXPERIENCE_LEVELS.ASSOCIATE,
  EXPERIENCE_LEVELS.MID_SENIOR,
  EXPERIENCE_LEVELS.DIRECTOR,
  EXPERIENCE_LEVELS.EXECUTIVE
];

// ==================== TECHNICAL KEYWORDS ====================
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

// ==================== TIMEZONES ====================
// Common timezones for job applications
const TIMEZONES = {
  // US Timezones
  US_PACIFIC: 'America/Los_Angeles',
  US_MOUNTAIN: 'America/Denver',
  US_CENTRAL: 'America/Chicago',
  US_EASTERN: 'America/New_York',
  
  // International Timezones
  UTC: 'UTC',
  LONDON: 'Europe/London',
  PARIS: 'Europe/Paris',
  TOKYO: 'Asia/Tokyo',
  SYDNEY: 'Australia/Sydney',
  SHANGHAI: 'Asia/Shanghai',
  SINGAPORE: 'Asia/Singapore',
  HONG_KONG: 'Asia/Hong_Kong',
  DUBAI: 'Asia/Dubai',
  MUMBAI: 'Asia/Kolkata',
  SEOUL: 'Asia/Seoul',
  TORONTO: 'America/Toronto',
  SAO_PAULO: 'America/Sao_Paulo'
};

// Timezone display names for dropdowns
const TIMEZONE_OPTIONS = [
  { value: TIMEZONES.US_PACIFIC, label: 'Pacific Time (PT) - Los Angeles', offset: 'UTC-8' },
  { value: TIMEZONES.US_MOUNTAIN, label: 'Mountain Time (MT) - Denver', offset: 'UTC-7' },
  { value: TIMEZONES.US_CENTRAL, label: 'Central Time (CT) - Chicago', offset: 'UTC-6' },
  { value: TIMEZONES.US_EASTERN, label: 'Eastern Time (ET) - New York', offset: 'UTC-5' },
  { value: TIMEZONES.UTC, label: 'UTC - Coordinated Universal Time', offset: 'UTC+0' },
  { value: TIMEZONES.LONDON, label: 'London (GMT/BST)', offset: 'UTC+0' },
  { value: TIMEZONES.PARIS, label: 'Paris (CET/CEST)', offset: 'UTC+1' },
  { value: TIMEZONES.DUBAI, label: 'Dubai (GST)', offset: 'UTC+4' },
  { value: TIMEZONES.MUMBAI, label: 'Mumbai (IST)', offset: 'UTC+5:30' },
  { value: TIMEZONES.SINGAPORE, label: 'Singapore (SGT)', offset: 'UTC+8' },
  { value: TIMEZONES.SHANGHAI, label: 'Shanghai (CST)', offset: 'UTC+8' },
  { value: TIMEZONES.HONG_KONG, label: 'Hong Kong (HKT)', offset: 'UTC+8' },
  { value: TIMEZONES.TOKYO, label: 'Tokyo (JST)', offset: 'UTC+9' },
  { value: TIMEZONES.SEOUL, label: 'Seoul (KST)', offset: 'UTC+9' },
  { value: TIMEZONES.SYDNEY, label: 'Sydney (AEDT/AEST)', offset: 'UTC+10' },
  { value: TIMEZONES.TORONTO, label: 'Toronto (ET)', offset: 'UTC-5' },
  { value: TIMEZONES.SAO_PAULO, label: 'São Paulo (BRT)', offset: 'UTC-3' }
];

// Helper function to get user's local timezone
const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// ==================== DASHBOARD URL ====================
const DASHBOARD_URL = 'https://your-dashboard.railway.app';

// ==================== API ENDPOINTS ====================
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const API_ENDPOINTS = {
  JOBS: '/api/jobs',
  JOB_BY_ID: (id) => `/api/jobs/${id}`,
  STATISTICS: '/api/statistics',
  CSV_IMPORT: '/api/csv/import',
  CSV_EXPORT: '/api/csv/export',
  CONSTANTS: '/api/constants'
};

// ==================== LOCAL STORAGE KEYS ====================
const STORAGE_KEYS = {
  USER_ID: 'jobtracker_user_id',
  THEME: 'jobtracker_theme',
  FILTERS: 'jobtracker_filters',
  SORT_PREFERENCE: 'jobtracker_sort',
  TIMEZONE: 'jobtracker_timezone'
};

// ==================== VALIDATION RULES ====================
const VALIDATION = {
  MIN_COMPANY_LENGTH: 1,
  MAX_COMPANY_LENGTH: 200,
  MIN_POSITION_LENGTH: 1,
  MAX_POSITION_LENGTH: 200,
  MIN_LOCATION_LENGTH: 1,
  MAX_LOCATION_LENGTH: 200,
  MAX_NOTES_LENGTH: 2000,
  MAX_SALARY_LENGTH: 100,
  URL_REGEX: /^https?:\/\/.+/
};

// ==================== DATE FORMATS ====================
const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  API: 'YYYY-MM-DD',
  FULL: 'MMMM DD, YYYY HH:mm:ss',
  TIME_ONLY: 'HH:mm',
  DATE_INPUT: 'YYYY-MM-DD' // for HTML date input
};

// ==================== EXPORT FOR DIFFERENT ENVIRONMENTS ====================

// For Node.js/Server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JOB_STATUS,
    STATUS_OPTIONS,
    STATUS_COLORS,
    INTERVIEW_STATUSES,
    PRIORITY_LEVELS,
    PRIORITY_OPTIONS,
    PRIORITY_COLORS,
    PRIORITY_ICONS,
    JOB_TYPES,
    JOB_TYPE_OPTIONS,
    WORK_ARRANGEMENTS,
    WORK_ARRANGEMENT_OPTIONS,
    EXPERIENCE_LEVELS,
    EXPERIENCE_LEVEL_OPTIONS,
    TECHNICAL_TERMS,
    TIMEZONES,
    TIMEZONE_OPTIONS,
    getUserTimezone,
    DASHBOARD_URL,
    API_BASE_URL,
    API_ENDPOINTS,
    STORAGE_KEYS,
    VALIDATION,
    DATE_FORMATS
  };
}

// For Chrome Extension
if (typeof window !== 'undefined') {
  window.JobTrackerConstants = {
    JOB_STATUS,
    STATUS_OPTIONS,
    STATUS_COLORS,
    INTERVIEW_STATUSES,
    PRIORITY_LEVELS,
    PRIORITY_OPTIONS,
    PRIORITY_COLORS,
    PRIORITY_ICONS,
    JOB_TYPES,
    JOB_TYPE_OPTIONS,
    WORK_ARRANGEMENTS,
    WORK_ARRANGEMENT_OPTIONS,
    EXPERIENCE_LEVELS,
    EXPERIENCE_LEVEL_OPTIONS,
    TECHNICAL_TERMS,
    TIMEZONES,
    TIMEZONE_OPTIONS,
    getUserTimezone,
    DASHBOARD_URL,
    API_BASE_URL,
    API_ENDPOINTS,
    STORAGE_KEYS,
    VALIDATION,
    DATE_FORMATS
  };
}