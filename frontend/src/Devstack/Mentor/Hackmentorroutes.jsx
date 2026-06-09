import { Route, Routes } from 'react-router-dom';
import UserNavbar from './MentorHeader/MentorHeader';
import HackathonNotifications from './Notification'
import HackMentorResource from './Hackmentorresource';
import ResourcePage from '../HackResource';
import Schedule from '../Student/schedule/studentschedule';
import MentorHackathonPage from './Hackathons/Hackmentor';
import MentorProblemStatementsPage from './Problem Statements/Problemstatements';
import MentorSubmissionDashboard from './hacksubmission/hacksubmission';
import MentorHackathonTeams from './hackteam/hackteam';
import MentorEvaluationPage from './Evaluation/Evaluation'; 
import RoomAllocationSchedule from '../Mentor/roomallocation/Rommallocationschedul';
import PublicGallery from "../Student/PublicGallery";
import AllTeamsProgressPage from "../Student/Teamprogress/TeamsProgress";
import ProfilePage from '../hackmentorprofiles';
import NotFound from '../NotFound';
import MentorHome from './MentorHome';
import MentorCertificates from './certificates/MentorCertificates';
import WinnersPage from '../Student/WinnersPage';
import MentorHackathonHistory from './MentorHackathonHistory';

function HackMentor() {
    
  return (
    <div>
     <UserNavbar/>
    <div> 
    <Routes>
        <Route path = "/" element={<MentorHome />}/>
        <Route path="/notifications" element={<HackathonNotifications />} />
        <Route path="/uploadresource" element={<HackMentorResource />} />
        <Route path="/allteamsprogress" element={<AllTeamsProgressPage />} />
        <Route path="/resource" element={<ResourcePage />} />
        <Route path='/schedule' element={<Schedule />} />
        <Route path='/roomallocation' element={<RoomAllocationSchedule />} />
        <Route path='/hackathons' element={<MentorHackathonPage />} />
        <Route path='/problemstatements' element={<MentorProblemStatementsPage />} />
        <Route path='/hacksubmission' element={<MentorSubmissionDashboard />} />
        <Route path='/hackteam' element={<MentorHackathonTeams />} />
        <Route path='/evaluation' element={<MentorEvaluationPage/>} />
        <Route path='/roomschedule' element={<RoomAllocationSchedule />} />
        <Route path="/gallery" element={<PublicGallery />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/winners" element={<WinnersPage />} />
        <Route path="/certificates" element={<MentorCertificates />} />
        <Route path="/hackathon-history" element={<MentorHackathonHistory />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
    </div>
    </div>
  );
}

export default HackMentor;