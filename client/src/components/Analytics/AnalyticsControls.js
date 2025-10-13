import React from 'react';

const AnalyticsControls = ({
  dataScope,
  setDataScope,
  starScope,
  setStarScope,
  scopedJobsCount,
  stats,
  filterLabel,
  searchTerm,
}) => {
  return (
    <div style={styles.controlsContainer}>
      <div style={styles.header}>
        <h2 style={styles.title}>Analytics Dashboard</h2>
        <div style={styles.jobCount}>
          Analyzing <strong>{scopedJobsCount}</strong> application{scopedJobsCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={styles.scopeControls}>
        {/* Data Scope Dropdown */}
        <div style={styles.controlGroup}>
          <label style={styles.label}>Data Scope:</label>
          <div style={styles.selectShell}>
            <select value={dataScope} onChange={(e) => setDataScope(e.target.value)} style={styles.select}>
              <option value="all">All Applications</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview (All Rounds)</option>
              <option value="round1">Interview - Round 1</option>
              <option value="round2">Interview - Round 2</option>
              <option value="round3">Interview - Round 3</option>
              <option value="round4">Interview - Round 4</option>
              <option value="round5plus">Interview - Round 5+</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="noresponse">No Response</option>
            </select>
            <span style={styles.selectChevron} aria-hidden="true">▾</span>
          </div>
        </div>

        {/* Priority Filter */}
        <div style={styles.controlGroup}>
          <label style={styles.label}>Priority Filter:</label>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => setStarScope('all')}
              style={{
                ...styles.button,
                ...(starScope === 'all' ? styles.buttonActive : {}),
              }}
            >
              All
            </button>
            <button
              onClick={() => setStarScope('starred')}
              style={{
                ...styles.button,
                ...(starScope === 'starred' ? styles.buttonActive : {}),
              }}
            >
              ⭐ Star
            </button>
            <button
              onClick={() => setStarScope('unstarred')}
              style={{
                ...styles.button,
                ...(starScope === 'unstarred' ? styles.buttonActive : {}),
              }}
            >
              Standard
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div style={styles.quickStats}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.total || 0}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.applied || 0}</span>
            <span style={styles.statLabel}>Applied</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.interviewing || 0}</span>
            <span style={styles.statLabel}>Interview</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.rejected || 0}</span>
            <span style={styles.statLabel}>Rejected</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.offered || 0}</span>
            <span style={styles.statLabel}>Offered</span>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  controlsContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f172a',
  },
  jobCount: {
    fontSize: '14px',
    color: '#475569',
    padding: '8px 16px',
    background: '#f1f5f9',
    borderRadius: '8px',
  },
  scopeControls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#1e293b',
  },
  selectShell: {
    position: 'relative',
  },
  select: {
    width: '100%',
    padding: '10px 36px 10px 16px',
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
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#475569',
    fontSize: '14px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  button: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(148,163,184,0.4)',
    background: 'white',
    color: '#475569',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonActive: {
    background: '#1d4ed8',
    color: 'white',
    borderColor: '#1d4ed8',
  },
  filterInfo: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  filterBadge: {
    fontSize: '12px',
    padding: '4px 10px',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: '6px',
    fontWeight: 500,
  },
  quickStats: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'space-around',
    padding: '16px 0',
    borderTop: '1px solid rgba(148,163,184,0.2)',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1d4ed8',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: 500,
  },
};

export default AnalyticsControls;