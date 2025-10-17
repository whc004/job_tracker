// THIS IS A COPY OF shared-constants.js

// ==================== JOB STATUS ====================
const JOB_STATUS = {
  APPLIED: 'Applied',
  INTERVIEW_ROUND_1: 'Interview - Round 1',
  INTERVIEW_ROUND_2: 'Interview - Round 2',
  INTERVIEW_ROUND_3: 'Interview - Round 3',
  INTERVIEW_ROUND_4: 'Interview - Round 4',
  INTERVIEW_ROUND_5: 'Interview - Round 5+',
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
  JOB_STATUS.INTERVIEW_ROUND_5,
  JOB_STATUS.OFFER,
  JOB_STATUS.REJECTED,
  JOB_STATUS.NO_RESPONSE
];

const INTERVIEW_STATUSES = [
  JOB_STATUS.INTERVIEW_ROUND_1,
  JOB_STATUS.INTERVIEW_ROUND_2,
  JOB_STATUS.INTERVIEW_ROUND_3,
  JOB_STATUS.INTERVIEW_ROUND_4,
  JOB_STATUS.INTERVIEW_ROUND_5
];

const STATUS_COLORS = {
  [JOB_STATUS.APPLIED]: '#3b82f6',
  [JOB_STATUS.INTERVIEW_ROUND_1]: '#8b5cf6',
  [JOB_STATUS.INTERVIEW_ROUND_2]: '#8b5cf6',
  [JOB_STATUS.INTERVIEW_ROUND_3]: '#8b5cf6',
  [JOB_STATUS.INTERVIEW_ROUND_4]: '#8b5cf6',
  [JOB_STATUS.INTERVIEW_ROUND_5]: '#8b5cf6',
  [JOB_STATUS.OFFER]: '#10b981',
  [JOB_STATUS.REJECTED]: '#ef4444',
  [JOB_STATUS.NO_RESPONSE]: '#6b7280'
};

// ==================== PRIORITY ====================
const PRIORITY_LEVELS = {
  NORMAL: 'Normal',
  STAR: 'Star'
};

const PRIORITY_OPTIONS = [PRIORITY_LEVELS.NORMAL, PRIORITY_LEVELS.STAR];

const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.NORMAL]: '#6b7280',
  [PRIORITY_LEVELS.STAR]: '#fbbf24'
};

const PRIORITY_ICONS = {
  [PRIORITY_LEVELS.NORMAL]: '○',
  [PRIORITY_LEVELS.STAR]: '★'
};

// ==================== JOB TYPES ====================
const JOB_TYPES = {
  NOT_SPECIFIED: 'Not specified',
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
  TEMPORARY: 'Temporary'
};

const JOB_TYPE_OPTIONS = [
  JOB_TYPES.NOT_SPECIFIED,
  JOB_TYPES.FULL_TIME,
  JOB_TYPES.PART_TIME,
  JOB_TYPES.CONTRACT,
  JOB_TYPES.INTERNSHIP,
  JOB_TYPES.FREELANCE,
  JOB_TYPES.TEMPORARY
];

// Synonyms used by extractors (lowercased)
const JOB_TYPE_SYNONYMS = {
  FULL_TIME: ['full-time', 'full time'],
  PART_TIME: ['part-time', 'part time'],
  CONTRACT: ['contract', 'contractor'],
  TEMPORARY: ['temporary', 'temp'],
  INTERNSHIP: ['internship', 'intern']
};

// ==================== WORK ARRANGEMENT ====================
const WORK_ARRANGEMENTS = {
  NOT_SPECIFIED: 'Not specified',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ON_SITE: 'On-site'
};

const WORK_ARRANGEMENT_OPTIONS = [
  WORK_ARRANGEMENTS.NOT_SPECIFIED,
  WORK_ARRANGEMENTS.REMOTE,
  WORK_ARRANGEMENTS.HYBRID,
  WORK_ARRANGEMENTS.ON_SITE
];

