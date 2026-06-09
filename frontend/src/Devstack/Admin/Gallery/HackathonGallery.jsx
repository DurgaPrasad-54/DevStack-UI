import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Spin,
  message,
  Row,
  Col,
  Image,
  Popconfirm,
  Empty,
  Typography,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  FolderOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import config from "../../../config";
import "./Gallery.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

const HackathonGallery = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [editImageModalVisible, setEditImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  
  const [folderForm] = Form.useForm();
  const [imageForm] = Form.useForm();
  const [editImageForm] = Form.useForm();

  useEffect(() => {
    fetchFolders();
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${config.backendUrl}/hackathon/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHackathons(res.data || []);
    } catch (error) {
      console.error("Error fetching hackathons:", error);
    }
  };

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.backendUrl}/api/hackathon/gallery/folders`);
      setFolders(res.data.folders || []);
    } catch (error) {
      message.error("Failed to fetch gallery folders");
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async (folderId) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${config.backendUrl}/api/hackathon/gallery/folders/${folderId}/images`
      );
      setImages(res.data.images || []);
    } catch (error) {
      message.error("Failed to fetch images");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const selectedHackathon = hackathons.find(h => h._id === values.hackathonId);
      
      if (!selectedHackathon) {
        message.error("Selected hackathon not found");
        return;
      }
      
      await axios.post(
        `${config.backendUrl}/api/hackathon/gallery/folders`,
        {
          hackathonName: selectedHackathon.hackathonname,
          hackathonId: values.hackathonId,
          description: values.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      message.success("Gallery folder created successfully");
      setFolderModalVisible(false);
      folderForm.resetFields();
      fetchFolders();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to create folder");
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${config.backendUrl}/api/hackathon/gallery/folders/${folderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      message.success("Folder deleted successfully");
      fetchFolders();
      if (selectedFolder?._id === folderId) {
        setSelectedFolder(null);
        setImages([]);
      }
    } catch (error) {
      message.error("Failed to delete folder");
    }
  };

  const handleUploadImages = async (values) => {
    if (fileList.length === 0) {
      message.error("Please select at least one image");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      fileList.forEach((file) => {
        formData.append("images", file.originFileObj);
      });

      const titles = fileList.map((file, index) => 
        values[`title_${index}`] || file.name
      );
      const descriptions = fileList.map((file, index) => 
        values[`description_${index}`] || ""
      );

      formData.append("titles", JSON.stringify(titles));
      formData.append("descriptions", JSON.stringify(descriptions));

      await axios.post(
        `${config.backendUrl}/api/hackathon/gallery/folders/${selectedFolder._id}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      message.success("Images uploaded successfully");
      setImageModalVisible(false);
      imageForm.resetFields();
      setFileList([]);
      fetchImages(selectedFolder._id);
      fetchFolders();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to upload images");
    }
  };

  const handleUpdateImage = async (values) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${config.backendUrl}/api/hackathon/gallery/images/${selectedImage._id}`,
        values,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success("Image updated successfully");
      setEditImageModalVisible(false);
      editImageForm.resetFields();
      setSelectedImage(null);
      fetchImages(selectedFolder._id);
    } catch (error) {
      message.error("Failed to update image");
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${config.backendUrl}/api/hackathon/gallery/images/${imageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success("Image deleted successfully");
      fetchImages(selectedFolder._id);
      fetchFolders();
    } catch (error) {
      message.error("Failed to delete image");
    }
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    fetchImages(folder._id);
  };

  const uploadProps = {
    listType: "picture-card",
    fileList: fileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("Image must be smaller than 10MB!");
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    multiple: true,
  };

  return (
    <div className="admin-gallery-hackathon-container" style={{
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)'
    }}>
      {/* Header */}
      <div className="admin-gallery-header" style={{
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <Title level={2} style={{ 
            color: 'black', 
            margin: 0,
            fontSize: 'clamp(20px, 5vw, 32px)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <PictureOutlined style={{ fontSize: 'clamp(24px, 5vw, 36px)' }} />
            <span>Hackathon Gallery Management</span>
          </Title>
          <Text style={{ 
            color: 'black', 
            fontSize: 'clamp(13px, 3vw, 16px)',
            display: 'block',
            marginTop: '8px'
          }}>
            Manage hackathon gallery folders and images
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setFolderModalVisible(true)}
          style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            fontWeight: 600,
            height: 'clamp(40px, 10vw, 48px)',
            padding: '0 clamp(16px, 4vw, 32px)',
            fontSize: 'clamp(13px, 3vw, 16px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            whiteSpace: 'nowrap',
            alignSelf: window.innerWidth < 768 ? 'flex-start' : 'center'
          }}
        >
          <span style={{ display: window.innerWidth < 576 ? 'none' : 'inline' }}>Create </span>Folder
        </Button>
      </div>

      {!selectedFolder ? (
        <div>
          <Spin spinning={loading} size="large">
            {folders.length === 0 ? (
              <div className="admin-gallery-folders-view" style={{
                background: 'white',
                borderRadius: '12px',
                padding: 'clamp(30px, 8vw, 60px) clamp(16px, 4vw, 24px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                textAlign: 'center'
              }}>
                <Empty description={
                  <span style={{ fontSize: 'clamp(13px, 3vw, 16px)', color: '#8c8c8c' }}>
                    No gallery folders yet. Create one to get started!
                  </span>
                } />
              </div>
            ) : (
              <Row gutter={[{ xs: 12, sm: 16, md: 20, lg: 24 }, { xs: 12, sm: 16, md: 20, lg: 24 }]}>
                {folders.map((folder) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={folder._id}>
                    <Card
                      className="admin-gallery-folder-card"
                      hoverable
                      onClick={() => handleFolderClick(folder)}
                      style={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        height: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                      }}
                      bodyStyle={{ padding: 'clamp(16px, 4vw, 24px)', textAlign: 'center' }}
                      actions={[
                        <Popconfirm
                          key="delete"
                          title="Delete this folder and all its images?"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDeleteFolder(folder._id);
                          }}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Tooltip title="Delete Folder">
                            <DeleteOutlined
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#ff4d4f', fontSize: '18px' }}
                            />
                          </Tooltip>
                        </Popconfirm>,
                      ]}
                    >
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        width: 'clamp(60px, 15vw, 80px)',
                        height: 'clamp(60px, 15vw, 80px)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto clamp(12px, 3vw, 20px)',
                        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                      }}>
                        <FolderOutlined className="admin-gallery-folder-icon" style={{ fontSize: 'clamp(28px, 7vw, 36px)', color: 'white' }} />
                      </div>
                      <Title level={4} style={{ 
                        marginBottom: '12px',
                        fontSize: 'clamp(15px, 4vw, 18px)',
                        fontWeight: 600,
                        color: '#1a1a1a'
                      }}>
                        {folder.hackathonName}
                      </Title>
                      <Text type="secondary" style={{ 
                        display: 'block',
                        marginBottom: '16px',
                        fontSize: 'clamp(12px, 3vw, 14px)',
                        lineHeight: '1.6',
                        minHeight: 'clamp(36px, 8vw, 42px)'
                      }}>
                        {folder.description || 'No description'}
                      </Text>
                      <div style={{
                        padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                        background: '#f0f5ff',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        color: '#667eea',
                        fontSize: 'clamp(12px, 3vw, 14px)'
                      }}>
                        <PictureOutlined style={{ fontSize: 'clamp(14px, 3vw, 16px)' }} />
                        <span>{folder.imageCount} images</span>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Spin>
        </div>
      ) : (
        <div>
          {/* Images View Header */}
          <div className="admin-gallery-images-view" style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'clamp(16px, 4vw, 24px)',
            marginBottom: 'clamp(16px, 4vw, 24px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <Space align="center" size="large" wrap>
                <Button 
                  onClick={() => setSelectedFolder(null)}
                  size="large"
                  style={{
                    background: '#f0f5ff',
                    color: '#667eea',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0 clamp(12px, 3vw, 20px)',
                    fontSize: 'clamp(13px, 3vw, 15px)',
                    height: 'clamp(36px, 9vw, 40px)'
                  }}
                >
                  ← Back
                </Button>
                <div>
                  <Title level={3} style={{ 
                    margin: 0,
                    fontSize: 'clamp(18px, 4vw, 24px)',
                    fontWeight: 700,
                    color: '#1a1a1a'
                  }}>
                    {selectedFolder.hackathonName}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>
                    Manage images for this hackathon
                  </Text>
                </div>
              </Space>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                size="large"
                onClick={() => setImageModalVisible(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  fontWeight: 600,
                  height: 'clamp(40px, 10vw, 48px)',
                  padding: '0 clamp(16px, 4vw, 32px)',
                  fontSize: 'clamp(13px, 3vw, 16px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                Upload
              </Button>
            </div>
          </div>

          <Spin spinning={loading} size="large">
            {images.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: 'clamp(30px, 8vw, 60px) clamp(16px, 4vw, 24px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                textAlign: 'center'
              }}>
                <Empty description={
                  <span style={{ fontSize: 'clamp(13px, 3vw, 16px)', color: '#8c8c8c' }}>
                    No images in this folder yet
                  </span>
                } />
              </div>
            ) : (
              <Row gutter={[{ xs: 12, sm: 16, md: 20, lg: 20 }, { xs: 12, sm: 16, md: 20, lg: 20 }]}>
                {images.map((image) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={image._id}>
                    <Card
                      className="admin-gallery-image-card"
                      hoverable
                      style={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden',
                        height: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                      }}
                      bodyStyle={{ padding: 'clamp(12px, 3vw, 16px)' }}
                      cover={
                        <div style={{ 
                          position: 'relative', 
                          width: '100%',
                          height: 'clamp(160px, 40vw, 240px)',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center'
                        }}>
                          <Image
                            alt={image.title || image.fileName}
                            src={`${config.backendUrl}${image.imageUrl}`}
                            preview={{
                              mask: (
                                <div style={{
                                  background: 'rgba(102, 126, 234, 0.8)',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  fontWeight: 600,
                                  color: 'white'
                                }}>
                                  👁️ View Image
                                </div>
                              ),
                            }}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: "cover",
                              objectPosition: 'top',
                              transition: 'transform 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          />
                        </div>
                      }
                      actions={[
                        <Tooltip key="edit" title="Edit Details">
                          <EditOutlined
                            onClick={() => {
                              setSelectedImage(image);
                              editImageForm.setFieldsValue({
                                title: image.title,
                                description: image.description,
                              });
                              setEditImageModalVisible(true);
                            }}
                            style={{ color: '#1890ff', fontSize: '18px' }}
                          />
                        </Tooltip>,
                        <Popconfirm
                          key="delete"
                          title="Delete this image?"
                          onConfirm={() => handleDeleteImage(image._id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Tooltip title="Delete Image">
                            <DeleteOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
                          </Tooltip>
                        </Popconfirm>,
                      ]}
                    >
                      <div style={{ minHeight: 'clamp(70px, 15vw, 80px)' }}>
                        <Title level={5} className="admin-gallery-image-title">
                          {image.title || image.fileName}
                        </Title>
                        <Text type="secondary" className="admin-gallery-image-description">
                          {image.description || 'No description'}
                        </Text>

                      </div>
                      <div style={{ 
                        padding: 'clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)',
                        background: '#f5f5f5',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '8px'
                      }}>
                        <Text type="secondary" style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500 }}>
                          📅 {new Date(image.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Spin>
        </div>
      )}

      {/* Create Folder Modal */}
      <Modal
        title="Create Gallery Folder"
        open={folderModalVisible}
        onCancel={() => {
          setFolderModalVisible(false);
          folderForm.resetFields();
        }}
        footer={null}
      >
        <Form form={folderForm} onFinish={handleCreateFolder} layout="vertical">
          <Form.Item
            name="hackathonId"
            label="Select Hackathon"
            rules={[{ required: true, message: "Please select a hackathon" }]}
          >
            <select className="ant-input">
              <option value="">Select Hackathon</option>
              {hackathons.map((hack) => (
                <option key={hack._id} value={hack._id}>
                  {hack.hackathonname}
                </option>
              ))}
            </select>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter folder description" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
              <Button onClick={() => setFolderModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Images Modal */}
      <Modal
        title="Upload Images"
        open={imageModalVisible}
        onCancel={() => {
          setImageModalVisible(false);
          imageForm.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={800}
      >
        <Form form={imageForm} onFinish={handleUploadImages} layout="vertical">
          <Form.Item label="Select Images">
            <Upload {...uploadProps}>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          {fileList.map((file, index) => (
            <Card key={index} style={{ marginBottom: 16 }} size="small">
              <Title level={5}>{file.name}</Title>
              <Form.Item
                name={`title_${index}`}
                label="Title"
                initialValue={file.name}
              >
                <Input placeholder="Enter image title" />
              </Form.Item>
              <Form.Item name={`description_${index}`} label="Description">
                <TextArea rows={2} placeholder="Enter image description" />
              </Form.Item>
            </Card>
          ))}

          {fileList.length > 0 && (
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Upload All
                </Button>
                <Button
                  onClick={() => {
                    setImageModalVisible(false);
                    imageForm.resetFields();
                    setFileList([]);
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Edit Image Modal */}
      <Modal
        title="Edit Image Details"
        open={editImageModalVisible}
        onCancel={() => {
          setEditImageModalVisible(false);
          editImageForm.resetFields();
          setSelectedImage(null);
        }}
        footer={null}
      >
        <Form form={editImageForm} onFinish={handleUpdateImage} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input placeholder="Enter image title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter image description" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
              <Button
                onClick={() => {
                  setEditImageModalVisible(false);
                  editImageForm.resetFields();
                  setSelectedImage(null);
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HackathonGallery;
