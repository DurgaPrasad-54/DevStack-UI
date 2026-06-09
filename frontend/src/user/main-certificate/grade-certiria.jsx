import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { message, Table, Button, Form, Input, Modal, InputNumber, Card, Divider } from 'antd';
import config from '../../config';

const GradeCriteriaComponent = () => {
  const [form] = Form.useForm();
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [gradeRows, setGradeRows] = useState([{ grade: '', minMarks: 0, maxMarks: 0 }]);

  const fetchGradeCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.backendUrl}/api/certificates/grade-criteria`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setCriteriaList(response.data.data);
      }
    } catch (error) {
      message.error('Failed to fetch grade criteria');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradeCriteria();
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setGradeRows([{ grade: '', minMarks: 0, maxMarks: 0 }]);
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
      // Validate grade ranges
      let isValid = true;
      for (let i = 0; i < gradeRows.length; i++) {
        if (gradeRows[i].minMarks > gradeRows[i].maxMarks) {
          message.error(`Grade ${i + 1}: Min marks cannot be greater than max marks`);
          isValid = false;
          break;
        }
      }

      if (!isValid) return;

      const payload = {
        ...values,
        grades: gradeRows
      };

      const response = await axios.post(`${config.backendUrl}/api/certificates/grade-criteria`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        message.success('Grade criteria saved successfully');
        setIsModalVisible(false);
        form.resetFields();
        setGradeRows([{ grade: '', minMarks: 0, maxMarks: 0 }]);
        fetchGradeCriteria();
      }
    } catch (error) {
      message.error('Failed to save grade criteria');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Program Name',
      dataIndex: 'programName',
      key: 'programName',
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
      render: (_, record) => (
        <Button 
          type="primary"
          onClick={() => generateCertificates(record.programName)}
        >
          Generate Certificates
        </Button>
      ),
    },
  ];

  const generateCertificates = async (programName) => {
    try {
      const response = await axios.post(
        `${config.backendUrl}/api/certificates/generate-certificates`,
        { programName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        message.success(`Generated ${response.data.data.totalGenerated} certificates successfully`);
      }
    } catch (error) {
      message.error('Failed to generate certificates');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Grade Criteria Management">
        <Button type="primary" onClick={showModal} style={{ marginBottom: '20px' }}>
          Add New Grade Criteria
        </Button>

        <Table
          columns={columns}
          dataSource={criteriaList}
          rowKey="_id"
          loading={loading}
        />
      </Card>

      <Modal
        title="Grade Criteria"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="programName"
            label="Program Name"
            rules={[{ required: true, message: 'Please enter program name' }]}
          >
            <Input placeholder="e.g., Web Development Bootcamp" />
          </Form.Item>

          <Form.Item
            name="passingMarks"
            label="Passing Marks (percentage)"
            rules={[{ required: true, message: 'Please enter passing marks' }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="totalMarks"
            label="Total Marks"
            rules={[{ required: true, message: 'Please enter total marks' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Divider orientation="left">Grade Criteria</Divider>

          {gradeRows.map((row, index) => (
            <div key={index} style={{ display: 'flex', marginBottom: '10px', gap: '10px' }}>
              <Input
                placeholder="Grade (e.g., A)"
                value={row.grade}
                onChange={(e) => updateGradeRow(index, 'grade', e.target.value)}
                style={{ width: '100px' }}
              />
              <InputNumber
                placeholder="Min Marks"
                value={row.minMarks}
                onChange={(value) => updateGradeRow(index, 'minMarks', value)}
                min={0}
                max={100}
              />
              <InputNumber
                placeholder="Max Marks"
                value={row.maxMarks}
                onChange={(value) => updateGradeRow(index, 'maxMarks', value)}
                min={0}
                max={100}
              />
              {gradeRows.length > 1 && (
                <Button danger onClick={() => removeGradeRow(index)}>
                  Remove
                </Button>
              )}
            </div>
          ))}

          <Button type="dashed" onClick={addGradeRow} style={{ marginBottom: '20px' }}>
            Add Grade
          </Button>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GradeCriteriaComponent;