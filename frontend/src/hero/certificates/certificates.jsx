import React, { useState, useEffect } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import config from '../../config';

const API_BASE_URL = `${config.backendUrl}/pdf`;

// Add custom CSS to hide the Open File button
const customCSS = `
  /* Hide the Open file button */
  .rpv-open__input-button,
  [data-testid="open__popover-target-button"],
  button[aria-label="Open"],
  button[aria-label="Open file"],
  .rpv-toolbar__item:has(button[aria-label="Open"]),
  .rpv-toolbar__item:has(button[aria-label="Open file"]) {
    display: none !important;
  }
`;

const containerStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '20px',
};

export default function PDFViewer() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    toolbarPlugin: {
      toolbarSlot: {
        Open: () => <></>,
      },
    },
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = customCSS;
    document.head.appendChild(style);

    fetchLatestPdf();

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchLatestPdf = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/latest`);
      const blob = await response.blob();
      setPdfUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Error fetching latest PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading latest Certificates...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign:'center', marginBottom: '20px', color:'#003049' }}>Certificate's</h1>
      
      {pdfUrl ? (
        <div style={{ height: '800px' }}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={pdfUrl}
              plugins={[defaultLayoutPluginInstance]}
              onDocumentLoad={() => {
                // Hide open button after document loads
                const openButtons = document.querySelectorAll('.rpv-open__input-button, [data-testid="open__popover-target-button"], button[aria-label="Open"], button[aria-label="Open file"]');
                openButtons.forEach(button => {
                  if (button.parentElement) {
                    button.parentElement.style.display = 'none';
                  }
                });
              }}
            />
          </Worker>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Sorry for Inconvenience. Please try again later.
        </div>
      )}
    </div>
  );
}