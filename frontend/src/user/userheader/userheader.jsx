import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { FaAngleDown } from 'react-icons/fa';
import './userheader.css';
import userheader from '../../assests/userheaderprojecticon.png';
import notification from '../../assests/notificationicon.png';
import chart from '../../assests/messageicon.png';
import profile from '../../assests/userprofileicon.png';
import config from '../../config';
import { StarOutlined } from '@ant-design/icons';

const socket = io(`${config.backendUrl}`, {
  auth: {
    token: localStorage.getItem('token'),
  },
});

const UserNavbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isResourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [isAssignmentsDropdownOpen, setAssignmentsDropdownOpen] =
    useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [isMobileAssignmentsOpen, setMobileAssignmentsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchInitialNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((notif) => !notif.read).length);
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
      if (
        notification.targetAudience === 'all' ||
        notification.targetAudience === `${userRole}s`
      ) {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off('newNotification');
    };
  }, []);

  const handleNotificationClick = async () => {
    navigate('/user/notifications');
    if (unreadCount > 0) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${config.backendUrl}/notifications/markAsRead`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUnreadCount(0);
        setNotifications(
          notifications.map((notif) => ({ ...notif, read: true }))
        );
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const toggleResourcesDropdown = () =>
    setResourcesDropdownOpen(!isResourcesDropdownOpen);
  const toggleAssignmentsDropdown = () =>
    setAssignmentsDropdownOpen(!isAssignmentsDropdownOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileResourcesDropdown = () =>
    setMobileResourcesOpen(!isMobileResourcesOpen);
  const toggleMobileAssignmentsDropdown = () =>
    setMobileAssignmentsOpen(!isMobileAssignmentsOpen);
  const toggleProfileDropdown = () =>
    setProfileDropdownOpen(!isProfileDropdownOpen);

  return (
    <nav className="user-navbar">
      <div
        className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={toggleMobileMenu}
        id="user-nav-icon3"
      >
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="user-header-navbar-left">
        <div className="user-header-logo">
          <img src={userheader} alt="Logo" />
        </div>
        <ul className="nav-links">
          <li>
            <a href="/user">Home</a>
          </li>
          <li className="dropdown">
            <a onClick={toggleResourcesDropdown}>
              Resources <FaAngleDown className="down-arrow" />
            </a>
            <ul
              className={`user-dropdown-menu ${
                isResourcesDropdownOpen ? 'show' : ''
              }`}
            >
              <li>
                <a href="/user/videos">Videos</a>
              </li>
              <li>
                <a href="/user/notes">Notes</a>
              </li>
              <li>
                <a href="/user/sources">Sources</a>
              </li>
            </ul>
          </li>
          <li className="dropdown">
            <a onClick={toggleAssignmentsDropdown}>
              Assignments <FaAngleDown className="down-arrow" />
            </a>
            <ul
              className={`user-dropdown-menu ${
                isAssignmentsDropdownOpen ? 'show' : ''
              }`}
            >
              <li>
                <a href="/user/assignments">Quizzes</a>
              </li>
              <li>
                <a href="/user/tasks">Tasks</a>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <div className="nav-icons">
        <div className="icon" onClick={handleNotificationClick}>
          <img src={notification} alt="Notification Icon" />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>
        <a href="/user/chat" className="icon">
          <img src={chart} alt="Chat Icon" />
        </a>
        <div className="profile-icon" onClick={toggleProfileDropdown}>
          <img src={profile} alt="Profile Icon" />
          {isProfileDropdownOpen && (
            <ul className="dropdown-menu">
              <li>
                <a href="/user/profile">Profile</a>
              </li>
              <li>
                <a href="/user/teams">My Team</a>
              </li>
              <li>
                <a href="/user/grades">Grades</a>
              </li>
              <li>
                <a href="/user/calendar">Calendar</a>
              </li>
              <li>
                <a href="/user/leaderboard">Leaderboard</a>
              </li>
              <li>
                <a href="/user/view-certificate">Certificate</a>
              </li>
              <li>
                <a href="/user/mentorevents">Events</a>
              </li>
              <li>
                <a href="/user/feedback">Mentor Feedback</a>
              </li>
              <li onClick={handleLogout} className="logout">
                Logout
              </li>
            </ul>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <ul className="mobile-menu">
          <li>
            <a href="/user" onClick={closeMobileMenu}>
              Home
            </a>
          </li>
          <li>
            <a onClick={toggleMobileResourcesDropdown}>
              Resources <FaAngleDown className="down-arrow" />
            </a>
            {isMobileResourcesOpen && (
              <ul className="mobile-dropdown-menu">
                <li>
                  <a href="/user/videos" onClick={closeMobileMenu}>
                    Videos
                  </a>
                </li>
                <li>
                  <a href="/user/notes" onClick={closeMobileMenu}>
                    Notes
                  </a>
                </li>
                <li>
                  <a href="/user/sources" onClick={closeMobileMenu}>
                    Sources
                  </a>
                </li>
              </ul>
            )}
          </li>
          <li>
            <a onClick={toggleMobileAssignmentsDropdown}>
              Assignments <FaAngleDown className="down-arrow" />
            </a>
            {isMobileAssignmentsOpen && (
              <ul className="mobile-dropdown-menu">
                <li>
                  <a href="/user/assignments" onClick={closeMobileMenu}>
                    Quizzes
                  </a>
                </li>
                <li>
                  <a href="/user/tasks" onClick={closeMobileMenu}>
                    Tasks
                  </a>
                </li>
              </ul>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
};

export default UserNavbar;
