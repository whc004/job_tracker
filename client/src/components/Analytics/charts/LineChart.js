import React from 'react';

const LineChart = ({ data, valueFormatter }) => {
  if (!data || data.length === 0) {
    return <div style={styles.empty}>No data to display</div>;
  }

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue || 1;

  const baseWidth = 800;
  const minWidth = 600;
  const maxWidth = 1200;
  const pointWidth = Math.max(80, Math.min(150, baseWidth / data.length));
  const chartWidth = Math.max(minWidth, Math.min(maxWidth, pointWidth * data.length + 120));
  
  const chartHeight = 300;
  const padding = { top: 20, right: 40, bottom: 70, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * plotWidth;
    const normalizedValue = (item.value - minValue) / valueRange;
    const y = padding.top + plotHeight - normalizedValue * plotHeight;
    return { x, y, ...item };
  });

  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const gridLines = 5;
  const yGridLines = Array.from({ length: gridLines + 1 }, (_, i) => {
    const value = minValue + (valueRange * i) / gridLines;
    const y = padding.top + plotHeight - (i / gridLines) * plotHeight;
    return { y, value };
  });

  const getLabelsToShow = () => {
    if (data.length <= 7) {
      return data.map((_, i) => i);
    } else if (data.length <= 15) {
      return data.map((_, i) => i).filter(i => i % 2 === 0 || i === data.length - 1);
    } else {
      const indices = [0, data.length - 1];
      const step = Math.ceil((data.length - 2) / 5);
      for (let i = step; i < data.length - 1; i += step) {
        indices.push(i);
      }
      return indices.sort((a, b) => a - b);
    }
  };

  const labelsToShow = getLabelsToShow();

  return (
    <div style={styles.container}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        {yGridLines.map((line, index) => (
          <g key={index}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={chartWidth - padding.right}
              y2={line.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#64748b"
            >
              {valueFormatter ? valueFormatter(line.value) : Math.round(line.value)}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#cbd5e1"
          strokeWidth="2"
        />

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke="#cbd5e1"
          strokeWidth="2"
        />

        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.length > 0 && (
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${points[0].x} ${chartHeight - padding.bottom} Z`}
            fill="url(#lineGradient)"
            opacity="0.2"
          />
        )}

        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke="#3b82f6"
              strokeWidth="3"
            />
            <title>
              {point.label}: {valueFormatter ? valueFormatter(point.value) : point.displayValue || point.value}
            </title>
          </g>
        ))}

        {points.map((point, index) => {
          if (!labelsToShow.includes(index)) return null;
          
          return (
            <text
              key={index}
              x={point.x}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  svg: {
    width: '100%',
    height: 'auto',
  },
};

export default LineChart;