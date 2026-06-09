import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Divider } from "antd";
import { LockOutlined, MailOutlined, KeyOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./admincss.css";
import config from '../../config';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP validation, Step 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP to the email
  const handleEmailSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // Call backend to send OTP to the email
      const response = await axios.post(`${config.backendUrl}/roles/admin/forgot-password`, { email });

      toast.success("OTP sent successfully to your email.");
      setStep(2); // Proceed to OTP validation step
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate OTP
  const handleOtpSubmit = async () => {
    if (!otp) {
      toast.error("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      // Validate OTP with backend
      const response = await axios.post(`${config.backendUrl}/roles/admin/validate-otp`, { email, otp });

      toast.success("OTP validated successfully.");
      setStep(3); // Proceed to password reset step
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handlePasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }

    setLoading(true);
    try {
      // Call backend to reset password
      const response = await axios.post(`${config.backendUrl}/roles/admin/reset-forgot-password`, {
        email,
        newPassword,
      });

      toast.success("Password changed successfully!");
      setTimeout(() => {
        window.location.href = "/adminlogin"; // Redirect to login after successful reset
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTitleText = () => {
    switch (step) {
      case 1:
        return "Forgot Password";
      case 2:
        return "Verify OTP";
      case 3:
        return "Reset Password";
      default:
        return "Forgot Password";
    }
  };

  return (
    <div className="adminlogin-reset-password-container">
      <Card className="adminlogin-reset-card">
        <Title level={2} className="adminlogin-reset-title">
          {getTitleText()}
        </Title>
        <Text type="secondary" className="adminlogin-reset-subtitle">
          {step === 1 ? "Enter your email to receive a verification code" : 
           step === 2 ? "Enter the verification code sent to your email" : 
           "Create a new secure password"}
        </Text>
        
        <Form
          name="forgot-password"
          layout="vertical"
          size="large"
          className="adminlogin-reset-form"
          onFinish={step === 1 ? handleEmailSubmit : step === 2 ? handleOtpSubmit : handlePasswordSubmit}
        >
          {step === 1 && (
            <>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="site-form-item-icon" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="admin-input"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  block
                  className="admin-auth-button"
                >
                  Send Verification Code
                </Button>
              </Form.Item>
            </>
          )}

          {step === 2 && (
            <>
              <Form.Item
                name="otp"
                rules={[{ required: true, message: "Please enter the verification code!" }]}
              >
                <Input
                  prefix={<KeyOutlined className="site-form-item-icon" />}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Verification Code"
                  className="admin-input"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  block
                  className="admin-auth-button"
                >
                  Verify Code
                </Button>
              </Form.Item>
              
              <div className="auth-helpers">
                <Button 
                  type="link" 
                  onClick={() => setStep(1)} 
                  className="auth-link"
                >
                  Back to Email
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Form.Item
                name="newPassword"
                rules={[
                  { required: true, message: "Please input your new password!" }, 
                  { min: 6, message: "Password must be at least 6 characters!" }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="admin-input"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                rules={[
                  { required: true, message: "Please confirm your new password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="admin-input"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  block
                  className="admin-auth-button"
                >
                  Reset Password
                </Button>
              </Form.Item>
              
              <div className="auth-helpers">
                <Button 
                  type="link" 
                  onClick={() => setStep(2)} 
                  className="auth-link"
                >
                  Back to Verification
                </Button>
              </div>
            </>
          )}
        </Form>
        
        <div className="adminlogin-auth-footer">
          <Button 
            type="link" 
            href="/adminlogin" 
            className="adminlogin-auth-link"
          >
            Back to Login
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;