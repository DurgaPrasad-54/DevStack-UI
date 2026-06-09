import { message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { SearchOutlined } from '@ant-design/icons';
import config from '../../../../config';
import moment from "moment";
import "./Home.css";

// Axios Instance with Token
const axiosInstance = axios.create({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Get user-specific exams
export const getUserExams = async (userId) => {
  try {
    const response = await axiosInstance.post(`${config.backendUrl}/api/exams/get-user-exams`, { userId });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Set zero marks for unattempted exams
export const setZeroMarksForUnattempted = async (payload) => {
  try {
    const response = await axiosInstance.post(`${config.backendUrl}/api/exams/set-zero-marks-for-unattempted`, payload);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

function Home() {
  const [exams, setExams] = useState([]);
  const [view, setView] = useState('ongoing');
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  // Get global loading state from Redux if needed
  // const globalLoading = useSelector(state => state.loader.loading);

  const getExams = async () => {
    try {
      setLoading(true); // Set local loading to true
      dispatch(ShowLoading()); // Global loading
      const userId = localStorage.getItem("student");
      console.log("User ID:", userId);
      const response = await getUserExams(userId);
      
      // Add a small delay to make the loading visible (optional, remove in production)
      setTimeout(() => {
        if (response.success) {
          setExams(response.data);
          // Automatically submit exams with zero marks if the end time has passed
          const currentTime = new Date();
          response.data.ongoingExams.forEach(async (exam) => {
            if (currentTime > new Date(exam.endDate)) {
              await setZeroMarksForUnattempted({ examId: exam._id, userId });
              // Call getUserExams after setting zero marks
              await getUserExams(userId);
            }
          });
        } else {
          message.error(response.message);
        }
        setLoading(false); // Hide local loading
        dispatch(HideLoading()); // Hide global loading
      }, 800); // Small delay for demonstration
    } catch (error) {
      setLoading(false); // Hide local loading on error
      dispatch(HideLoading()); // Hide global loading on error
      message.error(error.message);
    }
  };

  useEffect(() => {
    getExams();
  }, []);

  useEffect(() => {
    if (location.state && location.state.result && !localStorage.getItem("resultShown")) {
      setResult(location.state.result);
      setShowResultPopup(true);
      localStorage.setItem("resultShown", "true");
    }
  }, [location.state]);

  const handleStartExam = (examId) => {
    navigate(`/user/write-exam/${examId}`);
  };

  const handleDisabledButtonClick = (isBeforeStart) => {
    if (isBeforeStart) {
      message.info("The exam has not started yet. Please refresh the page at the starting time.");
    } else {
      message.info("The exam time is over. Please refresh the page.");
    }
  };

  const handleClosePopup = () => {
    setShowResultPopup(false);
    setResult(null);
    localStorage.removeItem("resultShown");
  };

  const handleRefresh = () => {
    setLoading(true);
    getExams();
  };

  const filteredOngoingExams = exams.ongoingExams 
    ? exams.ongoingExams.filter(exam => exam.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const filteredCompletedExams = exams.completedExams 
    ? exams.completedExams.filter(exam => exam.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className="quiz-home-container">
      <style>
        {`
        .quiz-search-bar{
          width: ${showSearch ? '200px' : '0'};
          opacity: ${showSearch ? '1' : '0'};
          visibility: ${showSearch ? 'visible' : 'hidden'};
        }
        `}
      </style>
      
      {/* Custom Loading Animation */}
      {loading && (
        <div className="quiz-loader-container">
          <div className="quiz-loader">
            <div className="quiz-loader-spinner"></div>
            <div className="quiz-loader-text">Loading quizzes...</div>
          </div>
        </div>
      )}
      
      <div className="quiz-header-container">
        <div className="quiz-header">
          <h1 className="quiz-title">Welcome to the quiz...😊</h1>
        </div>
        
        <div className="quiz-search-bar-container">
          <input
            type="text"
            className="quiz-search-bar"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchOutlined className="quiz-search-icon" onClick={() => setShowSearch(!showSearch)} />
        </div>
      </div>
      
      <hr className="quiz-divider" />
      
      <div className="quiz-view-selector">
        <button 
          className={`quiz-primary-outlined-btn ${view === 'ongoing' ? 'quiz-active-btn' : 'quiz-inactive-btn'}`}
          onClick={() => setView('ongoing')}
        >
          Ongoing Assessments
        </button>
        <button 
          className={`quiz-primary-outlined-btn ${view === 'completed' ? 'quiz-active-btn' : 'quiz-inactive-btn'}`}
          onClick={() => setView('completed')}
        >
          Completed Assignments
        </button>
        {/* Refresh button */}
        {/* <button 
          className="quiz-primary-outlined-btn" 
          onClick={handleRefresh}
          style={{marginLeft: 'auto'}}
        >
          Refresh
        </button> */}
      </div>
      
      {!loading && (
        <div className="quiz-exam-cards-container">
          {view === 'ongoing' && filteredOngoingExams.length === 0 && (
            <div className="quiz-no-exams">
              <p>No ongoing assessments found</p>
            </div>
          )}
          
          {view === 'ongoing' && filteredOngoingExams.map((exam) => {
            const currentTime = new Date();
            const isBeforeStart = currentTime < new Date(exam.startDate);
            const isAfterEnd = currentTime > new Date(exam.endDate);
            const isDisabled = isBeforeStart || isAfterEnd;
            
            return (
              <div className="quiz-exam-card" key={exam._id}>
                <div className="quiz-card">
                  <div className="quiz-card-header">
                    <h1 className="quiz-text-2xl">{exam.name}</h1>
                  </div>
                  <div className="quiz-card-body">
                    <h1 className="quiz-text-md">Category: {exam.category}</h1>
                    <h1 className="quiz-text-md">Total Marks: {exam.totalMarks}</h1>
                    <h1 className="quiz-text-md">Passing Marks: {exam.passingMarks}</h1>
                    <h1 className="quiz-text-md">Duration: {exam.duration}</h1>
                    <h1 className="quiz-text-md">Start Time: {moment(exam.startDate).format('DD-MM-YYYY hh:mm A')}</h1>
                    <h1 className="quiz-text-md">End Time: {moment(exam.endDate).format('DD-MM-YYYY hh:mm A')}</h1>
                  </div>
                  <div className="quiz-card-footer">
                    <button
                      className="quiz-primary-btn"
                      onClick={() => isDisabled ? handleDisabledButtonClick(isBeforeStart) : handleStartExam(exam._id)}
                      disabled={isDisabled}
                    >
                      Start Exam
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {view === 'completed' && filteredCompletedExams.length === 0 && (
            <div className="quiz-no-exams">
              <p>No completed assignments found</p>
            </div>
          )}
          
          {view === 'completed' && filteredCompletedExams.map((exam) => (
            <div className="quiz-exam-card" key={exam._id}>
              <div className="quiz-card">
                <div className="quiz-card-header">
                  <h1 className="quiz-text-2xl">{exam.name}</h1>
                </div>
                <div className="quiz-card-body">
                  <h1 className="quiz-text-md">Category: {exam.category}</h1>
                  <h1 className="quiz-text-md">Total Marks: {exam.totalMarks}</h1>
                  <h1 className="quiz-text-md">Passing Marks: {exam.passingMarks}</h1>
                  <h1 className="quiz-text-md">Duration: {exam.duration}</h1>
                  <h1 className="quiz-text-md">Start Time: {moment(exam.startDate).format('DD-MM-YYYY hh:mm A')}</h1>
                  <h1 className="quiz-text-md">End Time: {moment(exam.endDate).format('DD-MM-YYYY hh:mm A')}</h1>
                </div>
                <div className="quiz-card-footer">
                  <button
                    className="quiz-primary-btn"
                    onClick={() => navigate(`/user/reports/${exam._id}`)}
                  >
                    Result
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showResultPopup && result && (
        <div className="quiz-result-popup">
          <div className="quiz-result-popup-content">
            <button className="quiz-close-button" onClick={handleClosePopup}>X</button>
            <h2>RESULT</h2>
            <div className="quiz-result-details">
              <p><strong>Verdict:</strong> {result.verdict}</p>
              <p><strong>Correct Answers:</strong> {result.correctAnswers.length}</p>
              <p><strong>Wrong Answers:</strong> {result.wrongAnswers.length}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* No exams message styling */}
      <style>
        {`
        .quiz-no-exams {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 1.2rem;
        }
        `}
      </style>
    </div>
  );
}

export default Home;