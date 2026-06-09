import React, { useState, useEffect } from 'react';
import { Rate, Input, Button, message, Card } from 'antd';
import config from '../../config';
import './StudentFeedback.css';

const { TextArea } = Input;

const StudentFeedback = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  useEffect(() => {
    fetchMentorDetails();
    fetchExistingFeedback();
  }, []);

  const fetchMentorDetails = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/teams/myteam`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      // Debug log
      console.log('Team data:', data);

      if (data && data.mentor) {
        setMentorId(data.mentor._id);
        setMentorName(data.mentor.name);
      } else {
        message.warning('No mentor assigned yet');
      }
    } catch (error) {
      console.error('Error fetching mentor details:', error);
      message.error('Failed to fetch mentor details');
    }
  };
useEffect(() => {
   fetchExistingFeedback();
}, []);
  const fetchExistingFeedback = async () => {
    try {
      const response = await fetch(
        `${config.backendUrl}/feedback/my-feedback`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      console.log('Existing feedback data:', data);
      if (data) {
        setExistingFeedback(data);
        setRating(data.rating || 0);
        setFeedback(data.feedback || '');
      }
    } catch (error) {
      console.error('Error fetching existing feedback:', error);
    }
  };

  const handleSubmit = async () => {
    if (!rating || !(feedback || '').trim()) {
      message.error('Please provide both rating and feedback');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.backendUrl}/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          mentorId,
          rating,
          feedback: (feedback || '').trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      const data = await response.json();
      setExistingFeedback(data.feedback);
      message.success('Feedback submitted successfully');
    } catch (error) {
      message.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!mentorId) {
    return (
      <div className="feedback-container">
        <Card>
          <h3>No Mentor Assigned</h3>
          <p>
            You need to be assigned to a mentor before you can provide feedback.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <Card
        title={`Feedback for Mentor: ${mentorName}`}
        className="feedback-card"
      >
        <div className="feedback-form">
          <div className="rating-section">
            <label>Rating:</label>
            <Rate
              value={rating}
              onChange={setRating}
              style={{ fontSize: '24px' }}
            />
          </div>
          <div className="feedback-section">
            <label>Feedback:</label>
            <TextArea
              rows={4}
              value={feedback || ''}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Please provide your feedback about your mentor..."
            />
          </div>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!rating || !(feedback || '').trim()}
            style={{ width: '200px', height: '40px' }}
          >
            {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default StudentFeedback;
