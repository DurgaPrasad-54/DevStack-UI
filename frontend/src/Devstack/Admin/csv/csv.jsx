import { useState } from 'react';
import { Card, Upload, Button, Alert, List, Typography, Row, Col, Space, Divider, Statistic } from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  CloseCircleOutlined, 
  InboxOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import config from '../../../config';
import './csv.css';

const { Title, Text, Paragraph } = Typography;

const StudentRegistration = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleDownloadTemplate = () => {
    const headers = "name,email,phoneNumber,rollNo,branch,year,college,currentYear,github,linkedin\n";
    const example = "John Doe,johndoe@example.com,9876543210,22CS101,CSE,3,DevStack Institute,Third Year,https://github.com/johndoe,https://linkedin.com/in/johndoe\n";
    const csvContent = headers + example;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_registration_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      setError('Please select a CSV or Excel file to upload.');
      return;
    }

    const file = fileList[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError(null);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${config.backendUrl}/csv/register-students`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults(response.data);
      setFileList([]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to process file. Please check file format and contents.');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      const isCsv = file.type === 'text/csv';
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const hasCsvExtension = file.name.endsWith('.csv');
      const hasExcelExtension = file.name.endsWith('.xlsx');
      
      if (!isCsv && !isExcel && !hasCsvExtension && !hasExcelExtension) {
        setError('You can only upload CSV or Excel files!');
        return Upload.LIST_IGNORE;
      }
      
      setFileList([file]);
      setError(null);
      return false; // Prevent automatic upload
    },
    fileList,
    maxCount: 1,
  };

  return (
    <div className="csv-registration-container">
      <div className="csv-registration-title">
        <Title level={2} style={{ fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          🎓 Bulk Student Registration
        </Title>
        <Paragraph style={{ color: '#666', fontSize: '16px', marginTop: '8px' }}>
          Quickly register multiple student accounts by uploading a CSV or Excel spreadsheet.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Instructions & Template */}
        <Col xs={24} md={10}>
          <Card className="csv-card" title={<div className="csv-section-title"><DownloadOutlined /> Setup & Template</div>}>
            <Paragraph>
              To ensure data is imported successfully, please download and use our formatted template below.
            </Paragraph>

            <Button 
              type="default" 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadTemplate}
              className="csv-template-btn"
              style={{ width: '100%', marginBottom: '24px' }}
            >
              <span>Download CSV Template</span>
              <Text type="secondary" style={{ fontSize: '12px' }}>.csv format</Text>
            </Button>

            <Divider orientation="left" style={{ margin: '12px 0' }}>Required Columns</Divider>
            <List
              size="small"
              bordered
              dataSource={[
                { name: 'name', desc: 'Full name of the student' },
                { name: 'email', desc: 'Unique, valid email address' },
                { name: 'phoneNumber', desc: 'Unique 10-digit phone number' },
                { name: 'rollNo', desc: 'Unique academic registration number' },
                { name: 'branch', desc: 'Academic department/branch (e.g. CSE, ECE)' },
                { name: 'year', desc: 'Numeric course duration year (e.g. 4)' },
                { name: 'college', desc: 'Full name of the institution/college' },
                { name: 'currentYear', desc: 'Textual current class year (e.g. Third Year)' },
                { name: 'github', desc: 'Valid GitHub URL (http:// or https://)' },
                { name: 'linkedin', desc: 'Valid LinkedIn URL (http:// or https://)' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" size={0}>
                    <Text code strong>{item.name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.desc}</Text>
                  </Space>
                </List.Item>
              )}
              style={{ maxHeight: '280px', overflowY: 'auto', background: '#fafafa', borderRadius: '6px' }}
            />
          </Card>
        </Col>

        {/* Right Column: Upload */}
        <Col xs={24} md={14}>
          <Card className="csv-card" title={<div className="csv-section-title"><UploadOutlined /> Upload File</div>}>
            <Paragraph>
              Select your prepared spreadsheet and click "Register Students" to begin. Supported formats: **.csv**, **.xlsx**.
            </Paragraph>

            <Upload.Dragger {...uploadProps} className="csv-upload-dragger">
              <div className="csv-upload-drag-container">
                <InboxOutlined className="csv-upload-icon" style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <p className="csv-upload-text">Click or drag spreadsheet here to select</p>
                <p className="ant-upload-hint" style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px' }}>
                  Only one CSV or Excel file is allowed at a time.
                </p>
              </div>
            </Upload.Dragger>

            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                style={{ marginTop: '20px' }}
              />
            )}

            <Button
              type="primary"
              onClick={handleUpload}
              disabled={fileList.length === 0 || uploading}
              loading={uploading}
              icon={<UploadOutlined />}
              className="csv-upload-btn"
              block
              style={{ marginTop: '24px' }}
            >
              {uploading ? 'Processing File...' : 'Register Students'}
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Results Section */}
      {results && (
        <Card className="csv-results-section" title={<div className="csv-section-title"><CheckCircleOutlined /> Import Results</div>}>
          <Row gutter={16} style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Col span={8}>
              <Statistic 
                title="Successfully Registered" 
                value={results.registered?.length || 0} 
                valueStyle={{ color: '#52c41a' }} 
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Skipped (Existing)" 
                value={results.existingStudents?.length || 0} 
                valueStyle={{ color: '#faad14' }} 
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Validation Failures" 
                value={results.errors?.length || 0} 
                valueStyle={{ color: '#ff4d4f' }} 
                prefix={<CloseCircleOutlined />}
              />
            </Col>
          </Row>

          <Divider />

          {/* Registered List */}
          {results.registered && results.registered.length > 0 && (
            <div className="csv-list" style={{ marginBottom: '20px' }}>
              <Title level={5} className="csv-success-title" style={{ marginBottom: '8px' }}>
                ✅ Successfully Registered ({results.registered.length})
              </Title>
              <List
                size="small"
                bordered
                dataSource={results.registered}
                renderItem={(name) => <List.Item>{name}</List.Item>}
                style={{ background: '#f6ffed', borderColor: '#b7eb8f', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto' }}
              />
            </div>
          )}

          {/* Existing Students List */}
          {results.existingStudents && results.existingStudents.length > 0 && (
            <div className="csv-list" style={{ marginBottom: '20px' }}>
              <Title level={5} className="csv-warning-title" style={{ marginBottom: '8px' }}>
                ⚠️ Already Registered / Skipped ({results.existingStudents.length})
              </Title>
              <List
                size="small"
                bordered
                dataSource={results.existingStudents}
                renderItem={(student) => (
                  <List.Item>
                    <Text strong>{student.name}</Text> ({student.email})
                  </List.Item>
                )}
                style={{ background: '#fffbe6', borderColor: '#ffe58f', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto' }}
              />
            </div>
          )}

          {/* Errors List */}
          {results.errors && results.errors.length > 0 && (
            <div className="csv-list" style={{ marginBottom: '20px' }}>
              <Title level={5} className="csv-error-title" style={{ marginBottom: '8px' }}>
                ❌ Failed Records ({results.errors.length})
              </Title>
              <List
                size="small"
                bordered
                dataSource={results.errors}
                renderItem={(err) => (
                  <List.Item>
                    <Space direction="vertical" size={0}>
                      <Text strong>{err.student}</Text>
                      <Text type="danger" style={{ fontSize: '13px' }}>{err.error}</Text>
                    </Space>
                  </List.Item>
                )}
                style={{ background: '#fff2f0', borderColor: '#ffccc7', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto' }}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default StudentRegistration;
