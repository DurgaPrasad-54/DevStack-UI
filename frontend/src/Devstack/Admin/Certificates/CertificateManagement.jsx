import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../../../config';
import './CertificateManagement.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { message } from 'antd';







import {
  SafetyCertificateOutlined,
  SearchOutlined,
  FileProtectOutlined,
  SyncOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  TrophyOutlined,
  TeamOutlined,
  UserOutlined,


  LoadingOutlined } from
'@ant-design/icons';

const CertificateManagement = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'certificates'
  const [previewCertificate, setPreviewCertificate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const certificateRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchCompletedHackathons();
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

  const fetchCompletedHackathons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.backendUrl}/hackcertificates/completed-hackathons`);
      if (response.data.success) {
        setHackathons(response.data.hackathons);
      }
    } catch (err) {
      message.error('Failed to fetch hackathons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificates = async (hackathonId) => {
    try {
      setGenerating(hackathonId);

      const response = await axios.post(`${config.backendUrl}/hackcertificates/generate/${hackathonId}`);
      
      if (response.data.success) {
        message.success('Certificates generated successfully!');
        await fetchCompletedHackathons();
      }
    } catch (err) {
      // Check if it's a "certificates already exist" error - offer to regenerate
      const errorMessage = err.response?.data?.message || 'Failed to generate certificates';
      message.error(errorMessage);
      // Refresh the list to get accurate status
      await fetchCompletedHackathons();
    } finally {
      setGenerating(null);
    }
  };

  const handleViewCertificates = async (hackathon) => {
    try {
      setSelectedHackathon(hackathon);
      setLoading(true);
      const response = await axios.get(`${config.backendUrl}/hackcertificates/hackathon/${hackathon._id}`);
      if (response.data.success) {
        setCertificates(response.data.certificates);
        setViewMode('certificates');
      }
    } catch (err) {
      message.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificates = async (hackathonId) => {
    if (!window.confirm('Are you sure you want to delete all certificates for this hackathon? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      const response = await axios.delete(`${config.backendUrl}/hackcertificates/hackathon/${hackathonId}`);
      if (response.data.success) {
        message.success('Certificates deleted successfully');
        await fetchCompletedHackathons();
        if (viewMode === 'certificates') {
          setViewMode('list');
          setCertificates([]);
        }
      }
    } catch (err) {
      message.error('Failed to delete certificates');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate: Delete existing + Generate new
  const handleRegenerateCertificates = async (hackathonId) => {
    if (!window.confirm('This will delete all existing certificates and generate new ones. Continue?')) {
      return;
    }
    try {
      setGenerating(hackathonId);

      // Step 1: Delete existing certificates
      await axios.delete(`${config.backendUrl}/hackcertificates/hackathon/${hackathonId}`);
      
      // Step 2: Generate new certificates
      const response = await axios.post(`${config.backendUrl}/hackcertificates/generate/${hackathonId}`);
      
      if (response.data.success) {
        message.success('Certificates regenerated successfully!');
        await fetchCompletedHackathons();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to regenerate certificates');
      await fetchCompletedHackathons();
    } finally {
      setGenerating(null);
    }
  };

  const getAchievementLabel = (type) => {
    switch (type) {
      case 'champion': return 'Champion';
      case 'runner-up': return 'Runner Up';
      case 'third-place': return 'Third Place';
      case 'participant': return 'Participant';
      case 'mentor': return 'Mentor';
      default: return type;
    }
  };

  const getAchievementColor = (type) => {
    switch (type) {
      case 'champion': return '#FFD700';
      case 'runner-up': return '#C0C0C0';
      case 'third-place': return '#CD7F32';
      case 'participant': return '#4A90D9';
      case 'mentor': return '#9B59B6';
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
    
    // Wait for the certificate to render
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
        pdf.save(`Certificate_${cert.recipientName.replace(/\s+/g, '_')}_${cert.certificateNumber}.pdf`);
        message.success('Certificate downloaded successfully!');
      } catch (err) {
        console.error('Error generating PDF:', err);
        message.error('Failed to generate PDF');
      } finally {
        setPreviewCertificate(null);
      }
    }, 500);
  };

  // Certificate Template Component matching the provided image
  const CertificateTemplate = ({ certificate }) => {
    const getAchievementTitle = (type) => {
      switch (type) {
        case 'champion': return 'CHAMPIONSHIP';
        case 'runner-up': return 'RUNNER UP';
        case 'third-place': return 'THIRD PLACE';
        case 'participant': return 'PARTICIPATION';
        case 'mentor': return 'MENTORSHIP';
        default: return 'APPRECIATION';
      }
    };

    const getDescription = (cert) => {
      if (cert.achievementType === 'mentor') {
        return `For outstanding mentorship and guidance during the ${cert.hackathonName} hackathon. Your dedication and expertise have been instrumental in shaping the success of participating teams.`;
      }
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
      <div className="admin-certif-certificate-template" ref={certificateRef}>
        {/* Left decorative corner */}
        <div className="admin-certif-certificate-corner-left">
          <div className="admin-certif-corner-shape admin-certif-corner-shape-1"></div>
          <div className="admin-certif-corner-shape admin-certif-corner-shape-2"></div>
          <div className="admin-certif-corner-shape admin-certif-corner-shape-3"></div>
          <div className="admin-certif-corner-shape admin-certif-corner-shape-4"></div>
        </div>

        {/* Main content */}
        <div className="admin-certif-certificate-content">
          <h1 className="admin-certif-certificate-title">CERTIFICATE</h1>
          <div className="admin-certif-certificate-subtitle-line"></div>
          <h2 className="admin-certif-certificate-subtitle">OF {getAchievementTitle(certificate.achievementType)}</h2>
          
          <p className="admin-certif-presented-to">PROUDLY PRESENTED TO</p>
          
          <h3 className="admin-certif-recipient-name">{certificate.recipientName}</h3>
          
          <p className="admin-certif-certificate-description">
            {getDescription(certificate)}
          </p>

          <div className="admin-certif-certificate-signatures">
            <div className="admin-certif-signature-block">
              <div className="admin-certif-signature-line"></div>
              <p className="admin-certif-signature-label">COORDINATOR</p>
            </div>
            <div className="admin-certif-signature-block">
              <div className="admin-certif-signature-line"></div>
              <p className="admin-certif-signature-label">DIRECTOR</p>
            </div>
          </div>

          <div className="admin-certif-certificate-footer">
            <p className="admin-certif-certificate-number">Certificate No: {certificate.certificateNumber}</p>
            <p className="admin-certif-certificate-date">Issued: {formatDate(certificate.issuedAt)}</p>
          </div>
        </div>

        {/* Right side badge - circular only */}
        <div className="admin-certif-certificate-badge">
          <div className="admin-certif-badge-outer">
            <div className="admin-certif-badge-inner">
              <div className="admin-certif-badge-stars-top">★★★★★</div>
              <span className="admin-certif-badge-text-best">BEST</span>
              <span className="admin-certif-badge-text-award">AWARD</span>
              <div className="admin-certif-badge-stars-bottom">★★★★★</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && hackathons.length === 0) {
    return (
      <div className="admin-certif-certificate-management">
        <div className="admin-certif-loading-container">
          <div className="admin-certif-loading-spinner"></div>
          <p>Loading hackathons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-certif-certificate-management">
      <div className="admin-certif-certificate-header">
        <h1><SafetyCertificateOutlined /> Certificate Management</h1>
        <p>Generate and manage certificates for completed hackathons</p>
      </div>

      {viewMode === 'list' ? (
        <div className="admin-certif-hackathons-table-container">
          <h2>Completed Hackathons</h2>
          
          {/* Search Dropdown */}
          <div className="admin-certif-search-container" ref={searchRef}>
            <div 
              className={`admin-certif-search-dropdown ${searchDropdownOpen ? 'open' : ''}`}
              onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
            >
              <SearchOutlined className="admin-certif-search-icon" />
              <span className="admin-certif-search-text">
                {searchQuery || 'Select Hackathon'}
              </span>
            </div>
            {searchDropdownOpen && (
              <div className="admin-certif-search-dropdown-menu">
                <div className="admin-certif-dropdown-search-input">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div 
                  className="admin-certif-dropdown-item"
                  onClick={() => { setSearchQuery(''); setSearchDropdownOpen(false); }}
                >
                  All Hackathons
                </div>
                {hackathons
                  .filter(h => h.hackathonname?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(h => (
                  <div 
                    key={h._id}
                    className={`admin-certif-dropdown-item ${searchQuery === h.hackathonname ? 'selected' : ''}`}
                    onClick={() => { setSearchQuery(h.hackathonname); setSearchDropdownOpen(false); }}
                  >
                    {h.hackathonname}
                  </div>
                ))}
              </div>
            )}
          </div>

          {hackathons.length === 0 ? (
            <div className="admin-certif-no-data">
              <p>No completed hackathons found</p>
            </div>
          ) : (
            <table className="admin-certif-hackathons-table">
              <thead>
                <tr>
                  <th>Hackathon Name</th>
                  <th>Year</th>
                  <th>Technology</th>
                  <th>College</th>
                  <th>End Date</th>
                  <th>Certificates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hackathons
                  .filter(h => h.hackathonname?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((hackathon) => (
                  <tr key={hackathon._id}>
                    <td className="admin-certif-hackathon-name">{hackathon.hackathonname}</td>
                    <td>{hackathon.year}</td>
                    <td>{hackathon.technology}</td>
                    <td>{hackathon.college}</td>
                    <td>{formatDate(hackathon.enddate)}</td>
                    <td>
                      {hackathon.certificatesGenerated ? (
                        <span className="admin-certif-status-badge generated">
                          ✓ {hackathon.certificateCount} Generated
                        </span>
                      ) : (
                        <span className="admin-certif-status-badge pending">
                          Not Generated
                        </span>
                      )}
                    </td>
                    <td className="admin-certif-actions-cell">
                      {!hackathon.certificatesGenerated ? (
                        <button
                          className="admin-certif-btn admin-certif-btn-generate"
                          onClick={() => handleGenerateCertificates(hackathon._id)}
                          disabled={generating === hackathon._id || loading}
                        >
                          {generating === hackathon._id ? (
                            <>
                              <LoadingOutlined spin />
                              Generating...
                            </>
                          ) : (
                            <><FileProtectOutlined /> Generate</>
                          )}
                        </button>
                      ) : (
                        <div className="admin-certif-action-buttons">
                          <button
                            className="admin-certif-btn admin-certif-btn-regenerate"
                            onClick={() => handleRegenerateCertificates(hackathon._id)}
                            disabled={generating === hackathon._id || loading}
                          >
                            {generating === hackathon._id ? (
                              <>
                                <LoadingOutlined spin />
                                Regenerating...
                              </>
                            ) : (
                              <><SyncOutlined /> Regenerate</>
                            )}
                          </button>
                          <button
                            className="admin-certif-btn admin-certif-btn-delete"
                            onClick={() => handleDeleteCertificates(hackathon._id)}
                            disabled={loading}
                          >
                            <DeleteOutlined /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="admin-certif-certificates-view">
          <div className="admin-certif-view-header">
            <button className="admin-certif-btn admin-certif-btn-back" onClick={() => setViewMode('list')}>
              ← Back to Hackathons
            </button>
            <h2>Certificates for {selectedHackathon?.hackathonname}</h2>
          </div>

          <div className="admin-certif-certificates-stats">
            <div className="admin-certif-stat-card champion">
              <TrophyOutlined className="admin-certif-stat-icon" />
              <span className="admin-certif-stat-count">{certificates.filter(c => c.achievementType === 'champion').length}</span>
              <span className="admin-certif-stat-label">Champions</span>
            </div>
            <div className="admin-certif-stat-card runner-up">
              <TrophyOutlined className="admin-certif-stat-icon" />
              <span className="admin-certif-stat-count">{certificates.filter(c => c.achievementType === 'runner-up').length}</span>
              <span className="admin-certif-stat-label">Runner Up</span>
            </div>
            <div className="admin-certif-stat-card third-place">
              <TrophyOutlined className="admin-certif-stat-icon" />
              <span className="admin-certif-stat-count">{certificates.filter(c => c.achievementType === 'third-place').length}</span>
              <span className="admin-certif-stat-label">Third Place</span>
            </div>
            <div className="admin-certif-stat-card participant">
              <TeamOutlined className="admin-certif-stat-icon" />
              <span className="admin-certif-stat-count">{certificates.filter(c => c.achievementType === 'participant').length}</span>
              <span className="admin-certif-stat-label">Participants</span>
            </div>
            <div className="admin-certif-stat-card mentor">
              <UserOutlined className="admin-certif-stat-icon" />
              <span className="admin-certif-stat-count">{certificates.filter(c => c.achievementType === 'mentor').length}</span>
              <span className="admin-certif-stat-label">Mentors</span>
            </div>
          </div>

          <div className="admin-certif-certificates-grid">
            {certificates.map((cert) => (
              <div key={cert._id} className="admin-certif-certificate-card" style={{ borderLeftColor: getAchievementColor(cert.achievementType) }}>
                <div className="admin-certif-card-achievement" style={{ backgroundColor: getAchievementColor(cert.achievementType) }}>
                  {getAchievementLabel(cert.achievementType)}
                </div>
                <div className="admin-certif-card-content">
                  <h3>{cert.recipientName}</h3>
                  <p className="admin-certif-card-type"><UserOutlined /> {cert.recipientType === 'student' ? 'Student' : 'Mentor'}</p>
                  {cert.teamName && <p className="admin-certif-card-team"><TeamOutlined /> {cert.teamName}</p>}
                  <p className="admin-certif-card-cert-no">#{cert.certificateNumber}</p>
                </div>
                <div className="admin-certif-card-actions">
                  <button 
                    className="admin-certif-btn-plain"
                    onClick={() => setPreviewCertificate(cert)}
                  >
                    <EyeOutlined /> Preview
                  </button>
                  <span className="admin-certif-action-divider">|</span>
                  <button 
                    className="admin-certif-btn-plain"
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
        <div className="admin-certif-certificate-modal-overlay" onClick={() => setPreviewCertificate(null)}>
          <div className="admin-certif-certificate-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-certif-modal-close" onClick={() => setPreviewCertificate(null)}>×</button>
            <CertificateTemplate certificate={previewCertificate} />
            <div className="admin-certif-modal-actions">
              <button 
                className="admin-certif-btn admin-certif-btn-download-modal"
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

export default CertificateManagement;
