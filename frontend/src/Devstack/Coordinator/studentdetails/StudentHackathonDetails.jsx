import { useState, useEffect } from 'react';

import {
  User, Search, ChevronDown, Calendar, Users, FileText,
  Award, Star, GitBranch, Mail, Phone, ExternalLink,
  CheckCircle, Clock, XCircle, AlertCircle,
  Briefcase, Code, MessageSquare, Trophy } from
'lucide-react';
import config from '../../../config';
import './StudentHackathonDetails.css';

const API_BASE = `${config.backendUrl}/hackathon-history`;

export default function StudentHackathonDetails() {
  // Selection states
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedHackathon, setSelectedHackathon] = useState('');
  
  // Data states
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Dropdown states
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isStudentOpen, setIsStudentOpen] = useState(false);
  const [isHackathonOpen, setIsHackathonOpen] = useState(false);

  // Get coordinator details from localStorage
  const coordinatorCollege = localStorage.getItem('coordinatordetails');
  const coordinatorYear = localStorage.getItem('coordinatoryear');

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch students when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchStudentsByBranch();
    } else {
      setStudents([]);
      setFilteredStudents([]);
    }
    setSelectedStudent(null);
    setSelectedHackathon('');
    setDetails(null);
  }, [selectedBranch]);

  // Filter students based on search
  useEffect(() => {
    if (studentSearch) {
      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [studentSearch, students]);

  // Fetch details when student and hackathon are selected
  useEffect(() => {
    if (selectedStudent && selectedHackathon) {
      fetchStudentHackathonDetails();
    } else {
      setDetails(null);
    }
  }, [selectedStudent, selectedHackathon]);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (coordinatorCollege) params.append('college', coordinatorCollege);
      if (coordinatorYear) params.append('year', coordinatorYear);

      const response = await fetch(`${API_BASE}/coordinator/branches?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchStudentsByBranch = async () => {
    setStudentsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('branch', selectedBranch);
      if (coordinatorCollege) params.append('college', coordinatorCollege);
      if (coordinatorYear) params.append('year', coordinatorYear);

      const response = await fetch(`${API_BASE}/coordinator/students-by-branch?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
        setFilteredStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchStudentHackathonDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE}/coordinator/student/${selectedStudent._id}/hackathon/${selectedHackathon}/full-details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="status-icon approved" />;
      case 'pending': return <Clock className="status-icon pending" />;
      case 'rejected': return <XCircle className="status-icon rejected" />;
      default: return <AlertCircle className="status-icon" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'approved': 'badge-green',
      'pending': 'badge-yellow',
      'rejected': 'badge-red',
      'ongoing': 'badge-blue',
      'completed': 'badge-purple',
      'upcoming': 'badge-gray'
    };
    return (
      <span className={`status-badge ${statusClasses[status] || 'badge-gray'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`star ${star <= rating ? 'filled' : ''}`}
            size={18}
          />
        ))}
        <span className="rating-text">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="student-hackathon-details-container">
      <div className="page-header">
        <h1><User size={28} /> Student Hackathon Details</h1>
        <p>View comprehensive hackathon participation details for individual students</p>
      </div>

      {/* Selection Filters */}
      <div className="selection-panel">
        <div className="filter-row">
          {/* Branch Selector */}
          <div className="filter-group">
            <label>Select Branch</label>
            <div className="custom-select" onClick={() => setIsBranchOpen(!isBranchOpen)}>
              <div className="select-display">
                {selectedBranch || 'Choose branch...'}
                <ChevronDown className={`chevron ${isBranchOpen ? 'open' : ''}`} />
              </div>
              {isBranchOpen && (
                <div className="select-dropdown">
                  {branches.map((branch) => (
                    <div 
                      key={branch} 
                      className={`select-option ${selectedBranch === branch ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBranch(branch);
                        setIsBranchOpen(false);
                      }}
                    >
                      {branch}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Student Selector */}
          <div className="filter-group">
            <label>Select Student</label>
            <div className="custom-select" onClick={() => selectedBranch && setIsStudentOpen(!isStudentOpen)}>
              <div className={`select-display ${!selectedBranch ? 'disabled' : ''}`}>
                {selectedStudent ? selectedStudent.name : 'Choose student...'}
                <ChevronDown className={`chevron ${isStudentOpen ? 'open' : ''}`} />
              </div>
              {isStudentOpen && (
                <div className="select-dropdown student-dropdown">
                  <div className="search-input-wrapper">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search by name, roll no, email..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="options-list">
                    {studentsLoading ? (
                      <div className="loading-text">Loading students...</div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="no-results">No students found</div>
                    ) : (
                      filteredStudents.map((student) => (
                        <div 
                          key={student._id} 
                          className={`select-option student-option ${selectedStudent?._id === student._id ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                            setSelectedHackathon('');
                            setIsStudentOpen(false);
                            setStudentSearch('');
                          }}
                        >
                          <div className="student-info">
                            <span className="student-name">{student.name}</span>
                            <span className="student-roll">{student.rollNo}</span>
                          </div>
                          <span className="hackathon-count">{student.hackathonCount} hackathons</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hackathon Selector */}
          <div className="filter-group">
            <label>Select Hackathon</label>
            <div className="custom-select" onClick={() => selectedStudent && setIsHackathonOpen(!isHackathonOpen)}>
              <div className={`select-display ${!selectedStudent ? 'disabled' : ''}`}>
                {selectedHackathon 
                  ? selectedStudent?.hackathons.find(h => h._id === selectedHackathon)?.name 
                  : 'Choose hackathon...'}
                <ChevronDown className={`chevron ${isHackathonOpen ? 'open' : ''}`} />
              </div>
              {isHackathonOpen && selectedStudent && (
                <div className="select-dropdown">
                  {selectedStudent.hackathons.map((hackathon) => (
                    <div 
                      key={hackathon._id} 
                      className={`select-option hackathon-option ${selectedHackathon === hackathon._id ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHackathon(hackathon._id);
                        setIsHackathonOpen(false);
                      }}
                    >
                      <span>{hackathon.name}</span>
                      {getStatusBadge(hackathon.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading student details...</p>
        </div>
      )}

      {/* Details Display */}
      {details && !loading && (
        <div className="details-container">
          {/* Student & Hackathon Overview */}
          <div className="overview-section">
            <div className="overview-card student-card">
              <div className="card-header">
                <User size={20} />
                <h3>Student Information</h3>
              </div>
              <div className="card-content">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{details.student.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Roll No:</span>
                  <span className="value">{details.student.rollNo}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">
                    <Mail size={14} /> {details.student.email}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Branch:</span>
                  <span className="value">{details.student.branch}</span>
                </div>
                <div className="info-row">
                  <span className="label">College:</span>
                  <span className="value">{details.student.college}</span>
                </div>
                {details.student.phone && (
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">
                      <Phone size={14} /> {details.student.phone}
                    </span>
                  </div>
                )}
                {details.student.github && (
                  <div className="info-row">
                    <span className="label">GitHub:</span>
                    <a href={details.student.github} target="_blank" rel="noopener noreferrer" className="link-value">
                      <ExternalLink size={14} /> View Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="overview-card hackathon-card">
              <div className="card-header">
                <Calendar size={20} />
                <h3>Hackathon Information</h3>
              </div>
              <div className="card-content">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{details.hackathon.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Status:</span>
                  {getStatusBadge(details.hackathon.status)}
                </div>
                <div className="info-row">
                  <span className="label">Duration:</span>
                  <span className="value">
                    {new Date(details.hackathon.startDate).toLocaleDateString()} - {new Date(details.hackathon.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Entry Fee:</span>
                  <span className="value">₹{details.hackathon.entryFee || 0}</span>
                </div>
                <div className="info-row">
                  <span className="label">Total Registrations:</span>
                  <span className="value highlight">{details.hackathon.totalRegistrations} students</span>
                </div>
              </div>
            </div>

            <div className="overview-card registration-card">
              <div className="card-header">
                <CheckCircle size={20} />
                <h3>Registration Status</h3>
              </div>
              <div className="card-content">
                <div className="status-display">
                  {getStatusIcon(details.registration.status)}
                  {getStatusBadge(details.registration.status)}
                </div>
                <div className="info-row">
                  <span className="label">Registered At:</span>
                  <span className="value">
                    {details.registration.registeredAt 
                      ? new Date(details.registration.registeredAt).toLocaleString() 
                      : 'N/A'}
                  </span>
                </div>
                {details.registration.verifiedAt && (
                  <div className="info-row">
                    <span className="label">Verified At:</span>
                    <span className="value">
                      {new Date(details.registration.verifiedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {details.registration.transactionId && (
                  <div className="info-row">
                    <span className="label">Transaction ID:</span>
                    <span className="value code">{details.registration.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Details */}
          {details.team && (
            <div className="section-card">
              <div className="section-header">
                <Users size={22} />
                <h3>Team Details</h3>
                <span className="team-name">{details.team.name}</span>
              </div>
              <div className="section-content">
                <div className="team-members-grid">
                  {details.team.members.map((member) => (
                    <div key={member._id} className={`member-card ${member.isTeamLead ? 'team-lead' : ''}`}>
                      {member.isTeamLead && <span className="lead-badge">Team Lead</span>}
                      <div className="member-name">{member.name}</div>
                      <div className="member-detail">{member.rollNo}</div>
                      <div className="member-detail">{member.email}</div>
                      <div className="member-detail">{member.branch}</div>
                      <div className="member-links">
                        {member.github && (
                          <a href={member.github} target="_blank" rel="noopener noreferrer">
                            <GitBranch size={14} /> GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {details.team.mentor && (
                  <div className="mentor-info">
                    <h4><Briefcase size={16} /> Assigned Mentor</h4>
                    <div className="mentor-details">
                      <span className="mentor-name">{details.team.mentor.name}</span>
                      <span className="mentor-email"><Mail size={14} /> {details.team.mentor.email}</span>
                      {details.team.mentor.phone && (
                        <span className="mentor-phone"><Phone size={14} /> {details.team.mentor.phone}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Problem Statement */}
          {details.problemStatement && (
            <div className="section-card">
              <div className="section-header">
                <FileText size={22} />
                <h3>Problem Statement</h3>
              </div>
              <div className="section-content">
                <div className="problem-statement">
                  <h4>{details.problemStatement.title}</h4>
                  <p className="description">{details.problemStatement.description}</p>
                  {details.problemStatement.difficulty && (
                    <span className={`difficulty-badge ${details.problemStatement.difficulty}`}>
                      {details.problemStatement.difficulty}
                    </span>
                  )}
                  {details.problemStatement.technologies && details.problemStatement.technologies.length > 0 && (
                    <div className="tech-tags">
                      {details.problemStatement.technologies.map((tech, idx) => (
                        <span key={idx} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submission Details */}
          {details.submission && (
            <div className="section-card">
              <div className="section-header">
                <Code size={22} />
                <h3>Submission Details</h3>
                {details.submission.score !== undefined && details.submission.score !== null && (
                  <span className="score-badge">Score: {details.submission.score}/100</span>
                )}
              </div>
              <div className="section-content">
                <div className="submission-info">
                  <div className="info-row full-width">
                    <span className="label">Description:</span>
                    <p className="description">{details.submission.projectDescription}</p>
                  </div>
                  {details.submission.githubRepo && (
                    <div className="info-row">
                      <span className="label">GitHub Repo:</span>
                      <a href={details.submission.githubRepo} target="_blank" rel="noopener noreferrer" className="link-value">
                        <GitBranch size={14} /> View Repository
                      </a>
                    </div>
                  )}
                  {details.submission.liveDemoLink && (
                    <div className="info-row">
                      <span className="label">Live Demo:</span>
                      <a href={details.submission.liveDemoLink} target="_blank" rel="noopener noreferrer" className="link-value">
                        <ExternalLink size={14} /> View Demo
                      </a>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="label">Submitted At:</span>
                    <span className="value">
                      {new Date(details.submission.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Team Contributions Section */}
                  {details.submission.teamContributions && details.submission.teamContributions.length > 0 && (
                    <div className="team-contributions-section">
                      <h4><Users size={18} /> Team Contributions</h4>
                      <div className="contributions-grid">
                        {details.submission.teamContributions.map((contrib, idx) => (
                          <div key={idx} className={`contribution-card ${contrib.isTeamLead ? 'team-lead' : ''}`}>
                            {contrib.isTeamLead && <span className="lead-badge">Team Lead</span>}
                            <div className="contributor-info">
                              <div className="contributor-name">{contrib.student.name}</div>
                              <div className="contributor-details">
                                <span>{contrib.student.rollNo}</span>
                                <span>{contrib.student.branch}</span>
                              </div>
                            </div>
                            <div className="contribution-text">
                              <span className="contribution-label">Contribution:</span>
                              <p>{contrib.contribution}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {details.submission.documents && details.submission.documents.length > 0 && (
                    <div className="documents-section">
                      <h4>Submitted Documents</h4>
                      <div className="documents-list">
                        {details.submission.documents.map((doc, idx) => (
                          <div key={idx} className="document-item">
                            <FileText size={16} />
                            <span>{doc.filename}</span>
                            <span className="doc-type">{doc.fileType}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mentor Feedback */}
          {details.mentorFeedback && (
            <div className="section-card">
              <div className="section-header">
                <MessageSquare size={22} />
                <h3>Mentor Feedback (Given by Student)</h3>
              </div>
              <div className="section-content">
                <div className="feedback-display">
                  <div className="rating-display">
                    <span className="label">Rating:</span>
                    {renderStars(details.mentorFeedback.rating)}
                  </div>
                  {details.mentorFeedback.feedback && (
                    <div className="feedback-text-container">
                      <span className="label">Comments:</span>
                      <p className="feedback-text">{details.mentorFeedback.feedback}</p>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="label">Submitted At:</span>
                    <span className="value">
                      {new Date(details.mentorFeedback.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certificate */}
          {details.certificate && (
            <div className="section-card certificate-card">
              <div className="section-header">
                <Award size={22} />
                <h3>Certificate</h3>
                <Trophy className="trophy-icon" />
              </div>
              <div className="section-content">
                <div className="certificate-display">
                  <div className="certificate-badge">
                    <Award size={48} className={`award-icon ${details.certificate.achievementType}`} />
                    <span className="achievement-type">
                      {details.certificate.achievementType === 'champion' && '🥇 Champion'}
                      {details.certificate.achievementType === 'runner-up' && '🥈 Runner Up'}
                      {details.certificate.achievementType === 'third-place' && '🥉 Third Place'}
                      {details.certificate.achievementType === 'participant' && '📜 Participant'}
                      {details.certificate.achievementType === 'mentor' && '👨‍🏫 Mentor'}
                    </span>
                  </div>
                  <div className="certificate-details">
                    <div className="info-row">
                      <span className="label">Certificate Number:</span>
                      <span className="value code">{details.certificate.certificateNumber}</span>
                    </div>
                    {details.certificate.rank && (
                      <div className="info-row">
                        <span className="label">Rank:</span>
                        <span className="value highlight">#{details.certificate.rank}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="label">Issued At:</span>
                      <span className="value">
                        {new Date(details.certificate.issuedAt).toLocaleString()}
                      </span>
                    </div>
                    {details.certificate.downloadedAt && (
                      <div className="info-row">
                        <span className="label">Downloaded At:</span>
                        <span className="value">
                          {new Date(details.certificate.downloadedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Data States */}
          {!details.team && (
            <div className="no-data-card">
              <Users size={32} />
              <p>Student has not joined any team for this hackathon</p>
            </div>
          )}
          
          {!details.submission && details.team && (
            <div className="no-data-card">
              <Code size={32} />
              <p>No submission found for this hackathon</p>
            </div>
          )}
          
          {!details.certificate && (
            <div className="no-data-card">
              <Award size={32} />
              <p>Certificate not yet issued for this hackathon</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!details && !loading && (
        <div className="empty-state">
          <User size={64} />
          <h3>Select a Student and Hackathon</h3>
          <p>Choose a branch, then select a student and their registered hackathon to view detailed information</p>
        </div>
      )}
    </div>
  );
}
