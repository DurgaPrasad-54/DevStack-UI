import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../../../config';
import './StudentCertificates.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { message } from 'antd';
import { 
  SafetyCertificateOutlined, 
  SearchOutlined, 
  DownloadOutlined,
  EyeOutlined,
  FileProtectOutlined
} from '@ant-design/icons';

const StudentCertificates = () => {
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
      const studentId = localStorage.getItem('student');
      if (!studentId) {
        message.error('Please login to view your certificates');
        return;
      }

      const response = await axios.get(`${config.backendUrl}/hackcertificates/student/${studentId}`);
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

  const getAchievementLabel = (type) => {
    switch (type) {
      case 'champion': return 'Champion';
      case 'runner-up': return 'Runner Up';
      case 'third-place': return 'Third Place';
      case 'participant': return 'Participant';
      default: return type;
    }
  };

  const getAchievementColor = (type) => {
    switch (type) {
      case 'champion': return '#FFD700';
      case 'runner-up': return '#C0C0C0';
      case 'third-place': return '#CD7F32';
      case 'participant': return '#4A90D9';
      default: return '#333';
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
        pdf.save(`Certificate_${cert.hackathonName.replace(/\s+/g, '_')}_${cert.certificateNumber}.pdf`);
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
    const getAchievementTitle = (type) => {
      switch (type) {
        case 'champion': return 'CHAMPIONSHIP';
        case 'runner-up': return 'RUNNER UP';
        case 'third-place': return 'THIRD PLACE';
        case 'participant': return 'PARTICIPATION';
        default: return 'APPRECIATION';
      }
    };

    const getDescription = (cert) => {
      if (cert.achievementType === 'champion') {
        return `For achieving First Place in the ${cert.hackathonName} hackathon as a member of Team "${cert.teamName}". Your exceptional skills, innovation, and teamwork have earned you this prestigious recognition.`;
      }
      if (cert.achievementType === 'runner-up') {
        return `For achieving Second Place in the ${cert.hackathonName} hackathon as a member of Team "${cert.teamName}". Your outstanding performance and dedication have been recognized.`;
      }
      if (cert.achievementType === 'third-place') {
        return `For achieving Third Place in the ${cert.hackathonName} hackathon as a member of Team "${cert.teamName}". Your remarkable skills and effort have been acknowledged.`;
      }
      return `For successful participation in the ${cert.hackathonName} hackathon as a member of Team "${cert.teamName}". Your commitment to learning and innovation is commendable.`;
    };

    return (
      <div className="student-certificate-template" ref={certificateRef}>
        {/* Left decorative corner */}
        <div className="student-certificate-corner-left">
          <div className="student-certificate-corner-shape student-certificate-corner-shape-1"></div>
          <div className="student-certificate-corner-shape student-certificate-corner-shape-2"></div>
          <div className="student-certificate-corner-shape student-certificate-corner-shape-3"></div>
          <div className="student-certificate-corner-shape student-certificate-corner-shape-4"></div>
        </div>

        {/* Main content */}
        <div className="student-certificate-content">
          <h1 className="student-certificate-title">CERTIFICATE</h1>
          <div className="student-certificate-subtitle-line"></div>
          <h2 className="student-certificate-subtitle">OF {getAchievementTitle(certificate.achievementType)}</h2>
          
          <p className="student-certificate-presented-to">PROUDLY PRESENTED TO</p>
          
          <h3 className="student-certificate-recipient-name">{certificate.recipientName}</h3>
          
          <p className="student-certificate-description">
            {getDescription(certificate)}
          </p>

          <div className="student-certificate-signatures">
            <div className="student-certificate-signature-block">
              <div className="student-certificate-signature-line"></div>
              <p className="student-certificate-signature-label">COORDINATOR</p>
            </div>
            <div className="student-certificate-signature-block">
              <div className="student-certificate-signature-line"></div>
              <p className="student-certificate-signature-label">DIRECTOR</p>
            </div>
          </div>

          <div className="student-certificate-footer">
            <p className="student-certificate-number">Certificate No: {certificate.certificateNumber}</p>
            <p className="student-certificate-date">Issued: {formatDate(certificate.issuedAt)}</p>
          </div>
        </div>

        {/* Right side badge - circular only */}
        <div className="student-certificate-badge">
          <div className="student-certificate-badge-outer">
            <div className="student-certificate-badge-inner">
              <div className="student-certificate-badge-stars-top">★★★★★</div>
              <span className="student-certificate-badge-text-best">BEST</span>
              <span className="student-certificate-badge-text-award">AWARD</span>
              <div className="student-certificate-badge-stars-bottom">★★★★★</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="student-certificate-container">
        <div className="student-certificate-loading-container">
          <div className="student-certificate-loading-spinner"></div>
          <p>Loading your certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-certificate-container">
      <div className="student-certificate-header">
        <h1><SafetyCertificateOutlined /> My Certificates</h1>
        <p>View and download your hackathon achievements</p>
      </div>

      {/* Search Dropdown */}
      <div className="student-certificate-search-container" ref={searchRef}>
        <div 
          className={`student-certificate-search-dropdown ${searchDropdownOpen ? 'open' : ''}`}
          onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
        >
          <SearchOutlined className="student-certificate-search-icon" />
          <span className="student-certificate-search-text">
            {searchQuery || 'Select Hackathon'}
          </span>
        </div>
        {searchDropdownOpen && (
          <div className="student-certificate-search-dropdown-menu">
            <div className="student-certificate-dropdown-search-input">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div 
              className="student-certificate-dropdown-item"
              onClick={() => { setSearchQuery(''); setSearchDropdownOpen(false); }}
            >
              All Hackathons
            </div>
            {[...new Set(certificates.map(c => c.hackathonName))]
              .filter(name => name?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(name => (
              <div 
                key={name}
                className={`student-certificate-dropdown-item ${searchQuery === name ? 'selected' : ''}`}
                onClick={() => { setSearchQuery(name); setSearchDropdownOpen(false); }}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      {certificates.length === 0 ? (
        <div className="student-certificate-no-certificates">
          <FileProtectOutlined className="student-certificate-no-cert-icon" />
          <h3>No Certificates Yet</h3>
          <p>Participate in hackathons and earn your certificates!</p>
        </div>
      ) : (
        <div className="student-certificate-grid-container">
          <div className="student-certificate-grid">
            {certificates
              .filter(cert => cert.hackathonName?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((cert) => (
              <div key={cert._id} className="student-certificate-card">
                {/* Mini Certificate Preview - Looks like actual certificate */}
                <div className="student-certificate-preview" onClick={() => setPreviewCertificate(cert)}>
                  <div className="student-certificate-mini">
                    <div className="student-certificate-mini-corner-left"></div>
                    <div className="student-certificate-mini-content">
                      <div className="student-certificate-mini-title">CERTIFICATE</div>
                      <div className="student-certificate-mini-subtitle">OF {cert.achievementType === 'champion' ? 'CHAMPIONSHIP' : cert.achievementType === 'runner-up' ? 'RUNNER UP' : cert.achievementType === 'third-place' ? 'THIRD PLACE' : 'PARTICIPATION'}</div>
                      <div className="student-certificate-mini-presented">PROUDLY PRESENTED TO</div>
                      <div className="student-certificate-mini-name">{cert.recipientName}</div>
                      <div className="student-certificate-mini-hackathon">{cert.hackathonName}</div>
                    </div>
                    <div className="student-certificate-mini-badge-circle">
                      <span>★</span>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="student-certificate-card-info">
                  <h3 className="student-certificate-hackathon-name">{cert.hackathonName}</h3>
                  <p className="student-certificate-team-name">Team: {cert.teamName}</p>
                </div>

                {/* Action Buttons - Plain */}
                <div className="student-certificate-card-actions">
                  <button 
                    className="student-certificate-btn-plain"
                    onClick={() => setPreviewCertificate(cert)}
                  >
                    <EyeOutlined /> View
                  </button>
                  <span className="student-certificate-action-divider">|</span>
                  <button 
                    className="student-certificate-btn-plain"
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
        <div className="student-certificate-modal-overlay" onClick={() => setPreviewCertificate(null)}>
          <div className="student-certificate-modal" onClick={(e) => e.stopPropagation()}>
            <button className="student-certificate-modal-close" onClick={() => setPreviewCertificate(null)}>×</button>
            <div className="student-certificate-scale-wrapper">
              <CertificateTemplate certificate={previewCertificate} />
            </div>
            <div className="student-certificate-modal-actions">
              <button 
                className="student-certificate-btn-download-modal"
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

export default StudentCertificates;
