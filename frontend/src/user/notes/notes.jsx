import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './notes.css';
import config from '../../config';
const API_BASE_URL = `${config.backendUrl}/notes`;

function FolderCard({ folder, onSelectFolder }) {
  return (
    <div className="folder-card-notes" onClick={() => onSelectFolder(folder)}>
      <h3>{folder.folderTitle}</h3>
      <p>{folder.files.length} files</p>
    </div>
  );
}

function PDFViewer({ fileUrl }) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  
  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
      <div style={{ height: '100%' }}>
        <Viewer
          fileUrl={fileUrl}
          plugins={[defaultLayoutPluginInstance]}
          key={fileUrl} // Add key prop to force re-render when URL changes
        />
      </div>
    </Worker>
  );
}

function App() {
  const [folders, setFolders] = useState([]);
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFolderFiles, setSelectedFolderFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folderSearchTerm, setFolderSearchTerm] = useState('');
  const [pdfSearchTerm, setPdfSearchTerm] = useState('');

  useEffect(() => {
    async function fetchFolders() {
      try {
        const response = await axios.get(API_BASE_URL);
        setFolders(response.data);
        setFilteredFolders(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFolders();
  }, []);

  useEffect(() => {
    const result = folders.filter(folder =>
      folder.folderTitle.toLowerCase().includes(folderSearchTerm.toLowerCase())
    );
    setFilteredFolders(result);
  }, [folderSearchTerm, folders]);

  useEffect(() => {
    if (selectedFolder) {
      const result = selectedFolder.files.filter(file =>
        file.fileName.toLowerCase().includes(pdfSearchTerm.toLowerCase())
      );
      setSelectedFolderFiles(result);
    }
  }, [pdfSearchTerm, selectedFolder]);

  async function handleFolderSelect(folder) {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/${folder._id}/files`);
      const fullFileDetails = response.data.map((fileMetadata, index) => ({
        ...fileMetadata,
        _id: folder.files[index]?._id,
      }));
      fullFileDetails.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      setSelectedFolder(folder);
      setSelectedFolderFiles(fullFileDetails);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) return <div className="loading-overlay"><div className="loading-dots"><div></div><div></div><div></div></div></div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="notes-container">
      <h1 className='pdf-title'>Notes</h1> {/* Updated title */}

      {!selectedFolder ? (
        <>
          <input
            type="text"
            placeholder="Search folders..."
            value={folderSearchTerm}
            onChange={(e) => setFolderSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="folders-grid">
            {filteredFolders.map(folder => (
              <FolderCard
                key={folder._id}
                folder={folder}
                onSelectFolder={handleFolderSelect}
              />
            ))}
          </div>
        </>
      ) : (
        <div>
          <div className="header-container">
            <button onClick={() => setSelectedFolder(null)} className="back-button">
              ← Back to Folders
            </button>
            <input
              type="text"
              placeholder="Search PDFs..."
              value={pdfSearchTerm}
              onChange={(e) => setPdfSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <h2 className="folder-title">{selectedFolder.folderTitle}</h2>
          <div className="pdf-grid">
            {selectedFolderFiles.map((file) => (
              <div key={file._id} className="pdf-viewer-container">
                <h3>{file.fileName}</h3>
                <div className="pdf-scroll-container">
                  <PDFViewer 
                    fileUrl={`${API_BASE_URL}/files/${selectedFolder._id}/${file._id}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;