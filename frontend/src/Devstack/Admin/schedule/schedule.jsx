import { useState, useEffect } from 'react';

import { Plus, Edit, Trash2, Eye, Calendar, Search, Filter } from 'lucide-react';
import config from '../../../config';
import './schedule.css';

// API Service
const API_BASE = `${config.backendUrl}/schedule`; // Adjust based on your backend URL

const scheduleAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}${queryString ? `?${queryString}` : ''}`).then(res => res.json());
  },
  getById: (id) => fetch(`${API_BASE}/${id}`).then(res => res.json()),
  create: (data) => fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  update: (id, data) => fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  delete: (id) => fetch(`${API_BASE}/${id}`, { method: 'DELETE' }).then(res => res.json()),
  updateStatus: (id, status) => fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(res => res.json()),
  getMentors: () => fetch(`${API_BASE}/mentors`).then(res => res.json()),
  getHackathons: () => fetch(`${API_BASE}/hackathons`).then(res => res.json()),
  getStats: () => fetch(`${API_BASE}/stats/overview`).then(res => res.json())
};

// Styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    paddingTop: '90px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e5e7eb'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  secondaryButton: {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db'
  },
  dangerButton: {
    background: '#ef4444',
    color: 'white'
  },
  successButton: {
    background: '#10b981',
    color: 'white'
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    flexWrap: 'wrap'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    minWidth: '200px'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    minWidth: '150px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  th: {
    background: 'linear-gradient(135deg, #374151, #1f2937)',
    color: 'white',
    padding: '15px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px'
  },
  td: {
    padding: '15px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px'
  },
  tr: {
    transition: 'background-color 0.2s ease'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  pendingBadge: {
    background: '#fef3c7',
    color: '#92400e'
  },
  approvedBadge: {
    background: '#d1fae5',
    color: '#065f46'
  },
  rejectedBadge: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'relative'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    width: '100%',
    minHeight: '80px',
    resize: 'vertical'
  },
  dayCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    background: '#f9fafb'
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  dayTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937'
  },
  sessionsList: {
    marginTop: '10px'
  },
  session: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '8px'
  },
  sessionTime: {
    fontWeight: '500',
    color: '#3b82f6',
    minWidth: '80px'
  },
  sessionContent: {
    flex: 1,
    marginLeft: '12px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  iconButton: {
    padding: '6px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 5px 0'
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0
  }
};

// Stats Component
const StatsCards = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="schedule-stats">
      <div className="schedule-stat-card">
        <div className="schedule-stat-value">{stats.total || 0}</div>
        <div className="schedule-stat-label">Total Schedules</div>
      </div>
      <div className="schedule-stat-card">
        <div className="schedule-stat-value">{stats.byStatus?.pending || 0}</div>
        <div className="schedule-stat-label">Pending</div>
      </div>
      <div className="schedule-stat-card">
        <div className="schedule-stat-value">{stats.byStatus?.approved || 0}</div>
        <div className="schedule-stat-label">Approved</div>
      </div>
      <div className="schedule-stat-card">
        <div className="schedule-stat-value">{stats.byStatus?.rejected || 0}</div>
        <div className="schedule-stat-label">Rejected</div>
      </div>
    </div>
  );
};

// Schedule Form Component
const ScheduleForm = ({ schedule, onSave, onCancel, hackathons }) => {
  const [formData, setFormData] = useState({
    hackathon: schedule?.hackathon?._id || '',
    status: schedule?.status || 'pending',
    days: schedule?.days || [{ day: '', sessions: [] }]
  });

  // Get hackathon IDs that already have a schedule
  const [scheduledHackathonIds, setScheduledHackathonIds] = useState([]);
  useEffect(() => {
    // Fetch all schedules to get hackathon IDs
    (async () => {
      const res = await fetch(`${config.backendUrl}/schedule`);
      const data = await res.json();
      if (data.success) {
        setScheduledHackathonIds(data.data.map(s => s.hackathon?._id));
      }
    })();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addDay = () => {
    setFormData(prev => ({
      ...prev,
      days: [...prev.days, { day: '', sessions: [] }]
    }));
  };

  const removeDay = (index) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.filter((_, i) => i !== index)
    }));
  };

  const updateDay = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === index ? { ...day, [field]: value } : day
      )
    }));
  };

  const addSession = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === dayIndex 
          ? { ...day, sessions: [...day.sessions, { time: '', session: '' }] }
          : day
      )
    }));
  };

  const removeSession = (dayIndex, sessionIndex) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === dayIndex 
          ? { ...day, sessions: day.sessions.filter((_, si) => si !== sessionIndex) }
          : day
      )
    }));
  };

  const updateSession = (dayIndex, sessionIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === dayIndex 
          ? {
              ...day,
              sessions: day.sessions.map((session, si) =>
                si === sessionIndex ? { ...session, [field]: value } : session
              )
            }
          : day
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="schedule-form-group">
        <label className="schedule-label">Hackathon Year</label>
        <select
          className="schedule-select"
          style={{ width: '100%' }}
          value={formData.hackathon}
          onChange={(e) => setFormData(prev => ({ ...prev, hackathon: e.target.value }))}
          required
        >
          <option value="">Select Hackathon Year</option>
          {hackathons.map(h => {
            const isScheduled = scheduledHackathonIds.includes(h._id) && h._id !== schedule?.hackathon?._id;
            return (
              <option key={h._id} value={h._id} disabled={isScheduled}>
                {h.hackathonname} ({h.year}) ({h.college}){isScheduled ? ' - Already Scheduled' : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="schedule-form-group">
        <label className="schedule-label">Status</label>
        <select
          className="schedule-select"
          style={{ width: '100%' }}
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="schedule-form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <label className="schedule-label" style={{ margin: 0 }}>Days & Sessions</label>
          <button
            type="button"
            onClick={addDay}
            className="schedule-btn schedule-btn-secondary"
          >
            <Plus size={16} /> Add Day
          </button>
        </div>

        {formData.days.map((day, dayIndex) => (
          <div key={dayIndex} className="schedule-day-card">
            <div className="schedule-day-header">
              <input
                type="text"
                placeholder="Day name (e.g., Day 1, Opening Day)"
                value={day.day}
                onChange={(e) => updateDay(dayIndex, 'day', e.target.value)}
                className="schedule-input"
                style={{ flex: 1 }}
                required
              />
              <button
                type="button"
                onClick={() => removeDay(dayIndex)}
                className="schedule-icon-btn schedule-btn-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Sessions</span>
                <button
                  type="button"
                  onClick={() => addSession(dayIndex)}
                  className="schedule-btn schedule-btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Add Session
                </button>
              </div>

              {day.sessions.map((session, sessionIndex) => (
                <div key={sessionIndex} className="schedule-session-row">
                  <input
                    type="text"
                    placeholder="Time (e.g., 09:00 AM)"
                    value={session.time}
                    onChange={(e) => updateSession(dayIndex, sessionIndex, 'time', e.target.value)}
                    className="schedule-input schedule-session-time-input"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Session description"
                    value={session.session}
                    onChange={(e) => updateSession(dayIndex, sessionIndex, 'session', e.target.value)}
                    className="schedule-input schedule-session-desc-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeSession(dayIndex, sessionIndex)}
                    className="schedule-icon-btn schedule-btn-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onCancel}
          className="schedule-btn schedule-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="schedule-btn schedule-btn-primary"
        >
          {schedule ? 'Update Schedule' : 'Create Schedule'}
        </button>
      </div>
    </form>
  );
};

// Schedule Detail View Component
const ScheduleDetailView = ({ schedule, onClose, onEdit, onDelete, onStatusChange }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'schedule-badge schedule-badge-approved';
      case 'rejected': return 'schedule-badge schedule-badge-rejected';
      default: return 'schedule-badge schedule-badge-pending';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>
          {schedule.hackathon?.year}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <span className={getStatusBadgeClass(schedule.status)}>{schedule.status}</span>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>
            {schedule.hackathon?.college}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onEdit(schedule)}
            className="schedule-btn schedule-btn-secondary"
          >
            <Edit size={16} /> Edit
          </button>
          <button
            onClick={() => onDelete(schedule._id)}
            className="schedule-btn schedule-btn-danger"
          >
            <Trash2 size={16} /> Delete
          </button>
          <select
            value={schedule.status}
            onChange={(e) => onStatusChange(schedule._id, e.target.value)}
            className="schedule-select"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Schedule Details</h4>
        {schedule.days?.map((day, dayIndex) => (
          <div key={dayIndex} className="schedule-day-card">
            <h5 className="schedule-day-title">{day.day}</h5>
            {day.sessions?.map((session, sessionIndex) => (
              <div key={sessionIndex} className="schedule-session">
                <div className="schedule-session-time">{session.time}</div>
                <div className="schedule-session-content">{session.session}</div>
              </div>
            ))}
            {!day.sessions?.length && (
              <p style={{ color: '#6b7280', fontStyle: 'italic', margin: '10px 0' }}>
                No sessions scheduled for this day
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Schedule Management Component
const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    hackathonYear: '',
    search: ''
  });
console.log(hackathons)

  // Load initial data
  useEffect(() => {
    loadData();
    loadHackathons();
    loadStats();
  }, []);

  // Load schedules with filters
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.hackathonYear) params.hackathonYear = filters.hackathonYear;
      
      const response = await scheduleAPI.getAll(params);
      if (response.success) {
        let data = response.data;
        
        // Apply search filter
        if (filters.search) {
          data = data.filter(schedule =>
            schedule.hackathon?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            schedule.hackathon?.college?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHackathons = async () => {
    try {
      const response = await scheduleAPI.getHackathons();
      if (response.success) {
        setHackathons(response.data);
      }
    } catch (error) {
      console.error('Error loading hackathons:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await scheduleAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleSave = async (formData) => {
    try {
      let response;
      if (editingSchedule) {
        response = await scheduleAPI.update(editingSchedule._id, formData);
      } else {
        response = await scheduleAPI.create(formData);
      }
      
      if (response.success) {
        setShowForm(false);
        setEditingSchedule(null);
        loadData();
        loadStats();
      } else {
        alert(response.message || 'Error saving schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule');
    }
  };

  const handleDelete = async (id) => {
    // Replace confirm with window.confirm
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const response = await scheduleAPI.delete(id);
      if (response.success) {
        loadData();
        loadStats();
        setShowDetail(false);
      } else {
        alert(response.message || 'Error deleting schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await scheduleAPI.updateStatus(id, newStatus);
      if (response.success) {
        loadData();
        loadStats();
        if (selectedSchedule && selectedSchedule._id === id) {
          setSelectedSchedule(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        alert(response.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleViewDetails = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetail(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'schedule-badge schedule-badge-approved';
      case 'rejected': return 'schedule-badge schedule-badge-rejected';
      default: return 'schedule-badge schedule-badge-pending';
    }
  };

  const getYears = () => {
    const years = new Set();
    hackathons.forEach(h => years.add(h.year));
    return Array.from(years).sort((a, b) => b - a);
  };

  return (
    <div className="schedule-container">
      {/* Header */}
      <div className="schedule-header">
        <h1 className="schedule-title">Schedule Management</h1>
        <button
          onClick={handleCreate}
          className="schedule-btn schedule-btn-primary"
        >
          <Plus size={20} /> Create Schedule
        </button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <div className="schedule-filters">
        <div className="schedule-search-wrapper">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by hackathon name or college..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="schedule-input"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="schedule-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filters.hackathonYear}
          onChange={(e) => setFilters(prev => ({ ...prev, hackathonYear: e.target.value }))}
          className="schedule-select"
        >
          <option value="">All Years</option>
          {getYears().map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <button
          onClick={() => setFilters({ status: '', hackathonYear: '', search: '' })}
          className="schedule-btn schedule-btn-secondary"
        >
          <Filter size={16} /> Clear Filters
        </button>
      </div>

      {/* Schedules Table */}
      <div className="schedule-table-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Hackathon</th>
              <th>Year</th>
              <th>College</th>
              <th>Status</th>
              <th>Days</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  Loading schedules...
                </td>
              </tr>
            ) : schedules.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No schedules found
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule._id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>
                      {schedule.hackathon?.hackathonname || 'N/A'}
                    </div>
                  </td>
                  <td>{schedule.hackathon?.year || 'N/A'}</td>
                  <td>{schedule.hackathon?.college || 'N/A'}</td>
                  <td>
                    <span className={getStatusBadgeClass(schedule.status)}>
                      {schedule.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={16} color="#6b7280" />
                      {schedule.days?.length || 0} days
                    </div>
                  </td>
                  <td>
                    <div className="schedule-button-group">
                      <button
                        onClick={() => handleViewDetails(schedule)}
                        className="schedule-icon-btn schedule-btn-secondary"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="schedule-icon-btn schedule-btn-secondary"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule._id)}
                        className="schedule-icon-btn schedule-btn-danger"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="schedule-modal">
          <div className="schedule-modal-content">
            <div className="schedule-modal-header">
              <h2 className="schedule-modal-title">
                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                }}
                className="schedule-close-btn"
              >
                ×
              </button>
            </div>
            <ScheduleForm
              schedule={editingSchedule}
              hackathons={hackathons}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingSchedule(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {showDetail && selectedSchedule && (
        <div className="schedule-modal">
          <div className="schedule-modal-content">
            <div className="schedule-modal-header">
              <h2 className="schedule-modal-title">Schedule Details</h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedSchedule(null);
                }}
                className="schedule-close-btn"
              >
                ×
              </button>
            </div>
            <ScheduleDetailView
              schedule={selectedSchedule}
              onClose={() => {
                setShowDetail(false);
                setSelectedSchedule(null);
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;