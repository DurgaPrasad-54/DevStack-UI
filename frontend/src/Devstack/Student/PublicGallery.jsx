import { useState, useEffect } from "react";
import {
  Card,
  Spin,
  Empty,
  Row,
  Col,
  Image,
  Typography,
  Space,
  Input,
} from "antd";












import { PictureOutlined, FolderOutlined } from "@ant-design/icons";
import axios from "axios";
import config from "../../config";
import "../Admin/Gallery/Gallery.css";

const { Title, Text } = Typography;
const { Search } = Input;

const PublicGallery = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = images.filter(
        (img) =>
          img.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          img.description?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredImages(filtered);
    } else {
      setFilteredImages(images);
    }
  }, [searchText, images]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.backendUrl}/api/hackathon/gallery/folders`);
      setFolders(res.data.folders || []);
    } catch (error) {
      console.error("Failed to fetch gallery folders:", error);
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
      setFilteredImages(res.data.images || []);
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setSearchText("");
    fetchImages(folder._id);
  };

  return (
    <div style={{ 
      padding: '16px 20px',
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <Title level={2} style={{ 
          color: '#1a1a1a', 
          margin: 0,
          fontSize: '32px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <PictureOutlined style={{ fontSize: '36px' }} />
          Hackathon Gallery
        </Title>
        <Text style={{ 
          fontSize: '16px',
          display: 'block',
          marginTop: '8px',
          color: '#6b7280'
        }}>
          Explore amazing moments from our hackathon events
        </Text>
      </div>

      {!selectedFolder ? (
        <div>
          <Spin spinning={loading} size="large">
            {folders.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '60px 24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                textAlign: 'center'
              }}>
                <Empty 
                  description={
                    <span style={{ fontSize: '16px', color: '#8c8c8c' }}>
                      No gallery folders available yet
                    </span>
                  } 
                />
              </div>
            ) : (
              <Row gutter={[24, 24]}>
                {folders.map((folder) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={folder._id}>
                    <Card
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
                      bodyStyle={{ padding: '24px', textAlign: 'center' }}
                    >
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                      }}>
                        <FolderOutlined style={{ fontSize: '36px', color: 'white' }} />
                      </div>
                      <Title level={4} style={{ 
                        marginBottom: '12px',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#1a1a1a'
                      }}>
                        {folder.hackathonName}
                      </Title>
                      <Text type="secondary" style={{ 
                        display: 'block',
                        marginBottom: '16px',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        minHeight: '42px'
                      }}>
                        {folder.description || 'No description'}
                      </Text>
                      <div style={{
                        padding: '12px 16px',
                        background: '#f0f5ff',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        color: '#667eea'
                      }}>
                        <PictureOutlined style={{ fontSize: '16px' }} />
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
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <Space align="center">
                <span
                  onClick={() => {
                    setSelectedFolder(null);
                    setSearchText("");
                  }}
                  style={{ 
                    cursor: 'pointer', 
                    color: '#667eea',
                    fontSize: '15px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#f0f5ff',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e6f0ff';
                    e.currentTarget.style.transform = 'translateX(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0f5ff';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  ← Back to Folders
                </span>
                <Title level={3} style={{ 
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#1a1a1a'
                }}>
                  {selectedFolder.hackathonName}
                </Title>
              </Space>
              <div style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
              }}>
                {filteredImages.length} {filteredImages.length === 1 ? 'Image' : 'Images'}
              </div>
            </div>
            <Search
              placeholder="Search images by title or description..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              style={{ 
                maxWidth: '500px',
              }}
              allowClear
              // prefix={<SearchOutlined style={{ color: '#667eea' }} />}
            />
          </div>

          {/* Images Grid */}
          <Spin spinning={loading} size="large">
            {filteredImages.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '60px 24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                textAlign: 'center'
              }}>
                <Empty
                  description={
                    <span style={{ fontSize: '16px', color: '#8c8c8c' }}>
                      {searchText ? `No images match "${searchText}"` : "No images in this folder yet"}
                    </span>
                  }
                />
              </div>
            ) : (
              <Row gutter={[20, 20]}>
                {filteredImages.map((image) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={image._id}>
                    <Card
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
                      bodyStyle={{ padding: '16px' }}
                      cover={
                        <div style={{ 
                          position: 'relative', 
                          width: '100%',
                          height: '240px',
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
                              mask: false,
                            }}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: "cover",
                              objectPosition: 'top',
                            }}
                          />
                        </div>
                      }
                    >
                      <div style={{ minHeight: '80px' }}>
                        <Title level={5} className="admin-gallery-image-title">
                          {image.title || image.fileName}
                        </Title>
                        <Text type="secondary" className="admin-gallery-image-description">
                          {image.description || 'No description'}
                        </Text>
                      </div>
                      <div style={{ 
                        padding: '8px 12px',
                        background: '#f5f5f5',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '8px'
                      }}>
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
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
    </div>
  );
};

export default PublicGallery;
