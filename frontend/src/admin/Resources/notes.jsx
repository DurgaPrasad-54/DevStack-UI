import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Select,
  Space,
  Spin
} from 'antd';
import {
  FolderAddOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import config from '../../config';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`;

const { Header, Content } = Layout;
const { Option } = Select;

const App = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.backendUrl}/notes`);
      setFolders(response.data);
    } catch (error) {
      message.error('Error fetching folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreateFolder = async (values) => {
    try {
      await axios.post(`${config.backendUrl}/notes`, values);
      message.success('Folder created successfully');
      setFolderModalVisible(false);
      form.resetFields();
      fetchFolders();
    } catch (error) {
      message.error('Error creating folder');
    }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    
    // Handle both single and multiple files
    if (Array.isArray(file)) {
      file.forEach((f) => formData.append('files', f));
    } else {
      formData.append('files', file);
    }

    try {
      await axios.post(`${config.backendUrl}/notes/${selectedFolder}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess('ok');
      message.success('Files uploaded successfully');
      setUploadModalVisible(false);
      fetchFolders();
    } catch (error) {
      onError(error);
      message.error('Error uploading files');
    }
  };

  const handleDelete = async (record, fileId = null) => {
    try {
      if (fileId) {
        await axios.delete(`${config.backendUrl}/notes/${record._id}/files/${fileId}`);
        message.success('File deleted successfully');
      } else {
        await axios.delete(`${config.backendUrl}/notes/${record._id}`);
        message.success('Folder deleted successfully');
      }
      fetchFolders();
    } catch (error) {
      message.error('Error deleting item');
    }
  };

  const handlePreviewPdf = async (folderId, fileId) => {
    const url = `${config.backendUrl}/notes/files/${folderId}/${fileId}`;
    setSelectedPdfUrl(url);
    setPageNumber(1);
    setPdfPreviewVisible(true);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Previous/Next page handlers
  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

  const getFilteredFiles = (files) => {
    if (!searchText) return files;
    return files.filter(file => file.fileName.toLowerCase().includes(searchText.toLowerCase()));
  };

  const columns = [
    {
      title: 'Folder',
      dataIndex: 'folderTitle',
      key: 'folderTitle',
      filters: folders.map(folder => ({
        text: folder.folderTitle,
        value: folder.folderTitle,
      })),
      onFilter: (value, record) => record.folderTitle === value,
      width: '20%',
    },
    {
      title: () => (
        <Space>
          Files
          <Input 
            placeholder="Search files" 
            prefix={<SearchOutlined />} 
            onChange={e => setSearchText(e.target.value)} 
            style={{ width: 100 }} 
          />
        </Space>
      ),
      dataIndex: 'files',
      key: 'files',
      width: '60%',
      render: (files, record) => {
        const filteredFiles = getFilteredFiles(files);
        return (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredFiles.map(file => (
              <li key={file._id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ wordBreak: 'break-word', maxWidth: '70%' }}>
                  {file.fileName}
                </div>
                <Space size="small">
                  <Button 
                    icon={<EyeOutlined />} 
                    onClick={() => handlePreviewPdf(record._id, file._id)} 
                    size="small"
                  />
                  <Button 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDelete(record, file._id)} 
                    danger 
                    size="small"
                  />
                </Space>
              </li>
            ))}
          </ul>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)} 
            danger 
          />
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <Content style={{ padding: '0', overflowX: 'auto' }}>
        <Space style={{ margin: 16, display: 'flex', justifyContent: 'space-around' }}>
          <Button 
            type="primary" 
            icon={<FolderAddOutlined />} 
            onClick={() => setFolderModalVisible(true)}
          >
            Create Folder
          </Button>
          <Button 
            icon={<UploadOutlined />} 
            onClick={() => setUploadModalVisible(true)}
          >
            Upload PDFs
          </Button>
        </Space>

        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
          <Table 
            dataSource={folders} 
            columns={columns} 
            loading={loading} 
            rowKey="_id"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10 }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Create Folder Modal */}
        <Modal 
          title="Create New Folder" 
          open={folderModalVisible} 
          onCancel={() => setFolderModalVisible(false)} 
          footer={null}
        >
          <Form form={form} onFinish={handleCreateFolder}>
            <Form.Item 
              name="folderTitle" 
              rules={[{ required: true, message: 'Please enter folder title' }]}
            >
              <Input placeholder="Folder Title" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Create</Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Upload PDF Modal */}
        <Modal 
          title="Upload PDFs" 
          open={uploadModalVisible} 
          onCancel={() => setUploadModalVisible(false)} 
          footer={null}
        >
          <Form>
            <Form.Item 
              name="folder" 
              rules={[{ required: true, message: 'Please select a folder' }]}
            >
              <Select 
                placeholder="Select Folder" 
                onChange={(value) => setSelectedFolder(value)}
              >
                {folders.map(folder => (
                  <Option key={folder._id} value={folder._id}>
                    {folder.folderTitle}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Upload 
                customRequest={handleUpload} 
                accept=".pdf"
                multiple={true}
              >
                <Button icon={<UploadOutlined />}>Select PDFs</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>

        {/* PDF Preview Modal */}
        <Modal
          title="PDF Preview"
          open={pdfPreviewVisible}
          onCancel={() => { setPdfPreviewVisible(false); setSelectedPdfUrl(null); }}
          width="80%"
          style={{ maxWidth: '1000px' }}
          footer={null}
        >
          {selectedPdfUrl && (
            <iframe
              src={selectedPdfUrl}
              style={{ width: '100%', height: '70vh', border: 'none' }}
              title="PDF Preview"
            />
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default App;