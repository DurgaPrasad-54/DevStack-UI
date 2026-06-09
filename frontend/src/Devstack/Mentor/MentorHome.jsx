import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import config from '../../config';
import './MentorHome.css';
import LeaderboardComponent from '../../components/leaderboard/leaderboard';






import {
  TrophyOutlined,
  FireOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  FormOutlined } from

'@ant-design/icons';

const MentorHome = () => {
  const [dashboardData, setDashboardData] = useState({
    hackathonsMentored: 0,
    activeHackathons: 0,
    upcomingHackathons: 0,
    teamsMentored: 0
  });

  const [upcomingHackathons, setUpcomingHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const mentorId = localStorage.getItem('mentor');
      const headers = { Authorization: `Bearer ${token}` };

      // Make all API calls in parallel for faster loading
      const [teamsRes, allHackRes] = await Promise.all([
        axios.get(`${config.backendUrl}/hackteams/teams/mentor/${mentorId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${config.backendUrl}/hackathon/all`, { headers }).catch(() => ({ data: [] }))
      ]);

      // Process teams data
      const teams = teamsRes.data || [];
      const uniqueHackathons = new Set(teams.map(t => t.hackathon?.toString()));

      // Process hackathons data
      const allHacks = allHackRes.data || [];
      const ongoing = allHacks.filter(h => h.status === 'ongoing').length;
      const upcoming = allHacks.filter(h => h.status === 'upcoming').slice(0, 3);
      
      setUpcomingHackathons(upcoming);
      setDashboardData({
        hackathonsMentored: uniqueHackathons.size,
        teamsMentored: teams.length,
        activeHackathons: ongoing,
        upcomingHackathons: upcoming.length
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching mentor data:', err);
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
      <div className="mentor-home-container loading">
        <div className="home-loading-state">
          <div className="home-loading-spinner"></div>
          <span className="home-loading-text">Loading Mentor Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-home-container">
      <div className="mentor-header">
        <h1>Mentor Dashboard</h1>
        <p>Manage your hackathons, teams, and mentoring progress.</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Statistics Grid */}
      <div className="statistics-grid">
        <StatCard
          icon={<TrophyOutlined />}
          title="Hackathons Mentored"
          value={dashboardData.hackathonsMentored}
          color="blue"
        />
        <StatCard
          icon={<FireOutlined />}
          title="Active Hackathons"
          value={dashboardData.activeHackathons}
          color="purple"
        />
        <StatCard
          icon={<CalendarOutlined />}
          title="Upcoming Hackathons"
          value={dashboardData.upcomingHackathons}
          color="orange"
        />
        <StatCard
          icon={<TeamOutlined />}
          title="Teams Mentored"
          value={dashboardData.teamsMentored}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/hackmentor/problemstatements" className="action-button action-fifth">
            <span className="action-icon"><FileTextOutlined /></span>
            <span>Problem Statements</span>
          </Link>
          <Link to="/hackmentor/allteamsprogress" className="action-button action-sixth">
            <span className="action-icon"><BarChartOutlined /></span>
            <span>Teams Progress</span>
          </Link>
          <Link to="/hackmentor/evaluation" className="action-button action-tertiary">
            <span className="action-icon"><FormOutlined /></span>
            <span>Evaluate Teams</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Hackathons */}
      <div className="dashboard-grid">
        <div className="upcoming-hackathons-section">
          <div className="section-header-card">
            <h2><CalendarOutlined style={{ marginRight: '8px' }} /> Upcoming Hackathons</h2>
            <Link to="/hackathons" className="view-all">All →</Link>
          </div>
          <div className="hackathons-list">
            {upcomingHackathons.length > 0 ? (
              upcomingHackathons.map((hackathon, idx) => (
                <div key={idx} className="hackathon-card-item">
                  <div className="hackathon-header-item">
                    <h4>{hackathon.hackathonname}</h4>
                    <span className="status-badge status-upcoming">Upcoming</span>
                  </div>
                  <p className="hackathon-desc">{hackathon.description?.substring(0, 80)}...</p>
                  <div className="hackathon-dates">
                    <span><CalendarOutlined style={{ marginRight: '4px' }} /> {new Date(hackathon.regstart).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No upcoming hackathons at the moment.</p>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="leaderboard-section">
        <LeaderboardComponent showOnlyActiveTime={true} />
      </div>
    </div>
  );
};

export default MentorHome;
