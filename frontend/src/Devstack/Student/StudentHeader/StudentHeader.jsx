import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './StudentHeader.css';
import userheader from '../../../assests/headerlogo.png';
import notification from '../../../assests/notificationicon.png';
import profile from '../../../assests/userprofileicon.png';
import config from '../../../config';
import { GrGallery } from "react-icons/gr";
import { useHackathon } from '../context/HackathonContext';

let socket;

const UserNavbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isResourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [isAssignmentsDropdownOpen, setAssignmentsDropdownOpen] = useState(false);
  const [isMobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [isMobileAssignmentsOpen, setMobileAssignmentsOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const { setSelectedHackathon: setContextSelectedHackathon } = useHackathon();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('student');
    localStorage.removeItem('studentbranch');
    localStorage.removeItem('studentYear');
    localStorage.removeItem('studentColleage');
    if (setContextSelectedHackathon) setContextSelectedHackathon(null);
    localStorage.removeItem('selectedHackathonId');
    navigate('/login');
  };

  const fetchInitialNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      const response = await fetch(`${config.backendUrl}/hacknotifications/notification`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token available for socket connection');
      return;
    }
    socket = io(`${config.backendUrl}`, {
      auth: { token },
      forceNew: true,
      transports: ['websocket', 'polling'],
    });

    fetchInitialNotifications();

    socket.on('newHackNotification', (newNotification) => {
      const notificationWithReadStatus = { ...newNotification, read: false };
      setNotifications((prev) => [notificationWithReadStatus, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('hackNotificationRead', ({ hackNotificationId }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === hackNotificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socket) {
        socket.off('newHackNotification');
        socket.off('hackNotificationRead');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('error');
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/hacknotifications/markAsRead`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewAll = () => {
    navigate('/hackstudent/notifications');
    setDropdownOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  // Hamburger and dropdown toggles
  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
  const toggleResourcesDropdown = () => setResourcesDropdownOpen(!isResourcesDropdownOpen);
  const toggleAssignmentsDropdown = () => setAssignmentsDropdownOpen(!isAssignmentsDropdownOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileResourcesDropdown = () => setMobileResourcesOpen(!isMobileResourcesOpen);
  const toggleMobileAssignmentsDropdown = () => setMobileAssignmentsOpen(!isMobileAssignmentsOpen);
  const toggleProfileDropdown = () => setProfileDropdownOpen(!isProfileDropdownOpen);

  const getNotificationIcon = (notification) => {
    const title = notification.title?.toLowerCase() || '';
    if (title.includes('team') || title.includes('registration')) return <span className="student-header-team-icon">👥</span>;
    if (title.includes('mentor') || title.includes('assignment') || title.includes('reminder') || title.includes('deadline')) return <span className="student-header-warning-icon">⚠️</span>;
    if (title.includes('submission') || title.includes('project')) return <span className="student-header-success-icon">✅</span>;
    if (title.includes('hackathon') || title.includes('created')) return <span className="student-header-info-icon">ℹ️</span>;
    return <span>🔔</span>;
  };

  return (
    <nav className="student-header-navbar">
      <div
        className={`student-header-hamburger-menu ${isMobileMenuOpen ? 'student-header-open' : ''}`}
        onClick={toggleMobileMenu}
        id="student-header-nav-icon3"
      >
        <span></span><span></span><span></span><span></span>
      </div>

      <div className="student-header-navbar-left">
        <div className="student-header-logo">
          <img src={userheader} alt="Logo" />
        </div>
        <ul className="student-header-nav-links">
          <li><a href="/hackstudent">Home</a></li>
          <li><a href='/hackstudent/resources'>Resources</a></li>
          <li><a href="/hackstudent/hackathon">Hackathon</a></li>
          <li><a href="/hackstudent/winners">Winners</a></li>
        </ul>
      </div>

      <div className="student-header-nav-icons">
        <div className="student-header-notification-icon-wrapper" onClick={toggleDropdown} ref={dropdownRef}>
          <div className="student-header-icon">
            <img src={notification} alt="Notification Icon" />
            {unreadCount > 0 && <span className="student-header-notification-badge">{unreadCount}</span>}
          </div>
          {isDropdownOpen && (
            <div className="student-header-notification-dropdown" onClick={handleDropdownClick}>
              <div className="student-header-dropdown-header">
                <span>{unreadCount} unread</span>
                <div className="student-header-actions">
                  <button onClick={markAllAsRead}>Mark all as read</button>
                  <button onClick={handleViewAll}>View all</button>
                </div>
              </div>
              <div className="student-header-dropdown-list">
                {notifications.length === 0 ? (
                  <p className="student-header-no-notifications">No notifications yet</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      className={`student-header-dropdown-item ${n.read ? 'student-header-read' : 'student-header-unread'}`}
                    >
                      <div className="student-header-notif-icon">{getNotificationIcon(n)}</div>
                      <div className="student-header-notif-content">
                        <h4>{n.title}</h4>
                        <p>{n.description}</p>
                        <small>
                          {new Date(n.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 10 && (
                <div
                  style={{
                    padding: '12px 20px',
                    textAlign: 'center',
                    borderTop: '1px solid #f1f3f4',
                  }}
                >
                  <button
                    onClick={handleViewAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <a href="/hackstudent/gallery" className="student-header-icon student-header-gallery-link">
          <GrGallery className='student-header-gallery-icon'/>
        </a>

        <div className="student-header-profile-icon" onClick={toggleProfileDropdown} ref={profileDropdownRef}>
          <img src={profile} alt="Profile Icon" />
          {isProfileDropdownOpen && (
            <ul className="student-header-dropdown-menu">
              <li><a href="/hackstudent/profile">Profile</a></li>
              <li><a href="/hackstudent/team-formation">My Team</a></li>
              <li><a href="/hackstudent/problemstatements">ProblemStatements</a></li>
              
              <li><a href="/hackstudent/roomallocation">Schedule</a></li>
              <li><a href="/hackstudent/combinedprogress">Team Progress</a></li>
              <li><a href="/hackstudent/certificates">Certificates</a></li>
              <li><a href="/hackstudent/hacksubmission">Project Submission</a></li>
              <li><a href="/hackstudent/hackathon-history">Hackathon History</a></li>
              {/* <li><a href="/hackstudent/allteamsprogress">All Teams Progress</a></li> */}
              
              <li onClick={handleLogout} className="student-header-logout">Logout</li>
            </ul>
          )}
        </div>
      </div>

      {/* Sidebar for small screens */}
      {isMobileMenuOpen && (
        <div className="student-header-mobile-sidebar-overlay" onClick={closeMobileMenu}>
          <div className="student-header-mobile-sidebar" onClick={e => e.stopPropagation()}>
            <ul className="student-header-mobile-sidebar-menu">
              <li><a href="/hackstudent" onClick={closeMobileMenu}>Home</a></li>
              <li><a href="/hackstudent/resources" onClick={closeMobileMenu}>Resources</a></li>
              <li><a href="/hackstudent/hackathon" onClick={closeMobileMenu}>Hackathon</a></li>
              <li><a href="/hackstudent/winners">Winners</a></li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;