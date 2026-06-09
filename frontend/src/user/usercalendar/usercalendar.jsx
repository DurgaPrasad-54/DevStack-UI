// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
// import './usercalendar.css'; // Ensure you import your CSS
// import config from '../../config';
// import LeaderboardComponent from '../../components/leaderboard/leaderboard';

// const CalendarUser = () => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [events, setEvents] = useState({});
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [event, setEvent] = useState({ title: '', description: '' });
//   const [errorMessage, setErrorMessage] = useState('');
//   const [userRole, setUserRole] = useState(''); // Will be populated from localStorage

//   useEffect(() => {
//     // Get user role from localStorage
//     const role = localStorage.getItem('userRole') || 'student';
//     setUserRole(role);
    
//     // Fetch events after setting role
//     if (role) {
//       fetchEvents();
//     }
//   }, []); // Run once on component mount

//   // Separate useEffect to refetch events when role changes
//   useEffect(() => {
//     if (userRole) {
//       fetchEvents();
//     }
//   }, [userRole]);

//   const fetchEvents = async () => {
//     try {
//       // Get the auth token from localStorage
//       const token = localStorage.getItem('authToken');
      
//       if (!token) {
//         setErrorMessage('Authentication token not found. Please log in again.');
//         return;
//       }
      
//       console.log('Fetching events for role:', userRole); // Debug log
      
//       const response = await axios.get('http://127.0.0.1:5000/api/events', {
//         headers: {
//           'Authorization': `Bearer ${token}` // Include auth token
//         }
//       });
      
//       console.log('Fetched events:', response.data); // Debug log
      
//       // The backend already filters events based on user role and auth token
//       // So we can directly use the response data
//       const fetchedEvents = response.data.reduce((acc, event) => {
//         const eventDate = new Date(event.date).toLocaleDateString('en-GB');
//         acc[eventDate] = {
//           title: event.title,
//           description: event.description,
//           meeting: event.meeting,
//           recipients: event.recipients
//         };
//         return acc;
//       }, {});

//       setEvents(fetchedEvents);
//       setErrorMessage(''); // Clear any previous errors
//     } catch (error) {
//       console.error('Error fetching events:', error);
//       if (error.response?.status === 401) {
//         setErrorMessage('Authentication failed. Please log in again.');
//       } else {
//         setErrorMessage('Failed to fetch events. Please try again later.');
//       }
//     }
//   };

//   const handleClose = () => {
//     setShowModal(false);
//     setSelectedDate(null);
//   };

//   const handleDateClick = (day) => {
//     const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
//     setSelectedDate(date);

//     const formattedDate = date.toLocaleDateString('en-GB');

//     if (events[formattedDate]) {
//       setEvent(events[formattedDate]);
//       setShowModal(true);
//     } else {
//       setEvent({ title: '', description: '', meeting: '', recipients: '' });
//       setShowModal(false);
//     }
//   };

//   const handlePrevMonth = () => {
//     setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
//   };

//   const handleNextMonth = () => {
//     setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
//   };

//   const handleDelete = async () => {
//     // Only allow admins and mentors to delete events
//     if (userRole !== 'admin' && userRole !== 'mentor') {
//       setErrorMessage('You do not have permission to delete events.');
//       return;
//     }

//     if (selectedDate) {
//       const formattedDate = selectedDate.toLocaleDateString('en-GB');

//       try {
//         const token = localStorage.getItem('authToken');
        
//         if (!token) {
//           setErrorMessage('Authentication token not found. Please log in again.');
//           return;
//         }
        
//         await axios.delete(`http://127.0.0.1:5000/api/events/${formattedDate}`, {
//           headers: {
//             'Authorization': `Bearer ${token}` // Include auth token
//           }
//         });
        
//         const updatedEvents = { ...events };
//         delete updatedEvents[formattedDate];
//         setEvents(updatedEvents);
//         handleClose();
//         setErrorMessage(''); // Clear any previous errors
//       } catch (error) {
//         console.error('Error deleting event:', error);
//         setErrorMessage('Failed to delete the event. Please try again later.');
//       }
//     }
//   };

