import { useState, useEffect } from 'react';

import { Filter, Star, TrendingUp, Users, Award, ChevronRight, Mail, User } from 'lucide-react';
import config from '../../../config';
import './hackmentorfeedback.css';

// API Base URLs using config
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
      
      // Get coordinator details from localStorage
      const coordinatorCollege = localStorage.getItem('coordinatordetails');
      const coordinatorYear = localStorage.getItem('coordinatoryear');
      
      // Filter hackathons based on coordinator's college and year
      let filteredHackathons = data;
      
      if (coordinatorCollege && coordinatorYear) {
        filteredHackathons = data.filter(hackathon => {
          const collegeMatch = hackathon.college === coordinatorCollege;
          const yearMatch = hackathon.year === coordinatorYear;
          return collegeMatch && yearMatch;
        });
        console.log('Filtered hackathons based on coordinator:', filteredHackathons);
      }
      
      setHackathons(filteredHackathons);
      console.log('Fetched hackathons:', filteredHackathons);
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
    <div className='hackmentorfeedback-container'>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentor Feedback Dashboard</h1>
          <p className="text-gray-600">View and analyze mentor feedback across hackathons</p>
        </div>

        {/* Hackathon Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Hackathon
          </label>
          <div className="relative">
  <div
    onClick={() => setIsHackathonOpen(!isHackathonOpen)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white flex justify-between items-center"
  >
    <span className={selectedHackathon ? 'text-gray-900' : 'text-gray-400'}>
      {selectedHackathonData
        ? selectedHackathonData.hackathonname
        : '-- Select a Hackathon --'}
    </span>
    <ChevronRight
      className={`w-5 h-5 transition-transform ${
        isHackathonOpen ? 'rotate-90' : ''
      }`}
    />
  </div>

  {isHackathonOpen && (
    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-md">
      
      {/* Search input */}
      <div className="p-2 border-b">
        <input
          type="text"
          value={hackathonSearch}
          onChange={(e) => setHackathonSearch(e.target.value)}
          placeholder="Search hackathon..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Scrollable list */}
      <div className="max-h-60 overflow-y-auto">
        {filteredHackathons.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 text-center">
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
              className="px-4 py-2 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
            >
              <span className="text-sm font-medium">
                {hack.hackathonname}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                  hack.status
                )}`}
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
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">Selected:</span>
              <span className="font-medium text-gray-900">{selectedHackathonData.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedHackathonData.status)}`}>
                {selectedHackathonData.status?.toUpperCase() || 'N/A'}
              </span>
            </div>
          )}
        </div>

        {selectedHackathon && (
          <>
            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Feedbacks</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.totalFeedbacks}</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.averageRating.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">5-Star Ratings</p>
                      <p className="text-2xl font-bold text-gray-900">{statistics.ratingDistribution[5]}</p>
                    </div>
                    <Award className="w-10 h-10 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Mentors</p>
                      <p className="text-2xl font-bold text-gray-900">{mentorsList.length}</p>
                    </div>
                    <Star className="w-10 h-10 text-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reset Filters
                </button>
              </div>

              <div className="mentor-filters-section">
                {/* Search Mentor */}
                <div className="mentor-filter-group">
                  <label className="mentor-filter-label">
                    Search Mentor (Name/Email)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchMentor}
                      onChange={(e) => setSearchMentor(e.target.value)}
                      placeholder="Search by name or email..."
                      className="mentor-filter-input pl-10"
                    />
                  </div>
                </div>

                {/* Branch Filter */}
                <div className="mentor-filter-group">
                  <label className="mentor-filter-label">
                    Filter by Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="mentor-filter-input"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Container - Mentors List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md sticky top-6">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Mentors ({filteredMentors.length})
                    </h2>
                  </div>

                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : filteredMentors.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No mentors found</p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto">
                      {filteredMentors.map((mentor) => (
                        <button
                          key={mentor.id}
                          onClick={() => setSelectedMentor(mentor)}
                          className={`mentor-card-item ${
                            selectedMentor?.id === mentor.id ? 'mentor-card-item-active' : ''
                          }`}
                        >
                          <div className="mentor-card-header">
                            <div className="mentor-card-content">
                              <h3 className="mentor-card-name">
                                {mentor.name}
                              </h3>
                              <p className="mentor-card-email">
                                {mentor.email}
                              </p>
                              <div className="mentor-card-rating">
                                <div className="flex items-center gap-1">
                                  {renderStars(mentor.averageRating)}
                                </div>
                                <span className="mentor-card-rating-value">
                                  {mentor.averageRating}
                                </span>
                              </div>
                              <p className="mentor-card-feedback-count">
                                {mentor.feedbacks.length} feedback{mentor.feedbacks.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <ChevronRight className={`mentor-card-icon ${
                              selectedMentor?.id === mentor.id ? 'mentor-card-icon-active' : ''
                            }`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Container - Selected Mentor Feedbacks */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md">
                  {!selectedMentor ? (
                    <div className="p-12 text-center text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">Select a Mentor</p>
                      <p className="text-sm">Choose a mentor from the list to view their feedback details</p>
                    </div>
                  ) : (
                    <>
                      {/* Mentor Header */}
                      <div className="mentor-details-header">
                        <div className="mentor-details-header-content">
                          <div className="mentor-details-info">
                            <h2 className="mentor-details-name">
                              {selectedMentor.name}
                            </h2>
                            <p className="mentor-details-email">
                              <Mail className="w-4 h-4" />
                              {selectedMentor.email}
                            </p>
                          </div>
                          <div className="mentor-details-rating-box">
                            <div className="mentor-details-stars">
                              {renderStars(selectedMentor.averageRating, 20)}
                            </div>
                            <p className="mentor-details-rating-number">{selectedMentor.averageRating}</p>
                            <p className="mentor-details-rating-label">Average Rating</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-700">
                          <span className="bg-white px-3 py-1 rounded-full">
                            📊 {selectedMentor.feedbacks.length} Total Feedback{selectedMentor.feedbacks.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Feedbacks List */}
                      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                        {selectedMentor.feedbacks.map((feedback) => (
                          <div key={feedback._id} className="feedback-item">
                            <div className="feedback-item-header">
                              <div className="feedback-student-info">
                                <h3 className="feedback-student-name">
                                  {feedback.student?.name || 'Unknown Student'}
                                </h3>
                                <p className="feedback-student-details">
                                  {feedback.student?.rollNo} {feedback.student?.branch && `• ${feedback.student.branch}`}
                                </p>
                                {feedback.student?.email && (
                                  <p className="feedback-student-email">{feedback.student.email}</p>
                                )}
                              </div>
                              <div className="feedback-rating-box">
                                <div className="feedback-rating-stars">
                                  {renderStars(feedback.rating)}
                                </div>
                                <span className="feedback-rating-score">{feedback.rating}/5</span>
                              </div>
                            </div>

                            {feedback.feedback && (
                              <div className="feedback-comment-section">
                                <p className="feedback-comment-text">{feedback.feedback}</p>
                              </div>
                            )}

                            <p className="feedback-timestamp">
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
    </div>
  );
}