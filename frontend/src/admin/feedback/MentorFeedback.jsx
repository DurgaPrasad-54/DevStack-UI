import React, { useState, useEffect } from 'react';
import { Card, Rate, Modal, List, Avatar } from 'antd';
import config from '../../config';

const MentorFeedbacks = () => {
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const response = await fetch(
        `${config.backendUrl}/mentor-approval/mentors`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      setMentors(data.mentors.filter((mentor) => mentor.status === 'approved'));
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  };

  const fetchMentorFeedbacks = async (mentorId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${config.backendUrl}/feedback/mentor/${mentorId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMentorClick = async (mentor) => {
    setSelectedMentor(mentor);
    setModalVisible(true);
    await fetchMentorFeedbacks(mentor._id);
  };

  return (
    <div className="mentor-feedbacks-container">
      <h2>Mentor Feedbacks</h2>
      <div className="mentor-cards">
        {mentors.map((mentor) => (
          <Card
            key={mentor._id}
            className="mentor-card"
            onClick={() => handleMentorClick(mentor)}
          >
            <h3>{mentor.name}</h3>
            <p>{mentor.email}</p>
          </Card>
        ))}
      </div>

      <Modal
        title={`Feedbacks for ${selectedMentor?.name}`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          loading={loading}
          dataSource={feedbacks}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{item.studentId.name[0]}</Avatar>}
                title={item.studentId.name}
                description={
                  <>
                    <Rate disabled defaultValue={item.rating} />
                    <p>{item.feedback}</p>
                    <small>
                      Last updated: {new Date(item.updatedAt).toLocaleString()}
                    </small>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default MentorFeedbacks;
