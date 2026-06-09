import React, { useState } from 'react';
import { Input, Button, Select, message, Form, Typography, Card } from 'antd';
import './notification.css';
import config from '../config'

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AdminNotification = () => {
  const [form] = Form.useForm();
  const [apiMessage, setApiMessage] = useState('');

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('Notification sent successfully!');
        form.resetFields();
        setApiMessage('');
      } else {
        const data = await response.json();
        setApiMessage(data.message || 'Failed to send notification');
        message.error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setApiMessage('Error sending notification');
      message.error('Error sending notification');
    }
  };

  return (
    <div className="admin-notification-container ant-notification-wrapper">
      <Card bordered={false} className="notification-card">
        <Title level={2} className="notification-title">
          Send Notification
        </Title>
        {apiMessage && <div className="message">{apiMessage}</div>}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="notification-form"
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter the title!' }]}
          >
            <Input placeholder="Enter notification title" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter the description!' }]}
          >
            <TextArea rows={4} placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            label="Target Audience"
            name="targetAudience"
            initialValue="all"
            rules={[{ required: true, message: 'Please select target audience!' }]}
          >
            <Select>
              <Option value="all">All Users</Option>
              <Option value="students">Students Only</Option>
              <Option value="mentors">Mentors Only</Option>
              <Option value="admins">Admins Only</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="notification-button"
            >
              Send Notification
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminNotification;
