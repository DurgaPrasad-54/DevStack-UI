import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, message, Card, Spin } from 'antd';
import axios from 'axios';
import './TaskSubmission.css';
import config from '../../config';

const TaskSubmission = () => {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form] = Form.useForm();
  const [showSubmitted, setShowSubmitted] = useState(true);
  const [showAllSubmitted, setShowAllSubmitted] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  // GitHub URL validation regex pattern
  const githubUrlPattern = /^https?:\/\/(?:www\.)?github\.com\/[\w-]+\/[\w.-]+(?:\/)?$/;

  useEffect(() => {
    fetchTasks();
    fetchSubmissions();
  }, []);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const response = await axios.get(`${config.backendUrl}/api/tasks`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setTasks(response.data);
    } catch (error) {
      message.error('Failed to fetch tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const studentId = localStorage.getItem('student'); 
      const response = await axios.get(`${config.backendUrl}/api/submissions/completed/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const sortedSubmissions = response.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setSubmissions(sortedSubmissions);
    } catch (error) {
      message.error('Failed to fetch submissions');
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await axios.post(`${config.backendUrl}/api/submissions`, { ...values, taskId: selectedTask._id }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('Submission created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchSubmissions();
      setShowSubmitted(true);
    } catch (error) {
      message.error('Failed to create submission');
    }
  };

  const handleViewAll = () => {
    setShowAllSubmitted(true);
  };

  const handleViewLess = () => {
    setShowAllSubmitted(false);
    document.querySelector('.task-submission-container').scrollIntoView({ behavior: 'smooth' });
  };

  const getDisplayedSubmissions = () => {
    return showAllSubmitted ? submissions : submissions.slice(0, 4);
  };

  const getCardClassName = (taskCount) => {
    return taskCount === 1 ? 'task-card' : 'task-card small-card';
  };

  return (
    <div className="task-submission-container">
      <h2 className="task-submission-heading">Tasks</h2>
      <div className="task-blog-list">
        <div className={`blog-item ${!showSubmitted ? 'active' : ''}`} onClick={() => setShowSubmitted(false)}>
         Ongoing Tasks
        </div>
        <div className={`blog-item ${showSubmitted ? 'active' : ''}`} onClick={() => setShowSubmitted(true)}>
          Submitted Tasks
        </div>
      </div>
      
      <div className="task-card-container">
        {showSubmitted ? (
          isLoadingSubmissions ? (
            <div className="loading-container">
              <Spin size="large" />
              <p className="loading-text">Loading submissions...</p>
            </div>
          ) : getDisplayedSubmissions().length === 0 ? (
            <p className="no-tasks-message">There are no submissions</p>
          ) : (
            getDisplayedSubmissions().map(submission => (
              <Card key={submission._id} title={submission.task?.title || 'No Title'} className="task-card small-card">
                <p className="task-card-description">{submission.task?.description || 'No Description'}</p>
                <p><strong>GitHub Link:</strong> <a href={submission.githubLink} target="_blank" rel="noopener noreferrer">{submission.githubLink}</a></p>
                <p><strong>Marks:</strong> {submission.marks !== null ? submission.marks : 'Not graded'}</p>
                <p><strong>Submitted:</strong> {new Date(submission.createdAt).toLocaleDateString()}</p>
              </Card>
            ))
          )
        ) : (
          isLoadingTasks ? (
            <div className="loading-container">
              <Spin size="large" />
              <p className="loading-text">Loading tasks...</p>
            </div>
          ) : tasks.filter(task => !submissions.some(submission => submission.task && submission.task._id === task._id)).length === 0 ? (
            <p className="no-tasks-message">Tasks not found</p>
          ) : (
            tasks.filter(task => !submissions.some(submission => submission.task && submission.task._id === task._id)).map(task => (
              <Card key={task._id} title={task.title} className={getCardClassName(tasks.length)}>
                <p className="task-card-description">{task.description}</p>
                <Button type="primary" className="task-card-button" onClick={() => { setSelectedTask(task); setIsModalVisible(true); }}>
                  Submit
                </Button>
              </Card>
            ))
          )
        )}
      </div>

      {showSubmitted && submissions.length > 4 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          {!showAllSubmitted ? (
            <Button type="link" onClick={handleViewAll}>
              View All
            </Button>
          ) : (
            <Button type="link" onClick={handleViewLess}>
              View Less
            </Button>
          )}
        </div>
      )}

      <Modal
        title="Submit Task"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        className="task-submission-modal"
      >
        <Form form={form} onFinish={handleSubmit} className="task-submission-form">
          <Form.Item 
            name="githubLink" 
            label="GitHub Link" 
            rules={[
              { required: true, message: 'Please enter a GitHub repository URL' },
              {
                pattern: githubUrlPattern,
                message: 'Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)'
              },
              {
                validator: async (_, value) => {
                  if (value && !value.startsWith('https://github.com/')) {
                    throw new Error('URL must be from github.com');
                  }
                }
              }
            ]} 
            className="task-submission-form-item"
          >
            <Input 
              className="task-submission-input" 
              placeholder="https://github.com/username/repository"
            />
          </Form.Item>
          <Form.Item className="task-submission-form-item">
            <Button type="primary" htmlType="submit" className="task-submission-submit-button">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskSubmission;