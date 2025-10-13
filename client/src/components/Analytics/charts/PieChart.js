import React from 'react';

const PieChart = ({ data, valueFormatter }) => {
  if (!data || data.length === 0) {
    return <div style={styles.empty}>No data to display</div>;
  }

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  
  if (total === 0) {
    return <div style={styles.empty}>No data to display</div>;
  }

  const colors = [
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  // Convert to polar coordinates for SVG path
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Create arc path
  const createArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', x, y,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  // Calculate slices
  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
      color: colors[index % colors.length],
    };
  });

  const size = 240;
  const center = size / 2;
  const radius = size * 0.35; // 35% of size

  return (
    <div style={styles.container}>
      <svg viewBox={`0 0 ${size} ${size}`} style={styles.svg}>
        {slices.length === 1 ? (
          // Special case: single slice = full circle
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill={slices[0].color}
            stroke="white"
            strokeWidth="2"
          >
            <title>
              {slices[0].label}: {valueFormatter ? valueFormatter(slices[0].value) : slices[0].displayValue || slices[0].value} ({slices[0].percentage.toFixed(1)}%)
            </title>
          </circle>
        ) : (
          // Multiple slices: draw arcs
          slices.map((slice, index) => (
            <g key={index}>
              <path
                d={createArc(center, center, radius, slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
              >
                <title>
                  {slice.label}: {valueFormatter ? valueFormatter(slice.value) : slice.displayValue || slice.value} ({slice.percentage.toFixed(1)}%)
                </title>
              </path>
            </g>
          ))
        )}
      </svg>
      
      <div style={styles.legend}>
        {slices.map((slice, index) => (
          <div key={index} style={styles.legendItem}>
            <div
              style={{
                ...styles.legendColor,
                background: slice.color,
              }}
            />
            <div style={styles.legendText}>
              <span style={styles.legendLabel}>
                {slice.label}: {valueFormatter ? valueFormatter(slice.value) : slice.displayValue || slice.value} ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '16px',
    width: '100%',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  svg: {
    width: '240px',
    height: '240px',
    maxWidth: '100%',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '400px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid rgba(148,163,184,0.2)',
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
  },
};

export default PieChart;