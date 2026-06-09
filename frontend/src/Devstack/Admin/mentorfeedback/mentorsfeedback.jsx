import { useState, useEffect } from 'react';
import { Search, Filter, Star, TrendingUp, Users, Award, ChevronRight, Mail, User } from 'lucide-react';
import config from '../../../config';
import './mentorsfeedback.css';

// API Base URLs
const API_BASE = `${config.backendUrl}/studenthackteam`;
const API_BASEs = `${config.backendUrl}/hackmentorfeedback`;
const API_HACKATHON = `${config.backendUrl}/hackathon`;

export default function MentorFeedbackDashboard() {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [hackathonSearch, setHackathonSearch] = useState('');
  const [isHackathonOpen, setIsHackathonOpen] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  
  // Filter states
  const [searchMentor, setSearchMentor] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedMentor, setSelectedMentor] = useState(null);
  
  // Unique values for filters
  const [branches, setBranches] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);

  // Fetch hackathons on mount
  useEffect(() => {
    fetchHackathons();
  }, []);

  // Fetch feedbacks when hackathon is selected
  useEffect(() => {
    if (selectedHackathon) {
      fetchAllFeedbacks();
      setSelectedMentor(null);
    }
  }, [selectedHackathon]);

  // Apply filters whenever filter values or feedbacks change
  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchMentor, selectedBranch]);

  const fetchHackathons = async () => {
    try {
      const response = await fetch(`${API_HACKATHON}/all`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Show all hackathons without filtering
      setHackathons(data);
      console.log('Fetched all hackathons:', data);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      alert('Failed to fetch hackathons. Please check if the server is running.');
    }
  };

  const fetchAllFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASEs}/mentor/all/feedback?hackathonId=${selectedHackathon}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setFeedbacks(data.feedbacks || []);
      setStatistics(data.statistics);
      
      // Extract unique branches
      const uniqueBranches = [...new Set(data.feedbacks.map(f => f.student?.branch).filter(Boolean))];
      setBranches(uniqueBranches);
      
      // Group feedbacks by mentor
      const mentorsMap = new Map();
      data.feedbacks.forEach(feedback => {
        const mentorId = feedback.mentor?._id;
        if (mentorId) {
          if (!mentorsMap.has(mentorId)) {
            mentorsMap.set(mentorId, {
              id: mentorId,
              name: feedback.mentor?.name,
              email: feedback.mentor?.email,
              feedbacks: [],
              totalRating: 0,
              averageRating: 0
            });
          }
          const mentor = mentorsMap.get(mentorId);
          mentor.feedbacks.push(feedback);
          mentor.totalRating += feedback.rating;
          mentor.averageRating = (mentor.totalRating / mentor.feedbacks.length).toFixed(2);
        }
      });
      
      setMentorsList(Array.from(mentorsMap.values()));
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      alert('Failed to fetch feedbacks. Make sure the API endpoint exists.');
      setFeedbacks([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...mentorsList];

    // Filter by mentor name or email
    if (searchMentor.trim()) {
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(searchMentor.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchMentor.toLowerCase())
      );
    }

    // Filter by branch - filter mentors who have feedbacks from selected branch
    if (selectedBranch !== 'all') {
      filtered = filtered.map(mentor => ({
        ...mentor,
        feedbacks: mentor.feedbacks.filter(f => f.student?.branch === selectedBranch)
      })).filter(mentor => mentor.feedbacks.length > 0);
    }

    setFilteredMentors(filtered);
  };

  const renderStars = (rating, size = 16) => {
    const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = (numericRating % 1) >= 0.5;
    
    return [...Array(5)].map((_, index) => {
      if (index < fullStars) {
        return (
          <Star
            key={index}
            size={size}
            style={{ fill: '#FBBF24', color: '#FBBF24' }}
          />
        );
      } else if (index === fullStars && hasHalfStar) {
        return (
          <div key={index} className="relative" style={{ width: size, height: size }}>
            <Star 
              size={size} 
              className="absolute"
              style={{ fill: '#D1D5DB', color: '#D1D5DB' }}
            />
            <div className="absolute overflow-hidden" style={{ width: size / 2, height: size }}>
              <Star 
                size={size}
                style={{ fill: '#FBBF24', color: '#FBBF24' }}
              />
            </div>
          </div>
        );
      } else {
        return (
          <Star
            key={index}
            size={size}
            style={{ fill: '#D1D5DB', color: '#D1D5DB' }}
          />
        );
      }
    });
  };

  const resetFilters = () => {
    setSearchMentor('');
    setSelectedBranch('all');
    setSelectedMentor(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ongoing': return 'text-green-600 bg-green-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const selectedHackathonData = hackathons.find(h => h._id === selectedHackathon);
  const filteredHackathons = hackathons.filter(h =>
    h.hackathonname.toLowerCase().includes(hackathonSearch.toLowerCase())
  );

  return (
    <div className="mentor-feedback">
      <div className="mentor-feedback__container">
        {/* Header */}
        <div className="mentor-feedback__header">
          <h1 className="mentor-feedback__title">Mentor Feedback Dashboard</h1>
          <p className="mentor-feedback__subtitle">View and analyze mentor feedback across hackathons</p>
        </div>

        {/* Hackathon Selection */}
        <div className="mentor-feedback__section-card">
          <label className="mentor-feedback__label">
            Select Hackathon
          </label>
          <div className="mentor-feedback__dropdown">
            <div
              onClick={() => setIsHackathonOpen(!isHackathonOpen)}
              className="mentor-feedback__dropdown-button"
            >
              <span className={selectedHackathon ? 'mentor-feedback__dropdown-text--selected' : 'mentor-feedback__dropdown-text--placeholder'}>
                {selectedHackathonData
                  ? selectedHackathonData.hackathonname
                  : '-- Select a Hackathon --'}
              </span>
              <ChevronRight
                className={`mentor-feedback__dropdown-icon ${
                  isHackathonOpen ? 'mentor-feedback__dropdown-icon--open' : ''
                }`}
              />
            </div>

            {isHackathonOpen && (
              <div className="mentor-feedback__dropdown-menu">
                
                {/* Search input */}
                <div className="mentor-feedback__dropdown-search">
                  <input
                    type="text"
                    value={hackathonSearch}
                    onChange={(e) => setHackathonSearch(e.target.value)}
                    placeholder="Search hackathon..."
                    className="mentor-feedback__search-input"
                  />
                </div>

                {/* Scrollable list */}
                <div className="mentor-feedback__dropdown-list">
                  {filteredHackathons.length === 0 ? (
                    <p className="mentor-feedback__no-results">
                      No hackathons found
                    </p>
                  ) : (
                    filteredHackathons.map((hack) => (
                      <div
                        key={hack._id}
                        onClick={() => {
                          setSelectedHackathon(hack._id);
                          setIsHackathonOpen(false);
                          setHackathonSearch('');
                        }}
                        className="mentor-feedback__dropdown-item"
                      >
                        <span className="mentor-feedback__hackathon-name">
                          {hack.hackathonname}
                        </span>
                        <span
                          className={`mentor-feedback__status-badge mentor-feedback__status-badge--${hack.status}`}
                        >
                          {hack.status?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedHackathonData && (
            <div className="mentor-feedback__selected-info">
              <span className="mentor-feedback__selected-label">Selected:</span>
              <span className="mentor-feedback__selected-name">{selectedHackathonData.hackathonname}</span>
              <span className={`mentor-feedback__status-badge mentor-feedback__status-badge--${selectedHackathonData.status}`}>
                {selectedHackathonData.status?.toUpperCase() || 'N/A'}
              </span>
            </div>
          )}
        </div>

        {selectedHackathon && (
          <>
            {/* Statistics Cards */}
            {statistics && (
              <div className="mentor-feedback__stats-grid">
                <div className="mentor-feedback__stat-card">
                  <div className="mentor-feedback__stat-content">
                    <div className="mentor-feedback__stat-info">
                      <p className="mentor-feedback__stat-label">Total Feedbacks</p>
                      <p className="mentor-feedback__stat-value">{statistics.totalFeedbacks}</p>
                    </div>
                    <Users className="mentor-feedback__stat-icon mentor-feedback__stat-icon--blue" />
                  </div>
                </div>

                <div className="mentor-feedback__stat-card">
                  <div className="mentor-feedback__stat-content">
                    <div className="mentor-feedback__stat-info">
                      <p className="mentor-feedback__stat-label">Average Rating</p>
                      <p className="mentor-feedback__stat-value">{statistics.averageRating.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="mentor-feedback__stat-icon mentor-feedback__stat-icon--green" />
                  </div>
                </div>

                <div className="mentor-feedback__stat-card">
                  <div className="mentor-feedback__stat-content">
                    <div className="mentor-feedback__stat-info">
                      <p className="mentor-feedback__stat-label">5-Star Ratings</p>
                      <p className="mentor-feedback__stat-value">{statistics.ratingDistribution[5]}</p>
                    </div>
                    <Award className="mentor-feedback__stat-icon mentor-feedback__stat-icon--yellow" />
                  </div>
                </div>

                <div className="mentor-feedback__stat-card">
                  <div className="mentor-feedback__stat-content">
                    <div className="mentor-feedback__stat-info">
                      <p className="mentor-feedback__stat-label">Total Mentors</p>
                      <p className="mentor-feedback__stat-value">{mentorsList.length}</p>
                    </div>
                    <Star className="mentor-feedback__stat-icon mentor-feedback__stat-icon--purple" />
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mentor-feedback__filters-card">
              <div className="mentor-feedback__filters-header">
                <h2 className="mentor-feedback__filters-title">
                  <Filter className="mentor-feedback__filters-icon" />
                  Filters
                </h2>
                <button
                  onClick={resetFilters}
                  className="mentor-feedback__reset-button"
                >
                  Reset Filters
                </button>
              </div>

              <div className="mentor-feedback__filters-grid">
                {/* Search Mentor */}
                <div className="mentor-feedback__filter-group">
                  <label className="mentor-feedback__label">
                    Search Mentor (Name/Email)
                  </label>
                  <div className="mentor-feedback__search-wrapper">
                    <Search className="mentor-feedback__search-icon" />
                    <input
                      type="text"
                      value={searchMentor}
                      onChange={(e) => setSearchMentor(e.target.value)}
                      placeholder="Search by name or email..."
                      className="mentor-feedback__search-input mentor-feedback__search-input--with-icon"
                    />
                  </div>
                </div>

                {/* Branch Filter */}
                <div className="mentor-feedback__filter-group">
                  <label className="mentor-feedback__label">
                    Filter by Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="mentor-feedback__select"
                  >
                    <option value="all">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Two Container Layout */}
            <div className="mentor-feedback__layout">
              {/* Left Container - Mentors List */}
              <div className="mentor-feedback__mentors-container">
                <div className="mentor-feedback__mentors-card">
                  <div className="mentor-feedback__mentors-header">
                    <h2 className="mentor-feedback__mentors-title">
                      Mentors ({filteredMentors.length})
                    </h2>
                  </div>

                  {loading ? (
                    <div className="mentor-feedback__loading">
                      <div className="mentor-feedback__spinner"></div>
                    </div>
                  ) : filteredMentors.length === 0 ? (
                    <div className="mentor-feedback__empty-state">
                      <User className="mentor-feedback__empty-icon" />
                      <p className="mentor-feedback__empty-text">No mentors found</p>
                    </div>
                  ) : (
                    <div className="mentor-feedback__mentors-list">
                      {filteredMentors.map((mentor) => (
                        <button
                          key={mentor.id}
                          onClick={() => setSelectedMentor(mentor)}
                          className={`mentor-feedback__mentor-item ${
                            selectedMentor?.id === mentor.id ? 'mentor-feedback__mentor-item--active' : ''
                          }`}
                        >
                          <div className="mentor-feedback__mentor-content">
                            <div className="mentor-feedback__mentor-info">
                              <h3 className="mentor-feedback__mentor-name">
                                {mentor.name}
                              </h3>
                              <p className="mentor-feedback__mentor-email">
                                {mentor.email}
                              </p>
                              <div className="mentor-feedback__mentor-rating">
                                <div className="mentor-feedback__stars">
                                  {renderStars(mentor.averageRating)}
                                </div>
                                <span className="mentor-feedback__rating-value">
                                  {mentor.averageRating}
                                </span>
                              </div>
                              <p className="mentor-feedback__mentor-feedback-count">
                                {mentor.feedbacks.length} feedback{mentor.feedbacks.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <ChevronRight className={`mentor-feedback__chevron ${
                              selectedMentor?.id === mentor.id ? 'mentor-feedback__chevron--active' : ''
                            }`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Container - Selected Mentor Feedbacks */}
              <div className="mentor-feedback__details-container">
                <div className="mentor-feedback__details-card">
                  {!selectedMentor ? (
                    <div className="mentor-feedback__no-selection">
                      <Users className="mentor-feedback__no-selection-icon" />
                      <p className="mentor-feedback__no-selection-title">Select a Mentor</p>
                      <p className="mentor-feedback__no-selection-text">Choose a mentor from the list to view their feedback details</p>
                    </div>
                  ) : (
                    <>
                      {/* Mentor Header */}
                      <div className="mentor-feedback__detail-header">
                        <div className="mentor-feedback__detail-header-content">
                          <div>
                            <h2 className="mentor-feedback__detail-name">
                              {selectedMentor.name}
                            </h2>
                            <p className="mentor-feedback__detail-email">
                              <Mail className="mentor-feedback__detail-email-icon" />
                              {selectedMentor.email}
                            </p>
                          </div>
                          <div className="mentor-feedback__detail-rating-box">
                            <div className="mentor-feedback__detail-stars">
                              {renderStars(selectedMentor.averageRating, 20)}
                            </div>
                            <p className="mentor-feedback__detail-rating">{selectedMentor.averageRating}</p>
                            <p className="mentor-feedback__detail-rating-label">Average Rating</p>
                          </div>
                        </div>
                        <div className="mentor-feedback__detail-meta">
                          <span className="mentor-feedback__detail-badge">
                            📊 {selectedMentor.feedbacks.length} Total Feedback{selectedMentor.feedbacks.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Feedbacks List */}
                      <div className="mentor-feedback__feedbacks-list">
                        {selectedMentor.feedbacks.map((feedback) => (
                          <div key={feedback._id} className="mentor-feedback__feedback-item">
                            <div className="mentor-feedback__feedback-header">
                              <div className="mentor-feedback__feedback-student">
                                <h3 className="mentor-feedback__feedback-student-name">
                                  {feedback.student?.name || 'Unknown Student'}
                                </h3>
                                <p className="mentor-feedback__feedback-student-info">
                                  {feedback.student?.rollNo} {feedback.student?.branch && `• ${feedback.student.branch}`}
                                </p>
                                {feedback.student?.email && (
                                  <p className="mentor-feedback__feedback-student-email">{feedback.student.email}</p>
                                )}
                              </div>
                              <div className="mentor-feedback__feedback-rating-box">
                                <div className="mentor-feedback__feedback-stars">
                                  {renderStars(feedback.rating)}
                                </div>
                                <span className="mentor-feedback__feedback-rating-value">{feedback.rating}/5</span>
                              </div>
                            </div>

                            {feedback.feedback && (
                              <div className="mentor-feedback__feedback-text-box">
                                <p className="mentor-feedback__feedback-text">{feedback.feedback}</p>
                              </div>
                            )}

                            <p className="mentor-feedback__feedback-date">
                              Updated: {new Date(feedback.updatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}