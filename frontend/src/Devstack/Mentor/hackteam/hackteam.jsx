import { useState, useEffect } from 'react';

import { Search, Users, Trophy, Github, ExternalLink, AlertCircle, Linkedin, Mail } from 'lucide-react';
import config from '../../../config';
import { useHackathon } from '../../Student/context/HackathonContext';
import './hackteam.css';

const MentorHackathonTeams = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auth state - Get from localStorage or your auth context
  const [authState] = useState(() => ({
    token: localStorage.getItem('token') || null,
    userId:localStorage.getItem('mentor') || null,
    selectedHackathonId: localStorage.getItem('selectedHackathonId') || null
  }));

  const [mentorRequestsMap, setMentorRequestsMap] = useState({});

  const API_BASE = config.backendUrl;

  const apiCall = async (url, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    } catch (err) {
      console.error('API call failed:', err);
      throw err;
    }
  };

  // Helper to decode user id from token
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (err) {
      console.error('Failed to decode token', err);
      return null;
    }
  };

  // Fetch mentor requests and store mapping { hackathonId: status }
  const fetchMentorRequestsStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const mentorId = getUserIdFromToken();
      if (!mentorId || !token) return;

      const res = await fetch(`${API_BASE}/hackathonrequests/mentor/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        console.warn('No mentor requests or fetch failed', res.status);
        setMentorRequestsMap({});
        return;
      }

      const data = await res.json();
      const mapping = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.hackathon && item.mentorRequest) {
            const hid = item.hackathon._id || (typeof item.hackathon === 'string' ? item.hackathon : null);
            if (hid) mapping[hid] = item.mentorRequest.status;
          }
        });
      }
      setMentorRequestsMap(mapping);
    } catch (err) {
      console.error('Error fetching mentor requests:', err);
      setMentorRequestsMap({});
    }
  };

  // Fetch all hackathons
  const fetchHackathons = async () => {
    try {
      const data = await apiCall('/hackathon/all');
      // Show all hackathons, sorted: ongoing first, then upcoming, then completed
      const sortedHackathons = data.sort((a, b) => {
        const order = { 'ongoing': 0, 'upcoming': 1, 'completed': 2 };
        return (order[a.status] || 3) - (order[b.status] || 3);
      });
      setHackathons(sortedHackathons);
      
      // Auto-select hackathon from localStorage if available
      if (authState.selectedHackathonId && sortedHackathons.length > 0) {
        const savedHackathon = sortedHackathons.find(h => h._id === authState.selectedHackathonId);
        if (savedHackathon) {
          setSelectedHackathon(savedHackathon);
        } else if (sortedHackathons.length > 0) {
          setSelectedHackathon(sortedHackathons[0]);
        }
      } else if (sortedHackathons.length > 0 && !selectedHackathon) {
        setSelectedHackathon(sortedHackathons[0]);
      }
    } catch (err) {
      setError('Failed to fetch hackathons: ' + err.message);
      console.error('Fetch hackathons error:', err);
    }
  };

  // Fetch mentor's assigned teams only
  const fetchMyTeams = async () => {
    if (!selectedHackathon || !authState.userId) return;
    
    try {
      // Fetch all teams for the hackathon and filter for mentor's teams
      const allTeamsData = await apiCall(`/hackteams/teams?hackathonId=${selectedHackathon._id}`);
      const mentorTeams = allTeamsData.filter(team => 
        team.mentor && team.mentor._id === authState.userId
      );
      setMyTeams(mentorTeams);
    } catch (err) {
      setError('Failed to fetch your teams: ' + err.message);
      console.error('Fetch my teams error:', err);
    }
  };

  const { setSelectedHackathon: setContextSelectedHackathon } = useHackathon();

  // Save selected hackathon to context when it changes (fallback to localStorage if context not available)
  useEffect(() => {
    if (selectedHackathon && setContextSelectedHackathon) {
      setContextSelectedHackathon(selectedHackathon._id);
    } else if (selectedHackathon && window.localStorage) {
      window.localStorage.setItem('selectedHackathonId', selectedHackathon._id);
    }
  }, [selectedHackathon, setContextSelectedHackathon]);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      if (!authState.token || !authState.userId) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await fetchHackathons();
        await fetchMentorRequestsStatus();
      } catch (err) {
        setError('Failed to initialize data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Fetch teams when hackathon changes
  useEffect(() => {
    if (selectedHackathon) {
      fetchMyTeams();
    }
  }, [selectedHackathon]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    if (!selectedHackathon) return;

    const interval = setInterval(() => {
      fetchMyTeams();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedHackathon]);

  // Auto-select first approved hackathon when hackathons or mentor request map changes
  useEffect(() => {
    const approved = hackathons.filter(h => mentorRequestsMap[h._id] === 'approved');
    if (approved.length > 0) {
      if (!selectedHackathon || !approved.some(h => h._id === selectedHackathon._id)) {
        setSelectedHackathon(approved[0]);
      }
    } else {
      if (selectedHackathon && mentorRequestsMap[selectedHackathon._id] !== 'approved') {
        setSelectedHackathon(null);
        setMyTeams([]);
      }
    }
  }, [hackathons, mentorRequestsMap]);

  // Periodically refresh mentor request statuses
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMentorRequestsStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredMyTeams = myTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.students.some(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const approvedHackathons = hackathons.filter(h => mentorRequestsMap[h._id] === 'approved');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (!authState.token || !authState.userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view your mentored teams.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hack-assign-mentortms-container">
      <div className="max-w-7xl mx-auto">
        <div className="hack-assign-mentortms-header">
          <h1>My Mentored Teams</h1>
          <p>View and track the teams you're mentoring</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button 
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900 ml-2 text-xl"
            >
              ×
            </button>
          </div>
        )}

        {/* Hackathon Selector */}
        <div className="hack-assign-mentortms-upcoming-section">
          <div className="hack-assign-mentortms-section-header">
            <h2>Select Hackathon</h2>
          </div>

          {/* Dropdown selector */}
          {approvedHackathons.length > 0 ? (
            <div className="hack-assign-mentortms-dropdown-row" style={{ margin: '12px 0' }}>
              <select
                value={selectedHackathon?._id || ''}
                onChange={(e) => {
                  const found = approvedHackathons.find(h => h._id === e.target.value);
                  setSelectedHackathon(found);
                }}
                className="hack-assign-mentortms-dropdown"
              >
                <option value="">Select a hackathon</option>
                {approvedHackathons.map(h => (
                  <option key={h._id} value={h._id}>{`${h.hackathonname} — ${h.status.charAt(0).toUpperCase() + h.status.slice(1)}`}</option>
                ))}
              </select>

              {selectedHackathon && approvedHackathons.some(h => h._id === selectedHackathon._id) && (
                <span className={`hack-assign-mentortms-status-badge ${
                  selectedHackathon.status === 'ongoing' ? 'hack-assign-mentortms-status-ongoing' :
                  selectedHackathon.status === 'upcoming' ? 'hack-assign-mentortms-status-upcoming' :
                  'hack-assign-mentortms-status-completed'
                }`}>
                  {/* {selectedHackathon.status.charAt(0).toUpperCase() + selectedHackathon.status.slice(1)} */}
                </span>
              )}
            </div>
          ) : hackathons.length === 0 ? (
            <div className="hack-assign-mentortms-no-data">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No active hackathons available</p>
            </div>
          ) : (
            <div className="hack-assign-mentortms-no-data">
              <p>No approved mentor assignments</p>
            </div>
          )}
        </div>

        {/* Teams Section */}
        {selectedHackathon && (
          <div className="hack-assign-mentortms-upcoming-section">
            <div className="hack-assign-mentortms-section-header">
              <h2>Your Teams</h2>
              <span className={`hack-assign-mentortms-status-badge ${myTeams.length ? 'hack-assign-mentortms-status-ongoing' : ''}`}>{myTeams.length} {myTeams.length === 1 ? 'Team' : 'Teams'}</span>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="hack-assign-mentortms-search">
                <Search className="hack-assign-mentortms-search-icon" />
                <input
                  type="text"
                  placeholder="Search teams, students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="hack-assign-mentortms-search-input"
                />
              </div>
            </div>

            {/* Teams List */}
            <div className="space-y-4">
              {filteredMyTeams.length === 0 ? (
                <div className="no-data">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium mb-1">
                    {searchTerm ? 'No teams match your search' : 'No teams assigned yet'}
                  </p>
                  <p className="text-sm">
                    {searchTerm ? 'Try a different search term' : 'Teams will appear here once assigned to you'}
                  </p>
                </div> 
              ) : (
                <div className="grid gap-4">
                  {filteredMyTeams.map(team => (
                    <div key={team._id} className="hack-assign-mentortms-team-card">
                      {/* Team Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{team.name}</h3>
                          <p className="text-sm text-gray-500">
                            Registered: {new Date(team.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Mentoring
                        </span>
                      </div>

                      {/* Team Lead */}
                      {team.teamLead && (
                        <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Team Lead</span>
                              <div className="mt-1">
                                <p className="font-semibold text-gray-900">{team.teamLead.name}</p>
                                <p className="text-sm text-gray-600">{team.teamLead.rollNo}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {team.teamLead.email && (
                                <a 
                                  href={`mailto:${team.teamLead.email}`}
                                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                  title={`Email ${team.teamLead.email}`}
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              )}
                              {team.teamLead.github && (
                                <a 
                                  href={team.teamLead.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                  title="GitHub Profile"
                                >
                                  <Github className="h-4 w-4" />
                                </a>
                              )}
                              {team.teamLead.linkedin && (
                                <a 
                                  href={team.teamLead.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                  title="LinkedIn Profile"
                                >
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Team Members */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Team Members ({team.students.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {team.students.map(student => (
                            <div key={student._id} className="hack-assign-mentortms-member-row">
                              <div className="hack-assign-mentortms-member-info">
                                <p className="hack-assign-mentortms-member-name">{student.name}</p>
                                <p className="hack-assign-mentortms-member-roll">{student.rollNo}</p>
                                {student.branch && (
                                  <p className="hack-assign-mentortms-member-branch">{student.branch}</p>
                                )}
                              </div>

                              <div className="hack-assign-mentortms-member-actions">
                                {student.email && (
                                  <a 
                                    href={`mailto:${student.email}`}
                                    className="hack-assign-mentortms-action-link"
                                    title={`Email ${student.email}`}
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {student.github && (
                                  <a 
                                    href={student.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hack-assign-mentortms-action-link"
                                    title="GitHub Profile"
                                  >
                                    <Github className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {student.linkedin && (
                                  <a 
                                    href={student.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hack-assign-mentortms-action-link"
                                    title="LinkedIn Profile"
                                  >
                                    <Linkedin className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Project Submission */}
                      {team.projectSubmission && (
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-blue-900 flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Project Submitted
                            </span>
                            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                              {new Date(team.projectSubmission.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{team.projectSubmission.title}</h4>
                          <p className="text-sm text-gray-700 mb-3">{team.projectSubmission.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {team.projectSubmission.githubLink && (
                              <a
                                href={team.projectSubmission.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                              >
                                <Github className="h-4 w-4" />
                                View Code
                              </a>
                            )}
                            {team.projectSubmission.demoLink && (
                              <a
                                href={team.projectSubmission.demoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Live Demo
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorHackathonTeams;