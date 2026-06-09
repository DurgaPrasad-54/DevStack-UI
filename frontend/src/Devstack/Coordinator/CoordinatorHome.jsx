import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import config from '../../config';
import './CoordinatorHome.css';
import LeaderboardComponent from '../../components/leaderboard/leaderboard';






import {
  TrophyOutlined,
  TeamOutlined,
  AimOutlined,
  CloudUploadOutlined,
  HomeOutlined,
  CheckSquareOutlined,
  UserSwitchOutlined } from

'@ant-design/icons';

// Cache duration in milliseconds (5 minutes)

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

const CoordinatorHome = () => {
  const [statistics, setStatistics] = useState({
    ongoingHackathons: 0,
    ongoingRegistrations: 0,
    ongoingTeams: 0,
    ongoingSubmissions: 0
  });
  const [upcomingHackathons, setUpcomingHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized headers to prevent recreation on each render
  const headers = useMemo(() => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchCoordinatorData = useCallback(async () => {
    try {
      // Check cache first
      const cachedData = sessionStorage.getItem('coordinatorDashboardData');
      const cacheTimestamp = sessionStorage.getItem('coordinatorDashboardTimestamp');
      
      if (cachedData && cacheTimestamp) {
        const isValid = Date.now() - parseInt(cacheTimestamp) < CACHE_DURATION;
        if (isValid) {
          const parsed = JSON.parse(cachedData);
          setStatistics(parsed.statistics);
          setUpcomingHackathons(parsed.upcomingHackathons);
          setLoading(false);
          return;
        }
      }

      setLoading(true);

      // Make only essential API calls in parallel - reduced from 3 to 2 calls
      const [hackathonRes, teamsRes] = await Promise.all([
        axios.get(`${config.backendUrl}/hackathon/all`, { headers, timeout: 10000 }).catch(() => ({ data: [] })),
        axios.get(`${config.backendUrl}/hackteams/teams`, { headers, timeout: 10000 }).catch(() => ({ data: [] }))
      ]);

      const allHackathons = hackathonRes.data || [];
      const ongoingHackathons = allHackathons.filter(h => h.status === 'ongoing');
      const upcoming = allHackathons.filter(h => h.status === 'upcoming').slice(0, 3);
      
      setUpcomingHackathons(upcoming);

      // Count teams for ongoing hackathons
      const allTeams = teamsRes.data || [];
      const ongoingTeams = allTeams.filter(team => {
        const teamHackathonId = team.hackathon?._id || team.hackathon;
        return ongoingHackathons.some(h => h._id?.toString() === teamHackathonId?.toString());
      }).length;

      // Calculate basic stats without additional API calls
      const stats = {
        ongoingHackathons: ongoingHackathons.length,
        ongoingRegistrations: 0,
        ongoingTeams,
        ongoingSubmissions: 0
      };

      // Fetch additional data in background (non-blocking)
      if (ongoingHackathons.length > 0) {
        // Submissions and registrations loaded in background
        Promise.all([
          axios.get(`${config.backendUrl}/hacksubmission`, { headers, timeout: 10000 }).catch(() => ({ data: { submissions: [] } })),
          ...ongoingHackathons.slice(0, 3).map(h => 
            axios.get(`${config.backendUrl}/hackreg/hackathon/${h._id}/approved`, { headers, timeout: 10000 })
              .catch(() => ({ data: [] }))
          )
        ]).then(([submissionsRes, ...regResults]) => {
          const allSubmissions = submissionsRes.data?.submissions || [];
          const ongoingSubmissions = allSubmissions.filter(sub => {
            const submissionHackathonId = sub.hackathon?._id || sub.hackathon;
            return ongoingHackathons.some(h => h._id?.toString() === submissionHackathonId?.toString());
          }).length;

          let ongoingRegistrations = 0;
          regResults.forEach(res => {
            const regs = res.data || [];
            regs.forEach(reg => {
              if (reg.students) {
                ongoingRegistrations += reg.students.filter(s => s.status === 'approved').length;
              }
            });
          });

          const updatedStats = {
            ...stats,
            ongoingRegistrations,
            ongoingSubmissions
          };
          
          setStatistics(updatedStats);
          
          // Update cache
          sessionStorage.setItem('coordinatorDashboardData', JSON.stringify({
            statistics: updatedStats,
            upcomingHackathons: upcoming
          }));
          sessionStorage.setItem('coordinatorDashboardTimestamp', Date.now().toString());
        }).catch(console.error);
      }

      setStatistics(stats);
      
      // Cache initial data
      sessionStorage.setItem('coordinatorDashboardData', JSON.stringify({
        statistics: stats,
        upcomingHackathons: upcoming
      }));
      sessionStorage.setItem('coordinatorDashboardTimestamp', Date.now().toString());

      setError(null);
    } catch (err) {
      console.error('Error fetching coordinator data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchCoordinatorData();
  }, [fetchCoordinatorData]);

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
      <div className="coordinator-home-container loading">
        <div className="home-loading-state">
          <div className="home-loading-spinner"></div>
          <span className="home-loading-text">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="coordinator-home-container">
      <div className="coordinator-header">
        <h1>Coordinator Dashboard</h1>
        <p>Welcome back! Here's an overview of your hackathon management.</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Statistics Grid */}
      <div className="statistics-grid">
        <StatCard
          icon={<TrophyOutlined />}
          title="Ongoing Hackathons"
          value={statistics.ongoingHackathons}
          color="orange"
        />
        <StatCard
          icon={<TeamOutlined />}
          title="Total Registrations"
          value={statistics.ongoingRegistrations}
          color="red"
        />
        <StatCard
          icon={<AimOutlined />}
          title="Total Teams"
          value={statistics.ongoingTeams}
          color="teal"
        />
        <StatCard
          icon={<CloudUploadOutlined />}
          title="Total Submissions"
          value={statistics.ongoingSubmissions}
          color="indigo"
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/coordinator/roomallocation" className="action-button action-tertiary">
            <span className="action-icon"><HomeOutlined /></span>
            <span>Room Allocation</span>
          </Link>
          <Link to="/coordinator/hackattendance" className="action-button action-quaternary">
            <span className="action-icon"><CheckSquareOutlined /></span>
            <span>Check Attendance</span>
          </Link>
          <Link to="/coordinator/assignmentor" className="action-button action-fifth">
            <span className="action-icon"><UserSwitchOutlined /></span>
            <span>Assign Mentors</span>
          </Link>
          <Link to="/coordinator/hacksubmission" className="action-button action-sixth">
            <span className="action-icon"><CloudUploadOutlined /></span>
            <span>View Submissions</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Hackathons */}
      <div className="upcoming-hackathons-section">
        <h2>Upcoming Hackathons</h2>
        <div className="hackathons-list">
          {upcomingHackathons.length > 0 ? (
            upcomingHackathons.map(hackathon => (
              <div key={hackathon._id} className="coordinator-hackathon-card">
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

export default CoordinatorHome;
