import React, { useMemo } from 'react';
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
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
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

const MetricsCards = ({ scopedJobs }) => {
  const summaryMetrics = useMemo(() => computeSummaryMetrics(scopedJobs), [scopedJobs]);
  const timingMetrics = useMemo(() => computeTimingMetrics(scopedJobs), [scopedJobs]);

  const metrics = [
    {
      label: 'Total Applications',
      value: summaryMetrics.totalApplications,
      description: 'Count of all submitted applications',
    },
    {
      label: 'Active Applications',
      value: summaryMetrics.activeApplications,
      description: 'Applications still in process (no rejection/offer yet)',
    },
    {
      label: 'Closed Applications',
      value: summaryMetrics.closedApplications,
      description: 'Applications marked as rejected, withdrawn, or accepted',
    },
    {
      label: 'Response Rate',
      value: summaryMetrics.responseRate,
      description: '% of applications that received any response',
    },
    {
      label: 'Offer Rate',
      value: summaryMetrics.offerRate,
      description: '% of total applications that resulted in offers',
    },
    {
      label: 'Interview Rate',
      value: summaryMetrics.interviewRate,
      description: '% that reached interview stage',
    },
    {
      label: 'Applications this Week',
      value: timingMetrics.thisWeekCount || 'Not enough data',
      description: 'Submissions during the current calendar week',
    },
    {
      label: 'Applications this Month',
      value: timingMetrics.thisMonthCount || 'Not enough data',
      description: 'Submissions during the current calendar month',
    },
  ];

  return (
    <div style={styles.metricsSection}>
      <div style={styles.metricsCard}>
        <h3 style={styles.metricsTitle}>Summary</h3>
        <div style={styles.metricsGrid}>
          {metrics.slice(0, 8).map((metric, index) => (
            <div key={index} style={styles.metricItem}>
              <div style={styles.metricValue}>{metric.value}</div>
              <div style={styles.metricLabel}>{metric.label}</div>
              <div style={styles.metricDescription}>{metric.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
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
    margin: '0 0 16px',
    fontSize: '18px',
    color: '#0f172a',
    fontWeight: 700,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
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
  metricValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#1d4ed8',
  },
  metricLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
  },
  metricDescription: {
    fontSize: '12px',
    color: '#475569',
    lineHeight: 1.5,
  },
};

export default MetricsCards;