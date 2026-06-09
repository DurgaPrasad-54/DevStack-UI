import React, { useState, useEffect } from 'react';
import { 
  Link as LinkIcon, 
  Folder, 
  FileText, 
  Video, 
  Upload, 
  X, 
  Download,
  Play,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

import '../mentorresouces/mentorresources.css';

const MentorResourcesDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [availableFolders, setAvailableFolders] = useState([]);
  const [availableVideoFolders, setAvailableVideoFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', status: 'all' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [requestCounts, setRequestCounts] = useState({});
  const [pdfModalUrl, setPdfModalUrl] = useState(null);

  const mentorId = localStorage.getItem('mentorId') || localStorage.getItem('mentor');
  const token = localStorage.getItem('token');
  const API_BASE = 'http://localhost:5000/mentorresources';

  const [formData, setFormData] = useState({
    requestType: 'item',
    title: '',
    description: '',
    hyperlink: '',
    folderId: '',
    folderTitle: '',
    folderThumbnail: '',
    link: '',
    type: '',
    sourceType: 'url'
  });

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchAvailableFolders = async () => {
    if (!mentorId || mentorId.length !== 24) { 
      setAvailableFolders([]); 
      return; 
    }
    try {
      const response = await fetch(`${API_BASE}/approved-folders/${mentorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableFolders(data.folders || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setAvailableFolders([]);
    }
  };

  const fetchAvailableVideoFolders = async () => {
    if (!mentorId || mentorId.length !== 24) { 
      setAvailableVideoFolders([]); 
      return; 
    }
    try {
      const response = await fetch(`${API_BASE}/approved-video-folders/${mentorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableVideoFolders(data.folders || []);
    } catch (error) {
      console.error('Error fetching video folders:', error);
      setAvailableVideoFolders([]);
    }
  };

  const fetchRequests = async () => {
    if (!mentorId || mentorId.length !== 24) { 
      setRequests([]); 
      return; 
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/my-requests/${mentorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests || []);
        setRequestCounts(data.counts || {});
      } else {
        throw new Error(data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests: ' + error.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (formData.requestType === 'pdf' && file.type !== 'application/pdf') {
        setError('Please select a PDF file only.');
        return;
      }
      if (formData.requestType === 'video' && formData.sourceType === 'upload' && !file.type.startsWith('video/')) {
        setError('Please select a video file only.');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'requestType') {
      setFormData({
        requestType: value,
        title: '',
        description: '',
        hyperlink: '',
        folderId: '',
        folderTitle: '',
        folderThumbnail: '',
        link: '',
        type: '',
        sourceType: 'url'
      });
      setSelectedFile(null);
      setError('');
    }
    if (name === 'sourceType') {
      setSelectedFile(null);
    }
  };

  const validateForm = () => {
    const { requestType } = formData;
    
    switch (requestType) {
      case 'item':
        if (!formData.title?.trim() || !formData.hyperlink?.trim() || !formData.description?.trim()) {
          setError('Title, hyperlink, and description are required for item requests.');
          return false;
        }
        break;
      case 'folder':
        if (!formData.folderTitle?.trim()) {
          setError('Folder title is required for folder requests.');
          return false;
        }
        break;
      case 'pdf':
        if (!formData.title?.trim() || !formData.folderId || !selectedFile) {
          setError('Title, folder selection, and PDF file are required for PDF requests.');
          return false;
        }
        break;
      case 'videoFolder':
        if (!formData.folderTitle?.trim() || !formData.folderThumbnail?.trim()) {
          setError('Folder title and thumbnail URL are required for video folder requests.');
          return false;
        }
        break;
      case 'video':
        if (!formData.title?.trim() || !formData.description?.trim() || !formData.type || !formData.folderId) {
          setError('Title, description, type, and folder are required for video requests.');
          return false;
        }
        if (formData.sourceType === 'url' && !formData.link?.trim()) {
          setError('Video link is required for URL-based video requests.');
          return false;
        }
        if (formData.sourceType === 'upload' && !selectedFile) {
          setError('Video file is required for upload-based video requests.');
          return false;
        }
        if (availableVideoFolders.length === 0) {
          setError('No approved video folders available. Please create a video folder first.');
          return false;
        }
        break;
      default:
        setError('Invalid request type.');
        return false;
    }
    
    return true;
  };

  const createRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    if (!mentorId || !token) {
      setError('Authentication required. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value);
        }
      });
      
      formDataToSend.append('mentorId', mentorId);
      
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      const response = await fetch(`${API_BASE}/request`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
      
      if (result.success) {
        setSuccess('Request submitted successfully!');
        setShowCreateForm(false);
        setFormData({
          requestType: 'item',
          title: '',
          description: '',
          hyperlink: '',
          folderId: '',
          folderTitle: '',
          folderThumbnail: '',
          link: '',
          type: '',
          sourceType: 'url'
        });
        setSelectedFile(null);
        await fetchRequests();
      } else {
        throw new Error(result.message || 'Request failed');
      }
      
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'An error occurred while submitting the request');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (requestId, filename) => {
    try {
      const response = await fetch(`${API_BASE}/download/pdf/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download file: ' + error.message);
    }
  };

  const getBackendUrl = () => 'http://localhost:5000';

  const getPDFDownloadUrl = (requestId, view = false) =>
    `${getBackendUrl()}/mentorresources/download/pdf/${requestId}${view ? '?view=1' : ''}`;

  const getVideoStreamUrl = (requestId) =>
    `${getBackendUrl()}/mentorresources/stream/video/${requestId}`;

  useEffect(() => { 
    fetchRequests(); 
  }, []);
  
  useEffect(() => {
    if (formData.requestType === 'pdf') {
      fetchAvailableFolders();
    }
    if (formData.requestType === 'video') {
      fetchAvailableVideoFolders();
    }
  }, [formData.requestType]);

  const filteredRequests = requests.filter(req => {
    return (filters.type === 'all' || req.requestType === filters.type) &&
           (filters.status === 'all' || req.status === filters.status);
  });

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'approved':
        return { icon: <CheckCircle size={16} />, className: 'status-approved' };
      case 'rejected':
        return { icon: <XCircle size={16} />, className: 'status-rejected' };
      default:
        return { icon: <Clock size={16} />, className: 'status-pending' };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'item': return <LinkIcon size={16} />;
      case 'folder': return <Folder size={16} />;
      case 'pdf': return <FileText size={16} />;
      case 'videoFolder': return <Video size={16} />;
      case 'video': return <Play size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const renderFormFields = () => {
    switch (formData.requestType) {
      case 'item':
        return (
          <div className="form-group">
            <input 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="Item Title*" 
              className="input-text"
              required 
            />
            <input 
              name="hyperlink" 
              value={formData.hyperlink} 
              onChange={handleChange} 
              placeholder="Item URL*" 
              type="url"
              className="input-url"
              required 
            />
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Description*" 
              rows="3"
              className="textarea"
              required 
            />
          </div>
        );
      case 'folder':
        return (
          <div className="form-group">
            <input 
              name="folderTitle" 
              value={formData.folderTitle} 
              onChange={handleChange} 
              placeholder="Folder Title*" 
              className="input-text"
              required 
            />
          </div>
        );
      case 'pdf':
        return (
          <div className="form-group">
            <input 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="PDF Title*" 
              className="input-text"
              required 
            />
            <select 
              name="folderId" 
              value={formData.folderId} 
              onChange={handleChange} 
              className="input-select"
              required
            >
              <option value="">Select Folder*</option>
              {availableFolders.map(f => (
                <option key={f._id} value={f._id}>
                  {f.folderTitle} ({f.source === 'request' ? 'Requested' : 'Existing'})
                </option>
              ))}
            </select>
            {availableFolders.length === 0 && (
              <p style={{ color: '#c2410c', fontSize: '0.875rem', background: '#fef3c7', padding: '8px', borderRadius: '8px' }}>
                No folders available. Create a folder request first.
              </p>
            )}
            <div 
              className="file-upload-container"
              onClick={() => document.getElementById('pdf-upload').click()}
            >
              <Upload size={48} />
              <div>Click to upload PDF file*</div>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileSelect} 
                id="pdf-upload" 
                style={{ display: 'none' }} 
                required 
              />
            </div>
            {selectedFile && (
              <div className="file-info">
                <div className="file-info-text">
                  <FileText size={20} />
                  <span>{selectedFile.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button type="button" onClick={removeFile} className="btn-remove-file">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        );
      case 'videoFolder':
        return (
          <div className="form-group">
            <input 
              name="folderTitle" 
              value={formData.folderTitle} 
              onChange={handleChange} 
              placeholder="Video Folder Title*" 
              className="input-text"
              required 
            />
            <input 
              name="folderThumbnail" 
              value={formData.folderThumbnail} 
              onChange={handleChange} 
              placeholder="Thumbnail URL*" 
              type="url"
              className="input-url"
              required 
            />
          </div>
        );
      case 'video':
        return (
          <div className="form-group">
            <input 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="Video Title*" 
              className="input-text"
              required 
            />
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Video Description*" 
              rows="3"
              className="textarea"
              required 
            />
            <select 
              name="folderId" 
              value={formData.folderId} 
              onChange={handleChange} 
              className="input-select"
              required
            >
              <option value="">Select Video Folder*</option>
              {availableVideoFolders.map(f => (
                <option key={f._id} value={f._id}>
                  {f.folderTitle} ({f.source === 'request' ? 'Requested' : 'Existing'})
                </option>
              ))}
            </select>
            {availableVideoFolders.length === 0 && (
              <p style={{ color: '#c2410c', fontSize: '0.875rem', background: '#fef3c7', padding: '8px', borderRadius: '8px' }}>
                No video folders available. Create a video folder request first and wait for approval.
              </p>
            )}
            <div style={{ display: 'flex', gap: '32px', margin: '16px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="radio" 
                  name="sourceType" 
                  value="url" 
                  checked={formData.sourceType === 'url'}
                  onChange={handleChange}
                />
                URL Link
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="radio" 
                  name="sourceType" 
                  value="upload" 
                  checked={formData.sourceType === 'upload'}
                  onChange={handleChange}
                />
                File Upload
              </label>
            </div>
            {formData.sourceType === 'url' ? (
              <input 
                name="link" 
                value={formData.link} 
                onChange={handleChange} 
                placeholder="Video URL*" 
                type="url"
                className="input-url"
                required 
              />
            ) : (
              <div 
                className="file-upload-container"
                onClick={() => document.getElementById('video-upload').click()}
              >
                <Upload size={48} />
                <div>Click to upload video file*</div>
                <small style={{ color: '#6b7280' }}>Max size: 100MB</small>
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileSelect}
                  id="video-upload"
                  style={{ display: 'none' }}
                  required 
                />
              </div>
            )}
            {selectedFile && formData.sourceType === 'upload' && (
              <div className="file-info">
                <div className="file-info-text">
                  <Video size={20} />
                  <span>{selectedFile.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button type="button" onClick={removeFile} className="btn-remove-file">
                  <X size={16} />
                </button>
              </div>
            )}
            <select 
              name="type" 
              value={formData.type} 
              onChange={handleChange} 
              className="input-select"
              required
            >
              <option value="">Select Video Type*</option>
              <option value="lecture">Lecture</option>
              <option value="tutorial">Tutorial</option>
              <option value="workshop">Workshop</option>
              <option value="demo">Demo</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  const myUploadedPDFs = requests.filter(
    req => req.requestType === 'pdf' && req.status === 'approved'
  );
  const myUploadedVideos = requests.filter(
    req => req.requestType === 'video' && req.status === 'approved' && req.sourceType === 'upload'
  );

  useEffect(() => {
    const videoReqs = requests.filter(req => req.requestType === 'video');
    console.log('Video requests:', videoReqs);
  }, [requests]);

  return (
    <div className="mentor-resources-container">
      <div className="mentorresource-card">
        <div className="header-flex">
          <h1 className="header-title">Mentor Resource Requests</h1>
          <button 
            onClick={() => setShowCreateForm(true)} 
            disabled={loading}
            className="btn-primary"
          >
            <Plus size={20} />
            New Request
          </button>
        </div>

        <div className="stats-grid">
          <div 
            className="stat-card stat-total" 
            onClick={() => setFilters({ type: 'all', status: 'all' })}
            style={{ cursor: 'pointer' }}
          >
            {requestCounts.total || 0}
            <div>Total</div>
          </div>
          <div 
            className="stat-card stat-items" 
            onClick={() => setFilters({ type: 'item', status: 'all' })}
            style={{ cursor: 'pointer' }}
          >
            {requestCounts.items || 0}
            <div>Items</div>
          </div>
          <div 
            className="stat-card stat-folders" 
            onClick={() => setFilters({ type: 'folder', status: 'all' })}
            style={{ cursor: 'pointer' }}
          >
            {requestCounts.folders || 0}
            <div>Folders</div>
          </div>
          <div 
            className="stat-card stat-pdfs" 
            onClick={() => setFilters({ type: 'pdf', status: 'all' })} 
            style={{ cursor: 'pointer' }}
          >
            {requestCounts.pdfs || 0}
            <div>PDFs</div>
          </div>
          <div 
            className="stat-card stat-videoFolders" 
            onClick={() => setFilters({ type: 'videoFolder', status: 'all' })} 
            style={{ cursor: 'pointer' }}
          >
            {requestCounts.videoFolders || 0}
            <div>Video Folders</div>
          </div>
          <div 
            className="stat-card stat-videos" 
            onClick={() => setFilters({ type: 'video', status: 'all' })} 
            style={{ cursor: 'pointer' }}
          >
            {requestCounts.videos || requests.filter(r => r.requestType === 'video').length}
            <div>Videos</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="message-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="message-success">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {showCreateForm && (
        <div className="mentorresource-card">
          <h2 className="header-title" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Create New Request</h2>
          <form onSubmit={createRequest} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group">
              <label>Request Type</label>
              <select 
                name="requestType" 
                value={formData.requestType} 
                onChange={handleChange}
                className="input-select"
              >
                <option value="item">📄 Item Request</option>
                <option value="folder">📁 Folder Request</option>
                <option value="pdf">📑 PDF Upload</option>
                <option value="videoFolder">🎬 Video Folder Request</option>
                <option value="video">🎥 Video Request</option>
              </select>
            </div>

            {renderFormFields()}

            <div style={{ display: 'flex', gap: '12px',flexDirection :'column' }}>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: '3px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateForm(false);
                  setError('');
                  setSuccess('');
                  setSelectedFile(null);
                }}
                disabled={loading}
                style={{
                  backgroundColor: '#6B7280',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  border: 'none'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mentorresource-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1.25rem', color: '#111827' }}>My Requests</h2>

          <div className="filter-group">
            <Filter size={16} style={{ color: '#9ca3af' }} />
            <select 
              value={filters.type} 
              onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="item">Items</option>
              <option value="folder">Folders</option>
              <option value="pdf">PDFs</option>
              <option value="videoFolder">Video Folders</option>
              <option value="video">Videos</option>
            </select>

            <select 
              value={filters.status} 
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: 32,
              height: 32,
              margin: 'auto',
              border: '4px solid #2563eb',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}

        {!loading && filteredRequests.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
            No requests found.
          </div>
        )}

        {!loading && filteredRequests.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => {
                  const status = getStatusDisplay(req.status);
                  return (
                    <tr key={req._id}>
                      <td>{getTypeIcon(req.requestType)}</td>
                      <td>{req.title || req.folderTitle || '-'}</td>
                      <td><span className={status.className} style={{display:'inline-flex', gap:'4px', alignItems:'center'}}>
                        {status.icon}{req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span></td>
                      <td>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}</td>
                      <td>
                        {req.requestType === 'pdf' && req.status === 'approved' && (
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              style={{ color: '#2563eb', cursor: 'pointer', display:'flex', alignItems:'center', gap: '4px' }}
                              onClick={() => downloadPDF(req._id, req.title)}
                            >
                              <Download size={16} /> Download
                            </button>
                            <button
                              style={{ color: '#16a34a', cursor: 'pointer', display:'flex', alignItems:'center', gap: '4px' }}
                              onClick={() => setPdfModalUrl(getPDFDownloadUrl(req._id, true))}
                            >
                              <FileText size={16} /> View
                            </button>
                          </div>
                        )}
                        {req.requestType === 'video' && req.status === 'approved' && req.sourceType === 'upload' && (
                          <a
                            style={{ color: '#16a34a', display:'flex', alignItems:'center', gap: '4px', textDecoration: 'underline' }}
                            href={getVideoStreamUrl(req._id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Play size={16} /> View Video
                          </a>
                        )}
                        {req.requestType === 'video' && req.status === 'approved' && req.sourceType === 'url' && req.link && (
                          <a
                            style={{ color: '#16a34a', display:'flex', alignItems:'center', gap: '4px', textDecoration: 'underline' }}
                            href={req.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Play size={16} /> View Video
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Modal */}
      {pdfModalUrl && (
        <div className="modal-overlay" onClick={() => setPdfModalUrl(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close-button"
              onClick={() => setPdfModalUrl(null)}
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <iframe
              src={pdfModalUrl}
              title="View PDF"
              width="800px"
              height="600px"
              style={{ border: '1px solid #ddd', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}

      {/* Uploaded PDFs */}
      {myUploadedPDFs.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 8 }}>My Uploaded PDFs</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myUploadedPDFs.map(pdf => (
                  <tr key={pdf._id}>
                    <td>{pdf.title}</td>
                    <td style={{ display: 'flex', gap: '12px' }}>
                      <button
                        style={{ color: '#2563eb', cursor: 'pointer', display:'flex', alignItems:'center', gap: '4px' }}
                        onClick={() => downloadPDF(pdf._id, pdf.title)}
                      >
                        <Download size={16} /> Download
                      </button>
                      <button
                        style={{ color: '#16a34a', cursor: 'pointer', display:'flex', alignItems:'center', gap: '4px' }}
                        onClick={() => setPdfModalUrl(getPDFDownloadUrl(pdf._id, true))}
                      >
                        <FileText size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Uploaded Videos */}
      {myUploadedVideos.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 8 }}>My Uploaded Videos</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myUploadedVideos.map(video => (
                  <tr key={video._id}>
                    <td>{video.title}</td>
                    <td>
                      <a
                        style={{ color: '#16a34a', display:'flex', alignItems:'center', gap: '4px', textDecoration: 'underline' }}
                        href={getVideoStreamUrl(video._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Play size={16} /> View Video
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorResourcesDashboard;
