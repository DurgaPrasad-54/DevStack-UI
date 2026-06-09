import React, { useEffect, useState } from "react";
import PageTitle from "../../../components/PageTitle";
import { message, Table, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
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

// Fetch all user reports
export const getAllReportsByUser = async () => {
  try {
    const response = await axiosInstance.post(`${config.backendUrl}/api/reports/get-all-reports-by-student`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// User Reports Component
function UserReports() {
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const { loading: globalLoading } = useSelector(state => state.loader);

  const columns = [
    {
      title: "Exam Name",
      dataIndex: "examName",
      render: (text, record) => <>{record.exam?.name || "N/A"}</>,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (text, record) => (
        <>{moment(record.createdAt).format("DD-MM-YYYY hh:mm:ss")}</>
      ),
    },
    {
      title: "Total Marks",
      dataIndex: "totalQuestions",
      render: (text, record) => <>{record.exam?.totalMarks || "N/A"}</>,
    },
    {
      title: "Passing Marks",
      dataIndex: "correctAnswers",
      render: (text, record) => <>{record.exam?.passingMarks || "N/A"}</>,
    },
    {
      title: "Obtained Marks",
      dataIndex: "correctAnswers",
      render: (text, record) => <>{record.result?.correctAnswers.length || 0}</>,
    },
    {
      title: "Verdict",
      dataIndex: "verdict",
      render: (text, record) => <>{record.result?.verdict || "N/A"}</>,
    },
  ];

  const getData = async () => {
    try {
      setLoading(true);
      dispatch(ShowLoading());
      const response = await getAllReportsByUser();
      if (response.success) {
        setReportsData(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
      setLoading(false);
    } catch (error) {
      dispatch(HideLoading());
      setLoading(false);
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div style={{ marginLeft: '22px', marginRight: '22px', rowGap: '16px', paddingTop: '80px' }}>
      <style>
        {`
          .divider {
            border-bottom: 1px solid rgb(182, 182, 182);
            margin: 10px 0;
          }
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 300px;
          }
          .ant-spin-text {
            margin-top: 8px;
            color: #1890ff;
          }
        `}
      </style>
      <PageTitle title="Reports" />
      <div className="divider"></div>

      {/* Loading Animation */}
      {loading ? (
        <div className="loading-container">
          <Spin 
            size="large" 
            tip="Loading reports..." 
          />
        </div>
      ) : (
        /* Responsive Table Wrapper */
        <div style={{ overflowX: "auto" }}>
          <Table 
            columns={columns} 
            dataSource={reportsData} 
            rowKey="_id" 
            scroll={{ x: "max-content" }}
            loading={globalLoading}
          />
        </div>
      )}
    </div>
  );
}

export default UserReports;