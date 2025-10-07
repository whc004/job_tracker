import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, BarChart3, Calendar, Building, MapPin, RefreshCw, AlertCircle, X, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const JobTracker = () => {
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    city: '',
    state: '',
    isRemote: false,
    dateApplied: new Date().toISOString().split('T')[0], // Default to today
    status: 'Applied',
    priority: 'Medium',
    jobUrl: '',
    notes: '',
    salary: '',
    technicalDetails: []
  });

  // Updated status options to match backend
  const statusOptions = [
    'Applied', 'OA', 'Behavioral Interview', 'Technical Interview', 
    'Final Interview', 'Offer', 'Rejected', 'No Response'
  ];
  
  // Updated priority options
  const priorityOptions = ['Low', 'Medium', 'High', 'Dream Job'];

  // US States plus Out of U.S. option
  const stateOptions = [
    'Out of U.S.',
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // API Functions
  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const [appsResponse, statsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/applications`),
        axios.get(`${API_BASE_URL}/stats`)
      ]);
      
      // Handle the correct response structure
      setApplications(appsResponse.data.data || appsResponse.data);
      setStats(statsResponse.data.data || statsResponse.data);
      console.log('✅ Connected to backend successfully!');
    } catch (error) {
      console.error('❌ Backend connection failed:', error.message);
      setError('Cannot connect to backend server. Please check if the server is running.');
      // Remove sample data loading - show empty state instead
      setApplications([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (appData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/applications`, appData);
      const newApp = response.data.data || response.data;
      setApplications(prev => [...prev, newApp]);
      setError('');
      await fetchApplications(); // Refresh stats
      return true;
    } catch (error) {
      console.error('Create failed:', error);
      const newApp = { ...appData, id: Date.now() };
      setApplications(prev => [...prev, newApp]);
      return true;
    }
  };

  const updateApplication = async (id, appData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/applications/${id}`, appData);
      const updatedApp = response.data.data || response.data;
      setApplications(prev => prev.map(app => app.id === id || app._id === id ? updatedApp : app));
      setError('');
      await fetchApplications(); // Refresh stats
      return true;
    } catch (error) {
      console.error('Update failed:', error);
      setApplications(prev => prev.map(app => 
        (app.id === id || app._id === id) ? { ...appData, id: id || app._id } : app
      ));
      return true;
    }
  };

  const deleteApplication = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/applications/${id}`);
      setApplications(prev => prev.filter(app => app.id !== id && app._id !== id));
      setError('');
      await fetchApplications(); // Refresh stats
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      setApplications(prev => prev.filter(app => app.id !== id && app._id !== id));
      return true;
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company || !formData.position) {
      setError('Please fill in all required fields (Company, Position)');
      return;
    }
    
    setLoading(true);
    let success = false;
    
    if (editingApp) {
      success = await updateApplication(editingApp.id || editingApp._id, formData);
    } else {
      success = await createApplication(formData);
    }
    
    if (success) {
      resetForm();
    }
    
    setLoading(false);
  };

  const handleEdit = (app) => {
    setFormData({
      company: app.company || '',
      position: app.position || '',
      location: app.location || '',
      dateApplied: app.dateApplied ? app.dateApplied.split('T')[0] : '',
      status: app.status || 'Applied',
      priority: app.priority || 'Medium',
      jobUrl: app.jobUrl || '',
      notes: app.notes || '',
      salary: app.salary || '',
      contactPerson: app.contactPerson || '',
      technicalDetails: app.technicalDetails || []
    });
    setEditingApp(app);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      setLoading(true);
      await deleteApplication(id);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      location: '',
      dateApplied: '',
      status: 'Applied',
      priority: 'Medium',
      jobUrl: '',
      notes: '',
      salary: '',
      contactPerson: '',
      technicalDetails: []
    });
    setShowForm(false);
    setEditingApp(null);
    setError('');
  };

  const exportToCSV = () => {
    const headers = ['Company', 'Position', 'Location', 'Date Applied', 'Status', 'Priority', 'Salary', 'Technical Details', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...applications.map(app => [
        `"${app.company}"`,
        `"${app.position}"`,
        `"${app.location || ''}"`,
        app.dateApplied,
        app.status,
        app.priority,
        `"${app.salary || ''}"`,
        `"${(app.technicalDetails || []).join(', ')}"`,
        `"${app.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Add timestamp to filename
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    link.setAttribute('href', url);
    link.setAttribute('download', `job-applications-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csvFile', file);

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/upload/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setError('');
        alert(`CSV uploaded successfully! Created: ${response.data.stats.created}, Updated: ${response.data.stats.updated}`);
        await fetchApplications(); // Refresh data
      }
    } catch (error) {
      console.error('CSV upload failed:', error);
      setError(`Failed to upload CSV: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      setShowCsvUpload(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  );

  // Sorting functions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedApplications = React.useMemo(() => {
    if (!sortConfig.key) return filteredApplications;

    return [...filteredApplications].sort((a, b) => {
      const { key, direction } = sortConfig;
      const modifier = direction === 'asc' ? 1 : -1;

      switch (key) {
        case 'company':
        case 'position':
          return modifier * (a[key] || '').localeCompare(b[key] || '');

        case 'location':
          // Sort by state first, then city, with Remote at first or last
          const getLocationParts = (location) => {
            if (!location) return ['', '', false];
            const trimmed = location.trim();
            if (trimmed.toLowerCase() === 'remote') return ['', '', true];
            
            const parts = trimmed.split(',').map(part => part.trim());
            if (parts.length >= 2) {
              return [parts[parts.length - 1], parts[0], false]; // [state, city, isRemote]
            }
            return [parts[0] || '', '', false];
          };
          
          const [aState, aCity, aIsRemote] = getLocationParts(a.location);
          const [bState, bCity, bIsRemote] = getLocationParts(b.location);
          
          // Handle Remote positioning based on sort direction
          if (aIsRemote && bIsRemote) return 0;
          if (aIsRemote) return direction === 'asc' ? -1 : 1; // Remote first when asc, last when desc
          if (bIsRemote) return direction === 'asc' ? 1 : -1;
          
          // Normal location sorting for non-remote
          const stateCompare = aState.localeCompare(bState);
          if (stateCompare !== 0) return modifier * stateCompare;
          return modifier * aCity.localeCompare(bCity);

        case 'dateApplied':
          const dateA = new Date(a.dateApplied || 0);
          const dateB = new Date(b.dateApplied || 0);
          return modifier * (dateA.getTime() - dateB.getTime());

        case 'status':
          const statusOrder = [
            'Applied', 'OA', 'Behavioral Interview', 'Technical Interview', 
            'Final Interview', 'Offer', 'Rejected', 'No Response'
          ];
          const statusOrderReverse = [
            'Offer', 'Final Interview', 'Technical Interview', 'Behavioral Interview',
            'OA', 'Applied', 'Rejected', 'No Response'
          ];
          
          const orderToUse = direction === 'asc' ? statusOrder : statusOrderReverse;
          const indexA = orderToUse.indexOf(a.status);
          const indexB = orderToUse.indexOf(b.status);
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);

        case 'priority':
          const priorityOrder = direction === 'asc' 
            ? ['Low', 'Medium', 'High', 'Dream Job']
            : ['Dream Job', 'High', 'Medium', 'Low'];
          const priorityIndexA = priorityOrder.indexOf(a.priority);
          const priorityIndexB = priorityOrder.indexOf(b.priority);
          return (priorityIndexA === -1 ? 999 : priorityIndexA) - (priorityIndexB === -1 ? 999 : priorityIndexB);

        case 'salary':
          // Extract numeric value from salary string
          const extractSalary = (salaryStr) => {
            if (!salaryStr) return 0;
            const matches = salaryStr.match(/[\d,]+/);
            return matches ? parseInt(matches[0].replace(/,/g, ''), 10) : 0;
          };
          
          const salaryA = extractSalary(a.salary);
          const salaryB = extractSalary(b.salary);
          return modifier * (direction === 'asc' ? salaryA - salaryB : salaryB - salaryA);

        default:
          return 0;
      }
    });
  }, [filteredApplications, sortConfig]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Analytics data - Updated to focus on positive metrics
  const statusCounts = statusOptions.reduce((acc, status) => {
    acc[status] = applications.filter(app => app.status === status).length;
    return acc;
  }, {});

  // Chart data - show all positive statuses including zeros
  const positiveStatuses = ['Applied', 'OA', 'Behavioral Interview', 'Technical Interview', 'Final Interview', 'Offer'];
  const chartData = positiveStatuses.map(status => ({
    name: status === 'Behavioral Interview' ? 'Behavioral' : 
          status === 'Technical Interview' ? 'Technical' :
          status === 'Final Interview' ? 'Final' : status,
    count: statusCounts[status] || 0,
    fullName: status
  }));
  
  // Debug log to check data
  console.log('Chart data:', chartData);

  // Interview breakdown data - always show all types
  const interviewTypes = [
    { name: 'Behavioral Interview', count: statusCounts['Behavioral Interview'] || 0, color: '#10B981' },
    { name: 'Technical Interview', count: statusCounts['Technical Interview'] || 0, color: '#F59E0B' },
    { name: 'Final Interview', count: statusCounts['Final Interview'] || 0, color: '#8B5CF6' }
  ];

  const totalInterviews = interviewTypes.reduce((sum, type) => sum + type.count, 0);

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '24px', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0' }}>
              Job Application Tracker
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Track your job applications and manage your career journey
            </p>
            
            {error && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

        {/* CSV Upload Modal */}
        {showCsvUpload && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '500px',
              width: '100%',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Upload CSV File
                </h2>
                <button
                  onClick={() => setShowCsvUpload(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                  Upload a CSV file with your job applications. The file should have columns for Company, Position, Location, Status, Priority, etc.
                </p>
                
                <div style={{ 
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb'
                }}>
                  <Upload size={32} style={{ color: '#9ca3af', margin: '0 auto 12px auto' }} />
                  <p style={{ color: '#374151', fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>
                    Choose CSV file
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px 0' }}>
                    or drag and drop it here
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: loading ? 0.6 : 1
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <strong>Expected CSV format:</strong><br/>
                Company*, Position*, Location, Status, Priority, Date Applied, Salary, Technical Details, Notes<br/>
                <em>* Required fields. Date defaults to today, Status/Priority have defaults.</em>
              </div>

              {loading && (
                <div style={{ textAlign: 'center', marginTop: '16px', color: '#6b7280' }}>
                  Uploading CSV file...
                </div>
              )}
            </div>
          </div>
        )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            <button 
              onClick={() => fetchApplications()}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            
            <button 
              onClick={() => setView(view === 'table' ? 'analytics' : 'table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <BarChart3 size={16} />
              {view === 'table' ? 'Analytics' : 'Table View'}
            </button>
            
            <button 
              onClick={exportToCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#059669',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
            
            <button 
              onClick={() => setShowCsvUpload(true)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#7c3aed',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              <Upload size={16} />
              Upload CSV
            </button>
            
            <button 
              onClick={() => setShowForm(true)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              <Plus size={16} />
              Add Application
            </button>
          </div>

          {/* Updated Stats Cards with time-based logic */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>
                {applications.filter(app => ['Applied'].includes(app.status)).length}
              </div>
              <div style={{ color: '#1e40af', fontSize: '14px' }}>Applied</div>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                {applications.filter(app => {
                  // Applications within two weeks OR in interview stages
                  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                  const appDate = new Date(app.dateApplied || app.lastStatusUpdate);
                  const isRecent = appDate >= twoWeeksAgo;
                  const isInInterviewProcess = ['OA', 'Behavioral Interview', 'Technical Interview', 'Final Interview'].includes(app.status);
                  
                  return isRecent || isInInterviewProcess;
                }).length}
              </div>
              <div style={{ color: '#047857', fontSize: '14px' }}>Active Opportunities</div>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#faf5ff', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
                {applications.filter(app => 
                  ['Behavioral Interview', 'Technical Interview', 'Final Interview'].includes(app.status)
                ).length}
              </div>
              <div style={{ color: '#6d28d9', fontSize: '14px' }}>Interview Progress</div>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                {applications.filter(app => {
                  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                  const appDate = new Date(app.dateApplied || app.lastStatusUpdate);
                  const isOld = appDate < twoWeeksAgo;
                  
                  return app.status === 'Rejected' || (app.status === 'No Response' && isOld);
                }).length}
              </div>
              <div style={{ color: '#b91c1c', fontSize: '14px' }}>Closed</div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {view === 'analytics' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Progress Bar Chart - Positive statuses only */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                Application Progress
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                    tick={{ fontSize: 12 }}
                    height={60}
                  />
                  <YAxis />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="#3b82f6" minPointSize={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Interview Types Breakdown */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                Interview Types
              </h3>
              {(() => {
                const activeTypes = interviewTypes.filter(t => t.count > 0);
                
                if (activeTypes.length === 0) {
                  // No interviews - show simple 0 in gray
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                      <div style={{
                        backgroundColor: '#f3f4f6',
                        borderRadius: '12px',
                        padding: '32px',
                        color: '#6b7280',
                        textAlign: 'center',
                        minWidth: '200px'
                      }}>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
                          0
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '500' }}>
                          No Active Interviews
                        </div>
                      </div>
                    </div>
                  );
                } else if (activeTypes.length === 1) {
                  // Only one type active - show single card
                  const activeType = activeTypes[0];
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                      <div style={{
                        backgroundColor: activeType.color,
                        borderRadius: '12px',
                        padding: '32px',
                        color: 'white',
                        textAlign: 'center',
                        minWidth: '200px'
                      }}>
                        <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
                          {activeType.count}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '500' }}>
                          {activeType.name}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Multiple types active - show pie chart
                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={activeTypes}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, count }) => `${name.split(' ')[0]}: ${count}`}
                        >
                          {activeTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                }
              })()}
            </div>
          </div>
        ) : (
          <>
            {/* Updated Filters with new status options */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '24px', padding: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: filter === 'all' ? '#2563eb' : '#f3f4f6',
                    color: filter === 'all' ? 'white' : '#374151'
                  }}
                >
                  All ({applications.length})
                </button>
                {statusOptions.map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: filter === status ? '#2563eb' : '#f3f4f6',
                      color: filter === status ? 'white' : '#374151'
                    }}
                  >
                    {status} ({statusCounts[status] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Applications Table */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      {[
                        { key: 'company', label: 'Company' },
                        { key: 'position', label: 'Position' },
                        { key: 'location', label: 'Location' },
                        { key: 'dateApplied', label: 'Date Applied' },
                        { key: 'status', label: 'Status' },
                        { key: 'priority', label: 'Priority' },
                        { key: 'salary', label: 'Salary' },
                        { key: null, label: 'Actions' }
                      ].map(header => (
                        <th 
                          key={header.key || header.label} 
                          onClick={header.key ? () => handleSort(header.key) : undefined}
                          style={{ 
                            padding: '12px 16px', 
                            textAlign: 'left', 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: header.key ? 'pointer' : 'default',
                            userSelect: 'none',
                            transition: 'background-color 0.2s',
                            backgroundColor: header.key && sortConfig.key === header.key ? '#e5e7eb' : 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            if (header.key) e.target.style.backgroundColor = '#f3f4f6';
                          }}
                          onMouseLeave={(e) => {
                            if (header.key) {
                              e.target.style.backgroundColor = sortConfig.key === header.key ? '#e5e7eb' : 'transparent';
                            }
                          }}
                        >
                          {header.label}
                          {header.key && (
                            <span style={{ marginLeft: '4px', fontSize: '10px' }}>
                              {getSortIcon(header.key)}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedApplications.map((app, index) => (
                      <tr 
                        key={app.id || app._id} 
                        style={{ 
                          borderTop: index > 0 ? '1px solid #e5e7eb' : 'none'
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building size={16} style={{ color: '#6b7280' }} />
                            <span style={{ fontWeight: '500', color: '#1f2937' }}>{app.company}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: '#1f2937' }}>{app.position}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
                            <MapPin size={14} />
                            {app.location || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
                            <Calendar size={14} />
                            {app.dateApplied ? new Date(app.dateApplied).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: app.status === 'Offer' ? '#dcfce7' : 
                                           app.status === 'Rejected' ? '#fee2e2' :
                                           app.status === 'No Response' ? '#f3f4f6' :
                                           app.status.includes('Interview') ? '#dbeafe' : '#fef3c7',
                            color: app.status === 'Offer' ? '#166534' : 
                                   app.status === 'Rejected' ? '#dc2626' :
                                   app.status === 'No Response' ? '#6b7280' :
                                   app.status.includes('Interview') ? '#1e40af' : '#d97706'
                          }}>
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: app.priority === 'Dream Job' ? '#fdf2f8' :
                                           app.priority === 'High' ? '#fee2e2' :
                                           app.priority === 'Medium' ? '#fef3c7' : '#f0f9ff',
                            color: app.priority === 'Dream Job' ? '#be185d' :
                                   app.priority === 'High' ? '#dc2626' :
                                   app.priority === 'Medium' ? '#d97706' : '#0369a1'
                          }}>
                            {app.priority}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#1f2937' }}>{app.salary || 'N/A'}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(app)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                color: '#4f46e5',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(app.id || app._id)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                color: '#dc2626',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {sortedApplications.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    No applications found. Click "Add Application" to get started!
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Updated Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    {editingApp ? 'Edit Application' : 'Add New Application'}
                  </h2>
                  <button
                    onClick={resetForm}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Company *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Position *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#374151',
                      cursor: 'pointer',
                      marginBottom: '16px'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.isRemote}
                        onChange={(e) => setFormData({
                          ...formData, 
                          isRemote: e.target.checked,
                          city: e.target.checked ? '' : formData.city,
                          state: e.target.checked ? '' : formData.state
                        })}
                        style={{ cursor: 'pointer' }}
                      />
                      Remote Position
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        City {!formData.isRemote && <span style={{ color: '#dc2626' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        disabled={formData.isRemote}
                        required={!formData.isRemote}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: formData.isRemote ? '#f3f4f6' : 'white',
                          color: formData.isRemote ? '#9ca3af' : '#1f2937'
                        }}
                        placeholder="e.g. San Francisco"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        State {!formData.isRemote && <span style={{ color: '#dc2626' }}>*</span>}
                      </label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        disabled={formData.isRemote}
                        required={!formData.isRemote}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: formData.isRemote ? '#f3f4f6' : 'white',
                          color: formData.isRemote ? '#9ca3af' : '#1f2937'
                        }}
                      >
                        <option value="">Select State</option>
                        {stateOptions.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Date Applied
                    </label>
                    <input
                      type="date"
                      value={formData.dateApplied}
                      onChange={(e) => setFormData({...formData, dateApplied: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      >
                        {priorityOptions.map(priority => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Salary (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => setFormData({...formData, salary: e.target.value})}
                        placeholder="e.g. $80,000 or $80k-$100k"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Technical Details Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Technical Details
                    </label>
                    <input
                      type="text"
                      value={(formData.technicalDetails || []).join(', ')}
                      onChange={(e) => setFormData({
                        ...formData, 
                        technicalDetails: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                      })}
                      placeholder="e.g. React, Node.js, MongoDB, AWS (comma separated)"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Enter skills/technologies separated by commas
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Job URL
                    </label>
                    <input
                      type="url"
                      value={formData.jobUrl}
                      onChange={(e) => setFormData({...formData, jobUrl: e.target.value})}
                      placeholder="https://company.com/job-posting"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Any additional notes about this application..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Saving...' : (editingApp ? 'Update Application' : 'Add Application')}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobTracker;