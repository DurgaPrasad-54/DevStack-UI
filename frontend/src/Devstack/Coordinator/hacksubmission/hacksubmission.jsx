import { useState, useEffect } from 'react';
import { Search, Download, Eye, Trash2, Filter, Calendar, Users, FileText, Github, ExternalLink, AlertCircle, X, CheckCircle } from 'lucide-react';
import config from '../../../config';
import './hacksubmission.css';

const CoordinatorSubmissionDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filters, setFilters] = useState({
    hackathon: '',
    branch: '',
    search: ''
  });
  const [hackathons, setHackathons] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [branchStats, setBranchStats] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, submissionId: null });
  
  const [coordinatorYear] = useState(localStorage.getItem('coordinatoryear') || '');
  const [coordinatorCollege] = useState(localStorage.getItem('coordinatordetails') || '');
  const [coordinatorId, setCoordinatorId] = useState(localStorage.getItem('coordinatorid') || null);
  const [useCoordinatorRoutes, setUseCoordinatorRoutes] = useState(false);
  
  // API base URL using config
  const API_BASE = `${config.backendUrl}/hacksubmission`;
  const HACKATHON_API = `${config.backendUrl}/hackathon`;

  useEffect(() => {
    fetchHackathons();
    fetchStats();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (filters.hackathon) {
      fetchSubmissions();
      fetchBranchStats();
    } else {
      setSubmissions([]);
      setBranchStats(null);
      setLoading(false);
    }
  }, [filters.hackathon]);

  const fetchSubmissions = async () => {
    if (!filters.hackathon) {
      setSubmissions([]);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching submissions for hackathon:', filters.hackathon);
      console.log('With coordinator filters:', { coordinatorYear, coordinatorCollege });

      let response;
      if (coordinatorId && coordinatorId.match(/^[0-9a-fA-F]{24}$/)) {
        const params = new URLSearchParams();
        if (coordinatorYear) params.append('coordinatorYear', coordinatorYear);
        if (coordinatorCollege) params.append('coordinatorCollege', coordinatorCollege);
        
        const url = `${API_BASE}/coordinator/${coordinatorId}/hackathon/${filters.hackathon}?${params.toString()}`;
        console.log('Fetching from:', url);
        response = await fetch(url);
      } else {
        const params = new URLSearchParams();
        params.append('hackathon', filters.hackathon);
        response = await fetch(`${API_BASE}?${params}`);
      }

      console.log('Submission response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch submissions');
      }

      const data = await response.json();
      console.log('Submissions data:', data);
      console.log(`Found ${data.count} submissions matching ${coordinatorCollege} - ${coordinatorYear}`);
      
      setSubmissions(data.submissions || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.message);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHackathons = async () => {
    try {
      console.log('Fetching hackathons');
      console.log('With coordinator filters:', { coordinatorYear, coordinatorCollege });

      let response;
      if (coordinatorId && coordinatorId.match(/^[0-9a-fA-F]{24}$/)) {
        const params = new URLSearchParams();
        if (coordinatorYear) params.append('coordinatorYear', coordinatorYear);
        if (coordinatorCollege) params.append('coordinatorCollege', coordinatorCollege);
        
        const url = `${API_BASE}/coordinator/${coordinatorId}/hackathons?${params.toString()}`;
        console.log('Fetching hackathons from:', url);
        response = await fetch(url);
      } else {
        response = await fetch(HACKATHON_API);
      }

      console.log('Hackathon response status:', response.status);

      if (!response.ok) {
        console.error('Failed to fetch hackathons');
        setError('Failed to load hackathons. Please check your API connection.');
        return;
      }

      const data = await response.json();
      console.log('Hackathons data:', data);
      
      const hackathonList = data.hackathons || data || [];
      console.log(`Loaded ${hackathonList.length} hackathons for ${coordinatorCollege} - ${coordinatorYear}`);
      setHackathons(hackathonList);
    } catch (err) {
      console.error('Error fetching hackathons:', err);
      setError('Failed to load hackathons. Please check your API connection.');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/by-hackathon`);
      if (!response.ok) {
        console.error('Failed to fetch stats');
        return;
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchBranchStats = async () => {
    if (!filters.hackathon) return;

    try {
      if (!coordinatorId || !coordinatorId.match(/^[0-9a-fA-F]{24}$/)) {
        return;
      }

      const params = new URLSearchParams();
      if (coordinatorYear) params.append('coordinatorYear', coordinatorYear);
      if (coordinatorCollege) params.append('coordinatorCollege', coordinatorCollege);

      const url = `${API_BASE}/coordinator/hackathon/${filters.hackathon}/stats/by-branch?${params.toString()}`;
      console.log('Fetching branch stats from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch branch stats');
        return;
      }

      const data = await response.json();
      console.log('Branch stats:', data);
      setBranchStats(data);
    } catch (err) {
      console.error('Error fetching branch stats:', err);
    }
  };

  const viewSubmission = async (id) => {
    try {
      console.log('Viewing submission:', id);
      const response = await fetch(`${API_BASE}/${id}`);
      console.log('View submission response status:', response.status);
      
      if (!response.ok) throw new Error('Failed to fetch submission details');
      
      const data = await response.json();
      console.log('Submission details:', data);
      setSelectedSubmission(data);
    } catch (err) {
      console.error('Error viewing submission:', err);
      setError('Error viewing submission: ' + err.message);
    }
  };

  const downloadDocument = async (submissionId, docIndex, filename) => {
    try {
      const response = await fetch(`${API_BASE}/${submissionId}/document/${docIndex}`);
      if (!response.ok) throw new Error('Failed to download document');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Error downloading document: ' + err.message);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ show: true, submissionId: id });
  };

  const confirmDelete = async () => {
    const { submissionId } = deleteModal;
    try {
      const response = await fetch(`${API_BASE}/${submissionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete submission');
      
      setError(null);
      fetchSubmissions();
      setSelectedSubmission(null);
      setDeleteModal({ show: false, submissionId: null });
    } catch (err) {
      setError('Error deleting submission: ' + err.message);
      setDeleteModal({ show: false, submissionId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, submissionId: null });
  };

  const clearFilters = () => {
    setFilters({ hackathon: '', branch: '', search: '' });
    setSubmissions([]);
  };

  // Get unique branches from submissions
  const branches = [...new Set(
    submissions.flatMap(sub => [
      sub.teamLead?.student?.branch,
      ...(sub.teamMembers?.map(m => m.student?.branch) || [])
    ].filter(Boolean))
  )].sort();

  // Filter submissions by branch and search
  const filteredSubmissions = submissions.filter(sub => {
    if (filters.branch) {
      const teamBranches = [
        sub.teamLead?.student?.branch,
        ...(sub.teamMembers?.map(m => m.student?.branch) || [])
      ].filter(Boolean);
      if (!teamBranches.includes(filters.branch)) {
        return false;
      }
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        sub.team?.name?.toLowerCase().includes(searchLower) ||
        sub.problemSub?.title?.toLowerCase().includes(searchLower) ||
        sub.teamLead?.student?.name?.toLowerCase().includes(searchLower) ||
        sub.teamLead?.student?.rollNo?.toLowerCase().includes(searchLower) ||
        sub.projectDescription?.toLowerCase().includes(searchLower) ||
        sub.teamMembers?.some(m => 
          m.student?.name?.toLowerCase().includes(searchLower) ||
          m.student?.rollNo?.toLowerCase().includes(searchLower)
        )
      );
    }
    return true;
  });

  // Validation check
  if (!coordinatorYear || !coordinatorCollege) {
    return (
      <div className="coordinatorsub-error-banner">
        <div className="coordinatorsub-error-card">
          <AlertCircle className="coordinatorsub-error-icon" />
          <h2 className="coordinatorsub-error-title">Missing Coordinator Information</h2>
          <p className="coordinatorsub-error-message">
            Coordinator year or college information is missing from your session.
            Please log in again to access the submission dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading && filters.hackathon && submissions.length === 0) {
    return (
      <div className="coordinatorsub-loading">
        <div className="coordinatorsub-loading-spinner" />
        <span className="coordinatorsub-loading-text">Loading submissions...</span>
      </div>
    );
  }

  return (
    <div className="coordinatorsub-container">
      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="coordinatorsub-modal-overlay">
          <div className="coordinatorsub-modal">
            <div className="coordinatorsub-modal-header">
              <AlertCircle className="coordinatorsub-modal-icon" />
              <h3 className="coordinatorsub-modal-title">Confirm Delete</h3>
            </div>
            <p className="coordinatorsub-modal-message">
              Are you sure you want to delete this submission? This action cannot be undone.
            </p>
            <div className="coordinatorsub-modal-actions">
              <button onClick={cancelDelete} className="coordinatorsub-btn coordinatorsub-btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} className="coordinatorsub-btn coordinatorsub-btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="coordinatorsub-main">
        {/* Header */}
        <div className="coordinatorsub-header">
          <div className="coordinatorsub-header-content">
            <div className="coordinatorsub-header-left">
              <h1 className="coordinatorsub-title">Submission Management</h1>
              <p className="coordinatorsub-subtitle">View and manage hackathon submissions</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="coordinatorsub-filter-toggle"
            >
              <Filter size={20} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Coordinator Info Banner */}
          <div className="coordinatorsub-info-banner">
            <div className="coordinatorsub-info-content">
              <div className="coordinatorsub-info-icon-wrapper">
                <CheckCircle className="coordinatorsub-info-icon" />
              </div>
              <div className="coordinatorsub-info-text-wrapper">
                <p className="coordinatorsub-info-label">Viewing submissions for:</p>
                <p className="coordinatorsub-info-value">
                  {coordinatorCollege} • {coordinatorYear}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card and Branch Stats - Side by Side */}
        {filters.hackathon && hackathons.length > 0 && (
          <div className="coordinatorsub-stats-and-branches">
            {/* Selected Hackathon Card */}
            <div className="coordinatorsub-stats-container">
              <div className="coordinatorsub-stats-grid">
                <div className="coordinatorsub-stat-card">
                  <div className="coordinatorsub-stat-header">
                    <div className="coordinatorsub-stat-title-wrapper">
                      <p className="coordinatorsub-stat-label">Selected Hackathon</p>
                      <h3 className="coordinatorsub-stat-title">
                        {hackathons.find(h => h._id === filters.hackathon)?.hackathonname || 'Unknown'}
                      </h3>
                    </div>
                    <div className="coordinatorsub-stat-icon-wrapper">
                      <FileText className="coordinatorsub-stat-icon" />
                    </div>
                  </div>
                  <div className="coordinatorsub-stat-value">{filteredSubmissions.length}</div>
                  <p className="coordinatorsub-stat-description">
                    submissions for {coordinatorCollege} - {coordinatorYear}
                  </p>
                  {branchStats && branchStats.branchStats && (
                    <div className="coordinatorsub-stat-meta">
                      <span className="coordinatorsub-stat-meta-item">
                        <Users className="coordinatorsub-card-meta-icon" />
                        {branchStats.branchStats.length} branches
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Branch Statistics - Beside Selected Hackathon */}
            {branchStats && branchStats.branchStats && branchStats.branchStats.length > 0 && (
              <div className="coordinatorsub-branch-stats">
                <h3 className="coordinatorsub-branch-stats-title">Submissions by Branch</h3>
                <div className="coordinatorsub-branch-stats-grid">
                  {branchStats.branchStats.map((stat, idx) => (
                    <div key={idx} className="coordinatorsub-branch-stat-item">
                      <div className="coordinatorsub-branch-name">{stat.branch}</div>
                      <div className="coordinatorsub-branch-count">{stat.submissionCount}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters Section */}
        {showFilters && (
          <div className="coordinatorsub-filters">
            <div className="coordinatorsub-filters-grid">
              <div className="coordinatorsub-filter-group">
                <label className="coordinatorsub-filter-label coordinatorsub-filter-required">
                  Hackathon
                </label>
                <select
                  value={filters.hackathon}
                  onChange={(e) => setFilters({...filters, hackathon: e.target.value, branch: '', search: ''})}
                  className="coordinatorsub-select"
                >
                  <option value="">Select Hackathon</option>
                  {hackathons.map(h => (
                    <option key={h._id} value={h._id}>{h.hackathonname}</option>
                  ))}
                </select>
              </div>

              <div className="coordinatorsub-filter-group">
                <label className="coordinatorsub-filter-label">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters({...filters, branch: e.target.value})}
                  disabled={!filters.hackathon}
                  className="coordinatorsub-select"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div className="coordinatorsub-filter-group">
                <label className="coordinatorsub-filter-label">Search</label>
                <div className="coordinatorsub-search-wrapper">
                  <Search className="coordinatorsub-search-icon" />
                  <input
                    type="text"
                    placeholder="Search teams, projects, students..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    disabled={!filters.hackathon}
                    className="coordinatorsub-search-input"
                  />
                </div>
              </div>

              <div className="coordinatorsub-filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={clearFilters} className="coordinatorsub-clear-btn">
                  <X size={16} />
                  Clear All
                </button>
              </div>
            </div>

            {/* Active Filter Tags */}
            {(filters.hackathon || filters.branch || filters.search) && (
              <div className="coordinatorsub-filter-tags">
                {filters.hackathon && (
                  <span className="coordinatorsub-filter-tag coordinatorsub-filter-tag-blue">
                    {hackathons.find(h => h._id === filters.hackathon)?.hackathonname || 'Hackathon'}
                    <X
                      size={14}
                      onClick={() => setFilters({...filters, hackathon: '', branch: '', search: ''})}
                      className="coordinatorsub-filter-tag-close"
                    />
                  </span>
                )}
                {filters.branch && (
                  <span className="coordinatorsub-filter-tag coordinatorsub-filter-tag-green">
                    Branch: {filters.branch}
                    <X
                      size={14}
                      onClick={() => setFilters({...filters, branch: ''})}
                      className="coordinatorsub-filter-tag-close"
                    />
                  </span>
                )}
                {filters.search && (
                  <span className="coordinatorsub-filter-tag coordinatorsub-filter-tag-purple">
                    Search: "{filters.search}"
                    <X
                      size={14}
                      onClick={() => setFilters({...filters, search: ''})}
                      className="coordinatorsub-filter-tag-close"
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="coordinatorsub-content">
          {error && (
            <div className="coordinatorsub-alert">
              <AlertCircle className="coordinatorsub-alert-icon" />
              <span className="coordinatorsub-alert-text">{error}</span>
              <X
                size={16}
                onClick={() => setError(null)}
                className="coordinatorsub-alert-close"
              />
            </div>
          )}

          {/* Submissions List */}
          <div className="coordinatorsub-list">
            <div className="coordinatorsub-list-header">
              {filters.hackathon && branches.length > 0 && (
                <div className="coordinatorsub-list-meta">
                  <Users size={16} />
                  {branches.length} branch{branches.length !== 1 ? 'es' : ''} found
                </div>
              )}
            </div>

            <div className="coordinatorsub-list-content">
              {!filters.hackathon ? (
                <div className="coordinatorsub-empty">
                  <FileText className="coordinatorsub-empty-icon" />
                  <h3 className="coordinatorsub-empty-title">Select a Hackathon</h3>
                  <p className="coordinatorsub-empty-text">
                    Please select a hackathon from the filters above to view submissions
                  </p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="coordinatorsub-empty">
                  <FileText className="coordinatorsub-empty-icon" />
                  <h3 className="coordinatorsub-empty-title">No submissions found</h3>
                  <p className="coordinatorsub-empty-text">
                    {filters.branch || filters.search ? 'Try adjusting your filters' : 'No submissions yet for this hackathon'}
                  </p>
                </div>
              ) : (
                <div className="coordinatorsub-cards">
                  {filteredSubmissions.map((submission) => (
                    <div
                      key={submission._id}
                      className="coordinatorsub-card"
                      onClick={() => viewSubmission(submission._id)}
                    >
                      <div className="coordinatorsub-card-header">
                        <div className="coordinatorsub-card-title-section">
                          <h3 className="coordinatorsub-card-title">
                            {submission.team?.name || 'Unknown Team'}
                          </h3>
                          <p className="coordinatorsub-card-subtitle">
                            {submission.problemSub?.title || 'Problem Statement'}
                          </p>
                        </div>
                        <div className="coordinatorsub-card-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              viewSubmission(submission._id);
                            }}
                            className="coordinatorsub-icon-btn coordinatorsub-icon-btn-blue"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(submission._id);
                            }}
                            className="coordinatorsub-icon-btn coordinatorsub-icon-btn-red"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="coordinatorsub-card-meta">
                        <span className="coordinatorsub-card-meta-item">
                          <Calendar className="coordinatorsub-card-meta-icon" />
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                        <span className="coordinatorsub-card-meta-item">
                          <Users className="coordinatorsub-card-meta-icon" />
                          {(submission.teamMembers?.length || 0) + 1} members
                        </span>
                        {submission.teamLead?.student?.branch && (
                          <span className="coordinatorsub-card-branch">
                            {submission.teamLead.student.branch}
                          </span>
                        )}
                      </div>

                      <p className="coordinatorsub-card-description">
                        {submission.projectDescription}
                      </p>

                      <div className="coordinatorsub-card-links">
                        {submission.githubRepo && (
                          <a
                            href={submission.githubRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="coordinatorsub-card-link"
                          >
                            <Github className="coordinatorsub-card-link-icon" />
                            GitHub Repo
                          </a>
                        )}
                        {submission.liveDemoLink && (
                          <a
                            href={submission.liveDemoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="coordinatorsub-card-link"
                          >
                            <ExternalLink className="coordinatorsub-card-link-icon" />
                            Live Demo
                          </a>
                        )}
                        {submission.documents && submission.documents.length > 0 && (
                          <span className="coordinatorsub-card-docs">
                            <FileText className="coordinatorsub-card-docs-icon" />
                            {submission.documents.length} document{submission.documents.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="coordinatorsub-details">
            {selectedSubmission ? (
              <>
                <div className="coordinatorsub-details-header">
                  <h2 className="coordinatorsub-details-title">Submission Details</h2>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="coordinatorsub-details-close"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="coordinatorsub-details-section">
                  <h3 className="coordinatorsub-details-section-title">Team</h3>
                  <p className="coordinatorsub-details-value">{selectedSubmission.team?.name}</p>
                </div>

                <div className="coordinatorsub-details-section">
                  <h3 className="coordinatorsub-details-section-title">Team Lead</h3>
                  <div className="coordinatorsub-details-member">
                    <p className="coordinatorsub-details-member-name">
                      {selectedSubmission.teamLead?.student?.name}
                    </p>
                    <p className="coordinatorsub-details-member-email">
                      {selectedSubmission.teamLead?.student?.email}
                    </p>
                    <p className="coordinatorsub-details-member-info">
                      Roll No: {selectedSubmission.teamLead?.student?.rollNo} | {selectedSubmission.teamLead?.student?.branch}
                    </p>
                    {selectedSubmission.teamLead?.contribution && (
                      <p className="coordinatorsub-details-member-contribution">
                        Contribution: {selectedSubmission.teamLead.contribution}
                      </p>
                    )}
                  </div>
                </div>

                <div className="coordinatorsub-details-section">
                  <h3 className="coordinatorsub-details-section-title">Problem Statement</h3>
                  <p className="coordinatorsub-details-value">{selectedSubmission.problemSub?.title}</p>
                  {selectedSubmission.problemSub?.description && (
                    <p className="coordinatorsub-details-text">{selectedSubmission.problemSub.description}</p>
                  )}
                </div>

                <div className="coordinatorsub-details-section">
                  <h3 className="coordinatorsub-details-section-title">Project Description</h3>
                  <p className="coordinatorsub-details-text">{selectedSubmission.projectDescription}</p>
                </div>

                {selectedSubmission.problemSub?.technologies?.length > 0 && (
                  <div className="coordinatorsub-details-section">
                    <h3 className="coordinatorsub-details-section-title">Technologies</h3>
                    <div className="coordinatorsub-tech-tags">
                      {selectedSubmission.problemSub.technologies.map((tech, idx) => (
                        <span key={idx} className="coordinatorsub-tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSubmission.teamMembers?.length > 0 && (
                  <div className="coordinatorsub-details-section">
                    <h3 className="coordinatorsub-details-section-title">Team Members</h3>
                    <ul className="coordinatorsub-details-list">
                      {selectedSubmission.teamMembers.map((member, idx) => (
                        <li key={idx} className="coordinatorsub-details-member">
                          <p className="coordinatorsub-details-member-name">{member.student?.name}</p>
                          <p className="coordinatorsub-details-member-email">{member.student?.email}</p>
                          <p className="coordinatorsub-details-member-info">
                            Roll No: {member.student?.rollNo} | {member.student?.branch}
                          </p>
                          {member.contribution && (
                            <p className="coordinatorsub-details-member-contribution">
                              Contribution: {member.contribution}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(selectedSubmission.githubRepo || selectedSubmission.liveDemoLink) && (
                  <div className="coordinatorsub-details-section">
                    <h3 className="coordinatorsub-details-section-title">Links</h3>
                    {selectedSubmission.githubRepo && (
                      <a
                        href={selectedSubmission.githubRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="coordinatorsub-details-link"
                      >
                        <Github className="coordinatorsub-details-link-icon" />
                        {selectedSubmission.githubRepo}
                      </a>
                    )}
                    {selectedSubmission.liveDemoLink && (
                      <a
                        href={selectedSubmission.liveDemoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="coordinatorsub-details-link"
                      >
                        <ExternalLink className="coordinatorsub-details-link-icon" />
                        {selectedSubmission.liveDemoLink}
                      </a>
                    )}
                  </div>
                )}

                {selectedSubmission.documents?.length > 0 && (
                  <div className="coordinatorsub-details-section">
                    <h3 className="coordinatorsub-details-section-title">
                      Documents ({selectedSubmission.documents.length})
                    </h3>
                    <div className="coordinatorsub-details-docs">
                      {selectedSubmission.documents.map((doc, idx) => (
                        <button
                          key={idx}
                          onClick={() => downloadDocument(selectedSubmission._id, idx, doc.filename)}
                          className="coordinatorsub-doc-btn"
                        >
                          <Download className="coordinatorsub-doc-icon" />
                          <div className="coordinatorsub-doc-info">
                            <div className="coordinatorsub-doc-name">{doc.filename}</div>
                            <div className="coordinatorsub-doc-type">{doc.fileType}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteClick(selectedSubmission._id)}
                  className="coordinatorsub-delete-btn"
                >
                  <Trash2 size={18} />
                  Delete Submission
                </button>
              </>
            ) : (
              <div className="coordinatorsub-details-empty">
                <p>Select a submission to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorSubmissionDashboard;