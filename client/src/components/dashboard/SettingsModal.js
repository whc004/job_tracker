import React, { useEffect, useState } from 'react';
import { TIMEZONE_OPTIONS } from '../../shared-constants';

const API_BASE_URL = 'https://jobtracker-production-2ed3.up.railway.app/api';

const SettingsModal = ({
  open,
  onClose,
  noResponseDays,
  setNoResponseDays,
  userTimezone,
  setUserTimezone,
}) => {
  const [days, setDays] = useState(noResponseDays ?? 14);
  const [timezone, setTimezone] = useState(
    userTimezone || localStorage.getItem('jt_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Resume management state
  const [resumes, setResumes] = useState([]);
  const [resumeName, setResumeName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'resumes'

  useEffect(() => {
    setDays(noResponseDays ?? 14);
  }, [noResponseDays, open]);

  useEffect(() => {
    setTimezone(userTimezone || localStorage.getItem('jt_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [userTimezone, open]);

  // Fetch resumes when modal opens
  useEffect(() => {
    if (open && activeTab === 'resumes') {
      fetchResumes();
    }
  }, [open, activeTab]);

  if (!open) return null;

  const getUserId = () => localStorage.getItem('jt_userId') || '';

  // Fetch all resumes for the user
  const fetchResumes = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoadingResumes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/resumes`, {
        headers: { 'x-user-id': userId }
      });
      const data = await response.json();
      if (data.success) {
        setResumes(data.data.resumes || []);
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
      alert('Failed to load resumes');
    } finally {
      setLoadingResumes(false);
    }
  };

  // Upload a new resume
  const handleUploadResume = async () => {
    const userId = getUserId();
    if (!userId) {
      alert('Please log in first');
      return;
    }

    if (!resumeName.trim() || !resumeText.trim()) {
      alert('Please provide both resume name and text');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          name: resumeName.trim(),
          text: resumeText.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Resume uploaded successfully!');
        setResumeName('');
        setResumeText('');
        fetchResumes(); // Refresh the list
      } else {
        alert(`Failed to upload resume: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to upload resume:', error);
      alert('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  // Set a resume as active
  const handleSetActive = async (resumeId) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/resumes/${resumeId}/active`, {
        method: 'PUT',
        headers: { 'x-user-id': userId }
      });

      const data = await response.json();
      if (data.success) {
        fetchResumes(); // Refresh the list
      } else {
        alert(`Failed to set active resume: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to set active resume:', error);
      alert('Failed to set active resume');
    }
  };

  // Delete a resume
  const handleDeleteResume = async (resumeId, resumeName) => {
    if (!window.confirm(`Are you sure you want to delete "${resumeName}"?`)) {
      return;
    }

    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });

      const data = await response.json();
      if (data.success) {
        fetchResumes(); // Refresh the list
      } else {
        alert(`Failed to delete resume: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to delete resume:', error);
      alert('Failed to delete resume');
    }
  };

  const handleSave = () => {
    // persist “No Response after N days”
    setNoResponseDays(days);
    localStorage.setItem('jt_noResponseDays', String(days));

    // persist timezone
    setUserTimezone(timezone);
    localStorage.setItem('jt_timezone', timezone);

    onClose();
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Settings</h3>
          <button onClick={onClose} style={styles.iconBtn}>✖</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={activeTab === 'general' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('general')}
          >
            ⚙️ General
          </button>
          <button
            style={activeTab === 'resumes' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('resumes')}
          >
            📄 Resumes
          </button>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            {/* Auto-mark No Response */}
            <div>
              <label style={styles.label}>Auto-mark "No Response" after N days (on load)</label>
              <input
                type="number"
                min={1}
                style={styles.input}
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 1)}
              />
              <p style={styles.hint}>
                When you open the dashboard, any "Applied" older than N days becomes "No Response".
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label style={styles.label}>Your Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ ...styles.input, width: '100%' }}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
              <p style={styles.hint}>
                Dates are stored in UTC on the server and shown here in your timezone.
              </p>
            </div>

            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button style={styles.primaryBtn} onClick={handleSave}>💾 Save</button>
            </div>
          </div>
        )}

        {/* Resumes Tab */}
        {activeTab === 'resumes' && (
          <div style={{ marginTop: 16 }}>
            {/* Upload New Resume */}
            <div style={{ marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Upload New Resume</h4>
              <div style={{ display: 'grid', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Resume name (e.g., Software Engineer Resume)"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  style={styles.input}
                />
                <textarea
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  style={{ ...styles.input, minHeight: 200, fontFamily: 'monospace', fontSize: 13 }}
                />
                <button
                  onClick={handleUploadResume}
                  disabled={uploading}
                  style={{ ...styles.primaryBtn, width: '100%' }}
                >
                  {uploading ? '⏳ Uploading...' : '📤 Upload Resume'}
                </button>
              </div>
            </div>

            {/* Resume List */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Your Resumes</h4>
              {loadingResumes ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading...</div>
              ) : resumes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                  No resumes uploaded yet. Upload one above!
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      style={{
                        padding: 16,
                        border: resume.isActive ? '2px solid #2563eb' : '2px solid #e5e7eb',
                        borderRadius: 12,
                        background: resume.isActive ? '#eff6ff' : '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {resume.name}
                          {resume.isActive && <span style={{ marginLeft: 8, color: '#2563eb', fontSize: 12 }}>✓ Active</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {!resume.isActive && (
                            <button
                              onClick={() => handleSetActive(resume.id)}
                              style={{ ...styles.secondaryBtn, fontSize: 12, padding: '6px 12px' }}
                            >
                              Set Active
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteResume(resume.id, resume.name)}
                            style={{ ...styles.deleteBtn, fontSize: 12, padding: '6px 12px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 },
  modal: { width: 'min(560px, 96vw)', background: '#fff', borderRadius: 16, padding: 24 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconBtn: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' },
  label: { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 },
  input: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none' },
  hint: { color: '#6b7280', margin: '6px 0 0', fontSize: 12, lineHeight: 1.5 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { padding: '10px 18px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  primaryBtn: { padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
  tabs: { display: 'flex', gap: 8, borderBottom: '2px solid #e5e7eb', marginBottom: 16 },
  tab: { padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontWeight: 500, color: '#6b7280' },
  tabActive: { padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '2px solid #2563eb', cursor: 'pointer', fontWeight: 600, color: '#2563eb' },
  secondaryBtn: { padding: '10px 18px', background: '#e0e7ff', color: '#2563eb', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  deleteBtn: { padding: '10px 18px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }
};

export default SettingsModal;
