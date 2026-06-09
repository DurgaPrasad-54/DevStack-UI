import { Route, Routes } from 'react-router-dom';
import CreateHackathonPage from './Hackathon/Createhackathon';
import ViewHackathonsPage from './Hackathon/Viewhackathon';
import NotificationManagement from './Notification/Notification';
import CoordinatorRegistrationForm from './Coordinator/coordinator';
import AdminHeader from './Header/header';
import AdminDashboard from './Room allocation/roomallocation';
import ScheduleManager from './schedule/schedule';
import AdminResourceApproval from './ResourceApprovals/AdminResource';
import AdminMentorApproval from './MentorApprovals/Mentorrequest';
import StudentRegistration from './csv/csv';
import MentorFeedbackDashboard from './mentorfeedback/mentorsfeedback';
import HackathonGallery from './Gallery/HackathonGallery';
import CertificateManagement from './Certificates/CertificateManagement';
import NotFound from '../NotFound';
import WinnersPage from '../Student/WinnersPage';


function HackAdmin() {
  return (
    <div>
      {/* Make header fixed */}
      <div style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 1000,
      }}>
        <AdminHeader />
      </div>
      {/* Add padding to prevent content being hidden behind header */}
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<ViewHackathonsPage />} />
          <Route path="/create" element={<CreateHackathonPage />} />
          <Route path="/hackathons" element={<ViewHackathonsPage />} />
          <Route path="/edithackathon/:id" element={<CreateHackathonPage />} />
          <Route path="/notifications" element={<NotificationManagement />} />
          <Route path="/register-coordinator" element={<CoordinatorRegistrationForm />} />
          <Route path="/roomallocation" element={<AdminDashboard />} />
          <Route path="/schedule" element={<ScheduleManager />} />
          <Route path="/resourceapprovals" element={<AdminResourceApproval />} />
          <Route path="/mentorapprovals" element={<AdminMentorApproval />} />
          <Route path="/csv" element={<StudentRegistration />} />
          <Route path="/hackfeedback" element={<MentorFeedbackDashboard />} />
          <Route path="/gallery" element={<HackathonGallery />} />
          <Route path="/certificates" element={<CertificateManagement />} />
          <Route path="/winners" element={<WinnersPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default HackAdmin;