import { useState, useEffect, useRef } from 'react';
import './CoordinatorSchedule.css';
import config from '../../../config';


const CoordinatorSchedule = () => {
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'completed'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem('token');

  // Fetch all hackathons on mount
  useEffect(() => {
    fetchHackathons();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter hackathons based on search query and status filter
  useEffect(() => {
    let filtered = hackathons;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(hack => 
        hack.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(hack =>
        hack.hackathonname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hack.year?.toString().includes(searchQuery) ||
        hack.status?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredHackathons(filtered);
  }, [searchQuery, statusFilter, hackathons]);

  // Get counts for each status
  const getStatusCounts = () => {
    const counts = {
      all: hackathons.length,
      upcoming: hackathons.filter(h => h.status?.toLowerCase() === 'upcoming').length,
      ongoing: hackathons.filter(h => h.status?.toLowerCase() === 'ongoing').length,
      completed: hackathons.filter(h => h.status?.toLowerCase() === 'completed').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.backendUrl}/hackathon/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHackathons(data);
        setFilteredHackathons(data);
        
        // Auto-select first hackathon if available
        if (data.length > 0) {
          handleSelectHackathon(data[0]);
        }
      } else {
        setError('Failed to fetch hackathons');
      }
    } catch (err) {
      setError('Error fetching hackathons: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (hackathonId) => {
    try {
      setScheduleLoading(true);
      setError(null);
      
      const response = await fetch(`${config.backendUrl}/schedule/approved/${hackathonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSchedules(data.data);
        if (data.data.length > 0) {
          setSelectedSchedule(data.data[0]);
          setSelectedDay(0);
        } else {
          setSelectedSchedule(null);
        }
      } else {
        setSchedules([]);
        setSelectedSchedule(null);
      }
    } catch (err) {
      setError('Error fetching schedules: ' + err.message);
      setSchedules([]);
      setSelectedSchedule(null);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSelectHackathon = (hackathon) => {
    setSelectedHackathon(hackathon);
    setSearchQuery(hackathon.hackathonname);
    setIsDropdownOpen(false);
    fetchSchedules(hackathon._id);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleSearchFocus = () => {
    setIsDropdownOpen(true);
  };

  const clearSelection = () => {
    setSelectedHackathon(null);
    setSearchQuery('');
    setSchedules([]);
    setSelectedSchedule(null);
    setIsDropdownOpen(true);
  };

  // Helper function to convert time string to minutes for sorting
  const convertTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    
    const parts = timeStr.split(' - ')[0];
    const [time, period] = parts.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let totalMinutes = hours * 60 + (minutes || 0);
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    
    return totalMinutes;
  };

  if (loading) {
    return (
      <div className="coordinator-schedule-container">
        <div className="coordinator-schedule-header">
          <div className="skeleton-element skeleton-title" style={{ width: '50%', height: '28px', margin: '0 auto 12px' }} />
          <div className="skeleton-element skeleton-text" style={{ width: '70%', height: '14px', margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-element" style={{ width: '100px', height: '40px', borderRadius: '30px' }} />
          ))}
        </div>
        
      </div>
    );
  }

  return (
    <div className="coordinator-schedule-container">
      <div className="coordinator-schedule-header">
        <h2 className="coordinator-schedule-title">Hackathon Schedule</h2>
        <p className="coordinator-schedule-subtitle">Search and select a hackathon to view its schedule</p>
      </div>

      {/* Status Filter Buttons */}
      <div className="coordinator-schedule-status-filters">
        <button 
          className={`coordinator-schedule-status-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setStatusFilter('all');
            setSearchQuery('');
          }}
        >
          All <span className="coordinator-schedule-status-count">{statusCounts.all}</span>
        </button>
        <button 
          className={`coordinator-schedule-status-btn upcoming ${statusFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => {
            setStatusFilter('upcoming');
            setSearchQuery('');
          }}
        >
          Upcoming <span className="coordinator-schedule-status-count">{statusCounts.upcoming}</span>
        </button>
        <button 
          className={`coordinator-schedule-status-btn ongoing ${statusFilter === 'ongoing' ? 'active' : ''}`}
          onClick={() => {
            setStatusFilter('ongoing');
            setSearchQuery('');
          }}
        >
          Ongoing <span className="coordinator-schedule-status-count">{statusCounts.ongoing}</span>
        </button>
        <button 
          className={`coordinator-schedule-status-btn completed ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            setStatusFilter('completed');
            setSearchQuery('');
          }}
        >
          Completed <span className="coordinator-schedule-status-count">{statusCounts.completed}</span>
        </button>
      </div>

      {/* Hackathon Search Section */}
      <div className="coordinator-schedule-search-section" ref={dropdownRef}>
        <div className="coordinator-schedule-search-wrapper">
          <div className="coordinator-schedule-search-input-container">
            <svg className="coordinator-schedule-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="coordinator-schedule-search-input"
              placeholder="Search hackathons..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
            />
            {selectedHackathon && (
              <button className="coordinator-schedule-clear-btn" onClick={clearSelection}>
                ×
              </button>
            )}
          </div>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="coordinator-schedule-dropdown">
              {filteredHackathons.length === 0 ? (
                <div className="coordinator-schedule-dropdown-empty">
                  No hackathons found
                </div>
              ) : (
                filteredHackathons.map((hackathon) => (
                  <div
                    key={hackathon._id}
                    className={`coordinator-schedule-dropdown-item ${selectedHackathon?._id === hackathon._id ? 'selected' : ''}`}
                    onClick={() => handleSelectHackathon(hackathon)}
                  >
                    <div className="coordinator-schedule-dropdown-item-name">
                      {hackathon.hackathonname}
                    </div>
                    <div className="coordinator-schedule-dropdown-item-info">
                      <span className="coordinator-schedule-dropdown-year">{hackathon.year}</span>
                      <span className={`coordinator-schedule-dropdown-status ${hackathon.status?.toLowerCase()}`}>
                        {hackathon.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="coordinator-schedule-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Selected Hackathon Info */}
      {selectedHackathon && (
        <div className="coordinator-schedule-selected-info">
          <div className="coordinator-schedule-selected-badge">
            <span className="coordinator-schedule-selected-label">Selected:</span>
            <span className="coordinator-schedule-selected-name">{selectedHackathon.hackathonname}</span>
            <span className={`coordinator-schedule-selected-status ${selectedHackathon.status?.toLowerCase()}`}>
              {selectedHackathon.status}
            </span>
          </div>
        </div>
      )}

      {/* Schedule Loading */}
      {scheduleLoading && (
        <div className="coordinator-schedule-loading">
          <div className="coordinator-schedule-spinner"></div>
          <p>Loading schedule...</p>
        </div>
      )}

      {/* No Schedule Message */}
      {selectedHackathon && !scheduleLoading && schedules.length === 0 && (
        <div className="coordinator-schedule-no-data">
          <div className="coordinator-schedule-no-data-icon">📅</div>
          <h3>No Schedule Available</h3>
          <p>No approved schedule found for <strong>{selectedHackathon.hackathonname}</strong></p>
        </div>
      )}

      {/* Schedule Display */}
      {selectedSchedule && selectedSchedule.days && selectedSchedule.days.length > 0 && (
        <div className="coordinator-schedule-display">
          {/* Day Selector Buttons */}
          <div className="coordinator-schedule-day-buttons">
            {selectedSchedule.days.map((day, index) => (
              <button
                key={index}
                className={`coordinator-schedule-day-btn ${selectedDay === index ? 'active' : ''}`}
                onClick={() => setSelectedDay(index)}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Schedule Table */}
          <div className="coordinator-schedule-table-container">
            <div className="coordinator-schedule-table-header">
              {selectedSchedule.days[selectedDay].day}
            </div>
            <div className="coordinator-schedule-table-content">
              <table className="coordinator-schedule-table">
                <thead>
                  <tr>
                    <th className="coordinator-schedule-th-time">Time</th>
                    <th className="coordinator-schedule-th-session">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSchedule.days[selectedDay].sessions?.length > 0 ? (
                    selectedSchedule.days[selectedDay].sessions
                      .sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time))
                      .map((session, sessionIndex) => (
                        <tr key={sessionIndex}>
                          <td className="coordinator-schedule-td-time">{session.time}</td>
                          <td className="coordinator-schedule-td-session">{session.session}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="coordinator-schedule-no-sessions">
                        No sessions scheduled for this day
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Schedules Selector */}
      {schedules.length > 1 && (
        <div className="coordinator-schedule-selector">
          <label>Select Schedule Version:</label>
          <select
            value={selectedSchedule?._id || ''}
            onChange={(e) => {
              const selected = schedules.find(s => s._id === e.target.value);
              setSelectedSchedule(selected);
              setSelectedDay(0);
            }}
          >
            {schedules.map((schedule, index) => (
              <option key={schedule._id} value={schedule._id}>
                Version {index + 1} - {new Date(schedule.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default CoordinatorSchedule;
