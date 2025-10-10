import React, { useState } from 'react';

const Analytics = ({ jobs, stats, filteredJobs = [], activeFilter, searchTerm }) => {
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('status');
  const [yAxis, setYAxis] = useState('count');
  const [dataScope, setDataScope] = useState('filtered');

  const hasFilterSelection = (activeFilter && activeFilter !== 'All') || (searchTerm && searchTerm.trim().length > 0);
  const effectiveFilteredJobs = filteredJobs.length > 0 || hasFilterSelection ? filteredJobs : jobs;
  const dataset = dataScope === 'filtered' ? effectiveFilteredJobs : jobs;

  // Prepare data based on selections
  const getChartData = (sourceJobs) => {
    if (!sourceJobs || sourceJobs.length === 0) return [];

    if (xAxis === 'status') {
      const statusCounts = {};
      sourceJobs.forEach(job => {
        statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
      });
      return Object.entries(statusCounts).map(([key, value]) => ({ label: key, value }));
    } else if (xAxis === 'company') {
      const companyCounts = {};
      sourceJobs.forEach(job => {
        companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
      });
      return Object.entries(companyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, value]) => ({ label: key, value }));
    } else if (xAxis === 'month') {
      const monthCounts = {};
      sourceJobs.forEach(job => {
        if (!job.dateApplied) return;
        const month = new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
      return Object.entries(monthCounts).map(([key, value]) => ({ label: key, value }));
    }
    return [];
  };

  const chartData = getChartData(dataset);
  const hasData = chartData.length > 0;
  const maxValue = hasData ? Math.max(...chartData.map(d => d.value)) : 0;
  const averageValue = hasData
    ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1)
    : '—';

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

          <div style={styles.scopeContext}>
            <span style={styles.scopeBadge}>
              Scope: {dataScope === 'filtered' ? 'Dashboard filters' : 'All records'}
            </span>
            {dataScope === 'filtered' && (
              <>
                <span style={styles.scopeBadge}>
                  Status: {activeFilter || 'All'}
                </span>
                {searchTerm && searchTerm.trim().length > 0 && (
                  <span style={styles.scopeBadge}>
                    Search: “{searchTerm.trim()}”
                  </span>
                )}
              </>
            )}
            <span style={styles.scopeBadge}>
              {dataset.length} matching records
            </span>
            {stats && (
              <span style={styles.scopeBadge}>
                Total saved: {stats.total}
              </span>
            )}
          </div>
        </div>

        <div style={styles.chartControls}>
          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Chart Type:</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={styles.select}
            >
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>

          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>X-Axis:</label>
            <select 
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              style={styles.select}
            >
              <option value="status">Status</option>
              <option value="company">Company (Top 10)</option>
              <option value="month">Month</option>
            </select>
          </div>

          <div style={styles.controlGroup}>
            <label style={styles.controlLabel}>Y-Axis:</label>
            <select 
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              style={styles.select}
            >
              <option value="count">Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div style={styles.chartContainer}>
        {!hasData ? (
          <div style={styles.emptyChart}>
            {dataset.length === 0
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
                    <span style={styles.barValue}>{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}

            {chartType === 'pie' && (
              <div style={styles.pieChart}>
                <PieChart data={chartData} />
              </div>
            )}

            {chartType === 'line' && (
              <div style={styles.lineChart}>
                <LineChart data={chartData} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Summary */}
      <div style={styles.statsSummary}>
        <h3 style={styles.summaryTitle}>Summary Statistics</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Total Data Points</div>
            <div style={styles.summaryValue}>{chartData.length}</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Maximum Value</div>
            <div style={styles.summaryValue}>{hasData ? maxValue : '—'}</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Average</div>
            <div style={styles.summaryValue}>{averageValue}</div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Records Analysed</div>
            <div style={styles.summaryValue}>{dataset.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Pie Chart Component
const PieChart = ({ data }) => {
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
              {item.label}: {item.value} ({((item.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple Line Chart Component
const LineChart = ({ data }) => {
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
      {/* Grid lines */}
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

      {/* Line */}
      {data.length > 1 && (
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
        />
      )}

      {/* Points */}
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
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  const colors = {
    'Applied': '#3b82f6',
    'OA': '#f59e0b',
    'Behavioral Interview': '#8b5cf6',
    'Technical Interview': '#f97316',
    'Final Interview': '#6366f1',
    'Offer': '#10b981',
    'Rejected': '#ef4444',
    'No Response': '#6b7280'
  };
  return colors[status] || '#6b7280';
};

// Styles
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
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    background: '#f8fafc',
    marginBottom: '20px',
  },
  scopeButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  scopeButton: {
    padding: '10px 18px',
    borderRadius: '999px',
    border: '1px solid #cbd5f5',
    background: 'white',
    color: '#1d4ed8',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  scopeButtonActive: {
    background: '#1d4ed8',
    color: 'white',
    border: '1px solid #1d4ed8',
    boxShadow: '0 10px 20px rgba(29,78,216,0.25)',
  },
  scopeContext: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  scopeBadge: {
    padding: '8px 12px',
    borderRadius: '999px',
    background: '#e0e7ff',
    color: '#1e3a8a',
    fontSize: '13px',
    fontWeight: '600',
  },
  chartControls: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '200px',
  },
  controlLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  select: {
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  chartContainer: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  emptyChart: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
    fontSize: '16px',
  },
  barChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  barGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    minWidth: '150px',
  },
  barWrapper: {
    flex: 1,
    height: '32px',
    background: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '8px',
    transition: 'width 0.5s ease',
  },
  barValue: {
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
  },
  pieChart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
  },
  pieContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  pieSvg: {
    width: '300px',
    height: '300px',
  },
  pieLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
  },
  legendText: {
    fontSize: '14px',
    color: '#374151',
  },
  lineChart: {
    width: '100%',
  },
  lineSvg: {
    width: '100%',
    height: 'auto',
  },
  statsSummary: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  summaryTitle: {
    fontSize: '18px',
    color: '#1f2937',
    marginBottom: '16px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  summaryItem: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
};

export default Analytics;