import React, { useMemo, useState } from 'react';
import AnalyticsControls from './AnalyticsControls';
import DefaultCharts from './DefaultCharts';
import CustomChart from './CustomChart';
//import MetricsCards from './MetricsCards';
import { isStarredJob } from '../helpers/analytics';
import { JOB_STATUS, INTERVIEW_STATUSES } from '../../shared-constants';

const STATUS_MAP = {
  'all': null,
  'applied': JOB_STATUS.APPLIED,
  'interview': INTERVIEW_STATUSES,
  'round1': JOB_STATUS.INTERVIEW_ROUND_1,
  'round2': JOB_STATUS.INTERVIEW_ROUND_2,
  'round3': JOB_STATUS.INTERVIEW_ROUND_3,
  'round4': JOB_STATUS.INTERVIEW_ROUND_4,
  'round5plus': JOB_STATUS.INTERVIEW_ROUND_5_TO_10,
  'offer': JOB_STATUS.OFFER,
  'rejected': JOB_STATUS.REJECTED,
  'noresponse': JOB_STATUS.NO_RESPONSE,
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