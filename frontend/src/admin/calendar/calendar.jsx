import React, { useState, useEffect } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import axios from 'axios';
import './calendar.css';
import config from '../../config';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({}); // Now stores arrays of events per date
  const [selectedEvents, setSelectedEvents] = useState([]); // Events for selected date
  const [event, setEvent] = useState({ 
    title: '', 
    description: '', 
    meeting: '', 
    recipients: 'all' 
  });
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [showCalendar] = useState(true);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [userRole, setUserRole] = useState('');

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // Get user role from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await fetch(`${config.backendUrl}/api/events/admin`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        
        // Group events by date
        const eventsByDate = data.reduce((acc, event) => {
          const date = event.date;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push({
            id: event._id,
            title: event.title,
            description: event.description,
            meeting: event.meeting || '',
            recipients: event.recipients || 'all',
            createdByRole: event.createdByRole || 'admin'
          });
          return acc;
        }, {});
        
        setEvents(eventsByDate);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    const formattedDate = date.toDateString();
    const dayEvents = events[formattedDate] || [];

    setSelectedEvents(dayEvents);
    
    if (dayEvents.length > 0) {
      // Show first event by default
      setEvent(dayEvents[0]);
      setCurrentEventIndex(0);
      setIsEditing(false);
      setIsNewEvent(false);
    } else {
      // No events, prepare for new event
      setEvent({ title: '', description: '', meeting: '', recipients: 'all' });
      setCurrentEventIndex(0);
      setIsEditing(true);
      setIsNewEvent(true);
    }

    setValidationErrors({});
    setShowModal(true);
  };

  const handleEventNavigation = (direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(currentEventIndex + 1, selectedEvents.length - 1)
      : Math.max(currentEventIndex - 1, 0);
    
    setCurrentEventIndex(newIndex);
    setEvent(selectedEvents[newIndex]);
    setIsEditing(false);
    setValidationErrors({});
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEvent((prevEvent) => ({ ...prevEvent, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!event.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!event.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (selectedDate) {
      const formattedDate = selectedDate.toDateString();
      const token = localStorage.getItem('token');

      try {
        let response;
        
        if (isNewEvent) {
          // Create new event
          response = await axios.post(
            `${config.backendUrl}/api/events`, // <-- FIXED: use parentheses, not backticks after axios.post
            {
              date: formattedDate,
              title: event.title,
              description: event.description,
              meeting: event.meeting,
              recipients: event.recipients,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          // Add new event to the events state
          const newEvent = {
            id: response.data._id,
            title: response.data.title,
            description: response.data.description,
            meeting: response.data.meeting,
            recipients: response.data.recipients,
            createdByRole: response.data.createdByRole || userRole
          };
          
          setEvents((prevEvents) => {
            const dateEvents = prevEvents[formattedDate] || [];
            return {
              ...prevEvents,
              [formattedDate]: [...dateEvents, newEvent]
            };
          });
          
          setSelectedEvents(prev => [...prev, newEvent]);
          setCurrentEventIndex(selectedEvents.length);
          
        } else {
          // Update existing event
          response = await axios.put(`${config.backendUrl}/api/events/${event.id}`, {
            title: event.title,
            description: event.description,
            meeting: event.meeting,
            recipients: event.recipients,
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          // Update event in state
          const updatedEvent = {
            ...event,
            title: response.data.title,
            description: response.data.description,
            meeting: response.data.meeting,
            recipients: response.data.recipients,
          };
          
          setEvents((prevEvents) => {
            const dateEvents = prevEvents[formattedDate] || [];
            const updatedEvents = dateEvents.map(evt => 
              evt.id === event.id ? updatedEvent : evt
            );
            return {
              ...prevEvents,
              [formattedDate]: updatedEvents
            };
          });
          
          setSelectedEvents(prev => 
            prev.map(evt => evt.id === event.id ? updatedEvent : evt)
          );
        }

        setIsEditing(false);
        setIsNewEvent(false);
        
      } catch (error) {
        console.error('Error saving event:', error);
        
        if (error.response && error.response.data && error.response.data.errors) {
          setValidationErrors(error.response.data.errors);
        } else if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert('Failed to save event. Please try again.');
        }
      }
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedDate(null);
    setSelectedEvents([]);
    setCurrentEventIndex(0);
    setIsNewEvent(false);
    setValidationErrors({});
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsNewEvent(false);
    setValidationErrors({});
  };

  const handleAddNew = () => {
    setEvent({ title: '', description: '', meeting: '', recipients: 'all' });
    setIsEditing(true);
    setIsNewEvent(true);
    setValidationErrors({});
  };

  const handleDelete = async () => {
    if (selectedDate && event.id) {
      const formattedDate = selectedDate.toDateString();
      const token = localStorage.getItem('token');
      
      try {
        await axios.delete(`${config.backendUrl}/api/events/${event.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Remove event from state
        setEvents((prevEvents) => {
          const dateEvents = prevEvents[formattedDate] || [];
          const filteredEvents = dateEvents.filter(evt => evt.id !== event.id);
          
          if (filteredEvents.length === 0) {
            const newEvents = { ...prevEvents };
            delete newEvents[formattedDate];
            return newEvents;
          }
          
          return {
            ...prevEvents,
            [formattedDate]: filteredEvents
          };
        });
        
        const updatedSelectedEvents = selectedEvents.filter(evt => evt.id !== event.id);
        setSelectedEvents(updatedSelectedEvents);
        
        if (updatedSelectedEvents.length === 0) {
          handleClose();
        } else {
          const newIndex = Math.min(currentEventIndex, updatedSelectedEvents.length - 1);
          setCurrentEventIndex(newIndex);
          setEvent(updatedSelectedEvents[newIndex]);
        }
        
      } catch (error) {
        console.error('Error deleting event:', error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert('Failed to delete event. Please try again.');
        }
      }
    }
  };

  const toggleYearMonthSelector = () => {
    setShowYearSelector(true);
    setShowMonthSelector(false);
  };

  const handleYearChange = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setShowYearSelector(false);
    setShowMonthSelector(true);
  };

  const handleMonthChange = (month) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    setShowMonthSelector(false);
  };

  const renderMeetingLink = (meeting) => {
    if (!meeting) return null;
    if (meeting.startsWith('http')) {
      return (
        <a
          href={meeting}
          target="_blank"
          rel="noopener noreferrer"
          className="cld-meeting-link"
          onClick={(e) => e.stopPropagation()}
        >
          {meeting}
        </a>
      );
    }
    return <span>{meeting}</span>;
  };

  const canEditEvents = userRole === 'admin' || userRole === 'mentor';

  const renderDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = daysInMonth(year, month);

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="cld-day empty"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const formattedDate = date.toDateString();
      const dayEvents = events[formattedDate] || [];
      const notificationCount = Array.isArray(dayEvents) ? dayEvents.length : (dayEvents ? 1 : 0);
      const hasEvent = notificationCount > 0;

      const isToday = 
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day;

      days.push(
        <div
          key={day}
          className={`cld-day ${hasEvent ? 'cld-has-event' : ''} ${
            selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month ? 'cld-selected' : ''
          } ${isToday ? 'cld-current-day' : ''}`}
          onClick={() => handleDateClick(day)}
          style={{ position: 'relative' }}
        >
          {day}
          {/* Notification badge at the top-right of the day */}
          {notificationCount > 1 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 6,
                background: '#e11d48',
                color: 'white',
                borderRadius: '50%',
                minWidth: 18,
                height: 18,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                border: '1.5px solid #fff',
                zIndex: 2,
                padding: '0 5px'
              }}
              className="cld-notification-badge"
            >
              {notificationCount}
            </span>
          )}
        </div>
      );
    }

    return days;
  };

  const renderYearSelector = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = currentYear; i <= currentYear + 20; i++) {
      years.push(
        <div key={i} className="cld-year-option" onClick={() => handleYearChange(i)}>
          {i}
        </div>
      );
    }
    return years;
  };

  const renderMonthSelector = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return months.map((month, index) => (
      <div key={index} className="cld-month-option" onClick={() => handleMonthChange(index)}>
        {month}
      </div>
    ));
  };

  return (
    <div className="cld-wrapper">
      <div className="cld-container">
        {showCalendar && (
          <>
            <div className="cld-header">
              <button onClick={handlePrevMonth} className="cld-btn">
                <IoIosArrowBack />
              </button>
              <h2 onClick={toggleYearMonthSelector}>
                {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
              </h2>
              <button onClick={handleNextMonth} className="cld-btn">
                <IoIosArrowForward />
              </button>
            </div>

            {showYearSelector && <div className="cld-year-selector">{renderYearSelector()}</div>}
            {showMonthSelector && <div className="cld-month-selector">{renderMonthSelector()}</div>}
            {!showYearSelector && !showMonthSelector && (
              <div className="cld-grid">
                <div className="cld-day-name">MON</div>
                <div className="cld-day-name">TUE</div>
                <div className="cld-day-name">WED</div>
                <div className="cld-day-name">THU</div>
                <div className="cld-day-name">FRI</div>
                <div className="cld-day-name">SAT</div>
                <div className="cld-day-name">SUN</div>
                {renderDays()}
              </div>
            )}
          </>
        )}
        {showModal && (
          <div className="cld-modal" onClick={handleClose}>
            <div className="cld-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>
                Events for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              
              {/* Event Navigation */}
              {selectedEvents.length > 0 && !isEditing && (
                <div className="cld-event-navigation">
                  <button 
                    onClick={() => handleEventNavigation('prev')} 
                    disabled={currentEventIndex === 0}
                    className="cld-nav-btn"
                  >
                    ←
                  </button>
                  <span className="cld-event-counter">
                    {currentEventIndex + 1} of {selectedEvents.length}
                  </span>
                  <button 
                    onClick={() => handleEventNavigation('next')} 
                    disabled={currentEventIndex === selectedEvents.length - 1}
                    className="cld-nav-btn"
                  >
                    →
                  </button>
                </div>
              )}

              {isEditing && canEditEvents ? (
                <>
                  <div className="cld-form-group">
                    <label className="cld-input-label">Event Title<span className="cld-required">*</span></label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter event title"
                      value={event.title}
                      onChange={handleEventChange}
                      className={validationErrors.title ? 'cld-input-error' : 'cld-input'}
                    />
                    {validationErrors.title && <div className="cld-error-message">{validationErrors.title}</div>}
                  </div>
                  
                  <div className="cld-form-group">
                    <label className="cld-input-label">Event Description<span className="cld-required">*</span></label>
                    <textarea
                      className={`cld-description ${validationErrors.description ? 'cld-input-error' : ''}`}
                      name="description"
                      placeholder="Enter event description"
                      value={event.description}
                      onChange={handleEventChange}
                    ></textarea>
                    {validationErrors.description && <div className="cld-error-message">{validationErrors.description}</div>}
                  </div>

                  <div className="cld-form-group">
                    <label className="cld-input-label">Meeting Link/Details</label>
                    <input
                      type="text"
                      name="meeting"
                      placeholder="Enter meeting link or details (e.g., https://zoom.us/...)"
                      value={event.meeting}
                      onChange={handleEventChange}
                      className="cld-input"
                    />
                  </div>

                  <div className="cld-form-group">
                    <label className="cld-input-label">Recipients</label>
                    <select
                      name="recipients"
                      value={event.recipients}
                      onChange={handleEventChange}
                      className="cld-select"
                    >
                      <option value="all">All</option>
                      <option value="student">Students</option>
                      <option value="mentor">Mentors</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                  
                  <div className="cld-button-group">
                    <button
                      onClick={handleSave}
                      className="cld-save-button cld-btn"
                      style={{ backgroundColor: '#0056b3', color: 'white' }}
                    >
                      {isNewEvent ? 'Create' : 'Update'}
                    </button>
                    <button
                      onClick={handleClose}
                      className="cld-cancel-button cld-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {selectedEvents.length > 0 ? (
                    <div className="cld-event-details">
                      <div className="cld-event-header">
                        <h4>{event.title}</h4>
                      </div>
                      <p>{event.description}</p>
                      {event.meeting && (
                        <div className="cld-meeting-section">
                          <strong>Meeting: </strong>
                          {renderMeetingLink(event.meeting)}
                        </div>
                      )}
                      <div className="cld-recipients-section">
                        <strong>For: </strong>
                        <span className="cld-recipients-badge">{event.recipients}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="cld-no-events">
                      <p>No events scheduled for this date.</p>
                    </div>
                  )}
                  
                  <div className="cld-button-group">
                    {canEditEvents && (
                      <>
                        {selectedEvents.length > 0 && (
                          <>
                            <button
                              onClick={handleEdit}
                              className="cld-edit-button cld-btn"
                              style={{ backgroundColor: '#0056b3', color: 'white' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={handleDelete}
                              className="cld-delete-button cld-btn"
                              style={{ backgroundColor: '#dc3545', color: 'white' }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        <button
                          onClick={handleAddNew}
                          className="cld-add-button cld-btn"
                          style={{ backgroundColor: '#28a745', color: 'white' }}
                        >
                          Add New Event
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleClose}
                      className="cld-close-button cld-btn"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;