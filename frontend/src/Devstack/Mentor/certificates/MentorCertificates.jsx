import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../../../config';
import './MentorCertificates.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { message } from 'antd';
import { 
  SafetyCertificateOutlined, 
  SearchOutlined, 
  DownloadOutlined,
  EyeOutlined,
  FileProtectOutlined,
  LaptopOutlined
} from '@ant-design/icons';

const MentorCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewCertificate, setPreviewCertificate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const certificateRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const mentorId = localStorage.getItem('mentor');
      if (!mentorId) {
        message.error('Please login to view your certificates');
        return;
      }

      const response = await axios.get(`${config.backendUrl}/hackcertificates/mentor/${mentorId}`);
      if (response.data.success) {
        setCertificates(response.data.certificates);
      }
    } catch (err) {
      message.error('Failed to fetch certificates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadCertificatePDF = async (cert) => {
    setPreviewCertificate(cert);
    
    setTimeout(async () => {
      const element = certificateRef.current;
      if (!element) return;

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Mentor_Certificate_${cert.hackathonName.replace(/\s+/g, '_')}_${cert.certificateNumber}.pdf`);
        message.success('Certificate downloaded successfully!');
      } catch (err) {
        console.error('Error generating PDF:', err);
        message.error('Failed to generate PDF');
      } finally {
        setPreviewCertificate(null);
      }
    }, 500);
  };

  // Certificate Template Component
  const CertificateTemplate = ({ certificate }) => {
    return (
      <div className="certificate-template" ref={certificateRef}>
        {/* Left decorative corner */}
        <div className="certificate-corner-left">
          <div className="corner-shape corner-shape-1"></div>
          <div className="corner-shape corner-shape-2"></div>
          <div className="corner-shape corner-shape-3"></div>
          <div className="corner-shape corner-shape-4"></div>
        </div>

        {/* Main content */}
        <div className="certificate-content">
          <h1 className="certificate-title">CERTIFICATE</h1>
          <div className="certificate-subtitle-line"></div>
          <h2 className="certificate-subtitle">OF MENTORSHIP</h2>
          
          <p className="presented-to">PROUDLY PRESENTED TO</p>
          
          <h3 className="recipient-name">{certificate.recipientName}</h3>
          
          <p className="certificate-description">
            For outstanding mentorship and guidance during the {certificate.hackathonName} hackathon. 
            Your dedication, expertise, and commitment to nurturing young talent have been instrumental 
            in shaping the success of participating teams. Your contributions to the {certificate.technology || 'technology'} domain 
            have made a lasting impact on our hackathon community.
          </p>

          <div className="certificate-signatures">
            <div className="signature-block">
              <div className="signature-line"></div>
              <p className="signature-label">COORDINATOR</p>
            </div>
            <div className="signature-block">
              <div className="signature-line"></div>
              <p className="signature-label">DIRECTOR</p>
            </div>
          </div>

          <div className="certificate-footer">
            <p className="certificate-number">Certificate No: {certificate.certificateNumber}</p>
            <p className="certificate-date">Issued: {formatDate(certificate.issuedAt)}</p>
          </div>
        </div>

        {/* Right side badge - circular only */}
        <div className="certificate-badge">
          <div className="badge-outer">
            <div className="badge-inner">
              <div className="badge-stars-top">★★★★★</div>
              <span className="badge-text-best">BEST</span>
              <span className="badge-text-award">AWARD</span>
              <div className="badge-stars-bottom">★★★★★</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mentor-certificates">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-certificates">
      <div className="certificates-header">
        <h1><SafetyCertificateOutlined /> My Mentorship Certificates</h1>
        <p>View and download your hackathon mentorship achievements</p>
      </div>

      {/* Search Dropdown */}
      <div className="search-container" ref={searchRef}>
        <div 
          className={`search-dropdown ${searchDropdownOpen ? 'open' : ''}`}
          onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
        >
          <SearchOutlined className="search-icon" />
          <span className="search-text">
            {searchQuery || 'Select Hackathon'}
          </span>
        </div>
        {searchDropdownOpen && (
          <div className="search-dropdown-menu">
            <div className="dropdown-search-input">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div 
              className="dropdown-item"
              onClick={() => { setSearchQuery(''); setSearchDropdownOpen(false); }}
            >
              All Hackathons
            </div>
            {[...new Set(certificates.map(c => c.hackathonName))]
              .filter(name => name?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(name => (
              <div 
                key={name}
                className={`dropdown-item ${searchQuery === name ? 'selected' : ''}`}
                onClick={() => { setSearchQuery(name); setSearchDropdownOpen(false); }}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      {certificates.length === 0 ? (
        <div className="no-certificates">
          <FileProtectOutlined className="no-cert-icon" />
          <h3>No Certificates Yet</h3>
          <p>Mentor in hackathons and earn your certificates!</p>
        </div>
      ) : (
        <div className="certificates-container">
          <div className="certificates-grid">
            {certificates
              .filter(cert => cert.hackathonName?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((cert) => (
              <div key={cert._id} className="certificate-card">
                {/* Mini Certificate Preview - Looks like actual certificate */}
                <div className="certificate-preview" onClick={() => setPreviewCertificate(cert)}>
                  <div className="mini-certificate">
                    <div className="mini-corner-left"></div>
                    <div className="mini-content">
                      <div className="mini-title">CERTIFICATE</div>
                      <div className="mini-subtitle">OF MENTORSHIP</div>
                      <div className="mini-presented">PROUDLY PRESENTED TO</div>
                      <div className="mini-name">{cert.recipientName}</div>
                      <div className="mini-hackathon">{cert.hackathonName}</div>
                    </div>
                    <div className="mini-badge-circle">
                      <span>★</span>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="card-info">
                  <h3 className="hackathon-name">{cert.hackathonName}</h3>
                  <p className="technology"><LaptopOutlined /> {cert.technology}</p>
                </div>

                {/* Action Buttons - Plain */}
                <div className="card-actions">
                  <button 
                    className="btn-plain"
                    onClick={() => setPreviewCertificate(cert)}
                  >
                    <EyeOutlined /> View
                  </button>
                  <span className="action-divider">|</span>
                  <button 
                    className="btn-plain"
                    onClick={() => downloadCertificatePDF(cert)}
                  >
                    <DownloadOutlined /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {previewCertificate && (
        <div className="certificate-modal-overlay" onClick={() => setPreviewCertificate(null)}>
          <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewCertificate(null)}>×</button>
            <CertificateTemplate certificate={previewCertificate} />
            <div className="modal-actions">
              <button 
                className="btn btn-download-modal"
                onClick={() => downloadCertificatePDF(previewCertificate)}
              >
                <DownloadOutlined /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden certificate for PDF generation */}
      {previewCertificate && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <CertificateTemplate certificate={previewCertificate} />
        </div>
      )}
    </div>
  );
};

export default MentorCertificates;
