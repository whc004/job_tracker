import React, { useState, useEffect, useCallback } from 'react';
import Analytics from './Analytics';

const API_URL = 'https://jobtracker-production-2ed3.up.railway.app/api';

const isCollectionJob = (job) => {
  if (!job) return false;
  if (job.isCollection || job.collection || job.isCollected) return true;
  const priority = (job.priority || '').toLowerCase();
  return priority === 'high' || priority === 'dream job' || priority === 'collection' || priority === 'favorite';
};

const parseSkills = (technicalDetails) => {
  if (!technicalDetails) return [];

  const rawTokens = Array.isArray(technicalDetails)
    ? technicalDetails
    : technicalDetails.split(/[,;\n]+/);

  return rawTokens
    .map(token => token
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    )
    .filter(token => token && token.length < 40 && !/\d{6,}/.test(token))
    .map(token => token.replace(/\b([a-z])/gi, (match) => match.toUpperCase()));
};

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
  const [collectionFilter, setCollectionFilter] = useState('all');

  // Auto "No Response" settings
  const [noResponseDays, setNoResponseDays] = useState(21);
  const [showSettings, setShowSettings] = useState(false);

  // Save noResponseDays to localStorage when changed
  useEffect(() => {
    localStorage.setItem('noResponseDays', noResponseDays.toString());
  }, [noResponseDays]);

  // Auto-update jobs to "No Response" if past threshold
  const autoUpdateNoResponse = async (jobsList, id, daysThreshold) => {
    const now = new Date();
    const updatedJobs = [];

    for (const job of jobsList) {
      if (job.status === 'Applied') {
        const appliedDate = new Date(job.dateApplied);
        const daysSinceApplied = Math.floor((now - appliedDate) / (1000 * 60 * 60 * 24));

        if (daysSinceApplied >= daysThreshold) {
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

  // Fetch all data
  const fetchData = useCallback(async (id) => {
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
        const updatedJobs = await autoUpdateNoResponse(jobsData.data, id, noResponseDays);
        setJobs(updatedJobs);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [noResponseDays]);

  // Login/Authentication
  const performLogin = useCallback(async (rawId) => {
    const trimmedId = (rawId || '').trim();
    if (!trimmedId) {
      setError('Please enter your User ID');
      return;
    }

    setUserId(trimmedId);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/stats`, {
        headers: { 'x-user-id': trimmedId }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          localStorage.setItem('jobTrackerUserId', trimmedId);
          setIsAuthenticated(true);
          await fetchData(trimmedId);
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
  }, [fetchData]);

  const handleLogin = (userIdToUse) => {
    performLogin(userIdToUse || userId);
  };

  // Check localStorage for saved userId and settings
  useEffect(() => {
    const savedUserId = localStorage.getItem('jobTrackerUserId');
    const savedDays = localStorage.getItem('noResponseDays');

    if (savedUserId && !isAuthenticated) {
      setUserId(savedUserId);
      performLogin(savedUserId);
    }

    if (savedDays) {
      const parsed = parseInt(savedDays, 10);
      setNoResponseDays(Number.isNaN(parsed) ? 21 : parsed);
    }
  }, [performLogin, isAuthenticated]);

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
        const result = await response.json();
        await fetchData(userId);
        if (result?.data) {
          setSelectedJob(result.data);
        } else {
          setSelectedJob(prev => (prev && prev._id === jobId ? { ...prev, status: newStatus } : prev));
        }
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

  const handleSaveJobDetails = async (jobId, updates, onSuccess) => {
    try {
      const response = await fetch(`${API_URL}/applications/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const result = await response.json();
        await fetchData(userId);
        if (result?.data) {
          setSelectedJob(result.data);
        } else {
          setSelectedJob(prev => (prev && prev._id === jobId ? { ...prev, ...updates } : prev));
        }
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error updating job:', err);
    }
  };

  const searchLower = searchTerm.toLowerCase();

  // Enhanced filter - search company, position, location, AND keywords
  const filteredJobs = jobs
    .filter(job => {
      const matchesStatus = filterStatus === 'All' || job.status === filterStatus;
      const matchesSearch =
        job.company.toLowerCase().includes(searchLower) ||
        job.position.toLowerCase().includes(searchLower) ||
        (job.location && job.location.toLowerCase().includes(searchLower)) ||
        (job.technicalDetails && job.technicalDetails.some(tech =>
          tech.toLowerCase().includes(searchLower)
        ));

      const matchesCollection =
        collectionFilter === 'all' ||
        (collectionFilter === 'favorites' && isCollectionJob(job)) ||
        (collectionFilter === 'nonFavorites' && !isCollectionJob(job));

      return matchesStatus && matchesSearch && matchesCollection;
    })
    .sort((a, b) => {
      if (collectionFilter !== 'nonFavorites') {
        const aFav = isCollectionJob(a) ? 1 : 0;
        const bFav = isCollectionJob(b) ? 1 : 0;
        if (aFav !== bFav) {
          return bFav - aFav;
        }
      }

      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'dateApplied' || sortBy === 'createdAt') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal === bVal) return 0;

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>👋 Welcome back</h1>
          <p style={styles.loginSubtitle}>Enter your User ID to access your saved applications.</p>
          
          <div style={styles.loginForm}>
            <label style={styles.label}>User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your User ID"
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
        <div style={styles.headerSurface}>
          <div style={styles.headerContent}>
            <div style={styles.branding}>
              <div style={styles.logoBadge}>
                <span role="img" aria-label="Analytics" style={styles.logoIcon}>📊</span>
              </div>
              <div>
                <h1 style={styles.headerTitle}>Job Application Tracker</h1>
                <p style={styles.headerSubtitle}>Monitor every stage of your job search with clarity.</p>
              </div>
            </div>

            <div style={styles.headerActions}>
              <button
                onClick={() => setShowSettings(true)}
                style={styles.settingsBtn}
                title="Open settings"
              >
                ⚙️ Settings
              </button>
              <span style={styles.userBadge}>Signed in as <strong>{userId}</strong></span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
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

            <div style={styles.headerMeta}>
              <span style={styles.headerHint}>
                {stats ? `${stats.total} applications tracked so far` : 'Stay organised and keep your pipeline moving'}
              </span>
            </div>
          </div>
        </div>

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
              <div style={styles.collectionToggles}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={collectionFilter === 'favorites'}
                    onChange={() =>
                      setCollectionFilter(collectionFilter === 'favorites' ? 'all' : 'favorites')
                    }
                    style={styles.checkboxInput}
                  />
                  <span>Only collections</span>
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={collectionFilter === 'nonFavorites'}
                    onChange={() =>
                      setCollectionFilter(collectionFilter === 'nonFavorites' ? 'all' : 'nonFavorites')
                    }
                    style={styles.checkboxInput}
                  />
                  <span>Only non-collection</span>
                </label>
              </div>
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
                    inCollection={isCollectionJob(job)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Analytics
          jobs={jobs}
          stats={stats}
          filteredJobs={filteredJobs}
          activeFilter={filterStatus}
          searchTerm={searchTerm}
        />
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdateStatus={updateJobStatus}
          onDelete={deleteJob}
          onSave={handleSaveJobDetails}
        />
      )}

      {showSettings && (
        <SettingsModal
          noResponseDays={noResponseDays}
          onClose={() => setShowSettings(false)}
          onChangeDays={(value) => {
            const parsed = parseInt(value, 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
              setNoResponseDays(Math.min(parsed, 365));
            }
          }}
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
const JobCard = ({ job, onClick, onToggleStar, inCollection }) => {
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
  const displaySkills = parseSkills(job.technicalDetails);

  return (
    <div style={styles.jobCard} onClick={onClick}>
      <div style={styles.jobCardHeader}>
        <h3 style={styles.jobTitle}>{job.position}</h3>
        <div style={styles.cardActions}>
          {inCollection && <span style={styles.collectionBadge}>📁 Collection</span>}
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

const SettingsModal = ({ noResponseDays, onClose, onChangeDays }) => {
  const [value, setValue] = useState(noResponseDays);

  useEffect(() => {
    setValue(noResponseDays);
  }, [noResponseDays]);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>⚙️ Settings</h3>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <p style={styles.settingHint}>
            Automatically move jobs without responses to <strong>No Response</strong> after the selected number of days.
          </p>
          <div style={styles.settingRow}>
            <label style={styles.settingLabel}>Auto "No Response" after</label>
            <div style={styles.settingControl}>
              <input
                type="number"
                min="1"
                max="365"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => onChangeDays(value)}
                style={styles.settingInput}
              />
              <span style={styles.settingUnit}>days</span>
            </div>
          </div>
          <div style={styles.settingActions}>
            <button
              onClick={() => {
                setValue(21);
                onChangeDays(21);
              }}
              style={styles.resetButton}
            >
              Reset to 21 days
            </button>
            <button
              onClick={() => {
                onChangeDays(value);
                onClose();
              }}
              style={styles.updateButton}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const JobDetailModal = ({ job, onClose, onUpdateStatus, onDelete, onSave }) => {
  const buildFormState = (currentJob) => ({
    position: currentJob.position || '',
    company: currentJob.company || '',
    location: currentJob.location || '',
    salary: currentJob.salary || '',
    jobType: currentJob.jobType || '',
    experienceLevel: currentJob.experienceLevel || '',
    workArrangement: currentJob.workArrangement || '',
    dateApplied: currentJob.dateApplied ? new Date(currentJob.dateApplied).toISOString().slice(0, 10) : '',
    priority: currentJob.priority || 'Medium',
    status: currentJob.status || 'Applied',
    jobUrl: currentJob.jobUrl || '',
    notes: currentJob.notes || '',
    technicalDetails: Array.isArray(currentJob.technicalDetails)
      ? currentJob.technicalDetails.join(', ')
      : (currentJob.technicalDetails || '')
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState(buildFormState(job));

  useEffect(() => {
    setFormState(buildFormState(job));
    setIsEditing(false);
  }, [job]);

  const displaySkills = parseSkills(job.technicalDetails);

  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const payload = {
      position: formState.position.trim(),
      company: formState.company.trim(),
      location: formState.location.trim(),
      salary: formState.salary.trim(),
      jobType: formState.jobType.trim(),
      experienceLevel: formState.experienceLevel.trim(),
      workArrangement: formState.workArrangement.trim(),
      priority: formState.priority,
      status: formState.status,
      jobUrl: formState.jobUrl.trim(),
      notes: formState.notes,
      technicalDetails: formState.technicalDetails
        ? formState.technicalDetails.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean)
        : [],
    };

    if (formState.dateApplied) {
      payload.dateApplied = new Date(formState.dateApplied).toISOString();
    }

    onSave(job._id, payload, () => setIsEditing(false));
  };

  const resetForm = () => {
    setFormState(buildFormState(job));
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{job.position}</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.modalBody}>
          {!isEditing ? (
            <>
              <div style={styles.detailGrid}>
                <div style={styles.detailColumn}>
                  <div style={styles.detailRow}><strong>Company:</strong> {job.company}</div>
                  <div style={styles.detailRow}><strong>Location:</strong> {job.location || 'Not specified'}</div>
                  {job.salary && job.salary !== 'Not specified' && (
                    <div style={styles.detailRow}><strong>Salary:</strong> {job.salary}</div>
                  )}
                  <div style={styles.detailRow}><strong>Date Applied:</strong> {job.dateApplied ? new Date(job.dateApplied).toLocaleDateString() : 'Not tracked'}</div>
                </div>
                <div style={styles.detailColumn}>
                  <div style={styles.detailRow}><strong>Job Type:</strong> {job.jobType || 'Not specified'}</div>
                  <div style={styles.detailRow}><strong>Experience:</strong> {job.experienceLevel || 'Not specified'}</div>
                  <div style={styles.detailRow}><strong>Work Mode:</strong> {job.workArrangement || 'Not specified'}</div>
                  <div style={styles.detailRow}><strong>Priority:</strong> {job.priority || 'Medium'}</div>
                </div>
              </div>

              {displaySkills.length > 0 && (
                <div style={styles.detailRow}>
                  <strong>Skills:</strong>
                  <div style={styles.tags}>
                    {displaySkills.map((tech, idx) => (
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
                <label style={styles.label}>Quick Status Update:</label>
                <div style={styles.inlineStatus}>
                  <select
                    value={job.status}
                    onChange={(e) => onUpdateStatus(job._id, e.target.value)}
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
                    onClick={() => setIsEditing(true)}
                    style={styles.editButton}
                  >
                    ✏️ Edit Details
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={styles.editGrid}>
                <label style={styles.editField}>
                  <span>Position</span>
                  <input
                    type="text"
                    value={formState.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Company</span>
                  <input
                    type="text"
                    value={formState.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Location</span>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Salary</span>
                  <input
                    type="text"
                    value={formState.salary}
                    onChange={(e) => handleChange('salary', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Job Type</span>
                  <input
                    type="text"
                    value={formState.jobType}
                    onChange={(e) => handleChange('jobType', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Experience Level</span>
                  <input
                    type="text"
                    value={formState.experienceLevel}
                    onChange={(e) => handleChange('experienceLevel', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Work Arrangement</span>
                  <input
                    type="text"
                    value={formState.workArrangement}
                    onChange={(e) => handleChange('workArrangement', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={styles.editField}>
                  <span>Priority</span>
                  <select
                    value={formState.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    style={styles.select}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Dream Job">Dream Job</option>
                  </select>
                </label>
                <label style={styles.editField}>
                  <span>Status</span>
                  <select
                    value={formState.status}
                    onChange={(e) => handleChange('status', e.target.value)}
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
                </label>
                <label style={styles.editField}>
                  <span>Date Applied</span>
                  <input
                    type="date"
                    value={formState.dateApplied}
                    onChange={(e) => handleChange('dateApplied', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={{ ...styles.editField, gridColumn: '1 / -1' }}>
                  <span>Job Link</span>
                  <input
                    type="url"
                    value={formState.jobUrl}
                    onChange={(e) => handleChange('jobUrl', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={{ ...styles.editField, gridColumn: '1 / -1' }}>
                  <span>Skills (comma separated)</span>
                  <input
                    type="text"
                    value={formState.technicalDetails}
                    onChange={(e) => handleChange('technicalDetails', e.target.value)}
                    style={styles.input}
                  />
                </label>
                <label style={{ ...styles.editField, gridColumn: '1 / -1' }}>
                  <span>Notes</span>
                  <textarea
                    value={formState.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    style={styles.textarea}
                    rows={4}
                  />
                </label>
              </div>

              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    resetForm();
                    setIsEditing(false);
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={styles.updateButton}
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
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
    background: 'linear-gradient(180deg, #f4f6fb 0%, #ffffff 30%)',
  },
  header: {
    background: 'linear-gradient(120deg, #312e81 0%, #1d4ed8 50%, #9333ea 100%)',
    padding: '48px 24px 32px',
    color: 'white',
  },
  headerSurface: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
    borderRadius: '24px',
    background: 'rgba(15, 23, 42, 0.35)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 25px 45px rgba(15, 23, 42, 0.35)',
  },
  headerContent: {
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
  headerTitle: {
    fontSize: '34px',
    margin: 0,
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  headerSubtitle: {
    margin: '8px 0 0',
    fontSize: '16px',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    maxWidth: '520px',
  },
  headerActions: {
    display: 'flex',
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
    letterSpacing: '0.01em',
    transition: 'all 0.25s ease',
  },
  tabButtonActive: {
    background: 'white',
    color: '#1d4ed8',
    boxShadow: '0 10px 20px rgba(59,130,246,0.35)',
  },
  navRow: {
    marginTop: '28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerHint: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.75)',
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
    letterSpacing: '0.01em',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userBadge: {
    padding: '10px 18px',
    background: 'rgba(15,23,42,0.45)',
    borderRadius: '14px',
    fontSize: '15px',
    color: 'rgba(255,255,255,0.9)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
    transition: 'transform 0.2s ease',
  },
  settingsPanel: {
    maxWidth: '1200px',
    margin: '20px auto 0',
    padding: '20px 28px',
    background: 'rgba(15,23,42,0.55)',
    borderRadius: '20px',
    backdropFilter: 'blur(22px)',
    boxShadow: '0 18px 35px rgba(15,23,42,0.35)',
    color: 'rgba(255,255,255,0.92)',
  },
  settingsTitle: {
    fontSize: '18px',
    margin: '0 0 16px 0',
    fontWeight: '600',
    letterSpacing: '0.01em',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
  },
  settingLabel: {
    fontSize: '15px',
    fontWeight: '500',
  },
  settingControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  settingInput: {
    width: '90px',
    padding: '8px 12px',
    border: '2px solid rgba(255,255,255,0.35)',
    borderRadius: '10px',
    fontSize: '15px',
    background: 'rgba(255,255,255,0.18)',
    color: 'white',
    outline: 'none',
  },
  settingUnit: {
    fontSize: '15px',
    fontWeight: '600',
  },
  settingHint: {
    fontSize: '13px',
    opacity: 0.85,
    margin: '6px 0 0 0',
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
    fontSize: '15px',
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
    padding: '14px 16px',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  collectionToggles: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    background: '#f3f4f6',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
  checkboxInput: {
    width: '16px',
    height: '16px',
    accentColor: '#2563eb',
  },
  select: {
    padding: '12px 14px',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '15px',
    background: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  sortButton: {
    padding: '12px 16px',
    background: 'white',
    border: '2px solid #d1d5db',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  refreshButton: {
    padding: '12px 22px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 12px 24px rgba(37,99,235,0.25)',
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
  collectionBadge: {
    background: '#fef3c7',
    color: '#b45309',
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '999px',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  detailColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    fontSize: '14px',
    color: '#374151',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  notes: {
    marginTop: '4px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '10px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
  statusUpdate: {
    marginTop: '8px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  inlineStatus: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  editButton: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  editGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  editField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#374151',
    fontWeight: '600',
  },
  textarea: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  updateButton: {
    padding: '12px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  deleteButton: {
    padding: '10px 18px',
    background: '#fee2e2',
    color: '#b91c1c',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  settingsModal: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px 28px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 45px rgba(15,23,42,0.2)',
  },
  settingActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
  },
  resetButton: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
};

export default JobTracker;