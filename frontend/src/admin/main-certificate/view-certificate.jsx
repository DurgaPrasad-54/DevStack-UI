import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Table, Button, message, Card, Tag, Modal, Select, Input, Space, Row, Col, Divider } from 'antd';
import { FileTextOutlined, DownloadOutlined, SafetyCertificateOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CertificateTemplate from './templet';
import { generateCertificatePDF } from '../../user/main-certificate/pdf-generator';
import config from '../../config';


const { Option } = Select;

const CertificatesListComponent = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [displayedCertificates, setDisplayedCertificates] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const certificateRef = useRef(null);

  // Get API base URL from environment or use default
  const API_BASE_URL = import.meta.env.VITE_API_URL || `${config.backendUrl}/api`;

  const fetchGradeCriteria = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }
      
      // Fetch grade criteria to get program names
      const response = await axios.get(`${API_BASE_URL}/certificates/grade-criteria`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Extract unique program names
        const programNames = response.data.data.map(criteria => criteria.programName);
        setPrograms([...new Set(programNames)]); // Remove duplicates
      } else {
        setError(response.data.message || 'Failed to fetch programs');
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch programs';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/certificates/certificates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const allCertificates = response.data.data;
        setCertificates(allCertificates);
        setDisplayedCertificates(allCertificates);
      } else {
        setError(response.data.message || 'Failed to fetch certificates');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch certificates';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradeCriteria();
    fetchCertificates();
  }, []);

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters();
  }, [selectedProgram, filterType, searchText, certificates]);

  const applyFilters = () => {
    let filteredCerts = [...certificates];
    
    // Filter by program
    if (selectedProgram) {
      filteredCerts = filteredCerts.filter(cert => cert.programName === selectedProgram);
    }
    
    // Filter by certificate type
    if (filterType !== 'all') {
      filteredCerts = filteredCerts.filter(cert => cert.certificateType === filterType);
    }
    
    // Filter by search text
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filteredCerts = filteredCerts.filter(cert => 
        cert.student?.name?.toLowerCase().includes(lowerSearchText) ||
        cert.student?.email?.toLowerCase().includes(lowerSearchText) ||
        cert.student?.rollNo?.toLowerCase().includes(lowerSearchText) ||
        (cert.certificateId && cert.certificateId.toLowerCase().includes(lowerSearchText))
      );
    }
    
    setDisplayedCertificates(filteredCerts);
  };

  const showCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const downloadCertificate = async () => {
    try {
      if (!selectedCertificate) {
        message.error('No certificate selected');
        return;
      }

      // Generate a filename based on student name and certificate type
      const studentName = selectedCertificate.student?.name || 'Unknown';
      const certificateType = selectedCertificate.certificateType || 'certificate';
      const fileName = `${studentName}_${certificateType}_certificate.pdf`;

      // Wait a moment for the certificate to be fully rendered
      setTimeout(async () => {
        try {
          await generateCertificatePDF('certificate-template', fileName);
          message.success('Certificate downloaded successfully');
        } catch (error) {
          message.error('Failed to download certificate');
          console.error(error);
        }
      }, 300);
    } catch (error) {
      message.error('Failed to download certificate');
      console.error(error);
    }
  };

  const handleProgramChange = (value) => {
    setSelectedProgram(value);
    // Filter is applied automatically via useEffect
  };

  const handleCertificateTypeChange = (value) => {
    setFilterType(value);
    // Filter is applied automatically via useEffect
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    // Filter is applied automatically via useEffect
  };

  const resetFilters = () => {
    setSelectedProgram(null);
    setFilterType('all');
    setSearchText('');
    // This will trigger the useEffect to apply filters (showing all certificates)
  };

  // Function to navigate to certificate verification page
  const navigateToVerifyPage = () => {
    navigate('/admin/verify-certificate');
  };
  
  // Function to navigate to download certificate page
  const navigateToDownloadPage = () => {
    navigate('/admin/download-certificate');
  };

  // Fixed column widths for better table display
  const columns = [
    {
      title: 'Student Name',
      key: 'studentName',
      render: (_, record) => record.student?.name || 'Unknown',
      sorter: (a, b) => {
        const nameA = a.student?.name || '';
        const nameB = b.student?.name || '';
        return nameA.localeCompare(nameB);
      },
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Roll No',
      key: 'rollNo',
      render: (_, record) => record.student?.rollNo || 'N/A',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'College',
      key: 'college',
      render: (_, record) => record.student?.college || 'N/A',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Program',
      dataIndex: 'programName',
      key: 'programName',
      sorter: (a, b) => {
        const progA = a.programName || '';
        const progB = b.programName || '';
        return progA.localeCompare(progB);
      },
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Total Marks',
      dataIndex: 'totalMarks',
      key: 'totalMarks',
      sorter: (a, b) => a.totalMarks - b.totalMarks,
      width: 100,
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade) => {
        let color = 'green';
        if (grade === 'F') color = 'red';
        else if (grade === 'D') color = 'orange';
        else if (grade === 'C') color = 'blue';
        else if (grade === 'B') color = 'purple';
        
        return <Tag color={color}>{grade}</Tag>;
      },
      sorter: (a, b) => {
        const gradeValues = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
        return gradeValues[a.grade] - gradeValues[b.grade];
      },
      width: 80,
    },
    {
      title: 'Certificate Type',
      dataIndex: 'certificateType',
      key: 'certificateType',
      render: (type) => (
        <Tag color={type === 'completion' ? 'green' : 'blue'}>
          {type === 'completion' ? 'Completion' : 'Participation'}
        </Tag>
      ),
      width: 120,
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.issueDate) - new Date(b.issueDate),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<FileTextOutlined />}
          onClick={() => showCertificate(record)}
          size="small"
        >
          View
        </Button>
      ),
      width: 80,
      fixed: 'right',
    },
  ];

  return (
    <div style={{ padding: '0px', width: '100%', overflow: 'hidden' }}>
      {/* Add style tag for media query */}
      <style>
        {`
          @media (min-width: 768px) and (max-width: 1025px) {
            .download-btn {
              font-size: 12px !important;
            }
            .download-btn .anticon {
              font-size: 13px !important;
            }
          }
          
          /* Make table responsive */
          .ant-table-wrapper {
            width: 100%;
            overflow-x: auto;
          }
          
          /* Improve header wrapping */
          .ant-table-thead th {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          /* Better cell content display */
          .ant-table-tbody td {
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          /* Ensure proper table layout */
          .ant-table {
            table-layout: fixed;
          }
          
          /* Make card fit container */
          .ant-card {
            width: 100%;
            overflow: hidden;
          }
        `}
      </style>

      {error && (
        <div style={{ color: 'red', marginBottom: '16px' }}>
          Error: {error}
        </div>
      )}
      
      <Card 
        title="Student Certificates" 
        bordered={true}
        style={{ width: '100%' }}
        bodyStyle={{ padding: '12px', overflow: 'hidden' }}
      >
        {/* Responsive Filter and Action Controls */}
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          {/* Search and Program Filter */}
          <Col xs={24} sm={24} md={14} lg={16} xl={16}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                <Select 
                  placeholder="Select Program"
                  style={{ width: '100%' }} 
                  value={selectedProgram}
                  onChange={handleProgramChange}
                  allowClear
                >
                  {programs.map(program => (
                    <Option key={program} value={program}>{program}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                <Select 
                  placeholder="Certificate Type"
                  style={{ width: '100%' }} 
                  value={filterType}
                  onChange={handleCertificateTypeChange}
                >
                  <Option value="all">All Certificates</Option>
                  <Option value="participation">Participation</Option>
                  <Option value="completion">Completion</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                <Input
                  placeholder="Search by name, email, or roll no"
                  value={searchText}
                  onChange={handleSearchChange}
                  style={{ width: '100%' }}
                  allowClear
                />
              </Col>
            </Row>
          </Col>
          
          {/* Action Buttons */}
          <Col xs={24} sm={24} md={10} lg={8} xl={8}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8} md={8}>
                <Button 
                  onClick={resetFilters} 
                  type="default"
                  icon={<ClearOutlined />}
                  style={{ width: '100%' }}
                >
                  Reset
                </Button>
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Button 
                  type="primary"
                  icon={<SafetyCertificateOutlined />}
                  onClick={navigateToVerifyPage}
                  style={{ width: '100%' }}
                >
                  Verify
                </Button>
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Button 
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={navigateToDownloadPage}
                  style={{ width: '100%' }}
                  className="download-btn"
                >
                  Download
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={displayedCertificates}
            rowKey={record => record._id || record.certificateId}
            loading={loading}
            pagination={{ 
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            scroll={{ x: 1000 }} // Set minimum scroll width
            size="small" // Use smaller row height
            summary={pageData => {
              const totalCount = displayedCertificates.length;
              return (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={9}>
                      <Space wrap>
                        <strong>Total Certificates: {totalCount}</strong>
                        {selectedProgram && (
                          <span>
                            <strong>Program: {selectedProgram}</strong>
                          </span>
                        )}
                        {filterType !== 'all' && (
                          <span>
                            <strong>Type: {filterType.charAt(0).toUpperCase() + filterType.slice(1)}</strong>
                          </span>
                        )}
                      </Space>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </div>
      </Card>

      <Modal
        title="Certificate Preview"
        visible={isModalVisible}
        onCancel={handleCancel}
        width="95%"
        style={{ maxWidth: '800px' }}
        footer={[
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={downloadCertificate}
            className="download-btn"
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

export default CertificatesListComponent;