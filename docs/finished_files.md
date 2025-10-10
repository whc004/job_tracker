# Finished Analytics Dashboard Files

## Branch

work

## Files Ready to Copy

### client/src/components/Analytics.js
```javascript
import React, { useMemo, useState } from 'react';

const INTERVIEW_STATUSES = new Set([
  'OA',
  'Behavioral Interview',
  'Technical Interview',
  'Final Interview',
]);

const RESPONSE_STATUSES = new Set([
  'OA',
  'Behavioral Interview',
  'Technical Interview',
  'Final Interview',
  'Offer',
  'Rejected',
  'No Response'
]);

const CLOSING_STATUSES = new Set(['Rejected', 'Offer', 'No Response']);

const AXIS_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'applicationState', label: 'Pipeline State' },
  { value: 'workStyle', label: 'Work Arrangement' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'company', label: 'Company (Top 10)' },
  { value: 'keyword', label: 'Keyword (Top 12)' },
  { value: 'responseTime', label: 'Response Delay Bucket' },
];

const METRIC_OPTIONS = [
  { value: 'count', label: 'Application Count', type: 'count' },
  { value: 'responseRate', label: 'Response Rate (%)', type: 'percentage' },
  { value: 'offerRate', label: 'Offer Rate (%)', type: 'percentage' },
  { value: 'interviewRate', label: 'Interview Rate (%)', type: 'percentage' },
  { value: 'averageResponseTime', label: 'Avg. Days to Response', type: 'duration' },
  { value: 'averageOfferTime', label: 'Avg. Days to Offer', type: 'duration' },
];

const AXIS_METRIC_LIMITS = {
  keyword: ['count'],
  responseTime: ['count'],
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const mapStatus = (status) => {
  if (!status) return 'Unknown';
  return INTERVIEW_STATUSES.has(status) ? 'Interview' : status;
};

const isStarredJob = (job) => {
  if (!job) return false;
  if (job.isCollection || job.collection || job.isCollected) return true;
  const priority = (job.priority || '').toLowerCase();
  return priority === 'high' || priority === 'dream job' || priority === 'collection' || priority === 'favorite';
};

const parseKeywords = (technicalDetails) => {
  if (!technicalDetails) return [];
  const rawTokens = Array.isArray(technicalDetails)
    ? technicalDetails
    : technicalDetails.split(/[,;\n]+/);

  return rawTokens
    .map(token => token
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    )
    .filter(token => token && token.length < 40 && !/\d{6,}/.test(token))
    .map(token => token.replace(/\b([a-z])/gi, (match) => match.toUpperCase()));
};

const getWorkStyle = (job) => {
  const arrangement = (job.workArrangement || '').toLowerCase();
  if (arrangement.includes('remote')) return 'Remote';
  if (arrangement.includes('hybrid')) return 'Hybrid';
  if (arrangement.includes('on-site') || arrangement.includes('onsite')) return 'On-site';

  const location = (job.location || '').toLowerCase();
  if (location.includes('remote')) return 'Remote';
  if (location.includes('hybrid')) return 'Hybrid';
  if (location.includes('on-site') || location.includes('onsite')) return 'On-site';

  return 'Unspecified';
};

const getPipelineState = (status) => {
  if (!status) return 'Unknown';
  if (status === 'Offer') return 'Offer';
  if (CLOSING_STATUSES.has(status)) return 'Closed';
  return 'Active';
};

const getResponseDays = (job) => {
  if (!job || !job.dateApplied || !job.lastStatusUpdate) return null;
  if (!RESPONSE_STATUSES.has(job.status) || job.status === 'Applied') return null;
  const applied = new Date(job.dateApplied);
  const updated = new Date(job.lastStatusUpdate);
  const diff = (updated - applied) / (1000 * 60 * 60 * 24);
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
};

const getOfferDays = (job) => {
  if (!job || job.status !== 'Offer') return null;
  if (!job.dateApplied || !job.lastStatusUpdate) return null;
  const applied = new Date(job.dateApplied);
  const updated = new Date(job.lastStatusUpdate);
  const diff = (updated - applied) / (1000 * 60 * 60 * 24);
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
};

const getWeekStart = (date) => {
  const value = new Date(date);
  const day = value.getDay();
  const diff = value.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(value.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const formatWeekLabel = (date) => {
  const weekStart = getWeekStart(date);
  return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

const formatMonthLabel = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

const formatDayLabel = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const isRespondedStatus = (status) => status && status !== 'Applied' && status !== 'No Response';

const computeMetricValue = (jobs, metric) => {
  if (!jobs || jobs.length === 0) {
    return metric === 'count' ? 0 : null;
  }

  switch (metric) {
    case 'count':
      return jobs.length;
    case 'responseRate': {
      const responded = jobs.filter(job => isRespondedStatus(job.status)).length;
      return jobs.length ? (responded / jobs.length) * 100 : 0;
    }
    case 'offerRate': {
      const offers = jobs.filter(job => job.status === 'Offer').length;
      return jobs.length ? (offers / jobs.length) * 100 : 0;
    }
    case 'interviewRate': {
      const interviews = jobs.filter(job => INTERVIEW_STATUSES.has(job.status)).length;
      return jobs.length ? (interviews / jobs.length) * 100 : 0;
    }
    case 'averageResponseTime': {
      const responseTimes = jobs
        .map(getResponseDays)
        .filter(time => time !== null);
      if (responseTimes.length === 0) return null;
      const total = responseTimes.reduce((sum, time) => sum + time, 0);
      return total / responseTimes.length;
    }
    case 'averageOfferTime': {
      const offerTimes = jobs
        .map(getOfferDays)
        .filter(time => time !== null);
      if (offerTimes.length === 0) return null;
      const total = offerTimes.reduce((sum, time) => sum + time, 0);
      return total / offerTimes.length;
    }
    default:
      return null;
  }
};

const metricTypeLookup = METRIC_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.type;
  return acc;
}, {});

const formatMetricValue = (value, metric) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  const type = metricTypeLookup[metric];
  if (type === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  if (type === 'duration') {
    return `${value.toFixed(1)} days`;
  }
  return value.toLocaleString();
};

const keywordGroups = (jobs) => {
  const map = new Map();
  jobs.forEach(job => {
    parseKeywords(job.technicalDetails).forEach(keyword => {
      if (!map.has(keyword)) {
        map.set(keyword, []);
      }
      map.get(keyword).push(job);
    });
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 12)
    .map(([label, list]) => ({ label, jobs: list }));
};

const responseTimeBuckets = [
  { label: '0-3 days', min: 0, max: 3 },
  { label: '4-7 days', min: 4, max: 7 },
  { label: '8-14 days', min: 8, max: 14 },
  { label: '15-21 days', min: 15, max: 21 },
  { label: '22-30 days', min: 22, max: 30 },
  { label: '31+ days', min: 31, max: Infinity },
];

const groupJobsByAxis = (jobs, axis) => {
  if (!jobs || jobs.length === 0) return [];

  switch (axis) {
    case 'status': {
      const groups = new Map();
      jobs.forEach(job => {
        const label = mapStatus(job.status);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(job);
      });
      return Array.from(groups.entries()).map(([label, list]) => ({ label, jobs: list }));
    }
    case 'applicationState': {
      const groups = new Map();
      jobs.forEach(job => {
        const label = getPipelineState(job.status);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(job);
      });
      return Array.from(groups.entries()).map(([label, list]) => ({ label, jobs: list }));
    }
    case 'workStyle': {
      const groups = new Map();
      jobs.forEach(job => {
        const label = getWorkStyle(job);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(job);
      });
      return Array.from(groups.entries()).map(([label, list]) => ({ label, jobs: list }));
    }
    case 'day': {
      const groups = new Map();
      jobs.forEach(job => {
        if (!job.dateApplied) return;
        const key = new Date(job.dateApplied);
        key.setHours(0, 0, 0, 0);
        const label = formatDayLabel(key);
        if (!groups.has(key.getTime())) {
          groups.set(key.getTime(), { label, jobs: [] });
        }
        groups.get(key.getTime()).jobs.push(job);
      });
      return Array.from(groups.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, value]) => value);
    }
    case 'week': {
      const groups = new Map();
      jobs.forEach(job => {
        if (!job.dateApplied) return;
        const monday = getWeekStart(job.dateApplied);
        const key = monday.getTime();
        const label = formatWeekLabel(job.dateApplied);
        if (!groups.has(key)) {
          groups.set(key, { label, jobs: [] });
        }
        groups.get(key).jobs.push(job);
      });
      return Array.from(groups.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, value]) => value);
    }
    case 'month': {
      const groups = new Map();
      jobs.forEach(job => {
        if (!job.dateApplied) return;
        const date = new Date(job.dateApplied);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const label = formatMonthLabel(date);
        if (!groups.has(key)) {
          groups.set(key, { label, jobs: [] });
        }
        groups.get(key).jobs.push(job);
      });
      return Array.from(groups.values());
    }
    case 'company': {
      const groups = new Map();
      jobs.forEach(job => {
        const label = job.company || 'Unknown company';
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(job);
      });
      return Array.from(groups.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10)
        .map(([label, list]) => ({ label, jobs: list }));
    }
    case 'keyword':
      return keywordGroups(jobs);
    case 'responseTime': {
      const buckets = responseTimeBuckets.map(bucket => ({ ...bucket, jobs: [] }));
      jobs.forEach(job => {
        const days = getResponseDays(job);
        if (days === null) return;
        const bucket = buckets.find(b => days >= b.min && days <= b.max);
        if (bucket) {
          bucket.jobs.push(job);
        }
      });
      return buckets
        .filter(bucket => bucket.jobs.length > 0)
        .map(bucket => ({ label: bucket.label, jobs: bucket.jobs }));
    }
    default:
      return [];
  }
};

const formatValueForDisplay = (metric, value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  const type = metricTypeLookup[metric];
  if (type === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  if (type === 'duration') {
    return `${value.toFixed(1)} d`;
  }
  return value.toLocaleString();
};

const buildStatusWorkStyleData = (jobs) => {
  if (!jobs || jobs.length === 0) return [];
  const counts = new Map();
  jobs.forEach(job => {
    const baseStatus = mapStatus(job.status);
    const workStyle = getWorkStyle(job);
    const label = ['Remote', 'Hybrid', 'On-site'].includes(workStyle)
      ? `${baseStatus} • ${workStyle}`
      : baseStatus;
    if (!counts.has(label)) counts.set(label, 0);
    counts.set(label, counts.get(label) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      displayValue: formatMetricValue(value, 'count'),
    }));
};

const buildApplicationsPerDaySeries = (jobs) => {
  const groups = groupJobsByAxis(jobs, 'day');
  return groups.map(group => {
    const count = computeMetricValue(group.jobs, 'count');
    return {
      label: group.label,
      value: count,
      displayValue: formatValueForDisplay('count', count),
    };
  });
};

const computeSummaryMetrics = (jobs) => {
  const total = jobs.length;
  const respondedCount = jobs.filter(job => isRespondedStatus(job.status)).length;
  const offerCount = jobs.filter(job => job.status === 'Offer').length;
  const interviewCount = jobs.filter(job => INTERVIEW_STATUSES.has(job.status)).length;
  const closedCount = jobs.filter(job => CLOSING_STATUSES.has(job.status)).length;
  const activeCount = total - closedCount;

  const responseRate = total ? (respondedCount / total) * 100 : 0;
  const offerRate = total ? (offerCount / total) * 100 : 0;
  const interviewRate = total ? (interviewCount / total) * 100 : 0;

  return [
    {
      label: 'Total Applications',
      description: 'Count of all submitted applications',
      value: total.toLocaleString(),
    },
    {
      label: 'Active Applications',
      description: 'Applications still in process (no rejection/offer yet)',
      value: activeCount.toLocaleString(),
    },
    {
      label: 'Closed Applications',
      description: 'Applications marked as rejected, withdrawn, or accepted',
      value: closedCount.toLocaleString(),
    },
    {
      label: 'Response Rate',
      description: '% of applications that received any response',
      value: `${responseRate.toFixed(1)}%`,
    },
    {
      label: 'Offer Rate',
      description: '% of total applications that resulted in offers',
      value: `${offerRate.toFixed(1)}%`,
    },
    {
      label: 'Interview Rate',
      description: '% that reached interview stage',
      value: `${interviewRate.toFixed(1)}%`,
    },
  ];
};

const getStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getStartOfMonth = (value) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const computeTimingMetrics = (jobs) => {
  const respondedTimes = jobs
    .map(getResponseDays)
    .filter(time => time !== null);
  const offerTimes = jobs
    .map(getOfferDays)
    .filter(time => time !== null);

  const averageResponse = respondedTimes.length
    ? respondedTimes.reduce((sum, time) => sum + time, 0) / respondedTimes.length
    : null;
  const averageOffer = offerTimes.length
    ? offerTimes.reduce((sum, time) => sum + time, 0) / offerTimes.length
    : null;

  const datedJobs = jobs.filter(job => job.dateApplied);
  const thisWeekCount = (() => {
    if (datedJobs.length === 0) return null;
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY);
    return datedJobs.filter(job => {
      const applied = getStartOfDay(job.dateApplied);
      return applied >= weekStart && applied < weekEnd;
    }).length;
  })();

  const thisMonthCount = (() => {
    if (datedJobs.length === 0) return null;
    const today = new Date();
    const monthStart = getStartOfMonth(today);
    const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    return datedJobs.filter(job => {
      const applied = getStartOfDay(job.dateApplied);
      return applied >= monthStart && applied < nextMonthStart;
    }).length;
  })();

  const responseDistributionGroups = groupJobsByAxis(jobs, 'responseTime');
  const topBucket = responseDistributionGroups.sort((a, b) => b.jobs.length - a.jobs.length)[0];

  return [
    {
      label: 'Average Time to Response',
      description: 'Days between submission and first reply',
      value: averageResponse !== null ? `${averageResponse.toFixed(1)} days` : 'Not enough data',
    },
    {
      label: 'Average Time to Offer',
      description: 'Days from application to offer (for successful ones)',
      value: averageOffer !== null ? `${averageOffer.toFixed(1)} days` : 'Not enough data',
    },
    {
      label: 'Applications this Week/Month',
      description: 'Submissions during the current calendar week and month',
      value: thisWeekCount !== null && thisMonthCount !== null
        ? `${thisWeekCount.toLocaleString()} this week • ${thisMonthCount.toLocaleString()} this month`
        : 'Not enough data',
    },
    {
      label: 'Response Delay Distribution',
      description: 'Histogram or line chart of delays',
      value: topBucket ? `${topBucket.label} most common` : 'Not enough data',
    },
  ];
};

const getAvailableMetrics = (axis) => {
  const restricted = AXIS_METRIC_LIMITS[axis];
  if (restricted) {
    return METRIC_OPTIONS.filter(option => restricted.includes(option.value));
  }
  return METRIC_OPTIONS;
};

const Analytics = ({ jobs, stats, filteredJobs = [], activeFilter, searchTerm }) => {
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('status');
  const [yAxis, setYAxis] = useState('count');
  const [dataScope, setDataScope] = useState('filtered');
  const [starScope, setStarScope] = useState('all');

  const hasFilterSelection = (activeFilter && activeFilter !== 'All') || (searchTerm && searchTerm.trim().length > 0);
  const effectiveFilteredJobs = filteredJobs.length > 0 || hasFilterSelection ? filteredJobs : jobs;
  const baseJobs = dataScope === 'filtered' ? effectiveFilteredJobs : jobs;

  const scopedJobs = useMemo(() => {
    if (starScope === 'starred') return baseJobs.filter(isStarredJob);
    if (starScope === 'unstarred') return baseJobs.filter(job => !isStarredJob(job));
    return baseJobs;
  }, [baseJobs, starScope]);

  const groups = useMemo(() => groupJobsByAxis(scopedJobs, xAxis), [scopedJobs, xAxis]);
  const availableYAxisOptions = getAvailableMetrics(xAxis);
  const isYAxisValid = availableYAxisOptions.some(option => option.value === yAxis);
  const activeYAxis = isYAxisValid ? yAxis : availableYAxisOptions[0]?.value || 'count';

  const chartData = useMemo(() => {
    const metric = activeYAxis;
    const data = groups
      .map(group => {
        const value = computeMetricValue(group.jobs, metric);
        if (value === null) return null;
        return {
          label: group.label,
          value,
          displayValue: formatValueForDisplay(metric, value),
        };
      })
      .filter(item => item !== null);

    if (metric === 'count' && (xAxis === 'status' || xAxis === 'applicationState' || xAxis === 'workStyle')) {
      return data.sort((a, b) => b.value - a.value);
    }
    return data;
  }, [groups, activeYAxis, xAxis]);

  const statusPieData = useMemo(() => buildStatusWorkStyleData(scopedJobs), [scopedJobs]);
  const applicationsPerDay = useMemo(() => buildApplicationsPerDaySeries(scopedJobs), [scopedJobs]);
  const dailyTrendSummary = useMemo(() => {
    const dated = scopedJobs
      .filter(job => job.dateApplied)
      .map(job => getStartOfDay(job.dateApplied).getTime());
    if (dated.length === 0) return null;

    const uniqueDates = Array.from(new Set(dated)).sort((a, b) => a - b);
    if (uniqueDates.length === 0) return null;

    const first = uniqueDates[0];
    const last = uniqueDates[uniqueDates.length - 1];
    const spanDays = Math.round((last - first) / MS_PER_DAY) + 1;

    return {
      uniqueCount: uniqueDates.length,
      spanDays,
      startLabel: formatDayLabel(first),
      endLabel: formatDayLabel(last),
    };
  }, [scopedJobs]);

  const summaryMetrics = useMemo(() => computeSummaryMetrics(scopedJobs), [scopedJobs]);
  const timingMetrics = useMemo(() => computeTimingMetrics(scopedJobs), [scopedJobs]);

  const hasData = chartData.length > 0;
  const maxValue = hasData ? Math.max(...chartData.map(d => d.value)) : 0;

  const filterLabel = activeFilter === 'Interview' ? 'Interview (OA → Final)' : (activeFilter || 'All');

  return (
    <div style={styles.analyticsContainer}>
      <div style={styles.analyticsControls}>
        <h2 style={styles.analyticsTitle}>📈 Custom Analytics</h2>

        <div style={styles.scopeBanner}>
          <div style={styles.scopeButtons}>
            <button
              onClick={() => setDataScope('filtered')}
              style={{
                ...styles.scopeButton,
                ...(dataScope === 'filtered' ? styles.scopeButtonActive : {})
              }}
            >
              Current filters
            </button>
            <button
              onClick={() => setDataScope('all')}
              style={{
                ...styles.scopeButton,
                ...(dataScope === 'all' ? styles.scopeButtonActive : {})
              }}
            >
              All applications
            </button>
          </div>

          <div style={styles.scopeButtons}>
            <button
              onClick={() => setStarScope('all')}
              style={{
                ...styles.scopeButton,
                ...(starScope === 'all' ? styles.scopeButtonActive : {})
              }}
            >
              ⭐ All
            </button>
            <button
              onClick={() => setStarScope('starred')}
              style={{
                ...styles.scopeButton,
                ...(starScope === 'starred' ? styles.scopeButtonActive : {})
              }}
            >
              ★ Starred
            </button>
            <button
              onClick={() => setStarScope('unstarred')}
              style={{
                ...styles.scopeButton,
                ...(starScope === 'unstarred' ? styles.scopeButtonActive : {})
              }}
            >
              ☆ Not starred
            </button>
          </div>

          <div style={styles.scopeContext}>
            <span style={styles.scopeBadge}>
              Scope: {dataScope === 'filtered' ? 'Dashboard filters' : 'All records'}
            </span>
            {dataScope === 'filtered' && (
              <>
                <span style={styles.scopeBadge}>
                  Status: {filterLabel}
                </span>
                {searchTerm && searchTerm.trim().length > 0 && (
                  <span style={styles.scopeBadge}>
                    Search: “{searchTerm.trim()}”
                  </span>
                )}
              </>
            )}
            <span style={styles.scopeBadge}>
              {scopedJobs.length} matching records
            </span>
            {stats && (
              <span style={styles.scopeBadge}>
                Total saved: {stats.total}
              </span>
            )}
          </div>
        </div>

        <div style={styles.defaultCharts}>
          <div style={styles.defaultChartCard}>
            <div style={styles.defaultChartHeader}>
              <h3 style={styles.defaultChartTitle}>Applications per day</h3>
              <span style={styles.defaultChartSubtitle}>Daily submission trend</span>
            </div>
            {applicationsPerDay.length === 0 ? (
              <div style={styles.emptyChart}>
                No dated applications yet.
              </div>
            ) : (
              <>
                <div style={styles.lineChart}>
                  <LineChart
                    data={applicationsPerDay}
                    valueFormatter={(value) => formatValueForDisplay('count', value)}
                  />
                </div>
                {dailyTrendSummary && (
                  <p style={styles.chartContextText}>
                    Showing {dailyTrendSummary.uniqueCount.toLocaleString()} submission day{dailyTrendSummary.uniqueCount !== 1 ? 's' : ''}
                    {' '}between {dailyTrendSummary.startLabel} and {dailyTrendSummary.endLabel}. Days without applications are omitted, so the line spans {dailyTrendSummary.spanDays.toLocaleString()} calendar day{dailyTrendSummary.spanDays !== 1 ? 's' : ''} even if only a few points appear.
                  </p>
                )}
              </>
            )}
          </div>

          <div style={styles.defaultChartCard}>
            <div style={styles.defaultChartHeader}>
              <h3 style={styles.defaultChartTitle}>Pipeline & workstyle mix</h3>
              <span style={styles.defaultChartSubtitle}>Status distribution with remote insight</span>
            </div>
            {statusPieData.length === 0 ? (
              <div style={styles.emptyChart}>
                No applications available for this view.
              </div>
            ) : (
              <div style={styles.pieChart}>
                <PieChart
                  data={statusPieData}
                  valueFormatter={(value) => formatValueForDisplay('count', value)}
                />
              </div>
            )}
          </div>
        </div>

        <div style={styles.chartControls}>
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Chart Type:</label>
            <div style={styles.controlSelectShell}>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                style={styles.select}
              >
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="line">Line Chart</option>
              </select>
              <span style={styles.selectChevron} aria-hidden="true">▾</span>
            </div>
          </div>

          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>X-Axis:</label>
            <div style={styles.controlSelectShell}>
              <select
                value={xAxis}
                onChange={(e) => {
                  setXAxis(e.target.value);
                  const allowed = getAvailableMetrics(e.target.value);
                  if (!allowed.some(option => option.value === activeYAxis)) {
                    setYAxis(allowed[0]?.value || 'count');
                  }
                }}
                style={styles.select}
              >
                {AXIS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span style={styles.selectChevron} aria-hidden="true">▾</span>
            </div>
          </div>

          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Y-Axis:</label>
            <div style={styles.controlSelectShell}>
              <select
                value={activeYAxis}
                onChange={(e) => setYAxis(e.target.value)}
                style={styles.select}
              >
                {availableYAxisOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span style={styles.selectChevron} aria-hidden="true">▾</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.chartContainer}>
        {!hasData ? (
          <div style={styles.emptyChart}>
            {scopedJobs.length === 0
              ? 'No applications match the selected scope yet.'
              : 'Data is available, but adjust the axis options to visualise it.'}
          </div>
        ) : (
          <>
            {chartType === 'bar' && (
              <div style={styles.barChart}>
                {chartData.map((item, index) => (
                  <div key={index} style={styles.barGroup}>
                    <div style={styles.barLabel}>{item.label}</div>
                    <div style={styles.barWrapper}>
                      <div
                        style={{
                          ...styles.bar,
                          width: `${maxValue ? (item.value / maxValue) * 100 : 0}%`,
                          backgroundColor: getStatusColor(item.label)
                        }}
                      >
                        <span style={styles.barValue}>{item.displayValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {chartType === 'pie' && (
              <div style={styles.pieChart}>
                <PieChart
                  data={chartData}
                  valueFormatter={(value) => formatValueForDisplay(activeYAxis, value)}
                />
              </div>
            )}

            {chartType === 'line' && (
              <div style={styles.lineChart}>
                <LineChart
                  data={chartData}
                  valueFormatter={(value) => formatValueForDisplay(activeYAxis, value)}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.metricsSection}>
        <div style={styles.metricsCard}>
          <h3 style={styles.metricsTitle}>Pipeline health</h3>
          <div style={styles.metricsGrid}>
            {summaryMetrics.map((metric, index) => (
              <div key={index} style={styles.metricItem}>
                <div style={styles.metricLabel}>{metric.label}</div>
                <div style={styles.metricValue}>{metric.value}</div>
                <div style={styles.metricDescription}>{metric.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.metricsCard}>
          <h3 style={styles.metricsTitle}>Velocity & timing</h3>
          <div style={styles.metricsGrid}>
            {timingMetrics.map((metric, index) => (
              <div key={index} style={styles.metricItem}>
                <div style={styles.metricLabel}>{metric.label}</div>
                <div style={styles.metricValue}>{metric.value}</div>
                <div style={styles.metricDescription}>{metric.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PieChart = ({ data, valueFormatter }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return <div style={styles.emptyChart}>No data available for this chart.</div>;
  }
  let currentAngle = 0;

  return (
    <div style={styles.pieContainer}>
      <svg viewBox="0 0 200 200" style={styles.pieSvg}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;

          currentAngle = endAngle;

          const x1 = 100 + 90 * Math.cos((startAngle - 90) * Math.PI / 180);
          const y1 = 100 + 90 * Math.sin((startAngle - 90) * Math.PI / 180);
          const x2 = 100 + 90 * Math.cos((endAngle - 90) * Math.PI / 180);
          const y2 = 100 + 90 * Math.sin((endAngle - 90) * Math.PI / 180);

          const largeArc = angle > 180 ? 1 : 0;
          const path = `M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <g key={index}>
              <path
                d={path}
                fill={getStatusColor(item.label)}
                stroke="white"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      <div style={styles.pieLegend}>
        {data.map((item, index) => (
          <div key={index} style={styles.legendItem}>
            <div style={{
              ...styles.legendColor,
              backgroundColor: getStatusColor(item.label)
            }}></div>
            <span style={styles.legendText}>
              {item.label}: {valueFormatter ? valueFormatter(item.value) : item.displayValue || item.value}{' '}
              ({((item.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChart = ({ data, valueFormatter }) => {
  if (!data || data.length === 0) {
    return <div style={styles.emptyChart}>No data available for this chart.</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const safeMax = maxValue === 0 ? 1 : maxValue;
  const width = 800;
  const height = 400;
  const padding = 50;

  const points = data.map((item, index) => {
    const denominator = data.length > 1 ? (data.length - 1) : 1;
    const x = padding + (index / denominator) * (width - 2 * padding);
    const valueRatio = safeMax ? (item.value / safeMax) : 0;
    const y = height - padding - (valueRatio * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={styles.lineSvg}>
      {[0, 1, 2, 3, 4].map(i => {
        const y = padding + (i / 4) * (height - 2 * padding);
        return (
          <line
            key={i}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {data.length > 1 && (
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
        />
      )}

      {data.map((item, index) => {
        const denominator = data.length > 1 ? (data.length - 1) : 1;
        const x = padding + (index / denominator) * (width - 2 * padding);
        const valueRatio = safeMax ? (item.value / safeMax) : 0;
        const y = height - padding - (valueRatio * (height - 2 * padding));
        return (
          <g key={index}>
            <circle cx={x} cy={y} r="5" fill="#3b82f6" />
            <text x={x} y={height - 20} textAnchor="middle" fontSize="12" fill="#6b7280">
              {item.label}
            </text>
            <text x={x} y={y - 12} textAnchor="middle" fontSize="12" fill="#1f2937">
              {valueFormatter ? valueFormatter(item.value) : (item.displayValue || item.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const STATUS_COLORS = {
  'Applied': '#3b82f6',
  'Interview': '#f59e0b',
  'OA': '#f59e0b',
  'Behavioral Interview': '#8b5cf6',
  'Technical Interview': '#f97316',
  'Final Interview': '#6366f1',
  'Offer': '#10b981',
  'Rejected': '#ef4444',
  'No Response': '#6b7280',
  'Active': '#2563eb',
  'Closed': '#64748b',
  'Unknown': '#94a3b8',
  'Offer • Remote': '#0ea5e9',
  'Remote': '#0ea5e9',
  'Hybrid': '#a855f7',
  'On-site': '#f97316',
  'Unspecified': '#94a3b8',
};

const WORK_STYLE_COLORS = {
  'Remote': '#0ea5e9',
  'Hybrid': '#a855f7',
  'On-site': '#f97316',
  'Unspecified': '#94a3b8',
};

const getStatusColor = (label) => {
  if (!label) return '#6b7280';
  if (STATUS_COLORS[label]) return STATUS_COLORS[label];

  if (label.includes('•')) {
    const [status, workStyle] = label.split('•').map(part => part.trim());
    if (WORK_STYLE_COLORS[workStyle]) {
      return WORK_STYLE_COLORS[workStyle];
    }
    if (STATUS_COLORS[status]) {
      return STATUS_COLORS[status];
    }
  }

  if (WORK_STYLE_COLORS[label]) return WORK_STYLE_COLORS[label];

  return '#3b82f6';
};

const styles = {
  analyticsContainer: {
    maxWidth: '1400px',
    margin: '32px auto',
    padding: '0 24px',
  },
  analyticsControls: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  analyticsTitle: {
    fontSize: '24px',
    color: '#1f2937',
    marginBottom: '20px',
  },
  scopeBanner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  scopeButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  scopeButton: {
    padding: '10px 18px',
    borderRadius: '999px',
    border: '1px solid rgba(148,163,184,0.35)',
    background: 'white',
    color: '#1f2937',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(15,23,42,0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },
  scopeButtonActive: {
    borderColor: '#2563eb',
    color: '#1d4ed8',
    boxShadow: '0 12px 28px rgba(37,99,235,0.25)',
    background: 'linear-gradient(135deg, rgba(219,234,254,0.95) 0%, rgba(191,219,254,0.9) 100%)',
  },
  scopeContext: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  scopeBadge: {
    background: '#f1f5f9',
    color: '#1f2937',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 600,
  },
  defaultCharts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  defaultChartCard: {
    padding: '18px',
    borderRadius: '14px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: '#f8fafc',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
  },
  defaultChartHeader: {
    marginBottom: '16px',
  },
  defaultChartTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#0f172a',
    fontWeight: 700,
  },
  defaultChartSubtitle: {
    fontSize: '13px',
    color: '#475569',
  },
  chartControls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  controlLabel: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#1e293b',
  },
  controlSelectShell: {
    position: 'relative',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(148,163,184,0.45)',
    appearance: 'none',
    background: 'white',
    color: '#0f172a',
    fontWeight: 600,
  },
  selectChevron: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#475569',
  },
  chartContainer: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  emptyChart: {
    padding: '40px',
    textAlign: 'center',
    color: '#475569',
    fontWeight: 500,
    border: '2px dashed rgba(148,163,184,0.35)',
    borderRadius: '12px',
    background: '#f8fafc',
  },
  barChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  barGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  barLabel: {
    fontWeight: 600,
    color: '#1f2937',
  },
  barWrapper: {
    width: '100%',
    background: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  bar: {
    minHeight: '38px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '16px',
    color: 'white',
    fontWeight: 700,
    fontSize: '13px',
    transition: 'width 0.4s ease',
  },
  barValue: {
    textShadow: '0 1px 2px rgba(15,23,42,0.4)',
  },
  pieChart: {
    display: 'flex',
    justifyContent: 'center',
  },
  lineChart: {
    overflowX: 'auto',
  },
  chartContextText: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#475569',
    lineHeight: 1.5,
  },
  pieContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  pieSvg: {
    width: '280px',
    height: '280px',
  },
  pieLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-start',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendColor: {
    width: '14px',
    height: '14px',
    borderRadius: '4px',
  },
  legendText: {
    fontSize: '13px',
    color: '#1f2937',
    fontWeight: 500,
  },
  lineSvg: {
    width: '100%',
    minWidth: '600px',
  },
  metricsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  metricsCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid rgba(148,163,184,0.2)',
  },
  metricsTitle: {
    margin: '0 0 12px',
    fontSize: '18px',
    color: '#0f172a',
    fontWeight: 700,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  metricItem: {
    padding: '14px',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid rgba(148,163,184,0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#1d4ed8',
  },
  metricDescription: {
    fontSize: '12px',
    color: '#475569',
    lineHeight: 1.5,
  },
};

export default Analytics;

```

### client/src/components/JobTracker.js
```javascript
import React, { useState, useEffect, useCallback } from 'react';
import Analytics from './Analytics';

const API_URL = 'https://jobtracker-production-2ed3.up.railway.app/api';

const isCollectionJob = (job) => {
  if (!job) return false;
  if (job.isCollection || job.collection || job.isCollected) return true;
  const priority = (job.priority || '').toLowerCase();
  return priority === 'high' || priority === 'dream job' || priority === 'collection' || priority === 'favorite';
};

const parseSkills = (technicalDetails) => {
  if (!technicalDetails) return [];

  const rawTokens = Array.isArray(technicalDetails)
    ? technicalDetails
    : technicalDetails.split(/[,;\n]+/);

  return rawTokens
    .map(token => token
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    )
    .filter(token => token && token.length < 40 && !/\d{6,}/.test(token))
    .map(token => token.replace(/\b([a-z])/gi, (match) => match.toUpperCase()));
};

const INTERVIEW_STATUSES = new Set([
  'OA',
  'Behavioral Interview',
  'Technical Interview',
  'Final Interview'
]);

const JobTracker = () => {
  // State management
  const [userId, setUserId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateApplied');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collectionFilter, setCollectionFilter] = useState('all');

  // Auto "No Response" settings
  const [noResponseDays, setNoResponseDays] = useState(21);
  const [showSettings, setShowSettings] = useState(false);

  // Save noResponseDays to localStorage when changed
  useEffect(() => {
    localStorage.setItem('noResponseDays', noResponseDays.toString());
  }, [noResponseDays]);

  // Auto-update jobs to "No Response" if past threshold
  const autoUpdateNoResponse = async (jobsList, id, daysThreshold) => {
    const now = new Date();
    const updatedJobs = [];

    for (const job of jobsList) {
      if (job.status === 'Applied') {
        const appliedDate = new Date(job.dateApplied);
        const daysSinceApplied = Math.floor((now - appliedDate) / (1000 * 60 * 60 * 24));

        if (daysSinceApplied >= daysThreshold) {
          try {
            await fetch(`${API_URL}/applications/${job._id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': id
              },
              body: JSON.stringify({ status: 'No Response' })
            });
            updatedJobs.push({ ...job, status: 'No Response' });
          } catch (err) {
            console.error('Error auto-updating job:', err);
            updatedJobs.push(job);
          }
        } else {
          updatedJobs.push(job);
        }
      } else {
        updatedJobs.push(job);
      }
    }

    return updatedJobs;
  };

  // Fetch all data
  const fetchData = useCallback(async (id) => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/stats`, {
        headers: { 'x-user-id': id }
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch jobs
      const jobsRes = await fetch(`${API_URL}/applications`, {
        headers: { 'x-user-id': id }
      });
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        const updatedJobs = await autoUpdateNoResponse(jobsData.data, id, noResponseDays);
        setJobs(updatedJobs);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [noResponseDays]);

  // Login/Authentication
  const performLogin = useCallback(async (rawId) => {
    const trimmedId = (rawId || '').trim();
    if (!trimmedId) {
      setError('Please enter your User ID');
      return;
    }

    setUserId(trimmedId);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/stats`, {
        headers: { 'x-user-id': trimmedId }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          localStorage.setItem('jobTrackerUserId', trimmedId);
          setIsAuthenticated(true);
          await fetchData(trimmedId);
        } else {
          setError('Invalid User ID');
        }
      } else {
        setError('Invalid User ID or connection error');
      }
    } catch (err) {
      setError('Could not connect to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const handleLogin = (userIdToUse) => {
    performLogin(userIdToUse || userId);
  };

  // Check localStorage for saved userId and settings
  useEffect(() => {
    const savedUserId = localStorage.getItem('jobTrackerUserId');
    const savedDays = localStorage.getItem('noResponseDays');

    if (savedUserId && !isAuthenticated) {
      setUserId(savedUserId);
      performLogin(savedUserId);
    }

    if (savedDays) {
      const parsed = parseInt(savedDays, 10);
      setNoResponseDays(Number.isNaN(parsed) ? 21 : parsed);
    }
  }, [performLogin, isAuthenticated]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('jobTrackerUserId');
    setIsAuthenticated(false);
    setUserId('');
    setJobs([]);
    setStats(null);
  };

  // Update job status
  const updateJobStatus = async (jobId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/applications/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const result = await response.json();
        await fetchData(userId);
        if (result?.data) {
          setSelectedJob(result.data);
        } else {
          setSelectedJob(prev => (prev && prev._id === jobId ? { ...prev, status: newStatus } : prev));
        }
      }
    } catch (err) {
      console.error('Error updating job:', err);
    }
  };

  // NEW: Toggle star/priority
  const toggleStar = async (job, e) => {
    if (e) {
      e.stopPropagation();
    }

    // Toggle between High and Medium priority
    const newPriority = job.priority === 'High' ? 'Medium' : 'High';

    try {
      const response = await fetch(`${API_URL}/applications/${job._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ priority: newPriority })
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setJobs(prevJobs => prevJobs.map(j =>
          j._id === job._id ? { ...j, priority: newPriority } : j
        ));
        setSelectedJob(prev => (prev && prev._id === job._id ? { ...prev, priority: newPriority } : prev));
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  // Delete job
  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`${API_URL}/applications/${jobId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });

      if (response.ok) {
        await fetchData(userId);
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const handleSaveJobDetails = async (jobId, updates, onSuccess) => {
    try {
      const response = await fetch(`${API_URL}/applications/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const result = await response.json();
        await fetchData(userId);
        if (result?.data) {
          setSelectedJob(result.data);
        } else {
          setSelectedJob(prev => (prev && prev._id === jobId ? { ...prev, ...updates } : prev));
        }
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error updating job:', err);
    }
  };

  const searchLower = searchTerm.toLowerCase();

  // Enhanced filter - search company, position, location, AND keywords
  const filteredJobs = jobs
    .filter(job => {
      const matchesStatus =
        filterStatus === 'All' ||
        job.status === filterStatus ||
        (filterStatus === 'Interview' && INTERVIEW_STATUSES.has(job.status));
      const matchesSearch =
        job.company.toLowerCase().includes(searchLower) ||
        job.position.toLowerCase().includes(searchLower) ||
        (job.location && job.location.toLowerCase().includes(searchLower)) ||
        (() => {
          const skillSource = Array.isArray(job.technicalDetails)
            ? job.technicalDetails
            : parseSkills(job.technicalDetails);
          return skillSource.some(tech => tech.toLowerCase().includes(searchLower));
        })();

      const matchesCollection =
        collectionFilter === 'all' ||
        (collectionFilter === 'favorites' && isCollectionJob(job)) ||
        (collectionFilter === 'nonFavorites' && !isCollectionJob(job));

      return matchesStatus && matchesSearch && matchesCollection;
    })
    .sort((a, b) => {
      if (collectionFilter !== 'nonFavorites') {
        const aFav = isCollectionJob(a) ? 1 : 0;
        const bFav = isCollectionJob(b) ? 1 : 0;
        if (aFav !== bFav) {
          return bFav - aFav;
        }
      }

      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'dateApplied' || sortBy === 'createdAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal === bVal) return 0;

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>👋 Welcome back</h1>
          <p style={styles.loginSubtitle}>Enter your User ID to access your saved applications.</p>
          
          <div style={styles.loginForm}>
            <label style={styles.label}>User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your User ID"
              style={styles.input}
            />
            
            {error && <div style={styles.error}>{error}</div>}
            
            <button 
              onClick={() => handleLogin()}
              disabled={loading}
              style={styles.loginButton}
            >
              {loading ? 'Connecting...' : 'Access Dashboard'}
            </button>
          </div>

          <div style={styles.loginFooter}>
            <p style={styles.footerText}>
              Don't have a User ID? Contact the administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div style={styles.container}>
      {/* Enhanced Header with Integrated Navigation */}
      <header style={styles.header}>
        <div style={styles.headerSurface}>
          <div style={styles.headerContent}>
            <div style={styles.branding}>
              <div style={styles.logoBadge}>
                <span role="img" aria-label="Analytics" style={styles.logoIcon}>📊</span>
              </div>
              <div>
                <h1 style={styles.headerTitle}>Job Application Tracker</h1>
                <p style={styles.headerSubtitle}>Monitor every stage of your job search with clarity.</p>
              </div>
            </div>

            <div style={styles.headerActions}>
              <button
                onClick={() => setShowSettings(true)}
                style={styles.settingsBtn}
                title="Open settings"
              >
                ⚙️ Settings
              </button>
              <span style={styles.userBadge}>Signed in as <strong>{userId}</strong></span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </div>
          </div>

          <div style={styles.navRow}>
            <div style={styles.tabToggle}>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'dashboard' ? styles.tabButtonActive : {})
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === 'analytics' ? styles.tabButtonActive : {})
                }}
              >
                Analytics
              </button>
            </div>

            <div style={styles.headerMeta}>
              <span style={styles.headerHint}>
                {stats ? `${stats.total} applications tracked so far` : 'Stay organised and keep your pipeline moving'}
              </span>
            </div>
          </div>
        </div>

      </header>

      {/* Conditional Rendering Based on Active Tab */}
      {activeTab === 'dashboard' ? (
        <>
          {/* Stats Cards */}
          {stats && (
            <div style={styles.statsGrid}>
              <StatCard
                title="Total Applications"
                value={stats.total}
                color="#3b82f6"
                icon="📝"
                description="Everything you've added to your tracker."
              />
              <StatCard
                title="Active Opportunities"
                value={stats.activeOpportunities}
                color="#8b5cf6"
                icon="🎯"
                description="Open roles that haven't been closed or rejected."
              />
              <StatCard
                title="Interviews"
                value={stats.interviewProgress}
                color="#f59e0b"
                icon="💼"
                description="OA, behavioral, technical, and final stages combined."
              />
              <StatCard
                title="Offers"
                value={stats.offers}
                color="#10b981"
                icon="🎉"
                description="Opportunities that reached an offer."
              />
            </div>
          )}

          {/* Enhanced Filters and Search */}
          <div style={styles.controls}>
            <div style={styles.searchBox}>
              <input
                type="text"
                placeholder="🔍 Search by company, position, location, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.filters}>
              <div style={styles.selectShell}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={styles.select}
                  aria-label="Filter by job status"
                >
                  <option value="All">All Status</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview (OA → Final)</option>
                  <option value="OA">OA</option>
                  <option value="Behavioral Interview">Behavioral</option>
                  <option value="Technical Interview">Technical</option>
                  <option value="Final Interview">Final</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                  <option value="No Response">No Response</option>
                </select>
                <span style={styles.selectChevron} aria-hidden="true">▾</span>
              </div>

              <div style={styles.selectShell}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={styles.select}
                  aria-label="Sort jobs by"
                >
                  <option value="dateApplied">Date Applied</option>
                  <option value="createdAt">Date Saved</option>
                  <option value="company">Company</option>
                  <option value="position">Position</option>
                </select>
                <span style={styles.selectChevron} aria-hidden="true">▾</span>
              </div>

              <button 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={styles.sortButton}
              >
                {sortOrder === 'asc' ? '⬆️' : '⬇️'}
              </button>

              <button
                onClick={() => fetchData(userId)}
                style={styles.refreshButton}
              >
                🔄 Refresh
              </button>
              <div style={styles.collectionToggles}>
                <label
                  style={{
                    ...styles.checkboxLabel,
                    ...(collectionFilter === 'favorites' ? styles.checkboxLabelActive : {})
                  }}
                  title="Only show starred jobs"
                >
                  <input
                    type="checkbox"
                    checked={collectionFilter === 'favorites'}
                    onChange={() =>
                      setCollectionFilter(collectionFilter === 'favorites' ? 'all' : 'favorites')
                    }
                    style={styles.hiddenCheckbox}
                  />
                  <span style={{
                    ...styles.checkboxIcon,
                    ...styles.checkboxIconStarred
                  }}
                  aria-hidden="true"
                  >
                    ★
                  </span>
                  <span style={styles.checkboxText}>Starred</span>
                  <span style={styles.srOnly}>Only collections</span>
                </label>
                <label
                  style={{
                    ...styles.checkboxLabel,
                    ...(collectionFilter === 'nonFavorites' ? styles.checkboxLabelActive : {})
                  }}
                  title="Only show non-starred jobs"
                >
                  <input
                    type="checkbox"
                    checked={collectionFilter === 'nonFavorites'}
                    onChange={() =>
                      setCollectionFilter(collectionFilter === 'nonFavorites' ? 'all' : 'nonFavorites')
                    }
                    style={styles.hiddenCheckbox}
                  />
                  <span
                    style={{
                      ...styles.checkboxIcon,
                      ...styles.checkboxIconUnstarred
                    }}
                    aria-hidden="true"
                  >
                    ☆
                  </span>
                  <span style={styles.checkboxText}>Not starred</span>
                  <span style={styles.srOnly}>Only non-collection</span>
                </label>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div style={styles.jobsContainer}>
            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : filteredJobs.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🔭</div>
                <h3>No applications found</h3>
                <p>
                  {searchTerm 
                    ? `No results for "${searchTerm}". Try a different search term.`
                    : 'Start tracking your job applications using the Chrome extension!'
                  }
                </p>
              </div>
            ) : (
              <div style={styles.jobsGrid}>
                {filteredJobs.map(job => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onClick={() => setSelectedJob(job)}
                    onToggleStar={(e) => toggleStar(job, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Analytics
          jobs={jobs}
          stats={stats}
          filteredJobs={filteredJobs}
          activeFilter={filterStatus}
          searchTerm={searchTerm}
        />
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdateStatus={updateJobStatus}
          onDelete={deleteJob}
          onSave={handleSaveJobDetails}
          onToggleFavorite={toggleStar}
        />
      )}

      {showSettings && (
        <SettingsModal
          noResponseDays={noResponseDays}
          onClose={() => setShowSettings(false)}
          onChangeDays={(value) => {
            const parsed = parseInt(value, 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
              setNoResponseDays(Math.min(parsed, 365));
            }
          }}
        />
      )}
    </div>
  );
};

// Components
const StatCard = ({ title, value, color, icon, description }) => (
  <div style={{ ...styles.statCard, borderLeftColor: color }}>
    <div style={styles.statIcon}>{icon}</div>
    <div style={styles.statContent}>
      <div style={styles.statTitle}>{title}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      {description && <p style={styles.statDescription}>{description}</p>}
    </div>
  </div>
);

// NEW: JobCard with Star Button
const JobCard = ({ job, onClick, onToggleStar }) => {
  const statusColors = {
    'Applied': '#3b82f6',
    'OA': '#f59e0b',
    'Behavioral Interview': '#8b5cf6',
    'Technical Interview': '#f97316',
    'Final Interview': '#6366f1',
    'Offer': '#10b981',
    'Rejected': '#ef4444',
    'No Response': '#6b7280'
  };

  const isStarred = isCollectionJob(job);
  const displaySkills = parseSkills(job.technicalDetails);

  return (
    <div style={styles.jobCard} onClick={onClick}>
      <div style={styles.jobCardHeader}>
        <h3 style={styles.jobTitle}>{job.position}</h3>
        <div style={styles.cardActions}>
          <button
            onClick={onToggleStar}
            style={{
              ...styles.starButton,
              ...(isStarred ? styles.starButtonActive : {}),
            }}
            aria-pressed={isStarred}
            title={isStarred ? 'Remove star' : 'Add star'}
          >
            {isStarred ? '⭐' : '☆'}
          </button>
          <span 
            style={{
              ...styles.statusBadge, 
              backgroundColor: statusColors[job.status] + '20',
              color: statusColors[job.status]
            }}
          >
            {job.status}
          </span>
        </div>
      </div>

      <div style={styles.jobCompany}>🏢 {job.company}</div>
      <div style={styles.jobLocation}>📍 {job.location}</div>
      
      {job.salary && job.salary !== 'Not specified' && (
        <div style={styles.jobSalary}>💰 {job.salary}</div>
      )}

      <div style={styles.jobMeta}>
        <span style={styles.jobDate}>
          📅 Applied: {new Date(job.dateApplied).toLocaleDateString()}
        </span>
      </div>

      {displaySkills.length > 0 && (
        <div style={styles.tags}>
          {displaySkills.slice(0, 3).map((tech, idx) => (
            <span key={idx} style={styles.tag}>{tech}</span>
          ))}
          {displaySkills.length > 3 && (
            <span style={styles.tag}>+{displaySkills.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

const SettingsModal = ({ noResponseDays, onClose, onChangeDays }) => {
  const [value, setValue] = useState(noResponseDays);

  useEffect(() => {
    setValue(noResponseDays);
  }, [noResponseDays]);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>⚙️ Settings</h3>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <p style={styles.settingHint}>
            Automatically move jobs without responses to <strong>No Response</strong> after the selected number of days.
          </p>
          <div style={styles.settingRow}>
            <label style={styles.settingLabel}>Auto "No Response" after</label>
            <div style={styles.settingControl}>
              <input
                type="number"
                min="1"
                max="365"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => onChangeDays(value)}
                style={styles.settingInput}
              />
              <span style={styles.settingUnit}>days</span>
            </div>
          </div>
          <div style={styles.settingActions}>
            <button
              onClick={() => {
                setValue(21);
                onChangeDays(21);
              }}
              style={styles.resetButton}
            >
              Reset to 21 days
            </button>
            <button
              onClick={() => {
                onChangeDays(value);
                onClose();
              }}
              style={styles.updateButton}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const JobDetailModal = ({ job, onClose, onUpdateStatus, onDelete, onSave, onToggleFavorite }) => {
  const buildFormState = (currentJob) => ({
    position: currentJob.position || '',
    company: currentJob.company || '',
    location: currentJob.location || '',
    salary: currentJob.salary || '',
    jobType: currentJob.jobType || '',
    experienceLevel: currentJob.experienceLevel || '',
    workArrangement: currentJob.workArrangement || '',
    dateApplied: currentJob.dateApplied ? new Date(currentJob.dateApplied).toISOString().slice(0, 10) : '',
    priority: currentJob.priority || 'Medium',
    status: currentJob.status || 'Applied',
    jobUrl: currentJob.jobUrl || '',
    notes: currentJob.notes || '',
    technicalDetails: Array.isArray(currentJob.technicalDetails)
      ? currentJob.technicalDetails.join(', ')
      : (currentJob.technicalDetails || '')
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState(buildFormState(job));

  useEffect(() => {
    setFormState(buildFormState(job));
    setIsEditing(false);
  }, [job]);

  const displaySkills = parseSkills(job.technicalDetails);
  const isStarred = isCollectionJob(job);

  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const payload = {
      position: formState.position.trim(),
      company: formState.company.trim(),
      location: formState.location.trim(),
      salary: formState.salary.trim(),
      jobType: formState.jobType.trim(),
      experienceLevel: formState.experienceLevel.trim(),
      workArrangement: formState.workArrangement.trim(),
      priority: formState.priority,
      status: formState.status,
      jobUrl: formState.jobUrl.trim(),
      notes: formState.notes,
      technicalDetails: formState.technicalDetails
        ? formState.technicalDetails.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean)
        : [],
    };

    if (formState.dateApplied) {
      payload.dateApplied = new Date(formState.dateApplied).toISOString();
    }

    onSave(job._id, payload, () => setIsEditing(false));
  };

  const resetForm = () => {
    setFormState(buildFormState(job));
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitleGroup}>
            <h2 style={styles.modalTitle}>{job.position}</h2>
            <button
              onClick={() => onToggleFavorite(job)}
              style={{
                ...styles.starButton,
                ...(isStarred ? styles.starButtonActive : {}),
                ...styles.modalStarButton,
              }}
              aria-pressed={isStarred}
              title={isStarred ? 'Remove star' : 'Add star'}
            >
              {isStarred ? '⭐' : '☆'}
            </button>
          </div>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.modalBody}>
          {!isEditing ? (
            <>
              <div style={styles.detailGrid}>
                <div style={styles.detailColumn}>
                  <div style={styles.detailRow}><strong>Company:</strong> {job.company}</div>
                  <div style={styles.detailRow}><strong>Location:</strong> {job.location || 'Not specified'}</div>
                  {job.salary && job.salary !== 'Not specified' && (
                    <div style={styles.detailRow}><strong>Salary:</strong> {job.salary}</div>
                  )}
                  <div style={styles.detailRow}><strong>Date Applied:</strong> {job.dateApplied ? new Date(job.dateApplied).toLocaleDateString() : 'Not tracked'}</div>
                </div>
                <div style={styles.detailColumn}>
                  <div style={styles.detailRow}><strong>Job Type:</strong> {job.jobType || 'Not specified'}</div>
                  <div style={styles.detailRow}><strong>Experience:</strong> {job.experienceLevel || 'Not specified'}</div>
                  <div style={styles.detailRow}><strong>Work Mode:</strong> {job.workArrangement || 'Not specified'}</div>
                  <div style={styles.detailRow}><strong>Priority:</strong> {job.priority || 'Medium'}</div>
                </div>
              </div>

              {displaySkills.length > 0 && (
                <div style={styles.detailRow}>
                  <strong>Skills:</strong>
                  <div style={styles.tags}>
                    {displaySkills.map((tech, idx) => (
                      <span key={idx} style={styles.tag}>{tech}</span>
                    ))}
                  </div>
                </div>
              )}

              {job.notes && (
                <div style={styles.detailRow}>
                  <strong>Notes:</strong>
                  <p style={styles.notes}>{job.notes}</p>
                </div>
              )}

              {job.jobUrl && (
                <div style={styles.detailRow}>
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    🔗 View Job Posting
                  </a>
                </div>
              )}

              <div style={styles.statusUpdate}>
                <label style={styles.label}>Quick Status Update:</label>
                <div style={styles.inlineStatus}>
                  <div style={styles.selectShell}>
                    <select
                      value={job.status}
                      onChange={(e) => onUpdateStatus(job._id, e.target.value)}
                      style={styles.select}
                      aria-label="Update job status"
                    >
                      <option value="Applied">Applied</option>
                      <option value="OA">OA</option>
                      <option value="Behavioral Interview">Behavioral Interview</option>
                      <option value="Technical Interview">Technical Interview</option>
                      <option value="Final Interview">Final Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                      <option value="No Response">No Response</option>
                    </select>
                    <span style={styles.selectChevron} aria-hidden="true">▾</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={styles.editButton}
                  >
                    ✏️ Edit Details
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={styles.editGrid}>
                <label style={styles.editField}>
                  <span>Position</span>
                  <input
                    type="text"
                    value={formState.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Company</span>
                  <input
                    type="text"
                    value={formState.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Location</span>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Salary</span>
                  <input
                    type="text"
                    value={formState.salary}
                    onChange={(e) => handleChange('salary', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Job Type</span>
                  <input
                    type="text"
                    value={formState.jobType}
                    onChange={(e) => handleChange('jobType', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Experience Level</span>
                  <input
                    type="text"
                    value={formState.experienceLevel}
                    onChange={(e) => handleChange('experienceLevel', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Work Arrangement</span>
                  <input
                    type="text"
                    value={formState.workArrangement}
                    onChange={(e) => handleChange('workArrangement', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Priority</span>
                  <div style={styles.selectShell}>
                    <select
                      value={formState.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      style={styles.select}
                      aria-label="Select job priority"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Dream Job">Dream Job</option>
                    </select>
                    <span style={styles.selectChevron} aria-hidden="true">▾</span>
                  </div>
                </label>
                <label style={styles.editField}>
                  <span>Status</span>
                  <div style={styles.selectShell}>
                    <select
                      value={formState.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      style={styles.select}
                      aria-label="Select job status"
                    >
                      <option value="Applied">Applied</option>
                      <option value="OA">OA</option>
                      <option value="Behavioral Interview">Behavioral Interview</option>
                      <option value="Technical Interview">Technical Interview</option>
                      <option value="Final Interview">Final Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                      <option value="No Response">No Response</option>
                    </select>
                    <span style={styles.selectChevron} aria-hidden="true">▾</span>
                  </div>
                </label>
                <label style={styles.editField}>
                  <span>Date Applied</span>
                  <input
                    type="date"
                    value={formState.dateApplied}
                    onChange={(e) => handleChange('dateApplied', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={{ ...styles.editField, gridColumn: '1 / -1' }}>
                  <span>Job Link</span>
                  <input
                    type="url"
                    value={formState.jobUrl}
                    onChange={(e) => handleChange('jobUrl', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={{ ...styles.editField, gridColumn: '1 / -1' }}>
                  <span>Skills (comma separated)</span>
                  <input
                    type="text"
                    value={formState.technicalDetails}
                    onChange={(e) => handleChange('technicalDetails', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={{ ...styles.editField, gridColumn: '1 / -1' }}>
                  <span>Notes</span>
                  <textarea
                    value={formState.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    style={styles.textarea}
                    rows={4}
                  />
                </label>
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    resetForm();
                    setIsEditing(false);
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={styles.updateButton}
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>

        <div style={styles.modalFooter}>
          <button 
            onClick={() => onDelete(job._id)}
            style={styles.deleteButton}
          >
            🗑️ Delete Application
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  loginBox: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  loginTitle: {
    fontSize: '32px',
    marginBottom: '8px',
    color: '#1f2937',
    textAlign: 'center',
  },
  loginSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '32px',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px',
  },
  input: {
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  loginButton: {
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    padding: '8px',
    background: '#fee2e2',
    borderRadius: '6px',
  },
  loginFooter: {
    marginTop: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f4f6fb 0%, #ffffff 30%)',
  },
  header: {
    background: 'linear-gradient(120deg, #312e81 0%, #1d4ed8 50%, #9333ea 100%)',
    padding: '48px 24px 32px',
    color: 'white',
  },
  headerSurface: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
    borderRadius: '24px',
    background: 'rgba(15, 23, 42, 0.35)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 25px 45px rgba(15, 23, 42, 0.35)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '32px',
    flexWrap: 'wrap',
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logoBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
  },
  logoIcon: {
    fontSize: '32px',
  },
  headerTitle: {
    fontSize: '34px',
    margin: 0,
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  headerSubtitle: {
    margin: '8px 0 0',
    fontSize: '16px',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    maxWidth: '520px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  tabToggle: {
    display: 'flex',
    gap: '12px',
    background: 'rgba(255,255,255,0.16)',
    padding: '6px',
    borderRadius: '999px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  tabButton: {
    padding: '10px 22px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.75)',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '0.01em',
    transition: 'all 0.25s ease',
  },
  tabButtonActive: {
    background: 'white',
    color: '#1d4ed8',
    boxShadow: '0 10px 20px rgba(59,130,246,0.35)',
  },
  navRow: {
    marginTop: '28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerHint: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.75)',
  },
  settingsBtn: {
    padding: '10px 18px',
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.35)',
    color: 'white',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '0.01em',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userBadge: {
    padding: '10px 18px',
    background: 'rgba(15,23,42,0.45)',
    borderRadius: '14px',
    fontSize: '15px',
    color: 'rgba(255,255,255,0.9)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  logoutBtn: {
    padding: '10px 20px',
    background: 'white',
    border: 'none',
    color: '#1d4ed8',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    boxShadow: '0 15px 30px rgba(255,255,255,0.25)',
    transition: 'transform 0.2s ease',
  },
  settingsPanel: {
    maxWidth: '1200px',
    margin: '20px auto 0',
    padding: '20px 28px',
    background: 'rgba(15,23,42,0.55)',
    borderRadius: '20px',
    backdropFilter: 'blur(22px)',
    boxShadow: '0 18px 35px rgba(15,23,42,0.35)',
    color: 'rgba(255,255,255,0.92)',
  },
  settingsTitle: {
    fontSize: '18px',
    margin: '0 0 16px 0',
    fontWeight: '600',
    letterSpacing: '0.01em',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
  },
  settingLabel: {
    fontSize: '15px',
    fontWeight: '500',
  },
  settingControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  settingInput: {
    width: '90px',
    padding: '8px 12px',
    border: '2px solid rgba(255,255,255,0.35)',
    borderRadius: '10px',
    fontSize: '15px',
    background: 'rgba(255,255,255,0.18)',
    color: 'white',
    outline: 'none',
  },
  settingUnit: {
    fontSize: '15px',
    fontWeight: '600',
  },
  settingHint: {
    fontSize: '13px',
    opacity: 0.85,
    margin: '6px 0 0 0',
  },
  statsGrid: {
    maxWidth: '1400px',
    margin: '32px auto',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  statCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderLeft: '4px solid',
  },
  statIcon: {
    fontSize: '32px',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statTitle: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
  },
  statDescription: {
    fontSize: '13px',
    color: '#4b5563',
    margin: 0,
  },
  controls: {
    maxWidth: '1400px',
    margin: '24px auto',
    padding: '0 24px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: '1',
    minWidth: '300px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  selectShell: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.9) 100%)',
    borderRadius: '18px',
    boxShadow: '0 16px 40px rgba(15,23,42,0.14)',
    minWidth: '170px',
    padding: '2px 4px',
    border: '1px solid rgba(148,163,184,0.25)',
    backdropFilter: 'blur(18px)',
  },
  select: {
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    padding: '12px 44px 12px 18px',
    border: 'none',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: 500,
    background: 'transparent',
    color: '#0f172a',
    width: '100%',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
  },
  selectChevron: {
    position: 'absolute',
    right: '16px',
    pointerEvents: 'none',
    color: '#475569',
    fontSize: '14px',
  },
  collectionToggles: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  checkboxLabel: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'rgba(248,250,252,0.95)',
    borderRadius: '14px',
    fontSize: '13px',
    color: '#1f2937',
    cursor: 'pointer',
    border: '1px solid rgba(148,163,184,0.25)',
    boxShadow: '0 10px 28px rgba(15,23,42,0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  },
  checkboxLabelActive: {
    borderColor: '#2563eb',
    boxShadow: '0 14px 36px rgba(37,99,235,0.25)',
    background: 'linear-gradient(135deg, rgba(219,234,254,0.95) 0%, rgba(191,219,254,0.9) 100%)',
  },
  hiddenCheckbox: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
  checkboxIcon: {
    fontSize: '18px',
    lineHeight: 1,
    minWidth: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxIconStarred: {
    color: '#f59e0b',
    fontSize: '20px',
    filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.35))',
  },
  checkboxIconUnstarred: {
    color: '#94a3b8',
    fontSize: '20px',
  },
  checkboxText: {
    fontWeight: 600,
    color: '#0f172a',
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
  sortButton: {
    padding: '12px 16px',
    background: 'white',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  refreshButton: {
    padding: '12px 22px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 12px 24px rgba(37,99,235,0.25)',
  },
  jobsContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px 40px',
  },
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  jobCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  jobCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
  },
  jobTitle: {
    fontSize: '18px',
    color: '#1f2937',
    margin: 0,
    lineHeight: '1.3',
    flex: 1,
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  starButton: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(226,232,240,0.9) 100%)',
    border: '1px solid rgba(148,163,184,0.35)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '6px 10px',
    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
    borderRadius: '999px',
    color: '#d1d5db',
  },
  starButtonActive: {
    color: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.55)',
    boxShadow: '0 10px 24px rgba(245, 158, 11, 0.25)',
    background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.95) 0%, rgba(253, 230, 138, 0.9) 100%)',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  jobCompany: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '6px',
  },
  jobLocation: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '6px',
  },
  jobSalary: {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '600',
    marginBottom: '8px',
  },
  jobMeta: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  },
  jobDate: {
    display: 'block',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  tag: {
    padding: '4px 8px',
    background: '#e0e7ff',
    color: '#4f46e5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#6b7280',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  modalTitle: {
    fontSize: '24px',
    color: '#1f2937',
    margin: 0,
  },
  modalStarButton: {
    paddingInline: '10px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
  },
  modalBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  detailColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    fontSize: '14px',
    color: '#374151',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  notes: {
    marginTop: '4px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '10px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
  statusUpdate: {
    marginTop: '8px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  inlineStatus: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  editButton: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  editGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  editField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#374151',
    fontWeight: '600',
  },
  textarea: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  updateButton: {
    padding: '12px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  deleteButton: {
    padding: '10px 18px',
    background: '#fee2e2',
    color: '#b91c1c',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  settingsModal: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px 28px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 45px rgba(15,23,42,0.2)',
  },
  settingActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
  },
  resetButton: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
};

export default JobTracker;
```
