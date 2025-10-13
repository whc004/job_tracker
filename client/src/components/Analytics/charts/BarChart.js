import React from 'react';

const BarChart = ({ data, maxValue }) => {
  if (!data || data.length === 0) {
    return <div style={styles.empty}>No data to display</div>;
  }

  const safeMaxValue = maxValue > 0 ? maxValue : 1;

  return (
    <div style={styles.container}>
      <div style={styles.barsContainer}>
        {data.map((item, index) => {
          const percentage = (item.value / safeMaxValue) * 100;
          
          return (
            <div key={index} style={styles.barWrapper}>
              <div style={styles.barLabel}>{item.label}</div>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${percentage}%`,
                  }}
                >
                  <span style={styles.barValue}>{item.displayValue}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    padding: '8px 0',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  barsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  barWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barLabel: {
    minWidth: '120px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    textAlign: 'right',
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: '36px',
    background: '#f1f5f9',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '12px',
    minWidth: '60px',
    transition: 'width 0.3s ease',
    borderRadius: '8px',
  },
  barValue: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'white',
    whiteSpace: 'nowrap',
  },
};

export default BarChart;