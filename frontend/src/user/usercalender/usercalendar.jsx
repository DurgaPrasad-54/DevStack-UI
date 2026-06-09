import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IoIosArrowBack, IoIosArrowForward, IoIosClose } from 'react-icons/io';
import './usercalendar.css'; // Ensure you import your CSS
import config from '../../config';
import LeaderboardComponent from '../../components/leaderboard/leaderboard';

const CalendarUser = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0); // Track current event in modal
  const [errorMessage, setErrorMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 426);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'year', or 'years'
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Get user role from localStorage
    const storedRole = localStorage.getItem('userRole');
    setUserRole(storedRole || 'all');

    const fetchEvents = async () => {
      try {
        // Create authorization header if needed
        const token = localStorage.getItem('token'); // Assuming you store auth token
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${config.backendUrl}/api/events`, {
          headers
        });

        // Filter events based on user role on the frontend as well
        const filteredEvents = response.data.filter(event => {
          if (!storedRole) return event.recipients === 'all';
          
          if (storedRole === 'student') {
            return event.recipients === 'all' || event.recipients === 'student';
          } else if (storedRole === 'mentor') {
            return event.recipients === 'all' || event.recipients === 'mentor';
          } else if (storedRole === 'admin') {
            return event.recipients === 'all' || event.recipients === 'admin';
          } else {
            return event.recipients === 'all';
          }
        });

        // Group events by date - now supporting multiple events per date
        const fetchedEvents = filteredEvents.reduce((acc, event) => {
          const eventDate = new Date(event.date).toLocaleDateString('en-GB');
          
          if (!acc[eventDate]) {
            acc[eventDate] = [];
          }
          
          acc[eventDate].push({
            title: event.title,
            description: event.description,
            meeting: event.meeting || '',
            recipients: event.recipients,
            id: event.id || event._id // Include event ID for deletion
          });
          
          return acc;
        }, {});

        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setErrorMessage('Failed to fetch events. Please try again later.');
      }
    };

    fetchEvents();

    // Add resize listener to detect mobile view
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 426);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    setSelectedDate(null);
    setCurrentEventIndex(0);
  };

  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const formattedDate = date.toLocaleDateString('en-GB');

    if (events[formattedDate] && events[formattedDate].length > 0) {
      setSelectedDate(date);
      setCurrentEventIndex(0); // Start with the first event
      setShowModal(true);
    } else {
      setSelectedDate(null);
      setCurrentEventIndex(0);
      setShowModal(false);
    }
  };

  // Navigate to previous event on the same date
  const handlePrevEvent = () => {
    const formattedDate = selectedDate.toLocaleDateString('en-GB');
    const dateEvents = events[formattedDate];
    
    if (dateEvents && dateEvents.length > 1) {
      setCurrentEventIndex(prev => 
        prev === 0 ? dateEvents.length - 1 : prev - 1
      );
    }
  };

  // Navigate to next event on the same date
  const handleNextEvent = () => {
    const formattedDate = selectedDate.toLocaleDateString('en-GB');
    const dateEvents = events[formattedDate];
    
    if (dateEvents && dateEvents.length > 1) {
      setCurrentEventIndex(prev => 
        prev === dateEvents.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  };

  const handlePrevYears = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 20, currentDate.getMonth(), 1));
  };

  const handleNextYears = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 20, currentDate.getMonth(), 1));
  };

  // Navigate between views
  const handleHeaderClick = () => {
    if (viewMode === 'month') {
      setViewMode('years'); // Show years range directly when clicking on the header from month view
    } else if (viewMode === 'year') {
      setViewMode('years'); // From year view to years view
    } else {
      setViewMode('month'); // From years view back to month view
    }
  };

  // Handle year selection in years view
  const handleYearSelect = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setViewMode('year'); // Show months of the selected year
  };

  // Handle month selection in year view
  const handleMonthSelect = (month) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    setViewMode('month'); // Switch back to month view after selecting a month
  };

  const handleDelete = async () => {
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('en-GB');
      const dateEvents = events[formattedDate];
      const currentEvent = dateEvents[currentEventIndex];

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Delete specific event by ID if available
        await axios.delete(`${config.backendUrl}/api/events/${currentEvent.id || formattedDate}`, {
          headers
        });
        
        const updatedEvents = { ...events };
        
        // Remove the specific event from the date's events array
        updatedEvents[formattedDate] = dateEvents.filter((_, index) => index !== currentEventIndex);
        
        // If no events left for this date, remove the date entry
        if (updatedEvents[formattedDate].length === 0) {
          delete updatedEvents[formattedDate];
        }
        
        setEvents(updatedEvents);
        
        // If there are still events for this date, adjust current index
        if (updatedEvents[formattedDate] && updatedEvents[formattedDate].length > 0) {
          const newIndex = currentEventIndex >= updatedEvents[formattedDate].length 
            ? updatedEvents[formattedDate].length - 1 
            : currentEventIndex;
          setCurrentEventIndex(newIndex);
        } else {
          handleClose();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        setErrorMessage('Failed to delete the event. Please try again later.');
      }
    }
  };

  const renderDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const firstDayOfMonth = new Date(year, month, 1).getDay() - 1; // Monday as the first day
    const totalDays = daysInMonth(year, month);

    for (let i = 0; i < (firstDayOfMonth < 0 ? 6 : firstDayOfMonth); i++) {
      days.push(<div key={`empty-${i}`} className="usercld-day empty"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const formattedDate = date.toLocaleDateString('en-GB');
      const dateEvents = events[formattedDate];
      const notificationCount = dateEvents ? dateEvents.length : 0;
      const hasEvent = notificationCount > 0;
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day;

      days.push(
        <div
          key={day}
          className={`usercld-day ${hasEvent ? 'usercld-has-event' : ''} ${
            selectedDate && selectedDate.getDate() === day ? 'usercld-selected' : ''
          } ${isToday ? 'usercld-current-day' : ''}`}
          onClick={() => handleDateClick(day)}
          style={{ position: 'relative' }}
        >
          {day}
          {/* Notification badge showing number of events */}
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
              className="usercld-notification-badge"
            >
              {notificationCount}
            </span>
          )}
        </div>
      );
    }

    return days;
  };

  const renderMonths = () => {
    const months = [];
    const monthNames = [
      'January', 'February', 'March', 'April',
      'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December'
    ];
    
    // Check if any month has events
    const hasEventInMonth = (month) => {
      const year = currentDate.getFullYear();
      const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInCurrentMonth; day++) {
        const date = new Date(year, month, day);
        const formattedDate = date.toLocaleDateString('en-GB');
        if (events[formattedDate]) {
          return true;
        }
      }
      return false;
    };

    // Today's month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (let i = 0; i < 12; i++) {
      const hasEvent = hasEventInMonth(i);
      const isCurrentMonth = i === currentMonth && currentDate.getFullYear() === currentYear;
      
      months.push(
        <div
          key={i}
          className={`usercld-month ${hasEvent ? 'usercld-has-event' : ''} ${
            isCurrentMonth ? 'usercld-current-month' : ''
          }`}
          onClick={() => handleMonthSelect(i)}
        >
          {monthNames[i]}
        </div>
      );
    }

    return months;
  };

  const renderYears = () => {
    const years = [];
    const currentYear = currentDate.getFullYear();
    const startYear = currentYear - 15;
    const endYear = currentYear + 15;
    const thisYear = new Date().getFullYear();
    
    // Check if any month in the year has events
    const hasEventInYear = (year) => {
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const formattedDate = date.toLocaleDateString('en-GB');
          if (events[formattedDate]) {
            return true;
          }
        }
      }
      return false;
    };
    
    for (let year = startYear; year <= endYear; year++) {
      const hasEvent = hasEventInYear(year);
      const isCurrentYear = year === thisYear;
      
      years.push(
        <div
          key={year}
          className={`usercld-year ${hasEvent ? 'usercld-has-event' : ''} ${
            isCurrentYear ? 'usercld-current-year' : ''
          }`}
          onClick={() => handleYearSelect(year)}
        >
          {year}
        </div>
      );
    }
    
    return years;
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // Get current event data for the modal
  const getCurrentEvent = () => {
    if (!selectedDate) return null;
    const formattedDate = selectedDate.toLocaleDateString('en-GB');
    const dateEvents = events[formattedDate];
    return dateEvents && dateEvents[currentEventIndex] ? dateEvents[currentEventIndex] : null;
  };

  const getCurrentDateEvents = () => {
    if (!selectedDate) return [];
    const formattedDate = selectedDate.toLocaleDateString('en-GB');
    return events[formattedDate] || [];
  };

  return (
    <div className='usercld-calendar-leader'>
      <div className='usercld-wrapper'>
        <div className="usercld-container">
          <div className="usercld-header">
            <button 
              onClick={
                viewMode === 'month' 
                  ? handlePrevMonth 
                  : viewMode === 'year' 
                    ? handlePrevYear 
                    : handlePrevYears
              } 
              className="usercld-button"
            >
              <IoIosArrowBack />
            </button>
            <h2 
              className='usercld-h2' 
              onClick={handleHeaderClick} 
              style={{ cursor: 'pointer' }}
            >
              {viewMode === 'month' ? (
                <>
                  {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                </>
              ) : viewMode === 'year' ? (
                <>{currentDate.getFullYear()}</>
              ) : (
                <>Years {currentDate.getFullYear() - 10} - {currentDate.getFullYear() + 10}</>
              )}
            </h2>
            <button 
              onClick={
                viewMode === 'month' 
                  ? handleNextMonth 
                  : viewMode === 'year' 
                    ? handleNextYear 
                    : handleNextYears
              } 
              className="usercld-button"
            >
              <IoIosArrowForward />
            </button>
          </div>

          {viewMode === 'month' ? (
            // Month view
            <div className="usercld-grid">
              <div className="usercld-day-name">MON</div>
              <div className="usercld-day-name">TUE</div>
              <div className="usercld-day-name">WED</div>
              <div className="usercld-day-name">THU</div>
              <div className="usercld-day-name">FRI</div>
              <div className="usercld-day-name">SAT</div>
              <div className="usercld-day-name">SUN</div>
              {renderDays()}
            </div>
          ) : viewMode === 'year' ? (
            // Year view with months
            <div className="usercld-year-grid">
              {renderMonths()}
            </div>
          ) : (
            // Years view with a range of years
            <div className="usercld-years-grid">
              {renderYears()}
            </div>
          )}

          {showModal && getCurrentEvent() && (
            <div className="usercld-modal" onClick={handleClose}>
              <div className="usercld-modal-content" onClick={(e) => e.stopPropagation()}>
                {!isMobile && (
                  <button 
                    onClick={handleClose} 
                    className="usercld-close-button-top"
                  >
                    close
                  </button>
                )}
                
                {/* Event navigation header */}
                <div className="usercld-modal-header" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #eee'
                }}>
                  <h3 className="usercld-modal-title" style={{ margin: 0, flex: 1 }}>
                    Event for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  
                  
                </div>

                <h4 className="usercld-modal-subtitle">{getCurrentEvent().title}</h4>
                <p className="usercld-modal-description">{getCurrentEvent().description}</p>
                
                {/* Show meeting info if available */}
                {getCurrentEvent().meeting && (
                  <div className="usercld-modal-meeting">
                    <strong>Meeting: </strong><a href={getCurrentEvent().meeting} target="_blank" rel="noopener noreferrer">{getCurrentEvent().meeting}</a>
                  </div>
                )}
                {/* Event counter and navigation */}
                  {getCurrentDateEvents().length > 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      color: '#666',
                      marginTop: '10px'
                    }}>
                      <button 
                        onClick={handlePrevEvent}
                        className="usercld-button"
                        style={{
                          padding: '5px 8px',
                          fontSize: '12px',
                          minWidth: 'auto'
                        }}
                      >
                        <IoIosArrowBack />
                      </button>
                      
                      <span style={{ minWidth: '50px', textAlign: 'center' }}>
                        {currentEventIndex + 1} of {getCurrentDateEvents().length}
                      </span>
                      
                      <button 
                        onClick={handleNextEvent}
                        className="usercld-button"
                        style={{
                          padding: '5px 8px',
                          fontSize: '12px',
                          minWidth: 'auto'
                        }}
                      >
                        <IoIosArrowForward />
                      </button>
                    </div>
                  )}
                
                {/* Show event recipients for admins */}
                {userRole === 'admin' && getCurrentEvent().recipients && (
                  <div className="usercld-modal-recipients" style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '10px' 
                  }}>
                    Target: {getCurrentEvent().recipients}
                  </div>
                )}
              
                {isMobile && (
                  <button onClick={handleClose} className="usercld-close-button-bottom">
                    Close
                  </button>
                )}
              </div>
            </div>
          )}

          {errorMessage && <div className="usercld-error-message">{errorMessage}</div>}
        </div>
      </div>
      <LeaderboardComponent />
    </div>
  );
};

export default CalendarUser;