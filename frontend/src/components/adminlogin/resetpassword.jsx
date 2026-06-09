import React, { useState } from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./admincss.css";
import config from '../../config';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${config.backendUrl}/roles/admin/reset-password`, {
        email: values.email, // Use email to find the user
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      toast.success(response.data.message || "Password reset successful!");
      setTimeout(() => {
        window.location.href = "/adminlogin"; // Redirect to login page
      }, 2000);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminlogin-reset-password-container">
      <Card className="adminlogin-reset-card">
        <Title level={2} className="adminlogin-reset-title">
          Reset Password
        </Title>
        <Text type="secondary" className="adminlogin-reset-subtitle">
          Please enter your credentials to reset your password
        </Text>

        <Form
          name="reset-password"
          layout="vertical"
          onFinish={onFinish}
          className="adminlogin-reset-form"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please input your email!" }, { type: "email", message: "Please enter a valid email!" }]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="Enter your email"
              className="adminlogin-input"
            />
          </Form.Item>

          <Form.Item
            name="oldPassword"
            rules={[{ required: true, message: "Please input your old password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Enter your old password"
              className="adminlogin-input"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: "Please input your new password!" },
              { min: 6, message: "Password must be at least 6 characters!" }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Enter your new password"
              className="adminlogin-input"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: "Please confirm your new password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Confirm your new password"
              className="adminlogin-input"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="adminlogin-auth-button"
            >
              Reset Password
            </Button>
          </Form.Item>

          <div className="adminlogin-auth-footer">
            <Button
              type="link"
              onClick={() => window.location.href = '/adminlogin'}
              className="adminlogin-auth-link"
            >
              Back to Login
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;