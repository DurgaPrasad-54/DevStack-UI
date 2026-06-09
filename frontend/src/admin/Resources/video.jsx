import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Card, Button, Modal, Form, Input, message, Table, Select, Row, Col, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import config from '../../config';

const { Content } = Layout;
const { Option } = Select;

// Ensure this matches your backend server's URL
const API_BASE_URL = `${config.backendUrl}/videos`;

function VideoResourceManager() {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isCreateFolderModalVisible, setIsCreateFolderModalVisible] = useState(false);
  const [isEditFolderModalVisible, setIsEditFolderModalVisible] = useState(false);
  const [isCreateVideoModalVisible, setIsCreateVideoModalVisible] = useState(false);
  const [isEditVideoModalVisible, setIsEditVideoModalVisible] = useState(false);
  const [isVideosModalVisible, setIsVideosModalVisible] = useState(false);

  const [createFolderForm] = Form.useForm();
  const [editFolderForm] = Form.useForm();
  const [createVideoForm] = Form.useForm();
  const [editVideoForm] = Form.useForm();

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      console.log('Fetched Folders:', response.data);
      setFolders(response.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      message.error('Failed to fetch folders');
    }
  };

  const fetchFolderDetails = async (folderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${folderId}`);
      console.log('Folder Details:', response.data);
      setSelectedFolder(response.data);
      setVideos(response.data.videos);
      setIsVideosModalVisible(true);
    } catch (error) {
      console.error('Error fetching folder details:', error);
      message.error('Failed to fetch folder details');
    }
  };

  const handleCreateFolder = async (values) => {
    try {
      await axios.post(API_BASE_URL, values);
      message.success('Folder created successfully');
      fetchFolders();
      setIsCreateFolderModalVisible(false);
      createFolderForm.resetFields();
    } catch (error) {
      console.error('Create folder error:', error);
      message.error('Failed to create folder');
    }
  };

  const handleEditFolder = async (values) => {
    try {
      await axios.put(`${API_BASE_URL}/${selectedFolder._id}`, values);
      message.success('Folder updated successfully');
      fetchFolders();
      setIsEditFolderModalVisible(false);
      editFolderForm.resetFields();
    } catch (error) {
      console.error('Edit folder error:', error);
      message.error('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await axios.delete(`${API_BASE_URL}/${folderId}`);
      message.success('Folder deleted successfully');
      fetchFolders();
    } catch (error) {
      console.error('Delete folder error:', error);
      message.error('Failed to delete folder');
    }
  };

  const handleCreateVideo = async (values) => {
    try {
      await axios.post(`${API_BASE_URL}/${selectedFolder._id}/videos`, values);
      message.success('Video added successfully');
      fetchFolderDetails(selectedFolder._id);
      setIsCreateVideoModalVisible(false);
      createVideoForm.resetFields();
    } catch (error) {
      console.error('Create video error:', error);
      message.error('Failed to add video');
    }
  };

  // Updated handleEditVideo function
  const handleEditVideo = async (values) => {
    try {
      // Ensure the _id of the video is included in the values
      await axios.put(`${API_BASE_URL}/${selectedFolder._id}/videos/${values._id}`, values); 
      message.success('Video updated successfully');
      fetchFolderDetails(selectedFolder._id); // Refresh videos after editing
      setIsEditVideoModalVisible(false); // Close modal
    } catch (error) {
      console.error('Edit video error:', error);
      message.error('Failed to update video');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      await axios.delete(`${API_BASE_URL}/${selectedFolder._id}/videos/${videoId}`);
      message.success('Video deleted successfully');
      fetchFolderDetails(selectedFolder._id); // Refresh videos after deletion
    } catch (error) {
      console.error('Delete video error:', error);
      message.error('Failed to delete video');
    }
  };

  const videoColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Link', dataIndex: 'link', key: 'link', render: link => (
        <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
    )},
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { 
        title: 'Actions', 
        key: 'actions', 
        render: (_, record) => (
            <div>
                <Button icon={<EditOutlined />} onClick={() => { 
                    editVideoForm.setFieldsValue(record); 
                    editVideoForm.setFieldsValue({ _id: record._id }); // Set the ID for editing
                    setIsEditVideoModalVisible(true); // Open edit video modal
                }} />
                <Popconfirm title="Are you sure you want to delete this video?" onConfirm={() => handleDeleteVideo(record._id)} okText="Yes" cancelText="No">
                    <Button icon={<DeleteOutlined />} danger />
                </Popconfirm>
            </div>
        ) 
    }
];

return (
    <Layout>
        <Content style={{ padding: '20px' }}>
            <Row gutter={[16, 16]} justify="center">
                <Col span={24}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateFolderModalVisible(true)} style={{ display: 'block', margin: '0 auto' }}>
                        Create Folder
                    </Button>
                </Col>
                {folders.map(folder => (
                    <Col key={folder._id} xs={24} sm={12} md={8}>
                        <Card hoverable cover={
                            <img alt={folder.folderTitle} src={folder.folderThumbnail} style={{ height: 200, objectFit: 'cover' }} />
                        } actions={[
                            <Button icon={<EyeOutlined />} onClick={() => fetchFolderDetails(folder._id)} />,
                            <Button icon={<PlusOutlined />} onClick={() => { 
                                setSelectedFolder(folder); 
                                setIsCreateVideoModalVisible(true); 
                            }} />,
                            <Button icon={<EditOutlined />} onClick={() => { 
                                editFolderForm.setFieldsValue({ folderTitle: folder.folderTitle, folderThumbnail: folder.folderThumbnail }); 
                                setSelectedFolder(folder); 
                                setIsEditFolderModalVisible(true); 
                            }} />,
                            <Popconfirm title="Are you sure you want to delete this folder?" onConfirm={() => handleDeleteFolder(folder._id)} okText="Yes" cancelText="No">
                                <Button icon={<DeleteOutlined />} danger />
                            </Popconfirm>
                        ]}>
                            <Card.Meta title={folder.folderTitle} />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Create Folder Modal */}
            <Modal title="Create Folder" visible={isCreateFolderModalVisible} onCancel={() => setIsCreateFolderModalVisible(false)} footer={null}>
                <Form form={createFolderForm} onFinish={handleCreateFolder}>
                    <Form.Item name="folderTitle" rules={[{ required: true, message: 'Please input folder title!' }]}>
                        <Input placeholder="Folder Title" />
                    </Form.Item>
                    <Form.Item name="folderThumbnail" rules={[{ required: true, message: 'Please input thumbnail URL!' }]}>
                        <Input placeholder="Thumbnail URL" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit"> Create Folder </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Folder Modal */}
            <Modal title="Edit Folder" visible={isEditFolderModalVisible} onCancel={() => setIsEditFolderModalVisible(false)} footer={null}>
                <Form form={editFolderForm} onFinish={handleEditFolder}>
                    <Form.Item name="folderTitle" rules={[{ required: true, message: 'Please input folder title!' }]}>
                        <Input placeholder="Folder Title" />
                    </Form.Item>
                    <Form.Item name="folderThumbnail" rules={[{ required: true, message: 'Please input thumbnail URL!' }]}>
                        <Input placeholder="Thumbnail URL" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit"> Update Folder </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Videos Modal */}
            <Modal title={`Videos in ${selectedFolder?.folderTitle}`} visible={isVideosModalVisible} onCancel={() => setIsVideosModalVisible(false)} width={800} footer={[
                <Button key="close" onClick={() => setIsVideosModalVisible(false)}> Close </Button>
            ]}>
                <Table columns={videoColumns} dataSource={videos} rowKey="_id" />
            </Modal>

            {/* Create Video Modal */}
            <Modal title="Add Video" visible={isCreateVideoModalVisible} onCancel={() => { 
                setIsCreateVideoModalVisible(false); 
                createVideoForm.resetFields(); 
            }} footer={null}>
                <Form form={createVideoForm} onFinish={handleCreateVideo}>
                    <Form.Item name="title" rules={[{ required: true, message: 'Please input video title!' }]}>
                        <Input placeholder="Video Title" />
                    </Form.Item>
                    <Form.Item name="description" rules={[{ required: true, message: 'Please input video description!' }]}>
                        <Input placeholder="Description" />
                    </Form.Item>
                    <Form.Item name="link" rules={[{ required: true, message: 'Please input video link!' }]}>
                        <Input placeholder="Video Link" />
                    </Form.Item>
                    <Form.Item name="type" rules={[{ required: true, message: 'Please select video type!' }]}>
                        <Select placeholder="Select Video Type">
                            <Option value="video">Lecture</Option>
                            <Option value="playlist">Tutorial</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit"> Add Video </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Video Modal */}
            {/* New Modal for Editing Videos */}
            <Modal title="Edit Video" visible={isEditVideoModalVisible} onCancel={() => { 
                setIsEditVideoModalVisible(false); 
                editVideoForm.resetFields(); 
            }} footer={null}>
                {/* Pass the current video ID for editing */}
                <Form form={editVideoForm} onFinish={handleEditVideo}>
                    {/* Hidden field for video ID */}
                    {/* Note that we are setting the _id directly in the form data */}
                    {/* This ensures it is sent with the PUT request */}
                    <input type="hidden" name="_id"/>
                    
                    {/* Fields for editing */}
                    <Form.Item name="_id" hidden> {/* Hidden field for ID */}</Form.Item> 
                    
                    {/* Fields for editing */}
                    <Form.Item name="title" rules={[{ required: true, message: 'Please input video title!' }]}>
                        <Input placeholder="Video Title" />
                    </Form.Item>
                    <Form.Item name="description">
                        <Input placeholder="Description" />
                    </Form.Item>
                    <Form.Item name="link" rules={[{ required: true, message: 'Please input video link!' }]}>
                        <Input placeholder="Video Link" />
                    </Form.Item>
                    {/* Optional field for type; can be pre-filled if needed */}
                    <Form.Item name="type">
                        {/* Optional field for type; can be pre-filled if needed */}
                        <Select placeholder="Select Video Type">
                            <Option value="video">Lecture</Option>
                            <Option value="playlist">Tutorial</Option>
                        </Select>
                    </Form.Item>

                    {/* Submit button */}
                    {/* Ensure that when opening this modal we have already filled in all fields correctly */}
                    {/* The _id should be included in values when calling handleEditVideo */}
                    
                    {/* Submit button */}
                    <Form.Item>
                        <Button type="primary" htmlType="submit"> Update Video </Button>
                    </Form.Item>  
                </Form>  
            </Modal> 

        </Content>  
    </Layout>  
);  
}

export default VideoResourceManager;
