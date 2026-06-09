import { useState, useEffect } from 'react';
import config from '../../../config';

const API_BASE = config.backendUrl; // Replace with your actual config
const BACKEND_URL = config.backendUrl; // Replace with your actual config

const MentorSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [hackathonName, setHackathonName] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (err) {
      return null;
    }
  };

  const findMentorApprovedHackathon = async () => {
    try {
      const token = localStorage.getItem('token');
      const mentorId = getUserIdFromToken();
      
      if (!mentorId || !token) return null;

      const endpoint = `${BACKEND_URL}/hackathonrequests/mentor/${mentorId}`;
      const resp = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) return null;

      const data = await resp.json();
      if (!Array.isArray(data)) return null;

      // Priority 1: Approved + Ongoing
      const approvedOngoing = data.find(item => 
        item.mentorRequest?.status === 'approved' && 
        item.hackathon?.status === 'ongoing'
      );

      if (approvedOngoing && approvedOngoing.hackathon) {
        const hid = approvedOngoing.hackathon._id || approvedOngoing.hackathon;
        const hname = approvedOngoing.hackathon.hackathonname;
        return { id: hid, name: hname };
      }

      // Priority 2: Approved (any status)
      const approved = data.find(item => 
        item.mentorRequest?.status === 'approved' && 
        item.hackathon
      );

      if (approved) {
        const hid = approved.hackathon._id || approved.hackathon;
        const hname = approved.hackathon.hackathonname;
        return { id: hid, name: hname };
      }

      // Priority 3: Pending + Ongoing
      const pendingOngoing = data.find(item => 
        item.mentorRequest?.status === 'pending' && 
        item.hackathon?.status === 'ongoing'
      );

      if (pendingOngoing) {
        const hid = pendingOngoing.hackathon._id || pendingOngoing.hackathon;
        const hname = pendingOngoing.hackathon.hackathonname;
        return { id: hid, name: hname };
      }

      return null;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const hackathonData = await findMentorApprovedHackathon();

      if (!hackathonData) {
        setError('No approved hackathon found for this mentor');
        setLoading(false);
        return;
      }

      const { id: currentHackathonId, name: currentHackathonName } = hackathonData;

      const scheduleEndpoint = `${API_BASE}/schedule/approved/${currentHackathonId}`;
      const response = await fetch(scheduleEndpoint);
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data);
        if (data.data.length > 0) {
          setSelectedSchedule(data.data[0]);
          setHackathonName(data.data[0].hackathon?.hackathonname || currentHackathonName);
        } else {
          setHackathonName(currentHackathonName);
        }
      } else {
        setError('Failed to fetch schedules');
      }

    } catch (err) {
      setError('Error fetching schedules: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
    setSelectedDay(0);
  };

  const convertTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    
    const parts = timeStr.split(' - ')[0];
    const [time, period] = parts.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let totalMinutes = hours * 60 + (minutes || 0);
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    
    return totalMinutes;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              border: '4px solid #f3f4f6', 
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              width: 50,
              height: 50,
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#64748b', fontSize: 16 }}>Loading schedules...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#ef4444', marginBottom: 16 }}>Error Loading Schedules</h3>
          <p style={{ color: '#64748b', marginBottom: 20 }}>{error}</p>
          <button 
            onClick={fetchSchedules}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#64748b', marginBottom: 12 }}>No Schedule Available</h3>
          <p style={{ color: '#94a3b8' }}>
            No approved schedule found for <strong>{hackathonName}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ color: '#1e293b', fontSize: '2rem', fontWeight: 600, margin: 0 }}>
          {selectedSchedule?.hackathon?.hackathonname} - Hackathon Schedule
        </h1>
      </div>

      {/* Schedule Selector - only show if multiple schedules exist */}
      {schedules.length > 1 && (
        <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#334155' }}>Select Schedule:</h3>
          <select 
            value={selectedSchedule?._id || ''} 
            onChange={(e) => {
              const selected = schedules.find(s => s._id === e.target.value);
              handleScheduleSelect(selected);
            }}
            style={{
              width: '100%',
              padding: '10px 15px',
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 15,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {schedules.map((schedule) => (
              <option key={schedule._id} value={schedule._id}>
                {schedule.hackathon?.hackathonname}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Schedule Display */}
      {selectedSchedule && selectedSchedule.days && selectedSchedule.days.length > 0 && (
        <div>
          {/* Day selector buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {selectedSchedule.days.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                style={{
                  padding: '12px 24px',
                  background: selectedDay === index ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                  color: selectedDay === index ? 'white' : '#64748b',
                  border: selectedDay === index ? 'none' : '2px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedDay === index ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                }}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Single schedule box showing selected day */}
          <div style={{ background: 'white', borderRadius: 15, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
              color: 'white',
              padding: '20px',
              fontSize: '1.3rem',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {selectedSchedule.days[selectedDay].day}
            </div>
            <div style={{ padding: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#669bbc' }}>
                    <th style={{ 
                      padding: '15px', 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '0.95rem',
                      color: 'black',
                      borderRight: '2px solid rgba(255,255,255,0.4)',
                      width: '30%'
                    }}>
                      Time
                    </th>
                    <th style={{ 
                      padding: '15px', 
                      textAlign: 'left', 
                      fontWeight: 600, 
                      fontSize: '0.95rem',
                      color: 'black'
                    }}>
                      Session
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSchedule.days[selectedDay].sessions?.length > 0 ? (
                    selectedSchedule.days[selectedDay].sessions
                      .sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time))
                      .map((session, sessionIndex) => (
                        <tr 
                          key={sessionIndex}
                          style={{ 
                            borderBottom: '2px solid #cbd5e1',
                            background: sessionIndex % 2 === 0 ? 'white' : '#f1f5f9'
                          }}
                        >
                          <td style={{ 
                            padding: '15px', 
                            fontSize: '0.9rem', 
                            color: '#1e40af',
                            borderRight: '2px solid #cbd5e1',
                            fontWeight: 600,
                            fontFamily: 'monospace'
                          }}>
                            {session.time}
                          </td>
                          <td style={{ 
                            padding: '15px', 
                            fontSize: '0.9rem', 
                            color: '#334155'
                          }}>
                            {session.session}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td 
                        colSpan="2" 
                        style={{ 
                          padding: '30px', 
                          textAlign: 'center',
                          color: '#94a3b8',
                          fontSize: '0.95rem'
                        }}
                      >
                        No sessions scheduled
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorSchedule;