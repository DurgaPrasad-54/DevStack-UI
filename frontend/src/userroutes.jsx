import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './user/userheader/userheader';
import Calender from './user/usercalender/usercalendar';
import ProfilePage from './components/profile/profile';
import NotificationPage from './user/notification/notification';
import Chat from './components/AIchatbot/ChatInterface';
import ItemsList from './user/sources/ItemsList';
import Notes from './user/notes/notes';
import Videos from './user/videos/videos';
import Teams from './user/teamformation/teammangement';
import Chatting from './user/chatting';
import Home from './Quiz/pages/common/Home';
import WriteExam from './Quiz/pages/user/WriteExam';
import UserReports from './Quiz/pages/user/UserReports';
import TaskSubmission from './user/tasks/TaskSubmission';
import Forgot from './components/loginpage/ForgotPassword';
import Reset from './components/loginpage/ResetPassword';
import LeaderboardComponent from './components/leaderboard/leaderboard';
import ActiveTimeTracker from './user/timer/time';
import Grade from './user/gradespages/usergrades';
import Tracker from './components/leaderboard/timerleaderboard';
import Viewcertificate from './user/main-certificate/view-certificate';
import Pdf from './user/main-certificate/pdf-generator';
import Verify from './admin/main-certificate/verification-certificate';
import StudentFeedback from './user/feedback/StudentFeedback';
import Mentorevents from './user/events/mentorevents'

function User() {
  const location = useLocation();
  const hideChat = location.pathname.includes('/chat');
  const hideHeaderAndChat = location.pathname.includes('/write-exam/');

  return (
    <>
      {!hideHeaderAndChat && <Header />}
      {!hideHeaderAndChat && !hideChat && <Chat />}
      <ActiveTimeTracker />

      <Routes>
        <Route path="/" element={<Calender />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/calendar" element={<Calender />} />
        <Route path="/sources" element={<ItemsList />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/chat" element={<Chatting />} />
        <Route path="/write-exam/:id" element={<WriteExam />} />
        <Route path="/reports/:id" element={<UserReports />} />
        <Route path="/assignments" element={<Home />} />
        <Route path="/tasks" element={<TaskSubmission />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/leaderboard" element={<LeaderboardComponent />} />
        <Route path="/timer" element={<ActiveTimeTracker />} />
        <Route path="/grades" element={<Grade />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/view-certificate" element={<Viewcertificate />} />
        <Route path="/pdf-generator" element={<Pdf />} />
        <Route path="/verify-certificate" element={<Verify />} />
        <Route path="/feedback" element={<StudentFeedback />} />
        <Route path="/mentorevents" element={<Mentorevents />} />
      </Routes>
    </>
  );
}

export default User;
