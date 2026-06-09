import React, { useState, useEffect } from 'react';
import { Input, Button, Select, Form, message, List, Card, Modal } from 'antd';
import config from '../config';

const TeamFormation = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [loggedInMentor, setLoggedInMentor] = useState(null);

  useEffect(() => {
    const fetchMentorProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.backendUrl}/profile/mentor/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch mentor profile');
        const mentorData = await response.json();
        setLoggedInMentor(mentorData);
      } catch (error) {
        showError('Failed to fetch mentor profile');
      }
    };

    fetchMentorProfile();
  }, []);

  const searchStudents = async (query) => {
    if (query.length === 0) {
      setStudents([]);
      return;
    }
    try {
      const response = await fetch(`${config.backendUrl}/teams/students/search?query=${query}`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
      
      setAllStudents(prevStudents => {
        const newStudents = [...prevStudents];
        data.forEach(student => {
          if (!newStudents.find(s => s._id === student._id)) {
            newStudents.push(student);
          }
        });
        return newStudents;
      });
    } catch (error) {
      showError('Failed to fetch students');
    }
  };

  const createTeam = async () => {
    try {
      if (!loggedInMentor) {
        throw new Error('Mentor profile not loaded');
      }

      const response = await fetch(`${config.backendUrl}/teams/teams`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: teamName,
          studentIds: selectedStudents.map(s => s._id),
          mentorId: loggedInMentor._id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team');
      }
      
      const newTeam = await response.json();
      setTeams([...teams, newTeam]);
      message.success('Team created successfully');
      resetForm();
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/teams`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data.filter(team => team.mentor?._id === loggedInMentor?._id));
    } catch (error) {
      showError('Failed to fetch teams');
    }
  };

  const resetForm = () => {
    setSelectedStudents([]);
    setTeamName('');
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setErrorModalVisible(true);
  };

  useEffect(() => {
    if (loggedInMentor) {
      fetchTeams();
    }
  }, [loggedInMentor]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto',padding:'100px 20px' }}>
      <style>
        {`
        @media (max-width: 426px) {
          .team-mentor-name
            {
              font-size:20px;
            }
        }
        `}
      </style>
      <h1 className='team-mentor-name'>{loggedInMentor ? `Teams - ${loggedInMentor.name}` : 'Create Team'}</h1>
      
      <Form layout="vertical">
        <Form.Item label="Search and Select Students">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Type to search students"
            value={selectedStudents.map(s => s._id)}
            onChange={(values) => {
              const newSelectedStudents = allStudents.filter(s => values.includes(s._id));
              setSelectedStudents(newSelectedStudents);
            }}
            onSearch={searchStudents}
            filterOption={(input, option) => {
              const student = allStudents.find(s => s._id === option.value);
              return student && 
                (student.name.toLowerCase().includes(input.toLowerCase()) ||
                 student.email.toLowerCase().includes(input.toLowerCase()) ||
                 (student.rollNo && student.rollNo.toLowerCase().includes(input.toLowerCase())));
            }}
            notFoundContent={null}
          >
            {allStudents.map(student => (
              <Select.Option 
                key={student._id} 
                value={student._id}
                disabled={student.inTeam && !selectedStudents.find(s => s._id === student._id)}
              >
                {student.name} ({student.email}) 
                {student.rollNo && ` - Roll No: ${student.rollNo}`}
                {student.inTeam && !selectedStudents.find(s => s._id === student._id) && ' (Already in a team)'}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Team Name">
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            onClick={createTeam}
            disabled={selectedStudents.length === 0 || !teamName}
          >
            Create Team
          </Button>
          <Button onClick={resetForm} style={{ marginLeft: 8 }}>
            Reset
          </Button>
        </Form.Item>
      </Form>

      <h2>My Teams</h2>
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={teams}
        renderItem={team => (
          <List.Item>
            <Card 
              title={team.name}
              style={{ marginBottom: 16 }}
            >
              <p><strong>Team Members:</strong></p>
              <List
                dataSource={team.students}
                renderItem={student => (
                  <List.Item>
                    {student.name} 
                    {student.rollNo && ` (Roll No: ${student.rollNo})`} 
                    - {student.email}
                  </List.Item>
                )}
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Sorry For Inconvenience"
        visible={errorModalVisible}
        onOk={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default TeamFormation;