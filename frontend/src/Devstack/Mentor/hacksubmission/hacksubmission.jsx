import { useState, useEffect } from 'react';

import { Download, Eye, Filter, Calendar, Users, FileText, Github, ExternalLink, AlertCircle, X, Lock } from 'lucide-react';
import config from '../../../config';
import './hacksubmission.css';

const MentorSubmissionDashboard = () => {
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
  const [mentorId, setMentorId] = useState(localStorage.getItem("mentor"));

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
    } else {
      setSubmissions([]);
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
      
      let response;
      if (mentorId && mentorId.match(/^[0-9a-fA-F]{24}$/)) {
        response = await fetch(`${API_BASE}/mentor/${mentorId}/hackathon/${filters.hackathon}`);
      } else {
        const params = new URLSearchParams();
        params.append('hackathon', filters.hackathon);
        response = await fetch(`${API_BASE}?${params}`);
      }

      console.log('Submission response status:', response.status);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      
      const data = await response.json();
      console.log('Submissions data:', data);
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
      const response = await fetch(HACKATHON_API);
      console.log('Hackathon response status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch hackathons');
        setError('Failed to load hackathons. Please check your API connection.');
        return;
      }
      
      const data = await response.json();
      console.log('Hackathons data:', data);
      setHackathons(data.hackathons || data || []);
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

  const clearFilters = () => {
    setFilters({ hackathon: '', branch: '', search: '' });
    setSubmissions([]);
  };

  const branches = [...new Set(
    submissions.flatMap(sub => [
      sub.teamLead?.student?.branch,
      ...(sub.teamMembers?.map(m => m.student?.branch) || [])
    ].filter(Boolean))
  )].sort();

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

  if (loading && filters.hackathon && submissions.length === 0) {
    return (
      <div className="mentordash-loading">
        <div className="mentordash-loading-spinner">
          <Filter className="mentordash-loading-icon" />
          Loading submissions...
        </div>
      </div>
    );
  }

  return (
    <div className="mentordash-container">
      {/* Header */}
      <div className="mentordash-header">
        <div className="mentordash-header-content">
          <div className="mentordash-header-text">
            <h1>Team Submissions</h1>
            <p>View submissions from your assigned teams</p>
          </div>
          <div className="mentordash-header-actions">
            <div className="mentordash-view-badge">
              <Lock size={16} />
              View Only
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mentordash-filter-toggle"
            >
              <Filter size={20} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <div className="mentordash-stats">
          {stats.slice(0, 3).map((stat, idx) => (
            <div key={idx} className="mentordash-stat-card">
              <p className="mentordash-stat-title">{stat.hackathonName}</p>
              <p className="mentordash-stat-value">{stat.totalSubmissions}</p>
              <p className="mentordash-stat-subtitle">total submissions</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div className="mentordash-filters">
          <div className="mentordash-filters-grid">
            <div className="mentordash-filter-group">
              <label className="mentordash-filter-label">
                Hackathon <span className="mentordash-filter-required">*</span>
              </label>
              <select
                value={filters.hackathon}
                onChange={(e) => setFilters({...filters, hackathon: e.target.value, branch: '', search: ''})}
                className="mentordash-filter-input"
              >
                <option value="">Select Hackathon</option>
                {hackathons.map(h => (
                  <option key={h._id} value={h._id}>{h.hackathonname}</option>
                ))}
              </select>
            </div>

            <div className="mentordash-filter-group">
              <label className="mentordash-filter-label">Branch</label>
              <select
                value={filters.branch}
                onChange={(e) => setFilters({...filters, branch: e.target.value})}
                disabled={!filters.hackathon}
                className="mentordash-filter-input"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <div className="mentordash-filter-group">
              <label className="mentordash-filter-label">Search</label>
              <div className="mentordash-search-wrapper">
  
                <input
                  type="text"
                  placeholder="Search by team, student, or problem..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  disabled={!filters.hackathon}
                  className="mentordash-search-input"
                />
              </div>
            </div>
          </div>

          <button onClick={clearFilters} className="mentordash-clear-btn">
            <X size={16} />
            Clear All
          </button>

          {/* Active Filter Tags */}
          {(filters.hackathon || filters.branch || filters.search) && (
            <div className="mentordash-filter-tags">
              {filters.hackathon && (
                <span className="mentordash-filter-tag mentordash-filter-tag-hackathon">
                  {hackathons.find(h => h._id === filters.hackathon)?.hackathonname || 'Hackathon'}
                </span>
              )}
              {filters.branch && (
                <span className="mentordash-filter-tag mentordash-filter-tag-branch">
                  Branch: {filters.branch}
                  <X
                    size={14}
                    onClick={() => setFilters({...filters, branch: ''})}
                    className="mentordash-filter-tag-close"
                  />
                </span>
              )}
              {filters.search && (
                <span className="mentordash-filter-tag mentordash-filter-tag-search">
                  Search: "{filters.search}"
                  <X
                    size={14}
                    onClick={() => setFilters({...filters, search: ''})}
                    className="mentordash-filter-tag-close"
                  />
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="mentordash-main">
        {error && (
          <div className="mentordash-error">
            <AlertCircle size={20} className="mentordash-error-icon" />
            <p className="mentordash-error-text">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mentordash-error-close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Submissions List */}
        <div className="mentordash-submissions">
          <div className="mentordash-submissions-header">
            <h2 className="mentordash-submissions-title">
              Submissions ({filteredSubmissions.length})
            </h2>
            {filters.hackathon && branches.length > 0 && (
              <div className="mentordash-branch-badge">
                <Users size={16} />
                {branches.length} branch{branches.length !== 1 ? 'es' : ''} found
              </div>
            )}
          </div>

          {!filters.hackathon ? (
            <div className="mentordash-empty">
              <Filter size={64} className="mentordash-empty-icon" />
              <h3 className="mentordash-empty-title">Select a Hackathon</h3>
              <p className="mentordash-empty-subtitle">
                Please select a hackathon from the filters above to view submissions
              </p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="mentordash-empty">
              <FileText size={64} className="mentordash-empty-icon" />
              <h3 className="mentordash-empty-title">No submissions found</h3>
              <p className="mentordash-empty-subtitle">
                {filters.branch || filters.search
                  ? 'Try adjusting your filters'
                  : 'No submissions yet for your assigned teams'}
              </p>
            </div>
          ) : (
            <div className="mentordash-submission-list">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission._id}
                  className="mentordash-submission-card"
                  onClick={() => viewSubmission(submission._id)}
                >
                  <div className="mentordash-submission-header">
                    <div className="mentordash-submission-info">
                      <h3 className="mentordash-submission-team">
                        {submission.team?.name || 'Unknown Team'}
                      </h3>
                      <p className="mentordash-submission-problem">
                        {submission.problemSub?.title || 'Problem Statement'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewSubmission(submission._id);
                      }}
                      className="mentordash-view-btn"
                      title="View Details"
                    >
                      <Eye size={20} />
                    </button>
                  </div>

                  <div className="mentordash-submission-meta">
                    <span className="mentordash-meta-item">
                      <Calendar size={14} />
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="mentordash-meta-item">
                      <Users size={14} />
                      {(submission.teamMembers?.length || 0) + 1} members
                    </span>
                    {submission.teamLead?.student?.branch && (
                      <span className="mentordash-branch-tag">
                        {submission.teamLead.student.branch}
                      </span>
                    )}
                  </div>

                  <p className="mentordash-submission-desc">
                    {submission.projectDescription}
                  </p>

                  <div className="mentordash-submission-links">
                    {submission.githubRepo && (
                      <a
                        href={submission.githubRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mentordash-link"
                      >
                        <Github size={14} />
                        GitHub Repo
                      </a>
                    )}
                    {submission.liveDemoLink && (
                      <a
                        href={submission.liveDemoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mentordash-link"
                      >
                        <ExternalLink size={14} />
                        Live Demo
                      </a>
                    )}
                    {submission.documents && submission.documents.length > 0 && (
                      <span className="mentordash-doc-badge">
                        <FileText size={14} />
                        {submission.documents.length} document{submission.documents.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div className="mentordash-details">
          {selectedSubmission ? (
            <>
              <div className="mentordash-details-header">
                <h2 className="mentordash-details-title">Submission Details</h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="mentordash-close-btn"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mentordash-details-section">
                <h3 className="mentordash-section-title">Team</h3>
                <div className="mentordash-section-content">
                  <p className="mentordash-section-name">{selectedSubmission.team?.name}</p>
                </div>
              </div>

              <div className="mentordash-details-section">
                <h3 className="mentordash-section-title">Team Lead</h3>
                <div className="mentordash-section-content">
                  <p className="mentordash-section-name">{selectedSubmission.teamLead?.student?.name}</p>
                  <p className="mentordash-section-email">{selectedSubmission.teamLead?.student?.email}</p>
                  <p className="mentordash-section-info">
                    Roll No: {selectedSubmission.teamLead?.student?.rollNo} | {selectedSubmission.teamLead?.student?.branch}
                  </p>
                  {selectedSubmission.teamLead?.contribution && (
                    <div className="mentordash-contribution">
                      <p className="mentordash-contribution-label">
                        Contribution: {selectedSubmission.teamLead.contribution}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mentordash-details-section">
                <h3 className="mentordash-section-title">Problem Statement</h3>
                <div className="mentordash-section-content">
                  <p className="mentordash-section-name">{selectedSubmission.problemSub?.title}</p>
                  {selectedSubmission.problemSub?.description && (
                    <p className="mentordash-section-text">{selectedSubmission.problemSub.description}</p>
                  )}
                </div>
              </div>

              <div className="mentordash-details-section">
                <h3 className="mentordash-section-title">Project Description</h3>
                <div className="mentordash-section-content">
                  <p className="mentordash-section-text">{selectedSubmission.projectDescription}</p>
                </div>
              </div>

              {selectedSubmission.problemSub?.technologies?.length > 0 && (
                <div className="mentordash-details-section">
                  <h3 className="mentordash-section-title">Technologies</h3>
                  <div className="mentordash-tech-list">
                    {selectedSubmission.problemSub.technologies.map((tech, idx) => (
                      <span key={idx} className="mentordash-tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.teamMembers?.length > 0 && (
                <div className="mentordash-details-section">
                  <h3 className="mentordash-section-title">Team Members</h3>
                  <div className="mentordash-members-list">
                    {selectedSubmission.teamMembers.map((member, idx) => (
                      <div key={idx} className="mentordash-member-card">
                        <p className="mentordash-member-name">{member.student?.name}</p>
                        <p className="mentordash-member-email">{member.student?.email}</p>
                        <p className="mentordash-member-info">
                          Roll No: {member.student?.rollNo} | {member.student?.branch}
                        </p>
                        {member.contribution && (
                          <div className="mentordash-contribution">
                            <p className="mentordash-contribution-label">
                              Contribution: {member.contribution}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedSubmission.githubRepo || selectedSubmission.liveDemoLink) && (
                <div className="mentordash-details-section">
                  <h3 className="mentordash-section-title">Links</h3>
                  <div className="mentordash-links-list">
                    {selectedSubmission.githubRepo && (
                      <a
                        href={selectedSubmission.githubRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mentordash-detail-link"
                      >
                        <Github size={18} />
                        {selectedSubmission.githubRepo}
                      </a>
                    )}
                    {selectedSubmission.liveDemoLink && (
                      <a
                        href={selectedSubmission.liveDemoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mentordash-detail-link"
                      >
                        <ExternalLink size={18} />
                        {selectedSubmission.liveDemoLink}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {selectedSubmission.documents?.length > 0 && (
                <div className="mentordash-details-section">
                  <h3 className="mentordash-section-title">
                    Documents ({selectedSubmission.documents.length})
                  </h3>
                  <div className="mentordash-docs-list">
                    {selectedSubmission.documents.map((doc, idx) => (
                      <button
                        key={idx}
                        onClick={() => downloadDocument(selectedSubmission._id, idx, doc.filename)}
                        className="mentordash-doc-btn"
                      >
                        <Download size={20} />
                        <div className="mentordash-doc-info">
                          <p className="mentordash-doc-name">{doc.filename}</p>
                          <p className="mentordash-doc-type">{doc.fileType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mentordash-readonly">
                <Lock size={20} className="mentordash-readonly-icon" />
                <p className="mentordash-readonly-text">
                  You have view-only access. Contact administrator to edit or delete submissions.
                </p>
              </div>
            </>
          ) : (
            <div className="mentordash-empty">
              <Eye size={64} className="mentordash-empty-icon" />
              <h3 className="mentordash-empty-title">Select a submission to view details</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorSubmissionDashboard;