import React, { useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import config from '../config';
import './Admin.css'; // Import the CSS file

const Admin = () => {
  const [adminName, setAdminName] = useState('');
  const [questionTitle, setQuestionTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [programmingLanguage, setProgrammingLanguage] = useState(null);
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '', points: '' }]);

  const courses = [
    { value: 'Python', label: 'Python' },
    { value: 'C', label: 'C' },
    { value: 'C++', label: 'C++' },
    { value: 'Java', label: 'Java' },
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  const programmingLanguages = [
    { value: 'Python', label: 'Python' },
    { value: 'C', label: 'C' },
    { value: 'C++', label: 'C++' },
    { value: 'Java', label: 'Java' },
  ];

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      boxShadow: 'none',
    }),
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', points: '' }]);
  };

  const handleChangeTestCase = (index, event) => {
    const newTestCases = [...testCases];
    newTestCases[index][event.target.name] = event.target.value;
    setTestCases(newTestCases);
  };

  const clearForm = () => {
    setAdminName('');
    setQuestionTitle('');
    setDescription('');
    setCourse(null);
    setDifficulty(null);
    setProgrammingLanguage(null);
    setTestCases([{ input: '', expectedOutput: '', points: '' }]);
  };

  const handleSubmit = async () => {
    if (!questionTitle.trim()) {
      alert('Question title is required!');
      return;
    }

    const questionData = {
      adminName,
      questionTitle,
      description,
      course: course?.value,
      difficulty: difficulty?.value,
      programmingLanguage: programmingLanguage?.value,
      testCases: testCases.map(testCase => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        points: Number(testCase.points) || 0
      }))
    };

    try {
      const response = await axios.post(`${config.backendUrl}/api/questions`, questionData);
      console.log('Question Created:', response.data);
      clearForm();
      alert('Question Created Successfully!');
    } catch (error) {
      console.error('Error creating question:', error);
      alert(error.response?.data?.message || 'Error creating question!');
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be cleared.')) {
      clearForm();
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-title">Create New Question</h1>
      <div className="form-group">
        <label className="form-label">Admin Name</label>
        <input
          className="form-input"
          type="text"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          placeholder="Enter admin name"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Question Title <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          className="form-input"
          type="text"
          value={questionTitle}
          onChange={(e) => setQuestionTitle(e.target.value)}
          placeholder="Enter question title"
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter question description"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Course</label>
        <Select
          className="custom-select"
          styles={customSelectStyles}
          options={courses}
          value={course}
          onChange={setCourse}
          placeholder="Select Course"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Difficulty</label>
        <Select
          className="custom-select"
          styles={customSelectStyles}
          options={difficulties}
          value={difficulty}
          onChange={setDifficulty}
          placeholder="Select Difficulty"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Programming Language</label>
        <Select
          className="custom-select"
          styles={customSelectStyles}
          options={programmingLanguages}
          value={programmingLanguage}
          onChange={setProgrammingLanguage}
          placeholder="Select Programming Language"
        />
      </div>

      <div className="test-cases-section">
        <h3 className="test-case-title">Test Cases</h3>
        {testCases.map((testCase, index) => (
          <div key={index} className="test-case">
            <div className="form-group test-case-input">
              <label className="form-label">Input</label>
              <textarea
                className="form-textarea"
                name="input"
                rows="4"
                value={testCase.input}
                onChange={(e) => handleChangeTestCase(index, e)}
                placeholder="Enter test case input"
              />
            </div>
            <div className="form-group test-case-input">
              <label className="form-label">Expected Output</label>
              <textarea
                className="form-textarea"
                name="expectedOutput"
                rows="4"
                value={testCase.expectedOutput}
                onChange={(e) => handleChangeTestCase(index, e)}
                placeholder="Enter expected output"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Points</label>
              <input
                className="form-input points-input"
                type="number"
                name="points"
                value={testCase.points}
                onChange={(e) => handleChangeTestCase(index, e)}
                placeholder="Points"
              />
            </div>
          </div>
        ))}
        <button className="add-test-case-button" onClick={handleAddTestCase}>
          + Add Test Case
        </button>
      </div>

      <div className="button-container">
        <button className="primary-button" onClick={handleSubmit}>Create Question</button>
        <button className="secondary-button" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default Admin;