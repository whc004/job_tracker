// client/src/components/JobTracker.js
import React, { useEffect, useMemo, useState } from 'react';
import LoginScreen from './dashboard/LoginScreen';
import Header from './dashboard/Header';
import StatCard from './dashboard/StatCard';
import JobCard from './dashboard/JobCard';
import JobDetailModal from './dashboard/JobDetailModal';
import SettingsModal from './dashboard/SettingsModal';
import CSVUploadModal from './dashboard/CSVUploadModal';
import Analytics from './Analytics/Analytics';
import FilterControls from './dashboard/FilterControls';
import { isCollectionJob } from './helpers/default';
import { useJobData } from './hooks/JobData';
import { API_URL } from './helpers/default';
import { exportToCSV } from './helpers/csvExport';

const JobTracker = () => {
  const [userId, setUserId] = useState(localStorage.getItem('jt_userId') || '');
  const [loggedIn, setLoggedIn] = useState(Boolean(userId));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [noResponseDays, setNoResponseDays] = useState(
    Number(localStorage.getItem('jt_noResponseDays')) || 14
  );
  const [detailJob, setDetailJob] = useState(null);

  // filters / sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateApplied');
  const [sortOrder, setSortOrder] = useState('desc');

  // bulk select
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState(new Set());

  const {
    jobs,
    stats,
    fetchData,
    toggleStar,
    deleteJob,
    saveJobDetails,
    bulkDeleteJobs,
    setJobs,
  } = useJobData();

  useEffect(() => {
    if (loggedIn && userId) {
      fetchData(userId, noResponseDays);
    }
  }, [loggedIn, userId, noResponseDays, fetchData]);

  const onLogin = () => {
    if (!userId.trim()) return;
    localStorage.setItem('jt_userId', userId.trim());
    setLoggedIn(true);
  };
  
  const onLogout = () => {
    setLoggedIn(false);
    setUserId('');
    localStorage.removeItem('jt_userId');
  };

  // Data normalization
  const safeJobs = useMemo(() => {
    const todayIso = new Date(Date.now()).toISOString();
    return jobs.map((j) => ({
      ...j,
      status: j.status || 'Applied',
      priority: j.priority || 'Medium',
      dateApplied: j.dateApplied || todayIso,
      technicalDetails: Array.isArray(j.technicalDetails)
        ? j.technicalDetails
        : j.technicalDetails
        ? String(j.technicalDetails)
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    }));
  }, [jobs]);

  // FIXED: Restored original starred-at-top sorting
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = safeJobs.slice();

    // Apply status filter
    if (filterStatus !== 'All') {
      if (filterStatus === 'Interview') {
        list = list.filter((j) =>
          ['OA', 'Behavioral Interview', 'Technical Interview', 'Final Interview'].includes(
            j.status
          )
        );
      } else {
        list = list.filter((j) => j.status === filterStatus);
      }
    }

    // Apply collection filter
    if (collectionFilter === 'favorites') list = list.filter(isCollectionJob);
    if (collectionFilter === 'nonFavorites') list = list.filter((j) => !isCollectionJob(j));

    // Apply search filter
    if (term) {
      list = list.filter((j) => {
        const skills = Array.isArray(j.technicalDetails)
          ? j.technicalDetails.join(' ')
          : j.technicalDetails || '';
        return [j.company, j.position, j.location, skills].some((v) =>
          (v || '').toLowerCase().includes(term)
        );
      });
    }

    // CRITICAL: Sort with starred jobs at top (unless filtering to non-favorites)
    list.sort((a, b) => {
      // First priority: Starred jobs come first (unless filtering non-favorites)
      if (collectionFilter !== 'nonFavorites') {
        const aFav = isCollectionJob(a) ? 1 : 0;
        const bFav = isCollectionJob(b) ? 1 : 0;
        if (aFav !== bFav) {
          return bFav - aFav; // Starred first
        }
      }

      // Second priority: Sort by selected criteria
      const dir = sortOrder === 'asc' ? 1 : -1;
      const va = a[sortBy] ?? '';
      const vb = b[sortBy] ?? '';
      if (sortBy.includes('date')) return (new Date(va) - new Date(vb)) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    return list;
  }, [safeJobs, searchTerm, filterStatus, collectionFilter, sortBy, sortOrder]);

  // Bulk select helpers
  const toggleSelect = (id) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = (clearOnly = false) => {
    if (clearOnly || selectedJobs.size === filtered.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filtered.map((j) => j._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.size === 0) return;
    if (!window.confirm(`Delete ${selectedJobs.size} selected item(s)?`)) return;
    setJobs((prev) => prev.filter((j) => !selectedJobs.has(j._id)));
    const ok = await bulkDeleteJobs(userId, selectedJobs);
    if (!ok) fetchData(userId, noResponseDays);
    setSelectedJobs(new Set());
    setIsSelectMode(false);
  };

  // CSV upload
  const handleCSVUpload = async (rows) => {
    const todayIso = new Date(Date.now()).toISOString();
    const jobsPayload = rows.map((r) => ({
      company: r.company || '',
      position: r.position || '',
      location: r.location || '',
      status: r.status || 'Applied',
      workArrangement: r.workArrangement || 'Unspecified',
      dateApplied: r.dateApplied ? new Date(r.dateApplied) : todayIso,
      jobUrl: r.jobUrl || '',
      priority: r.priority || 'Medium',
      notes: r.notes || '',
      technicalDetails: r.technicalDetails
        ? String(r.technicalDetails)
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    }));

    try {
      await fetch(`${API_URL}/jobs/bulk-insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ userId, jobs: jobsPayload }),
      });
      fetchData(userId, noResponseDays);
    } catch (e) {
      console.error(e);
      alert('Upload failed. Please try again.');
    }
  };

  if (!loggedIn) {
    return (
      <LoginScreen userId={userId} setUserId={setUserId} onLogin={onLogin} loading={false} />
    );
  }

  return (
    <div>
      <Header
        userId={userId}
        onLogout={onLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {activeTab === 'analytics' ? (
        <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px' }}>
          <Analytics 
            userId={userId} 
            jobs={safeJobs}
            stats={stats}
            filteredJobs={filtered}
            activeFilter={filterStatus}
            searchTerm={searchTerm}
          />
        </div>
      ) : (
        <>
          {/* FIXED: Stats row NOW AT TOP - right after header! */}
          <div
            style={{
              maxWidth: 1200,
              margin: '24px auto 0',  // Top margin from header
              padding: '0 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <StatCard 
              title="Total Applications" 
              value={stats?.total ?? safeJobs.length} 
              color="#3b82f6" 
              icon="📦"
              description="Everything you've added to your tracker."
            />
            <StatCard 
              title="Active Opportunities" 
              value={stats?.activeOpportunities ?? 0} 
              color="#8b5cf6" 
              icon="🎯"
              description="Open roles that haven't been closed or rejected."
            />
            <StatCard 
              title="Interviews" 
              value={stats?.interviews ?? 0} 
              color="#f59e0b" 
              icon="💼"
              description="OA, behavioral, technical, and final stages combined."
            />
            <StatCard 
              title="Offers" 
              value={stats?.offers ?? 0} 
              color="#10b981" 
              icon="🎉"
              description="Opportunities that reached an offer."
            />
          </div>

          {/* THEN filters below stats */}
          <FilterControls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            collectionFilter={collectionFilter}
            setCollectionFilter={setCollectionFilter}
            onRefresh={() => fetchData(userId, noResponseDays)}
            onExportCSV={() => exportToCSV(filtered)}
            onOpenCSVUpload={() => setCsvOpen(true)}
            isSelectMode={isSelectMode}
            setIsSelectMode={setIsSelectMode}
            selectedJobs={selectedJobs}
            onSelectAll={selectAll}
            onBulkDelete={handleBulkDelete}
            filteredJobsCount={filtered.length}
          />

          {/* Job Cards List */}
          <div
            style={{
              maxWidth: 1200,
              margin: '16px auto 80px',
              padding: '0 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onClick={() => setDetailJob(job)}
                onToggleStar={async (e) => {
                  await toggleStar(userId, job);
                }}
                isSelected={selectedJobs.has(job._id)}
                onToggleSelect={toggleSelect}
                selectMode={isSelectMode}
              />
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <JobDetailModal
        open={Boolean(detailJob)}
        job={detailJob}
        onClose={() => setDetailJob(null)}
        onDelete={async (job) => {
          if (!window.confirm('Delete this job?')) return;
          setDetailJob(null);
          setJobs((prev) => prev.filter((j) => j._id !== job._id));
          const ok = await deleteJob(userId, job._id);
          if (!ok) fetchData(userId, noResponseDays);
        }}
        onSave={async (job, updates) => {
          const res = await saveJobDetails(userId, job._id, updates);
          if (res) {
            setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, ...updates } : j)));
            setDetailJob(null);
          } else {
            alert('Save failed.');
          }
        }}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        noResponseDays={noResponseDays}
        setNoResponseDays={setNoResponseDays}
      />

      <CSVUploadModal open={csvOpen} onClose={() => setCsvOpen(false)} onUpload={handleCSVUpload} />
    </div>
  );
};

export default JobTracker;