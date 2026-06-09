import React, { useState, useEffect, useCallback } from 'react';
import { Card, Select, Progress, Row, Col, Typography, Modal, List, Spin } from 'antd';
import ReactSpeedometer from "react-d3-speedometer";
import axios from 'axios';
import './MentorDashboard.css';
import config from '../../config';

const { Option } = Select;
const { Title } = Typography;

const MentorDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [submissionStats, setSubmissionStats] = useState({
    totalStudents: 0,
    totalSubmissions: 0,
    teamSubmissions: 0,
    teamTotalStudents: 0,
    completionPercentage: 0
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentTasks, setStudentTasks] = useState({ completed: [], notCompleted: [] });
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Loading states
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [loadingStudentTasks, setLoadingStudentTasks] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  // Track window dimensions
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  // Key for forcing component refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to reload the component data
  const refreshDashboard = useCallback(() => {
    fetchTeams();
    fetchSubmissionStats();
    fetchTasks();
    if (selectedTeam) {
      fetchTeamSubmissionStats(selectedTeam);
      fetchTeamMembers(selectedTeam);
    }
    // Increment refresh key to force re-render
    setRefreshKey(prevKey => prevKey + 1);
  }, [selectedTeam]);

  useEffect(() => {
    fetchTeams();
    fetchSubmissionStats();
    fetchTasks();
    
    // Set up window resize listener
    let resizeTimer;
    const handleResize = () => {
      // Clear previous timeout
      clearTimeout(resizeTimer);
      
      // Set a timeout to refresh component after resize ends
      resizeTimer = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        // Only refresh if the dimensions actually changed
        if (newWidth !== windowDimensions.width || newHeight !== windowDimensions.height) {
          setWindowDimensions({ width: newWidth, height: newHeight });
          refreshDashboard();
        }
      }, 500); // 500ms delay to avoid multiple refreshes during resize
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [refreshDashboard]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamSubmissionStats(selectedTeam);
      fetchTeamMembers(selectedTeam);
    }
  }, [selectedTeam]);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < submissionStats.completionPercentage) {
        progress += 1;
        setAnimatedValue(progress);
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [submissionStats.completionPercentage]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/mentor/my-mentored-teams`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchSubmissionStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axios.get(`${config.backendUrl}/api/submissions/mentor/completion`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSubmissionStats(prev => ({
        ...prev,
        totalStudents: response.data.totalStudents,
        totalSubmissions: response.data.totalSubmissions,
        completionPercentage: response.data.completionPercentage
      }));
    } catch (error) {
      console.error('Error fetching submission stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTeamSubmissionStats = async (teamId) => {
    try {
      const response = await axios.get(`${config.backendUrl}/api/submissions/team/${teamId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSubmissionStats(prev => ({
        ...prev,
        teamSubmissions: response.data.submissions,
        teamTotalStudents: response.data.totalStudents
      }));
    } catch (error) {
      console.error('Error fetching team submission stats:', error);
    }
  };

  const fetchTeamMembers = async (teamId) => {
    setLoadingTeamMembers(true);
    setTeamMembers([]); // Clear previous team members while loading
    try {
      const response = await axios.get(`${config.backendUrl}/api/teams/${teamId}/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const membersWithTaskCompletion = await Promise.all(response.data.map(async (member) => {
        const completedTasks = await fetchCompletedTasks(member._id);
        return { ...member, completedTasks };
      }));
      setTeamMembers(membersWithTaskCompletion);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const fetchCompletedTasks = async (studentId) => {
    try {
      const response = await axios.get(`${config.backendUrl}/api/submissions?studentId=${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data.length;
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      return 0;
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/api/tasks`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchStudentTasks = async (studentId) => {
    setLoadingStudentTasks(true);
    setStudentTasks({ completed: [], notCompleted: [] }); // Clear previous tasks while loading
    try {
      const response = await axios.get(`${config.backendUrl}/api/submissions/completed/${studentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const completedTasks = response.data.map(submission => submission.task);
      const notCompletedTasks = tasks.filter(task => !completedTasks.some(completedTask => completedTask._id === task._id));
      setStudentTasks({ completed: completedTasks, notCompleted: notCompletedTasks });
    } catch (error) {
      console.error('Error fetching student tasks:', error);
    } finally {
      setLoadingStudentTasks(false);
    }
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setIsModalVisible(true);
    await fetchStudentTasks(student._id);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedStudent(null);
    setStudentTasks({ completed: [], notCompleted: [] });
  };

  const handleTeamChange = (value) => {
    setSelectedTeam(value);
  };

  return (
    <div className="mentor-dashboard" key={refreshKey}>
      <Title level={2} className="dashboard-title">Submission Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Team Submissions" className="team-submissions-card">
            <div className="side-by-side-container">
              <div className="team-selection-container">
                <Select
                  className="team-select"
                  placeholder="Select a team"
                  onChange={handleTeamChange}
                  value={selectedTeam}
                >
                  {Array.isArray(teams) && teams.map(team => (
                    <Option key={team.id} value={team.id}>{team.name}</Option>
                  ))}
                </Select>
                {selectedTeam && (
                  <div className="team-details">
                    <p>Team Members:</p>
                    {loadingTeamMembers ? (
                      <div className="loading-container">
                        <Spin tip="Loading team members..." />
                      </div>
                    ) : (
                      <ul className="team-members-list">
                        {teamMembers.map(member => (
                          <li key={member._id} onClick={() => handleStudentClick(member)}>
                            {member.name} - {member.completedTasks} out of {tasks.length} tasks completed
                          </li>
                        ))}
                      </ul>
                    )}
                    {!loadingTeamMembers && teamMembers.length > 0 && (
                      <>
                        <p>Team Task Completion:</p>
                        <Progress
                          percent={((teamMembers.reduce((acc, member) => acc + member.completedTasks, 0) / (teamMembers.length * tasks.length)) * 100 || 0).toFixed(2)}
                          status="active"
                          className="task-completion-progress"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="speedometer-container">
                <Title level={4} className="speedometer-title">Overall Task Completion</Title>
                {loadingStats ? (
                  <div className="loading-container">
                    <Spin tip="Loading completion stats..." />
                  </div>
                ) : (
                  <ReactSpeedometer
                    key={`${animatedValue}-${windowDimensions.width}`}
                    value={animatedValue}
                    minValue={0}
                    maxValue={100}
                    segments={100}
                    width={windowDimensions.width <= 320 ? 250 : windowDimensions.width <= 375 ? 300 : windowDimensions.width <= 425 ? 350 : windowDimensions.width <= 768 ? 390 : windowDimensions.width <= 1440 ? 400 : 500}
                    height={windowDimensions.width <= 320 ? 250 : windowDimensions.width <= 375 ? 300 : windowDimensions.width <= 425 ? 350 : windowDimensions.width <= 768 ? 390 : windowDimensions.width <= 1024 ? 250 : windowDimensions.width <= 1440 ? 290 : 300}
                    customSegmentStops={[0, animatedValue, 100]}
                    segmentColors={[
                      animatedValue <= 50 ? '#ff0000' : animatedValue <= 75 ? '#ffff00' : '#22c55e',
                      '#e0e0e0'
                    ]}
                    currentValueText={`${animatedValue.toFixed(1)}% Tasks Completed`}
                    startAngle={-90}
                    endAngle={90}
                    needleHeightRatio={0}
                    ringWidth={windowDimensions.width <= 425 ? 20 : windowDimensions.width <= 768 ? 25 : 30}
                    textColor="#000"
                    animate={true}
                    animationDuration={2000}
                    valueTextFontSize={windowDimensions.width <= 320 ? "16px" : windowDimensions.width <= 375 ? "18px" : windowDimensions.width <= 425 ? "20px" : windowDimensions.width <= 768 ? "22px" : "24px"}
                    valueTextFontWeight="bold"
                    valueTextYOffset={windowDimensions.width <= 425 ? -10 : windowDimensions.width <= 768 ? -15 : -20}
                  />
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={`Tasks for ${selectedStudent ? selectedStudent.name : ''}`}
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        centered
      >
        {loadingStudentTasks ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spin tip="Loading tasks..." />
          </div>
        ) : (
          <>
            <h3>Completed Tasks</h3>
            <List
              dataSource={studentTasks.completed}
              renderItem={task => (
                <List.Item>
                  <div className="task-item completed">
                    <span className="task-status-icon">✓</span>
                    <span className="task-title">{task.title}</span>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: "No completed tasks" }}
            />
            <h3>Not Completed Tasks</h3>
            <List
              dataSource={studentTasks.notCompleted}
              renderItem={task => (
                <List.Item>
                  <div className="task-item not-completed">
                    <span className="task-status-icon">○</span>
                    <span className="task-title">{task.title}</span>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: "All tasks completed!" }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default MentorDashboard;