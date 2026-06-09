import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Calendar, Github, Linkedin, Edit2, Save, X } from 'lucide-react';
import './coordinatorprofile.css';
import config from '../config';

const CoordinatorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    college: '',
    year: '',
    github: '',
    linkedin: ''
  });

  const colleges = ['KIET', 'KIET+', 'KIEW'];
  const years = ['first year', 'second year', 'third year', 'fourth year'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/profile/coordinator/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        college: data.college || '',
        year: data.year || '',
        github: data.github || '',
        linkedin: data.linkedin || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/coordinator/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update profile');
      }

      setProfile(data.coordinator);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      college: profile.college || '',
      year: profile.year || '',
      github: profile.github || '',
      linkedin: profile.linkedin || ''
    });
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="hack-coordinator-container hack-coordinator-loading-container">
        <div className="hack-coordinator-spinner"></div>
      </div>
    );
  }

  return (
    <div className="hack-coordinator-container">
      <div className="hack-coordinator-wrapper">
        <div className="hack-coordinator-card">
          {/* Header */}
          <div className="hack-coordinator-header">
            <div className="hack-coordinator-header-content">
              <div className="hack-coordinator-header-text">
                <h1 className="hack-coordinator-title">Coordinator Profile</h1>
                <p className="hack-coordinator-subtitle">Manage your profile information</p>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="hack-coordinator-edit-btn"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="hack-coordinator-message hack-coordinator-message-error">
              {error}
            </div>
          )}
          {success && (
            <div className="hack-coordinator-message hack-coordinator-message-success">
              {success}
            </div>
          )}

          {/* Profile Content */}
          <div className="hack-coordinator-content">
            {editing ? (
              <div className="hack-coordinator-form">
                <div className="hack-coordinator-form-grid">
                  {/* Name */}
                  <div className="hack-coordinator-form-group">
                    <label className="hack-coordinator-label">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="hack-coordinator-input"
                    />
                  </div>

                  {/* Email */}
                  <div className="hack-coordinator-form-group">
                    <label className="hack-coordinator-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="hack-coordinator-input"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="hack-coordinator-form-group">
                    <label className="hack-coordinator-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      pattern="[0-9]{10}"
                      required
                      className="hack-coordinator-input"
                    />
                  </div>

                  {/* College */}
                  <div className="hack-coordinator-form-group">
                    <label className="hack-coordinator-label">College *</label>
                    <select
                      name="college"
                      value={formData.college}
                      onChange={handleInputChange}
                      required
                      className="hack-coordinator-select"
                    >
                      <option value="">Select College</option>
                      {colleges.map(college => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div className="hack-coordinator-form-group">
                    <label className="hack-coordinator-label">Year *</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      className="hack-coordinator-select"
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* GitHub */}
                  <div className="hack-coordinator-form-group">
                    <label className="hack-coordinator-label">GitHub Profile</label>
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      placeholder="https://github.com/username"
                      className="hack-coordinator-input"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="hack-coordinator-form-group">
                    <label className="hack-coordinator-label">LinkedIn Profile</label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/username"
                      className="hack-coordinator-input"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="hack-coordinator-actions">
                  <button
                    onClick={handleSubmit}
                    className="hack-coordinator-btn hack-coordinator-btn-save"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="hack-coordinator-btn hack-coordinator-btn-cancel"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="hack-coordinator-display-grid">
                {/* Name */}
                <div className="hack-coordinator-info-card">
                  <User className="hack-coordinator-icon" size={20} />
                  <div className="hack-coordinator-info-content">
                    <p className="hack-coordinator-info-label">Name</p>
                    <p className="hack-coordinator-info-value">{profile?.name || 'Not provided'}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="hack-coordinator-info-card">
                  <Mail className="hack-coordinator-icon" size={20} />
                  <div className="hack-coordinator-info-content">
                    <p className="hack-coordinator-info-label">Email</p>
                    <p className="hack-coordinator-info-value">{profile?.email || 'Not provided'}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="hack-coordinator-info-card">
                  <Phone className="hack-coordinator-icon" size={20} />
                  <div className="hack-coordinator-info-content">
                    <p className="hack-coordinator-info-label">Phone Number</p>
                    <p className="hack-coordinator-info-value">{profile?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>

                {/* College */}
                <div className="hack-coordinator-info-card">
                  <Building className="hack-coordinator-icon" size={20} />
                  <div className="hack-coordinator-info-content">
                    <p className="hack-coordinator-info-label">College</p>
                    <p className="hack-coordinator-info-value">{profile?.college || 'Not provided'}</p>
                  </div>
                </div>

                {/* Year */}
                <div className="hack-coordinator-info-card">
                  <Calendar className="hack-coordinator-icon" size={20} />
                  <div className="hack-coordinator-info-content">
                    <p className="hack-coordinator-info-label">Year</p>
                    <p className="hack-coordinator-info-value hack-coordinator-capitalize">
                      {profile?.year || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* GitHub */}
                {profile?.github && (
                  <div className="hack-coordinator-info-card">
                    <Github className="hack-coordinator-icon" size={20} />
                    <div className="hack-coordinator-info-content">
                      <p className="hack-coordinator-info-label">GitHub</p>
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hack-coordinator-link"
                      >
                        {profile.github}
                      </a>
                    </div>
                  </div>
                )}

                {/* LinkedIn */}
                {profile?.linkedin && (
                  <div className="hack-coordinator-info-card">
                    <Linkedin className="hack-coordinator-icon" size={20} />
                    <div className="hack-coordinator-info-content">
                      <p className="hack-coordinator-info-label">LinkedIn</p>
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hack-coordinator-link"
                      >
                        {profile.linkedin}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorProfile;