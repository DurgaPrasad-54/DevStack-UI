import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Teams from './mentor/teams';
import MentorTeams from './user/teamformation/mentor';
import Githubapp from './mentor/githubapp';
import Task from './mentor/tasks/TaskGrading';
import MentorHeader from './mentor/mentorheader/mentorheader';
import Chat from './components/AIchatbot/ChatInterface';
import ItemsList from './user/sources/ItemsList';
import Notes from './user/notes/notes';
import Videos from './user/videos/videos';
import Chatting from './user/chatting';
import LeaderboardComponent from './components/leaderboard/leaderboard';
import Calender from './user/usercalender/usercalendar';
import NotificationPage from './user/notification/notification';
import ProfilePage from './mentor/mentorprofile/mentorprofile';
import Tracker from './components/leaderboard/timerleaderboard';
import Verify from './admin/main-certificate/verification-certificate';
import MentorEvents from './mentor/events/mentorevents';
import StudentFeedback from './user/feedback/StudentFeedback';
import MentorDashboard from './mentor/mentorresouces/mentorresources';
function Mentor() {
  return (
    <>
      <MentorHeader />
      <Routes>
        {/* <Route path="/" element={<Teams />} /> */}
        <Route path="/" element={<Calender />} />
        {/* <Route path="/teams" element={<Teams />} /> */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/team-formation" element={<MentorTeams />} />
        <Route path="/github" element={<Githubapp />} />
        <Route path="/tasks" element={<Task />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/calendar" element={<Calender />} />
        <Route path="/sources" element={<ItemsList />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/chat" element={<Chatting />} />
        <Route path="/leaderboard" element={<LeaderboardComponent />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/verify-certificate" element={<Verify />} />
        <Route path="/mentorevents" element={<MentorEvents />} />
        {/* <Route path="/feedback" element={<StudentFeedback />} /> */}
        <Route path="/mentorresources" element={<MentorDashboard/>} />
      </Routes>
    </>
  );
}

export default Mentor;
