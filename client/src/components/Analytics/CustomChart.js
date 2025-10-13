import React, { useMemo, useState } from 'react';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';
import LineChart from './charts/LineChart';
import {
  AXIS_OPTIONS,
  groupJobsByAxis,
  computeMetricValue,
  formatValueForDisplay,
  getAvailableMetrics
} from '../helpers/analytics';

const CustomChart = ({ scopedJobs }) => {
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('status');
  const [yAxis, setYAxis] = useState('count');

  const groups = useMemo(
    () => groupJobsByAxis(scopedJobs, xAxis),
    [scopedJobs, xAxis]
  );

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

  const hasData = chartData.length > 0;
  const maxValue = hasData ? Math.max(...chartData.map(d => d.value)) : 0;

  return (
    <>
      {/* Chart Controls */}
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

      {/* Chart Display */}
      <div style={styles.chartContainer}>
        {!hasData ? (
          <div style={styles.emptyChart}>
            {scopedJobs.length === 0
              ? 'No applications match the selected scope yet.'
              : 'Data is available, but adjust the axis options to visualise it.'}
          </div>
        ) : (
          <>
            {chartType === 'bar' && <BarChart data={chartData} maxValue={maxValue} />}
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
    </>
  );
};

const styles = {
  chartControls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
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
    cursor: 'pointer',
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
  pieChart: {
    display: 'flex',
    justifyContent: 'center',
  },
  lineChart: {
    width: '100%',
  },
};

export default CustomChart;