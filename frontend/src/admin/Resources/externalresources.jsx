import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Button, Modal, Form, Input, message, Table, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import config from '../../config';

const { Content } = Layout;
const { Search } = Input;
const { Paragraph } = Typography;

const AdminForm = () => {
    const [form] = Form.useForm();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]); // State to manage filtered data
    const [editId, setEditId] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // Number of items per page

    const fetchItems = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/items`);
            const sortedItems = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setItems(sortedItems);
            setFilteredItems(sortedItems); // Initialize filtered items
        } catch (error) {
            console.error('Error fetching items:', error.response || error.message);
            message.error('Failed to fetch items');
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Handle search functionality
    const handleSearch = (value) => {
        setSearchText(value);
        const filteredData = items.filter(item =>
            item.title.toLowerCase().includes(value.toLowerCase()) ||
            item.description.toLowerCase().includes(value.toLowerCase()) ||
            item.hyperlink.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredItems(filteredData);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleSubmit = async (values) => {
        try {
            if (editId) {
                await axios.put(`${config.backendUrl}/items/${editId}`, values);
                message.success('Item updated successfully!');
                setEditId(null);
            } else {
                await axios.post(`${config.backendUrl}/items`, values);
                message.success('Item added successfully!');
            }
            form.resetFields();
            setIsModalVisible(false);
            fetchItems();
        } catch (error) {
            console.error('Error adding/updating item:', error.response || error.message);
            message.error('Error: ' + error.message);
        }
    };

    const handleEdit = (item) => {
        form.setFieldsValue({
            title: item.title,
            hyperlink: item.hyperlink,
            description: item.description,
        });
        setEditId(item._id);
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${config.backendUrl}/items/${id}`);
            message.success('Item deleted successfully!');
            fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error.response || error.message);
            message.error('Error deleting item: ' + error.message);
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: '20%', // Fixed width for title
            render: text => (
                <span>{text}</span>
            ),
        },
        {
            title: 'Hyperlink',
            dataIndex: 'hyperlink',
            key: 'hyperlink',
            width: '5%', // Fixed width for hyperlink
            render: link => (
                <Button 
                    type="link" 
                    onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    View Details
                </Button>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '8%', // Fixed width for description
            render: text => (
                <Paragraph
                    ellipsis={{
                        rows: 3,
                        expandable: true,
                        symbol: 'more'
                    }}
                >
                    {text}
                </Paragraph>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '10%', // Fixed width for actions
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Are you sure to delete this item?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    // Paginate the data
    const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <Layout>
            <Content style={{ padding: '20px' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                    >
                        Add New Item
                    </Button>
                    <Search
                        placeholder="Search items"
                        onSearch={handleSearch}
                        allowClear
                        style={{ width: '200px', maxWidth: '100%' }}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={paginatedItems}
                    rowKey="_id"
                    pagination={{
                        current: currentPage,
                        pageSize,
                        total: filteredItems.length,
                        onChange: (page) => setCurrentPage(page),
                    }}
                    scroll={{ x: '100%' }} // Minimum scroll width
                    style={{
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                    }}
                />

                {/* Modal for Adding/Editing Items */}
                <Modal
                    title={editId ? "Edit Item" : "Add New Item"}
                    visible={isModalVisible}
                    onCancel={() => {
                        setIsModalVisible(false);
                        form.resetFields();
                        setEditId(null);
                    }}
                    footer={null}
                >
                    <Form form={form} onFinish={handleSubmit}>
                        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                            <Input placeholder="Enter title" />
                        </Form.Item>
                        <Form.Item name="hyperlink" label="Hyperlink" rules={[{ required: true }]}>
                            <Input placeholder="Enter hyperlink" />
                        </Form.Item>
                        <Form.Item name="description" label="Description">
                            <Input.TextArea placeholder="Enter description" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                {editId ? "Update Item" : "Add Item"}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Content>
        </Layout>
    );
};

export default AdminForm;