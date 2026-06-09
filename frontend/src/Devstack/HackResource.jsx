import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, FileText, Link, Play, Download, ExternalLink, X, ArrowLeft } from 'lucide-react';
import config from '../config';
import './HackResource.css';

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

const ResourcePage = () => {
  const [activeSection, setActiveSection] = useState('video');
  const [currentView, setCurrentView] = useState('folders'); // folders, videos, overlay
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [videoFolders, setVideoFolders] = useState([]);
  const [folders, setFolders] = useState([]);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [items, setItems] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();

  // Route protection: redirect to signup if token is missing/expired
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      navigate('/login');
    }
  }, [navigate]);

  // Helper function to get and validate auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
      console.error('No authentication token found in localStorage');
      alert('Please log in again. No authentication token found.');
      return null;
    }
    
    return token.trim(); // Remove any whitespace
  };

  // Fetch approved resources on mount and when switching sections
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      console.error('No token available, skipping API calls');
      return;
    }

    if (activeSection === 'video') {
      fetchApprovedVideoFolders();
    }

    if (activeSection === 'notes') {
      fetchApprovedFolders();
    }

    if (activeSection === 'items') {
      fetchApprovedItems();
    }
  }, [activeSection]);

  const fetchApprovedVideoFolders = async () => {
    const token = getAuthToken();
    if (!token) return;
    
    try {
      console.log('Making request to:', `${config.backendUrl}/hackvideofolder/status/approved`);
      const response = await fetch(`${config.backendUrl}/hackvideofolder/status/approved`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setVideoFolders(data);
    } catch (error) {
      console.error('Error fetching approved video folders:', error);
      setVideoFolders([]);
    }
  };

  const fetchApprovedFolders = async () => {
    const token = getAuthToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/hackfolder/status/approved`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching approved folders:', error);
      setFolders([]);
    }
  };

  const fetchApprovedItems = async () => {
    const token = getAuthToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/hackitems/status/approved`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching approved items:', error);
      setItems([]);
    }
  };

  const fetchVideosInFolder = async (folderId) => {
    const token = getAuthToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/hackvideos/folder/${folderId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      // Filter only approved videos
      const approvedVideos = data.filter(video => video.status === 'approved');
      setVideos(approvedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    }
  };

  const fetchNotesInFolder = async (folderId) => {
    const token = getAuthToken();
    if (!token) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/hacknotes/folder/${folderId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      // Filter only approved notes
      const approvedNotes = data.filter(note => note.status === 'approved');
      setNotes(approvedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    }
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    if (activeSection === 'video') {
      fetchVideosInFolder(folder._id);
      setCurrentView('videos');
    } else if (activeSection === 'notes') {
      fetchNotesInFolder(folder._id);
      setCurrentView('videos'); // Reuse the same view for notes
    }
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setShowOverlay(true);
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setShowOverlay(true);
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setSelectedVideo(null);
    setSelectedNote(null);
  };

  const backToFolders = () => {
    setCurrentView('folders');
    setSelectedFolder(null);
    setVideos([]);
    setNotes([]);
  };

  const renderNavigation = () => (
    <div className="resource-nav-container">
    <div className="resource-navigation">
      {[
        { key: 'video', label: 'Videos', icon: Video },
        { key: 'notes', label: 'Notes', icon: FileText },
        { key: 'items', label: 'Resources', icon: Link }
      ].map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.key}
            className={`resource-nav-tab ${activeSection === section.key ? 'active' : ''}`}
            onClick={() => {
              setActiveSection(section.key);
              setCurrentView('folders');
              setSelectedFolder(null);
              setVideos([]);
              setNotes([]);
            }}
          >
            <Icon className="resource-nav-icon" />
            <span>{section.label}</span>
          </button>
        );
      })}
    </div>
    </div>
  );

  const renderVideoOverlay = () => {
    if (!selectedVideo) return null;

    return (
      <div className="resource-overlay">
        <div className="resource-overlay-content">
          <button onClick={closeOverlay} className="resource-overlay-close">
            <X className="resource-overlay-close-icon" />
          </button>

          <h2 className="resource-overlay-title">{selectedVideo.title}</h2>
          
          {selectedVideo.videoLink ? (
            <div>
              {selectedVideo.videoLink.includes('youtube.com') || selectedVideo.videoLink.includes('youtu.be') ? (
                <iframe
                  width="800"
                  height="450"
                  src={selectedVideo.videoLink.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  frameBorder="0"
                  allowFullScreen
                  className="resource-video-iframe"
                ></iframe>
              ) : (
                <video controls width="800" height="450" className="resource-video">
                  <source src={selectedVideo.videoLink} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <video controls width="800" height="450" className="resource-video">
              <source src={`${config.backendUrl}/hackvideos/stream/${selectedVideo._id}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    );
  };

  const renderNoteOverlay = () => {
    if (!selectedNote) return null;

    const token = getAuthToken();
    const downloadUrl = token ? `${config.backendUrl}/hacknotes/download/${selectedNote._id}` : '#';
    const streamUrl = token ? `${config.backendUrl}/hacknotes/stream/${selectedNote._id}` : '';

    return (
      <div className="resource-overlay">
        <div className="resource-overlay-content">
          <button onClick={closeOverlay} className="resource-overlay-close">
            <X className="resource-overlay-close-icon" />
          </button>

          <div className="resource-note-header">
            <h2 className="resource-overlay-title">{selectedNote.title}</h2>
            {token && (
              <a
                href={downloadUrl}
                className="resource-download-btn"
                onClick={() => {
                  // Add authorization header for download
                  fetch(downloadUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                  .then(response => response.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `${selectedNote.title}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  })
                  .catch(error => console.error('Download error:', error));
                }}
              >
                <Download className="resource-download-icon" />
                Download
              </a>
            )}
          </div>
          
          {token && streamUrl && (
            <iframe
              src={streamUrl}
              width="800"
              height="600"
              title={selectedNote.title}
              className="resource-pdf-viewer"
            >
              This browser does not support PDFs. Please download the PDF to view it.
            </iframe>
          )}
        </div>
      </div>
    );
  };

  const renderVideoSection = () => {
    if (currentView === 'videos' && selectedFolder) {
      return (
        <div>
          <div className="resource-section-header">
            <div>
              <button className="resource-back-btn" onClick={backToFolders}>
                <ArrowLeft className="resource-back-icon" />
                Back to Folders
              </button>
              <h2 className="resource-section-title">{selectedFolder.title}</h2>
            </div>
          </div>

          {videos.length === 0 ? (
            <div className="resource-empty-state">
              <Video className="resource-empty-icon" />
              <p>No approved videos in this folder yet.</p>
            </div>
          ) : (
            <div className="resource-grid">
              {videos.map((video) => (
                <div key={video._id} className="resource-card" onClick={() => handleVideoClick(video)}>
                  <div className="resource-thumbnail">
                    {video.videoLink && video.videoLink.includes('youtube.com') ? (
                      <div className="resource-youtube-container">
                        <img
                          src={`https://img.youtube.com/vi/${video.videoLink.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`}
                          alt={video.title}
                          className="resource-youtube-thumb"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="resource-placeholder">
                          <Play className="resource-play-icon" />
                        </div>
                        <div className="resource-play-overlay">
                          <Play className="resource-play-overlay-icon" />
                        </div>
                      </div>
                    ) : (
                      <div className="resource-video-placeholder">
                        <Play className="resource-play-icon" />
                      </div>
                    )}
                  </div>
                  <h4 className="resource-card-title">{video.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Folders view
    return (
      <div>
        <div className="resource-section-header">
          <h2 className="resource-section-title">Video Folders</h2>
        </div>

        {videoFolders.length === 0 ? (
          <div className="resource-empty-state">
            <Video className="resource-empty-icon" />
            <p>No approved video folders available yet.</p>
          </div>
        ) : (
          <div className="resource-grid">
            {videoFolders.map((folder) => (
              <div key={folder._id} className="resource-card" onClick={() => handleFolderClick(folder)}>
                <div className="resource-thumbnail">
                  <img
                    src={`${config.backendUrl}/hackvideofolder/thumbnail/${folder._id}`}
                    alt={folder.title}
                    className="resource-folder-thumb"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="resource-folder-placeholder">
                    <Video className="resource-folder-icon" />
                  </div>
                </div>
                <h4 className="resource-card-title">{folder.title}</h4>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNotesSection = () => {
    if (currentView === 'videos' && selectedFolder) {
      return (
        <div>
          <div className="resource-section-header">
            <div>
              <button className="resource-back-btn" onClick={backToFolders}>
                <ArrowLeft className="resource-back-icon" />
                Back to Folders
              </button>
              <h2 className="resource-section-title">{selectedFolder.title}</h2>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="resource-empty-state">
              <FileText className="resource-empty-icon" />
              <p>No approved notes in this folder yet.</p>
            </div>
          ) : (
            <div className="resource-notes-list">
              {notes.map((note) => {
                const token = getAuthToken();
                return (
                  <div key={note._id} className="resource-note-item" onClick={() => handleNoteClick(note)}>
                    <div className="resource-note-content">
                      <div className="resource-note-icon-container">
                        <FileText className="resource-note-icon" />
                      </div>
                      <h4 className="resource-note-title">{note.title}</h4>
                    </div>
                    {token && (
                      <a
                        href="#"
                        className="resource-note-download"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Add authorization header for download
                          fetch(`${config.backendUrl}/hacknotes/download/${note._id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          })
                          .then(response => response.blob())
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.style.display = 'none';
                            a.href = url;
                            a.download = `${note.title}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          })
                          .catch(error => console.error('Download error:', error));
                        }}
                      >
                        <Download className="resource-download-icon" />
                        Download
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Folders view
    return (
      <div>
        <div className="resource-section-header">
          <h2 className="resource-section-title">Notes Folders</h2>
        </div>

        {folders.length === 0 ? (
          <div className="resource-empty-state">
            <FileText className="resource-empty-icon" />
            <p>No approved note folders available yet.</p>
          </div>
        ) : (
          <div className="resource-grid">
            {folders.map((folder) => (
              <div key={folder._id} className="resource-card" onClick={() => handleFolderClick(folder)}>
                <div className="resource-thumbnail">
                  <div className="resource-notes-folder-placeholder">
                    <FileText className="resource-folder-icon" />
                  </div>
                </div>
                <h4 className="resource-card-title">{folder.title}</h4>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderItemsSection = () => {
    return (
      <div>
        <div className="resource-section-header">
          <h2 className="resource-section-title">Resource Links</h2>
        </div>

        {items.length === 0 ? (
          <div className="resource-empty-state">
            <Link className="resource-empty-icon" />
            <p>No approved resource links available yet.</p>
          </div>
        ) : (
          <div className="resource-grid">
            {items.map((item) => (
              <div key={item._id} className="resource-card">
                <div className="resource-thumbnail">
                  <div className="resource-link-placeholder">
                    <Link className="resource-link-icon" />
                  </div>
                </div>
                <h4 className="resource-card-title">{item.title}</h4>
                <div className="resource-item-actions">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-visit-btn"
                  >
                    <ExternalLink className="resource-visit-icon" />
                    Visit
                  </a>
                </div>
              </div>
            ))}
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
    <div className="resource-container">
      <div className="resource-content">
        <div className="resource-header">
          <h1 className="resource-main-title">Resources</h1>
        </div>

        {renderNavigation()}
        {renderCurrentSection()}

        {/* Video Overlay */}
        {showOverlay && selectedVideo && renderVideoOverlay()}
        
        {/* Note Overlay */}
        {showOverlay && selectedNote && renderNoteOverlay()}
      </div>
    </div>
  );
};

export default ResourcePage;