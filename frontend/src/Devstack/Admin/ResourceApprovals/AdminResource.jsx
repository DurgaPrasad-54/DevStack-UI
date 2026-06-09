import { useState, useEffect } from 'react';
import { Video, FileText, Link, ArrowLeft, Eye, Check, X, Clock, User, Calendar } from 'lucide-react';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './AdminResourceApproval.css';
import config from '../../../config';

const AdminResourceApproval = () => {
  const [activeSection, setActiveSection] = useState('video'); // video, notes, items
  const [currentView, setCurrentView] = useState('list'); // list, view
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [videoFolders, setVideoFolders] = useState([]);
  const [folders, setFolders] = useState([]);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function to get admin ID
  const getAdminId = () => {
    let userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (!userId) {
      if (userRole === 'admin') {
        userId = localStorage.getItem('admin');
      }
    }
    
    return userId;
  };

  // Helper functions to fetch data by status
  const fetchVideosByStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const [pending, approved, rejected] = await Promise.all([
        fetch(`${config.backendUrl}/hackvideos/status/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${config.backendUrl}/hackvideos/status/approved`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${config.backendUrl}/hackvideos/status/rejected`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const [pendingData, approvedData, rejectedData] = await Promise.all([
        pending.json(),
        approved.json(),
        rejected.json()
      ]);
      
      setVideos([...pendingData, ...approvedData, ...rejectedData]);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    }
  };

  const fetchNotesByStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const [pending, approved, rejected] = await Promise.all([
        fetch(`${config.backendUrl}/hacknotes/status/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${config.backendUrl}/hacknotes/status/approved`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${config.backendUrl}/hacknotes/status/rejected`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const [pendingData, approvedData, rejectedData] = await Promise.all([
        pending.json(),
        approved.json(),
        rejected.json()
      ]);
      
      setNotes([...pendingData, ...approvedData, ...rejectedData]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    }
  };

  // Fetch all resources on mount and when switching sections
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);

    if (activeSection === 'video') {
      Promise.all([
        fetch(`${config.backendUrl}/hackvideofolder`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json()),
        fetchVideosByStatus()
      ]).then(([foldersData]) => {
        setVideoFolders(foldersData || []);
        setLoading(false);
      }).catch(() => {
        setVideoFolders([]);
        setVideos([]);
        setLoading(false);
      });
    }

    if (activeSection === 'notes') {
      Promise.all([
        fetch(`${config.backendUrl}/hackfolder`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json()),
        fetchNotesByStatus()
      ]).then(([foldersData]) => {
        setFolders(foldersData || []);
        setLoading(false);
      }).catch(() => {
        setFolders([]);
        setNotes([]);
        setLoading(false);
      });
    }

    if (activeSection === 'items') {
      fetch(`${config.backendUrl}/hackitems`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json())
        .then(data => {
          setItems(data || []);
          setLoading(false);
        })
        .catch(() => {
          setItems([]);
          setLoading(false);
        });
    }
  }, [activeSection]);

  // Filter items based on status
  const filterItems = (items) => {
    if (statusFilter === 'all') return items;
    return items.filter(item => (item.status || 'pending') === statusFilter);
  };

  // Get counts for status badges
  const getStatusCounts = (items) => {
    const pending = items.filter(item => !item.status || item.status === 'pending').length;
    const approved = items.filter(item => item.status === 'approved').length;
    const rejected = items.filter(item => item.status === 'rejected').length;
    return { pending, approved, rejected, total: items.length };
  };

  // Status update handlers
  const handleStatusUpdate = async (type, id, newStatus) => {
    const token = localStorage.getItem('token');
    const adminId = getAdminId();
    
    if (!adminId) {
      toast.error('Admin ID not found.');
      return;
    }

    const endpoints = {
      'video-folder': `/hackvideofolder/${id}/status`,
      'video': `/hackvideos/${id}/status`,
      'folder': `/hackfolder/${id}/status`,
      'note': `/hacknotes/${id}/status`,
      'item': `/hackitems/${id}/status`
    };

    try {
      const response = await fetch(`${config.backendUrl}${endpoints[type]}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          approvedBy: adminId
        })
      });

      if (response.ok) {
        toast.success(`Status updated to "${newStatus}" successfully.`);
        // Refresh data based on type
        if (type.includes('video')) {
          fetch(`${config.backendUrl}/hackvideofolder`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(setVideoFolders);
          fetchVideosByStatus();
        } else if (type.includes('folder') || type.includes('note')) {
          fetch(`${config.backendUrl}/hackfolder`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(setFolders);
          fetchNotesByStatus();
        } else if (type === 'item') {
          fetch(`${config.backendUrl}/hackitems`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(setItems);
        }
      } else {
        toast.error('Failed to update status.');
      }
    } catch (error) {
      toast.error('Error updating status.');
      console.error('Error updating status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <Check className="status-icon approved" />;
      case 'rejected': return <X className="status-icon rejected" />;
      default: return <Clock className="status-icon pending" />;
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  // Render action buttons based on current status
  const renderActionButtons = (item, type) => {
    const currentStatus = item.status || 'pending';
    
    return (
      <div className="action-buttons">
        {currentStatus !== 'approved' && (
          <button
            className="btn btn-success btn-xs"
            onClick={() => handleStatusUpdate(type, item._id, 'approved')}
            title="Approve"
          >
            <Check className="btn-icon" />
          </button>
        )}
        {currentStatus !== 'pending' && (
          <button
            className="btn btn-warning btn-xs"
            onClick={() => handleStatusUpdate(type, item._id, 'pending')}
            title="Set to Pending"
          >
            <Clock className="btn-icon" />
          </button>
        )}
        {currentStatus !== 'rejected' && (
          <button
            className="btn btn-danger btn-xs"
            onClick={() => handleStatusUpdate(type, item._id, 'rejected')}
            title="Reject"
          >
            <X className="btn-icon" />
          </button>
        )}
        {(type === 'video' || type === 'note') && (
          <button
            className="btn btn-outline btn-xs"
            onClick={() => {
              setSelectedItem(item);
              setCurrentView('view');
            }}
            title="View"
          >
            <Eye className="btn-icon" />
          </button>
        )}
      </div>
    );
  };

  // Video player component
  const VideoPlayer = ({ video }) => {
    if (video.videoLink) {
      const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };

      const videoId = getYouTubeId(video.videoLink);
      
      if (videoId) {
        return (
          <div className="video-player">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={video.title}
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );
      } else {
        return (
          <div className="video-player">
            <video width="100%" height="400" controls>
              <source src={video.videoLink} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
    } else {
      return (
        <div className="video-player">
          <video width="100%" height="400" controls>
            <source src={`${config.backendUrl}/hackvideos/stream/${video._id}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
  };

  const renderNavigation = () => (
    <div className="navigation-container">
    <div className="navigation-tabs">
      {[
        { key: 'video', label: 'Videos', icon: Video },
        { key: 'notes', label: 'Notes', icon: FileText },
        { key: 'items', label: 'Items', icon: Link }
      ].map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.key}
            className={`nav-tab ${activeSection === section.key ? 'active' : ''}`}
            onClick={() => {
              setActiveSection(section.key);
              setCurrentView('list');
              setSelectedItem(null);
              setStatusFilter('all');
            }}
          >
            <Icon className="nav-icon" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </div>
    </div>
  );

  const renderStatusFilters = (items) => {
    const counts = getStatusCounts(items);
    
    return (
      <div className="status-filters">
        <button
          className={`status-filter ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All ({counts.total})
        </button>
        <button
          className={`status-filter pending ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending ({counts.pending})
        </button>
        <button
          className={`status-filter approved ${statusFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          Approved ({counts.approved})
        </button>
        <button
          className={`status-filter rejected ${statusFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          Rejected ({counts.rejected})
        </button>
      </div>
    );
  };

  const renderVideoSection = () => {
    if (currentView === 'view' && selectedItem) {
      return (
        <div className="view-container">
          <div className="view-header">
            <button className="back-button" onClick={() => setCurrentView('list')}>
              <ArrowLeft className="back-icon" />
              Back
            </button>
            <h2 className="view-title">{selectedItem.title}</h2>
            <div className="view-actions">
              {renderActionButtons(selectedItem, selectedItem.videoLink ? 'video' : 'video-folder')}
            </div>
          </div>
          
          <div className="view-content">
            {selectedItem.videoLink || selectedItem.videoFile ? (
              <VideoPlayer video={selectedItem} />
            ) : (
              <div className="folder-preview">
                <Video className="folder-preview-icon" />
                <h3>Video Folder</h3>
                <p>{selectedItem.description}</p>
              </div>
            )}
            <div className="item-info">
              <div className="item-meta">
                <div className="meta-item">
                  <User className="meta-icon" />
                  <span>Created by: {selectedItem.createdBy?.name || selectedItem.createdBy?.email || 'Unknown'}</span>
                </div>
                <div className="meta-item">
                  <Calendar className="meta-icon" />
                  <span>Created: {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className={`status-badge ${getStatusClass(selectedItem.status)}`}>
                  {getStatusIcon(selectedItem.status)}
                  {selectedItem.status || 'pending'}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const allVideoItems = [...videoFolders, ...videos];
    const filteredItems = filterItems(allVideoItems);

    return (
      <div>
        <div className="section-header">
          <h2 className="section-title">Video Resources Approval</h2>
          {renderStatusFilters(allVideoItems)}
        </div>

        {loading ? (
          <div className="loading">Loading resources...</div>
        ) : (
          <div className="approval-section">
            <div className="approval-group">
              <div className="approval-table">
                <div className="adminn-table-header">
                  <div className="header-cell">Mentor</div>
                  <div className="header-cell">Type</div>
                  <div className="header-cell">Title</div>
                  <div className="header-cell">Status</div>
                  <div className="header-cell">Actions</div>
                </div>
                {filteredItems.map((item) => (
                  <div key={item._id} className="table-row">
                    <div className="table-cell">
                      <div className="mentor-info">
                        <User className="mentor-icon" />
                        <span>{item.createdBy?.name || item.createdBy?.email || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="table-cell">
                      <span className="type-badge video">
                        <Video className="type-icon" />
                        {item.description ? 'Video Folder' : item.videoLink ? 'Video Link' : 'Video File'}
                      </span>
                    </div>
                    <div className="table-cell">
                      <div className="title-info">
                        <h4>{item.title}</h4>
                        {(item.description || item.videoLink) && (
                          <p className="item-description-text">
                            {item.description || (item.videoLink ? 'Video Link' : '')}
                          </p>
                        )}
                        <span className="date">
                          <Calendar className="date-icon" />
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="table-cell">
                      <div className={`status-badge ${getStatusClass(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status || 'pending'}
                      </div>
                    </div>
                    <div className="table-cell">
                      {renderActionButtons(item, item.description ? 'video-folder' : 'video')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNotesSection = () => {
    if (currentView === 'view' && selectedItem) {
      return (
        <div className="view-container">
          <div className="view-header">
            <button className="back-button" onClick={() => setCurrentView('list')}>
              <ArrowLeft className="back-icon" />
              Back
            </button>
            <h2 className="view-title">{selectedItem.title}</h2>
            <div className="view-actions">
              {renderActionButtons(selectedItem, selectedItem.pdf ? 'note' : 'folder')}
            </div>
          </div>
          
          <div className="view-content">
            {selectedItem.pdf ? (
              <div className="pdf-viewer">
                <iframe
                  src={`${config.backendUrl}/hacknotes/stream/${selectedItem._id}`}
                  width="100%"
                  height="600px"
                  title={selectedItem.title}
                />
              </div>
            ) : (
              <div className="folder-preview">
                <FileText className="folder-preview-icon" />
                <h3>Notes Folder</h3>
                <p>{selectedItem.description}</p>
              </div>
            )}
            <div className="item-info">
              <div className="item-meta">
                <div className="meta-item">
                  <User className="meta-icon" />
                  <span>Created by: {selectedItem.createdBy?.name || selectedItem.createdBy?.email || 'Unknown'}</span>
                </div>
                <div className="meta-item">
                  <Calendar className="meta-icon" />
                  <span>Created: {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className={`status-badge ${getStatusClass(selectedItem.status)}`}>
                  {getStatusIcon(selectedItem.status)}
                  {selectedItem.status || 'pending'}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const allNotesItems = [...folders, ...notes];
    const filteredItems = filterItems(allNotesItems);

    return (
      <div>
        <div className="section-header">
          <h2 className="section-title">Notes Resources Approval</h2>
          {renderStatusFilters(allNotesItems)}
        </div>

        {loading ? (
          <div className="loading">Loading resources...</div>
        ) : (
          <div className="approval-section">
            <div className="approval-group">
              <div className="approval-table">
                <div className="adminn-table-header">
                  <div className="header-cell">Mentor</div>
                  <div className="header-cell">Type</div>
                  <div className="header-cell">Title</div>
                  <div className="header-cell">Status</div>
                  <div className="header-cell">Actions</div>
                </div>
                {filteredItems.map((item) => (
                  <div key={item._id} className="table-row">
                    <div className="table-cell">
                      <div className="mentor-info">
                        <User className="mentor-icon" />
                        <span>{item.createdBy?.name || item.createdBy?.email || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="table-cell">
                      <span className="type-badge notes">
                        <FileText className="type-icon" />
                        {item.pdf ? 'PDF Note' : 'Notes Folder'}
                      </span>
                    </div>
                    <div className="table-cell">
                      <div className="title-info">
                        <h4>{item.title}</h4>
                        {item.description && (
                          <p className="item-description-text">
                            {item.description}
                          </p>
                        )}
                        <span className="date">
                          <Calendar className="date-icon" />
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="table-cell">
                      <div className={`status-badge ${getStatusClass(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status || 'pending'}
                      </div>
                    </div>
                    <div className="table-cell">
                      {renderActionButtons(item, item.pdf ? 'note' : 'folder')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderItemsSection = () => {
    const filteredItems = filterItems(items);

    return (
      <div>
        <div className="section-header">
          <h2 className="section-title">Items Resources Approval</h2>
          {renderStatusFilters(items)}
        </div>

        {loading ? (
          <div className="loading">Loading resources...</div>
        ) : (
          <div className="approval-section">
            <div className="approval-group">
              <div className="approval-table">
                <div className="adminn-table-header">
                  <div className="header-cell">Mentor</div>
                  <div className="header-cell">Type</div>
                  <div className="header-cell">Title</div>
                  <div className="header-cell">Status</div>
                  <div className="header-cell">Actions</div>
                </div>
                {filteredItems.map((item) => (
                  <div key={item._id} className="table-row">
                    <div className="table-cell">
                      <div className="mentor-info">
                        <User className="mentor-icon" />
                        <span>{item.createdBy?.name || item.createdBy?.email || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="table-cell">
                      <span className="type-badge items">
                        <Link className="type-icon" />
                        Resource Link
                      </span>
                    </div>
                    <div className="table-cell">
                      <div className="title-info">
                        <h4>{item.title}</h4>
                        {item.description && (
                          <p className="item-description-text">
                            {item.description}
                          </p>
                        )}
                        <span className="date">
                          <Calendar className="date-icon" />
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="table-cell">
                      <div className={`status-badge ${getStatusClass(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status || 'pending'}
                      </div>
                    </div>
                    <div className="table-cell">
                      {renderActionButtons(item, 'item')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentSection = () => {
    switch(activeSection) {
      case 'video':
        return renderVideoSection();
      case 'notes':
        return renderNotesSection();
      case 'items':
        return renderItemsSection();
      default:
        return renderVideoSection();
    }
  };

  return (
    <div className="admin-approval-container">
      <div className="main-content">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="header">
          <h1 className="main-title">Admin Resource Approval Center</h1>
        </div>

        {renderNavigation()}
        {renderCurrentSection()}
      </div>
    </div>
  );
};

export default AdminResourceApproval;