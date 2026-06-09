import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, Empty, Button, message, Spin, Modal } from 'antd';
import { DownloadOutlined, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CertificateTemplate from './../../admin/main-certificate/templet';
import { generateCertificatePDF } from './pdf-generator';
import './view-certificate.css';
import config from '../../config';

const StudentCertificateComponent = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const certificateRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentCertificates();
  }, []);

  const fetchStudentCertificates = async () => {
    try {
      setLoading(true);
      const studentId = localStorage.getItem('student');
      console.log(studentId);
      
      if (!studentId) {
        message.error('Unable to identify student');
        return;
      }

      const response = await axios.get(`${config.backendUrl}/api/certificates/student-certificates/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setCertificates(response.data.data);
        console.log(response);
      }
    } catch (error) {
      message.error('Failed to fetch certificates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const downloadCertificate = async (certificate = null) => {
    try {
      setDownloadLoading(true);
      // Use either the passed certificate or the selected one
      const certToDownload = certificate || selectedCertificate;
      
      if (!certToDownload) {
        message.error('No certificate selected');
        return;
      }

      // Create a descriptive filename based on certificate information
      const certificateType = certToDownload.certificateType === 'completion' 
        ? 'Achievement' 
        : 'Participation';
      const fileName = `Certificate_of_${certificateType}_${new Date().getTime()}.pdf`;

      if (!isModalVisible && certificate) {
        // If downloading directly from the card (without modal open),
        // we need to temporarily show the certificate for html2canvas
        setSelectedCertificate(certificate);
        
        // Create a temporary hidden div for the certificate
        const tempDiv = document.createElement('div');
        tempDiv.id = 'temp-certificate-container';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        // Render the certificate in the hidden div
        const certificateElement = document.createElement('div');
        certificateElement.id = 'certificate-template';
        tempDiv.appendChild(certificateElement);
        
        // Wait for DOM update before continuing
        setTimeout(async () => {
          try {
            // We would need a way to render the certificate template here
            // This is tricky since React components can't be directly manipulated this way
            // For simplicity, let's open the modal instead
            showCertificate(certificate);
            setTimeout(() => {
              message.info('Please use the download button in the preview window');
              setDownloadLoading(false);
            }, 500);
          } catch (error) {
            console.error('Error in direct download:', error);
            message.error('Please open preview first, then download');
            setDownloadLoading(false);
          } finally {
            // Clean up
            if (document.body.contains(tempDiv)) {
              document.body.removeChild(tempDiv);
            }
          }
        }, 100);
        return;
      }

      // If modal is open, use the certificate-template element
      await generateCertificatePDF('certificate-template', fileName);
      message.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      message.error('Failed to download certificate');
    } finally {
      setDownloadLoading(false);
    }
  };

  const navigateToVerifyCertificate = () => {
    navigate('/user/verify-certificate');
  };

  const renderCertificates = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }

    if (certificates.length === 0) {
      return (
        <Empty
          description="You don't have any certificates yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <div className="certificates-grid">
        {certificates.map(cert => (
          <Card 
            key={cert._id}
            className="certificate-card"
            hoverable
            cover={
              <div className="certificate-card-cover">
                <div className="certificate-icon">
                  <FileTextOutlined />
                </div>
                <div className="certificate-type">
                  {cert.certificateType === 'completion' ? 'Certificate of Achievement' : 'Certificate of Participation'}
                </div>
              </div>
            }
            actions={[
              <Button 
                type="primary" 
                onClick={() => showCertificate(cert)}
              >
                View
              </Button>,
              <Button 
                icon={<DownloadOutlined />}
                loading={downloadLoading}
                onClick={() => downloadCertificate(cert)}
              >
                Download
              </Button>
            ]}
          >
            <Card.Meta
              title={`Grade: ${cert.grade}`}
              description={`Issued on: ${new Date(cert.issueDate).toLocaleDateString()}`}
            />
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="student-certificates-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="page-title">My Certificates</h2>
        <Button 
          type="primary" 
          icon={<SafetyCertificateOutlined />} 
          onClick={navigateToVerifyCertificate}
        >
          Verify Certificates
        </Button>
      </div>
      
      {renderCertificates()}

      <Modal
        title="Certificate Preview"
        visible={isModalVisible}
        onCancel={handleCancel}
        width={800}
        footer={[
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            loading={downloadLoading}
            onClick={() => downloadCertificate()}
          >
            Download
          </Button>,
        ]}
      >
        {selectedCertificate && (
          <div style={{ overflowX: 'auto' }}>
            <div id="certificate-template" ref={certificateRef}>
              <CertificateTemplate certificate={selectedCertificate} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentCertificateComponent;