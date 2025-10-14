import { PRIORITY_LEVELS } from '../../shared-constants';
// Constants
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const AXIS_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'applicationState', label: 'Application State' },
  { value: 'workStyle', label: 'Work Arrangement' },
  { value: 'dateApplied', label: 'Date Applied' },
  { value: 'location', label: 'Location' },
  { value: 'company', label: 'Company' },
];

const METRIC_OPTIONS = [
  { value: 'count', label: 'Count' },
  { value: 'avgSalary', label: 'Average Salary' },
  { value: 'responseRate', label: 'Response Rate' },
];

// Helper: Check if job is starred (high priority)
export const isStarredJob = (job) => {
  // Check multiple possible "starred" indicators
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
    case 'avgSalary':
      return `$${Math.round(value).toLocaleString()}`;
    case 'responseRate':
      return `${value.toFixed(1)}%`;
    default:
      return value.toString();
  }
};

// Helper: Get available metrics for axis
export const getAvailableMetrics = (xAxis) => {
  if (xAxis === 'company' || xAxis === 'location') {
    return METRIC_OPTIONS;
  }
  return METRIC_OPTIONS.filter(m => m.value !== 'avgSalary');
};

// Helper: Group jobs by axis
export const groupJobsByAxis = (jobs, axis) => {
  const groups = {};

  jobs.forEach(job => {
    let key;
    
    switch (axis) {
      case 'status':
        key = job.status || 'Unknown';
        break;
      case 'applicationState':
        key = job.applicationState || 'Not Set';
        break;
      case 'workStyle':
        key = job.workArrangement || job.workStyle || 'Unknown';
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
    
    case 'avgSalary': {
      const salaries = jobs
        .map(job => job.salary)
        .filter(salary => salary != null && !isNaN(salary));
      
      if (salaries.length === 0) return null;
      
      const sum = salaries.reduce((acc, val) => acc + val, 0);
      return sum / salaries.length;
    }
    
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
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
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
    // Use workArrangement which is the actual property in your data
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

// Helper: Compute summary metrics
export const computeSummaryMetrics = (jobs) => {
  const totalApplications = jobs.length;
  
  const activeApplications = jobs.filter(job => {
    const status = job.status?.toLowerCase() || '';
    return !status.includes('reject') && 
           !status.includes('withdrawn') && 
           !status.includes('accepted') &&
           !status.includes('offer accepted');
  }).length;

  const closedApplications = totalApplications - activeApplications;

  const respondedJobs = jobs.filter(job => {
    const status = job.status?.toLowerCase() || '';
    return status && status !== 'applied' && status !== 'submitted';
  }).length;
  
  const responseRate = totalApplications > 0 
    ? `${((respondedJobs / totalApplications) * 100).toFixed(1)}%`
    : '0%';

  const offeredJobs = jobs.filter(job => {
    const status = job.status?.toLowerCase() || '';
    return status.includes('offer');
  }).length;
  
  const offerRate = totalApplications > 0
    ? `${((offeredJobs / totalApplications) * 100).toFixed(1)}%`
    : '0%';

  const interviewJobs = jobs.filter(job => {
    const status = job.status?.toLowerCase() || '';
    return status.includes('interview') || status.includes('onsite') || 
           status.includes('phone screen') || status.includes('technical');
  }).length;
  
  const interviewRate = totalApplications > 0
    ? `${((interviewJobs / totalApplications) * 100).toFixed(1)}%`
    : '0%';

  return {
    totalApplications,
    activeApplications,
    closedApplications,
    responseRate,
    offerRate,
    interviewRate,
  };
};

// Helper: Compute timing metrics
export const computeTimingMetrics = (jobs) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Get start of current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get start of current month
  const startOfMonth = new Date(currentYear, currentMonth, 1);

  const thisWeekJobs = jobs.filter(job => {
    if (!job.dateApplied) return false;
    const appliedDate = new Date(job.dateApplied);
    return appliedDate >= startOfWeek;
  });

  const thisMonthJobs = jobs.filter(job => {
    if (!job.dateApplied) return false;
    const appliedDate = new Date(job.dateApplied);
    return appliedDate >= startOfMonth;
  });

  return {
    thisWeekCount: thisWeekJobs.length,
    thisMonthCount: thisMonthJobs.length,
  };
};