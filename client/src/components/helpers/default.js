import { JOB_STATUS, STATUS_OPTIONS, JOB_TYPES , WORK_ARRANGEMENTS, 
  EXPERIENCE_LEVELS, VALIDATION } from '../../shared-constants';

export const YMD = (value) => {
  const d = new Date(value);
  const y = d.getFullYear(); 
  const m = String(d.getMonth() + 1).padStart(2, '0'); 
  const day = String(d.getDate()).padStart(2, '0'); 
  return `${y}/${m}/${day}`;
};

export const formatDateInTimezone = (date, tz) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimezoneAbbr = (tz, date) => {
  const d = date ? new Date(date) : new Date();
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(d);
  const name = parts.find(p => p.type === 'timeZoneName');
  return name ? name.value : tz;
};

export const isCollectionJob = (job) => {
  if (!job) return false;
  if (job.isCollection || job.collection || job.isCollected) return true;
  const priority = (job.priority || '').toLowerCase();
  return priority === 'star';
};

export const parseSkills = (technicalDetails) => {
  if (!technicalDetails) return [];
  const rawTokens = Array.isArray(technicalDetails)
    ? technicalDetails
    : technicalDetails.split(/[,;\n]+/);
  return rawTokens
    .map(token => token.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(token => token && token.length < 40 && !/\d{6,}/.test(token))
    .map(token => token.replace(/\b([a-z])/gi, (match) => match.toUpperCase()));
};

export const toStr = (v) => (v == null ? '' : String(v).trim());
export const lc = (v) => toStr(v).toLowerCase();

export const clampLen = (s, max) => s.slice(0, max);

export const matchOption = (raw, OPTIONS, DEFAULT, SYNONYMS = null) => {
  const val = toStr(raw);
  if (!val) return DEFAULT;
  // exact match against canonical options
  const exact = OPTIONS.find(o => o.toLowerCase() === val.toLowerCase());
  if (exact) return exact;
  if (SYNONYMS) {
    const low = val.toLowerCase();
    for (const [key, arr] of Object.entries(SYNONYMS)) {
      if (arr.some(a => low.includes(a))) {
        const canon = OPTIONS.find(o => o.toLowerCase().includes(key.replace('_',' ').toLowerCase().split(' ')[0]));
        const map = {
          FULL_TIME: JOB_TYPES.FULL_TIME,
          PART_TIME: JOB_TYPES.PART_TIME,
          CONTRACT: JOB_TYPES.CONTRACT,
          TEMPORARY: JOB_TYPES.TEMPORARY,
          INTERNSHIP: JOB_TYPES.INTERNSHIP,
          REMOTE: WORK_ARRANGEMENTS.REMOTE,
          HYBRID: WORK_ARRANGEMENTS.HYBRID,
          ON_SITE: WORK_ARRANGEMENTS.ON_SITE,
          INTERNSHIP_EXP: EXPERIENCE_LEVELS.INTERNSHIP,
          ENTRY: EXPERIENCE_LEVELS.ENTRY,
          ASSOCIATE: EXPERIENCE_LEVELS.ASSOCIATE,
          MID_SENIOR: EXPERIENCE_LEVELS.MID_SENIOR,
          DIRECTOR: EXPERIENCE_LEVELS.DIRECTOR,
          EXECUTIVE: EXPERIENCE_LEVELS.EXECUTIVE
        };
        if (map[key]) return map[key];
        if (canon) return canon;
      }
    }
  }
  return DEFAULT;
};

export const normalizeStatus = (s) => {
  const v = toStr(s);
  if (!v) return JOB_STATUS.APPLIED;
  const exact = STATUS_OPTIONS.find(o => o.toLowerCase() === v.toLowerCase());
  if (exact) return exact;
  if (v.toLowerCase().startsWith('interview')) {
    const m = v.match(/(\d+)/);
    const n = m ? parseInt(m[1], 10) : 1;
    return JOB_STATUS[`INTERVIEW_ROUND_${Math.min(Math.max(n,1),5)}`];
  }
  if (v.toLowerCase().includes('offer')) return JOB_STATUS.OFFER;
  if (v.toLowerCase().includes('reject')) return JOB_STATUS.REJECTED;
  if (v.toLowerCase().includes('no response')) return JOB_STATUS.NO_RESPONSE;
  return JOB_STATUS.APPLIED;
};

export const normalizeDate = (d) => {
  const s = toStr(d);
  if (!s) return ''; // blank stays blank
  const t = new Date(s);
  return isNaN(t.getTime()) ? '' : t.toISOString();
};

export const normalizeUrl = (u) => {
  const s = toStr(u);
  try {
    if (!s) return ''; // blank stays blank
    if (!VALIDATION.URL_REGEX.test(s)) return ''; // invalid ignored
    return s;
  } catch { return ''; }
};

export const normalizeSkills = (v) => {
  const s = toStr(v);
  if (!s) return [];
  return s.split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
};
