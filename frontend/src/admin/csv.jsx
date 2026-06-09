import React, { useState } from 'react';
import axios from 'axios';
import { Upload, message, Button, Typography, List, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import config from '../config';

const { Title, Text } = Typography;

const StudentRegistration = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [existingStudents, setExistingStudents] = useState([]);
  const [processingErrors, setProcessingErrors] = useState([]);

  const handleUpload = async () => {
    if (!file) {
      message.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const response = await axios.post(`${config.backendUrl}/csv/register-students`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      message.success('File processed successfully');
      setRegisteredStudents(response.data.registered);
      setExistingStudents(response.data.existingStudents);
      setProcessingErrors(response.data.errors);
    } catch (error) {
      message.error(error.response?.data?.error || 'An error occurred while uploading the file');
    } finally {
      setUploading(false);
    }
  };

  const props = {
    onRemove: () => {
      setFile(null);
      setRegisteredStudents([]);
      setExistingStudents([]);
      setProcessingErrors([]);
    },
    beforeUpload: (file) => {
      setFile(file);
      return false;
    },
    file,
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <Title level={2}>Register Students</Title>
      <Upload {...props} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
        <Button icon={<UploadOutlined />}>Select CSV or Excel file</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={!file}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? 'Uploading' : 'Start Upload'}
      </Button>
      
      {registeredStudents.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Title level={4}>Registered Students:</Title>
          <List
            bordered
            dataSource={registeredStudents}
            renderItem={(student) => <List.Item>{student}</List.Item>}
          />
        </div>
      )}
      
      {existingStudents.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Title level={4}>Already Registered Students:</Title>
          <List
            bordered
            dataSource={existingStudents}
            renderItem={(student) => (
              <List.Item>
                <Text>{student.name} ({student.email})</Text>
              </List.Item>
            )}
          />
        </div>
      )}
      
      {processingErrors.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Title level={4}>Errors:</Title>
          <List
            bordered
            dataSource={processingErrors}
            renderItem={(error) => (
              <List.Item>
                <Alert
                  message={error.student}
                  description={error.error}
                  type="error"
                  showIcon
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default StudentRegistration;