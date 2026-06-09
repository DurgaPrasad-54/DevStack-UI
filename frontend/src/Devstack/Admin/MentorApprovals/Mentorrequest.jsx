import { useState, useEffect } from 'react';

import { User, Calendar, Clock, Check, X, ChevronDown, Eye, Mail, Github, Linkedin, MapPin, Phone } from 'lucide-react';
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import './Mentorrequests.css';
import config from '../../../config'

const AdminMentorApproval = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [mentorRequests, setMentorRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false)

  const getAdminId = () => {
    let userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (!userId) {
      if (userRole === 'admin') {
        userId = localStorage.getItem('admin');
      }
    }
    
    return userId;
  };

  // Fetch ongoing hackathons only
  const fetchHackathons = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${config.backendUrl}/hackathon/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter to show only ongoing hackathons
      const ongoingHackathons = (response.data || []).filter(hackathon => 
        hackathon.status === 'ongoing'
      );
      
      setHackathons(ongoingHackathons);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      setHackathons([]);
    }
  };

  // Fetch mentor requests for selected hackathon
  const fetchMentorRequests = async (hackathonId) => {
    if (!hackathonId) {
      setMentorRequests([]);
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.get(
        `${config.backendUrl}/hackathonrequests/${hackathonId}/mentors`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMentorRequests(response.data.mentorRequests || []);
    } catch (error) {
      console.error('Error fetching mentor requests:', error);
      setMentorRequests([]);
      toast.error('Failed to fetch mentor requests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch mentor profile details
  const fetchMentorProfile = async (mentorId) => {
    const token = localStorage.getItem('token');
    setLoadingProfile(true);
    
    try {
      // Try multiple possible endpoints
      let response;
      try {
        response = await axios.get(
          `${config.backendUrl}/mentor/profile/${mentorId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } catch (firstError) {
        // Try alternative endpoint
        try {
          response = await axios.get(
            `${config.backendUrl}/user/profile/${mentorId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        } catch (secondError) {
          // Try another alternative
          response = await axios.get(
            `${config.backendUrl}/users/${mentorId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching mentor profile:', error);
      // Don't show error toast, just use basic info
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (mentorRequestId, newStatus) => {
    if (!selectedHackathon) return;

    const token = localStorage.getItem('token');
    const adminId = getAdminId();
    
    if (!adminId) {
      toast.error('Admin ID not found.');
      return;
    }

    try {
      const response = await axios.put(
        `${config.backendUrl}/hackathonrequests/${selectedHackathon}/mentors/${mentorRequestId}/status`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success(response.data.message || `Mentor request ${newStatus} successfully.`);
      fetchMentorRequests(selectedHackathon);
    } catch (error) {
      console.error('Error updating mentor request status:', error);
      if (error.response) {
        toast.error(error.response.data.message || `Failed to ${newStatus} mentor request.`);
      } else {
        toast.error(`Error updating mentor request status.`);
      }
    }
  };

  // Filter requests based on status
  const filterItems = (items) => {
    if (statusFilter === 'all') return items;
    return items.filter(item => (item.status || 'pending') === statusFilter);
  };

  // Get counts for status badges
  const getStatusCounts = (items) => {
    const pending = items.filter(item => !item.status || item.status === 'pending').length;
    const approved = items.filter(item => item.status === 'approved').length;
    const rejected = items.filter(item => item.status === 'rejected').length;
    return { pending, approved, rejected, total: items.length };
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <Check className="mentor-approval__status-icon mentor-approval__status-icon--approved" />;
      case 'rejected': return <X className="mentor-approval__status-icon mentor-approval__status-icon--rejected" />;
      default: return <Clock className="mentor-approval__status-icon mentor-approval__status-icon--pending" />;
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'approved': return 'mentor-approval__status-badge--approved';
      case 'rejected': return 'mentor-approval__status-badge--rejected';
      default: return 'mentor-approval__status-badge--pending';
    }
  };

  // Show mentor profile overlay
  const handleViewProfile = async (mentor) => {
    if (!mentor || !mentor._id) {
      toast.error('Mentor information not available');
      return;
    }

    // First, show the overlay with basic info
    setSelectedMentor(mentor);
    setShowProfile(true);

    // Then fetch detailed profile
    const detailedProfile = await fetchMentorProfile(mentor._id);
    if (detailedProfile) {
      setSelectedMentor({
        ...mentor,
        ...detailedProfile,
        // Handle different possible field names
        phoneNumber: detailedProfile.phoneNumber,
        github: detailedProfile.github ,
        linkedin: detailedProfile.linkedin ,
      });
    }
  };

  // Close profile overlay
  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedMentor(null);
  };

  // Render action buttons based on current status
  const renderActionButtons = (request) => {
    const currentStatus = request.status || 'pending';
    
    return (
      <div className="mentor-approval__action-buttons">
        {currentStatus !== 'approved' && (
          <button
            className="mentor-approval__btn mentor-approval__btn--success mentor-approval__btn--xs"
            onClick={() => handleStatusUpdate(request._id, 'approved')}
            title="Approve"
          >
            <Check className="mentor-approval__btn-icon" />
            Approve
          </button>
        )}
        {currentStatus !== 'pending' && (
          <button
            className="mentor-approval__btn mentor-approval__btn--warning mentor-approval__btn--xs"
            onClick={() => handleStatusUpdate(request._id, 'pending')}
            title="Set to Pending"
          >
            <Clock className="mentor-approval__btn-icon" />
            Pending
          </button>
        )}
        {currentStatus !== 'rejected' && (
          <button
            className="mentor-approval__btn mentor-approval__btn--danger mentor-approval__btn--xs"
            onClick={() => handleStatusUpdate(request._id, 'rejected')}
            title="Reject"
          >
            <X className="mentor-approval__btn-icon" />
            Reject
          </button>
        )}
      </div>
    );
  };

  const renderStatusFilters = (items) => {
    const counts = getStatusCounts(items);
    
    return (
      <div className="mentor-approval__status-filters">
        <button
          className={`mentor-approval__status-filter ${statusFilter === 'all' ? 'mentor-approval__status-filter--active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All ({counts.total})
        </button>
        <button
          className={`mentor-approval__status-filter mentor-approval__status-filter--pending ${statusFilter === 'pending' ? 'mentor-approval__status-filter--active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending ({counts.pending})
        </button>
        <button
          className={`mentor-approval__status-filter mentor-approval__status-filter--approved ${statusFilter === 'approved' ? 'mentor-approval__status-filter--active' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          Approved ({counts.approved})
        </button>
        <button
          className={`mentor-approval__status-filter mentor-approval__status-filter--rejected ${statusFilter === 'rejected' ? 'mentor-approval__status-filter--active' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          Rejected ({counts.rejected})
        </button>
      </div>
    );
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    if (selectedHackathon) {
      fetchMentorRequests(selectedHackathon);
    }
  }, [selectedHackathon]);

  const filteredRequests = filterItems(mentorRequests);

  return (
    <div className="mentor-approval">
      <div className="mentor-approval__content">
        <ToastContainer position="top-right" autoClose={3000} />
        
        <div className="mentor-approval__header">
          <h1 className="mentor-approval__title">Admin Mentor Request Approvals</h1>
        </div>

        {/* Hackathon Selection Dropdown */}
        <div className="mentor-approval__section-header">
          <div className="mentor-approval__hackathon-selector">
            <label className="mentor-approval__selector-label">Select Ongoing Hackathon:</label>
            <div className="mentor-approval__dropdown">
              <button
                className="mentor-approval__dropdown-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>
                  {selectedHackathon 
                    ? hackathons.find(h => h._id === selectedHackathon)?.hackathonname || 'Select Hackathon'
                    : 'Select Hackathon'
                  }
                </span>
                <ChevronDown className={`mentor-approval__dropdown-icon ${dropdownOpen ? 'mentor-approval__dropdown-icon--open' : ''}`} />
              </button>
              
              {dropdownOpen && (
                <div className="mentor-approval__dropdown-menu">
                  <div 
                    className="mentor-approval__dropdown-item"
                    onClick={() => {
                      setSelectedHackathon('');
                      setDropdownOpen(false);
                    }}
                  >
                    <div className="mentor-approval__hackathon-item">
                      <div className="mentor-approval__hackathon-name">Select Hackathon</div>
                    </div>
                  </div>
                  {hackathons.length === 0 ? (
                    <div className="mentor-approval__dropdown-item mentor-approval__dropdown-item--disabled">
                      <div className="mentor-approval__hackathon-item">
                        <div className="mentor-approval__hackathon-name">No ongoing hackathons found</div>
                      </div>
                    </div>
                  ) : (
                    hackathons.map((hackathon) => (
                      <div
                        key={hackathon._id}
                        className="mentor-approval__dropdown-item"
                        onClick={() => {
                          setSelectedHackathon(hackathon._id);
                          setDropdownOpen(false);
                        }}
                      >
                        <div className="mentor-approval__hackathon-item">
                          <div className="mentor-approval__hackathon-name">{hackathon.hackathonname}</div>
                          <div className="mentor-approval__hackathon-details">
                            {hackathon.college} • {hackathon.year}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedHackathon && (
          <>
            <div className="mentor-approval__section-header">
              <h2 className="mentor-approval__section-title">Mentor Requests</h2>
              {renderStatusFilters(mentorRequests)}
            </div>

            {loading ? (
              <div className="mentor-approval__loading">Loading mentor requests...</div>
            ) : (
              <div className="mentor-approval__table-section">
                <div className="mentor-approval__table-container">
                  <div className="mentor-approval__table">
                    <div className="mentor-approval__table-header">
                      <div className="mentor-approval__header-cell">Mentor Name</div>
                      <div className="mentor-approval__header-cell">Email</div>
                      <div className="mentor-approval__header-cell">Profile</div>
                      <div className="mentor-approval__header-cell">Requested Date</div>
                      <div className="mentor-approval__header-cell">Status</div>
                      <div className="mentor-approval__header-cell">Actions</div>
                    </div>
                    
                    {filteredRequests.length === 0 ? (
                      <div className="mentor-approval__no-data">
                        No mentor requests found for the selected filters.
                      </div>
                    ) : (
                      filteredRequests.map((request) => (
                        <div key={request._id} className="mentor-approval__table-row">
                          <div className="mentor-approval__table-cell" data-label="Mentor Name">
                            <div className="mentor-approval__mentor-info">
                              <User className="mentor-approval__mentor-icon" />
                              <span className="mentor-approval__mentor-name">
                                {request.mentor?.name || 'Unknown Mentor'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mentor-approval__table-cell" data-label="Email">
                            <div className="mentor-approval__mentor-email">
                              <Mail className="mentor-approval__email-icon" />
                              <span>{request.mentor?.email || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="mentor-approval__table-cell" data-label="Profile">
                            <button
                              className="mentor-approval__btn mentor-approval__btn--outline mentor-approval__btn--xs"
                              onClick={() => handleViewProfile(request.mentor)}
                              title="View Profile"
                            >
                              <Eye className="mentor-approval__btn-icon" />
                              View
                            </button>
                          </div>
                          
                          <div className="mentor-approval__table-cell" data-label="Requested Date">
                            <span className="mentor-approval__date">
                              <Calendar className="mentor-approval__date-icon" />
                              {formatDate(request.requestedAt || request.createdAt)}
                            </span>
                          </div>
                          
                          <div className="mentor-approval__table-cell" data-label="Status">
                            <div className={`mentor-approval__status-badge ${getStatusClass(request.status)}`}>
                              {getStatusIcon(request.status)}
                              {request.status || 'pending'}
                            </div>
                          </div>
                          
                          <div className="mentor-approval__table-cell" data-label="Actions">
                            {renderActionButtons(request)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedHackathon && (
          <div className="mentor-approval__empty-state">
            <User className="mentor-approval__empty-icon" />
            <h3>Select an Ongoing Hackathon</h3>
            <p>
              {hackathons.length === 0 
                ? 'No ongoing hackathons are currently available.'
                : 'Choose an ongoing hackathon from the dropdown above to view mentor requests.'
              }
            </p>
          </div>
        )}

        {/* Enhanced Profile Modal */}
        {showProfile && selectedMentor && (
          <div className="mentor-approval__profile-overlay" onClick={handleCloseProfile}>
            <div className="mentor-approval__profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mentor-approval__profile-header">
                <h3 className="mentor-approval__profile-title">Mentor Profile</h3>
                <button className="mentor-approval__close-btn" onClick={handleCloseProfile}>
                  <X className="mentor-approval__close-icon" />
                </button>
              </div>
              
              <div className="mentor-approval__profile-content">
                {loadingProfile ? (
                  <div className="mentor-approval__profile-loading">
                    <div className="mentor-approval__loading-spinner"></div>
                    <p>Loading mentor details...</p>
                  </div>
                ) : (
                  <div className="mentor-approval__mentor-profile">
                    {/* Basic Information Card */}
                    <div className="mentor-approval__profile-card">
                      <div className="mentor-approval__profile-avatar">
                        <User className="mentor-approval__avatar-icon" />
                      </div>
                      <div className="mentor-approval__profile-basic">
                        <h4 className="mentor-approval__profile-name">{selectedMentor.name}</h4>
                        <div className="mentor-approval__profile-contact">
                          <div className="mentor-approval__contact-item">
                            <Mail className="mentor-approval__contact-icon" />
                            <span>{selectedMentor.email}</span>
                          </div>
                          {selectedMentor.phoneNumber && (
                            <div className="mentor-approval__contact-item">
                              <Phone className="mentor-approval__contact-icon" />
                              <span>{selectedMentor.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Social Links Card */}
                    {(selectedMentor.github || selectedMentor.linkedin) && (
                      <div className="mentor-approval__profile-card">
                        <div className="mentor-approval__card-header">
                          <MapPin className="mentor-approval__card-icon" />
                          <h5 className="mentor-approval__card-title">Connect</h5>
                        </div>
                        <div className="mentor-approval__card-content">
                          <div className="mentor-approval__social-links">
                            {selectedMentor.github && (
                              <a 
                                href={selectedMentor.github} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mentor-approval__social-link mentor-approval__social-link--github"
                              >
                                <Github className="mentor-approval__social-icon" />
                                <span>GitHub</span>
                              </a>
                            )}
                            {selectedMentor.linkedin && (
                              <a 
                                href={selectedMentor.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mentor-approval__social-link mentor-approval__social-link--linkedin"
                              >
                                <Linkedin className="mentor-approval__social-icon" />
                                <span>LinkedIn</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMentorApproval;