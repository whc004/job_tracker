import { useState, useCallback } from 'react';
import { PRIORITY_LEVELS , API_BASE_URL } from '../../shared-constants';


const ENABLE_LOGGING = false;
const debugLog = (...args) => { if (ENABLE_LOGGING) console.log(...args); };
const debugError = (...args) => { if (ENABLE_LOGGING) console.error(...args); };


debugLog(" API : " + API_BASE_URL);

export const useJobData = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const autoUpdateNoResponse = async (jobsList, userId, daysThreshold) => {
    const now = new Date();
    const updatedJobs = [];
    for (const job of jobsList) {
      if (job.status === 'Applied') {
        const appliedDate = new Date(job.dateApplied);
        const daysSinceApplied = Math.floor((now - appliedDate) / (1000 * 60 * 60 * 24));
        if (daysSinceApplied >= daysThreshold) {
          try {
            await fetch(`${API_BASE_URL}/applications/${job._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
              body: JSON.stringify({ status: 'No Response' })
            });
            updatedJobs.push({ ...job, status: 'No Response' });
          } catch (err) {
            debugError('Error auto-updating job:', err);
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

  const fetchData = useCallback(async (userId, noResponseDays) => {
    setLoading(true);
    try {
      const jobsRes = await fetch(`${API_BASE_URL}/applications`, { 
        headers: { 'x-user-id': userId } });
      const jobsData = await jobsRes.json();
    
      if (jobsData.success) {
        const updatedJobs = await autoUpdateNoResponse(jobsData.data, userId, noResponseDays);
        setJobs(updatedJobs);
      }
    } catch (err) {
      debugError('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJobStatus = async (userId, jobId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ status: newStatus })
      });
      return response.ok ? await response.json() : null;
    } catch (err) {
      debugError('Error updating job:', err);
      return null;
    }
  };

  const toggleStar = async (userId, job) => {
    const newPriority = job.priority === PRIORITY_LEVELS.STAR ? PRIORITY_LEVELS.NORMAL : PRIORITY_LEVELS.STAR;
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${job._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ priority: newPriority })
      });
      if (response.ok) {
        setJobs(prevJobs => prevJobs.map(j => j._id === job._id ? { ...j, priority: newPriority } : j));
        return newPriority;
      }
    } catch (err) {
      debugError('Error toggling star:', err);
    }
    return null;
  };

  const deleteJob = async (userId, jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${jobId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      return response.ok;
    } catch (err) {
      debugError('Error deleting job:', err);
      return false;
    }
  };

  const saveJobDetails = async (userId, jobId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(updates)
      });
      return response.ok ? await response.json() : null;
    } catch (err) {
      debugError('Error updating job:', err);
      return null;
    }
  };

  const bulkDeleteJobs = async (userId, jobIds) => {
    try {
      await Promise.all(
        Array.from(jobIds).map(jobId =>
          fetch(`${API_BASE_URL}/applications/${jobId}`, {
            method: 'DELETE',
            headers: { 'x-user-id': userId }
          })
        )
      );
      return true;
    } catch (err) {
      debugError('Bulk delete error:', err);
      return false;
    }
  };

  return {
    jobs,
    loading,
    fetchData,
    updateJobStatus,
    toggleStar,
    deleteJob,
    saveJobDetails,
    bulkDeleteJobs,
    setJobs
  };
};