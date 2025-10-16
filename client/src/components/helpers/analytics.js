import { PRIORITY_LEVELS } from '../../shared-constants';

// Constants
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const AXIS_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'workArrangement', label: 'Work Arrangement' },
  { value: 'jobType', label: 'Job Type' },
  { value: 'experienceLevel', label: 'Experience Level' },
  { value: 'technicalSkills', label: 'Technical Skills' },
  { value: 'dateApplied', label: 'Date Applied' },
  { value: 'location', label: 'Location' },
  { value: 'company', label: 'Company' },
  { value: 'priority', label: 'Priority' },
];

const METRIC_OPTIONS = [
  { value: 'count', label: 'Count' },
  { value: 'responseRate', label: 'Response Rate' },
];

// Helper: Check if job is starred (high priority)
export const isStarredJob = (job) => {
  if (job.starred === true) return true;
  if (job.priority && job.priority === PRIORITY_LEVELS.STAR) return true;
  if (job.isFavorite === true) return true;
  return false;
};

// Helper: Get start of day
export const getStartOfDay = (dateString) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper: Format day label
export const formatDayLabel = (timestamp) => {
  const date = new Date(timestamp);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

// Helper: Format value for display
export const formatValueForDisplay = (metric, value) => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (metric) {
    case 'count':
      return value.toLocaleString();
    case 'responseRate':
      return `${value.toFixed(1)}%`;
    default:
      return value.toString();
  }
};

// Helper: Get available metrics for axis
export const getAvailableMetrics = (xAxis) => {
  return METRIC_OPTIONS;
};

// ✅ UPDATED: Enhanced groupJobsByAxis with new axis types
export const groupJobsByAxis = (jobs, axis) => {
  const groups = {};

  // Special handling for technical skills (array field)
  if (axis === 'technicalSkills') {
    jobs.forEach(job => {
      const skills = Array.isArray(job.technicalDetails) 
        ? job.technicalDetails 
        : [];
      
      if (skills.length === 0) {
        const key = 'No Skills Listed';
        if (!groups[key]) groups[key] = [];
        groups[key].push(job);
      } else {
        skills.forEach(skill => {
          const key = skill.trim();
          if (!groups[key]) groups[key] = [];
          groups[key].push(job);
        });
      }
    });
    
    return Object.entries(groups)
      .map(([label, jobs]) => ({ label, jobs }))
      .sort((a, b) => b.jobs.length - a.jobs.length) // Sort by count
      .slice(0, 20); // Limit to top 20 skills
  }

  // Standard grouping for other axes
  jobs.forEach(job => {
    let key;
    
    switch (axis) {
      case 'status':
        key = job.status || 'Unknown';
        break;
        
      case 'workArrangement':
        key = job.workArrangement || job.workStyle || 'Not specified';
        break;
        
      case 'jobType':
        key = job.jobType || 'Not specified';
        break;
        
      case 'experienceLevel':
        key = job.experienceLevel || 'Not specified';
        break;
        
      case 'priority':
        key = isStarredJob(job) ? 'Star' : 'Normal';
        break;
        
      case 'dateApplied':
        if (job.dateApplied) {
          key = formatDayLabel(getStartOfDay(job.dateApplied).getTime());
        } else {
          key = 'No Date';
        }
        break;
        
      case 'location':
        key = job.location || 'Unknown';
        break;
        
      case 'company':
        key = job.company || 'Unknown';
        break;
        
      default:
        key = 'Unknown';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(job);
  });

  return Object.entries(groups).map(([label, jobs]) => ({
    label,
    jobs,
  }));
};

// Helper: Compute metric value
export const computeMetricValue = (jobs, metric) => {
  if (!jobs || jobs.length === 0) return null;

  switch (metric) {
    case 'count':
      return jobs.length;
    case 'responseRate': {
      const total = jobs.length;
      const responded = jobs.filter(job => 
        job.status && job.status !== 'Applied' && job.status !== 'Submitted'
      ).length;
      
      return total > 0 ? (responded / total) * 100 : 0;
    }
    
    default:
      return null;
  }
};

// Helper: Build applications per day series
export const buildApplicationsPerDaySeries = (jobs) => {
  const datedJobs = jobs.filter(job => job.dateApplied);
  
  if (datedJobs.length === 0) return [];

  const dayGroups = {};
  
  datedJobs.forEach(job => {
    const dayTimestamp = getStartOfDay(job.dateApplied).getTime();
    const dayLabel = formatDayLabel(dayTimestamp);
    
    if (!dayGroups[dayLabel]) {
      dayGroups[dayLabel] = { timestamp: dayTimestamp, count: 0 };
    }
    dayGroups[dayLabel].count++;
  });

  return Object.entries(dayGroups)
    .map(([label, data]) => ({
      label,
      value: data.count,
      displayValue: data.count.toString(),
      timestamp: data.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

// Helper: Build applications per week series
export const buildApplicationsPerWeekSeries = (jobs) => {
  const datedJobs = jobs.filter(job => job.dateApplied);
  
  if (datedJobs.length === 0) return [];

  const weekGroups = {};
  
  datedJobs.forEach(job => {
    const date = new Date(job.dateApplied);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = formatDayLabel(weekStart.getTime());
    
    if (!weekGroups[weekKey]) {
      weekGroups[weekKey] = { timestamp: weekStart.getTime(), count: 0 };
    }
    weekGroups[weekKey].count++;
  });

  return Object.entries(weekGroups)
    .map(([label, data]) => ({
      label,
      value: data.count,
      displayValue: data.count.toString(),
      timestamp: data.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

// Helper: Build applications per month series
export const buildApplicationsPerMonthSeries = (jobs) => {
  const datedJobs = jobs.filter(job => job.dateApplied);
  
  if (datedJobs.length === 0) return [];

  const monthGroups = {};
  
  datedJobs.forEach(job => {
    const date = new Date(job.dateApplied);
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = { timestamp: monthStart.getTime(), count: 0 };
    }
    monthGroups[monthKey].count++;
  });

  return Object.entries(monthGroups)
    .map(([label, data]) => ({
      label,
      value: data.count,
      displayValue: data.count.toString(),
      timestamp: data.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

// Helper: Build status work style data
export const buildStatusWorkStyleData = (jobs) => {
  const groups = {};

  jobs.forEach(job => {
    const status = job.status || 'Applied';
    const workStyle = job.workArrangement || job.workStyle || job.workstyle || 
                      job.remote || job.workLocation || 'Unknown';
    
    const key = `${status} • ${workStyle}`;

    if (!groups[key]) {
      groups[key] = 0;
    }
    groups[key]++;
  });

  return Object.entries(groups)
    .map(([label, count]) => ({
      label,
      value: count,
      displayValue: count.toString(),
    }))
    .sort((a, b) => b.value - a.value);
};

