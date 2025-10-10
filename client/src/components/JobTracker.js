import React, { useState, useEffect } from 'react';
import Analytics from './Analytics';

const API_URL = 'https://jobtracker-production-2ed3.up.railway.app/api';

const JobTracker = () => {
  // State management
  const [userId, setUserId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateApplied');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auto "No Response" settings
  const [noResponseDays, setNoResponseDays] = useState(30);
  const [showSettings, setShowSettings] = useState(false);

  // Check localStorage for saved userId and settings
  useEffect(() => {
    const savedUserId = localStorage.getItem('jobTrackerUserId');
    const savedDays = localStorage.getItem('noResponseDays');
    
    if (savedUserId) {
      setUserId(savedUserId);
      handleLogin(savedUserId);
    }
    
    if (savedDays) {
      setNoResponseDays(parseInt(savedDays));
    }
  }, []);

  // Save noResponseDays to localStorage when changed
  useEffect(() => {
    localStorage.setItem('noResponseDays', noResponseDays.toString());
  }, [noResponseDays]);

  // Login/Authentication
  const handleLogin = async (userIdToUse) => {
    const id = userIdToUse || userId;
    if (!id.trim()) {
      setError('Please enter your User ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/stats`, {
        headers: { 'x-user-id': id }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          localStorage.setItem('jobTrackerUserId', id);
          setIsAuthenticated(true);
          await fetchData(id);
        } else {
          setError('Invalid User ID');
        }
      } else {
        setError('Invalid User ID or connection error');
      }
    } catch (err) {
      setError('Could not connect to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data
  const fetchData = async (id) => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/stats`, {
        headers: { 'x-user-id': id }
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch jobs
      const jobsRes = await fetch(`${API_URL}/applications`, {
        headers: { 'x-user-id': id }
      });
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        const updatedJobs = await autoUpdateNoResponse(jobsData.data, id);
        setJobs(updatedJobs);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-update jobs to "No Response" if past threshold
  const autoUpdateNoResponse = async (jobsList, id) => {
    const now = new Date();
    const updatedJobs = [];
    
    for (const job of jobsList) {
      if (job.status === 'Applied') {
        const appliedDate = new Date(job.dateApplied);
        const daysSinceApplied = Math.floor((now - appliedDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceApplied >= noResponseDays) {
          try {
            await fetch(`${API_URL}/applications/${job._id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': id
              },
              body: JSON.stringify({ status: 'No Response' })
            });
            updatedJobs.push({ ...job, status: 'No Response' });
          } catch (err) {
            console.error('Error auto-updating job:', err);
            updatedJobs.push(job);
          }
        } else {
          updatedJobs.push(job);
        }
      } else {
        updatedJobs.push(job);
      }
    }
    
    return updatedJobs;
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('jobTrackerUserId');
    setIsAuthenticated(false);
    setUserId('');
    setJobs([]);
    setStats(null);
  };

  // Update job status
  const updateJobStatus = async (jobId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/applications/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchData(userId);
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error updating job:', err);
    }
  };

  // NEW: Toggle star/priority
  const toggleStar = async (job, e) => {
    e.stopPropagation(); // Prevent opening modal
    
    // Toggle between High and Medium priority
    const newPriority = job.priority === 'High' ? 'Medium' : 'High';
    
    try {
      const response = await fetch(`${API_URL}/applications/${job._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ priority: newPriority })
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setJobs(jobs.map(j => 
          j._id === job._id ? { ...j, priority: newPriority } : j
        ));
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  // Delete job
  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`${API_URL}/applications/${jobId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });

      if (response.ok) {
        await fetchData(userId);
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  // Enhanced filter - search company, position, location, AND keywords
  const filteredJobs = jobs
    .filter(job => {
      const matchesStatus = filterStatus === 'All' || job.status === filterStatus;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        job.company.toLowerCase().includes(searchLower) ||
        job.position.toLowerCase().includes(searchLower) ||
        (job.location && job.location.toLowerCase().includes(searchLower)) ||
        (job.technicalDetails && job.technicalDetails.some(tech => 
          tech.toLowerCase().includes(searchLower)
        ));
      
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'dateApplied' || sortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>🎯 Job Tracker</h1>
          <p style={styles.loginSubtitle}>Track your job applications with ease</p>
          
          <div style={styles.loginForm}>
            <label style={styles.label}>User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="job-tracker_yourname"
              style={styles.input}
            />
            
            {error && <div style={styles.error}>{error}</div>}
            
            <button 
              onClick={() => handleLogin()}
              disabled={loading}
              style={styles.loginButton}
            >
              {loading ? 'Connecting...' : 'Access Dashboard'}
            </button>
          </div>

          <div style={styles.loginFooter}>
            <p style={styles.footerText}>
              Don't have a User ID? Contact the administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div style={styles.container}>
      {/* Enhanced Header with Integrated Navigation */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.logoArea}>
              <span style={styles.logo}>📊</span>
              <div style={styles.titleArea}>
                <h1 style={styles.headerTitle}>Job Application Tracker</h1>
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
          </div>
          
          <div style={styles.headerRight}>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              style={styles.settingsBtn}
              title="Settings"
            >
              ⚙️
            </button>
            <span style={styles.userBadge}>👤 {userId}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div style={styles.settingsPanel}>
            <h3 style={styles.settingsTitle}>⚙️ Settings</h3>
            <div style={styles.settingRow}>
              <label style={styles.settingLabel}>
                Auto "No Response" after:
              </label>
              <div style={styles.settingControl}>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={noResponseDays}
                  onChange={(e) => setNoResponseDays(parseInt(e.target.value))}
                  style={styles.settingInput}
                />
                <span style={styles.settingUnit}>days</span>
              </div>
            </div>
            <p style={styles.settingHint}>
              Jobs with "Applied" status will automatically change to "No Response" after {noResponseDays} days
            </p>
          </div>
        )}
      </header>

      {/* Conditional Rendering Based on Active Tab */}
      {activeTab === 'dashboard' ? (
        <>
          {/* Stats Cards */}
          {stats && (
            <div style={styles.statsGrid}>
              <StatCard 
                title="Total Applications" 
                value={stats.total} 
                color="#3b82f6"
                icon="📝"
              />
              <StatCard 
                title="Active Opportunities" 
                value={stats.activeOpportunities} 
                color="#8b5cf6"
                icon="🎯"
              />
              <StatCard 
                title="Interviews" 
                value={stats.interviewProgress} 
                color="#f59e0b"
                icon="💼"
              />
              <StatCard 
                title="Offers" 
                value={stats.offers} 
                color="#10b981"
                icon="🎉"
              />
            </div>
          )}

          {/* Enhanced Filters and Search */}
          <div style={styles.controls}>
            <div style={styles.searchBox}>
              <input
                type="text"
                placeholder="🔍 Search by company, position, location, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.filters}>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.select}
              >
                <option value="All">All Status</option>
                <option value="Applied">Applied</option>
                <option value="OA">OA</option>
                <option value="Behavioral Interview">Behavioral</option>
                <option value="Technical Interview">Technical</option>
                <option value="Final Interview">Final</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="No Response">No Response</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.select}
              >
                <option value="dateApplied">Date Applied</option>
                <option value="createdAt">Date Saved</option>
                <option value="company">Company</option>
                <option value="position">Position</option>
              </select>

              <button 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={styles.sortButton}
              >
                {sortOrder === 'asc' ? '⬆️' : '⬇️'}
              </button>

              <button 
                onClick={() => fetchData(userId)}
                style={styles.refreshButton}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div style={styles.jobsContainer}>
            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : filteredJobs.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🔭</div>
                <h3>No applications found</h3>
                <p>
                  {searchTerm 
                    ? `No results for "${searchTerm}". Try a different search term.`
                    : 'Start tracking your job applications using the Chrome extension!'
                  }
                </p>
              </div>
            ) : (
              <div style={styles.jobsGrid}>
                {filteredJobs.map(job => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    onClick={() => setSelectedJob(job)}
                    onToggleStar={(e) => toggleStar(job, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Analytics jobs={jobs} stats={stats} />
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdateStatus={updateJobStatus}
          onDelete={deleteJob}
        />
      )}
    </div>
  );
};

// Components
const StatCard = ({ title, value, color, icon }) => (
  <div style={{...styles.statCard, borderLeftColor: color}}>
    <div style={styles.statIcon}>{icon}</div>
    <div>
      <div style={styles.statTitle}>{title}</div>
      <div style={{...styles.statValue, color}}>{value}</div>
    </div>
  </div>
);

// NEW: JobCard with Star Button
const JobCard = ({ job, onClick, onToggleStar }) => {
  const statusColors = {
    'Applied': '#3b82f6',
    'OA': '#f59e0b',
    'Behavioral Interview': '#8b5cf6',
    'Technical Interview': '#f97316',
    'Final Interview': '#6366f1',
    'Offer': '#10b981',
    'Rejected': '#ef4444',
    'No Response': '#6b7280'
  };

  const isStarred = job.priority === 'High' || job.priority === 'Dream Job';

  return (
    <div style={styles.jobCard} onClick={onClick}>
      <div style={styles.jobCardHeader}>
        <h3 style={styles.jobTitle}>{job.position}</h3>
        <div style={styles.cardActions}>
          <button
            onClick={onToggleStar}
            style={{
              ...styles.starButton,
              color: isStarred ? '#f59e0b' : '#d1d5db'
            }}
            title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isStarred ? '⭐' : '☆'}
          </button>
          <span 
            style={{
              ...styles.statusBadge, 
              backgroundColor: statusColors[job.status] + '20',
              color: statusColors[job.status]
            }}
          >
            {job.status}
          </span>
        </div>
      </div>

      <div style={styles.jobCompany}>🏢 {job.company}</div>
      <div style={styles.jobLocation}>📍 {job.location}</div>
      
      {job.salary && job.salary !== 'Not specified' && (
        <div style={styles.jobSalary}>💰 {job.salary}</div>
      )}

      <div style={styles.jobMeta}>
        <span style={styles.jobDate}>
          📅 Applied: {new Date(job.dateApplied).toLocaleDateString()}
        </span>
      </div>

      {job.technicalDetails && job.technicalDetails.length > 0 && (
        <div style={styles.tags}>
          {job.technicalDetails.slice(0, 3).map((tech, idx) => (
            <span key={idx} style={styles.tag}>{tech}</span>
          ))}
          {job.technicalDetails.length > 3 && (
            <span style={styles.tag}>+{job.technicalDetails.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

const JobDetailModal = ({ job, onClose, onUpdateStatus, onDelete }) => {
  const [newStatus, setNewStatus] = useState(job.status);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{job.position}</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.detailRow}>
            <strong>Company:</strong> {job.company}
          </div>
          <div style={styles.detailRow}>
            <strong>Location:</strong> {job.location}
          </div>
          {job.salary && job.salary !== 'Not specified' && (
            <div style={styles.detailRow}>
              <strong>Salary:</strong> {job.salary}
            </div>
          )}
          <div style={styles.detailRow}>
            <strong>Job Type:</strong> {job.jobType || 'Not specified'}
          </div>
          <div style={styles.detailRow}>
            <strong>Experience Level:</strong> {job.experienceLevel || 'Not specified'}
          </div>
          <div style={styles.detailRow}>
            <strong>Work Arrangement:</strong> {job.workArrangement || 'Not specified'}
          </div>
          <div style={styles.detailRow}>
            <strong>Date Applied:</strong> {new Date(job.dateApplied).toLocaleDateString()}
          </div>
          <div style={styles.detailRow}>
            <strong>Priority:</strong> {job.priority}
          </div>

          {job.technicalDetails && job.technicalDetails.length > 0 && (
            <div style={styles.detailRow}>
              <strong>Skills:</strong>
              <div style={styles.tags}>
                {job.technicalDetails.map((tech, idx) => (
                  <span key={idx} style={styles.tag}>{tech}</span>
                ))}
              </div>
            </div>
          )}

          {job.notes && (
            <div style={styles.detailRow}>
              <strong>Notes:</strong>
              <p style={styles.notes}>{job.notes}</p>
            </div>
          )}

          {job.jobUrl && (
            <div style={styles.detailRow}>
              <a 
                href={job.jobUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.link}
              >
                🔗 View Job Posting
              </a>
            </div>
          )}

          <div style={styles.statusUpdate}>
            <label style={styles.label}>Update Status:</label>
            <select 
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={styles.select}
            >
              <option value="Applied">Applied</option>
              <option value="OA">OA</option>
              <option value="Behavioral Interview">Behavioral Interview</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="Final Interview">Final Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="No Response">No Response</option>
            </select>
            <button 
              onClick={() => onUpdateStatus(job._id, newStatus)}
              style={styles.updateButton}
            >
              Update Status
            </button>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button 
            onClick={() => onDelete(job._id)}
            style={styles.deleteButton}
          >
            🗑️ Delete Application
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  loginBox: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  loginTitle: {
    fontSize: '32px',
    marginBottom: '8px',
    color: '#1f2937',
    textAlign: 'center',
  },
  loginSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '32px',
  },
  loginForm: {
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
  loginButton: {
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
  loginFooter: {
    marginTop: '24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  container: {
    minHeight: '100vh',
    background: '#f9fafb',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    fontSize: '40px',
  },
  titleArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  headerTitle: {
    fontSize: '24px',
    margin: 0,
    fontWeight: '600',
  },
  tabToggle: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(255,255,255,0.1)',
    padding: '4px',
    borderRadius: '8px',
  },
  tabButton: {
    padding: '6px 14px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    background: 'white',
    color: '#667eea',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  settingsBtn: {
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
  },
  userBadge: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '20px',
    fontSize: '14px',
  },
  logoutBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  settingsPanel: {
    maxWidth: '1400px',
    margin: '16px auto 0',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
  },
  settingsTitle: {
    fontSize: '16px',
    margin: '0 0 12px 0',
    fontWeight: '600',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  settingLabel: {
    fontSize: '14px',
    fontWeight: '500',
  },
  settingControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  settingInput: {
    width: '80px',
    padding: '6px 10px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    outline: 'none',
  },
  settingUnit: {
    fontSize: '14px',
    fontWeight: '500',
  },
  settingHint: {
    fontSize: '12px',
    opacity: 0.8,
    margin: '4px 0 0 0',
  },
  statsGrid: {
    maxWidth: '1400px',
    margin: '32px auto',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  statCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderLeft: '4px solid',
  },
  statIcon: {
    fontSize: '32px',
  },
  statTitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
  },
  controls: {
    maxWidth: '1400px',
    margin: '24px auto',
    padding: '0 24px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: '1',
    minWidth: '300px',
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
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
  sortButton: {
    padding: '12px 16px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  refreshButton: {
    padding: '12px 20px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  jobsContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px 40px',
  },
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  jobCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  jobCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
  },
  jobTitle: {
    fontSize: '18px',
    color: '#1f2937',
    margin: 0,
    lineHeight: '1.3',
    flex: 1,
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  starButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    transition: 'transform 0.2s',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  jobCompany: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '6px',
  },
  jobLocation: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '6px',
  },
  jobSalary: {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '600',
    marginBottom: '8px',
  },
  jobMeta: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  },
  jobDate: {
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
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#6b7280',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '24px',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
  },
  modalBody: {
    padding: '24px',
  },
  detailRow: {
    marginBottom: '16px',
    fontSize: '14px',
    color: '#374151',
  },
  notes: {
    marginTop: '8px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '6px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '600',
  },
  statusUpdate: {
    marginTop: '24px',
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  updateButton: {
    padding: '12px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  deleteButton: {
    padding: '10px 16px',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default JobTracker;