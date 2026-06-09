import { useEffect, useState } from 'react';
import { Typography, message } from 'antd';
import io from 'socket.io-client';
import config from '../../config';
import './hackathonnotification.css';
import { toast, ToastContainer } from "react-toastify";

const { Title } = Typography;

const HackathonNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Mark all as read when page loads, then fetch notifications
    const markAsReadAndFetch = async () => {
      try {
        await fetch(`${config.backendUrl}/hacknotifications/markAsRead`, {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
      } catch (err) {
        console.error('Error marking notifications as read:', err);
      } finally {
        fetchNotifications();
      }
    };
    markAsReadAndFetch();

    // --- SOCKET.IO SETUP ---
    const socket = io(config.backendUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: token },
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('newHackNotification', (notification) => {
      console.log('New hackathon notification received:', notification);
      setNotifications(prev => [{ ...notification, read: false }, ...prev]);
      message.info(`New notification: ${notification.title}`);
      toast.info(`New notification: ${notification.title}`);
    });

    socket.on('hackNotificationRead', ({ hackNotificationId }) => {
      console.log('Notification marked as read:', hackNotificationId);
      setNotifications((prev) => 
        prev.map(n => 
          n._id === hackNotificationId 
            ? { ...n, read: true }
            : n
        )
      );
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      console.log('Cleaning up socket connection...');
      socket.disconnect();
    };
  }, [token]);

  const fetchNotifications = async () => {
    try {
      if (!token) {
        message.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.backendUrl}/hacknotifications/notification`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched notifications:', data);
        setNotifications(data);
      } else {
        const err = await response.json();
        console.error('Error response:', err);
        message.error(err.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${config.backendUrl}/hacknotifications/mark-read/${notificationId}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId 
              ? { ...n, read: true }
              : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) return <div className="coordinator-notification-loading">Loading...</div>;

  return (
    <div className="coordinator-notification-page">
      {/* Fixed Header */}
      <div className="coordinator-notification-header">

      </div>

      {/* Page Content */}
      <div className="coordinator-notification-container">
        <ToastContainer />
        <div className="coordinator-notification-content">
          <h1 className="coordinator-notification-title">Notifications</h1>
          <div className="coordinator-notification-wrapper">
            {notifications.length === 0 ? (
              <div className="coordinator-notification-no-container">
                <p className="coordinator-notification-no-text">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`coordinator-notification-card ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => !notification.read && markNotificationAsRead(notification._id)}
                >
                  <div className="coordinator-notification-avatar">
                    <img
                      src={require('../../assests/notificationprofileicon.png')}
                      alt="notification"
                      className="coordinator-notification-avatar-image"
                    />
                  </div>
                  <div className="coordinator-notification-details">
                    <h3 className="coordinator-notification-heading">{notification.title}</h3>
                    <p className="coordinator-notification-description">{notification.description}</p>
                    <span className="coordinator-notification-date">
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {!notification.read && (
                    <div className="coordinator-notification-unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackathonNotifications;