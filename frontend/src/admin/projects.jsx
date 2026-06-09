// ProjectManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  message, 
  Modal, 
  Space, 
  Row, 
  Col,
  Typography,
  Spin
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GithubOutlined, YoutubeOutlined } from '@ant-design/icons';
import axios from 'axios';
import config from '../config';

const { TextArea } = Input;
const { Title } = Typography;

const API_URL = `${config.backendUrl}`;

const ProjectManagement = () => {
  const [form] = Form.useForm();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [fileList, setFileList] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data);
    } catch (err) {
      message.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key]) {
          formData.append(key, values[key]);
        }
      });

      if (fileList[0]?.originFileObj) {
        formData.append('thumbnail', fileList[0].originFileObj);
      }

      if (editingProject) {
        await axios.put(`${API_URL}/projects/${editingProject._id}`, formData);
        message.success('Project updated successfully');
      } else {
        await axios.post(`${API_URL}/projects`, formData);
        message.success('Project created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      setImageUrl('');
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      message.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/projects/${id}`);
      message.success('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      message.error('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setImageUrl(`${API_URL}/projects/${project._id}/thumbnail`);
    setFileList([
      {
        uid: '-1',
        name: 'current-image.png',
        status: 'done',
        url: `${API_URL}/projects/${project._id}/thumbnail`,
      },
    ]);
    form.setFieldsValue({
      title: project.title,
      description: project.description,
      githubLink: project.githubLink,
      youtubeLink: project.youtubeLink,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingProject(null);
    form.resetFields();
    setFileList([]);
    setImageUrl('');
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
    }
    return false;
  };

  const handleChange = ({ fileList }) => setFileList(fileList);

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2}>Project Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Project
        </Button>
      </Row>

      <Modal
        title={editingProject ? 'Edit Project' : 'Add New Project'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={editingProject || {}}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please input the title!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the description!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="githubLink"
            label="GitHub Link"
            rules={[
              {
                pattern: /^https:\/\/github\.com\/.*/,
                message: 'Please enter a valid GitHub URL!',
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="youtubeLink"
            label="YouTube Link"
            rules={[
              {
                pattern: /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\/.*/,
                message: 'Please enter a valid YouTube URL!',
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Thumbnail"
            rules={[{ required: !editingProject, message: 'Please upload a thumbnail!' }]}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleChange}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProject ? 'Update' : 'Create'}
              </Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {projects.map(project => (
            <Col xs={24} sm={12} md={8} lg={6} key={project._id}>
              <Card
                cover={
                  <img
                    alt={project.title}
                    src={`${API_URL}/projects/${project._id}/thumbnail`}
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                }
                actions={[
                  project.githubLink && (
                    <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                      <GithubOutlined key="github" />
                    </a>
                  ),
                  project.youtubeLink && (
                    <a href={project.youtubeLink} target="_blank" rel="noopener noreferrer">
                      <YoutubeOutlined key="youtube" />
                    </a>
                  ),
                  <EditOutlined key="edit" onClick={() => handleEdit(project)} />,
                  <DeleteOutlined 
                    key="delete" 
                    onClick={() => Modal.confirm({
                      title: 'Delete Project',
                      content: 'Are you sure you want to delete this project?',
                      onOk: () => handleDelete(project._id)
                    })} 
                  />,
                ].filter(Boolean)}
              >
                <Card.Meta
                  title={project.title}
                  description={project.description}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  );
};

export default ProjectManagement;