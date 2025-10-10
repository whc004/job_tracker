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
