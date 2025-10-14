import { INTERVIEW_STATUSES } from '../../shared-constants';


export const API_URL = 'https://jobtracker-production-2ed3.up.railway.app/api';

export const formatDateUTC = (value) => {
  const d = new Date(value);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
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


export { INTERVIEW_STATUSES };

export const statusColors = {
  'Applied': '#3b82f6',
  'OA': '#f59e0b',
  'Behavioral Interview': '#8b5cf6',
  'Technical Interview': '#f97316',
  'Final Interview': '#6366f1',
  'Offer': '#10b981',
  'Rejected': '#ef4444',
  'No Response': '#6b7280'
};