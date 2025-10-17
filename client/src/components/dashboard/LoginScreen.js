import React from 'react';

const LoginScreen = ({ userId, setUserId, onLogin, loading, error }) => {
  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>👋 Welcome back</h1>
        <p style={styles.subtitle}>Enter your User ID to access your saved applications.</p>
        
        <div style={styles.form}>
          <label style={styles.label}>User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && onLogin()}
            placeholder="Enter your User ID"
            style={styles.input}
          />
          
          {error && <div style={styles.error}>{error}</div>}
          
          <button 
            onClick={onLogin}
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Connecting...' : 'Access Dashboard'}
          </button>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have a User ID? Contact the administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  box: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '32px',
    marginBottom: '8px',
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px',
  },
  input: {
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    padding: '8px',
    background: '#fee2e2',
    borderRadius: '6px',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#9ca3af',
  },
};

export default LoginScreen;