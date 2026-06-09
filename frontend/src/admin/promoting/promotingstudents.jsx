import React, { useState, useEffect } from 'react';
import { Users, ArrowUp, ArrowDown, AlertCircle, CheckCircle, RefreshCw, Search } from 'lucide-react';
import './promotingstudents.css'; // Adjust the path as necessary
import config from '../../config'; // Adjust the path to your config file
import AdminDashboard from '../promoting/Lepromoting';

const BulkYearManagement = () => {
  const [yearStats, setYearStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState({});
  const [lastOperation, setLastOperation] = useState(null);
  const [error, setError] = useState(null);
  const [yearRange, setYearRange] = useState({ min: null, max: null });
  const [yearSearch, setYearSearch] = useState(''); // Changed from selectedAdmissionYear
  const [search, setSearch] = useState('');

  // API base URL - adjust according to your setup
  const API_BASE_URL = `${config.backendUrl}`; // Change this to your actual API base URL

  // Fetch year range for validation
  const fetchYearRange = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/promoting-students/students/filters/options`);
      const data = await response.json();
      
      if (data.success && data.data.years && data.data.years.length > 0) {
        const years = data.data.years.map(year => parseInt(year)).sort((a, b) => a - b);
        setYearRange({
          min: years[0],
          max: years[years.length - 1]
        });
      }
    } catch (err) {
      console.error('Error fetching year range:', err);
    }
  };

  // Fetch year statistics with optional year and search filter
  const fetchYearStats = async (admissionYear = '', searchValue = '') => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/promoting-students/students/year-statistics`;
      const params = [];
      
      // Only add year param if it's a valid number
      if (admissionYear && admissionYear.trim() !== '') {
        const numericYear = parseInt(admissionYear);
        if (!isNaN(numericYear)) {
          params.push(`year=${encodeURIComponent(numericYear)}`);
        }
      }
      
      if (searchValue) {
        params.push(`search=${encodeURIComponent(searchValue)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setYearStats(data.data.statistics);
      } else {
        setError(data.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching year stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Promote all students of a specific year with optional admission year filter
  const promoteYear = async (currentYear) => {
    const operationKey = `promote-${currentYear}`;
    setOperationLoading(prev => ({ ...prev, [operationKey]: true }));
    setError(null);
    
    try {
      let url = `${API_BASE_URL}/promoting-students/students/promote-by-year/${encodeURIComponent(currentYear)}`;
      
      // Only add year param if it's a valid number
      if (yearSearch && yearSearch.trim() !== '') {
        const numericYear = parseInt(yearSearch);
        if (!isNaN(numericYear)) {
          url += `?year=${encodeURIComponent(numericYear)}`;
        }
      }
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastOperation({
          type: 'promotion',
          year: currentYear,
          admissionYear: yearSearch,
          data: data.data,
          message: data.message
        });
        // Refresh statistics
        await fetchYearStats(yearSearch, search);
      } else {
        setError(data.message || 'Promotion failed');
      }
    } catch (err) {
      setError('Failed to promote students');
      console.error('Error promoting year:', err);
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationKey]: false }));
    }
  };

  // Demote all students of a specific year with optional admission year filter
  const demoteYear = async (currentYear) => {
    const operationKey = `demote-${currentYear}`;
    setOperationLoading(prev => ({ ...prev, [operationKey]: true }));
    setError(null);
    
    try {
      let url = `${API_BASE_URL}/promoting-students/students/demote-by-year/${encodeURIComponent(currentYear)}`;
      
      // Only add year param if it's a valid number
      if (yearSearch && yearSearch.trim() !== '') {
        const numericYear = parseInt(yearSearch);
        if (!isNaN(numericYear)) {
          url += `?year=${encodeURIComponent(numericYear)}`;
        }
      }
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastOperation({
          type: 'demotion',
          year: currentYear,
          admissionYear: yearSearch,
          data: data.data,
          message: data.message
        });
        // Refresh statistics
        await fetchYearStats(yearSearch, search);
      } else {
        setError(data.message || 'Demotion failed');
      }
    } catch (err) {
      setError('Failed to demote students');
      console.error('Error demoting year:', err);
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationKey]: false }));
    }
  };

  // Handle year search input change
  const handleYearSearchChange = (e) => {
    const value = e.target.value;
    setYearSearch(value);
    
    // Debounce the API call or call immediately based on your preference
    fetchYearStats(value, search);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchYearStats(yearSearch, value);
  };

  // Clear year search
  const clearYearSearch = () => {
    setYearSearch('');
    fetchYearStats('', search);
  };

  // Load data on component mount
  useEffect(() => {
    fetchYearRange().then(() => {
      fetchYearStats(yearSearch, search);
    });
    // eslint-disable-next-line
  }, []);

  const getYearCSSClass = (year) => {
    const classes = {
      'first year': 'promoting-year-first',
      'second year': 'promoting-year-second',
      'third year': 'promoting-year-third',
      'fourth year': 'promoting-year-fourth',
      'alumni': 'promoting-year-alumni'
    };
    return classes[year] || 'promoting-year-default';
  };

  // Validate year input
  const isValidYear = (year) => {
    if (!year || year.trim() === '') return true; // Empty is valid (shows all)
    const numericYear = parseInt(year);
    return !isNaN(numericYear) && yearRange.min && yearRange.max && 
           numericYear >= yearRange.min && numericYear <= yearRange.max;
  };

  if (loading && yearStats.length === 0) {
    return (
      <div className="promoting-loading">
        <RefreshCw className="promoting-loading-icon promoting-spin" />
        <span className="promoting-loading-text">Loading year statistics...</span>
      </div>
    );
  }

  return (
    <div className="promoting-container">
      <div className="promoting-header">
        <h1 className="promoting-title">
          Bulk Year Management
        </h1>
        <p className="promoting-subtitle">
          Promote or demote all students within the same academic year
        </p>
      </div>

      {/* Filter Controls */}
      <div className="promoting-filters">
        <div className="promoting-filters-content">
          {/* Year Search Input */}
          <div className="promoting-filter-group">
            <Search className="promoting-filter-icon" />
            <label className="promoting-filter-label">
              Search by Admission Year:
            </label>
          </div>
          <div className="promoting-search-container" style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <input
              type="text"
              value={yearSearch}
              onChange={handleYearSearchChange}
              placeholder={`admission year below ${`${yearRange.max}`}`}
              className={`promoting-search-input ${!isValidYear(yearSearch) ? 'promoting-input-error' : ''}`}
              style={{paddingRight: yearSearch ? '30px' : '10px'}}
            />
            {yearSearch && (
              <button
                onClick={clearYearSearch}
                className="promoting-clear-btn"
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#666',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            )}
          </div>
          
          {/* Regular Search Input */}
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or roll no"
            className="promoting-search-input"
          />
          
          {/* Validation Message */}
          {yearSearch && !isValidYear(yearSearch) && (
            <span className="promoting-error-text" style={{color: '#ef4444', fontSize: '0.875rem'}}>
              Please enter a valid year between {yearRange.min} and {yearRange.max}
            </span>
          )}
          
          {/* Filter Info */}
          {yearSearch && isValidYear(yearSearch) && yearSearch.trim() !== '' && (
            <span className="promoting-filter-info">
              Showing students from {yearSearch} admission batch
            </span>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="promoting-alert promoting-alert-error">
          <AlertCircle className="promoting-alert-icon promoting-alert-icon-error" />
          <span className="promoting-alert-title promoting-alert-title-error">{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {lastOperation && (
        <div className="promoting-alert promoting-alert-success">
          <div className="promoting-alert-content">
            <div className="promoting-alert-title promoting-alert-title-success" style={{display: 'flex', alignItems: 'center', marginBottom: '0.5rem'}}>
              <CheckCircle className="promoting-alert-icon promoting-alert-icon-success" />
              Operation Completed
            </div>
            <p className="promoting-alert-message promoting-alert-message-success">{lastOperation.message}</p>
            <div className="promoting-alert-details promoting-alert-details-success">
              <p>Students processed: {lastOperation.data.totalStudents}</p>
              <p>Successful {lastOperation.type}s: {lastOperation.data.promoted?.length || lastOperation.data.demoted?.length || 0}</p>
              {lastOperation.data.errors?.length > 0 && (
                <p>Errors: {lastOperation.data.errors.length}</p>
              )}
              {lastOperation.admissionYear && lastOperation.admissionYear.trim() !== '' && (
                <p>Admission Year Filter: {lastOperation.admissionYear} batch</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="promoting-refresh-section">
        <button
          onClick={() => fetchYearStats(yearSearch, search)}
          disabled={loading}
          className="promoting-refresh-btn"
        >
          <RefreshCw className={`promoting-refresh-icon ${loading ? 'promoting-spin' : ''}`} />
          Refresh Statistics
        </button>
      </div>

      {/* Year Statistics Cards */}
      <div className="promoting-cards-grid">
        {yearStats.map((yearData) => (
          <div
            key={yearData.currentYear}
            className={`promoting-year-card ${getYearCSSClass(yearData.currentYear)}`}
          >
            <div className="promoting-card-header">
              <div className="promoting-card-title-group">
                <Users className="promoting-card-icon" />
                <h3 className="promoting-card-title">
                  {yearData.currentYear}
                </h3>
              </div>
              <span className="promoting-card-count">
                {yearData.count}
              </span>
            </div>

            {/* Student Count Info */}
            <div className="promoting-card-info">
              <p className="promoting-card-description">
                {yearData.count === 0 ? 'No students' : 
                 yearData.count === 1 ? '1 student' : 
                 `${yearData.count} students`}
                {yearSearch && yearSearch.trim() !== '' && isValidYear(yearSearch) && (
                  <span className="promoting-card-batch-info">
                    from {yearSearch} batch
                  </span>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="promoting-actions">
              {/* Promote Button */}
              <button
                onClick={() => promoteYear(yearData.currentYear)}
                disabled={
                  !yearData.canPromote || 
                  yearData.count === 0 || 
                  operationLoading[`promote-${yearData.currentYear}`]
                }
                className={`promoting-btn ${
                  yearData.canPromote && yearData.count > 0
                    ? 'promoting-btn-promote'
                    : 'promoting-btn-disabled'
                } ${operationLoading[`promote-${yearData.currentYear}`] ? 'promoting-btn-loading' : ''}`}
              >
                {operationLoading[`promote-${yearData.currentYear}`] ? (
                  <RefreshCw className="promoting-btn-icon promoting-spin" />
                ) : (
                  <ArrowUp className="promoting-btn-icon" />
                )}
                {yearData.canPromote ? 'Promote All' : 'Cannot Promote'}
              </button>

              {/* Demote Button */}
              <button
                onClick={() => demoteYear(yearData.currentYear)}
                disabled={
                  !yearData.canDemote || 
                  yearData.count === 0 || 
                  operationLoading[`demote-${yearData.currentYear}`]
                }
                className={`promoting-btn ${
                  yearData.canDemote && yearData.count > 0
                    ? 'promoting-btn-demote'
                    : 'promoting-btn-disabled'
                } ${operationLoading[`demote-${yearData.currentYear}`] ? 'promoting-btn-loading' : ''}`}
              >
                {operationLoading[`demote-${yearData.currentYear}`] ? (
                  <RefreshCw className="promoting-btn-icon promoting-spin" />
                ) : (
                  <ArrowDown className="promoting-btn-icon" />
                )}
                {yearData.canDemote ? 'Demote All' : 'Cannot Demote'}
              </button>
            </div>

            {/* Student Names Preview (if not too many) */}
            {yearData.count > 0 && yearData.count <= 5 && yearData.students && (
              <div className="promoting-students-preview">
                <p className="promoting-students-title">Students:</p>
                <div className="promoting-students-list">
                  {yearData.students.map((student, index) => (
                    <div key={student.id} className="promoting-student-item">
                      {student.name} ({student.year})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total Statistics */}
      <div className="promoting-overall-stats">
        <h3 className="promoting-overall-title">
          Overall Statistics
          {yearSearch && yearSearch.trim() !== '' && isValidYear(yearSearch) && (
            <span className="promoting-overall-subtitle">
              ({yearSearch} Batch)
            </span>
          )}
        </h3>
        <div className="promoting-stats-grid">
          {yearStats.map((yearData) => (
            <div key={yearData.currentYear} className="promoting-stat-item">
              <div className="promoting-stat-number">
                {yearData.count}
              </div>
              <div className="promoting-stat-label">
                {yearData.currentYear}
              </div>
            </div>
          ))}
        </div>
        <div className="promoting-total-section">
          <div className="promoting-total-number">
            {yearStats.reduce((sum, year) => sum + year.count, 0)}
          </div>
          <div className="promoting-total-label">
            Total Students
            {yearSearch && yearSearch.trim() !== '' && isValidYear(yearSearch) && (
              <span className="promoting-total-batch">
                from {yearSearch} batch
              </span>
            )}
          </div>
        </div>
      </div>
      <AdminDashboard/>
    </div>
  );
};

export default BulkYearManagement;