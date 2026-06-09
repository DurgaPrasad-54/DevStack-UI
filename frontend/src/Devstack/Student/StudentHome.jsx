import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import config from '../../config';
import './StudentHome.css';
import LeaderboardComponent from '../../components/leaderboard/leaderboard';
import { useHackathon } from './context/HackathonContext';







import {
  TrophyOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  CloudUploadOutlined,
  BarChartOutlined,
  FireOutlined } from

'@ant-design/icons';

const StudentHome = () => {
  const [dashboardData, setDashboardData] = useState({
    registeredHackathons: 0,
    submittedProjects: 0,
    hackathonsCompleted: 0,
    upcomingHackathons: 0
  });

  const [ongoingHackathon, setOngoingHackathon] = useState(null);
  const [upcomingHackathons, setUpcomingHackathons] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSelectedHackathon: setContextSelectedHackathon } = useHackathon();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const studentId = localStorage.getItem('student');
      const headers = { Authorization: `Bearer ${token}` };

      // Make all API calls in parallel for faster loading
      const [teamRes, hackathonRes, allHackRes] = await Promise.all([
        axios.get(`${config.backendUrl}/hacksubmission/student/${studentId}/team`, { headers }).catch(() => ({ data: null })),
        axios.get(`${config.backendUrl}/hackreg/student/${studentId}/ongoing-approved`, { headers }).catch(() => ({ data: null })),
        axios.get(`${config.backendUrl}/hackathon/all`, { headers }).catch(() => ({ data: [] }))
      ]);

      // Process team submission
      let submittedProjects = 0;
      if (teamRes.data?.teamId) {
        try {
          const submissionRes = await axios.get(
            `${config.backendUrl}/hacksubmission/team/${teamRes.data.teamId}/submission`,
            { headers }
          );
          if (submissionRes.data?.hasSubmission) {
            submittedProjects = 1;
          }
        } catch (subErr) {
          // No submission yet
        }
      }

      // Process ongoing hackathon
      if (hackathonRes.data?.hackathon) {
        setOngoingHackathon(hackathonRes.data.hackathon);
        // Set selected hackathon via context when available
        if (setContextSelectedHackathon) {
          setContextSelectedHackathon(hackathonRes.data.hackathon._id);
        } else {
          localStorage.setItem('selectedHackathonId', hackathonRes.data.hackathon._id);
        }
      }

      // Process all hackathons
      const allHacks = allHackRes.data || [];
      const ongoing = allHacks.filter(h => h.status === 'ongoing').length;
      const completed = allHacks.filter(h => h.status === 'completed').length;
      const upcoming = allHacks.filter(h => h.status === 'upcoming').slice(0, 3);
      
      setUpcomingHackathons(upcoming);
      setDashboardData({
        registeredHackathons: ongoing || 1,
        submittedProjects,
        hackathonsCompleted: completed,
        upcomingHackathons: upcoming.length
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, color }) => (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-value">{value}</p>
        <p className="stat-title">{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="student-home-container loading">
        <div className="home-loading-state">
          <div className="home-loading-spinner"></div>
          <span className="home-loading-text">Loading Your Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="student-home-container">
      <div className="student-header">
        <h1>Welcome to Your Hackathon Hub</h1>
        <p>Manage your hackathon journey, track your team's progress, and submit your projects.</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Ongoing Hackathon Banner */}
      {ongoingHackathon && (
        <div className="ongoing-banner">
          <div className="banner-content">
            <h2><FireOutlined style={{ marginRight: '8px' }} /> Active Hackathon: {ongoingHackathon.hackathonname}</h2>
            <p>{ongoingHackathon.description?.substring(0, 150)}...</p>
            <div className="banner-actions">
              <Link to="/hackstudent/team-formation" className="banner-btn primary">
                View Team
              </Link>
              <Link to="/hackstudent/hacksubmission" className="banner-btn secondary">
                Submit Project
              </Link>
            </div>
          </div>
          <div className="banner-icon"><TrophyOutlined /></div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="statistics-grid">
        <StatCard
          icon={<ProjectOutlined />}
          title="Registered Hackathons"
          value={dashboardData.registeredHackathons || 0}
          color="blue"
        />
        <StatCard
          icon={<CloudUploadOutlined />}
          title="Projects Submitted"
          value={dashboardData.submittedProjects}
          color="purple"
        />
        <StatCard
          icon={<CheckCircleOutlined />}
          title="Hackathons Completed"
          value={dashboardData.hackathonsCompleted}
          color="orange"
        />
        <StatCard
          icon={<CalendarOutlined />}
          title="Upcoming Hackathons"
          value={dashboardData.upcomingHackathons}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/hackstudent/hackathon" className="action-button action-primary">
            <span className="action-icon"><TrophyOutlined /></span>
            <span>Hackathons</span>
          </Link>
          <Link to="/hackstudent/team-formation" className="action-button action-secondary">
            <span className="action-icon"><TeamOutlined /></span>
            <span>Form/Join Team</span>
          </Link>
          <Link to="/hackstudent/hacksubmission" className="action-button action-quaternary">
            <span className="action-icon"><CloudUploadOutlined /></span>
            <span>Submit Project</span>
          </Link>
          <Link to="/hackstudent/allteamsprogress" className="action-button action-sixth">
            <span className="action-icon"><BarChartOutlined /></span>
            <span>Teams Progress</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Hackathons */}
      <div className="upcoming-hackathons-section">
        <h2>Upcoming Hackathons</h2>
        <div className="hackathons-list">
          {upcomingHackathons.length > 0 ? (
            upcomingHackathons.map(hackathon => (
              <div key={hackathon._id} className="hackathon-card">
                <div className="hackathon-header">
                  <h3>{hackathon.hackathonname}</h3>
                  <span className="status-badge status-upcoming">Upcoming</span>
                </div>
                <p className="hackathon-description">{hackathon.description?.substring(0, 100)}...</p>
              </div>
            ))
          ) : (
            <p className="no-data">No upcoming hackathons scheduled.</p>
          )}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="leaderboard-section">
        <LeaderboardComponent showOnlyActiveTime={true} />
      </div>
    </div>
  );
};

export default StudentHome;
