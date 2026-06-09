import { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Typography,
  Divider,
  Space,
  Table,
  message,
  Popconfirm,
} from "antd";
import {
  SendOutlined,
  ClearOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import config from "../../../config";
import "./NotificationManagement.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const NotificationManagement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [editingNotification, setEditingNotification] = useState(null);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(
        `${config.backendUrl}/hacknotifications/notification`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      console.log("Fetched notifications:", res.data);

      // Handle both res.data and res.data.data
      const data =
        Array.isArray(res.data) && res.data.length
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      toast.error("Failed to load notifications");
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle Form Submit (Create / Update)
  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Authentication token not found. Please login again.");
          setLoading(false);
          return;
        }

        if (editingNotification) {
          // Update existing
          await axios.put(
            `${config.backendUrl}/hacknotifications/${editingNotification._id || editingNotification.id}`,
            values,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          toast.success("Notification updated successfully!");
        } else {
          // Create new
          await axios.post(
            `${config.backendUrl}/hacknotifications/notification`,
            values,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          toast.success("Notification sent successfully!");
        }

        form.resetFields();
        setEditingNotification(null);
        fetchNotifications();
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Error submitting notification";
        console.error("Submission error:", err);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [form, fetchNotifications, editingNotification]
  );

  // Handle Reset
  const handleReset = useCallback(() => {
    form.resetFields();
    setEditingNotification(null);
    message.info("Form reset successfully");
  }, [form]);

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${config.backendUrl}/hacknotifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Notification deleted successfully");
      setNotifications((prev) =>
        prev.filter((n) => n._id !== id && n.id !== id)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast.error("Failed to delete notification");
    }
  };

  // Handle Edit
  const handleEdit = (record) => {
    setEditingNotification(record);
    form.setFieldsValue({
      targetAudience: record.targetAudience,
      title: record.title,
      description: record.description,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Table Columns
  const columns = [
    {
      title: "Recipient",
      dataIndex: "targetAudience",
      key: "targetAudience",
      render: (val) =>
        val === "all"
          ? "All Participants"
          : val.charAt(0).toUpperCase() + val.slice(1),
    },
    {
      title: "Subject",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Content Snippet",
      dataIndex: "description",
      key: "description",
      render: (val) => (val?.length > 50 ? val.slice(0, 50) + "..." : val),
    },
    {
      title: "Sender",
      dataIndex: "sender",
      key: "sender",
      render: (val) => val || "Admin",
    },
    {
      title: "Date Sent",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure to delete this notification?"
            onConfirm={() => handleDelete(record._id || record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="notification-management-page">
      <ToastContainer />

      <div className="form-container">
        <Title level={2}>Notification Management</Title>
        <Text>Send new notifications and manage history</Text>
        <Divider />

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ targetAudience: "all" }}
        >
          <Title level={4}>
            {editingNotification ? "Edit Notification" : "Compose Notification"}
          </Title>

          <Form.Item
            name="targetAudience"
            label="Target Audience"
            rules={[
              { required: true, message: "Please select target audience" },
            ]}
          >
            <Select placeholder="Select Audience">
              <Option value="all">All Participants</Option>
              <Option value="students">Students</Option>
              <Option value="mentors">Mentors</Option>
              <Option value="coordinators">Coordinators</Option>
              <Option value="admins">Admins</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Subject"
            rules={[
              { required: true, message: "Please enter subject" },
              { min: 3, message: "At least 3 characters" },
              { max: 100, message: "Cannot exceed 100 characters" },
            ]}
          >
            <Input placeholder="Enter subject" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Message Content"
            rules={[
              { required: true, message: "Please enter description" },
              { min: 10, message: "At least 10 characters" },
              { max: 500, message: "Cannot exceed 500 characters" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter your notification message..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space size="middle" wrap>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={loading}
                disabled={loading}
              >
                {editingNotification
                  ? loading
                    ? "Updating..."
                    : "Update Notification"
                  : loading
                  ? "Sending..."
                  : "Send Notification"}
              </Button>
              <Button
                type="primary"
                danger
                icon={<ClearOutlined />}
                onClick={handleReset}
                disabled={loading}
              >
                Reset Form
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider />
        <Title level={4}>Notification History</Title>

        <div className="table-scroll-container">
          <Table
            dataSource={notifications}
            columns={columns}
            rowKey={(record) => record._id || record.id}
            bordered
            pagination={{ pageSize: 5 }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
