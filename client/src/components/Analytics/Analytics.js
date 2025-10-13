import React, { useMemo, useState } from 'react';
import AnalyticsControls from './AnalyticsControls';
import DefaultCharts from './DefaultCharts';
import CustomChart from './CustomChart';
//import MetricsCards from './MetricsCards';
import { isStarredJob } from '../helpers/analytics';

const STATUS_MAP = {
  'all': null,
  'applied': 'Applied',
  'interview': ['OA', 'Behavioral Interview', 'Technical Interview', 'Final Interview'],
  'oa': 'OA',
  'behavioral': 'Behavioral Interview',
  'technical': 'Technical Interview',
  'final': 'Final Interview',
  'offer': 'Offer',
  'rejected': 'Rejected',
};

const Analytics = ({ jobs = [], stats }) => {
  const [dataScope, setDataScope] = useState('all');
  const [starScope, setStarScope] = useState('all');

  const baseJobs = useMemo(() => {
    if (dataScope === 'all') {
      return jobs;
    }
    
    const statusFilter = STATUS_MAP[dataScope];
    if (!statusFilter) return jobs;

    if (Array.isArray(statusFilter)) {
      return jobs.filter(job => statusFilter.includes(job.status));
    }
    
    return jobs.filter(job => job.status === statusFilter);
  }, [jobs, dataScope]);

  const scopedJobs = useMemo(() => {
    if (starScope === 'starred') return baseJobs.filter(isStarredJob);
    if (starScope === 'unstarred') return baseJobs.filter(job => !isStarredJob(job));
    return baseJobs;
  }, [baseJobs, starScope]);

  return (
    <div style={styles.analyticsContainer}>
      <AnalyticsControls
        dataScope={dataScope}
        setDataScope={setDataScope}
        starScope={starScope}
        setStarScope={setStarScope}
        scopedJobsCount={scopedJobs.length}
        stats={stats}
      />

      <DefaultCharts scopedJobs={scopedJobs} />
      
      <CustomChart scopedJobs={scopedJobs} />
    </div>
  );
};

const styles = {
  analyticsContainer: {
    maxWidth: '1400px',
    margin: '32px auto',
    padding: '0 24px',
  },
};

export default Analytics;