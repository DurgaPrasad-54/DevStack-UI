import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye, Filter, Search, FileText, Folder, Video, Link, AlertCircle, RefreshCw, X, ExternalLink } from 'lucide-react';

// Import the custom CSS - you'll need to include this in your project
import './approvalmentorresources.css';
import config from '../../config'; // Adjust the path as necessary

const AdminApprovalDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]); // Store all requests for stats calculation
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', status: 'pending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  console.log(stats)

  // API Base URL - replace with your actual API endpoint
  const API_BASE = `${config.backendUrl}/admin-approvals`; // Update this to your backend URL

  // Determine request type based on available fields
  const determineRequestType = (request) => {
    if (request.requestType) return request.requestType;
    
    if (request.hyperlink !== undefined) return 'item';
    if (request.folderTitle !== undefined && request.folderThumbnail !== undefined) return 'videoFolder';
    if (request.folderTitle !== undefined) return 'folder';
    if (request.link !== undefined) return 'video';
    if (request.pdf !== undefined) return 'pdf';
    
    return 'unknown';
  };

  // Fetch requests from API
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      // Always fetch all requests for stats calculation
      const allResponse = await fetch(`${API_BASE}/all`);
      if (!allResponse.ok) {
        const errorText = await allResponse.text();
        throw new Error(`HTTP error! status: ${allResponse.status}, message: ${errorText}`);
      }
      const allData = await allResponse.json();
      const allRequestsWithType = Array.isArray(allData) ? allData.map(request => {
        const requestType = determineRequestType(request);
        return { ...request, requestType };
      }) : [];
      
      setAllRequests(allRequestsWithType);
      calculateStats(allRequestsWithType);

      // Now fetch filtered requests for display
      const params = new URLSearchParams();
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.status !== 'all') params.append('status', filter.status);

      const endpoint = filter.status === 'pending' ? `${API_BASE}/pending` : `${API_BASE}/all`;
      const url = `${endpoint}${params.toString() ? `?${params}` : ''}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      const requestsWithType = Array.isArray(data) ? data.map(request => {
        const requestType = determineRequestType(request);
        return { ...request, requestType };
      }) : [];
      
      console.log('Fetched requests:', requestsWithType);
      setRequests(requestsWithType);
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(`Failed to fetch requests: ${error.message}`);
      setRequests([]);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics based on ALL data (not filtered)
  const calculateStats = (allRequestsData) => {
    const newStats = allRequestsData.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0, total: 0 });
    setStats(newStats);
  };

  // Handle stat card clicks to filter data
  const handleStatCardClick = (status) => {
    setFilter(prevFilter => ({ 
      ...prevFilter, 
      status: status === 'total' ? 'all' : status 
    }));
  };

  // Handle approve/reject actions
  const handleAction = async (request, action) => {
    try {
      setProcessing(true);
      setError('');
      
      if (action === 'reject' && !rejectionReason.trim()) {
        setError('Rejection reason is required');
        return;
      }
      
      const requestType = determineRequestType(request);
      if (!requestType || requestType === 'unknown') {
        setError('Cannot determine request type');
        return;
      }
      
      const endpoint = `${API_BASE}/${action}/${requestType}/${request._id}`;
      const body = {
        ...(actionNotes.trim() && { adminNotes: actionNotes.trim() }),
        ...(action === 'reject' && rejectionReason.trim() && { rejectionReason: rejectionReason.trim() })
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      await fetchRequests();
      setShowModal(false);
      setActionNotes('');
      setRejectionReason('');
      setSelectedRequest(null);
      setActionType('');
      setError('');
      alert(`Request ${action}ed successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setError(`Failed to ${action} request: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Get request details
  const getRequestDetails = async (request) => {
    try {
      setError('');
      const requestType = determineRequestType(request);
      if (!requestType || requestType === 'unknown') {
        setError('Cannot determine request type');
        return;
      }
      
      const response = await fetch(`${API_BASE}/${requestType}/${request._id}`);
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || 'Failed to fetch request details');
      }
      
      const details = await response.json();
      setSelectedRequest({ ...details, requestType });
      setActionType('');
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      setError(`Failed to fetch request details: ${error.message}`);
    }
  };

  // Filter requests based on search term
  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    const title = request.title || request.folderTitle || '';
    const mentorName = request.mentorId?.name || '';
    const mentorEmail = request.mentorId?.email || '';
    
    return (
      title.toLowerCase().includes(searchLower) ||
      mentorName.toLowerCase().includes(searchLower) ||
      mentorEmail.toLowerCase().includes(searchLower) ||
      request.requestType.toLowerCase().includes(searchLower)
    );
  });

  // Get icon for request type
  const getRequestIcon = (type) => {
    const icons = {
      item: <Link className="mentorresources-icon-sm" />,
      folder: <Folder className="mentorresources-icon-sm" />,
      pdf: <FileText className="mentorresources-icon-sm" />,
      video: <Video className="mentorresources-icon-sm" />,
      videoFolder: <Video className="mentorresources-icon-sm" />,
      unknown: <AlertCircle className="mentorresources-icon-sm" />
    };
    return icons[type] || <FileText className="mentorresources-icon-sm" />;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      pending: { 
        className: 'mentorresources-status-badge mentorresources-status-pending', 
        icon: <Clock className="mentorresources-status-icon" /> 
      },
      approved: { 
        className: 'mentorresources-status-badge mentorresources-status-approved', 
        icon: <CheckCircle className="mentorresources-status-icon" /> 
      },
      rejected: { 
        className: 'mentorresources-status-badge mentorresources-status-rejected', 
        icon: <XCircle className="mentorresources-status-icon" /> 
      }
    };
    
    const { className, icon } = config[status] || config.pending;
    return (
      <span className={className}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get display title for request
  const getDisplayTitle = (request) => {
    return request.title || request.folderTitle || 'Untitled';
  };

  // Helper functions for file URLs
  const getBackendUrl = () => {
    return config.backendUrl || 'http://localhost:5000';
  };

  const getPDFDownloadUrl = (requestId, view = false) =>
    `${getBackendUrl()}/mentorresources/download/pdf/${requestId}${view ? '?view=1' : ''}`;

  const getVideoStreamUrl = (requestId) =>
    `${getBackendUrl()}/mentorresources/stream/video/${requestId}`;

  // Render request details modal content
  const renderRequestDetails = () => {
    if (!selectedRequest) return null;

    const { requestType } = selectedRequest;

    return (
      <div className="mentorresources-details-section">
        <div className="mentorresources-details-header">
          {getRequestIcon(requestType)}
          <h3 className="mentorresources-details-title">
            {requestType === 'videoFolder' ? 'Video Folder Request' : 
             requestType.charAt(0).toUpperCase() + requestType.slice(1) + ' Request'}
          </h3>
          {getStatusBadge(selectedRequest.status)}
        </div>

        <div className="mentorresources-details-grid">
          <div className="mentorresources-field-group">
            <label className="mentorresources-field-label">Title</label>
            <p className="mentorresources-field-value">{getDisplayTitle(selectedRequest)}</p>
          </div>
          
          <div className="mentorresources-field-group">
            <label className="mentorresources-field-label">Request Date</label>
            <p className="mentorresources-field-value">{formatDate(selectedRequest.requestDate)}</p>
          </div>

          <div className="mentorresources-field-group">
            <label className="mentorresources-field-label">Mentor Name</label>
            <p className="mentorresources-field-value">{selectedRequest.mentorId?.name || 'Unknown'}</p>
          </div>

          <div className="mentorresources-field-group">
            <label className="mentorresources-field-label">Mentor Email</label>
            <p className="mentorresources-field-value">{selectedRequest.mentorId?.email || 'No email'}</p>
          </div>
        </div>

        {/* Request-specific fields */}
        {requestType === 'item' && (
          <div className="mentorresources-details-section">
            <div className="mentorresources-field-group">
              <label className="mentorresources-field-label">Hyperlink</label>
              <a
                className="mentorresources-field-link"
                href={selectedRequest.hyperlink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedRequest.hyperlink} <ExternalLink className="mentorresources-field-link-icon" />
              </a>
            </div>
          </div>
        )}

        {requestType === 'folder' && (
          <div className="mentorresources-details-section">
            <div className="mentorresources-field-group">
              <label className="mentorresources-field-label">Folder Path</label>
              <p className="mentorresources-field-value">{selectedRequest.folderPath || 'N/A'}</p>
            </div>
          </div>
        )}

        {requestType === 'video' && (
          <div className="mentorresources-details-section">
            <div className="mentorresources-field-group">
              <label className="mentorresources-field-label">Video</label>
              {selectedRequest.sourceType === 'upload' && selectedRequest._id ? (
                <a
                  className="mentorresources-field-link"
                  href={getVideoStreamUrl(selectedRequest._id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Video <ExternalLink className="mentorresources-field-link-icon" />
                </a>
              ) : selectedRequest.link ? (
                <a
                  className="mentorresources-field-link"
                  href={selectedRequest.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {selectedRequest.link} <ExternalLink className="mentorresources-field-link-icon" />
                </a>
              ) : (
                <span className="mentorresources-field-value">No video file or link</span>
              )}
            </div>
          </div>
        )}

        {requestType === 'pdf' && (
          <div className="mentorresources-details-section">
            <div className="mentorresources-field-group">
              <label className="mentorresources-field-label">PDF File</label>
              {selectedRequest._id ? (
                <div>
                  <a
                    className="mentorresources-field-link"
                    href={getPDFDownloadUrl(selectedRequest._id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF <ExternalLink className="mentorresources-field-link-icon" />
                  </a>
                  <div style={{ marginTop: 12 }}>
                    <iframe
                      src={getPDFDownloadUrl(selectedRequest._id, true)}
                      title="Uploaded PDF"
                      width="100%"
                      height="500px"
                      style={{ border: '1px solid #ddd', borderRadius: 8 }}
                    />
                  </div>
                </div>
              ) : (
                <span className="mentorresources-field-value">No PDF file</span>
              )}
            </div>
          </div>
        )}

        {requestType === 'videoFolder' && (
          <div className="mentorresources-details-section">
            <div className="mentorresources-field-group">
              <label className="mentorresources-field-label">Folder Title</label>
              <p className="mentorresources-field-value">{selectedRequest.folderTitle}</p>
            </div>
            <div className="mentorresources-field-group">
              <label className="mentorresources-field-label">Folder Thumbnail</label>
              {selectedRequest.folderThumbnail ? (
                <img
                  src={selectedRequest.folderThumbnail}
                  alt="Folder Thumbnail"
                  style={{ maxWidth: '120px', borderRadius: '8px' }}
                />
              ) : (
                <span className="mentorresources-field-value">No thumbnail</span>
              )}
            </div>
          </div>
        )}

        {/* Admin notes and rejection reason */}
        {selectedRequest.adminNotes && (
          <div className="mentorresources-details-section">
            <label className="mentorresources-field-label">Admin Notes</label>
            <p className="mentorresources-admin-notes">{selectedRequest.adminNotes}</p>
          </div>
        )}
        {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
          <div className="mentorresources-details-section">
            <label className="mentorresources-rejection-label">Rejection Reason</label>
            <p className="mentorresources-rejection-reason">{selectedRequest.rejectionReason}</p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [filter.type, filter.status]);

  return (
    <div className="mentorresources-dashboard">
      <div className="mentorresources-container">
        {/* Header */}
        <div className="mentorresources-header">
          <div className="mentorresources-header-content">
            <h1 className="mentorresources-title">Mentor Resource Approval Dashboard</h1>
          </div>
        </div>

        {/* Stats - Now clickable */}
        <div className="mentorresources-stats-grid">
          <div 
            className={`mentorresources-stat-card ${filter.status === 'all' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('total')}
            style={{ cursor: 'pointer' }}
          >
            <div className="mentorresources-stat-content">
              <span className="mentorresources-stat-label">Total</span>
              <span className="mentorresources-stat-icon mentorresources-stat-icon-blue"><FileText /></span>
            </div>
            <div className="mentorresources-stat-value mentorresources-stat-value-blue">{stats.total}</div>
          </div>
          <div 
            className={`mentorresources-stat-card ${filter.status === 'pending' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('pending')}
            style={{ cursor: 'pointer' }}
          >
            <div className="mentorresources-stat-content">
              <span className="mentorresources-stat-label">Pending</span>
              <span className="mentorresources-stat-icon mentorresources-stat-icon-yellow"><Clock /></span>
            </div>
            <div className="mentorresources-stat-value mentorresources-stat-value-yellow">{stats.pending}</div>
          </div>
          <div 
            className={`mentorresources-stat-card ${filter.status === 'approved' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('approved')}
            style={{ cursor: 'pointer' }}
          >
            <div className="mentorresources-stat-content">
              <span className="mentorresources-stat-label">Approved</span>
              <span className="mentorresources-stat-icon mentorresources-stat-icon-green"><CheckCircle /></span>
            </div>
            <div className="mentorresources-stat-value mentorresources-stat-value-green">{stats.approved}</div>
          </div>
          <div 
            className={`mentorresources-stat-card ${filter.status === 'rejected' ? 'active' : ''}`}
            onClick={() => handleStatCardClick('rejected')}
            style={{ cursor: 'pointer' }}
          >
            <div className="mentorresources-stat-content">
              <span className="mentorresources-stat-label">Rejected</span>
              <span className="mentorresources-stat-icon mentorresources-stat-icon-red"><XCircle /></span>
            </div>
            <div className="mentorresources-stat-value mentorresources-stat-value-red">{stats.rejected}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mentorresources-filters">
          <div className="mentorresources-filters-content">
            <div className="mentorresources-filter-group">
              <Filter />
              <select
                className="mentorresources-select"
                value={filter.type}
                onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
              >
                <option value="all">All Types</option>
                <option value="item">Items</option>
                <option value="folder">Folders</option>
                <option value="video">Videos</option>
                <option value="pdf">PDFs</option>
                <option value="videoFolder">Video Folders</option>
              </select>
            </div>

            <div className="mentorresources-filter-group">
              <Search />
              <input
                type="text"
                className="mentorresources-input"
                placeholder="Search by title, mentor name, or email"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mentorresources-filter-group">
              <Filter />
              <select
                className="mentorresources-select"
                value={filter.status}
                onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              >
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Statuses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="mentorresources-table-container">
          {loading ? (
            <div className="mentorresources-loading">
              <RefreshCw className="mentorresources-loading-icon" />
              Loading requests...
            </div>
          ) : error ? (
            <div className="mentorresources-error">{error}</div>
          ) : (
            <table className="mentorresources-table">
              <thead>
                <tr>
                  <th className="mentorresources-table-header">Request Type</th>
                  <th className="mentorresources-table-header">Title</th>
                  <th className="mentorresources-table-header">Mentor</th>
                  <th className="mentorresources-table-header">Request Date</th>
                  <th className="mentorresources-table-header">Status</th>
                  <th className="mentorresources-table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="mentorresources-table-empty">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(request => (
                    <tr key={request._id} className="mentorresources-table-row">
                      <td className="mentorresources-table-cell">
                        {getRequestIcon(request.requestType)}
                        <span className="mentorresources-request-type">{request.requestType}</span>
                      </td>
                      <td className="mentorresources-table-cell">
                        {getDisplayTitle(request)}
                      </td>
                      <td className="mentorresources-table-cell">
                        {request.mentorId?.name || 'Unknown'}
                        <br />
                        <span className="mentorresources-mentor-email">{request.mentorId?.email || 'No email'}</span>
                      </td>
                      <td className="mentorresources-table-cell">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="mentorresources-table-cell">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="mentorresources-table-cell mentorresources-table-actions">
                        <button
                          className="mentorresources-button mentorresources-button-view"
                          onClick={() => getRequestDetails(request)}
                        >
                          <Eye className="mentorresources-button-icon" />
                          View Details
                        </button>
                        {request.status === 'pending' && (
                          <div className="mentorresources-actions-group">
                            <button
                              className="mentorresources-button mentorresources-button-approve"
                              onClick={() => handleAction(request, 'approve')}
                              disabled={processing}
                            >
                              {processing ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              className="mentorresources-button mentorresources-button-reject"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType('reject');
                                setShowModal(true);
                              }}
                              disabled={processing}
                            >
                              {processing ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Request Details Modal */}
        {showModal && (
          <div className="mentorresources-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="mentorresources-modal" onClick={e => e.stopPropagation()}>
              <div className="mentorresources-modal-header">
                <h2 className="mentorresources-modal-title">
                  {actionType === 'reject' ? 'Reject Request' : 'Request Details'}
                </h2>
                <button className="mentorresources-modal-close" onClick={() => setShowModal(false)}>
                  <X className="mentorresources-modal-close-icon" />
                </button>
              </div>

              <div className="mentorresources-modal-content">
                {actionType === 'reject' ? (
                  <div className="mentorresources-reject-form">
                    <label className="mentorresources-form-label">Rejection Reason</label>
                    <textarea
                      className="mentorresources-textarea"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection"
                    />
                    <div className="mentorresources-form-actions">
                      <button
                        className="mentorresources-button mentorresources-button-cancel"
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="mentorresources-button mentorresources-button-reject"
                        onClick={() => handleAction(selectedRequest, 'reject')}
                        disabled={processing}
                      >
                        {processing ? 'Rejecting...' : 'Reject Request'}
                      </button>
                    </div>
                  </div>
                ) : (
                  renderRequestDetails()
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalDashboard;