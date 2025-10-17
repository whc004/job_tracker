import React from 'react';
import { STATUS_OPTIONS } from '../../shared-constants';

const FilterControls = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  collectionFilter,
  setCollectionFilter,
  onRefresh,
  onExportCSV,
  onOpenCSVUpload,
  isSelectMode,
  setIsSelectMode,
  selectedJobs,
  onSelectAll,
  onBulkDelete,
  filteredJobsCount,
}) => {
  return (
    <div style={styles.container}>
      {/* Search box */}
      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="🔍 Search by company, position, location, or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Filters row */}
      <div style={styles.filters}>
        <div style={styles.selectShell}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.select}>
            <option value="All">All Status</option>
            {STATUS_OPTIONS.map(status => (<option key={status} value={status}>{status}</option>))}
          </select>
          <span style={styles.selectChevron}>▾</span>
        </div>

        <div style={styles.selectShell}>
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
          <span style={styles.selectChevron}>▾</span>
        </div>

        <button 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          style={styles.sortButton}
        >
          {sortOrder === 'asc' ? '⬆️' : '⬇️'}
        </button>

        <button onClick={onRefresh} style={styles.refreshButton}>
          🔄 Refresh
        </button>

        <div style={styles.collectionToggles}>
          <label
            style={{
              ...styles.checkboxLabel,
              ...(collectionFilter === 'favorites' ? styles.checkboxLabelActive : {})
            }}
          >
            <input
              type="checkbox"
              checked={collectionFilter === 'favorites'}
              onChange={() => setCollectionFilter(collectionFilter === 'favorites' ? 'all' : 'favorites')}
              style={styles.hiddenCheckbox}
            />
            <span style={styles.checkboxText}>Only </span>
            <span style={styles.checkboxIconStarred}>★</span>
          </label>
          <label
            style={{
              ...styles.checkboxLabel,
              ...(collectionFilter === 'nonFavorites' ? styles.checkboxLabelActive : {})
            }}
          >
            <input
              type="checkbox"
              checked={collectionFilter === 'nonFavorites'}
              onChange={() => setCollectionFilter(collectionFilter === 'nonFavorites' ? 'all' : 'nonFavorites')}
              style={styles.hiddenCheckbox}
            />
            <span style={styles.checkboxText}>Only </span>
            <span style={styles.checkboxIconUnstarred}>☆</span>
          </label>
        </div>

        {/* Bulk Actions */}
        <button
          onClick={() => {
            setIsSelectMode(!isSelectMode);
            if (isSelectMode) onSelectAll(true);
          }}
          style={{
            ...styles.refreshButton,
            background: isSelectMode ? '#ef4444' : '#6b7280',
          }}
        >
          {isSelectMode ? '✖ Cancel' : '☑️ Select'}
        </button>

        {isSelectMode && (
          <>
            <button onClick={() => onSelectAll()} style={styles.refreshButton}>
              {selectedJobs.size === filteredJobsCount ? '⬜ None' : '☑️ All'}
            </button>
            <button 
              onClick={onBulkDelete}
              disabled={selectedJobs.size === 0}
              style={{
                ...styles.refreshButton,
                background: '#ef4444',
                opacity: selectedJobs.size === 0 ? 0.5 : 1,
                cursor: selectedJobs.size === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              🗑️ Delete ({selectedJobs.size})
            </button>
          </>
        )}
        {/*
        <button onClick={onOpenCSVUpload} style={{ ...styles.refreshButton, background: '#10b981' }}>
          📤 Import
        </button>
        */}
        <button onClick={onExportCSV} style={{ ...styles.refreshButton, background: '#8b5cf6' }}>
          📥 Export
        </button>
      </div>
    </div>
  );
};

const styles = {
  // MAIN CONTAINER - Controls both rows
  container: {
    maxWidth: '1200px',           // ← CHANGE THIS to match your desired width
    margin: '24px auto',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',      // ← Stack search and filters vertically
    gap: '16px',
  },
  
  // SEARCH BOX - Full width of container
  searchBox: {
    width: '100%',                // ← Takes full container width
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
    width: '100%',              
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  
  selectShell: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'white',
    borderRadius: '12px',
    minWidth: '170px',
    border: '2px solid #d1d5db',
  },
  select: {
    appearance: 'none',
    padding: '12px 44px 12px 18px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 500,
    background: 'transparent',
    width: '100%',
    cursor: 'pointer',
    outline: 'none',
  },
  selectChevron: {
    position: 'absolute',
    right: '16px',
    pointerEvents: 'none',
    color: '#475569',
  },
  collectionToggles: {
    display: 'flex',
    gap: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    background: 'white',
    borderRadius: '12px',
    fontSize: '13px',
    cursor: 'pointer',
    border: '2px solid #d1d5db',
  },
  checkboxLabelActive: {
    borderColor: '#2563eb',
    background: '#dbeafe',
  },
  hiddenCheckbox: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
  checkboxIconStarred: {
    color: '#f59e0b',
    fontSize: '18px',
  },
  checkboxIconUnstarred: {
    color: '#94a3b8',
    fontSize: '18px',
  },
  checkboxText: {
    fontWeight: 600,
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
    padding: '12px 20px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
  },
};

export default FilterControls;