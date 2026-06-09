import React, { useState, useRef } from "react";
import { Form, Input, Button, Spin, Typography, Card } from "antd";
import { LockOutlined, MailOutlined, KeyOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import config from '../../config';
import "./admincss.css";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const navigate = useNavigate();

  const onFinishLogin = async (values) => {
    setLoading(true);
    try {
      // Using config.backendUrl for consistency
      const response = await axios.post(`${config.backendUrl}/roles/admin/login`, values);
      toast.success(response.data.message);
      setOtpStage(true);
      setEmail(values.email);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onFinishOtp = async () => {
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${config.backendUrl}/roles/admin/verify-otp`, {
        email,
        otp: otpString,
      });
      
      // Show success message
      toast.success(response.data.message || 'Login successful!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      
      // Store the token and user role
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userRole", "admin"); // Important: store as userRole for consistency
      
      if (response.data.admin) {
        localStorage.setItem("admin", response.data.admin);
      }
      
      // Use navigate for redirection after delay
      setTimeout(() => navigate("/admin"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const updatedOtp = [...otp];
    updatedOtp[index] = value.slice(-1);
    setOtp(updatedOtp);

    if (value && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const resetOtpProcess = () => {
    setOtpStage(false);
    setOtp(["", "", "", "", "", ""]);
  };

  return (
    <div className="adminlogin-reset-password-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <Card className="adminlogin-reset-card">
        <Title level={2} className="adminlogin-reset-title">
          {!otpStage ? 'Admin Portal Login' : 'Security Verification'}
        </Title>
        <Text type="secondary" className="adminlogin-reset-subtitle">
          {!otpStage ? "Please enter your credentials to login" : 
           "Enter the verification code sent to your email"}
        </Text>

        {!otpStage ? (
          <Form
            name="admin_login"
            onFinish={onFinishLogin}
            layout="vertical"
            requiredMark={false}
            size="large"
            className="adminlogin-reset-form"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Email is required" },
                { type: 'email', message: "Please enter a valid email address" }
              ]}
            >
              <Input
                prefix={<MailOutlined className="adminlogin-input-icon" />}
                placeholder="Admin Email"
                autoComplete="email"
                className="adminlogin-auth-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 6, message: "Password must be at least 6 characters" }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="adminlogin-input-icon" />}
                placeholder="Password"
                className="adminlogin-auth-input"
              />
            </Form.Item>

            <Form.Item className="adminlogin-form-actions">
              <Button
                type="primary"
                htmlType="submit"
                className="adminlogin-auth-button"
                block
              >
                Secure Login
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <div className="adminlogin-otp-verification">
            <Text className="adminlogin-otp-message">
              Enter the 6-digit code sent to<br />
              <strong>{email}</strong>
            </Text>
            
            <div className="adminlogin-otp-input-group">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="adminlogin-otp-digit"
                  autoComplete="off"
                />
              ))}
            </div>

            <div className="adminlogin-otp-actions">
              <Button
                type="primary"
                onClick={onFinishOtp}
                className="adminlogin-auth-button"
                block
              >
                Verify & Continue
              </Button>
              
              <Button 
                type="link" 
                onClick={resetOtpProcess}
                className="adminlogin-back-button"
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}

        <div className="adminlogin-auth-footer">
          <Button type="link" onClick={() => navigate("/adminforgot")}>
            Forgot Password?
          </Button>
          <Button type="link" onClick={() => navigate("/adminreset")}>
            Reset Password
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;