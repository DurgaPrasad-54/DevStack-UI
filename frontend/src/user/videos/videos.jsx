import React, { useState, useEffect } from 'react';
import './videos.css'; // Import the updated CSS
import config from '../../config';

const VideoGallery = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch folders on component mount
  useEffect(() => {
    const fetchFolders = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${config.backendUrl}/videos`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setFolders(data);
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
      setIsLoading(false);
    };
    fetchFolders();
  }, []);

  // Function to extract YouTube video ID from URL
  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Filter folders and videos based on search query
  const filteredFolders = folders.filter(folder =>
    folder.folderTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.videos.some(video => video.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredVideos = selectedFolder ? selectedFolder.videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleFolderSelect = (folder) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedFolder(folder);
      setIsLoading(false);
    }, 500); // Simulate loading delay
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    // Removed the fullscreen code
  };

  // Function to close modal when clicking outside the content
  const handleModalBackgroundClick = (e) => {
    if (e.target.className === 'video-modal') {
      setSelectedVideo(null);
    }
  };

  return (
    <div className="video-gallery-container">
      <h1 className="video-gallery-title">Video Resources</h1>

      {/* Search Bar */}
      <div className="back-button-container">
        {selectedFolder && (
          <button
            onClick={() => setSelectedFolder(null)}
            className="back-button"
          >
            ← Back to Folders
          </button>
        )}
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search videos or folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-videos"
            aria-label="Search videos or folders"
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="bouncing-loader">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}

      {!selectedFolder ? (
        <div className="folder-grid">
          {filteredFolders.length > 0 ? (
            filteredFolders.map((folder) => (
              <div 
                key={folder._id}
                className="folder-card fade-in"
                onClick={() => handleFolderSelect(folder)}
              >
                <div className="folder-thumbnail">
                  <img
                    src={folder.folderThumbnail}
                    alt={folder.folderTitle}
                    className="folder-image"
                  />
                </div>
                <div className="folder-details">
                  <h3 className="folder-title">{folder.folderTitle}</h3>
                </div>
              </div>
            ))
          ) : (
            <p>No folders or videos match your search.</p>
          )}
        </div>
      ) : (
        <div>
          <h2 className="folder-title">{selectedFolder.folderTitle}</h2>
          <div className="video-grid">
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <div 
                  key={video._id}
                  className="video-card fade-in"
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="video-thumbnail">
                    <img
                      src={`https://img.youtube.com/vi/${getYoutubeId(video.link)}/maxresdefault.jpg`}
                      alt={video.title}
                      className="video-image"
                    />
                  </div>
                  <div className="video-details">
                    <h3 className="video-title">{video.title}</h3>
                    <p className="video-description">{video.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No videos available in this folder.</p>
            )}
          </div>
        </div>
      )}

      {/* Video Modal - Modified to show as popup */}
      {selectedVideo && (
        <div className="video-modal" onClick={handleModalBackgroundClick}>
          <div className="video-modal-content slide-in-modal">
            <div className="modal-header">
              <h3>{selectedVideo.title}</h3>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="modal-close"
                aria-label="Close video"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="video-frame">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(selectedVideo.link)}`}
                  title={selectedVideo.title}
                  className="video-embed"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {selectedVideo.description && (
                <p className="modal-description">{selectedVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGallery;