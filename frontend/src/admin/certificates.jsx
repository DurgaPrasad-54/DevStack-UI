import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Table, Button, Typography, Modal, Form, Input, Upload, message, Space } from 'antd';
import { UploadOutlined, EyeOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import config from '../config';

const { Text } = Typography;

const Newsletter = () => {
    const [newsletters, setNewsletters] = useState([]);
    const [selectedNewsletter, setSelectedNewsletter] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm] = Form.useForm();
    const [createForm] = Form.useForm();

    // Fetch newsletters from the backend
    const fetchNewsletters = useCallback(async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/pdf/get`);
            setNewsletters(response.data);
        } catch (error) {
            console.error('Error fetching newsletters:', error);
        }
    }, []);

    useEffect(() => {
        fetchNewsletters();
    }, [fetchNewsletters]);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${config.backendUrl}/pdf/pdf/${id}`);
            message.success('Newsletter deleted successfully!');
            fetchNewsletters();
        } catch (error) {
            console.error('Error deleting newsletter:', error);
        }
    };

    const handleEdit = (newsletter) => {
        setSelectedNewsletter(newsletter);
        setIsEditing(true);
        editForm.setFieldsValue({
            title: newsletter.title,
        });
    };

    const handleEditSubmit = async (values) => {
        try {
            const formData = new FormData();
            formData.append('title', values.title);
            if (values.file) {
                formData.append('file', values.file.file.originFileObj);
            }

            await axios.put(`${config.backendUrl}/pdf/pdf/${selectedNewsletter._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            message.success('Newsletter updated successfully!');
            setIsEditing(false);
            setSelectedNewsletter(null);
            fetchNewsletters();
        } catch (error) {
            console.error('Error updating newsletter:', error);
            message.error('Failed to update newsletter.');
        }
    };

    const handleView = (id) => {
        window.open(`${config.backendUrl}/pdf/get/${id}`, '_blank');
    };

    const handleDownload = async (id, title) => {
        try {
            // Fetch the PDF blob from the server
            const response = await axios.get(`${config.backendUrl}/pdf/get/${id}`, {
                responseType: 'blob', // Set the response type to blob
            });

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const download = true; // You can set this condition based on your requirements

            if (download) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(pdfBlob);
                link.download = `${title}.pdf`; // Use the title for the filename
                link.click();
            } else {
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, '_blank');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            message.error('Failed to download the PDF.');
        }
    };

    const handleCreate = async (values) => {
        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('file', values.file.file.originFileObj);

            await axios.post(`${config.backendUrl}/pdf/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            message.success('Newsletter created successfully!');
            setIsEditing(false);
            createForm.resetFields();
            fetchNewsletters();
        } catch (error) {
            console.error('Error creating newsletter:', error);
            message.error('Failed to create newsletter.');
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            width: '40%',
            render: (text) => <Text ellipsis={{ tooltip: text }}>{text}</Text>,
        },
        {
            title: 'Date Uploaded',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '25%',
            render: (text) => <Text>{moment(text).format('DD-MM-YYYY')}</Text>,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '35%',
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        type="text" 
                        icon={<EyeOutlined />} 
                        onClick={() => handleView(record._id)}
                    />
                    <Button 
                        type="text" 
                        icon={<DownloadOutlined />} 
                        onClick={() => handleDownload(record._id, record.title)}
                    />
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                    />
                    <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDelete(record._id)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="newsletter-container" style={{ padding: '20px', width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Typography.Title level={4}>Certificates</Typography.Title>
                <Button onClick={() => setIsEditing(true)} type="primary">
                    Upload Certificate
                </Button>
            </div>
            
            <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
                <Table
                    dataSource={newsletters}
                    columns={columns}
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }}
                    size="middle"
                />
            </div>
            
            <Modal
                open={isEditing}
                onCancel={() => {
                    setIsEditing(false);
                    setSelectedNewsletter(null);
                }}
                footer={null}
                title={selectedNewsletter ? "Edit Certificate" : "Upload Certificate"}
            >
                <Form form={selectedNewsletter ? editForm : createForm} layout="vertical" onFinish={selectedNewsletter ? handleEditSubmit : handleCreate}>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please input the title!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="file" label="Upload File" rules={[{ required: selectedNewsletter ? false : true, message: 'Please upload a PDF file!' }]}>
                        <Upload accept=".pdf" maxCount={1}>
                            <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {selectedNewsletter ? 'Update Certificate' : 'Upload Certificate'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Newsletter;