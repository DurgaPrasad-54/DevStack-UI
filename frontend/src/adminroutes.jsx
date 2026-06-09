import React from 'react';
import { Layout } from 'antd';
import { Routes, Route } from 'react-router-dom';
import AdminHeader from './admin/AdminHeader';
import Calender from './admin/calendar/calendar';
import Certificate from './admin/certificates';
import Teams from './admin/teams';
import CSV from './admin/csv';
import Notification from './admin/notification';
import Project from './admin/projects';
import Resources from './admin/resources';
import Home from './Quiz/pages/common/Home';
import Exams from './Quiz/pages/admin/Exams';
// import Adminexam from"./Quiz/pages/user/WriteExam/adminexams";
import AddEditExam from './Quiz/pages/admin/Exams/AddEditExam';
import AddEditQuestions from './Quiz/pages/admin/Exams/AddEditQuestion';
import AdminReport from './Quiz/pages/admin/AdminReports';
import Compiler from './admin/Admin';
import Task from './admin/tasks/TaskList';
import AdminMentorApproval from './admin/mentorapproval/mentorapproval';
import Viewcertificate from './admin/main-certificate/view-certificate';
import GradeCriteria from './admin/main-certificate/grade-certiria';
import Template from './admin/main-certificate/templet';
import Verify from './admin/main-certificate/verification-certificate';
import CertificateDownload from './admin/main-certificate/certificate-download';
import BulkYearManagement from './admin/promoting/promotingstudents';
import MentorFeedbacks from './admin/feedback/MentorFeedback';
import AdminApprovalDashboard from './admin/approvalmentorresoucres/approvalmentorresources';
// import YearChangeRequest from './admin/secondyearrequest/secondyearrequest';

const { Content } = Layout;

function Admin() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminHeader />
      <Content style={{ padding: '0 10px', marginTop: 64 }}>
        <Routes>
          <Route path="/" element={<Calender />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/exams/add" element={<AddEditExam />} />
          <Route path="/exams/edit/:id" element={<AddEditExam />} />
          <Route
            path="/exams/questions/add-edit"
            element={<AddEditQuestions />}
          />
          <Route path="/reports" element={<AdminReport />} />
          <Route path="/projects" element={<Project />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/calendar" element={<Calender />} />
          <Route path="/certificates" element={<Certificate />} />
          <Route path="/csv" element={<CSV />} />
          <Route path="/notifications" element={<Notification />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/compiler" element={<Compiler />} />
          <Route path="/tasks" element={<Task />} />
          <Route path="/mentorapproval" element={<AdminMentorApproval />} />
          <Route path="/viewcertificate" element={<Viewcertificate />} />
          <Route path="/grade-criteria" element={<GradeCriteria />} />
          <Route path="/template" element={<Template />} />
          <Route path="/verify-certificate" element={<Verify />} />

          <Route
            path="/download-certificate"
            element={<CertificateDownload />}
          />
          <Route
            path="/bulk-year-management"
            element={<BulkYearManagement />}
          />
          <Route path="/mentor-feedbacks" element={<MentorFeedbacks />} />
          {/* <Route path="/secondyear-request" element={<YearChangeRequest />} /> */}
          <Route path="/resource-approval" element={<AdminApprovalDashboard />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default Admin;
