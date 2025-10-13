import React, { useMemo } from 'react';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import {
  buildApplicationsPerDaySeries,
  buildApplicationsPerWeekSeries,
  buildApplicationsPerMonthSeries,
  buildStatusWorkStyleData,
  formatValueForDisplay,
  formatDayLabel,
  getStartOfDay,
  MS_PER_DAY
} from '../helpers/analytics';

const DefaultCharts = ({ scopedJobs }) => {
  /*
  React.useEffect(() => {
    console.log('=== DEBUG: Job Data ===');
    console.log('Total jobs:', scopedJobs.length);
    if (scopedJobs.length > 0) {
      console.log('First job object:', scopedJobs[0]);
      console.log('All job keys:', Object.keys(scopedJobs[0]));
      console.log('Work style values:', scopedJobs.map(job => ({
        workStyle: job.workStyle,
        workstyle: job.workstyle,
        remote: job.remote,
        workLocation: job.workLocation,
        jobType: job.jobType,
      })));
    }
    console.log('===================');
  }, [scopedJobs]);
  */
  const [timeView, setTimeView] = React.useState('day');

  const applicationsPerDay = useMemo(
    () => buildApplicationsPerDaySeries(scopedJobs),
    [scopedJobs]
  );

  const applicationsPerWeek = useMemo(
    () => buildApplicationsPerWeekSeries(scopedJobs),
    [scopedJobs]
  );

  const applicationsPerMonth = useMemo(
    () => buildApplicationsPerMonthSeries(scopedJobs),
    [scopedJobs]
  );

  const statusPieData = useMemo(
    () => buildStatusWorkStyleData(scopedJobs),
    [scopedJobs]
  );

  const getTimeSeriesData = () => {
    switch (timeView) {
      case 'week':
        return applicationsPerWeek;
      case 'month':
        return applicationsPerMonth;
      case 'day':
      default:
        return applicationsPerDay;
    }
  };

  const getTimeSeriesTitle = () => {
    switch (timeView) {
      case 'week':
        return 'Applications per week';
      case 'month':
        return 'Applications per month';
      case 'day':
      default:
        return 'Applications per day';
    }
  };

  const getTimeSeriesSubtitle = () => {
    switch (timeView) {
      case 'week':
        return 'Weekly submission trend';
      case 'month':
        return 'Monthly submission trend';
      case 'day':
      default:
        return 'Daily submission trend';
    }
  };

  const timeSeriesData = getTimeSeriesData();

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

  return (
    <div style={styles.defaultCharts}>
      <div style={styles.defaultChartCard}>
        <div style={styles.defaultChartHeader}>
          <div style={styles.titleRow}>
            <div>
              <h3 style={styles.defaultChartTitle}>{getTimeSeriesTitle()}</h3>
              <span style={styles.defaultChartSubtitle}>{getTimeSeriesSubtitle()}</span>
            </div>
            <div style={styles.timeViewSelector}>
              <select
                value={timeView}
                onChange={(e) => setTimeView(e.target.value)}
                style={styles.select}
              >
                <option value="day">Per Day</option>
                <option value="week">Per Week</option>
                <option value="month">Per Month</option>
              </select>
              <span style={styles.selectChevron} aria-hidden="true">▾</span>
            </div>
          </div>
        </div>
        {timeSeriesData.length === 0 ? (
          <div style={styles.emptyChart}>No dated applications yet.</div>
        ) : (
          <>
            <div style={styles.lineChart}>
              <LineChart
                data={timeSeriesData}
                valueFormatter={(value) => formatValueForDisplay('count', value)}
              />
            </div>
            {timeView === 'day' && dailyTrendSummary && (
              <p style={styles.chartContextText}>
                Showing {dailyTrendSummary.uniqueCount.toLocaleString()} submission day
                {dailyTrendSummary.uniqueCount !== 1 ? 's' : ''} between{' '}
                {dailyTrendSummary.startLabel} and {dailyTrendSummary.endLabel}. Days without
                applications are omitted, so the line spans{' '}
                {dailyTrendSummary.spanDays.toLocaleString()} calendar day
                {dailyTrendSummary.spanDays !== 1 ? 's' : ''} even if only a few points appear.
              </p>
            )}
          </>
        )}
      </div>

      <div style={styles.defaultChartCard}>
        <div style={styles.defaultChartHeader}>
          <h3 style={styles.defaultChartTitle}>Pipeline & work arrangement mix</h3>
          <span style={styles.defaultChartSubtitle}>Status distribution with remote, hybrid, and on-site insight</span>
        </div>
        {statusPieData.length === 0 ? (
          <div style={styles.emptyChart}>No applications available for this view.</div>
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
  );
};

const styles = {
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
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
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
  timeViewSelector: {
    position: 'relative',
    minWidth: '140px',
  },
  select: {
    width: '100%',
    padding: '8px 32px 8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(148,163,184,0.4)',
    appearance: 'none',
    background: 'white',
    color: '#0f172a',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  selectChevron: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#475569',
    fontSize: '12px',
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
  lineChart: {
    width: '100%',
  },
  pieChart: {
    display: 'flex',
    justifyContent: 'center',
  },
  chartContextText: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#475569',
    lineHeight: 1.5,
  },
};

export default DefaultCharts;