const WORK_ARRANGEMENT_SYNONYMS = {
  REMOTE: ['remote', 'fully remote', '100% remote', 'remote-first'],
  HYBRID: ['hybrid'],
  ON_SITE: ['on-site', 'onsite', 'on site']
};

// ==================== EXPERIENCE LEVELS ====================
const EXPERIENCE_LEVELS = {
  NOT_SPECIFIED: 'Not specified',
  ENTRY: 'Entry level',
  ASSOCIATE: 'Associate',
  MID_SENIOR: 'Mid-Senior level',
  DIRECTOR: 'Director',
  EXECUTIVE: 'Executive',
  INTERNSHIP: 'Internship'
};

const EXPERIENCE_LEVEL_OPTIONS = [
  EXPERIENCE_LEVELS.NOT_SPECIFIED,
  EXPERIENCE_LEVELS.INTERNSHIP,
  EXPERIENCE_LEVELS.ENTRY,
  EXPERIENCE_LEVELS.ASSOCIATE,
  EXPERIENCE_LEVELS.MID_SENIOR,
  EXPERIENCE_LEVELS.DIRECTOR,
  EXPERIENCE_LEVELS.EXECUTIVE
];

const EXPERIENCE_SYNONYMS = {
  INTERNSHIP: ['internship', 'intern'],
  ENTRY: ['entry level', 'entry-level', 'junior', 'jr', 'jr.'],
  ASSOCIATE: ['associate'],
  MID_SENIOR: ['mid level', 'mid-level', 'midlevel', 'mid', 'senior', 'sr', 'sr.', 'staff', 'lead', 'principal'],
  DIRECTOR: ['director'],
  EXECUTIVE: ['executive', 'vp', 'vice president', 'head', 'chief', 'cto', 'ceo', 'cpo', 'cso', 'cio']
};

// ==================== SELECTORS (LinkedIn DOM) ====================
// those items above apply btn
const SELECTORS = {
  PREFERENCE_STRONG: '.job-details-fit-level-preferences .tvm__text strong',
  INSIGHT_TEXT: [
    '.job-details-jobs-unified-top-card__job-insight .tvm__text',
    '.jobs-unified-top-card__job-insight .tvm__text',
    '.jobs-description-content__text',
    '.jobs-box__html-content'
  ]
};

// ==================== TECHNICAL TERMS / ROLES ====================
const TECHNICAL_TERMS = [
  'JavaScript','TypeScript','Python','Java','C\\+\\+','C#','Go','Rust','Ruby','PHP',
  'Swift','Kotlin','Scala','R','MATLAB','Perl','Objective-C','Dart','Elixir',
  'React','Angular','Vue','Svelte','Next\\.js','Nuxt','HTML','CSS','SASS','SCSS',
  'Tailwind','Bootstrap','jQuery','Webpack','Vite','Babel','Redux','MobX',
  'Node\\.js','Express','Django','Flask','FastAPI','Spring','ASP\\.NET','Rails',
  'Laravel','NestJS','Gin','Fiber',
  'SQL','PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','Cassandra',
  'DynamoDB','Oracle','SQLite','MariaDB','Neo4j','Snowflake',
  'AWS','Azure','GCP','Docker','Kubernetes','Jenkins','GitLab','CircleCI',
  'Terraform','Ansible','CI/CD','DevOps','Prometheus','Grafana','ELK',
  'TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','Keras','Spark',
  'Hadoop','Airflow','Tableau','Power BI','Machine Learning','Deep Learning',
  'AI','Data Science','NLP','Computer Vision',
  'iOS','Android','React Native','Flutter','SwiftUI','Jetpack Compose',
  'Git','GitHub','Jira','Confluence','Agile','Scrum','Kanban','API','REST',
  'GraphQL','gRPC','Microservices','Linux','Bash','Shell',
  'Figma','Sketch','Adobe XD','Photoshop','Illustrator','InVision'
];

