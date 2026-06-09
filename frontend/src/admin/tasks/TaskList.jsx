import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import axios from 'axios';
import config from '../../config';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/api/tasks`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setTasks(response.data);
    } catch (error) {
      message.error('Failed to fetch tasks');
    }
  };

  const handleCreateTask = async (values) => {
    try {
      await axios.post(`${config.backendUrl}/api/tasks`, values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('Task created successfully');
      fetchTasks();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to create task');
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: '30%',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: '70%',
    },
  ];

  return (
    <div className="task-list-container" style={{ width: '100%', overflowX: 'auto',marginTop:'20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          Create Task
        </Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={tasks} 
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: '100%' }}
        style={{ width: '100%' }}
      />

      <Modal
        title="Create Task"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateTask} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskList;