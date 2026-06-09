import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { message, Table, Button, Form, Input, Modal, InputNumber, Card, Divider, Spin, Tooltip, Space, Popconfirm, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SafetyCertificateOutlined, FileSearchOutlined } from '@ant-design/icons';
import config from '../../config';

const { Option } = Select;

const GradeCriteriaComponent = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [gradeRows, setGradeRows] = useState([{ grade: '', minMarks: 0, maxMarks: 0 }]);
  const [error, setError] = useState('');
  const [generatedPrograms, setGeneratedPrograms] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState(null);

  // Get API base URL from environment or use default
  const API_BASE_URL = import.meta.env.VITE_API_URL || `${config.backendUrl}/api`;

  // Current year options
  const currentYearOptions = [
    { value: 'first year', label: 'First Year' },
    { value: 'second year', label: 'Second Year' },
    { value: 'third year', label: 'Third Year' },
    { value: 'fourth year', label: 'Fourth Year' },
    { value: 'alumni', label: 'Alumni' }
  ];

  const fetchGradeCriteria = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/certificates/grade-criteria`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCriteriaList(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch grade criteria');
      }
    } catch (error) {
      console.error('Error fetching grade criteria:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch grade criteria';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneratedPrograms = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/certificates/grade-criteria`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setGeneratedPrograms(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching generated programs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradeCriteria();
    fetchGeneratedPrograms();
  }, []);

  const showCreateModal = () => {
    setIsModalVisible(true);
    setEditMode(false);
    setCurrentCriteria(null);
    form.resetFields();
    setGradeRows([{ grade: '', minMarks: 0, maxMarks: 0 }]);
    setError('');
  };
  
  const showEditModal = (record) => {
    setIsModalVisible(true);
    setEditMode(true);
    setCurrentCriteria(record);
    
    // Populate form with current values
    form.setFieldsValue({
      programName: record.programName,
      currentYear: record.currentYear,
      passingMarks: record.passingMarks,
      totalMarks: record.totalMarks,
    });
    
    // Populate grade rows
    setGradeRows(record.grades.map(grade => ({
      grade: grade.grade,
      minMarks: grade.minMarks,
      maxMarks: grade.maxMarks
    })));
    
    setError('');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setGradeRows([{ grade: '', minMarks: 0, maxMarks: 0 }]);
    setError('');
  };

  const addGradeRow = () => {
    setGradeRows([...gradeRows, { grade: '', minMarks: 0, maxMarks: 0 }]);
  };

  const removeGradeRow = (index) => {
    const newRows = [...gradeRows];
    newRows.splice(index, 1);
    setGradeRows(newRows);
  };

  const updateGradeRow = (index, field, value) => {
    const newRows = [...gradeRows];
    newRows[index][field] = value;
    setGradeRows(newRows);
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      setError('');
      
      // Validate grade ranges
      let isValid = true;
      for (let i = 0; i < gradeRows.length; i++) {
        if (gradeRows[i].minMarks > gradeRows[i].maxMarks) {
          message.error(`Grade ${i + 1}: Min marks cannot be greater than max marks`);
          isValid = false;
          break;
        }
        
        // Check for empty grade names
        if (!gradeRows[i].grade.trim()) {
          message.error(`Grade ${i + 1}: Grade name cannot be empty`);
          isValid = false;
          break;
        }
      }

      if (!isValid) {
        setSubmitting(false);
        return;
      }

      // Get admin userId from localStorage
      const adminId = localStorage.getItem("admin");

      const payload = {
        ...values,
        passingMarks: Number(values.passingMarks),
        totalMarks: Number(values.totalMarks),
        grades: gradeRows,
        userId: adminId // Add userId to the payload
      };
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setSubmitting(false);
        return;
      }
      
      let response;
      
      if (editMode && currentCriteria) {
        // Update existing criteria
        response = await axios.put(
          `${API_BASE_URL}/certificates/grade-criteria/${currentCriteria._id}`, 
          payload, 
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
          }
        );
        
        if (response.data.success) {
          message.success('Grade criteria updated successfully');
        }
      } else {
        // Create new criteria
        response = await axios.post(
          `${API_BASE_URL}/certificates/grade-criteria`, 
          payload, 
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
          }
        );
        
        if (response.data.success) {
          message.success('Grade criteria saved successfully');
        }
      }

      if (response && response.data.success) {
        setIsModalVisible(false);
        form.resetFields();
        setGradeRows([{ grade: '', minMarks: 0, maxMarks: 0 }]);
        fetchGradeCriteria();
      } else if (response) {
        setError(response.data.message || 'Failed to save grade criteria');
      }
    } catch (error) {
      console.error('Error saving grade criteria:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save grade criteria';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.delete(
        `${API_BASE_URL}/certificates/grade-criteria/${id}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );
      
      if (response.data.success) {
        message.success('Grade criteria deleted successfully');
        fetchGradeCriteria();
      } else {
        setError(response.data.message || 'Failed to delete grade criteria');
        message.error(response.data.message || 'Failed to delete grade criteria');
      }
    } catch (error) {
      console.error('Error deleting grade criteria:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete grade criteria';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const isGeneratedForProgram = (programName, currentYear) => {
    // Update this to check both program name and current year
    return generatedPrograms.some(program => 
      program.programName === programName && program.currentYear === currentYear
    );
  };

  // Simple function to navigate to viewcertificate page
  const goToViewCertificates = () => {
    navigate('/admin/viewcertificate');
  };

  // Function to navigate to verify-certificate page
  const goToVerifyCertificate = () => {
    navigate('/admin/verify-certificate');
  };

  const columns = [
    {
      title: 'Program Name',
      dataIndex: 'programName',
      key: 'programName',
    },
    {
      title: 'Current Year',
      dataIndex: 'currentYear',
      key: 'currentYear',
      render: (currentYear) => {
        const yearOption = currentYearOptions.find(option => option.value === currentYear);
        return yearOption ? yearOption.label : currentYear;
      },
    },
    {
      title: 'Passing Marks',
      dataIndex: 'passingMarks',
      key: 'passingMarks',
    },
    {
      title: 'Total Marks',
      dataIndex: 'totalMarks',
      key: 'totalMarks',
    },
    {
      title: 'Grades',
      key: 'grades',
      render: (_, record) => (
        <div>
          {record.grades.map((grade, index) => (
            <div key={index}>
              {grade.grade}: {grade.minMarks}-{grade.maxMarks}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Created By',
      key: 'createdBy',
      render: (_, record) => record.createdBy?.name || 'Unknown',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const generated = isGeneratedForProgram(record.programName, record.currentYear);
        return (
          <Space wrap size="small">
            {/* Hide Edit button if certificates are generated */}
            {!generated && (
              <Button 
                onClick={() => showEditModal(record)}
                type="primary"
                ghost
                size="small"
              >
                Edit
              </Button>
            )}
            
            {!generated && (
              <Popconfirm
                title="Are you sure you want to delete this criteria?"
                onConfirm={() => handleDelete(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button danger size="small">Delete</Button>
              </Popconfirm>
            )}
            
            <Tooltip title={generated ? "Certificates already generated for this program and year" : ""}>
              <Button 
                type="primary"
                onClick={() => generateCertificates(record.programName, record.currentYear)}
                disabled={generated}
                size="small"
              >
                {generated ? "Certificates Generated" : "Generate Certificates"}
              </Button>
            </Tooltip>
          </Space>
        );
      },
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ];

  const generateCertificates = async (programName, currentYear) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }
      
      // Get admin userId from localStorage
      const adminId = localStorage.getItem("admin");
      
      const response = await axios.post(
        `${API_BASE_URL}/certificates/generate-certificates`,
        { 
          programName,
          currentYear,
          userId: adminId // Add userId to the payload
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success(`Generated ${response.data.data.totalGenerated} certificates successfully`);
        // Update the generated programs list
        setGeneratedPrograms([...generatedPrograms, { programName, currentYear }]);
      } else {
        setError(response.data.message || 'Failed to generate certificates');
      }
    } catch (error) {
      console.error('Error generating certificates:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to generate certificates';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Check if certain fields should be disabled in edit mode
  const isFieldDisabled = (fieldName) => {
    if (!editMode) return false;
    
    // If certificates are generated, only allow editing grades
    if (currentCriteria && isGeneratedForProgram(currentCriteria.programName, currentCriteria.currentYear)) {
      if (fieldName === 'programName' || fieldName === 'currentYear' || fieldName === 'passingMarks' || fieldName === 'totalMarks') {
        return true;
      }
    }
    
    return false;
  };

  // New CSS styles for responsive button layout
  const buttonContainerStyle = {
    marginBottom: '20px'
  };

  // Add custom CSS for responsive layout
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.id = 'responsive-button-styles';
    
    // Define the CSS for the buttons
    styleElement.innerHTML = `
      @media (max-width: 426px) {
        .responsive-button-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 10px !important;
        }
        
        .responsive-button-container .ant-space {
          width: 100% !important;
          justify-content: center !important;
        }
        
        .responsive-button-container .ant-space-item {
          margin-right: 0 !important;
          width: 100% !important;
        }
        
        .responsive-button-container .ant-btn {
          width: 100% !important;
          max-width: 300px !important;
        }
      }
    `;
    
    // Append the style element to the head
    document.head.appendChild(styleElement);
    
    // Clean up on component unmount
    return () => {
      const existingStyle = document.getElementById('responsive-button-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div style={{ padding: '0px' }}>
      <Card title="Grade Criteria Management">
        {error && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            Error: {error}
          </div>
        )}

        {/* Show all created grade criteria as a list */}
        <div style={{ marginBottom: 24 }}>
          <h3>All Created Grade Criteria:</h3>
          <ul>
            {criteriaList.map((criteria) => (
              <li key={criteria._id}>
                <strong>{criteria.programName}</strong> ({criteria.currentYear}) - Passing: {criteria.passingMarks}%, Total: {criteria.totalMarks}
                <ul>
                  {criteria.grades.map((g, idx) => (
                    <li key={idx}>
                      Grade {g.grade}: {g.minMarks} - {g.maxMarks}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        {/* Responsive button group with custom class for media query targeting */}
        <div className="button-containerss responsive-button-container" style={buttonContainerStyle}>
          <Space wrap size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space wrap className="left-buttons">
              <Button 
                type="primary" 
                onClick={showCreateModal}
              >
                Add New Grade Criteria
              </Button>
              
              <Button 
                type="primary" 
                icon={<SafetyCertificateOutlined />} 
                onClick={goToVerifyCertificate}
              >
                Verify Certificates
              </Button>
            </Space>
            
            <Button 
              type="primary" 
              icon={<FileSearchOutlined />}
              onClick={goToViewCertificates}
              className="right-button"
            >
              View Certificates
            </Button>
          </Space>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={criteriaList}
            rowKey="_id"
            loading={loading}
            pagination={{ 
              defaultPageSize: 10,
              responsive: true,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20']
            }}
            scroll={{ x: '100%' }}
            size="small"
            style={{ width: '100%' }}
          />
        </div>
      </Card>

      <Modal
        title={editMode ? "Edit Grade Criteria" : "Add New Grade Criteria"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
        destroyOnClose={true}
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {error && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            Error: {error}
          </div>
        )}
        
        {editMode && currentCriteria && isGeneratedForProgram(currentCriteria.programName, currentCriteria.currentYear) && (
          <div style={{ backgroundColor: "#fffbe6", border: "1px solid #ffe58f", padding: "10px", marginBottom: "16px", borderRadius: "4px" }}>
            <strong>Note:</strong> Certificates have already been generated for this program and year. 
            You can only edit the grade definitions, not the program name, current year, passing marks, or total marks.
          </div>
        )}
        
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="programName"
            label="Program Name"
            rules={[{ required: true, message: 'Please enter program name' }]}
          >
            <Input 
              placeholder="e.g., Web Development Bootcamp" 
              disabled={isFieldDisabled('programName')}
            />
          </Form.Item>

          <Form.Item
            name="currentYear"
            label="Current Year"
            rules={[{ required: true, message: 'Please select current year' }]}
          >
            <Select 
              placeholder="Select current year"
              disabled={isFieldDisabled('currentYear')}
            >
              {currentYearOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="passingMarks"
            label="Passing Marks (percentage)"
            rules={[{ required: true, message: 'Please enter passing marks' }]}
          >
            <InputNumber 
              min={0} 
              max={100} 
              style={{ width: '100%' }} 
              disabled={isFieldDisabled('passingMarks')}
            />
          </Form.Item>

          <Form.Item
            name="totalMarks"
            label="Total Marks"
            rules={[{ required: true, message: 'Please enter total marks' }]}
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }} 
              disabled={isFieldDisabled('totalMarks')}
            />
          </Form.Item>

          <Divider orientation="left">Grade Definitions</Divider>
          
          {gradeRows.map((row, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              marginBottom: '10px', 
              gap: '10px', 
              alignItems: 'flex-end', 
              flexWrap: 'wrap' 
            }}>
              <Form.Item
                label={index === 0 ? "Grade" : ""}
                style={{ flex: '1 1 100px', marginBottom: 0 }}
              >
                <Input
                  placeholder="e.g., A, B+, C"
                  value={row.grade}
                  onChange={(e) => updateGradeRow(index, 'grade', e.target.value)}
                />
              </Form.Item>
              
              <Form.Item
                label={index === 0 ? "Min Marks (%)" : ""}
                style={{ flex: '1 1 100px', marginBottom: 0 }}
              >
                <InputNumber
                  min={0}
                  max={100}
                  value={row.minMarks}
                  style={{ width: '100%' }}
                  onChange={(value) => updateGradeRow(index, 'minMarks', value)}
                />
              </Form.Item>
              
              <Form.Item
                label={index === 0 ? "Max Marks (%)" : ""}
                style={{ flex: '1 1 100px', marginBottom: 0 }}
              >
                <InputNumber
                  min={0}
                  max={100}
                  value={row.maxMarks}
                  style={{ width: '100%' }}
                  onChange={(value) => updateGradeRow(index, 'maxMarks', value)}
                />
              </Form.Item>
              
              <Form.Item style={{ marginBottom: 0, minWidth: '80px' }}>
                {gradeRows.length > 1 && (
                  <Button
                    danger
                    onClick={() => removeGradeRow(index)}
                  >
                    Remove
                  </Button>
                )}
              </Form.Item>
            </div>
          ))}
          
          <Button
            type="dashed"
            onClick={addGradeRow}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            + Add Grade
          </Button>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editMode ? "Update" : "Save"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default GradeCriteriaComponent;