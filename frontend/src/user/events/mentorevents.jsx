import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  FileText
} from 'lucide-react';
import config from '../../config';
import './mentorevents.css'; // Import the custom CSS file

const StudentEventsView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/mentorevents/student/my-events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
        if (data.message) {
          showMessage('info', data.message);
        }
      } else {
        showMessage('error', data.message || 'Failed to fetch events');
      }
    } catch (error) {
      showMessage('error', 'Error fetching events');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'upcoming': return 'mentorevents-status-upcoming';
      case 'ongoing': return 'mentorevents-status-ongoing';
      case 'completed': return 'mentorevents-status-completed';
      case 'cancelled': return 'mentorevents-status-cancelled';
      default: return 'mentorevents-status-completed';
    }
  };

  const getEventTypeClass = (type) => {
    switch (type) {
      case 'workshop': return 'mentorevents-type-workshop';
      case 'meeting': return 'mentorevents-type-meeting';
      case 'seminar': return 'mentorevents-type-seminar';
      case 'competition': return 'mentorevents-type-competition';
      default: return 'mentorevents-type-meeting';
    }
  };

  const isEventUpcoming = (eventDate) => {
    return new Date(eventDate) > new Date();
  };

  const isEventToday = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    return today.toDateString() === event.toDateString();
  };

  const openEventModal = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  return (
    <div className="mentorevents-container">
      <div className="mentorevents-wrapper">
        {/* Header */}
        <div className="mentorevents-header">
          <h1 className="mentorevents-title">My Events</h1>
          <p className="mentorevents-subtitle">Events assigned to your teams</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mentorevents-message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Events Display */}
        {loading ? (
          <div className="mentorevents-loading">
            <div className="mentorevents-spinner"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="mentorevents-empty">
            <Calendar size={64} className="mentorevents-empty-icon" />
            <h3 className="mentorevents-empty-title">No Events Available</h3>
            <p className="mentorevents-empty-text">You don't have any events assigned to your teams yet.</p>
          </div>
        ) : (
          <>
            {/* Upcoming Events Section */}
            <div className="mentorevents-section">
              <h2 className="mentorevents-section-title">
                <Calendar className="mentorevents-section-icon" size={24} />
                Upcoming Events
              </h2>
              <div className="mentorevents-grid">
                {events
                  .filter(event => isEventUpcoming(event.eventDate) && event.status !== 'cancelled')
                  .map(event => (
                    <div 
                      key={event._id} 
                      className={`mentorevents-card ${isEventToday(event.eventDate) ? 'today' : ''}`}
                    >
                      <div className="mentorevents-card-content">
                        {isEventToday(event.eventDate) && (
                          <div className="mentorevents-today-badge">
                            Today's Event!
                          </div>
                        )}
                        
                        <div className="mentorevents-card-header">
                          <h3 className="mentorevents-card-title">{event.title}</h3>
                          <span className={`mentorevents-status-badge ${getStatusClass(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        
                        <p className="mentorevents-card-description">{event.description}</p>
                        
                        <div className="mentorevents-card-details">
                          <div className="mentorevents-detail-item">
                            <Calendar size={16} className="mentorevents-detail-icon" />
                            {formatDate(event.eventDate)}
                          </div>
                          <div className="mentorevents-detail-item">
                            <Clock size={16} className="mentorevents-detail-icon" />
                            {formatTime(event.eventTime)}
                          </div>
                          <div className="mentorevents-detail-item">
                            <MapPin size={16} className="mentorevents-detail-icon" />
                            {event.location}
                          </div>
                          <div className="mentorevents-detail-item">
                            <User size={16} className="mentorevents-detail-icon" />
                            By {event.mentor?.name}
                          </div>
                        </div>
                        
                        <div className="mentorevents-card-footer">
                          <span className={`mentorevents-type-badge ${getEventTypeClass(event.eventType)}`}>
                            {event.eventType}
                          </span>
                          <button
                            onClick={() => openEventModal(event)}
                            className="mentorevents-view-btn"
                          >
                            <Eye size={14} />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {events.filter(event => isEventUpcoming(event.eventDate) && event.status !== 'cancelled').length === 0 && (
                <div className="mentorevents-empty-section">
                  <Calendar size={48} className="mentorevents-empty-section-icon" />
                  <p className="mentorevents-empty-text">No upcoming events</p>
                </div>
              )}
            </div>

            {/* Past Events Section */}
            <div className="mentorevents-section">
              <h2 className="mentorevents-section-title">
                <Clock className="mentorevents-section-icon" size={24} />
                Past Events
              </h2>
              <div className="mentorevents-grid">
                {events
                  .filter(event => !isEventUpcoming(event.eventDate) || event.status === 'completed')
                  .map(event => (
                    <div key={event._id} className="mentorevents-card past">
                      <div className="mentorevents-card-content">
                        <div className="mentorevents-card-header">
                          <h3 className="mentorevents-card-title">{event.title}</h3>
                          <span className={`mentorevents-status-badge ${getStatusClass(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        
                        <p className="mentorevents-card-description">{event.description}</p>
                        
                        <div className="mentorevents-card-details">
                          <div className="mentorevents-detail-item">
                            <Calendar size={14} className="mentorevents-detail-icon" />
                            {formatDate(event.eventDate)}
                          </div>
                          <div className="mentorevents-detail-item">
                            <User size={14} className="mentorevents-detail-icon" />
                            By {event.mentor?.name}
                          </div>
                        </div>
                        
                        <div className="mentorevents-card-footer">
                          <span className={`mentorevents-type-badge ${getEventTypeClass(event.eventType)}`}>
                            {event.eventType}
                          </span>
                          <button
                            onClick={() => openEventModal(event)}
                            className="mentorevents-view-btn past"
                          >
                            <Eye size={14} />
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {events.filter(event => !isEventUpcoming(event.eventDate) || event.status === 'completed').length === 0 && (
                <div className="mentorevents-empty-section">
                  <Clock size={48} className="mentorevents-empty-section-icon" />
                  <p className="mentorevents-empty-text">No past events</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="mentorevents-modal-overlay">
            <div className="mentorevents-modal">
              <div className="mentorevents-modal-content">
                <div className="mentorevents-modal-header">
                  <div className="mentorevents-modal-title-section">
                    <h2 className="mentorevents-modal-title">{selectedEvent.title}</h2>
                    <div className="mentorevents-modal-badges">
                      <span className={`mentorevents-status-badge ${getStatusClass(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                      <span className={`mentorevents-type-badge ${getEventTypeClass(selectedEvent.eventType)}`}>
                        {selectedEvent.eventType}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="mentorevents-close-btn"
                  >
                    ×
                  </button>
                </div>

                <div className="mentorevents-modal-sections">
                  <div className="mentorevents-modal-section">
                    <h3 className="mentorevents-modal-section-title">
                      <FileText size={18} />
                      Description
                    </h3>
                    <p className="mentorevents-modal-description">{selectedEvent.description}</p>
                  </div>

                  <div className="mentorevents-modal-details-grid">
                    <div className="mentorevents-modal-detail-group">
                      <div className="mentorevents-modal-detail-item">
                        <Calendar className="mentorevents-detail-icon" size={20} />
                        <div className="mentorevents-modal-detail-content">
                          <p className="mentorevents-modal-detail-label">Date</p>
                          <p className="mentorevents-modal-detail-value">{formatDate(selectedEvent.eventDate)}</p>
                        </div>
                      </div>

                      <div className="mentorevents-modal-detail-item">
                        <Clock className="mentorevents-detail-icon" size={20} />
                        <div className="mentorevents-modal-detail-content">
                          <p className="mentorevents-modal-detail-label">Time</p>
                          <p className="mentorevents-modal-detail-value">{formatTime(selectedEvent.eventTime)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mentorevents-modal-detail-group">
                      <div className="mentorevents-modal-detail-item">
                        <MapPin className="mentorevents-detail-icon" size={20} />
                        <div className="mentorevents-modal-detail-content">
                          <p className="mentorevents-modal-detail-label">Location</p>
                          <p className="mentorevents-modal-detail-value">{selectedEvent.location}</p>
                        </div>
                      </div>

                      <div className="mentorevents-modal-detail-item">
                        <User className="mentorevents-detail-icon" size={20} />
                        <div className="mentorevents-modal-detail-content">
                          <p className="mentorevents-modal-detail-label">Mentor</p>
                          <p className="mentorevents-modal-detail-value">{selectedEvent.mentor?.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  
                  {selectedEvent.maxParticipants && (
                    <div className="mentorevents-participants-info">
                      <div className="mentorevents-participants-content">
                        <Users size={18} />
                        <span className="mentorevents-participants-text">
                          Max Participants: {selectedEvent.maxParticipants}
                        </span>
                        {selectedEvent.participants && (
                          <span className="mentorevents-participants-text">
                            | Registered: {selectedEvent.participants.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.requirements && selectedEvent.requirements.length > 0 && (
                    <div className="mentorevents-requirements">
                      <div className="mentorevents-modal-section-title">
                        <FileText size={16} />
                        Requirements
                      </div>
                      <ul className="mentorevents-requirements-text">
                        {selectedEvent.requirements.map((req, idx) => (
                          <li key={idx}>• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEvent.teams && selectedEvent.teams.length > 0 && (
                    <div>
                      <div className="mentorevents-modal-section-title">
                        <Users size={16} />
                        Teams Assigned
                      </div>
                      <div className="mentorevents-teams-grid">
                        {selectedEvent.teams.map((team, idx) => (
                          <div key={idx} className="mentorevents-team-item">
                            <span className="mentorevents-team-name">{team.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mentorevents-modal-footer">
                  <button
                    className="mentorevents-modal-close-btn"
                    onClick={() => setShowEventModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEventsView;
