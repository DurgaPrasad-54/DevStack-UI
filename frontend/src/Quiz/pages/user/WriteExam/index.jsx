import { message } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { jwtDecode } from 'jwt-decode';
import axios from "axios";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import Instructions from "./Instructions";
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import MonitoringSystem from "./MonitoringSystem"; // Import MonitoringSystem
import config from '../../../../config';
import './index.css'
// Axios Instance with Token
const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Helper to Decode Token
const decodeToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token found in localStorage");
    return null;
  }
  try {
    const decoded = jwtDecode(token);
    console.log("Decoded token:", decoded);
    localStorage.setItem("userId", decoded._id || decoded.userId || decoded.id); // Store userId in localStorage
    return decoded;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};

// API Functions
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

export const addReport = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/reports/add-report`,
      payload
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const attemptExam = async (payload) => {
  const userId = localStorage.getItem("student"); // Get userId from localStorage
  payload.userId = userId; // Add userId to payload
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/attempt-exam`,
      payload
    );
    console.log("Attempt exam response:", response.data);
    return response.data;
  } catch (error) {
    return error.response.data;
  }

};

export const getUserInfo = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/get-user-info`,
      payload
    );
    return response.data;
    console.log("User info response:", response.data);
  } catch (error) {
    return error.response.data;
  }
};

// Add this function to fetch exams for the current user and year
export const getUserExamsByYear = async () => {
  const userId = localStorage.getItem("userId");
  const currentYear = localStorage.getItem("studentYear");
  try {
    const response = await axiosInstance.post(
      `${config.backendUrl}/api/exams/get-user-exams`,
      { userId, currentYear }
    );
    console.log(response)
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

// Modal Components
const DeviceModal = () => (
  <div className="modal device-modal">
    <div className="modal-content">
      <h2>Desktop Only</h2>
      <p>This test platform is designed exclusively for desktop computers.</p>
      <p>Please access this test using a desktop or laptop computer with a minimum screen width of 1024px.</p>
      <p style={{ color: '#ff4444', marginTop: '15px' }}>⚠️ Mobile and tablet devices are not supported.</p>
    </div>
  </div>
);

const TabSwitchWarningModal = ({ onClose }) => (
  <div className="modal warning-modal">
    <div className="modal-content">
      <h2>Warning</h2>
      <p>Tab switching is not allowed during the test.</p>
      <p>Further violations will result in automatic submission.</p>
      <button onClick={onClose}>Understood</button>
    </div>
  </div>
);

// Fullscreen management with safety checks
const enterFullscreen = () => {
  const element = document.documentElement;
  if (document.fullscreenElement) return;
  
  if (element.requestFullscreen) {
    element.requestFullscreen().catch(err => console.log(err));
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen().catch(err => console.log(err));
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen().catch(err => console.log(err));
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen().catch(err => console.log(err));
  }
};

const exitFullscreen = () => {
  if (!document.fullscreenElement) return;
  
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } catch (error) {
    console.log('Error exiting fullscreen:', error);
  }
};

function WriteExam() {
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [result, setResult] = useState({});
  const [view, setView] = useState("instructions");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [attemptedExams, setAttemptedExams] = useState(() => {
    const userId = localStorage.getItem("userId");
    return JSON.parse(localStorage.getItem(`attemptedExams_${userId}`)) || [];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = decodeToken();
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    getExamById();
  }, []);

  // Security measures
  const preventCopyPaste = (e) => {
    e.preventDefault();
    message.warning("Copy-paste is not allowed during the exam");
  };

  const preventInspect = (e) => {
    if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && e.keyCode === 73)) {
      e.preventDefault();
      message.warning("Developer tools are not allowed during the exam");
    }
  };

  const preventContextMenu = (e) => {
    e.preventDefault();
    message.warning("Right-click is disabled during the exam");
  };

  const checkDeviceType = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /Tablet|iPad/i.test(navigator.userAgent);
    const screenWidth = window.innerWidth;
    
    if (isMobile || isTablet || screenWidth < 1024) {
      setIsMobileDevice(true);
    }
  };

  const handleFullscreenChange = () => {
    const isFullscreenNow = document.fullscreenElement !== null;
    setIsFullscreen(isFullscreenNow);
    
    if (view === "questions" && !isFullscreenNow) {
      message.warning("Please maintain fullscreen mode during the exam");
      enterFullscreen();
    }
  };

  const handleVisibilityChange = () => {
    if (view === "questions" && document.visibilityState === "hidden") {
      const newCount = tabSwitchCount + 1;
      setTabSwitchCount(newCount);

      if (newCount <= 2) {
        setShowWarningModal(true);
      }

      if (newCount >= 3) {
        calculateResult();
      }
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
        setQuestions(response.data.questions);
        setExamData(response.data);
        setSecondsLeft(response.data.duration);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const calculateResult = async () => {
    try {
      if (MonitoringSystem.isActive) {
        MonitoringSystem.stopMonitoring();
      }
      
      if (document.fullscreenElement) {
        await exitFullscreen();
      }

      let correctAnswers = [];
      let wrongAnswers = [];
  
      questions.forEach((question, index) => {
        if (question.correctOption === selectedOptions[index]) {
          correctAnswers.push(question);
        } else {
          wrongAnswers.push(question);
        }
      });
  
      let verdict = "Pass";
      if (correctAnswers.length < examData.passingMarks) {
        verdict = "Fail";
      }
  
      const tempResult = {
        correctAnswers,
        wrongAnswers,
        verdict,
      };
      setResult(tempResult);
  
      const currentUser = decodeToken();
      console.log("Current user from token:", currentUser);
  
      if (!currentUser) {
        message.error("User authentication error");
        return;
      }
  
      const reportPayload = {
        exam: params.id,
        result: tempResult,
        user: currentUser._id || currentUser.userId || currentUser.id
      };
      
      console.log("Report payload being sent:", reportPayload);
  
      dispatch(ShowLoading());
      const response = await addReport(reportPayload);
      dispatch(HideLoading());
      
      if (response.success) {
        navigate('/user/assignments', { state: { result: tempResult } }); // Navigate to /assignments with result data
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const startTimer = () => {
    let totalSeconds = examData.duration * 60; // Convert minutes to seconds
    const intervalId = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds -= 1;
        setSecondsLeft(totalSeconds);
      } else {
        setTimeUp(true);
      }
    }, 1000);
    setIntervalId(intervalId);
  };

  const handleStartExam = async (examId) => {
    const permissionsGranted = await MonitoringSystem.requestPermissions();
    if (!permissionsGranted) {
      message.error("Camera and microphone access is required to take the exam");
      return;
    }

    const currentDate = new Date();
    if (currentDate < new Date(examData.startDate) || currentDate > new Date(examData.endDate)) {
      message.error("The exam is not available at this time.");
      return;
    }

    enterFullscreen();
    const userId = localStorage.getItem("userId");
    const updatedAttemptedExams = [...attemptedExams, examId];
    setAttemptedExams(updatedAttemptedExams);
    localStorage.setItem(`attemptedExams_${userId}`, JSON.stringify(updatedAttemptedExams));
    
    // Call the attemptExam API with examId
    const response = await attemptExam({ examId });
    if (response.success) {
      setView("questions");
      startTimer();
    } else {
      message.error(response.message);
    }
  };

  useEffect(() => {
    checkDeviceType();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('keydown', preventInspect);
    document.addEventListener('contextmenu', preventContextMenu);
    window.addEventListener('resize', checkDeviceType);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('keydown', preventInspect);
      document.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('resize', checkDeviceType);
      
      if (MonitoringSystem.isActive) {
        MonitoringSystem.stopMonitoring();
      }
      if (document.fullscreenElement) {
        exitFullscreen();
      }
    };
  }, [view, tabSwitchCount]);

  useEffect(() => {
    if (timeUp && view === "questions") {
      clearInterval(intervalId);
      calculateResult();
    }
  }, [timeUp]);

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userId = localStorage.getItem("userId");
      const response = await getUserInfo({ userId });
      if (response.success) {
        console.log("User info:", response.data);
      } else {
        message.error(response.message);
      }
    };

    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token);
    
    const currentUser = decodeToken();
    console.log("Current user:", currentUser);
    
    if (!currentUser) {
      message.error("Authentication error");
      navigate('/login');
      return;
    }

    if (params.id) {
      getExamData();
    }

    fetchUserInfo();
  }, []);

  // Example usage: fetch exams for the current user and year
  // Call this function where you want to fetch the exams list for the student
  // For example, in a useEffect:
  useEffect(() => {
    const fetchUserExams = async () => {
      const data = await getUserExamsByYear();
      if (data.success) {
        // Do something with data.data.ongoingExams and data.data.completedExams
        console.log("Ongoing Exams:", data.data.ongoingExams);
        console.log("Completed Exams:", data.data.completedExams);
      } else {
        message.error(data.message);
      }
    };
    fetchUserExams();
  }, []);

  if (isMobileDevice) {
    return <DeviceModal />;
  }

  return (
    <div style={{ marginLeft: '22px', marginRight: '22px', rowGap: '16px', paddingTop: '80px' }}>
      <style>
        {`
         
          .sidebar {
            left: ${isSidebarOpen ? '0' : '-250px'};
          }
          .sidebar-toggle {
            left: ${isSidebarOpen ? '250px' : '0'};
          }
        `}
      </style>
      {showWarningModal && (
        <TabSwitchWarningModal onClose={() => setShowWarningModal(false)} />
      )}
      {examData && (
        <div className="mt-2">
          <div className="divider"></div>
          <h1 className="text-center">{examData.name}</h1>
          <div className="divider"></div>

          {view === "instructions" && (
            <Instructions
              examData={examData}
              setView={setView}
              startTimer={startTimer}
              handleStartExam={handleStartExam}
            />
          )}

          {view === "questions" && questions.length > 0 && (
            <div className="flex">
              <div className="sidebar">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className="question-number"
                    onClick={() => setSelectedQuestionIndex(index)}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
              <div className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              </div>
              <div className="question-container" style={{ marginLeft: isSidebarOpen ? '250px' : '0' }}>
                <div className="question-content">
                  <div className="flex justify-between">
                    <h1 className="text-2xl">
                      {selectedQuestionIndex + 1} : {questions[selectedQuestionIndex].name}
                    </h1>

                    <div className="timer">
                        <span className="text-2xl">{formatTime(secondsLeft)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 options-container">
                    {Object.keys(questions[selectedQuestionIndex].options).map(
                      (option, index) => {
                        return (
                          <div
                            className={`flex gap-2 flex-col ${
                              selectedOptions[selectedQuestionIndex] === option
                                ? "selected-option"
                                : "option"
                            }`}
                            key={index}
                            onClick={() => {
                              setSelectedOptions({
                                ...selectedOptions,
                                [selectedQuestionIndex]: option,
                              });
                            }}
                          >
                            <h1 className="text-xl">
                              {option} : {questions[selectedQuestionIndex].options[option]}
                            </h1>
                          </div>
                        );
                      }
                    )}
                  </div>

                  <div className="flex justify-between gap-2">
                    {selectedQuestionIndex > 0 && (
                      <button
                        className="primary-outlined-btn"
                        onClick={() => {
                          setSelectedQuestionIndex(selectedQuestionIndex - 1);
                        }}
                      >
                        Previous
                      </button>
                    )}

                    {selectedQuestionIndex < questions.length - 1 && (
                      <button
                        className="primary-contained-btn"
                        onClick={() => {
                          setSelectedQuestionIndex(selectedQuestionIndex + 1);
                        }}
                      >
                        Next
                      </button>
                    )}

                    {selectedQuestionIndex === questions.length - 1 && (
                      <button
                        className="primary-contained-btn"
                        onClick={() => {
                          clearInterval(intervalId);
                          setTimeUp(true);
                        }}
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "questions" && questions.length === 0 && (
            <div className="text-center">
              <h2>No questions available for this exam.</h2>
              <button
                className="primary-contained-btn"
                onClick={() => navigate('/user/assignments')}
              >
                Close
              </button>
            </div>
          )}

          {view === "result" && (
            <div className="flex items-center justify-center mt-2 result">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl">RESULT</h1>
                <div className="divider"></div>
                <div className="marks">
                    <h1 className="text-md">Verdict : {result.verdict}</h1>
                  </div>
                  <div className="divider"></div>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-md">Correct Answers : {result.correctAnswers.length}</h1>
                    <h1 className="text-md">Wrong Answers : {result.wrongAnswers.length}</h1>
                  </div>
                  </div>
                </div>
                )}
              </div>
              )}
            </div>
            );
          }

          export default WriteExam;