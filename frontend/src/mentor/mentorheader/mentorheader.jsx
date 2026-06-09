import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { FaAngleDown } from 'react-icons/fa';
import './mentorheader.css';
import userheader from '../../assests/userheaderprojecticon.png';
import notification from '../../assests/notificationicon.png';
import chart from '../../assests/messageicon.png';
import profile from '../../assests/userprofileicon.png';
import config from '../../config';

// Ensure the token is included in the connection
const socket = io(`${config.backendUrl}`, {
  auth: {
    token: localStorage.getItem('token')
  }
});

const UserNavbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isResourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch initial notifications only once
  const fetchInitialNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter(notif => !notif.read).length);
    } catch (error) {
      console.error('Error fetching initial notifications:', error);
    }
  };

  useEffect(() => {
    fetchInitialNotifications();
    const token = localStorage.getItem('token');
    const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const userRole = decodedToken?.role;

    socket.on('newNotification', (notification) => {
      if (notification.targetAudience === 'all' || notification.targetAudience === `${userRole}s`) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      socket.off('newNotification');
    };
  }, []);

  const handleNotificationClick = async () => {
    navigate('/mentor/notifications');
    if (unreadCount > 0) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${config.backendUrl}/notifications/markAsRead`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUnreadCount(0);
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from local storage
    navigate('/login'); // Navigate to login page
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const toggleResourcesDropdown = () => setResourcesDropdownOpen(!isResourcesDropdownOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileResourcesDropdown = () => setMobileResourcesOpen(!isMobileResourcesOpen);
  const toggleProfileDropdown = () => setProfileDropdownOpen(!isProfileDropdownOpen);

  return (
    <nav className="user-navbar">
      <div
        className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={toggleMobileMenu}
        id="user-nav-icon3"
      >
        <span></span><span></span><span></span><span></span>
      </div>

      <div className="user-header-navbar-left">
        <div className="user-header-logo">
          <img src={userheader} alt="Logo" />
        </div>
        <ul className="nav-links">
          <li><a href="/mentor">Home</a></li>
          <li className="dropdown" onClick={toggleResourcesDropdown}>
            <a>Resources <FaAngleDown className="down-arrow" /></a>
            {isResourcesDropdownOpen && (
              <ul className="user-dropdown-menu">
                <a href="/mentor/videos"><li>Videos</li></a>
                <a href="/mentor/notes"><li>Notes</li></a>
                <a href="/mentor/sources"><li>Sources</li></a>
              </ul>
            )}
          </li>
          <li><a href="/mentor/tasks">TaskSubmission</a></li>
        </ul>
      </div>

      <div className="nav-icons">
        <div className="icon" onClick={handleNotificationClick}>
          <img src={notification} alt="Notification Icon" />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </div>
        <a href="/mentor/chat" className="icon"><img src={chart} alt="Chat Icon" /></a>
        <div className="profile-icon" onClick={toggleProfileDropdown}>
          <img src={profile} alt="Profile Icon" />
          {isProfileDropdownOpen && (
            <ul className="dropdown-menu">
              <li><a href="/mentor/profile">Profile</a></li>
              <li><a href="/mentor/team-formation">My Team</a></li>
              <li><a href="/mentor/github">Github</a></li>
              <li><a href="/mentor/calendar">Calendar</a></li>
              <li><a href="/mentor/leaderboard">Leaderboard</a></li>
              <li><a href="/mentor/teams">Team Formation</a></li>
              <li><a href="/mentor/mentorevents">Create Events</a></li>
              <li><a href="/mentor/mentorresources">Add Resources</a></li>
              <li><a href="/mentor/verify-certificate">verify certificate</a></li>
              {/* Updated Logout Menu Item */}
              <li onClick={handleLogout} className='logout'>Logout</li>
            </ul>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <ul className="mobile-menu">
          <li><a href="/user" onClick={closeMobileMenu}>Home</a></li>
          <li onClick={toggleMobileResourcesDropdown}>
            <a>Resources <FaAngleDown className="down-arrow" /></a>
            {isMobileResourcesOpen && (
              <ul className="mobile-dropdown-menu">
                <li><a href="/mentor/videos" onClick={closeMobileMenu}>Videos</a></li>
                <li><a href="/mentor/notes" onClick={closeMobileMenu}>Notes</a></li>
                <li><a href="/mentor/sources" onClick={closeMobileMenu}>Sources</a></li>
              </ul>
            )}
          </li>
          <li><a href="/mentor/tasks" onClick={closeMobileMenu}>TaskSubmission</a></li>
        </ul>
      )}
    </nav>
  );
};

export default UserNavbar;