const ROLE_TITLES = [
  'Manager','Engineering Manager','Product Manager','Project Manager','Program Manager','People Manager',
  'Software Engineer','Frontend Engineer','Backend Engineer','Full Stack Engineer',
  'Data Engineer','Machine Learning Engineer','DevOps Engineer','SRE','QA Engineer','Test Engineer','Mobile Engineer',
  'Team Lead','Tech Lead','Lead Engineer','Architect','Director','Head of Engineering','VP Engineering'
];

const KEYWORD_GROUPS = {
  TECHNICAL: TECHNICAL_TERMS,
  ROLES: ROLE_TITLES
};

// ==================== SALARY / WORD LISTS ====================
const SALARY_REGEX =
  '(?:usd?\\s*)?\\$?\\s?\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?\\s*(?:[kK])?(?:\\s*[-–—]\\s*(?:usd?\\s*)?\\$?\\s?\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?\\s*(?:[kK])?)?';

const COMMON_WORDS = [
  'the','and','for','with','you','are','will','have','this','that',
  'our','we','all','can','your','from','not','but','inc','llc','ltd',
  'of','to','in','on','at','by','as','a','an','or'
];

// ==================== TIMEZONES ====================
const TIMEZONES = {
  US_PACIFIC: 'America/Los_Angeles',
  US_MOUNTAIN: 'America/Denver',
  US_CENTRAL: 'America/Chicago',
  US_EASTERN: 'America/New_York',
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

// ==================== DASHBOARD / API ====================
const DASHBOARD_URL = 'https://job-tracker-gamma-three.vercel.app';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const API_ENDPOINTS = {
  JOBS: '/api/jobs',
  JOB_BY_ID: (id) => `/api/jobs/${id}`,
  STATISTICS: '/api/statistics',
  CSV_IMPORT: '/api/csv/import',
  CSV_EXPORT: '/api/csv/export',
  CONSTANTS: '/api/constants'
};

// ==================== STORAGE / VALIDATION / DATES ====================
const STORAGE_KEYS = {
  USER_ID: 'jobtracker_user_id',
  THEME: 'jobtracker_theme',
  FILTERS: 'jobtracker_filters',
  SORT_PREFERENCE: 'jobtracker_sort',
  TIMEZONE: 'jobtracker_timezone'
};

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

const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  API: 'YYYY-MM-DD',
  FULL: 'MMMM DD, YYYY HH:mm:ss',
  TIME_ONLY: 'HH:mm',
  DATE_INPUT: 'YYYY-MM-DD'
};


// ==================== EXPORT FOR DIFFERENT ENVIRONMENTS ====================

// For Node.js/Server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JOB_STATUS,
    STATUS_OPTIONS,
    INTERVIEW_STATUSES,
    STATUS_COLORS,
    PRIORITY_LEVELS,
    PRIORITY_OPTIONS,
    PRIORITY_COLORS,
    PRIORITY_ICONS,
    JOB_TYPES,
    JOB_TYPE_OPTIONS,
    JOB_TYPE_SYNONYMS,
    WORK_ARRANGEMENTS,
    WORK_ARRANGEMENT_OPTIONS,
    WORK_ARRANGEMENT_SYNONYMS,
    EXPERIENCE_LEVELS,
    EXPERIENCE_LEVEL_OPTIONS,
    EXPERIENCE_SYNONYMS,
    SELECTORS,
    TECHNICAL_TERMS,
    ROLE_TITLES,
    KEYWORD_GROUPS,
    SALARY_REGEX,
    COMMON_WORDS,
    TIMEZONES,
    TIMEZONE_OPTIONS,
    DASHBOARD_URL,
    API_BASE_URL,
    API_ENDPOINTS,
    STORAGE_KEYS,
    VALIDATION,
    DATE_FORMATS
  };
}