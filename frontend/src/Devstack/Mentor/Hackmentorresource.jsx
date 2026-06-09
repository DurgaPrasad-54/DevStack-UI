import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


import { Video, FileText, Link, ArrowLeft, Eye, Download, Clock, Check, X, Edit, Trash2, Save } from 'lucide-react';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './HackMentorResource.css';
import config from '../../config';

// Helper to check if JWT token is expired
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

const HackMentorResource = () => {
  const [activeSection, setActiveSection] = useState('video'); // video, notes, items
  const [currentView, setCurrentView] = useState('list'); // list, history, view
  const [selectedItem, setSelectedItem] = useState(null); // For viewing details
  const [editingItem, setEditingItem] = useState(null); // For editing
  const [videoFolders, setVideoFolders] = useState([]);
  const [folders, setFolders] = useState([]);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [items, setItems] = useState([]);
  const [uploadType, setUploadType] = useState('link'); // link or file
  const [expandedForms, setExpandedForms] = useState({
    videoFolder: false,
    video: false,
    notesFolder: false,
    note: false,
    item: false
  });

  // Form states
  const [videoFolderForm, setVideoFolderForm] = useState({
    title: '',
    description: '',
    thumbnail: null
  });
  const [videoForm, setVideoForm] = useState({
    folderId: '',
    title: '',
    videoLink: '',
    videoFile: null
  });
  const [folderForm, setFolderForm] = useState({
    title: '',
    description: ''
  });
  const [noteForm, setNoteForm] = useState({
    folderId: '',
    title: '',
    pdf: null
  });
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    link: ''
  });

  // Helper function to get user ID based on role
  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Check for different user ID keys based on role
    if (!userId) {
      if (userRole === 'mentor') {
        userId = localStorage.getItem('mentor');
      } else if (userRole === 'student') {
        userId = localStorage.getItem('student');
      } else if (userRole === 'admin') {
        userId = localStorage.getItem('admin');
      }
    }
    
    return userId;
  };

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  // Filter items by current mentor
  const filterByMentor = (items) => {
    const currentUserId = getUserId();
    if (!currentUserId) return [];
    return items.filter(item => 
      item.createdBy === currentUserId || 
      (item.createdBy && typeof item.createdBy === 'object' && item.createdBy._id === currentUserId)
    );
  };

  // Fetch all resources on mount and when switching sections
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Video folders
    if (activeSection === 'video') {
      fetch(`${config.backendUrl}/hackvideofolder`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setVideoFolders(filterByMentor(data)))
        .catch(() => setVideoFolders([]));

      setVideos([]);
    }

    // Notes folders
    if (activeSection === 'notes') {
      fetch(`${config.backendUrl}/hackfolder`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setFolders(filterByMentor(data)))
        .catch(() => setFolders([]));

      setNotes([]);
    }

    // Items
    if (activeSection === 'items') {
      fetch(`${config.backendUrl}/hackitems`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setItems(filterByMentor(data)))
        .catch(() => setItems([]));
    }
  }, [activeSection, currentView]);

  // Fetch videos for history view
  useEffect(() => {
    if (activeSection === 'video' && currentView === 'history') {
      fetchVideosByStatus();
    }
  }, [activeSection, currentView]);

  // Fetch notes for history view
  useEffect(() => {
    if (activeSection === 'notes' && currentView === 'history') {
      fetchNotesByStatus();
    }
  }, [activeSection, currentView]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <Check className="mentor-resource-status-icon" />;
      case 'rejected': return <X className="mentor-resource-status-icon" />;
      default: return <Clock className="mentor-resource-status-icon" />;
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'approved': return 'mentor-resource-status-approved';
      case 'rejected': return 'mentor-resource-status-rejected';
      default: return 'mentor-resource-status-pending';
    }
  };

  // Delete functions
  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    const token = localStorage.getItem('token');
    const endpoints = {
      'videoFolder': `/hackvideofolder/${id}`,
      'video': `/hackvideos/${id}`,
      'folder': `/hackfolder/${id}`,
      'note': `/hacknotes/${id}`,
      'item': `/hackitems/${id}`
    };

    try {
      await fetch(`${config.backendUrl}${endpoints[type]}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Item deleted successfully');
      
      // Refresh the appropriate list
      if (type === 'videoFolder') {
        setVideoFolders(prev => prev.filter(item => item._id !== id));
      } else if (type === 'video') {
        setVideos(prev => prev.filter(item => item._id !== id));
      } else if (type === 'folder') {
        setFolders(prev => prev.filter(item => item._id !== id));
      } else if (type === 'note') {
        setNotes(prev => prev.filter(item => item._id !== id));
      } else if (type === 'item') {
        setItems(prev => prev.filter(item => item._id !== id));
      }
    } catch (error) {
      toast.error('Error deleting item');
      console.error('Delete error:', error);
    }
  };

  // Edit functions
  const handleEdit = (type, item) => {
    setEditingItem({ type, item });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const token = localStorage.getItem('token');
    const { type, item } = editingItem;
    
    const endpoints = {
      'videoFolder': `/hackvideofolder/${item._id}`,
      'video': `/hackvideos/${item._id}`,
      'folder': `/hackfolder/${item._id}`,
      'note': `/hacknotes/${item._id}`,
      'item': `/hackitems/${item._id}`
    };

    try {
      // For folders and items, we can update title and description
      const updateData = {
        title: item.title,
        description: item.description || '',
        ...(type === 'item' && { link: item.link })
      };

      const response = await fetch(`${config.backendUrl}${endpoints[type]}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Update failed');

      toast.success('Item updated successfully');
      setEditingItem(null);
      
      // Refresh the appropriate list
      if (type === 'videoFolder') {
        setVideoFolders(prev => prev.map(i => i._id === item._id ? item : i));
      } else if (type === 'folder') {
        setFolders(prev => prev.map(i => i._id === item._id ? item : i));
      } else if (type === 'item') {
        setItems(prev => prev.map(i => i._id === item._id ? item : i));
      }
    } catch (error) {
      toast.error('Error updating item');
      console.error('Update error:', error);
    }
  };

  // View function
  const handleView = (type, item) => {
    setSelectedItem({ type, item });
    setCurrentView('view');
  };

  // --- API SUBMIT HANDLERS ---

  const handleVideoFolderSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = getUserId();
    
    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    const formData = new FormData();
    formData.append('title', videoFolderForm.title);
    formData.append('description', videoFolderForm.description);
    formData.append('createdBy', userId);
    if (videoFolderForm.thumbnail) {
      formData.append('thumbnail', videoFolderForm.thumbnail);
    } else {
      console.error('Thumbnail is required');
      return;
    }

    try {
      const response = await fetch(`${config.backendUrl}/hackvideofolder/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData?.message || 'Failed to create video folder.');
        return;
      }

      setVideoFolderForm({ title: '', description: '', thumbnail: null });
      toast.success('Video folder created successfully.');
      // Refresh video folders
      fetch(`${config.backendUrl}/hackvideofolder`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setVideoFolders(filterByMentor(data)));
    } catch (error) {
      toast.error('Error creating video folder.');
      console.error('Error creating video folder:', error);
    }
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = getUserId();
    
    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    const formData = new FormData();
    formData.append('folderId', videoForm.folderId);
    formData.append('title', videoForm.title);
    formData.append('createdBy', userId);
    
    if (uploadType === 'link') {
      if (!videoForm.videoLink) {
        console.error('Video link is required');
        return;
      }
      formData.append('videoLink', videoForm.videoLink);
    } else if (videoForm.videoFile) {
      formData.append('videoFile', videoForm.videoFile);
    } else {
      console.error('Video file is required');
      return;
    }

    try {
      const response = await fetch(`${config.backendUrl}/hackvideos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData?.message || 'Failed to upload video.');
        return;
      }

      setVideoForm({ folderId: '', title: '', videoLink: '', videoFile: null });
      toast.success('Video uploaded successfully.');
    } catch (error) {
      toast.error('Error uploading video.');
      console.error('Error uploading video:', error);
    }
  };

  const handleFolderSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = getUserId();
    
    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    if (!folderForm.title || !folderForm.description) {
      console.error('Title and description are required');
      return;
    }
    
    try {
      const response = await fetch(`${config.backendUrl}/hackfolder/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: folderForm.title,
          description: folderForm.description,
          createdBy: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData?.message || 'Failed to create notes folder.');
        return;
      }

      setFolderForm({ title: '', description: '' });
      toast.success('Notes folder created successfully.');
      // Refresh folders
      fetch(`${config.backendUrl}/hackfolder`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setFolders(filterByMentor(data)));
    } catch (error) {
      toast.error('Error creating notes folder.');
      console.error('Error creating folder:', error);
    }
  };

  // Helper function to fetch videos by status for history view
  const fetchVideosByStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${config.backendUrl}/hackvideos/status/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pendingVideos = await response.json();
      
      const approvedResponse = await fetch(`${config.backendUrl}/hackvideos/status/approved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const approvedVideos = await approvedResponse.json();
      
      const rejectedResponse = await fetch(`${config.backendUrl}/hackvideos/status/rejected`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rejectedVideos = await rejectedResponse.json();
      
      const allVideos = [...pendingVideos, ...approvedVideos, ...rejectedVideos];
      setVideos(filterByMentor(allVideos));
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    }
  };

  // Helper function to fetch notes by status for history view
  const fetchNotesByStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${config.backendUrl}/hacknotes/status/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pendingNotes = await response.json();
      
      const approvedResponse = await fetch(`${config.backendUrl}/hacknotes/status/approved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const approvedNotes = await approvedResponse.json();
      
      const rejectedResponse = await fetch(`${config.backendUrl}/hacknotes/status/rejected`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rejectedNotes = await rejectedResponse.json();
      
      const allNotes = [...pendingNotes, ...approvedNotes, ...rejectedNotes];
      setNotes(filterByMentor(allNotes));
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    }
  };

  const toggleForm = (formName) => {
    setExpandedForms(prev => ({
      ...prev,
      [formName]: !prev[formName]
    }));
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = getUserId();
    
    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    if (!noteForm.folderId || !noteForm.title || !noteForm.pdf) {
      console.error('Folder, title, and PDF file are required');
      return;
    }

    const formData = new FormData();
    formData.append('folderId', noteForm.folderId);
    formData.append('title', noteForm.title);
    formData.append('createdBy', userId);
    formData.append('pdf', noteForm.pdf);

    try {
      const response = await fetch(`${config.backendUrl}/hacknotes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData?.message || 'Failed to upload note.');
        return;
      }

      setNoteForm({ folderId: '', title: '', pdf: null });
      toast.success('Note uploaded successfully.');
    } catch (error) {
      toast.error('Error uploading note.');
      console.error('Error uploading note:', error);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = getUserId();
    
    if (!userId) {
      console.error('User ID not found in localStorage');
      return;
    }

    if (!itemForm.title || !itemForm.description || !itemForm.link) {
      console.error('Title, description, and link are required');
      return;
    }
    
    try {
      const response = await fetch(`${config.backendUrl}/hackitems/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: itemForm.title,
          description: itemForm.description,
          link: itemForm.link,
          createdBy: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData?.message || 'Failed to create item.');
        return;
      }

      setItemForm({ title: '', description: '', link: '' });
      toast.success('Item created successfully.');
      // Refresh items
      fetch(`${config.backendUrl}/hackitems`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setItems(filterByMentor(data)));
    } catch (error) {
      toast.error('Error creating item.');
      console.error('Error creating item:', error);
    }
  };

  const renderNavigation = () => (
    <div className="mentor-resource-navigation-container">
    <div className="mentor-resource-navigation-tabs">
      {[
        { key: 'video', label: 'Video', icon: Video },
        { key: 'notes', label: 'Notes', icon: FileText },
        { key: 'items', label: 'Items', icon: Link }
      ].map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.key}
            className={`mentor-resource-nav-tab ${activeSection === section.key ? 'active' : ''}`}
            onClick={() => setActiveSection(section.key)}
          >
            <Icon className="mentor-resource-nav-icon" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </div>
    </div>
  );

  // Render action buttons for items
  const renderActionButtons = (type, item) => (
    <div className="mentor-resource-action-buttons">
      {(type === 'video' || type === 'note' || type === 'item') && (
        <button
          className="mentor-resource-btn mentor-resource-btn-outline mentor-resource-btn-sm"
          onClick={() => handleView(type, item)}
          title="View"
        >
          <Eye className="mentor-resource-btn-icon" />
        </button>
      )}
      {(type === 'videoFolder' || type === 'folder' || type === 'item') && (
        <button
          className="mentor-resource-btn mentor-resource-btn-outline mentor-resource-btn-sm"
          onClick={() => handleEdit(type, item)}
          title="Edit"
        >
          <Edit className="mentor-resource-btn-icon" />
        </button>
      )}
      <button
        className="mentor-resource-btn mentor-resource-btn-outline mentor-resource-btn-sm mentor-resource-btn-danger"
        onClick={() => handleDelete(type, item._id)}
        title="Delete"
      >
        <Trash2 className="mentor-resource-btn-icon" />
      </button>
    </div>
  );

  // Render view page
  const renderViewPage = () => {
    if (!selectedItem) return null;

    const { type, item } = selectedItem;

    return (
      <div>
        <div className="mentor-resource-section-header">
          <h2 className="mentor-resource-section-title">
            {type === 'video' && 'Video Details'}
            {type === 'note' && 'Note Details'}
            {type === 'item' && 'Item Details'}
          </h2>
          <button
            className="mentor-resource-btn mentor-resource-btn-outline"
            onClick={() => {
              setCurrentView(currentView === 'history' ? 'history' : 'list');
              setSelectedItem(null);
            }}
          >
            <ArrowLeft className="mentor-resource-back-icon" />
            Back
          </button>
        </div>

        <div className="mentor-resource-view-content">
          <div className="mentor-resource-view-card">
            <h3 className="mentor-resource-view-title">{item.title}</h3>
            
            {type === 'video' && (
              <div className="mentor-resource-video-content">
                {item.videoLink ? (
                  item.videoLink.includes('youtube.com') || item.videoLink.includes('youtu.be') ? (
                    <iframe
                      width="100%"
                      height="450"
                      src={item.videoLink.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      frameBorder="0"
                      allowFullScreen
                      className="mentor-resource-video-iframe"
                    ></iframe>
                  ) : (
                    <video controls width="100%" height="450">
                      <source src={item.videoLink} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )
                ) : (
                  <video controls width="100%" height="450">
                    <source src={`${config.backendUrl}/hackvideos/stream/${item._id}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}

            {type === 'note' && (
              <div className="mentor-resource-note-content">
                <div className="mentor-resource-note-actions">
                  <a
                    href={`${config.backendUrl}/hacknotes/download/${item._id}`}
                    className="mentor-resource-btn mentor-resource-btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mentor-resource-btn-icon" />
                    Download PDF
                  </a>
                </div>
                <iframe
                  src={`${config.backendUrl}/hacknotes/stream/${item._id}`}
                  width="100%"
                  height="600"
                  title={item.title}
                  className="mentor-resource-pdf-viewer"
                >
                  This browser does not support PDFs. Please download the PDF to view it.
                </iframe>
              </div>
            )}

            {type === 'item' && (
              <div className="mentor-resource-item-content">
                <p className="mentor-resource-item-description">{item.description}</p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mentor-resource-btn mentor-resource-btn-primary"
                >
                  Visit Link
                </a>
              </div>
            )}

            <div className="mentor-resource-view-metadata">
              <div className={`mentor-resource-status-badge ${getStatusClass(item.status)}`}>
                {getStatusIcon(item.status)}
                {item.status || 'pending'}
              </div>
              <div className="mentor-resource-view-date">
                Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit modal
  const renderEditModal = () => {
    if (!editingItem) return null;

    const { type, item } = editingItem;

    return (
      <div className="mentor-resource-edit-modal-overlay">
        <div className="mentor-resource-edit-modal">
          <div className="mentor-resource-edit-modal-header">
            <h3>Edit {type === 'videoFolder' ? 'Video Folder' : type === 'folder' ? 'Notes Folder' : 'Item'}</h3>
            <button onClick={() => setEditingItem(null)} className="mentor-resource-close-btn">
              <X />
            </button>
          </div>
          
          <div className="mentor-resource-edit-modal-content">
            <div className="mentor-resource-form-group">
              <label className="mentor-resource-form-label">Title</label>
              <input
                type="text"
                className="mentor-resource-form-input"
                value={item.title}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  item: { ...item, title: e.target.value }
                })}
              />
            </div>
            
            {(type === 'videoFolder' || type === 'folder') && (
              <div className="mentor-resource-form-group">
                <label className="mentor-resource-form-label">Description</label>
                <textarea
                  className="mentor-resource-form-textarea"
                  value={item.description || ''}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    item: { ...item, description: e.target.value }
                  })}
                  rows={3}
                />
              </div>
            )}
            
            {type === 'item' && (
              <>
                <div className="mentor-resource-form-group">
                  <label className="mentor-resource-form-label">Description</label>
                  <textarea
                    className="mentor-resource-form-textarea"
                    value={item.description || ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      item: { ...item, description: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
                <div className="mentor-resource-form-group">
                  <label className="mentor-resource-form-label">Link</label>
                  <input
                    type="url"
                    className="mentor-resource-form-input"
                    value={item.link || ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      item: { ...item, link: e.target.value }
                    })}
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="mentor-resource-edit-modal-actions">
            <button onClick={() => setEditingItem(null)} className="mentor-resource-btn mentor-resource-btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveEdit} className="mentor-resource-btn mentor-resource-btn-primary">
              <Save className="mentor-resource-btn-icon" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderVideoSection = () => {
    if (currentView === 'view') {
      return renderViewPage();
    }

    if (currentView === 'history') {
      return (
        <div>
          <div className="mentor-resource-section-header">
            <h2 className="mentor-resource-section-title">Video History</h2>
            <button
              className="mentor-resource-btn mentor-resource-btn-outline"
              onClick={() => setCurrentView('list')}
            >
              <ArrowLeft className="mentor-resource-back-icon" />
              Back
            </button>
          </div>

          <div className="mentor-resource-history-section">
            <div className="mentor-resource-history-group">
              <h3 className="mentor-resource-history-title">Video Folders</h3>
              <div className="mentor-resource-card-grid">
                {videoFolders.map((folder) => (
                  <div key={folder._id} className="mentor-resource-card">
                    <div className="mentor-resource-card-header">
                      <h4 className="mentor-resource-card-title">{folder.title}</h4>
                      <div className={`mentor-resource-status-badge ${getStatusClass(folder.status)}`}>
                        {getStatusIcon(folder.status)}
                        {folder.status || 'pending'}
                      </div>
                    </div>
                    <p className="mentor-resource-card-description">{folder.description}</p>
                    <div className="mentor-resource-card-footer">
                      <div className="mentor-resource-card-date">
                        {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                      {renderActionButtons('videoFolder', folder)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mentor-resource-history-group">
              <h3 className="mentor-resource-history-title">Videos</h3>
              <div className="mentor-resource-list-items">
                {videos.map((video) => (
                  <div key={video._id} className="mentor-resource-list-item">
                    <div className="mentor-resource-list-item-header">
                      <h4 className="mentor-resource-list-item-title">{video.title}</h4>
                      <div className={`mentor-resource-status-badge ${getStatusClass(video.status)}`}>
                        {getStatusIcon(video.status)}
                        {video.status || 'pending'}
                      </div>
                    </div>
                    <div className="mentor-resource-list-item-footer">
                      <div className="mentor-resource-list-item-tags">
                        <span className="mentor-resource-tag">
                          {video.videoLink ? 'Link' : 'File'}
                        </span>
                      </div>
                      <div className="mentor-resource-list-item-actions">
                        <span className="mentor-resource-list-item-date">
                          {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        {renderActionButtons('video', video)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="mentor-resource-section-header">
          <h2 className="mentor-resource-section-title">Video Management</h2>
          <button
            className="mentor-resource-btn mentor-resource-btn-outline"
            onClick={() => setCurrentView('history')}
          >
            <Eye className="mentor-resource-nav-icon" />
            History
          </button>
        </div>

        <div className="mentor-resource-forms-container">
          {/* Create Video Folder Form */}
          <div className="mentor-resource-form-card">
            <div 
              className="mentor-resource-form-header-collapsible"
              onClick={() => toggleForm('videoFolder')}
            >
              <h3 className="mentor-resource-form-title">Create Video Folder</h3>
              <button className="mentor-resource-add-btn">
                {expandedForms.videoFolder ? '−' : '+'}
              </button>
            </div>
            {expandedForms.videoFolder && (
              <form onSubmit={handleVideoFolderSubmit} className="mentor-resource-form">
                <div className="mentor-resource-form-group">
                  <label htmlFor="title" className="mentor-resource-form-label">Title</label>
                  <input
                    id="title"
                    type="text"
                    className="mentor-resource-form-input"
                    value={videoFolderForm.title}
                    onChange={(e) => setVideoFolderForm({...videoFolderForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mentor-resource-form-group">
                  <label htmlFor="description" className="mentor-resource-form-label">Description</label>
                  <textarea
                    id="description"
                    className="mentor-resource-form-textarea"
                    value={videoFolderForm.description}
                    onChange={(e) => setVideoFolderForm({...videoFolderForm, description: e.target.value})}
                    rows={3}
                    required
                  />
                </div>
                <div className="mentor-resource-form-group">
                  <label htmlFor="thumbnail" className="mentor-resource-form-label">Thumbnail Image</label>
                  <input
                    id="thumbnail"
                    type="file"
                    className="mentor-resource-form-input"
                    accept="image/*"
                    onChange={(e) => setVideoFolderForm({...videoFolderForm, thumbnail: e.target.files[0]})}
                    required
                  />
                </div>
                <button type="submit" className="mentor-resource-btn mentor-resource-btn-primary">
                  Create Folder
                </button>
              </form>
            )}
          </div>

          {/* Upload Video Form */}
          <div className="mentor-resource-form-card">
            <div 
              className="mentor-resource-form-header-collapsible"
              onClick={() => toggleForm('video')}
            >
              <h3 className="mentor-resource-form-title">Upload Video</h3>
              <button className="mentor-resource-add-btn">
                {expandedForms.video ? '−' : '+'}
              </button>
            </div>
            {expandedForms.video && (
              <form onSubmit={handleVideoSubmit} className="mentor-resource-form">
                <div className="mentor-resource-form-group">
                  <label htmlFor="folder" className="mentor-resource-form-label">Select Video Folder</label>
                  <select 
                    className="mentor-resource-form-select"
                    value={videoForm.folderId} 
                    onChange={(e) => setVideoForm({...videoForm, folderId: e.target.value})}
                    required
                  >
                    <option value="">Choose a folder</option>
                    {videoFolders.filter(f => f.status === 'approved').map(folder => (
                      <option key={folder._id} value={folder._id}>{folder.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mentor-resource-form-group">
                  <label htmlFor="videoTitle" className="mentor-resource-form-label">Video Title</label>
                  <input
                    id="videoTitle"
                    type="text"
                    className="mentor-resource-form-input"
                    value={videoForm.title}
                    onChange={(e) => setVideoForm({...videoForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mentor-resource-form-group">
                  <label className="mentor-resource-form-label">Upload Type</label>
                  <div className="mentor-resource-radio-group">
                    <div className="mentor-resource-radio-item">
                      <input
                        type="radio"
                        id="link"
                        name="uploadType"
                        value="link"
                        checked={uploadType === 'link'}
                        onChange={(e) => setUploadType(e.target.value)}
                      />
                      <label htmlFor="link">Video Link</label>
                    </div>
                    <div className="mentor-resource-radio-item">
                      <input
                        type="radio"
                        id="file"
                        name="uploadType"
                        value="file"
                        checked={uploadType === 'file'}
                        onChange={(e) => setUploadType(e.target.value)}
                      />
                      <label htmlFor="file">Upload File</label>
                    </div>
                  </div>
                </div>

                {uploadType === 'link' ? (
                  <div className="mentor-resource-form-group">
                    <label htmlFor="videoLink" className="mentor-resource-form-label">Video Link</label>
                    <input
                      id="videoLink"
                      type="url"
                      className="mentor-resource-form-input"
                      value={videoForm.videoLink}
                      onChange={(e) => setVideoForm({...videoForm, videoLink: e.target.value})}
                      placeholder="https://youtube.com/watch?v=..."
                      required
                    />
                  </div>
                ) : (
                  <div className="mentor-resource-form-group">
                    <label htmlFor="videoFile" className="mentor-resource-form-label">Upload Video File</label>
                    <input
                      id="videoFile"
                      type="file"
                      className="mentor-resource-form-input"
                      accept="video/*"
                      onChange={(e) => setVideoForm({...videoForm, videoFile: e.target.files[0]})}
                      required
                    />
                  </div>
                )}

                <button type="submit" className="mentor-resource-btn mentor-resource-btn-primary">
                  Upload Video
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNotesSection = () => {
    if (currentView === 'view') {
      return renderViewPage();
    }

    if (currentView === 'history') {
      return (
        <div>
          <div className="mentor-resource-section-header">
            <h2 className="mentor-resource-section-title">Notes History</h2>
            <button
              className="mentor-resource-btn mentor-resource-btn-outline"
              onClick={() => setCurrentView('list')}
            >
              <ArrowLeft className="mentor-resource-back-icon" />
              Back
            </button>
          </div>

          <div className="mentor-resource-history-section">
            <div className="mentor-resource-history-group">
              <h3 className="mentor-resource-history-title">Notes Folders</h3>
              <div className="mentor-resource-card-grid">
                {folders.map((folder) => (
                  <div key={folder._id} className="mentor-resource-card">
                    <div className="mentor-resource-card-header">
                      <h4 className="mentor-resource-card-title">{folder.title}</h4>
                      <div className={`mentor-resource-status-badge ${getStatusClass(folder.status)}`}>
                        {getStatusIcon(folder.status)}
                        {folder.status || 'pending'}
                      </div>
                    </div>
                    <p className="mentor-resource-card-description">{folder.description}</p>
                    <div className="mentor-resource-card-footer">
                      <div className="mentor-resource-card-date">
                        {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                      {renderActionButtons('folder', folder)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mentor-resource-history-group">
              <h3 className="mentor-resource-history-title">Notes</h3>
              <div className="mentor-resource-list-items">
                {notes.map((note) => (
                  <div key={note._id} className="mentor-resource-list-item">
                    <div className="mentor-resource-list-item-header">
                      <h4 className="mentor-resource-list-item-title">{note.title}</h4>
                      <div className={`mentor-resource-status-badge ${getStatusClass(note.status)}`}>
                        {getStatusIcon(note.status)}
                        {note.status || 'pending'}
                      </div>
                    </div>
                    <div className="mentor-resource-list-item-footer">
                      <div className="mentor-resource-list-item-tags">
                        <span className="mentor-resource-tag">PDF</span>
                      </div>
                      <div className="mentor-resource-list-item-actions">
                        <span className="mentor-resource-list-item-date">
                          {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        {renderActionButtons('note', note)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="mentor-resource-section-header">
          <h2 className="mentor-resource-section-title">Notes Management</h2>
          <button
            className="mentor-resource-btn mentor-resource-btn-outline"
            onClick={() => setCurrentView('history')}
          >
            <Eye className="mentor-resource-nav-icon" />
            History
          </button>
        </div>

        <div className="mentor-resource-forms-container">
          {/* Create Notes Folder Form */}
          <div className="mentor-resource-form-card">
            <div 
              className="mentor-resource-form-header-collapsible"
              onClick={() => toggleForm('notesFolder')}
            >
              <h3 className="mentor-resource-form-title">Create Notes Folder</h3>
              <button className="mentor-resource-toggle-btn">
                {expandedForms.notesFolder ? '−' : '+'}
              </button>
            </div>
            {expandedForms.notesFolder && (
              <form onSubmit={handleFolderSubmit} className="mentor-resource-form">
                <div className="mentor-resource-form-group">
                  <label htmlFor="notesTitle" className="mentor-resource-form-label">Title</label>
                  <input
                    id="notesTitle"
                    type="text"
                    className="mentor-resource-form-input"
                    value={folderForm.title}
                    onChange={(e) => setFolderForm({...folderForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mentor-resource-form-group">
                  <label htmlFor="notesDescription" className="mentor-resource-form-label">Description</label>
                  <textarea
                    id="notesDescription"
                    className="mentor-resource-form-textarea"
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({...folderForm, description: e.target.value})}
                    rows={3}
                    required
                  />
                </div>
                <button type="submit" className="mentor-resource-btn mentor-resource-btn-primary">
                  Create Folder
                </button>
              </form>
            )}
          </div>

          {/* Upload Note Form */}
          <div className="mentor-resource-form-card">
            <div 
              className="mentor-resource-form-header-collapsible"
              onClick={() => toggleForm('note')}
            >
              <h3 className="mentor-resource-form-title">Upload Note</h3>
              <button className="mentor-resource-toggle-btn">
                {expandedForms.note ? '−' : '+'}
              </button>
            </div>
            {expandedForms.note && (
              <form onSubmit={handleNoteSubmit} className="mentor-resource-form">
                <div className="mentor-resource-form-group">
                  <label htmlFor="noteFolder" className="mentor-resource-form-label">Select Notes Folder</label>
                  <select 
                    className="mentor-resource-form-select"
                    value={noteForm.folderId} 
                    onChange={(e) => setNoteForm({...noteForm, folderId: e.target.value})}
                    required
                  >
                    <option value="">Choose a folder</option>
                    {folders.filter(f => f.status === 'approved').map(folder => (
                      <option key={folder._id} value={folder._id}>{folder.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mentor-resource-form-group">
                  <label htmlFor="noteTitle" className="mentor-resource-form-label">Note Title</label>
                  <input
                    id="noteTitle"
                    type="text"
                    className="mentor-resource-form-input"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mentor-resource-form-group">
                  <label htmlFor="notePdf" className="mentor-resource-form-label">Upload PDF File</label>
                  <input
                    id="notePdf"
                    type="file"
                    className="mentor-resource-form-input"
                    accept=".pdf"
                    onChange={(e) => setNoteForm({...noteForm, pdf: e.target.files[0]})}
                    required
                  />
                </div>
                <button type="submit" className="mentor-resource-btn mentor-resource-btn-primary">
                  Upload Note
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderItemsSection = () => {
    if (currentView === 'view') {
      return renderViewPage();
    }

    if (currentView === 'history') {
      return (
        <div>
          <div className="mentor-resource-section-header">
            <h2 className="mentor-resource-section-title">Items History</h2>
            <button
              className="mentor-resource-btn mentor-resource-btn-outline"
              onClick={() => setCurrentView('list')}
            >
              <ArrowLeft className="mentor-resource-back-icon" />
              Back
            </button>
          </div>

          <div className="mentor-resource-history-section">
            <div className="mentor-resource-history-group">
              <h3 className="mentor-resource-history-title">Items</h3>
              <div className="mentor-resource-card-grid">
                {items.map((item) => (
                  <div key={item._id} className="mentor-resource-card">
                    <div className="mentor-resource-card-header">
                      <h4 className="mentor-resource-card-title">{item.title}</h4>
                      <div className={`mentor-resource-status-badge ${getStatusClass(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status || 'pending'}
                      </div>
                    </div>
                    <p className="mentor-resource-card-description">{item.description}</p>
                    <div className="mentor-resource-card-footer">
                      <div className="mentor-resource-card-tags">
                        <span className="mentor-resource-tag">
                          <Link className="mentor-resource-tag-icon" />
                          Link
                        </span>
                      </div>
                      <div className="mentor-resource-card-actions">
                        <div className="mentor-resource-card-date">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        {renderActionButtons('item', item)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="mentor-resource-section-header">
          <h2 className="mentor-resource-section-title">Items Management</h2>
          <button
            className="mentor-resource-btn mentor-resource-btn-outline"
            onClick={() => setCurrentView('history')}
          >
            <Eye className="mentor-resource-nav-icon" />
            History
          </button>
        </div>

        <div className="mentor-resource-forms-container">
          {/* Create Item Form */}
          <div className="mentor-resource-form-card">
            <div 
              className="mentor-resource-form-header-collapsible"
              onClick={() => toggleForm('item')}
            >
              <h3 className="mentor-resource-form-title">Create Item</h3>
              <button className="mentor-resource-add-btn">
                {expandedForms.item ? '−' : '+'}
              </button>
            </div>
            {expandedForms.item && (
              <form onSubmit={handleItemSubmit} className="mentor-resource-form">
                <div className="mentor-resource-form-group">
                  <label htmlFor="itemTitle" className="mentor-resource-form-label">Title</label>
                  <input
                    id="itemTitle"
                    type="text"
                    className="mentor-resource-form-input"
                    value={itemForm.title}
                    onChange={(e) => setItemForm({...itemForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mentor-resource-form-group">
                  <label htmlFor="itemDescription" className="mentor-resource-form-label">Description</label>
                  <textarea
                    id="itemDescription"
                    className="mentor-resource-form-textarea"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                    rows={3}
                    required
                  />
                </div>
                <div className="mentor-resource-form-group">
                  <label htmlFor="itemLink" className="mentor-resource-form-label">Link</label>
                  <input
                    id="itemLink"
                    type="url"
                    className="mentor-resource-form-input"
                    value={itemForm.link}
                    onChange={(e) => setItemForm({...itemForm, link: e.target.value})}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <button type="submit" className="mentor-resource-btn mentor-resource-btn-primary">
                  Create Item
                </button>
              </form>
            )}
          </div>
        </div>
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

  const navigate = useNavigate();

  // Route protection: redirect to signup if token is missing/expired
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="hack-mentor-container">
      <div className="mentor-resource-main-content">
        <ToastContainer />
        <div className="mentor-resource-header">
          <h1 className="mentor-resource-main-title">Mentor Resource Management Portal</h1>
        </div>

        {renderNavigation()}
        {renderCurrentSection()}
        {renderEditModal()}
      </div>
    </div>
  )}
  export default HackMentorResource;