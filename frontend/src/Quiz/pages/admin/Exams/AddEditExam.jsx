import { Col, Form, message, Row, Table } from "antd";
import React, { useEffect, useState } from "react";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PageTitle from "../../../components/PageTitle";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { Tabs } from "antd";
import AddEditQuestion from "./AddEditQuestion";
import axios from "axios";
import config from '../../../../config';

// Axios Instance with Token
const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
const { TabPane } = Tabs;

// API functions remain the same
export const addExam = async (payload) => {
  try {
    const response = await axiosInstance.post(`${config.backendUrl}/api/exams/add`, payload);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const deleteQuestionById = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/delete-question-in-exam`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const editExamById = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/edit-exam-by-id`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getExamById = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/get-exam-by-id`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

function AddEditExam() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [showAddEditQuestionModal, setShowAddEditQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const params = useParams();

  // Improved window resize handler with debounce
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Add debounce to prevent too many re-renders
    let timeoutId = null;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Better column span calculation based on screen size
  const getColSpan = () => {
    if (windowWidth < 576) {
      return 24; // Full width on mobile
    } else if (windowWidth < 992) {
      return 12; // Half width on tablets
    } else {
      return 8; // Three columns on desktop
    }
  };

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      let response;

      if (params.id) {
        response = await editExamById({
          ...values,
          examId: params.id,
        });
      } else {
        response = await addExam(values);
      }
      
      if (response.success) {
        message.success(response.message);
        navigate("/admin/exams");
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const getExamData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({
        examId: params.id,
      });
      dispatch(HideLoading());
      if (response.success) {
        setExamData(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
  }, [params.id]);

  const deleteQuestion = async (questionId) => {
    try {
      dispatch(ShowLoading());
      const response = await deleteQuestionById({
        questionId,
        examId: params.id
      });
      dispatch(HideLoading());
      if (response.success) {
        message.success(response.message);
        getExamData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  // Improved responsive table columns
  const getQuestionsColumns = () => {
    // Base columns for all screen sizes
    const baseColumns = [
      {
        title: "Question",
        dataIndex: "name",
        ellipsis: true,
        width: windowWidth < 576 ? 150 : "auto",
      },
      {
        title: "Correct",
        dataIndex: "correctOption",
        width: windowWidth < 576 ? 80 : "auto",
        render: (text, record) => {
          return `${record.correctOption}: ${
            record.options[record.correctOption]
          }`.substring(0, windowWidth < 576 ? 20 : 50) + 
          (windowWidth < 576 && record.options[record.correctOption].length > 20 ? "..." : "");
        },
      },
      {
        title: "Action",
        dataIndex: "action",
        width: 80,
        fixed: 'right',
        render: (text, record) => (
          <div className="add-exam-flex add-exam-gap-1">
            <EditOutlined 
              className="add-exam-cursor-pointer" 
              style={{ color: 'blue', fontSize: windowWidth < 576 ? '14px' : '16px' }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedQuestion(record);
                setShowAddEditQuestionModal(true);
              }}
            />
            <DeleteOutlined 
              className="add-exam-cursor-pointer"
              style={{ color: 'red', fontSize: windowWidth < 576 ? '14px' : '16px' }}
              onClick={(e) => {
                e.stopPropagation();
                deleteQuestion(record._id);
              }}
            />
          </div>
        ),
      }
    ];

    // Add options column only for larger screens
    if (windowWidth >= 768) {
      baseColumns.splice(1, 0, {
        title: "Options",
        dataIndex: "options",
        width: 200,
        render: (text, record) => {
          return Object.keys(record.options).map((key) => {
            return (
              <div key={key} className="add-exam-option-item">
                {key}: {record.options[key]}
              </div>
            );
          });
        },
      });
    }

    return baseColumns;
  };

  // Add current year options
  const currentYearOptions = [
    { value: 'first year', label: 'First Year' },
    { value: 'second year', label: 'Second Year' },
    { value: 'third year', label: 'Third Year' },
    { value: 'fourth year', label: 'Fourth Year' },
    { value: 'alumni', label: 'Alumni' }
  ];

  return (
    <div className="add-exam-container">
      <style>
        {`
        .add-exam-container {
          padding: 12px;
          max-width: 100%;
          overflow-x: hidden;
        }
        
        @media (min-width: 576px) {
          .add-exam-container {
            padding: 16px;
          }
        }
        
        @media (min-width: 768px) {
          .add-exam-container {
            padding: 20px 30px;
          }
        }
        
        @media (min-width: 992px) {
          .add-exam-container {
            padding: 20px 50px;
          }
        }
        
        .add-exam-divider {
          border-bottom: 1px solid #d9d9d9;
          margin: 10px 0 20px 0;
        }
        
        .add-exam-flex {
          display: flex;
        }
        
        .add-exam-flex-col {
          flex-direction: column;
        }
        
        .add-exam-flex-wrap {
          flex-wrap: wrap;
        }
        
        .add-exam-justify-end {
          justify-content: flex-end;
        }
        
        .add-exam-justify-center {
          justify-content: center;
        }
        
        .add-exam-items-center {
          align-items: center;
        }
        
        .add-exam-gap-1 {
          gap: 8px;
        }
        
        .add-exam-gap-2 {
          gap: 16px;
        }
        
        .add-exam-mt-3 {
          margin-top: 15px;
        }
        
        .add-exam-mb-3 {
          margin-bottom: 15px;
        }
        
        /* Button Styles */
        .add-exam-button-group {
          display: flex;
          gap: 16px;
        }
        
        @media (max-width: 576px) {
          .add-exam-button-group {
            flex-direction: column;
            width: 100%;
          }
        }
        
        .add-exam-primary-outlined-btn {
          background-color: white;
          color: #003049;
          border: 2px solid #003049;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
          text-align: center;
        }
        
        .add-exam-primary-outlined-btn:hover {
          background-color: #f0f8ff;
        }
        
        .add-exam-primary-contained-btn {
          background-color: #003049;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
          text-align: center;
        }
        
        .add-exam-primary-contained-btn:hover {
          background-color: #002039;
        }
        
        /* Form field styles */
        .add-exam-input-field, .add-exam-select-field {
          width: 100%;
          padding: 8px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          box-sizing: border-box;
          transition: all 0.3s;
        }
        
        .add-exam-input-field:focus, .add-exam-select-field:focus {
          border-color: #003049;
          box-shadow: 0 0 0 2px rgba(0, 48, 73, 0.2);
          outline: none;
        }
        
        /* Responsive table */
        .add-exam-table-responsive {
          overflow-x: auto;
          width: 100%;
        }
        
        .add-exam-ant-table-wrapper {
          margin-bottom: 20px;
        }
        
        /* Table cell content */
        .add-exam-option-item {
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        
        /* Tab adjustments */
        .add-exam-responsive-tabs .ant-tabs-tab {
          padding: 8px 16px;
        }
        
        @media (max-width: 576px) {
          .add-exam-responsive-tabs .ant-tabs-tab {
            padding: 8px 10px;
            margin: 0 2px !important;
          }
          
          .add-exam-responsive-tabs .ant-tabs-tab-btn {
            font-size: 14px;
          }
        }
        
        .add-exam-cursor-pointer {
          cursor: pointer;
        }
        
        /* Fix for Ant Design responsiveness */
        .add-exam-ant-form-item-label {
          white-space: normal !important;
        }
        
        .add-exam-ant-row {
          margin-right: -8px !important;
          margin-left: -8px !important;
        }
        
        .add-exam-ant-col {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
        `}
      </style>
      <PageTitle title={params.id ? "Edit Exam" : "Add Exam"} />
      <div className="add-exam-divider"></div>

      {(examData || !params.id) && (
        <Form 
          layout="vertical" 
          onFinish={onFinish} 
          initialValues={examData}
          className="add-exam-responsive-form"
        >
          <Tabs defaultActiveKey="1" className="add-exam-responsive-tabs">
            <TabPane tab="Exam Details" key="1">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item 
                    label="Exam Name" 
                    name="name" 
                    rules={[{ required: true, message: 'Please enter exam name' }]}
                  >
                    <input type="text" className="add-exam-input-field" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item 
                    label="Exam Duration (minutes)" 
                    name="duration" 
                    rules={[{ required: true, message: 'Please enter duration' }]}
                  >
                    <input type="number" className="add-exam-input-field" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item 
                    label="Category" 
                    name="category" 
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <select className="add-exam-select-field">
                      <option value="">Select Category</option>
                      <option value="Javascript">Javascript</option>
                      <option value="React">React</option>
                      <option value="Node">Node</option>
                      <option value="MongoDB">MongoDB</option>
                      <option value="GK">GK</option>
                      <option value="ML">Machine Learning</option>
                      <option value="ebusiness">E-business</option>
                    </select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item 
                    label="Total Marks" 
                    name="totalMarks" 
                    rules={[{ required: true, message: 'Please enter total marks' }]}
                  >
                    <input type="number" className="add-exam-input-field" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item 
                    label="Passing Marks" 
                    name="passingMarks" 
                    rules={[{ required: true, message: 'Please enter passing marks' }]}
                  >
                    <input type="number" className="add-exam-input-field" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item 
                    label="Start Date" 
                    name="startDate" 
                    rules={[{ required: true, message: 'Please select start date' }]}
                  >
                    <input type="datetime-local" className="add-exam-input-field" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item 
                    label="End Date" 
                    name="endDate" 
                    rules={[{ required: true, message: 'Please select end date' }]}
                  >
                    <input type="datetime-local" className="add-exam-input-field" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item 
                    label="Current Year" 
                    name="currentYear" 
                    rules={[{ required: true, message: 'Please select current year' }]}
                  >
                    <select className="add-exam-select-field">
                      <option value="">Select Year</option>
                      {currentYearOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Form.Item>
                </Col>
              </Row>
              <div className="add-exam-mt-3">
                <div className="add-exam-button-group add-exam-justify-end">
                  <button
                    className="add-exam-primary-outlined-btn"
                    type="button"
                    onClick={() => navigate("/admin/exams")}
                  >
                    Cancel
                  </button>
                  <button className="add-exam-primary-contained-btn" type="submit">
                    Save
                  </button>
                </div>
              </div>
            </TabPane>
            {params.id && (
              <TabPane tab="Questions" key="2">
                <div className="add-exam-mb-3">
                  <div className={windowWidth < 576 ? "add-exam-flex add-exam-justify-center" : "add-exam-flex add-exam-justify-end"}>
                    <button
                      className="add-exam-primary-outlined-btn"
                      type="button"
                      onClick={() => setShowAddEditQuestionModal(true)}
                    >
                      Add Question
                    </button>
                  </div>
                </div>
                <div className="add-exam-table-responsive">
                  <Table
                    columns={getQuestionsColumns()}
                    dataSource={examData?.questions || []}
                    rowKey="_id"
                    scroll={{ x: 'max-content' }}
                    pagination={{ 
                      pageSize: windowWidth < 768 ? 5 : 10,
                      size: windowWidth < 576 ? 'small' : 'default'
                    }}
                    size={windowWidth < 576 ? 'small' : 'default'}
                    className="add-exam-ant-table-wrapper"
                  />
                </div>
              </TabPane>
            )}
          </Tabs>
        </Form>
      )}

      {showAddEditQuestionModal && (
        <AddEditQuestion
          setShowAddEditQuestionModal={setShowAddEditQuestionModal}
          showAddEditQuestionModal={showAddEditQuestionModal}
          examId={params.id}
          refreshData={getExamData}
          selectedQuestion={selectedQuestion}
          setSelectedQuestion={setSelectedQuestion}
        />
      )}
    </div>
  );
}

export default AddEditExam;