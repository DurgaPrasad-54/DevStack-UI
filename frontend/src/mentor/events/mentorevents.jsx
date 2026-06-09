import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import config from '../../config';
import './mentorevents.css'; // Import the custom CSS file

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    eventType: 'meeting',
    maxParticipants: '',
    requirements: ''
  });

  const eventTypes = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'competition', label: 'Competition' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Fetch events and teams on component mount
  useEffect(() => {
    fetchEvents();
    fetchTeams();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/mentorevents/my-events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
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

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/mentorevents/teams`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      eventTime: '',
      location: '',
      eventType: 'meeting',
      maxParticipants: '',
      requirements: ''
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${config.backendUrl}/mentorevents/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Event created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchEvents();
      } else {
        showMessage('error', data.message || 'Failed to create event');
      }
    } catch (error) {
      showMessage('error', 'Error creating event');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${config.backendUrl}/mentorevents/${selectedEvent._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Event updated successfully!');
        setShowEditModal(false);
        setSelectedEvent(null);
        resetForm();
        fetchEvents();
      } else {
        showMessage('error', data.message || 'Failed to update event');
      }
    } catch (error) {
      showMessage('error', 'Error updating event');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${config.backendUrl}/mentorevents/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Event deleted successfully!');
        fetchEvents();
      } else {
        showMessage('error', data.message || 'Failed to delete event');
      }
    } catch (error) {
      showMessage('error', 'Error deleting event');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      eventDate: new Date(event.eventDate).toISOString().split('T')[0],
      eventTime: event.eventTime,
      location: event.location,
      eventType: event.eventType,
      maxParticipants: event.maxParticipants || '',
      requirements: event.requirements || '',
      status: event.status
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'mentorevents-status-upcoming';
      case 'ongoing': return 'mentorevents-status-ongoing';
      case 'completed': return 'mentorevents-status-completed';
      case 'cancelled': return 'mentorevents-status-cancelled';
      default: return 'mentorevents-status-completed';
    }
  };

  return (
    <div className="mentorevents-container">
      <div className="mentorevents-wrapper">
        {/* Header */}
        <div className="mentorevents-header">
          <h1 className="mentorevents-title">Event Management</h1>
          <p className="mentorevents-subtitle">Manage events for your assigned teams</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mentorevents-message ${
            message.type === 'success' 
              ? 'mentorevents-message-success' 
              : 'mentorevents-message-error'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Create Event Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mentorevents-btn mentorevents-btn-primary"
          >
            <Plus size={20} />
            Create New Event
          </button>
        </div>

        {/* Team Summary */}
        {teams.length > 0 && (
          <div className="mentorevents-teams-summary">
            <h3 className="mentorevents-teams-title">
              <Users size={20} />
              Your Assigned Teams
            </h3>
            <div className="mentorevents-teams-grid">
              {teams.map(team => (
                <div key={team._id} className="mentorevents-team-card">
                  <h4 className="mentorevents-team-name">{team.name}</h4>
                  <p className="mentorevents-team-students">{team.students?.length || 0} students</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="mentorevents-loading">
            <div className="mentorevents-spinner"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="mentorevents-empty">
            <Calendar size={64} className="mentorevents-empty-icon" />
            <h3 className="mentorevents-empty-title">No Events Yet</h3>
            <p className="mentorevents-empty-text">Create your first event to get started!</p>
          </div>
        ) : (
          <div className="mentorevents-grid">
            {events.map(event => (
              <div key={event._id} className="mentorevents-card">
                <div className="mentorevents-card-content">
                  <div className="mentorevents-card-header">
                    <h3 className="mentorevents-card-title">{event.title}</h3>
                    <span className={`mentorevents-status ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <p className="mentorevents-card-description">{event.description}</p>
                  
                  <div className="mentorevents-card-details">
                    <div className="mentorevents-card-detail">
                      <Calendar size={16} />
                      {formatDate(event.eventDate)}
                    </div>
                    <div className="mentorevents-card-detail">
                      <Clock size={16} />
                      {event.eventTime}
                    </div>
                    <div className="mentorevents-card-detail">
                      <MapPin size={16} />
                      {event.location}
                    </div>
                    <div className="mentorevents-card-detail">
                      <Users size={16} />
                      {event.assignedTeams?.length || 0} teams assigned
                    </div>
                  </div>
                  
                  <div className="mentorevents-card-footer">
                    <span className="mentorevents-event-type">
                      {event.eventType}
                    </span>
                    <div className="mentorevents-card-actions">
                      <button
                        onClick={() => openEditModal(event)}
                        className="mentorevents-btn-icon mentorevents-btn-edit"
                        title="Edit Event"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="mentorevents-btn-icon mentorevents-btn-delete"
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="mentorevents-modal-overlay">
            <div className="mentorevents-modal">
              <div className="mentorevents-modal-content">
                <div className="mentorevents-modal-header">
                  <h2 className="mentorevents-modal-title">Create New Event</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="mentorevents-modal-close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="mentorevents-form">
                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Event Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="mentorevents-input"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="mentorevents-textarea"
                      placeholder="Describe your event"
                    />
                  </div>

                  <div className="mentorevents-form-grid">
                    <div className="mentorevents-form-group">
                      <label className="mentorevents-label">Event Date</label>
                      <input
                        type="date"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleInputChange}
                        required
                        className="mentorevents-input"
                      />
                    </div>

                    <div className="mentorevents-form-group">
                      <label className="mentorevents-label">Event Time</label>
                      <input
                        type="time"
                        name="eventTime"
                        value={formData.eventTime}
                        onChange={handleInputChange}
                        required
                        className="mentorevents-input"
                      />
                    </div>
                  </div>

                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="mentorevents-input"
                      placeholder="Event location"
                    />
                  </div>

                  <div className="mentorevents-form-grid">
                    <div className="mentorevents-form-group">
                      <label className="mentorevents-label">Event Type</label>
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleInputChange}
                        className="mentorevents-select"
                      >
                        {eventTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mentorevents-form-group">
                      <label className="mentorevents-label">Max Participants (Optional)</label>
                      <input
                        type="number"
                        name="maxParticipants"
                        value={formData.maxParticipants}
                        onChange={handleInputChange}
                        className="mentorevents-input"
                        placeholder="No limit"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Requirements (Optional)</label>
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleInputChange}
                      rows="2"
                      className="mentorevents-textarea"
                      placeholder="Any specific requirements for attendees"
                    />
                  </div>

                  <div className="mentorevents-form-actions">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="mentorevents-btn mentorevents-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mentorevents-btn mentorevents-btn-primary"
                    >
                      {loading ? (
                        <>
                          <div className="mentorevents-spinner-small"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Create Event
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditModal && (
          <div className="mentorevents-modal-overlay">
            <div className="mentorevents-modal">
              <div className="mentorevents-modal-content">
                <div className="mentorevents-modal-header">
                  <h2 className="mentorevents-modal-title">Edit Event</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="mentorevents-modal-close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleEditEvent} className="mentorevents-form">
                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Event Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="mentorevents-input"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="mentorevents-textarea"
                      placeholder="Describe your event"
                    />
                  </div>

                  <div className="mentorevents-form-grid">
                    <div className="mentorevents-form-group">
                      <label className="mentorevents-label">Event Date</label>
                      <input
                        type="date"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleInputChange}
                        required
                        className="mentorevents-input"
                      />
                    </div>

                    <div className="mentorevents-form-group">
                      <label className="mentorevents-label">Event Time</label>
                      <input
                        type="time"
                        name="eventTime"
                        value={formData.eventTime}
                        onChange={handleInputChange}
                        required
                        className="mentorevents-input"
                      />
                    </div>
                  </div>

                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="mentorevents-input"
                      placeholder="Event location"
                    />
                  </div>

                  <div className="mentorevents-form-grid">
                    <div className="mentorevents-form-group">
                      <label className="mentorevents-label">Event Type</label>
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleInputChange}
                        className="mentorevents-select"
                      >
                        {eventTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mentorevents-form-group">
                      <label className="mentorevents-label">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="mentorevents-select"
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Max Participants (Optional)</label>
                    <input
                      type="number"
                      name="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      className="mentorevents-input"
                      placeholder="No limit"
                      min="1"
                    />
                  </div>

                  <div className="mentorevents-form-group">
                    <label className="mentorevents-label">Requirements (Optional)</label>
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleInputChange}
                      rows="2"
                      className="mentorevents-textarea"
                      placeholder="Any specific requirements for attendees"
                    />
                  </div>

                  <div className="mentorevents-form-actions">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="mentorevents-btn mentorevents-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mentorevents-btn mentorevents-btn-primary"
                    >
                      {loading ? (
                        <>
                          <div className="mentorevents-spinner-small"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Update Event
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;