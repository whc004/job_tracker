// client/src/components/JobCard.js
import React from 'react';
import { parseSkills, isCollectionJob, statusColors, formatDateUTC } from '../helpers/default';

const JobCard = ({ job, onClick, onToggleStar, isSelected, onToggleSelect, selectMode }) => {
  const isStarred = isCollectionJob(job);
  const displaySkills = parseSkills(job.technicalDetails);

  return (
    <div 
      style={{
        ...styles.card,
        border: isSelected ? '3px solid #2563eb' : '1px solid #e5e7eb',
      }}
      onClick={() => {
        if (selectMode) {
          onToggleSelect(job._id);
        } else {
          onClick();
        }
      }}
    >
      <div style={styles.header}>
        <h3 style={styles.title}>{job.position}</h3>
        
        {/* FIXED: Moved checkbox to top-right, grouped with star and status */}
        <div style={styles.actions}>
          {selectMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(job._id)}
              style={styles.checkbox}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          {!selectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(e);
              }}
              style={{
                ...styles.starButton,
                ...(isStarred ? styles.starButtonActive : {}),
              }}
            >
              {isStarred ? '⭐' : '☆'}
            </button>
          )}
          
          <span 
            style={{
              ...styles.badge, 
              backgroundColor: statusColors[job.status] + '20',
              color: statusColors[job.status]
            }}
          >
            {job.status}
          </span>
        </div>
      </div>

      <div style={styles.company}>🏢 {job.company}</div>
      <div style={styles.location}>📍 {job.location}</div>
      
      {job.salary && job.salary !== 'Not specified' && (
        <div style={styles.salary}>💰 {job.salary}</div>
      )}

      <div style={styles.meta}>
        <span style={styles.date}>
          📅 Applied: {job.dateApplied ? formatDateUTC(job.dateApplied) : 'Not tracked'}
        </span>
      </div>

      {displaySkills.length > 0 && (
        <div style={styles.tags}>
          {displaySkills.slice(0, 3).map((tech, idx) => (
            <span key={idx} style={styles.tag}>{tech}</span>
          ))}
          {displaySkills.length > 3 && (
            <span style={styles.tag}>+{displaySkills.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
  },
  title: {
    fontSize: '18px',
    color: '#1f2937',
    margin: 0,
    lineHeight: '1.3',
    flex: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  // FIXED: Checkbox now styled to match the top-right position
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    accentColor: '#2563eb',
  },
  starButton: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(226,232,240,0.9) 100%)',
    border: '1px solid rgba(148,163,184,0.35)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '999px',
    color: '#d1d5db',
  },
  starButtonActive: {
    color: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.55)',
    boxShadow: '0 10px 24px rgba(245, 158, 11, 0.25)',
    background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.95) 0%, rgba(253, 230, 138, 0.9) 100%)',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  company: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '6px',
  },
  location: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '6px',
  },
  salary: {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '600',
    marginBottom: '8px',
  },
  meta: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  },
  date: {
    display: 'block',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  tag: {
    padding: '4px 8px',
    background: '#e0e7ff',
    color: '#4f46e5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },
};

export default JobCard;