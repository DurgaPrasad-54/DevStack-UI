import { useState, useEffect } from 'react';
import './studentschedule.css';
import config from '../../../config';
import { useHackathon } from '../context/HackathonContext';

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [hackathonName, setHackathonName] = useState('');
  const [selectedDay, setSelectedDay] = useState(0); // Track selected day index

  const { currentHackathonId } = useHackathon();

  // Fetch schedules from API when hackathon changes
  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHackathonId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      if (!currentHackathonId) {
        setSchedules([]);
        setHackathonName('');
        setLoading(false);
        return;
      }

      // Fetch only approved schedules for the specific hackathon
      const response = await fetch(`${config.backendUrl}/schedule/approved/${currentHackathonId}`);
      const data = await response.json();
      
      if (data.success) {
        setSchedules(data.data);
        if (data.data.length > 0) {
          setSelectedSchedule(data.data[0]); // Set first schedule as default
          console.log(data);
          setHackathonName(data.data[0].hackathon?.hackathonname || 'Unknown Hackathon');
        } else {
          // If no schedules found, try to get hackathon name
          fetchHackathonName(currentHackathonId);
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

  // Fetch hackathon name when no schedules are available
  const fetchHackathonName = async (hackathonId) => {
    try {
      const response = await fetch(`${config.backendUrl}/hackathon/${hackathonId}`);
      const data = await response.json();
      if (data) {
        setHackathonName(data.hackathonname || 'Unknown Hackathon');
      } else {
        setHackathonName('Unknown Hackathon');
      }
    } catch (err) {
      console.error('Error fetching hackathon name:', err);
      setHackathonName('Unknown Hackathon');
    }
  };

  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
  };

  if (loading) {
    return (
      <div className="student-schedule-container">
        <div className="student-schedule-loading">Loading schedules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-schedule-container">
        <div className="student-schedule-error">Error: {error}</div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="student-schedule-container">
        <div className="student-schedule-no-schedules">
          <h3>No Hackathon Found</h3>
          <p>{hackathonName ? `No approved schedule found for ${hackathonName}` : 'Please select a hackathon to view the schedule.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-schedule-container">
      <div className="student-schedule-header-section">
        <h3 className="student-schedule-subtitle">{selectedSchedule?.hackathon?.hackathonname} - Hackathon Schedule</h3>
      </div>
      
      {/* Schedule Selector - only show if multiple schedules exist */}
      {schedules.length > 1 && (
        <div className="student-schedule-selector">
          <h3>Select Schedule:</h3>
          <select 
            value={selectedSchedule?._id || ''} 
            onChange={(e) => {
              const selected = schedules.find(s => s._id === e.target.value);
              handleScheduleSelect(selected);
            }}
            className="student-schedule-dropdown"
          >
            {schedules.map((schedule) => (
              <option key={schedule._id} value={schedule._id}>
                {schedule.hackathon?.hackathonname}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Schedule Display - Day buttons and single schedule box */}
      {selectedSchedule && selectedSchedule.days && selectedSchedule.days.length > 0 && (
        <div className="student-schedule-display">
          {/* Day selector buttons */}
          <div className="student-schedule-day-selector-buttons">
            {selectedSchedule.days.map((day, index) => (
              <button
                key={index}
                className={`student-schedule-day-btn ${selectedDay === index ? 'active' : ''}`}
                onClick={() => setSelectedDay(index)}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Single schedule box showing selected day */}
          <div className="student-schedule-single-box">
            <div className="student-schedule-box-header">
              {selectedSchedule.days[selectedDay].day}
            </div>
            <div className="student-schedule-box-content">
              <table className="student-schedule-table">
                <thead>
                  <tr>
                    <th className="student-schedule-time-header">Time</th>
                    <th className="student-schedule-session-header">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSchedule.days[selectedDay].sessions?.length > 0 ? (
                    selectedSchedule.days[selectedDay].sessions
                      .sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time))
                      .map((session, sessionIndex) => (
                        <tr key={sessionIndex}>
                          <td className="student-schedule-time-cell">{session.time}</td>
                          <td className="student-schedule-session-cell">{session.session}</td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="student-schedule-no-sessions">No sessions scheduled</td>
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

// Helper function to convert time string to minutes for sorting
const convertTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  const parts = timeStr.split(' - ')[0]; // Take start time
  const [time, period] = parts.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + (minutes || 0);
  if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
  if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
  
  return totalMinutes;
};

export default Schedule;