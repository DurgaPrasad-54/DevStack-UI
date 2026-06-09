import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import '../../Student/StudentHeader/StudentHeader.css';
import userheader from '../../../assests/headerlogo.png';
import notification from '../../../assests/notificationicon.png';
import profile from '../../../assests/userprofileicon.png';
import config from '../../../config';
import { GrGallery } from "react-icons/gr";

let socket;

const CoordinatorNavbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const fetchInitialNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${config.backendUrl}/hacknotifications/notification`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket = io(`${config.backendUrl}`, { auth: { token }, forceNew: true, transports: ['websocket', 'polling'] });

    fetchInitialNotifications();

    socket.on('newHackNotification', (newNotification) => {
      const notificationWithReadStatus = { ...newNotification, read: false };
      setNotifications(prev => [notificationWithReadStatus, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    socket.on('hackNotificationRead', ({ hackNotificationId }) => {
      setNotifications(prev => prev.map(n => n._id === hackNotificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
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
      await fetch(`${config.backendUrl}/hacknotifications/markAsRead`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewAll = () => {
    navigate('/coordinator/notifications');
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('coordinator');
    localStorage.removeItem('coordinatorname');
    localStorage.removeItem('coordinatoryear');
    localStorage.removeItem('coordinatordetails');
    localStorage.removeItem('coordinatorid');
    if (socket) {
      socket.disconnect();
    }
    navigate('/login');
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  const toggleProfileDropdown = () => setProfileDropdownOpen(!isProfileDropdownOpen);

  const getNotificationIcon = (notification) => {
    const title = notification.title?.toLowerCase() || '';
    if (title.includes('team') || title.includes('registration')) return <span className="student-header-team-icon">👥</span>;
    if (title.includes('mentor') || title.includes('assignment') || title.includes('reminder') || title.includes('deadline')) return <span className="student-header-warning-icon">⚠️</span>;
    if (title.includes('submission') || title.includes('project')) return <span className="student-header-success-icon">✅</span>;
    if (title.includes('hackathon') || title.includes('created')) return <span className="student-header-info-icon">ℹ️</span>;
    return <span>🔔</span>;
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);

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
          <li><a href="/coordinator">Home</a></li>
          <li><a href="/coordinator/resource">Resource</a></li>
          <li><a href="/coordinator/fee-verification">Fee verification</a></li>
          <li><a href="/coordinator/hackteam">Teams</a></li>
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

        <a href="/coordinator/gallery" className="student-header-icon student-header-gallery-link">
          <GrGallery className='student-header-gallery-icon'/>
        </a>

        <div className="student-header-profile-icon" onClick={toggleProfileDropdown} ref={profileDropdownRef}>
          <img src={profile} alt="Profile Icon" />
          {isProfileDropdownOpen && (
            <ul className="student-header-dropdown-menu">
              <li><a href="/coordinator/profile">Profile</a></li>
              <li><a href="/coordinator/student-details">Student Details</a></li>
              <li><a href="/coordinator/hackattendance">Attendance</a></li>
              <li><a href="/coordinator/schedule">Schedule</a></li>
              <li><a href="/coordinator/roomallocation">Room Allocation</a></li>
              <li><a href="/coordinator/allteamsprogress">Teams Progress</a></li>
              <li><a href="/coordinator/hacksubmission">Hackathon Submission</a></li>
              <li><a href="/coordinator/assignmentor">Assign Mentors</a></li>
              <li><a href="/coordinator/hackfeedback">Mentor Feedback</a></li>
              <li onClick={handleLogout} className="student-header-logout">Logout</li>
            </ul>
          )}
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="student-header-mobile-sidebar-overlay" onClick={closeMobileMenu}>
          <div className="student-header-mobile-sidebar" onClick={e => e.stopPropagation()}>
            <ul className="student-header-mobile-sidebar-menu">
              <li><a href="/coordinator" onClick={closeMobileMenu}>Home</a></li>
              <li><a href="/coordinator/resource" onClick={closeMobileMenu}>Resource</a></li>
              <li><a href="/coordinator/fee-verification" onClick={closeMobileMenu}>Fee verification</a></li>
              <li><a href="/coordinator/hackteam" onClick={closeMobileMenu}>Teams</a></li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default CoordinatorNavbar;
