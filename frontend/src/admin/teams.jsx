import React, { useState, useEffect } from 'react';
import { Input, Button, Select, Form, message, List, Card, Modal } from 'antd';
import config from '../config';

const TeamFormation = () => {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingTeam, setEditingTeam] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [allMentors, setAllMentors] = useState([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Function to filter teams based on search query
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  const searchStudents = async (query) => {
    if (query.length === 0) {
      setStudents([]);
      return;
    }
    try {
      const response = await fetch(`${config.backendUrl}/teams/students/search?query=${query}`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      showError('Failed to fetch students');
    }
  };

  const searchMentors = async (query) => {
    if (query.length === 0) {
      setMentors([]);
      return;
    }
    try {
      const response = await fetch(`${config.backendUrl}/teams/mentors/search?query=${query}`);
      const data = await response.json();
      setMentors(data);
    } catch (error) {
      showError('Failed to fetch mentors');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/teams`);
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      showError('Failed to fetch teams');
    }
  };

  const createOrUpdateTeam = async () => {
    try {
      const url = editingTeam
        ? `${config.backendUrl}/teams/${editingTeam._id}`
        : `${config.backendUrl}/teams`;
      const method = editingTeam ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          studentIds: selectedStudents.map(s => s._id),
          mentorId: selectedMentor ? selectedMentor._id : null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create/update team');
      }
      
      const updatedTeam = await response.json();
      if (editingTeam) {
        setTeams(teams.map(t => t._id === updatedTeam._id ? updatedTeam : t));
        message.success('Team updated successfully');
      } else {
        setTeams([...teams, updatedTeam]);
        message.success('Team created successfully');
      }
      resetForm();
    } catch (error) {
      showError(error.message);
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      const response = await fetch(`${config.backendUrl}/teams/${teamId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete team');
      }
      
      setTeams(teams.filter(t => t._id !== teamId));
      message.success('Team deleted successfully');
    } catch (error) {
      showError(error.message);
    }
  };

  const editTeam = async (team) => {
    try {
      const response = await fetch(`${config.backendUrl}/teams/${team._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team details');
      }
      const fullTeamData = await response.json();
      setEditingTeam(fullTeamData);
      setTeamName(fullTeamData.name);
      setSelectedStudents(fullTeamData.students);
      setSelectedMentor(fullTeamData.mentor);
      
      setAllStudents(prevStudents => {
        const newStudents = [...prevStudents];
        fullTeamData.students.forEach(student => {
          if (!newStudents.find(s => s._id === student._id)) {
            newStudents.push(student);
          }
        });
        return newStudents;
      });
      
      setAllMentors(prevMentors => {
        const newMentors = [...prevMentors];
        if (fullTeamData.mentor && !newMentors.find(m => m._id === fullTeamData.mentor._id)) {
          newMentors.push(fullTeamData.mentor);
        }
        return newMentors;
      });
    } catch (error) {
      showError(error.message);
    }
  };

  const resetForm = () => {
    setEditingTeam(null);
    setSelectedStudents([]);
    setSelectedMentor(null);
    setTeamName('');
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setErrorModalVisible(true);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const studentsResponse = await fetch(`${config.backendUrl}/teams/students/search?query=`);
        const mentorsResponse = await fetch(`${config.backendUrl}/teams/mentors/search?query=`);
        
        const studentsData = await studentsResponse.json();
        const mentorsData = await mentorsResponse.json();

        setAllStudents(studentsData);
        setAllMentors(mentorsData);
      } catch (error) {
        showError('Failed to fetch all students and mentors');
      }
    };

    fetchAllData();
    fetchTeams();
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1>{editingTeam ? 'Edit Team' : 'Create Team'}</h1>
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
                 student.rollNo.toLowerCase().includes(input.toLowerCase()));
            }}
            notFoundContent={null}
          >
            {allStudents.map(student => (
              <Select.Option 
                key={student._id} 
                value={student._id}
                disabled={student.inTeam && !selectedStudents.find(s => s._id === student._id)}
              >
                {student.name} ({student.email}) - Roll No: {student.rollNo}
                {student.inTeam && !selectedStudents.find(s => s._id === student._id) && ' (Already in a team)'}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Search and Select Mentor">
          <Select
            style={{ width: '100%' }}
            placeholder="Type to search mentors"
            value={selectedMentor ? selectedMentor._id : undefined}
            onChange={(value) => {
              setSelectedMentor(allMentors.find(m => m._id === value) || null);
            }}
            onSearch={searchMentors}
            filterOption={(input, option) => {
              const mentor = allMentors.find(m => m._id === option.value);
              return mentor && 
                (mentor.name.toLowerCase().includes(input.toLowerCase()) ||
                 mentor.email.toLowerCase().includes(input.toLowerCase()));
            }}
            notFoundContent={null}
            showSearch
          >
            {allMentors.map(mentor => (
              <Select.Option key={mentor._id} value={mentor._id}>
                {mentor.name} ({mentor.email})
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
            onClick={createOrUpdateTeam}
            disabled={selectedStudents.length === 0 || !teamName || !selectedMentor}
          >
            {editingTeam ? 'Update Team' : 'Create Team'}
          </Button>
          {editingTeam && (
            <Button onClick={resetForm} style={{ marginLeft: 8 }}>
              Cancel Edit
            </Button>
          )}
        </Form.Item>
      </Form>

      <h2>Formed Teams</h2>
      <Input
      placeholder="Search teams by name..."
      value={teamSearchQuery}
      onChange={(e) => setTeamSearchQuery(e.target.value)}
      style={{ 
        width: "50%", 
        marginBottom: 16, 
        marginLeft: "auto", 
        display: "flex", 
      }}
      allowClear
      />

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={filteredTeams}
        renderItem={team => (
          <List.Item>
            <Card 
              title={team.name}
              extra={
                <div>
                  <Button onClick={() => editTeam(team)} style={{ marginRight: 8 }}>Edit</Button>
                  <Button danger onClick={() => deleteTeam(team._id)}>Delete</Button>
                </div>
              }
            >
              <p><strong>Mentor:</strong> {team.mentor ? `${team.mentor.name} (${team.mentor.email})` : 'Not assigned'}</p>
              <List
                dataSource={team.students}
                renderItem={student => (
                  <List.Item>
                    {student.name} (Roll No: {student.rollNo}) - {student.email}
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