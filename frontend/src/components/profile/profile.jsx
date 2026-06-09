import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import Image from '../../assests/Ellipse 11.png';
import './profile.css';
import config from '../../config';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    rollNo: '',
    branch: '',
    year: '',
    college: '',
    phoneNumber: '',
    email: '',
    github: '',
    linkedin: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      fetchProfileData(token, decodedToken.role);
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  const fetchProfileData = async (token, role) => {
    try {
      const response = await axios.get(`${config.backendUrl}/profile/${role}/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        setProfileData(response.data);
        setEditedData(response.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch profile data';
      setError(errorMessage);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedData(profileData); // Load current data into editedData
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      
      const response = await axios.put(
        `${config.backendUrl}/profile/${decodedToken.role}/profile`,
        editedData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setProfileData(response.data);
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (error) return <div className="error-container"><div className="error-text">{error}</div></div>;

  // Define editable fields
  const editableFields = ['name', 'rollNo', 'branch', 'year', 'college', 'phoneNumber', 'email', 'github', 'linkedin'];

  return (
    <div className="profile-page">
      <div className="profile-containers">
        <div className="profile-header">
          <div className="header-content">
            <div className="profile-info">
              <img src={Image} alt="Profile" className="profile-image" />
              <h1 className="profile-title">Welcome, {profileData.name || 'User'}</h1>
              {/* <div className="profile-email">{profileData.email}</div> */}
            </div>
            <button onClick={handleEditToggle} className="edit-button">
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="profile-content">
          {isEditing ? (
            <div className="edit-section">
              <div className="grid">
                {/* Editable Fields */}
                {editableFields.map((key) => (
                  <div key={key} className="form-group">
                    <label className="form-label">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type={key === 'email' ? 'email' : 'text'}
                      name={key}
                      value={editedData[key] || ''}
                      onChange={handleInputChange}
                      className={`form-input ${['email', 'phoneNumber', 'rollNo'].includes(key) ? 'disabled' : ''}`}
                      disabled={['email', 'phoneNumber', 'rollNo'].includes(key)} // Disable these fields
                    />
                  </div>
                ))}
              </div>
              <div className="button-group">
                <button onClick={handleSaveChanges} className="save-button">
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="display-section">
              <div className="grid">
                {/* Display Non-editable Fields (excluding email, github, linkedin) */}
                {editableFields
                  .filter(key => !['email', 'github', 'linkedin'].includes(key))
                  .map((key) => (
                    <div key={key} className="form-group">
                      <label className="form-label">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </label>
                      <div className="form-value">
                        {profileData[key]}
                      </div>
                    </div>
                  ))}
              </div>
              {/* Contact Info Section - Centered below profile info */}
               <div className="contact-info">
                <div className="contact-info">
                <div className="contact-item">
                  <FaEnvelope className="profile-page-icon" />
    <a href={`mailto:${profileData.email}`}>{profileData.email}</a>
                </div>
                <div className="contact-item">
                 <FaGithub className="profile-page-icon" />
    <a href={profileData.github}>Github</a>
  
                </div>
                <div className="contact-item">
                  <FaLinkedin className="profile-page-icon" />
    <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer">
      LinkedIn
    </a>
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;