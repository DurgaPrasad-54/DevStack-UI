import { Route, Routes } from 'react-router-dom';
import UserNavbar from './CoordinatorHeader/CoordinatorHeader';
import HackathonNotifications from './Notification'
import UserRoomAllocationBatch from './room allocation/roomallocation';
import FeeVerificationDashboard from './hack-reg/hack-reg';
import ResourcePage from '../HackResource';
import TeamFormation from './teams/hackteam';
import HackathonSubmissionApp from './hacksubmission/hacksubmission';
import MentorTeamTabs from './teams/assignedteams';
import MentorFeedbackDashboard from './mentorfeedback/hackmentorfeedback';
import HackathonAttendanceManager from './hackathonattendance/hackathonattendance';
import AttendanceHistoryViewer from './hackathonattendance/hackattendancehistory';
import PublicGallery from "../Student/PublicGallery";
import AllTeamsProgressPage from "../Student/Teamprogress/TeamsProgress";
import CoordinatorProfile from '../coordinatorprofile';
import CoordinatorSchedule from './schedule/CoordinatorSchedule';
import StudentHackathonDetails from './studentdetails/StudentHackathonDetails';
import NotFound from '../NotFound';
import CoordinatorHome from './CoordinatorHome';


function Coordinator() {
    
  return (
    <div>
      
     <UserNavbar/>
     <div> 
    <Routes>
        <Route path="/" element={<CoordinatorHome />} /> 
        <Route path="/notifications" element={<HackathonNotifications />} />
        <Route path="/roomallocation" element={<UserRoomAllocationBatch />} />
        <Route path="/fee-verification" element={<FeeVerificationDashboard />} />
        <Route path="/allteamsprogress" element={<AllTeamsProgressPage />} />
        <Route path="/resource" element={<ResourcePage />} />
        {/* <Route path="/schedule" element={<Schedule />} /> */}
        <Route path="/hackteam" element={<TeamFormation />} />
        <Route path="/hacksubmission" element={<HackathonSubmissionApp />} />
        <Route path="/assignmentor" element={<MentorTeamTabs />} />
        <Route path="/hackfeedback" element={<MentorFeedbackDashboard />} />
        <Route path="/hackattendance" element={<HackathonAttendanceManager />} />
        <Route path="/hackattendancehistory" element={<AttendanceHistoryViewer />} />
        <Route path="/student-details" element={<StudentHackathonDetails />} />
        <Route path="/gallery" element={<PublicGallery />} />
        <Route path="/profile" element={<CoordinatorProfile />} />
        <Route path="/schedule" element={<CoordinatorSchedule />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
    </div>
    </div>
  );
}

export default Coordinator;