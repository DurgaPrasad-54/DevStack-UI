import { useState, useEffect } from 'react';
import axios from 'axios';


import { Star, X, Send, Loader2, CheckCircle, AlertCircle, User, Mail, Github, Linkedin, Users, Search, UserPlus, Clock, ArrowRight, Shield, Crown, UserCheck, Plus } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import config from '../../../config';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = `${config.backendUrl}/studenthackteam`;
const API_BASEs = `${config.backendUrl}/hackmentorfeedback`;

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Mentor Feedback Modal Component
const MentorFeedbackModal = ({ isOpen, onClose, mentor, team, hackathonId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && mentor && hackathonId) {
      fetchExistingFeedback();
      
    }
  }, [isOpen, mentor, hackathonId]);

  const fetchExistingFeedback = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASEs}/feedback/mentor/${mentor._id}?hackathonId=${hackathonId}`,
        authHeaders()
      );
      
      if (response.data) {
        setExistingFeedback(response.data);
        setRating(response.data.rating);
        setFeedback(response.data.feedback || '');
      }
    } catch (error) {
      console.error('Error fetching existing feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (!rating) {
      setMessage({ type: 'error', text: 'Please select a rating' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      const response = await axios.post(
        `${API_BASEs}/feedback/mentor`,
        {
          mentorId: mentor._id,
          hackathonId: hackathonId,
          rating: rating,
          feedback: feedback
        },
        authHeaders()
      );

      setMessage({
        type: 'success',
        text: response.data.message || 'Feedback submitted successfully!'
      });

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to submit feedback'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Star
              size={36}
              fill={star <= (hoverRating || rating) ? '#fbbf24' : 'none'}
              color={star <= (hoverRating || rating) ? '#fbbf24' : '#d1d5db'}
              style={{ transition: 'all 0.2s' }}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      '@media (max-width: 768px)': {
        padding: '16px'
      },
      '@media (max-width: 480px)': {
        padding: '12px'
      }
    }}>
      <div style={{
        background: 'white',
        marginTop:'90px',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        ...(typeof window !== 'undefined' && window.innerWidth <= 768 && {
          maxWidth: 'calc(100% - 32px)'
        }),
        ...(typeof window !== 'undefined' && window.innerWidth <= 480 && {
          maxWidth: 'calc(100% - 24px)'
        })
      }}>
        {/* Header */}
        <div style={{
          background: 'transparent',
          padding: '20px 24px',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          position: 'relative',
          borderBottom: '1px solid #e5e7eb'
          
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            <X size={20} color="#6b7280" />
          </button>
          <h2 style={{ color: '#111827', margin: 0, fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold' }}>
            Rate Your Mentor
          </h2>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: 'clamp(12px, 4vw, 14px)' }}>
            Team: {team?.name || 'N/A'}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Loader2 size={40} color="#4f46e5" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading...</p>
          </div>
        ) : (
          <>
            {/* Mentor Info */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={32} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                    {mentor?.name || 'N/A'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginBottom: '12px' }}>
                    <Mail size={16} />
                    <span style={{ fontSize: '14px' }}>{mentor?.email || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {mentor?.github && (
                      <a
                        href={mentor.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          color: '#374151',
                          fontSize: '13px'
                        }}
                      >
                        <Github size={16} />
                        GitHub
                      </a>
                    )}
                    {mentor?.linkedin && (
                      <a
                        href={mentor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#dbeafe',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          color: '#1e40af',
                          fontSize: '13px'
                        }}
                      >
                        <Linkedin size={16} />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {existingFeedback && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#d1fae5',
                  border: '1px solid #6ee7b7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={16} color="#059669" />
                  <span style={{ fontSize: '14px', color: '#065f46' }}>
                    You've already submitted feedback. You can update it below.
                  </span>
                </div>
              )}
            </div>

            {/* Feedback Form */}
            <form onSubmit={handleSubmitFeedback} style={{ padding: '24px' }}>
              {/* Star Rating */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  Overall Rating *
                </label>
                {renderStars()}
                {rating > 0 && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                    You rated: {rating} out of 5 stars
                  </p>
                )}
              </div>

              {/* Feedback Text */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Your Feedback *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience with this mentor..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p style={{ marginTop: '8px', fontSize: '13px', color: '#9ca3af' }}>
                  {feedback.length} characters
                </p>
              </div>

              {/* Message Display */}
              {message.text && (
                <div style={{
                  marginBottom: '24px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                  border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
                  color: message.type === 'success' ? '#065f46' : '#991b1b'
                }}>
                  {message.type === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span style={{ fontSize: '14px' }}>{message.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !rating || feedback.length<0}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  color: 'white',
                  border: 'none',
                  cursor: submitting || !rating ? 'not-allowed' : 'pointer',
                  background: submitting || !rating ? '#9ca3af' : '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!submitting && rating) {
                    e.currentTarget.style.background = '#4338ca';
                  }
                }}
                onMouseOut={(e) => {
                  if (!submitting && rating) {
                    e.currentTarget.style.background = '#4f46e5';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default function TeamManagementPage() {
  const selectedHackathonId = localStorage.getItem('selectedHackathonId');
  const studentBranch = localStorage.getItem('studentbranch') || '';
  const studentId = localStorage.getItem('student');

  const [myTeam, setMyTeam] = useState(null);
  const [myTeamLoading, setMyTeamLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [incomingInvitations, setIncomingInvitations] = useState([]);
  const [outgoingInvitations, setOutgoingInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [sentJoinRequests, setSentJoinRequests] = useState([]);
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  
  const [viewMode, setViewMode] = useState('available');

  // Mentor Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Load My Team
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/myteam`, authHeaders())
      .then(res => {
        console.log('✅ My Team Response:', res.data);
        localStorage.setItem('myTeamId', res.data ? res.data._id : '');
        console.log('🔑 Stored myTeamId:', localStorage.getItem('myTeamId'));
        setMyTeam(res.data);
      })
      .catch(() => setMyTeam(null))
      .finally(() => setMyTeamLoading(false));
  }, [studentId]);

  // Load all students based on view mode
  const loadAllStudents = () => {
    if (!selectedHackathonId) return;
    
    setShowSearchResults(true);
    setStudentsLoading(true);
    
    const params = {
      hackathonId: selectedHackathonId,
      branch: studentBranch,
      search: ''
    };
    
    if (viewMode === 'inTeams') {
      params.showTeamMembers = 'true';
    } else if (viewMode === 'available') {
      params.showTeamMembers = 'false';
    }
    
    axios.get(`${API_BASE}/students/search`, { ...authHeaders(), params })
    .then(res => {
      console.log('Fetched students:', res.data);
      setStudents(res.data);
    })
    .catch(err => {
      console.error('Error fetching students:', err);
      setStudents([]);
    })
    .finally(() => setStudentsLoading(false));
  };

  // Reload students when view mode changes
  useEffect(() => {
    if (showSearchResults) {
      loadAllStudents();
    }
  }, [viewMode]);

  // Filter students on client side
  // compute filtered students and include incoming join-request info
  const filteredStudents = students.filter(student => {
    const query = searchTerm.trim().toLowerCase();
    
    if (query === '') return true;
    
    const studentName = (student.name || '').toLowerCase();
    const studentRollNo = (student.rollNo || '').toLowerCase();
    
    return studentName.includes(query) || studentRollNo.includes(query);
  }).map(student => {
    // determine if this student has sent a pending join request to my team
    const incoming = joinRequests.find(r => r.sender && r.sender._id === student.studentId);
    return {
      ...student,
      hasIncomingJoinRequest: !!incoming,
      incomingRequestId: incoming ? incoming._id : null
    };
  });

  // Load incoming invitations
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/invitations/incoming`, authHeaders())
      .then(res => setIncomingInvitations(res.data))
      .catch(() => setIncomingInvitations([]));
  }, [studentId]);

  // Load outgoing invitations
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/invitations/outgoing`, authHeaders())
      .then(res => setOutgoingInvitations(res.data))
      .catch(() => setOutgoingInvitations([]));
  }, [studentId]);

  // Load join requests (received by me as team lead)
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/join-requests`, authHeaders())
      .then(res => setJoinRequests(res.data))
      .catch(() => setJoinRequests([]));
  }, [studentId]);

  // Load sent join requests (sent by me to teams)
  useEffect(() => {
    if (!studentId) return;
    axios.get(`${API_BASE}/join-requests/sent`, authHeaders())
      .then(res => setSentJoinRequests(res.data))
      .catch(() => setSentJoinRequests([]));
  }, [studentId]);

  const toggleStudentSelection = (student) => {
    const isSelected = selectedStudents.some(s => s.studentId === student.studentId);
    if (isSelected) {
      setSelectedStudents(selectedStudents.filter(s => s.studentId !== student.studentId));
      toast.info(`${student.name} removed from selection`);
    } else {
      setSelectedStudents([...selectedStudents, student]);
      toast.info(`✨ ${student.name} selected`);
    }
  };

  const createTeam = () => {
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    if (!selectedHackathonId) {
      toast.error('No hackathon selected');
      return;
    }

    setCreatingTeam(true);

    axios.post(
      `${API_BASE}/teams/create-with-invites`,
      {
        teamName: teamName.trim(),
        hackathonId: selectedHackathonId,
        studentIds: selectedStudents.map(s => s.studentId),
        mentorId: null
      },
      authHeaders()
    )
    .then(res => {
      toast.success(`✨ Team created! Invitations sent to ${selectedStudents.length} student(s)`);
      setTeamName('');
      setSelectedStudents([]);
      axios.get(`${API_BASE}/myteam`, authHeaders())
        .then(res => setMyTeam(res.data))
        .catch(() => setMyTeam(null));
      axios.get(`${API_BASE}/invitations/outgoing`, authHeaders())
        .then(res => setOutgoingInvitations(res.data))
        .catch(() => setOutgoingInvitations([]));
      loadAllStudents();
    })
    .catch(err => {
      toast.error(`Failed to create team: ${err.response?.data?.error || err.message}`);
    })
    .finally(() => setCreatingTeam(false));
  };

  const sendInvitesToTeam = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student to invite');
      return;
    }
    if (!myTeam) {
      toast.error('You need to be in a team to send invitations');
      return;
    }

    setSendingInvites(true);

    axios.post(
      `${API_BASE}/teams/${myTeam._id}/send-invites`,
      {
        studentIds: selectedStudents.map(s => s.studentId)
      },
      authHeaders()
    )
    .then(res => {
      toast.success(`📧 ${res.data.message}`);
      setSelectedStudents([]);
      axios.get(`${API_BASE}/invitations/outgoing`, authHeaders())
        .then(res => setOutgoingInvitations(res.data))
        .catch(() => setOutgoingInvitations([]));
      loadAllStudents();
    })
    .catch(err => {
      toast.error(`Failed to send invitations: ${err.response?.data?.error || err.message}`);
    })
    .finally(() => setSendingInvites(false));
  };

  const sendJoinRequest = (teamId, teamName) => {
    if (!teamId) {
      toast.error('Invalid team');
      return;
    }

    axios.post(
      `${API_BASE}/teams/${teamId}/join-requests`,
      {},
      authHeaders()
    )
    .then(() => {
      toast.success(`✅ Join request sent to "${teamName}"`);
      axios.get(`${API_BASE}/join-requests/sent`, authHeaders())
        .then(res => setSentJoinRequests(res.data))
        .catch(() => setSentJoinRequests([]));
      loadAllStudents();
    })
    .catch(err => {
      toast.error(`Failed to send join request: ${err.response?.data?.error || err.message}`);
    });
  };

  const respondToInvitation = (id, response) => {
    axios.post(
      `${API_BASE}/teams/invitations/${id}/respond`,
      { response },
      authHeaders()
    )
    .then(res => {
      setIncomingInvitations(incomingInvitations.filter(i => i._id !== id));
      if (response === 'accepted') {
        toast.success('🎉 Invitation accepted! You have joined the team');
        axios.get(`${API_BASE}/myteam`, authHeaders())
          .then(res => setMyTeam(res.data))
          .catch(() => setMyTeam(null));
      } else {
        toast.info('📬 Invitation declined');
      }
      loadAllStudents();
    })
    .catch(err => toast.error(`Failed to respond: ${err.response?.data?.error || err.message}`));
  };

  const respondToJoinRequest = (id, response) => {
    axios.post(
      `${API_BASE}/teams/join-requests/${id}/respond`,
      { response },
      authHeaders()
    )
    .then(res => {
      setJoinRequests(joinRequests.filter(r => r._id !== id));
      if (response === 'accepted') {
        toast.success('✅ Student added to your team!');
      } else {
        toast.info('📬 Join request declined');
      }
      if (response === 'accepted') {
        axios.get(`${API_BASE}/myteam`, authHeaders())
          .then(res => setMyTeam(res.data))
          .catch(() => setMyTeam(null));
      }
      loadAllStudents();
    })
    .catch(err => toast.error(`Failed to respond: ${err.response?.data?.error || err.message}`));
  };

  return (
    <div className="tm-wrapper">
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Hero Header */}
      <div className="tm-hero">
        <div className="tm-hero-content">
          <div className="tm-hero-icon">
            <Users size={32} color="white" />
          </div>
          <div>
            <h1 className="tm-hero-title">Team Management</h1>
            <p className="tm-hero-subtitle">Build your dream team and collaborate with peers</p>
          </div>
        </div>
      </div>

      {/* No Hackathon Warning */}
      {!selectedHackathonId && (
        <div className="tm-alert tm-alert-warning">
          <div className="tm-alert-icon">
            <AlertCircle size={22} />
          </div>
          <div>
            <strong style={{ fontSize: '15px' }}>No Hackathon Selected</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>Please select a hackathon to manage teams.</p>
          </div>
        </div>
      )}

      {/* My Team Section */}
      <section className="tm-card tm-card-team">
        <div className="tm-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="tm-icon-badge tm-icon-badge-indigo">
              <Shield size={20} />
            </div>
            <h2 className="tm-section-title">My Team</h2>
          </div>
          {myTeam && myTeam.mentor && (
            <button onClick={() => setShowFeedbackModal(true)} className="tm-btn tm-btn-gradient-purple">
              <Star size={16} />
              Rate Mentor
            </button>
          )}
        </div>

        {myTeamLoading ? (
          <div className="tm-loading">
            <Loader2 size={28} className="tm-spin" style={{ color: '#6366f1' }} />
            <p style={{ margin: '10px 0 0', color: '#6b7280' }}>Loading your team...</p>
          </div>
        ) : myTeam ? (
          <div className="tm-team-details">
            {/* Team Info Cards */}
            <div className="tm-team-info-grid">
              <div className="tm-team-info-item">
                <Users size={18} style={{ color: '#6366f1' }} />
                <div>
                  <span className="tm-info-label">Team Name</span>
                  <span className="tm-info-value">{myTeam.name}</span>
                </div>
              </div>
              <div className="tm-team-info-item">
                <Crown size={18} style={{ color: '#f59e0b' }} />
                <div>
                  <span className="tm-info-label">Team Lead</span>
                  <span className="tm-info-value">{myTeam.teamLead?.name || 'N/A'}</span>
                </div>
              </div>
              <div className="tm-team-info-item">
                <UserCheck size={18} style={{ color: '#10b981' }} />
                <div>
                  <span className="tm-info-label">Mentor</span>
                  <span className="tm-info-value">{myTeam.mentor?.name || 'Not assigned'}</span>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div style={{ marginTop: '20px' }}>
              <h3 className="tm-members-title">
                <User size={16} />
                Team Members ({myTeam.students?.length || 0})
              </h3>
              {myTeam.students && myTeam.students.length > 0 ? (
                <div className="tm-members-grid">
                  {myTeam.students.map((s, index) => (
                    <div key={s._id || index} className="tm-member-card">
                      <div className="tm-member-avatar">
                        {(s.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="tm-member-info">
                        <strong className="tm-member-name">{s.name || 'Name not available'}</strong>
                        <span className="tm-member-roll">{s.rollNo || 'N/A'}</span>
                        <span className="tm-member-detail">{s.college || 'College N/A'} &bull; {s.branch || 'Branch N/A'}</span>
                        <span className="tm-member-email">
                          <Mail size={12} /> {s.email || 'Email N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tm-empty-state-small">
                  <Users size={24} style={{ color: '#d1d5db' }} />
                  <p>No members found in the team</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="tm-empty-state">
            <div className="tm-empty-icon">
              <Users size={40} style={{ color: '#d1d5db' }} />
            </div>
            <p style={{ color: '#6b7280', fontSize: '15px', margin: '12px 0 0' }}>
              You are not in a team yet for this hackathon.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0' }}>
              Create a new team or request to join one below.
            </p>
          </div>
        )}
      </section>

      {/* Main Content Grid */}
      <div className="tm-main-grid">
        {/* Search & Select Students Section */}
        <section className="tm-card">
          <div className="tm-card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="tm-icon-badge tm-icon-badge-blue">
                <Search size={20} />
              </div>
              <h2 className="tm-section-title">{myTeam ? 'Find Students' : 'Search Students'}</h2>
            </div>
          </div>

          {/* View Mode Toggle - Only show when NOT in a team */}
          {!myTeam && (
            <div className="tm-toggle-group">
              <button
                onClick={() => { setViewMode('available'); setSelectedStudents([]); }}
                className={`tm-toggle-btn ${viewMode === 'available' ? 'tm-toggle-active-blue' : ''}`}
              >
                <UserPlus size={15} />
                Available Students
              </button>
              <button
                onClick={() => { setViewMode('inTeams'); setSelectedStudents([]); }}
                className={`tm-toggle-btn ${viewMode === 'inTeams' ? 'tm-toggle-active-green' : ''}`}
              >
                <Users size={15} />
                Students in Teams
              </button>
            </div>
          )}

          <p className="tm-hint-text">
            {myTeam 
              ? `Showing approved students from ${studentBranch || 'all branches'} (not in teams)`
              : viewMode === 'inTeams' 
                ? 'Showing students who are already in teams' 
                : `Showing available students from ${studentBranch || 'all branches'}`
            }
          </p>

          {/* Search Input */}
          <div className="tm-search-box">
            <Search size={18} className="tm-search-icon" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={loadAllStudents}
              className="tm-search-input"
            />
          </div>

          {showSearchResults && (
            <>
              {studentsLoading ? (
                <div className="tm-loading" style={{ padding: '30px 0' }}>
                  <Loader2 size={24} className="tm-spin" style={{ color: '#6366f1' }} />
                  <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>Loading students...</p>
                </div>
              ) : (
                <>
                  <div className="tm-results-count">
                    <span className="tm-count-badge">{filteredStudents.length}</span>
                    student(s) found {searchTerm && <span>matching "<strong>{searchTerm}</strong>"</span>}
                  </div>
                  {filteredStudents.length === 0 ? (
                    <div className="tm-empty-state-small">
                      <Search size={24} style={{ color: '#d1d5db' }} />
                      <p>No students found matching your criteria.</p>
                    </div>
                  ) : (
                    <div className="tm-student-list">
                      {filteredStudents.map(s => {
                        const isSelected = selectedStudents.some(sel => sel.studentId === s.studentId);
                        const showIncoming = myTeam && !s.inTeam && s.hasIncomingJoinRequest;
                        
                        return (
                          <div key={s._id} className={`tm-student-card ${isSelected ? 'tm-student-selected' : s.inTeam ? 'tm-student-in-team' : 'tm-student-available'}`}>
                            <div className="tm-student-card-inner">
                              <div className={`tm-student-avatar ${isSelected ? 'bg-blue' : s.inTeam ? 'bg-amber' : 'bg-emerald'}`}>
                                {(s.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="tm-student-info">
                                <div className="tm-student-name">{s.name}</div>
                                <div className="tm-student-roll">{s.rollNo}</div>
                                <div className="tm-student-meta">{s.college} &bull; {s.email}</div>
                                <div className="tm-student-badges">
                                  {s.inTeam ? (
                                    <>
                                      <span className="tm-badge tm-badge-amber">
                                        <Users size={11} /> {s.teamName}
                                      </span>
                                      {s.isTeamLead && (
                                        <span className="tm-badge tm-badge-red">
                                          <Crown size={11} /> Team Lead
                                        </span>
                                      )}
                                      {s.hasPendingJoinRequest && (
                                        <span className="tm-badge tm-badge-gray">
                                          <Clock size={11} /> Request Sent
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="tm-badge tm-badge-green">
                                        <CheckCircle size={11} /> Available {isSelected && '• Selected'}
                                      </span>
                                      {s.hasPendingInvitation && (
                                        <span className="tm-badge tm-badge-blue">
                                          <Send size={11} /> Invitation Sent
                                        </span>
                                      )}
                                      {showIncoming && (
                                        <span className="tm-badge tm-badge-blue">
                                          <Clock size={11} /> Requested to Join
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="tm-student-action">
                                {showIncoming ? (
                                  <div className="tm-action-buttons">
                                    <button
                                      onClick={() => respondToJoinRequest(s.incomingRequestId, 'accepted')}
                                      className="tm-btn tm-btn-sm tm-btn-green"
                                    >
                                      <CheckCircle size={13} /> Accept
                                    </button>
                                    <button
                                      onClick={() => respondToJoinRequest(s.incomingRequestId, 'rejected')}
                                      className="tm-btn tm-btn-sm tm-btn-red-outline"
                                    >
                                      <X size={13} /> Reject
                                    </button>
                                  </div>
                                ) : (
                                  (!myTeam && viewMode === 'inTeams') ? (
                                    <button 
                                      onClick={() => sendJoinRequest(s.teamId, s.teamName)}
                                      disabled={s.hasPendingJoinRequest}
                                      className={`tm-btn tm-btn-sm ${s.hasPendingJoinRequest ? 'tm-btn-disabled' : 'tm-btn-green'}`}
                                    >
                                      {s.hasPendingJoinRequest ? (
                                        <><Clock size={13} /> Sent</>
                                      ) : (
                                        <><ArrowRight size={13} /> Join</>
                                      )}
                                    </button>
                                  ) : (
                                    !s.inTeam && (
                                      <button 
                                        onClick={() => toggleStudentSelection(s)}
                                        disabled={s.hasPendingInvitation}
                                        className={`tm-btn tm-btn-sm ${s.hasPendingInvitation ? 'tm-btn-disabled' : isSelected ? 'tm-btn-red' : 'tm-btn-blue'}`}
                                        title={s.hasPendingInvitation ? 'Invitation already sent to this student' : ''}
                                      >
                                        {s.hasPendingInvitation ? (
                                          <><Send size={13} /> Invited</>
                                        ) : isSelected ? (
                                          <><X size={13} /> Remove</>
                                        ) : (
                                          <><Plus size={13} /> Select</>
                                        )}
                                      </button>
                                    )
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* Create Team OR Invite Section - Only show in 'available' mode */}
        {(myTeam || viewMode === 'available') && (
          <section className={`tm-card ${myTeam ? 'tm-card-invite' : 'tm-card-create'}`}>
            <div className="tm-card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`tm-icon-badge ${myTeam ? 'tm-icon-badge-green' : 'tm-icon-badge-purple'}`}>
                  {myTeam ? <Send size={20} /> : <Plus size={20} />}
                </div>
                <h2 className="tm-section-title">{myTeam ? 'Invite Friends' : 'Create New Team'}</h2>
              </div>
            </div>

            {myTeam && (
              <div className="tm-info-banner tm-info-banner-green">
                <CheckCircle size={16} />
                <span>You're in team <strong>{myTeam.name}</strong>. Select friends to invite!</span>
              </div>
            )}

            {!myTeam && (
              <div style={{ padding: '0 24px', marginTop: '16px' }}>
                <label className="tm-label">Team Name</label>
                <div className="tm-input-wrapper">
                  <Users size={16} className="tm-input-icon" />
                  <input
                    type="text"
                    placeholder="Enter your team name..."
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    className="tm-input"
                  />
                </div>
              </div>
            )}

            <div style={{ padding: '20px 24px 24px' }}>
              <div className="tm-selected-header">
                <h3 className="tm-selected-title">
                  <UserCheck size={16} />
                  Selected ({selectedStudents.length})
                </h3>
                <span className="tm-selected-hint">
                  {myTeam ? 'Invitations will be sent to join your team' : 'Invitations will be sent to these students'}
                </span>
              </div>

              {selectedStudents.length === 0 ? (
                <div className="tm-empty-state-small" style={{ padding: '30px 0' }}>
                  <UserPlus size={28} style={{ color: '#d1d5db' }} />
                  <p>No students selected yet</p>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>Select students from the left panel</span>
                </div>
              ) : (
                <div className="tm-selected-list">
                  {selectedStudents.map(s => (
                    <div key={s._id} className="tm-selected-item">
                      <div className={`tm-student-avatar-sm ${myTeam ? 'bg-emerald' : 'bg-blue'}`}>
                        {(s.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="tm-selected-item-info">
                        <strong>{s.name}</strong>
                        <small>{s.rollNo} &bull; {s.branch}</small>
                      </div>
                      <button onClick={() => toggleStudentSelection(s)} className="tm-btn-remove">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {myTeam ? (
                <button 
                  onClick={sendInvitesToTeam}
                  disabled={sendingInvites || selectedStudents.length === 0}
                  className={`tm-btn tm-btn-full ${selectedStudents.length === 0 ? 'tm-btn-disabled' : 'tm-btn-gradient-green'}`}
                >
                  {sendingInvites ? (
                    <><Loader2 size={18} className="tm-spin" /> Sending Invitations...</>
                  ) : (
                    <><Send size={18} /> Send Invitations</>
                  )}
                </button>
              ) : (
                <button 
                  onClick={createTeam}
                  disabled={creatingTeam || !teamName.trim() || selectedStudents.length === 0}
                  className={`tm-btn tm-btn-full ${(!teamName.trim() || selectedStudents.length === 0) ? 'tm-btn-disabled' : 'tm-btn-gradient-blue'}`}
                >
                  {creatingTeam ? (
                    <><Loader2 size={18} className="tm-spin" /> Creating Team...</>
                  ) : (
                    <><Plus size={18} /> Create Team & Send Invitations</>
                  )}
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Sent Join Requests */}
      {!myTeam && sentJoinRequests.length > 0 && (
        <section className="tm-card tm-card-section">
          <div className="tm-section-header-bar tm-bar-amber">
            <Clock size={20} />
            <h2 className="tm-section-title-sm">My Join Requests</h2>
            <span className="tm-count-pill tm-pill-amber">{sentJoinRequests.length}</span>
          </div>
          <div className="tm-notification-list">
            {sentJoinRequests.map(req => (
              <div key={req._id} className="tm-notification-item">
                <div className="tm-notification-icon tm-notif-amber">
                  <Clock size={16} />
                </div>
                <div className="tm-notification-content">
                  <p className="tm-notif-text">Request to join <strong>{req.teamId?.name || 'Unknown Team'}</strong></p>
                  <span className="tm-notif-status tm-status-pending">
                    <Clock size={12} /> {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Outgoing Invitations */}
      {outgoingInvitations.length > 0 && (
        <section className="tm-card tm-card-section">
          <div className="tm-section-header-bar tm-bar-amber">
            <Send size={20} />
            <h2 className="tm-section-title-sm">Sent Invitations</h2>
            <span className="tm-count-pill tm-pill-amber">{outgoingInvitations.length}</span>
          </div>
          <div className="tm-notification-list">
            {outgoingInvitations.map(inv => (
              <div key={inv._id} className="tm-notification-item">
                <div className="tm-notification-icon tm-notif-amber">
                  <Send size={16} />
                </div>
                <div className="tm-notification-content">
                  <p className="tm-notif-text">
                    <strong>{inv.recipient?.name || 'A student'}</strong>
                    <span className="tm-notif-detail"> &mdash; Invited to join <strong>{inv.teamId?.name}</strong></span>
                  </p>
                  <span className="tm-notif-status tm-status-pending">
                    <Clock size={12} /> {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Incoming Invitations */}
      {incomingInvitations.length > 0 && (
        <section className="tm-card tm-card-section">
          <div className="tm-section-header-bar tm-bar-blue">
            <Mail size={20} />
            <h2 className="tm-section-title-sm">Incoming Invitations</h2>
            <span className="tm-count-pill tm-pill-blue">{incomingInvitations.length}</span>
          </div>
          <div className="tm-notification-list">
            {incomingInvitations.map(inv => (
              <div key={inv._id} className="tm-notification-item tm-notif-highlight">
                <div className="tm-notification-icon tm-notif-blue">
                  <Mail size={16} />
                </div>
                <div className="tm-notification-content" style={{ flex: 1 }}>
                  <p className="tm-notif-text"><strong>{inv.teamId?.name || 'A team'}</strong> invited you to join their team</p>
                  <span className="tm-notif-detail">Invited by {inv.sender?.name || 'Team Lead'}</span>
                </div>
                <div className="tm-action-buttons">
                  <button onClick={() => respondToInvitation(inv._id, 'accepted')} className="tm-btn tm-btn-sm tm-btn-green">
                    <CheckCircle size={14} /> Accept
                  </button>
                  <button onClick={() => respondToInvitation(inv._id, 'rejected')} className="tm-btn tm-btn-sm tm-btn-red-outline">
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Join Requests to My Team */}
      {joinRequests.length > 0 && (
        <section className="tm-card tm-card-section">
          <div className="tm-section-header-bar tm-bar-green">
            <UserPlus size={20} />
            <h2 className="tm-section-title-sm">Join Requests to My Team</h2>
            <span className="tm-count-pill tm-pill-green">{joinRequests.length}</span>
          </div>
          <p style={{ padding: '0 24px', color: '#6b7280', fontSize: '13px', marginTop: '-4px' }}>Students requesting to join teams you lead</p>
          <div className="tm-notification-list">
            {joinRequests.map(r => (
              <div key={r._id} className="tm-notification-item tm-notif-highlight-green">
                <div className="tm-notification-icon tm-notif-green">
                  <UserPlus size={16} />
                </div>
                <div className="tm-notification-content" style={{ flex: 1 }}>
                  <p className="tm-notif-text"><strong>{r.sender?.name || 'A student'}</strong> wants to join <strong>{r.teamId?.name || 'your team'}</strong></p>
                </div>
                <div className="tm-action-buttons">
                  <button onClick={() => respondToJoinRequest(r._id, 'accepted')} className="tm-btn tm-btn-sm tm-btn-green">
                    <CheckCircle size={14} /> Accept
                  </button>
                  <button onClick={() => respondToJoinRequest(r._id, 'rejected')} className="tm-btn tm-btn-sm tm-btn-red-outline">
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mentor Feedback Modal */}
      <MentorFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        mentor={myTeam?.mentor}
        team={myTeam}
        hackathonId={selectedHackathonId}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .tm-spin { animation: spin 1s linear infinite; }

        .tm-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0px 24px 40px;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%);
          min-height: 100vh;
        }

        /* Hero */
        .tm-hero {
          margin-bottom: 28px;
          text-align: center;
        }
        .tm-hero-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }
        .tm-hero-icon {
          display: none;
        }
        .tm-hero-title {
          color: #111827;
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .tm-hero-subtitle {
          color: #6b7280;
          font-size: 15px;
          margin: 4px 0 0;
          font-weight: 400;
        }

        /* Alert */
        .tm-alert {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 14px;
          margin-bottom: 24px;
          animation: fadeInUp 0.5s ease-out 0.1s both;
        }
        .tm-alert-warning {
          background: linear-gradient(135deg, #fffbeb, #fef3c7);
          border: 1px solid #fcd34d;
          color: #92400e;
        }
        .tm-alert-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 158, 11, 0.15);
          flex-shrink: 0;
        }

        /* Cards */
        .tm-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 20px;
          box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
          margin-bottom: 24px;
          overflow: hidden;
          animation: fadeInUp 0.5s ease-out 0.15s both;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .tm-card:hover {
          box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .tm-card-team {
          border-top: 4px solid #6366f1;
        }
        .tm-card-invite {
          border-top: 4px solid #10b981;
        }
        .tm-card-create {
          border-top: 4px solid #8b5cf6;
        }

        .tm-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #f3f4f6;
        }
        .tm-section-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          letter-spacing: -0.3px;
        }

        /* Icon Badges */
        .tm-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tm-icon-badge-indigo { background: linear-gradient(135deg, #eef2ff, #e0e7ff); color: #6366f1; }
        .tm-icon-badge-blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #3b82f6; }
        .tm-icon-badge-green { background: linear-gradient(135deg, #ecfdf5, #d1fae5); color: #10b981; }
        .tm-icon-badge-purple { background: linear-gradient(135deg, #faf5ff, #ede9fe); color: #8b5cf6; }

        /* Buttons */
        .tm-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-size: 14px;
          font-family: inherit;
        }
        .tm-btn:hover { transform: translateY(-1px); }
        .tm-btn:active { transform: translateY(0); }
        .tm-btn-sm { padding: 7px 14px; font-size: 13px; border-radius: 8px; }
        .tm-btn-full { width: 100%; padding: 14px 24px; font-size: 15px; justify-content: center; border-radius: 12px; }
        .tm-btn-gradient-purple {
          padding: 10px 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.4);
        }
        .tm-btn-gradient-purple:hover { box-shadow: 0 6px 20px -2px rgba(99, 102, 241, 0.5); }
        .tm-btn-gradient-blue {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white;
          box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.4);
        }
        .tm-btn-gradient-blue:hover { box-shadow: 0 6px 20px -2px rgba(59, 130, 246, 0.5); }
        .tm-btn-gradient-green {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 12px -2px rgba(16, 185, 129, 0.4);
        }
        .tm-btn-gradient-green:hover { box-shadow: 0 6px 20px -2px rgba(16, 185, 129, 0.5); }
        .tm-btn-blue { background: #3b82f6; color: white; }
        .tm-btn-blue:hover { background: #2563eb; }
        .tm-btn-green { background: #10b981; color: white; }
        .tm-btn-green:hover { background: #059669; }
        .tm-btn-red { background: #ef4444; color: white; }
        .tm-btn-red:hover { background: #dc2626; }
        .tm-btn-red-outline { background: white; color: #ef4444; border: 1.5px solid #fca5a5; }
        .tm-btn-red-outline:hover { background: #fef2f2; border-color: #ef4444; }
        .tm-btn-disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; box-shadow: none; }
        .tm-btn-disabled:hover { transform: none; box-shadow: none; }

        /* Loading */
        .tm-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
        }

        /* Team Details */
        .tm-team-details { padding: 20px 24px; }
        .tm-team-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .tm-team-info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }
        .tm-info-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #9ca3af;
          font-weight: 600;
        }
        .tm-info-value {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin-top: 2px;
        }

        /* Members */
        .tm-members-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 14px;
        }
        .tm-members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }
        .tm-member-card {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          transition: all 0.25s ease;
        }
        .tm-member-card:hover {
          border-color: #c7d2fe;
          box-shadow: 0 4px 16px -4px rgba(99, 102, 241, 0.15);
          transform: translateY(-2px);
        }
        .tm-member-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }
        .tm-member-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .tm-member-name { font-size: 14px; font-weight: 600; color: #111827; }
        .tm-member-roll { font-size: 12px; color: #6366f1; font-weight: 500; }
        .tm-member-detail { font-size: 12px; color: #6b7280; }
        .tm-member-email { font-size: 12px; color: #3b82f6; display: flex; align-items: center; gap: 4px; }

        /* Empty States */
        .tm-empty-state {
          text-align: center;
          padding: 40px 24px;
        }
        .tm-empty-icon {
          width: 72px;
          height: 72px;
          background: #f9fafb;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .tm-empty-state-small {
          text-align: center;
          padding: 20px;
          color: #9ca3af;
          font-size: 14px;
        }
        .tm-empty-state-small p { margin: 8px 0 0; }

        /* Main Grid */
        .tm-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 900px) {
          .tm-main-grid { grid-template-columns: 1fr; }
          .tm-team-info-grid { grid-template-columns: 1fr; }
        }

        /* Toggle Group */
        .tm-toggle-group {
          display: flex;
          gap: 6px;
          padding: 4px;
          margin: 16px 24px 0;
          background: #f3f4f6;
          border-radius: 12px;
        }
        .tm-toggle-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s ease;
          background: transparent;
          color: #6b7280;
        }
        .tm-toggle-btn:hover { color: #374151; background: rgba(255,255,255,0.5); }
        .tm-toggle-active-blue {
          background: white !important;
          color: #3b82f6 !important;
          box-shadow: 0 2px 8px -2px rgba(59, 130, 246, 0.25);
          font-weight: 600 !important;
        }
        .tm-toggle-active-green {
          background: white !important;
          color: #10b981 !important;
          box-shadow: 0 2px 8px -2px rgba(16, 185, 129, 0.25);
          font-weight: 600 !important;
        }

        /* Search */
        .tm-hint-text {
          color: #6b7280;
          font-size: 13px;
          padding: 12px 24px 0;
          margin: 0;
        }
        .tm-search-box {
          position: relative;
          margin: 12px 24px 16px;
        }
        .tm-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }
        .tm-search-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.25s ease;
          background: #f9fafb;
          box-sizing: border-box;
          outline: none;
        }
        .tm-search-input:focus {
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .tm-search-input::placeholder { color: #9ca3af; }

        /* Results Count */
        .tm-results-count {
          padding: 0 24px;
          margin-bottom: 12px;
          color: #6b7280;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tm-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        /* Student List */
        .tm-student-list {
          max-height: 500px;
          overflow-y: auto;
          padding: 0 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tm-student-list::-webkit-scrollbar { width: 6px; }
        .tm-student-list::-webkit-scrollbar-track { background: transparent; }
        .tm-student-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .tm-student-list::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

        .tm-student-card {
          border-radius: 14px;
          border: 1.5px solid #e5e7eb;
          transition: all 0.25s ease;
          overflow: hidden;
        }
        .tm-student-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.1);
        }
        .tm-student-selected {
          border-color: #93c5fd;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .tm-student-in-team {
          border-color: #fcd34d;
          background: linear-gradient(135deg, #fffbeb, #fef3c7);
        }
        .tm-student-available {
          border-color: #86efac;
          background: white;
        }
        .tm-student-card-inner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
        }
        .tm-student-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          color: white;
          flex-shrink: 0;
        }
        .tm-student-avatar.bg-blue { background: linear-gradient(135deg, #3b82f6, #6366f1); }
        .tm-student-avatar.bg-amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .tm-student-avatar.bg-emerald { background: linear-gradient(135deg, #10b981, #059669); }
        .tm-student-avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: white;
          flex-shrink: 0;
        }
        .tm-student-avatar-sm.bg-blue { background: linear-gradient(135deg, #3b82f6, #6366f1); }
        .tm-student-avatar-sm.bg-emerald { background: linear-gradient(135deg, #10b981, #059669); }

        .tm-student-info { flex: 1; min-width: 0; }
        .tm-student-name { font-size: 14px; font-weight: 600; color: #111827; }
        .tm-student-roll { font-size: 12px; color: #6b7280; margin-left: 6px; }
        .tm-student-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .tm-student-badges { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
        .tm-student-action { flex-shrink: 0; }

        /* Badges */
        .tm-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }
        .tm-badge-green { background: #d1fae5; color: #065f46; }
        .tm-badge-amber { background: #fef3c7; color: #92400e; }
        .tm-badge-red { background: #fee2e2; color: #991b1b; }
        .tm-badge-blue { background: #dbeafe; color: #1e40af; }
        .tm-badge-gray { background: #f3f4f6; color: #4b5563; }

        /* Input */
        .tm-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tm-input-wrapper {
          position: relative;
        }
        .tm-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }
        .tm-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.25s ease;
          background: #f9fafb;
          box-sizing: border-box;
          outline: none;
        }
        .tm-input:focus {
          border-color: #8b5cf6;
          background: white;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        /* Info Banner */
        .tm-info-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          margin: 16px 24px 0;
          border-radius: 10px;
          font-size: 14px;
        }
        .tm-info-banner-green {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        /* Selected Students */
        .tm-selected-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tm-selected-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }
        .tm-selected-hint { font-size: 12px; color: #9ca3af; }
        .tm-selected-list {
          max-height: 280px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .tm-selected-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .tm-selected-item:hover { border-color: #c7d2fe; }
        .tm-selected-item-info {
          flex: 1;
          min-width: 0;
        }
        .tm-selected-item-info strong { font-size: 13px; color: #111827; display: block; }
        .tm-selected-item-info small { font-size: 12px; color: #6b7280; }
        .tm-btn-remove {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1.5px solid #fca5a5;
          background: #fef2f2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .tm-btn-remove:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        /* Notification Sections */
        .tm-card-section {
          animation: fadeInUp 0.5s ease-out 0.2s both;
        }
        .tm-section-header-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 24px 12px;
        }
        .tm-bar-amber { color: #b45309; }
        .tm-bar-blue { color: #1d4ed8; }
        .tm-bar-green { color: #047857; }
        .tm-section-title-sm {
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          flex: 1;
        }
        .tm-count-pill {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }
        .tm-pill-amber { background: #fef3c7; color: #92400e; }
        .tm-pill-blue { background: #dbeafe; color: #1e40af; }
        .tm-pill-green { background: #d1fae5; color: #065f46; }

        .tm-notification-list {
          padding: 0 24px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tm-notification-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.25s ease;
        }
        .tm-notification-item:hover {
          border-color: #c7d2fe;
          box-shadow: 0 2px 12px -4px rgba(0, 0, 0, 0.08);
        }
        .tm-notif-highlight { border-left: 4px solid #3b82f6; }
        .tm-notif-highlight-green { border-left: 4px solid #10b981; }
        .tm-notification-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tm-notif-amber { background: #fef3c7; color: #b45309; }
        .tm-notif-blue { background: #dbeafe; color: #1d4ed8; }
        .tm-notif-green { background: #d1fae5; color: #047857; }
        .tm-notification-content { min-width: 0; }
        .tm-notif-text { margin: 0; font-size: 14px; color: #111827; }
        .tm-notif-detail { font-size: 12px; color: #6b7280; }
        .tm-notif-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 4px;
        }
        .tm-status-pending { color: #b45309; }

        .tm-action-buttons {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}