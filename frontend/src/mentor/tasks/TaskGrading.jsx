import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Tabs } from 'antd';
import axios from 'axios';
import MentorDashboard from './MentorDashboard';
import './TaskGrading.css';
import config from '../../config';


const { TabPane } = Tabs;

const TaskGrading = () => {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, [isModalVisible]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/api/mentor-tasks`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const rawData = response.data;

      // Ensure rawData is an array
      const formattedData = Array.isArray(rawData) ? rawData : Object.values(rawData).flat();
      setTasks(formattedData);
    } catch (error) {
      message.error('Failed to fetch tasks');
    }
  };

  const fetchSubmissions = async (taskId) => {
    setSubmissions([]); // Reset submissions before fetching
    try {
      const response = await axios.get(`${config.backendUrl}/api/submissions/${taskId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSubmissions(response.data);
    } catch (error) {
      message.error('Failed to fetch submissions');
    }
  };


  const handleGrade = async (values) => {
    if (!selectedSubmission) {
      message.error('No Submissions selected!')
      return
    };
    const taskId = selectedSubmission.task;
    try {
      await axios.put(`${config.backendUrl}/api/submissions/${selectedSubmission._id}`, values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('Submission graded successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchSubmissions(taskId); // Use stored taskId
    } catch (error) {
      message.error('Failed to grade submission');
    }
  };


  const taskColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Button
          className="view-submissions-btn"
          type="primary"
          onClick={() => fetchSubmissions(record._id)}
        >
          View Submissions
        </Button>
      ),
    },
  ];

  const submissionColumns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
      render: (student) => student?.name || 'Unknown',
    },
    {
      title: 'GitHub Link',
      dataIndex: 'githubLink',
      key: 'githubLink',
      render: (link) => (typeof link === 'string') ? <a className="github-link" href={link} target="_blank" rel="noopener noreferrer">{link}</a> : 'Not provided',
    },
    {
      title: 'Marks',
      dataIndex: 'marks',
      key: 'marks',
      render: (marks) => marks !== null ? marks : 'Not graded',
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Button
          className="grade-btn"
          type="primary"
          onClick={() => { setSelectedSubmission(record); setIsModalVisible(true); }}
        >
          Grade
        </Button>
      ),
    },
  ];

  return (
    <div className="task-grading-container">
      <Tabs defaultActiveKey="1" className="grading-tabs">
        <TabPane tab="Dashboard" key="1">
          <MentorDashboard />
        </TabPane>
        <TabPane tab="Grade Submissions" key="2">
          <div className="grading-section">
            <div className="blog-section-title"> Tasks</div>
            <Table className="task-table" columns={taskColumns} dataSource={tasks || []} rowKey="_id" />

            <div className="blog-section-title">📝 Submissions</div>
            <Table className="submission-table" columns={submissionColumns} dataSource={submissions || []} rowKey="_id" />

            <Modal
              className="grading-modal"
              title="Grade Submission"
              open={isModalVisible}  // Change from visible to open
              onCancel={() => setIsModalVisible(false)}
              footer={null}
            >
              <Form form={form} onFinish={handleGrade} className="grading-form">
                <Form.Item name="marks" label="Marks" rules={[{ required: true }]} className="marks-input">
                  <InputNumber className="marks-number" min={0} max={100} />
                </Form.Item>
                <Form.Item className="form-submit">
                  <Button type="primary" htmlType="submit" className="submit-btn">
                    Grade
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TaskGrading;
