import React, { useState } from 'react';
import { Card, Input, Button, Alert, Spin, Result } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import CertificateTemplate from './templet';
import './verification-certificate.css';
import config from '../../config';

const CertificateVerificationComponent = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setVerificationResult(null);
      setCertificate(null);

      const response = await axios.get(`${config.backendUrl}/api/certificates/certificate/${certificateId}`);

      if (response.data.success) {
        setVerificationResult('success');
        setCertificate(response.data.data);
      } else {
        setVerificationResult('error');
        setError('Certificate not found');
      }
    } catch (error) {
      setVerificationResult('error');
      setError(error.response?.data?.message || 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const renderVerificationResult = () => {
    if (loading) {
      return (
        <div className="verification-loading">
          <Spin size="large" />
          <p>Verifying certificate...</p>
        </div>
      );
    }

    if (verificationResult === 'success' && certificate) {
      return (
        <div className="verification-success">
          <Result
            status="success"
            title="Certificate Verified"
            subTitle="This certificate is valid and was issued by our organization."
            icon={<CheckCircleOutlined />}
          />
          <div className="certificate-preview">
            <CertificateTemplate certificate={certificate} />
          </div>
        </div>
      );
    }

    if (verificationResult === 'error') {
      return (
        <Result
          status="error"
          title="Verification Failed"
          subTitle={error || "The certificate ID you entered couldn't be verified."}
          icon={<CloseCircleOutlined />}
        />
      );
    }

    return null;
  };

  return (
    <div className="certificate-verification-container">
      <Card title="Certificate Verification" className="verification-card">
        <p className="verification-info">
          Enter the certificate ID to verify its authenticity.
        </p>

        <div className="verification-form">
          <Input
            size="large"
            placeholder="Enter Certificate ID"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            onPressEnter={handleVerify}
            prefix={<SearchOutlined />}
          />
          <Button
            type="primary"
            size="large"
            onClick={handleVerify}
            loading={loading}
          >
            Verify Certificate
          </Button>
        </div>

        {error && !loading && verificationResult !== 'error' && (
          <Alert 
            message={error} 
            type="error" 
            showIcon 
            className="verification-alert" 
          />
        )}

        {renderVerificationResult()}
      </Card>
    </div>
  );
};

export default CertificateVerificationComponent;