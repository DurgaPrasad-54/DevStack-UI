import React, { useEffect, useState } from "react";
import PageTitle from "../../../components/PageTitle";
import { message, Table, Form, Input, Select, Button } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import moment from "moment";
import axios from "axios";
import config from '../../../../config';

const { Option } = Select;

// Axios Instance with Token
const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// AdminAddExam Component
function AdminAddExam() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);

  // Current year options
  const currentYearOptions = [
    { value: 'first year', label: 'First Year' },
    { value: 'second year', label: 'Second Year' },
    { value: 'third year', label: 'Third Year' },
    { value: 'fourth year', label: 'Fourth Year' },
    { value: 'alumni', label: 'Alumni' }
  ];

  // Fetch all exams
  const getAllExams = async () => {
    try {
      dispatch(ShowLoading());
      const response = await axiosInstance.post(`${config.backendUrl}/api/exams/get-all-exams`);
      dispatch(HideLoading());
      if (response.data.success) {
        setExamData(response.data.data);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  // Submit form to add exam
  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      // Prepare payload
      const payload = {
        ...values,
        questions: [], // Initialize with empty array, questions will be added separately
      };
      
      // Call API to add exam
      const response = await axiosInstance.post(`${config.backendUrl}/api/exams/add`, payload);
      
      setLoading(false);
      if (response.data.success) {
        message.success("Exam added successfully");
        form.resetFields();
        getAllExams(); // Refresh exam list
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      message.error(error.message);
    }
  };

  // Add question to exam
  const addQuestionToExam = async (examId, question) => {
    try {
      const response = await axiosInstance.post(
        `${config.backendUrl}/api/exams/add-question-to-exam`,
        { exam: examId, ...question }
      );
      if (response.data.success) {
        message.success("Question added successfully");
        // Optionally, refresh exam data or update state
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  // Edit exam by id
  const editExamById = async (examId, updatedData) => {
    try {
      const response = await axiosInstance.post(
        `${config.backendUrl}/api/exams/edit-exam-by-id`,
        { examId, ...updatedData }
      );
      if (response.data.success) {
        message.success("Exam edited successfully");
        getAllExams(); // Refresh exam list
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  // Delete exam by id
  const deleteExamById = async (examId) => {
    try {
      const response = await axiosInstance.post(
        `${config.backendUrl}/api/exams/delete-exam-by-id`,
        { examId }
      );
      if (response.data.success) {
        message.success("Exam deleted successfully");
        getAllExams(); // Refresh exam list
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    getAllExams();
    setYearOptions(currentYearOptions); // Set year options on component mount
  }, []);

  return (
    <div className="admin-add-exam-container">
      <PageTitle title="Admin - Add Exam" />
      
      <div className="divider"></div>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="add-exam-form"
      >
        <Form.Item
          label="Exam Name"
          name="name"
          rules={[{ required: true, message: 'Please enter exam name' }]}
        >
          <Input placeholder="Enter exam name" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Please enter exam description' }]}
        >
          <Input.TextArea placeholder="Enter exam description" rows={4} />
        </Form.Item>

        <Form.Item
          label="Duration (minutes)"
          name="duration"
          rules={[{ required: true, message: 'Please enter exam duration' }]}
        >
          <Input type="number" placeholder="Enter duration in minutes" />
        </Form.Item>

        <Form.Item
          label="Total Marks"
          name="totalMarks"
          rules={[{ required: true, message: 'Please enter total marks' }]}
        >
          <Input type="number" placeholder="Enter total marks" />
        </Form.Item>

        <Form.Item
          label="Passing Marks"
          name="passingMarks"
          rules={[{ required: true, message: 'Please enter passing marks' }]}
        >
          <Input type="number" placeholder="Enter passing marks" />
        </Form.Item>

        <Form.Item
          label="Current Year"
          name="currentYear"
          rules={[{ required: true, message: 'Please select the current year' }]}
        >
          <Select placeholder="Select year">
            {currentYearOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Add Exam
          </Button>
        </Form.Item>
      </Form>

      <div className="divider"></div>

      <h2>Existing Exams</h2>
      <Table
        columns={[
          {
            title: "Exam Name",
            dataIndex: "name",
            key: "name",
          },
          {
            title: "Description",
            dataIndex: "description",
            key: "description",
          },
          {
            title: "Duration",
            dataIndex: "duration",
            key: "duration",
            render: (text) => `${text} minutes`,
          },
          {
            title: "Total Marks",
            dataIndex: "totalMarks",
            key: "totalMarks",
          },
          {
            title: "Passing Marks",
            dataIndex: "passingMarks",
            key: "passingMarks",
          },
          {
            title: "Current Year",
            dataIndex: "currentYear",
            key: "currentYear",
            render: (year) => {
              const found = currentYearOptions.find(opt => opt.value === year);
              return found ? found.label : year;
            }
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <div>
                <Button
                  type="link"
                  onClick={() => {
                    form.setFieldsValue(record);
                    window.scrollTo(0, 0);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="link"
                  danger
                  onClick={() => deleteExamById(record._id)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        dataSource={examData}
        rowKey="_id"
        pagination={false}
      />
    </div>
  );
}

export default AdminAddExam;