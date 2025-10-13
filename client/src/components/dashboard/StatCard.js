import React from 'react';

const StatCard = ({ title, value, color, icon, description }) => (
  <div style={{ ...styles.card, borderLeftColor: color }}>
    <div style={styles.icon}>{icon}</div>
    <div style={styles.content}>
      <div style={{ ...styles.value, color }}>{value}</div>
      <div style={styles.title}>{title}</div>
      {description && <p style={styles.description}>{description}</p>}
    </div>
  </div>
);

const styles = {
  card: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderLeft: '4px solid',
  },
  icon: {
    fontSize: '32px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  // BIG NUMBER
  value: {
    fontSize: '36px',  // Bigger!
    fontWeight: '700',
    lineHeight: '1',
  },
  // Title is smaller
  title: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  description: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '4px 0 0 0',
  },
};

export default StatCard;