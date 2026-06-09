import React, { useEffect, useState } from "react";
import PageTitle from "../../../components/PageTitle";
import { message, Table } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import moment from "moment";
import axios from "axios";
import config from '../../../../config';

// Axios Instance with Token
const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Fetch all reports
export const getAllReports = async (filters) => {
  try {
    const response = await axiosInstance.post(`${config.backendUrl}/api/reports/get-all-reports`, filters);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Admin Reports Component
function AdminReports() {
  const [reportsData, setReportsData] = useState([]);
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    examName: "",
    studentName: "",
  });

  const columns = [
    {
      title: "Exam Name",
      dataIndex: "examName",
      render: (text, record) => <>{record.exam.name}</>,
      ellipsis: true,
      width: 150,
    },
    {
      title: "User Name",
      dataIndex: "userName",
      render: (text, record) => <>{record.user.name}</>,
      ellipsis: true,
      width: 150,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (text, record) => (
        <>{moment(record.createdAt).format("DD-MM-YYYY hh:mm:ss")}</>
      ),
      width: 180,
    },
    {
      title: "Total Marks",
      dataIndex: "totalQuestions",
      render: (text, record) => <>{record.exam.totalMarks}</>,
      width: 120,
    },
    {
      title: "Passing Marks",
      dataIndex: "correctAnswers",
      render: (text, record) => <>{record.exam.passingMarks}</>,
      width: 120,
    },
    {
      title: "Obtained Marks",
      dataIndex: "correctAnswers",
      render: (text, record) => <>{record.result.correctAnswers.length}</>,
      width: 120,
    },
    {
      title: "Verdict",
      dataIndex: "verdict",
      render: (text, record) => <>{record.result.verdict}</>,
      width: 100,
    },
  ];

  const getData = async (tempFilters) => {
    try {
      dispatch(ShowLoading());
      const response = await getAllReports({
        examName: tempFilters.examName || "",
        studentName: tempFilters.studentName || "",
      });
      if (response.success) {
        setReportsData(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData(filters);
  }, []);

  return (
    <div className="reports-container">
      <style>
        {`
        .reports-container {
          margin: 0 10px;
          overflow-x: hidden;
          width: 100%;
        }
        .divider {
          border-bottom: 1px solid rgb(182, 182, 182);
          margin: 10px 0;
        }
        .search-containerss {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right:20px;
        }
        .input-groupss {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 10px;
        }
        .button-groupss {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .search-inputss {
          flex: 1;
          min-width: 200px;
          padding: 10px;
          border: 2px solid #003049;
          border-radius: 4px;
          background-color: #ffffff;
        }
        .search-inputss:focus {
          border-color: #003049;
          outline: none;
        }
        .primary-contained-btn {
          background-color: #003049;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          min-width: 100px;
        }
        .primary-outlined-btn {
          background-color: white;
          color: #003049;
          border: 2px solid #003049;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          min-width: 100px;
        }
        .mt-2 {
          margin-top: 20px;
        }
        
        /* Table Specific Styles */
        .reports-table-container {
          width: 100%;
          overflow-x: auto;
        }
        
        /* Ensure the table takes full width of its container */
        .reports-table-container .ant-table-wrapper {
          width: 100%;
        }
        
        /* Make table cells more compact */
        .reports-table-container .ant-table-cell {
          padding: 8px;
          white-space: nowrap;
        }
        
        /* Add horizontal scrollbar if needed */
        .reports-table-container .ant-table-content {
          overflow-x: auto;
        }
        
        /* Media Queries for Responsive Design */
        @media (min-width: 700px) {
          .search-containerss {
            flex-direction: row;
            align-items: flex-end;
            gap: 20px;
          }
          .input-groupss {
            flex: 3;
            margin-bottom: 0;
          }
          .button-groupss {
            flex: 1;
          }
        }
        
        @media (max-width: 480px) {
          .primary-contained-btn, .primary-outlined-btn {
            width: 100%;
          }
        }
        `}
      </style>
      <PageTitle title="Reports" />
      <div className="divider"></div>
      
      <div className="search-containerss">
        <div className="input-groupss">
          <input
            className="search-inputss"
            type="text"
            placeholder="Exam"
            value={filters.examName}
            onChange={(e) => setFilters({ ...filters, examName: e.target.value })}
          />
          <input
            className="search-inputss"
            type="text"
            placeholder="Student"
            value={filters.studentName}
            onChange={(e) => setFilters({ ...filters, studentName: e.target.value })}
          />
        </div>
        <div className="button-groupss">
          <button
            className="primary-outlined-btn"
            onClick={() => {
              setFilters({
                examName: "",
                studentName: "",
              });
              getData({
                examName: "",
                studentName: "",
              });
            }}
          >
            Clear
          </button>
          <button 
            className="primary-contained-btn" 
            onClick={() => getData(filters)}
          >
            Search
          </button>
        </div>
      </div>
      
      <div className="reports-table-container">
        <Table 
          columns={columns} 
          dataSource={reportsData} 
          className="mt-2" 
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }} 
          size="middle"
        />
      </div>
    </div>
  );
}

export default AdminReports;