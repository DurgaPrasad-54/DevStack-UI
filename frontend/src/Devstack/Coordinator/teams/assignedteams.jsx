import { useState, useEffect } from 'react';
import config from '../../../config';
import './teams.css';

function MentorTeamTabs() {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [activeTab, setActiveTab] = useState('assigned');
  const [teams, setTeams] = useState([]);
  const [approvedMentors, setApprovedMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [branches, setBranches] = useState([]);

  // Get coordinator details from localStorage
  const [coordinatorYear] = useState(localStorage.getItem('coordinatoryear') || '');
  const [coordinatorCollege] = useState(localStorage.getItem('coordinatordetails') || '');

  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    if (selectedHackathon) {
      fetchTeams();
      fetchApprovedMentors();
    } else {
      setTeams([]);
      setApprovedMentors([]);
      setBranches([]);
    }
    setSelectedBranch('');
    setSearchQuery('');
  }, [selectedHackathon]);

  useEffect(() => {
    if (teams.length > 0) {
      const uniqueBranches = [...new Set(
        teams.flatMap(team => 
          team.students?.map(student => student.branch).filter(Boolean) || []
        )
      )].sort();
      setBranches(uniqueBranches);
    }
  }, [teams]);

  // Validation check for coordinator info
  if (!coordinatorYear || !coordinatorCollege) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a' }}>
            Missing Coordinator Information
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Coordinator year or college information is missing from your session.
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            Please log in again to access the mentor assignment dashboard.
          </p>
        </div>
      </div>
    );
  }

 const fetchHackathons = async () => {
    try {
      console.log('Fetching hackathons with coordinator filters:', { coordinatorYear, coordinatorCollege });
      
      // FIXED: Use 'year' and 'college' parameter names to match backend
      const params = new URLSearchParams();
      if (coordinatorYear) params.append('year', coordinatorYear);
      if (coordinatorCollege) params.append('college', coordinatorCollege);
      
      const url = `${config.backendUrl}/hackteams/hackathons?${params.toString()}`;
      console.log('Fetching from:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log('Hackathons response:', data);
      
      // Handle the response format from backend
      const hackathonsList = data.success && Array.isArray(data.data) 
        ? data.data 
        : (Array.isArray(data) ? data : []);
      
      console.log(`Loaded ${hackathonsList.length} hackathons for ${coordinatorCollege} - ${coordinatorYear}`);
      setHackathons(hackathonsList);
    } catch (err) {
      console.error('Error fetching hackathons:', err);
      setError('Failed to fetch hackathons');
      setHackathons([]);
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching teams for hackathon:', selectedHackathon);
      console.log('With coordinator filters:', { coordinatorYear, coordinatorCollege });
      
      const params = new URLSearchParams();
      params.append('hackathonId', selectedHackathon);
      if (coordinatorYear) params.append('coordinatorYear', coordinatorYear);
      if (coordinatorCollege) params.append('coordinatorCollege', coordinatorCollege);
      
      const url = `${config.backendUrl}/hackteams/teams?${params.toString()}`;
      console.log('Fetching from:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log(`Loaded ${data.length} teams matching ${coordinatorCollege} - ${coordinatorYear}`);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to fetch teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedMentors = async () => {
    try {
      const res = await fetch(`${config.backendUrl}/hackteams/mentors/search?hackathonId=${selectedHackathon}`);
      const data = await res.json();
      setApprovedMentors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError('Failed to fetch mentors');
    }
  };

  const assignMentorToTeam = async (teamId, mentorId) => {
    if (!mentorId) {
      alert('Please select a mentor');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const team = teams.find(t => t._id === teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const payload = {
        teamName: team.name,
        hackathonId: selectedHackathon,
        studentIds: team.students.map(s => s._id || s.registrationId),
        mentorId: mentorId
      };

      const res = await fetch(`${config.backendUrl}/hackteams/teams/${teamId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to assign mentor');
      }

      setSuccess(`Mentor assigned successfully to team "${team.name}"!`);
      await fetchTeams();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Assign mentor error:', err);
      setError(err.message || 'Failed to assign mentor');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const removeMentorFromTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to remove the mentor from this team?')) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const team = teams.find(t => t._id === teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const payload = {
        teamName: team.name,
        hackathonId: selectedHackathon,
        studentIds: team.students.map(s => s._id || s.registrationId),
        mentorId: null
      };

      const res = await fetch(`${config.backendUrl}/hackteams/teams/${teamId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to remove mentor');
      }

      setSuccess(`Mentor removed successfully from team "${team.name}"!`);
      await fetchTeams();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Remove mentor error:', err);
      setError(err.message || 'Failed to remove mentor');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const filterTeamsByBranch = (teamsList) => {
    if (!selectedBranch) return teamsList;
    
    return teamsList.filter(team => 
      team.students?.some(student => student.branch === selectedBranch)
    );
  };

  const searchTeams = (teamsList) => {
    if (!searchQuery.trim()) return teamsList;
    
    const query = searchQuery.toLowerCase().trim();
    
    return teamsList.filter(team => {
      if (team.name?.toLowerCase().includes(query)) return true;
      
      return team.students?.some(student => 
        student.name?.toLowerCase().includes(query) ||
        student.rollNo?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.branch?.toLowerCase().includes(query)
      );
    });
  };

  const assignedTeams = teams.filter(team => team.mentor && team.mentor._id);
  const unassignedTeams = teams.filter(team => !team.mentor || !team.mentor._id);

  const currentTeamsBeforeFilter = activeTab === 'assigned' ? assignedTeams : unassignedTeams;
  const filteredByBranch = filterTeamsByBranch(currentTeamsBeforeFilter);
  const currentTeams = searchTeams(filteredByBranch);

  const renderTeamCard = (team) => (
    <div
      className="team-card"
      key={team._id}
      style={{
        border: '1px solid #e0e0e0',
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        marginBottom: '16px'
      }}
    >
      <div className="team-card-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <h4 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>
          {team.name}
        </h4>
        {team.mentor ? (
          <span style={{
            padding: '6px 12px',
            backgroundColor: '#4caf50',
            color: 'white',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Mentor Assigned
          </span>
        ) : (
          <span style={{
            padding: '6px 12px',
            backgroundColor: '#ff9800',
            color: 'white',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            No Mentor
          </span>
        )}
      </div>

      {activeTab === 'unassigned' ? (
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: '#fff3e0',
          borderRadius: '6px',
          borderLeft: '4px solid #ff9800'
        }}>
          <strong style={{ color: '#e65100', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
            Assign Mentor:
          </strong>
          {approvedMentors.length === 0 ? (
            <div style={{
              padding: '12px',
              backgroundColor: '#ffebee',
              borderRadius: '6px',
              color: '#c62828',
              fontSize: '14px',
              border: '1px solid #ffcdd2'
            }}>
              No approved mentors available for this hackathon. Please approve mentor requests first.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                id={`mentor-select-${team._id}`}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
                defaultValue=""
              >
                <option value="">-- Select Mentor --</option>
                {approvedMentors.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const selectElement = document.getElementById(`mentor-select-${team._id}`);
                  const mentorId = selectElement.value;
                  assignMentorToTeam(team._id, mentorId);
                }}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: loading ? '#ccc' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'Loading...' : 'Assign'}
              </button>
            </div>
          )}
        </div>
      ) : (
        team.mentor && (
          <div className="assigned-mentor-section">
            <div className="assigned-mentor-label">Mentor:</div>
            <div className="assigned-mentor-content">
              <div className="assigned-mentor-info">
                <div className="assigned-mentor-name">
                  {team.mentor.name}
                </div>
                <div className="assigned-mentor-email">
                  {team.mentor.email || 'N/A'}
                </div>
                {team.mentor.github && (
                  <div className="assigned-mentor-github">
                    GitHub: {team.mentor.github}
                  </div>
                )}
                {team.mentor.linkedin && (
                  <div className="assigned-mentor-linkedin">
                    LinkedIn: {team.mentor.linkedin}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeMentorFromTeam(team._id)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  backgroundColor: loading ? '#ccc' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                Remove
              </button>
            </div>
          </div>
        )
      )}

      {team.teamLead && (
        <div className="assigned-team-lead-section">
          <div className="assigned-team-lead-label">Team Lead:</div>
          <div className="assigned-team-lead-name">
            {team.teamLead.name}
          </div>
          <div className="assigned-team-lead-details" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {team.teamLead.rollNo && <div>{team.teamLead.rollNo}</div>}
            {team.teamLead.currentYear && <div>{team.teamLead.currentYear}</div>}
            <div>{team.teamLead.email}</div>
          </div>
          {team.teamLead.college && (
            <div className="assigned-team-lead-college">
              {team.teamLead.college}
            </div>
          )}
        </div>
      )}

      <div className="assigned-team-members-section">
        <div className="assigned-team-members-title">
          Team Members ({(team.students || []).length}/4):
        </div>
        <div>
          {(team.students || []).length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No members yet</p>
          ) : (
            (team.students || []).map((student, index) => {
              const isLead = team.teamLead && student._id === team.teamLead._id;
              return (
                <div
                  key={student._id || index}
                  className="assigned-member-item"
                >
                  <div className="assigned-member-header">
                    <span className="assigned-member-name">
                      {index + 1}. {student.name}
                    </span>
                    {isLead && (
                      <span className="assigned-member-badge">
                        ⭐ LEAD
                      </span>
                    )}
                  </div>
                  <div className="assigned-member-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#666' }}>
                    {student.rollNo && <div>{student.rollNo}</div>}
                    {student.branch && <div>{student.branch}</div>}
                    {student.currentYear && <div>{student.currentYear}</div>}
                    <div>{student.email || 'N/A'}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="teams-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Coordinator Info Banner */}
      <div style={{
        marginBottom: '20px',
        padding: '16px 20px',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', opacity: 0.9, color:'black' }}>Viewing teams for:</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color:'black' }}>
              {coordinatorCollege} • {coordinatorYear}
            </div>
          </div>
        </div>
      </div>

      <h1 style={{ marginBottom: '30px', color: '#1a1a1a' }}>Mentor Assignment Overview</h1>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #fcc',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb',
          fontSize: '14px'
        }}>
          <strong>Success:</strong> {success}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>Select Hackathon</h2>
        <select
          onChange={e => setSelectedHackathon(e.target.value)}
          value={selectedHackathon}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '15px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="">-- Select Hackathon --</option>
          {hackathons.map(h => (
            <option key={h._id || h.id} value={h._id || h.id}>
              {h.hackathonname || h.name} {h.status ? `(${h.status})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedHackathon && (
        <>
          {/* Filter and Search Section */}
          <div className="assigned-filter-section">
            <div className="assigned-filter-row">
              <div className="assigned-filter-group">
                <label className="assigned-filter-label">
                  Filter by Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div className="assigned-filter-group" style={{ flex: 2, minWidth: 'max(150px, 200px)' }}>
                <label className="assigned-filter-label">
                  Search Teams & Students
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, roll no, email, team name..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white'
                  }}
                />
              </div>

              {(selectedBranch || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedBranch('');
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    height: '42px'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {(selectedBranch || searchQuery) && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>Active filters:</span>
                {selectedBranch && (
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Branch: {selectedBranch}
                  </span>
                )}
                {searchQuery && (
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#fff3e0',
                    color: '#e65100',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Search: "{searchQuery}"
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="assigned-tabs-container">
            <button
              onClick={() => setActiveTab('assigned')}
              className="assigned-tab-button"
              style={{
                backgroundColor: activeTab === 'assigned' ? '#1976d2' : 'transparent',
                color: activeTab === 'assigned' ? 'white' : '#666',
                borderBottom: activeTab === 'assigned' ? '3px solid #1976d2' : '3px solid transparent'
              }}
            >
              Teams with Mentors ({assignedTeams.length})
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className="assigned-tab-button"
              style={{
                backgroundColor: activeTab === 'unassigned' ? '#ff9800' : 'transparent',
                color: activeTab === 'unassigned' ? 'white' : '#666',
                borderBottom: activeTab === 'unassigned' ? '3px solid #ff9800' : '3px solid transparent'
              }}
            >
              Teams without Mentors ({unassignedTeams.length})
            </button>
          </div>

          <div className="teams-stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              border: '2px solid #1976d2'
            }}>
              <div style={{ fontSize: '14px', color: '#1976d2', fontWeight: '600', marginBottom: '8px' }}>
                Total Teams
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
                {teams.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                for {coordinatorCollege} - {coordinatorYear}
              </div>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              border: '2px solid #4caf50'
            }}>
              <div style={{ fontSize: '14px', color: '#4caf50', fontWeight: '600', marginBottom: '8px' }}>
                Teams with Mentors
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
                {assignedTeams.length}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                {teams.length > 0 ? Math.round((assignedTeams.length / teams.length) * 100) : 0}% Complete
              </div>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              border: '2px solid #ff9800'
            }}>
              <div style={{ fontSize: '14px', color: '#ff9800', fontWeight: '600', marginBottom: '8px' }}>
                Teams without Mentors
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
                {unassignedTeams.length}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                {unassignedTeams.length > 0 ? 'Need Assignment' : 'All Assigned! 🎉'}
              </div>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#e8eaf6',
              borderRadius: '8px',
              border: '2px solid #3f51b5'
            }}>
              <div style={{ fontSize: '14px', color: '#3f51b5', fontWeight: '600', marginBottom: '8px' }}>
                Approved Mentors
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
                {approvedMentors.length}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                Available to Assign
              </div>
            </div>
          </div>

          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px' 
            }}>
              <h3 style={{ margin: 0, color: '#1a1a1a' }}>
                {activeTab === 'assigned' 
                  ? `✓ Teams with Assigned Mentors`
                  : `⚠ Teams without Mentors`
                }
              </h3>
              <span style={{
                padding: '6px 16px',
                backgroundColor: '#f0f0f0',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333'
              }}>
                Showing {currentTeams.length} of {currentTeamsBeforeFilter.length} teams
              </span>
            </div>

            {loading && currentTeams.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <p style={{ fontSize: '16px', color: '#666' }}>Loading teams...</p>
              </div>
            ) : currentTeams.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                color: '#999'
              }}>
                <p style={{ fontSize: '16px', margin: 0 }}>
                  {(selectedBranch || searchQuery) 
                    ? 'No teams found matching your filters'
                    : activeTab === 'assigned' 
                      ? 'No teams with assigned mentors yet'
                      : 'All teams have mentors assigned!'
                  }
                </p>
              </div>
            ) : (
              <div className="teams-list-wrapper">
                {currentTeams.map(team => renderTeamCard(team))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MentorTeamTabs;