//   const renderDays = () => {
//     const days = [];
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
//     const today = new Date();
//     const firstDayOfMonth = new Date(year, month, 1).getDay() - 1; // Monday as the first day
//     const totalDays = daysInMonth(year, month);

//     for (let i = 0; i < (firstDayOfMonth < 0 ? 6 : firstDayOfMonth); i++) {
//       days.push(<div key={`empty-${i}`} className="user-calendar-day empty"></div>);
//     }

//     for (let day = 1; day <= totalDays; day++) {
//       const date = new Date(year, month, day);
//       const formattedDate = date.toLocaleDateString('en-GB');
//       const hasEvent = !!events[formattedDate];
//       const isToday =
//         today.getFullYear() === year &&
//         today.getMonth() === month &&
//         today.getDate() === day;

//       days.push(
//         <div
//           key={day}
//           className={`user-calendar-day ${hasEvent ? 'has-event' : ''} ${
//             selectedDate && selectedDate.getDate() === day ? 'selected' : ''
//           } ${isToday ? 'current-day' : ''}`}
//           onClick={() => handleDateClick(day)}
//         >
//           {day}
//         </div>
//       );
//     }

//     return days;
//   };

//   const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

//   // Function to get role display name
//   const getRoleDisplayName = (role) => {
//     switch(role) {
//       case 'student': return 'Student';
//       case 'mentor': return 'Mentor';
//       case 'admin': return 'Admin';
//       default: return 'User';
//     }
//   };

//   return (
//     <div className='user-calendar-wrapper'>
//       <div className="user-calendar-container">
//         <div className="user-calendar-header">
//           <button onClick={handlePrevMonth}>
//             <IoIosArrowBack />
//           </button>
//           <h2 className='calender-h2'>
//             {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
//           </h2>
//           <button onClick={handleNextMonth}>
//             <IoIosArrowForward />
//           </button>
//         </div>

//         {/* Role indicator */}
//         <div className="user-role-indicator" style={{textAlign: 'center', marginBottom: '10px', fontSize: '14px', color: '#666'}}>
//           Viewing as: {getRoleDisplayName(userRole)}
//         </div>

//         <div className="user-calendar-grid">
//           <div className="user-calendar-day-name">MON</div>
//           <div className="user-calendar-day-name">TUE</div>
//           <div className="user-calendar-day-name">WED</div>
//           <div className="user-calendar-day-name">THU</div>
//           <div className="user-calendar-day-name">FRI</div>
//           <div className="user-calendar-day-name">SAT</div>
//           <div className="user-calendar-day-name">SUN</div>
//           {renderDays()}
//         </div>

//         {showModal && (
//           <div className="user-modal" onClick={handleClose}>
//             <div className="user-modal-content" onClick={(e) => e.stopPropagation()}>
//               <h3>
//                 Event for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
//               </h3>
//               <h4>{event.title}</h4>
//               <p>{event.description}</p>
//               {event.meeting && (
//                 <p><strong>Meeting Link:</strong> {event.meeting}</p>
//               )}
//               <p><strong>Target Audience:</strong> {event.recipients || 'all'}</p>
              
//               <div className="modal-buttons">
//                 <button onClick={handleClose} className="close-button" style={{ backgroundColor: 'grey', color: '#fff', border: 'none', marginRight: '10px' }}>
//                   Close
//                 </button>
//                 {(userRole === 'admin' || userRole === 'mentor') && (
//                   <button onClick={handleDelete} className="delete-button" style={{ backgroundColor: 'red', color: '#fff', border: 'none' }}>
//                     Delete Event
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {errorMessage && <div className="user-error-message" style={{color: 'red', textAlign: 'center', marginTop: '10px'}}>{errorMessage}</div>}
//       </div>

//       <LeaderboardComponent />
//     </div>
//   );
// };

// export default CalendarUser;