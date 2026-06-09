import { Route, Routes } from "react-router-dom";

// Components
import UserNavbar from "./StudentHeader/StudentHeader";
import HackathonNotifications from "./Notification";
import HackathonsByStatus from "./hackathon/hackathon";
import ResourcePage from "../HackResource";
import RoomAllocationSchedule from "./roomallocation/RoomAllocationSchedule";
import TeamManagementDashboard from "./hackteamformation/hackteam";
import { HackathonProvider } from "./context/HackathonContext";
import TeamProblemStatementsPage from "./Problem Statements/Problemstatements";
import HackathonSubmissionForm from "./hacksubmission/hacksubmission";
import TeamProgressForm from "./Teamprogress/Teamprogess";
import AllTeamsProgressPage from "./Teamprogress/TeamsProgress";
import PublicGallery from "./PublicGallery";
import ProfilePage from "../hackprofiles";
import CombinedProgressPage from "./Teamprogress/CombinedProgressPage";
import WinnersPage from "./WinnersPage";
import NotFound from "../NotFound";
import StudentHome from "./StudentHome";
import StudentCertificates from "./certificates/StudentCertificates";
import HackathonHistory from "./HackathonHistory";

function HackStudent() {
  const hackathonId = localStorage.getItem("selectedHackathonId");

  return (
    <div>
      <UserNavbar />
      <HackathonProvider>
        <Routes>
          <Route path="/" element={<StudentHome/>} />
          <Route path="/notifications" element={<HackathonNotifications />} />
          <Route path="/hackathon" element={<HackathonsByStatus />} />
          <Route path="/resources" element={<ResourcePage />} />
          <Route path="/roomallocation" element={<RoomAllocationSchedule />} />
          <Route path="/team-formation" element={<TeamManagementDashboard />} />
          <Route path="/problemstatements" element={<TeamProblemStatementsPage />} />
          <Route 
            path="/hacksubmission" 
            element={<HackathonSubmissionForm hackathonId={hackathonId} />} 
          />
          <Route path="/teamprogress" element={<TeamProgressForm />} />
          <Route path="/allteamsprogress" element={<AllTeamsProgressPage />} />
          <Route path="/gallery" element={<PublicGallery />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/combinedprogress" element={<CombinedProgressPage />} />
          <Route path="/winners" element={<WinnersPage />} />
          <Route path="/certificates" element={<StudentCertificates />} />
          <Route path="/hackathon-history" element={<HackathonHistory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HackathonProvider>
    </div>
  );
}

export default HackStudent;