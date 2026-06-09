import { message, Table } from "antd";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PageTitle from "../../../components/PageTitle";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import axios from "axios";
import config from "../../../../config";

// Axios Instance with Token
const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// delete exam by id
export const deleteExamById = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/delete-exam-by-id`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// get all exams
export const getAllExams = async () => {
  try {
    const response = await axiosInstance.post(`${config.backendUrl}/api/exams/get-all-exams`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

function Exams() {
  const navigate = useNavigate();
  const [exams, setExams] = React.useState([]);
  const dispatch = useDispatch();

  const getExamsData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllExams();
      dispatch(HideLoading());
      if (response.success) {
        // Ensure the data is an array
        const examsData = response.data || [];
        setExams(examsData);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const deleteExam = async (examId) => {
    try {
      dispatch(ShowLoading());
      const response = await deleteExamById({
        examId,
      });
      dispatch(HideLoading());
      if (response.success) {
        message.success(response.message);
        getExamsData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: "Exam Name",
      dataIndex: "name",
      ellipsis: true,
      width: '20%',
    },
    {
      title: "Duration",
      dataIndex: "duration",
      width: '15%',
    },
    {
      title: "Category",
      dataIndex: "category",
      ellipsis: true,
      width: '15%',
    },
    {
      title: "Total Marks",
      dataIndex: "totalMarks",
      width: '15%',
    },
    {
      title: "Passing Marks",
      dataIndex: "passingMarks",
      width: '15%',
    },
    {
      title: "Action",
      dataIndex: "action",
      width: '15%',
      render: (text, record) => (
        <div className="flex gap-2">
          <span
            className="action-icon edit"
            onClick={() => navigate(`/admin/exams/edit/${record._id}`)}
          >
            <EditOutlined />
          </span>
          <span
            className="action-icon delete"
            onClick={() => deleteExam(record._id)}
          >
            <DeleteOutlined />
          </span>
        </div>
      ),
    },
  ];

  useEffect(() => {
    getExamsData();
  }, []);

  return (
    <div className="exams-container">
      <style>
        {`
        .exams-container {
          padding: 0 20px;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        
        .flex {
          display: flex;
        }
        
        .justify-between {
          justify-content: space-between;
        }
        
        .items-end {
          align-items: flex-end;
        }
        
        .mt-2 {
          margin-top: 20px;
        }
        
        .items-center {
          align-items: center;
        }
        
        .primary-outlined-btn {
          background-color: white;
          color: var(--primary);
          border: 2px solid #003049;
          padding: 8px 16px;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .divider {
          border-bottom: 1px solid rgb(182, 182, 182);
          margin: 10px 0;
        }
        
        .gap-2 {
          gap: 10px;
        }
        
        /* Table styles */
        .ant-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        
        .ant-table table {
          table-layout: fixed;
        }
        
        /* Action icons */
        .action-icon {
          cursor: pointer;
          padding: 4px;
        }
        
        .action-icon.edit {
          color: #1890ff;
        }
        
        .action-icon.delete {
          color: #ff4d4f;
        }
        
        /* Media queries for responsiveness */
        @media (max-width: 768px) {
          .exams-container {
            padding: 0 10px;
          }
          
          .ant-table-wrapper {
            overflow-x: scroll;
          }
        }
        `}
      </style>
      <div className="flex items-end justify-between mt-2">
        <PageTitle title="Exams" />
        <button
          className="flex items-center primary-outlined-btn"
          onClick={() => navigate("/admin/exams/add")}
        >
          <i className="ri-add-line"></i>
          Add Exam
        </button>
      </div>
      <div className="divider"></div>
      <Table 
        columns={columns} 
        dataSource={exams}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 10 }}
        bordered
        rowKey="_id"
      />
    </div>
  );
}

export default Exams;