import React from 'react';

const Header = ({ userId, onLogout, activeTab, setActiveTab, onOpenSettings }) => {
  return (
    <header style={styles.header}>
      <div style={styles.surface}>
        <div style={styles.content}>
          <div style={styles.branding}>
            <div style={styles.logoBadge}>
              <span role="img" aria-label="Analytics" style={styles.logoIcon}>📊</span>
            </div>
            <div>
              <h1 style={styles.title}>Application Tracker</h1>
              <p style={styles.subtitle}>Monitor every stage of your job search with clarity.</p>
            </div>
          </div>

          <div style={styles.actions}>
            <button onClick={onOpenSettings} style={styles.settingsBtn} title="Open settings">
              ⚙️ Settings
            </button>
            <span style={styles.userBadge}>
              Signed in as <strong>{userId}</strong>
            </span>
            <button onClick={onLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>

        <div style={styles.navRow}>
          <div style={styles.tabToggle}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                ...styles.tabButton,
                ...(activeTab === 'dashboard' ? styles.tabButtonActive : {})
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                ...styles.tabButton,
                ...(activeTab === 'analytics' ? styles.tabButtonActive : {})
              }}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    background: 'linear-gradient(120deg, #312e81 0%, #1d4ed8 50%, #9333ea 100%)',
    padding: '48px 24px 32px',
    color: 'white',
  },
  surface: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
    borderRadius: '24px',
    background: 'rgba(15, 23, 42, 0.35)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 25px 45px rgba(15, 23, 42, 0.35)',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '32px',
    flexWrap: 'wrap',
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logoBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
  },
  logoIcon: {
    fontSize: '32px',
  },
  title: {
    fontSize: '34px',
    margin: 0,
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '16px',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    maxWidth: '520px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  settingsBtn: {
    padding: '10px 18px',
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.35)',
    color: 'white',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
  },
  userBadge: {
    padding: '10px 18px',
    background: 'rgba(15,23,42,0.45)',
    borderRadius: '14px',
    fontSize: '15px',
    color: 'rgba(255,255,255,0.9)',
  },
  logoutBtn: {
    padding: '10px 20px',
    background: 'white',
    border: 'none',
    color: '#1d4ed8',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    boxShadow: '0 15px 30px rgba(255,255,255,0.25)',
  },
  navRow: {
    marginTop: '28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  tabToggle: {
    display: 'flex',
    gap: '12px',
    background: 'rgba(255,255,255,0.16)',
    padding: '6px',
    borderRadius: '999px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  tabButton: {
    padding: '10px 22px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.75)',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
  },
  tabButtonActive: {
    background: 'white',
    color: '#1d4ed8',
    boxShadow: '0 10px 20px rgba(59,130,246,0.35)',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  hint: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.75)',
  },
};

export default Header;