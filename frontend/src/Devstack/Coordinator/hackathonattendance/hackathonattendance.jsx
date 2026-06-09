import React, { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import config from '../../../config';
import './attendance.css';

export default function HackathonAttendanceManagement() {
  const API_BASE = config.backendUrl;
  
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [session, setSession] = useState('');
  const [customSession, setCustomSession] = useState('');
  const [showCustomSession, setShowCustomSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingSessionData, setLoadingSessionData] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});

  // Get coordinator details from localStorage
  const coordinatorCollege = localStorage.getItem('coordinatordetails');
  const coordinatorYear = localStorage.getItem('coordinatoryear');

  useEffect(() => {
    fetch(`${API_BASE}/hackathon`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load hackathons'))
      .then(data => {
        const hackathonList = Array.isArray(data) ? data : (data.hackathons || []);
        
        // Filter hackathons by coordinator's college and year
        const filteredHackathons = hackathonList.filter(h => {
          const collegeMatch = !coordinatorCollege || h.college === coordinatorCollege;
          const yearMatch = !coordinatorYear || h.year === coordinatorYear;
          return collegeMatch && yearMatch;
        });
        
        setHackathons(filteredHackathons);
      })
      .catch(err => setError(String(err)));
  }, [coordinatorCollege, coordinatorYear]);

  useEffect(() => {
    if (!selectedHackathon) {
      setStudents([]);
      setSessions([]);
      setBranchFilter('');
      setYearFilter('');
      setAttendance({});
      setRemarks({});
      setSession('');
      setCustomSession('');
      setShowCustomSession(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    fetch(`${API_BASE}/hackteams/students/search?hackathonId=${selectedHackathon}`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch students'))
      .then(data => {
        const studentList = Array.isArray(data) ? data : [];
        
        // Filter students by coordinator's college and year (matching student's currentYear)
        const filteredStudents = studentList.filter(s => {
          const collegeMatch = !coordinatorCollege || s.college === coordinatorCollege;
          const yearMatch = !coordinatorYear || s.currentYear === coordinatorYear || s.year === coordinatorYear;
          return collegeMatch && yearMatch;
        });
        
        setStudents(filteredStudents);
        
        const initialAttendance = {};
        filteredStudents.forEach(s => {
          initialAttendance[s._id] = 'absent';
        });
        setAttendance(initialAttendance);
        setRemarks({});
        setBranchFilter('');
        setYearFilter('');
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, [selectedHackathon, coordinatorCollege, coordinatorYear]);

  useEffect(() => {
    if (!selectedHackathon || !branchFilter) {
      setSessions([]);
      return;
    }

    setLoadingSessions(true);
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    fetch(`${API_BASE}/hackathonattendance/hackathon/${selectedHackathon}/sessions?branch=${encodeURIComponent(branchFilter)}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch sessions'))
      .then(data => {
        if (data.success && data.data.branches && data.data.branches.length > 0) {
          setSessions(data.data.branches[0].sessions || []);
        } else {
          setSessions([]);
        }
      })
      .catch(err => {
        console.warn('Could not load sessions:', err);
        setSessions([]);
      })
      .finally(() => setLoadingSessions(false));
  }, [selectedHackathon, branchFilter]);

  const handleSessionChange = async (sessionName) => {
    setSession(sessionName);
    
    if (!sessionName || !branchFilter) return;
    
    setLoadingSessionData(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(
        `${API_BASE}/hackathonattendance/hackathon/${selectedHackathon}?sessionName=${encodeURIComponent(sessionName)}&branch=${encodeURIComponent(branchFilter)}`, 
        { headers }
      );
      
      if (!response.ok) {
        setError('Failed to load session data');
        setLoadingSessionData(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data.branches && data.data.branches.length > 0) {
        const branchData = data.data.branches[0];
        const sessionData = branchData.sessions.find(s => s.session === sessionName);
        
        if (sessionData) {
          const sessionAttendance = {};
          const sessionRemarks = {};
          let loadedCount = 0;
          
          if (sessionData.students && Array.isArray(sessionData.students)) {
            sessionData.students.forEach(studentRecord => {
              let studentId = null;
              let studentData = null;
              
              if (typeof studentRecord.student === 'object' && studentRecord.student) {
                studentId = studentRecord.student._id;
                studentData = studentRecord.student;
              } else if (typeof studentRecord.student === 'string') {
                studentId = studentRecord.student;
              }
              
              if (!studentId) return;
              
              const currentStudent = students.find(s => {
                if (s._id === studentId || s._id.toString() === studentId.toString()) return true;
                if (studentData && studentData.email && s.email === studentData.email) return true;
                if (studentData && studentData.rollNo && s.rollNo === studentData.rollNo) return true;
                return false;
              });
              
              const matchedStudentId = currentStudent ? currentStudent._id : studentId;
              sessionAttendance[matchedStudentId] = studentRecord.status;
              if (studentRecord.remarks) {
                sessionRemarks[matchedStudentId] = studentRecord.remarks;
              }
              loadedCount++;
            });
          }
          
          setAttendance(sessionAttendance);
          setRemarks(sessionRemarks);
          setSuccessMessage(`Loaded attendance data for "${sessionName}" (${loadedCount} students)`);
          setTimeout(() => setSuccessMessage(''), 4000);
        } else {
          setError(`No data found for session "${sessionName}"`);
        }
      } else {
        setError(`No data found for session "${sessionName}"`);
      }
    } catch (err) {
      console.error('Error loading session data:', err);
      setError(`Error loading session: ${err.message}`);
    } finally {
      setLoadingSessionData(false);
    }
  };

  const handleCreateSession = async () => {
    const sessionName = showCustomSession ? customSession : session;
    
    if (!sessionName.trim()) {
      setError('Please enter a session name');
      return;
    }

    if (!branchFilter) {
      setError('Please select branch first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const createResponse = await fetch(`${API_BASE}/hackathonattendance/hackathon/${selectedHackathon}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: sessionName.trim(),
          branch: branchFilter,
          year: yearFilter
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create session');
      }

      setSuccessMessage(`Session "${sessionName.trim()}" created successfully! Now mark attendance and click Submit.`);
      
      const token2 = localStorage.getItem('token');
      const headers2 = token2 ? { 'Authorization': `Bearer ${token2}` } : {};
      
      fetch(`${API_BASE}/hackathonattendance/hackathon/${selectedHackathon}/sessions?branch=${encodeURIComponent(branchFilter)}`, { headers: headers2 })
        .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch sessions'))
        .then(data => {
          if (data.success && data.data.branches && data.data.branches.length > 0) {
            setSessions(data.data.branches[0].sessions || []);
            setSession(sessionName.trim());
            setShowCustomSession(false);
            setCustomSession('');
          }
        })
        .catch(err => console.warn('Could not refresh sessions:', err));
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(`Failed to create session: ${err.message}`);
    }
  };

  const branches = Array.from(new Set(students.map(s => s.branch).filter(Boolean))).sort();
  const years = Array.from(new Set(students.map(s => s.year || s.currentYear).filter(Boolean))).sort();

  const filteredStudents = students.filter(s => {
    if (branchFilter && s.branch !== branchFilter) return false;
    if (yearFilter && s.year !== yearFilter && s.currentYear !== yearFilter) return false;
    if (!searchText) return true;
    const q = searchText.trim().toLowerCase();
    const name = (s.name || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const roll = (s.rollNo || '').toLowerCase();
    return name.includes(q) || email.includes(q) || roll.includes(q);
  });

  const stats = {
    total: filteredStudents.length,
    present: filteredStudents.filter(s => attendance[s._id] === 'present').length,
    absent: filteredStudents.filter(s => attendance[s._id] === 'absent').length,
  };

  const setStudentStatus = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
    
    if (status === 'present' && remarks[studentId]) {
      setRemarks(prev => {
        const newRemarks = { ...prev };
        delete newRemarks[studentId];
        return newRemarks;
      });
    }
  };

  const setStudentRemark = (studentId, remarkText) => {
    setRemarks(prev => ({
      ...prev,
      [studentId]: remarkText
    }));
  };

  const markAllPresent = () => {
    const updates = {};
    filteredStudents.forEach(s => {
      updates[s._id] = 'present';
    });
    setAttendance(prev => ({ ...prev, ...updates }));
    setRemarks({});
  };

  const markAllAbsent = () => {
    const updates = {};
    filteredStudents.forEach(s => {
      updates[s._id] = 'absent';
    });
    setAttendance(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    const sessionToSubmit = showCustomSession ? customSession : session;
    
    if (!selectedHackathon || !sessionToSubmit.trim() || !branchFilter) {
      setError('Please select hackathon, branch, and session name');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      
      const branchStudents = students.filter(s => 
        s.branch === branchFilter
      );

      const attendanceRecords = branchStudents.map(student => ({
        studentId: student._id,
        status: attendance[student._id] || 'absent',
        remarks: remarks[student._id] || ''
      }));

      const response = await fetch(`${API_BASE}/hackathonattendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hackathonId: selectedHackathon,
          sessionName: sessionToSubmit.trim(),
          branch: branchFilter,
          year: yearFilter,
          attendanceRecords: attendanceRecords
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit attendance');
      }

      const result = await response.json();
      
      setSuccessMessage(
        `Attendance submitted! ${result.data.created} created, ${result.data.updated} updated` +
        (result.data.failed > 0 ? `, ${result.data.failed} failed` : '')
      );
      
      if (result.data.errors && result.data.errors.length > 0) {
        console.warn('Attendance errors:', result.data.errors);
      }
      
      const token2 = localStorage.getItem('token');
      const headers2 = token2 ? { 'Authorization': `Bearer ${token2}` } : {};
      
      fetch(`${API_BASE}/hackathonattendance/hackathon/${selectedHackathon}/sessions?branch=${encodeURIComponent(branchFilter)}`, { headers: headers2 })
        .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch sessions'))
        .then(data => {
          if (data.success && data.data.branches && data.data.branches.length > 0) {
            setSessions(data.data.branches[0].sessions || []);
          }
        })
        .catch(err => console.warn('Could not refresh sessions:', err));
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      setError(`Failed to submit attendance: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedHackathonData = hackathons.find(h => (h._id || h.id) === selectedHackathon);

  return (
    <div className="attendance-container" style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
      <div className="page-header" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#1f2937' }}>Attendance Management</h1>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Track student attendance for hackathons - Filtered by {coordinatorCollege || 'your college'} {coordinatorYear && `(Year ${coordinatorYear})`}</p>
        </div>
        <button
          onClick={() => window.location.href = '/coordinator/hackattendancehistory'}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: '#6366f1',
            color: 'white',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#4f46e5'}
          onMouseLeave={(e) => e.target.style.background = '#6366f1'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Attendance History
        </button>
      </div>

      <div style={{ background: '#e0f2fe', border: '1px solid #0ea5e9', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Info size={20} style={{ color: '#0284c7', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 14, color: '#0c4a6e' }}>
          <strong>Filtered View:</strong> Showing only hackathons and students matching your college ({coordinatorCollege}) {coordinatorYear && `and year (${coordinatorYear})`}. Each branch gets its own separate attendance document.
        </div>
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Hackathon *</label>
            <select 
              value={selectedHackathon} 
              onChange={e => setSelectedHackathon(e.target.value)}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: 'white' }}
            >
              <option value="">-- Select Hackathon --</option>
              {hackathons.map(h => (
                <option key={h._id || h.id} value={h._id || h.id}>
                  {h.hackathonname || h.name}
                </option>
              ))}
            </select>
            {hackathons.length === 0 && (
              <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                No hackathons found for your college/year
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Branch *</label>
            <select 
              value={branchFilter} 
              onChange={e => setBranchFilter(e.target.value)}
              disabled={branches.length === 0}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: 'white' }}
            >
              <option value="">-- Select Branch --</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {branchFilter && '📄 Separate document for this branch'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Session *</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {showCustomSession ? (
                <input 
                  type="text"
                  value={customSession}
                  onChange={e => setCustomSession(e.target.value)}
                  placeholder="Enter custom session name"
                  style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                />
              ) : (
                <select
                  value={session}
                  onChange={e => handleSessionChange(e.target.value)}
                  disabled={loadingSessions || sessions.length === 0 || !branchFilter}
                  style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: 'white' }}
                >
                  <option value="">-- Select Session --</option>
                  {sessions.map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name} {s.hasData ? `(${s.studentCount || 0} students)` : '(No data)'}
                    </option>
                  ))}
                </select>
              )}
              {showCustomSession && (
                <button
                  onClick={handleCreateSession}
                  disabled={!branchFilter}
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: 8, 
                    border: 'none', 
                    background: !branchFilter ? '#9ca3af' : '#10b981',
                    color: 'white',
                    cursor: !branchFilter ? 'not-allowed' : 'pointer', 
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Create Session
                </button>
              )}
              <button
                onClick={() => {
                  setShowCustomSession(!showCustomSession);
                  setSession('');
                  setCustomSession('');
                }}
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: 8, 
                  border: '1px solid #d1d5db', 
                  background: showCustomSession ? '#6366f1' : 'white',
                  color: showCustomSession ? 'white' : '#374151',
                  cursor: 'pointer', 
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                {showCustomSession ? 'Select Existing' : 'Add Custom'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {!branchFilter
                ? 'Select branch first to view its sessions'
                : showCustomSession 
                  ? 'Enter a session name and click "Create Session"'
                  : loadingSessions 
                    ? 'Loading sessions...'
                    : sessions.length > 0 
                      ? `${sessions.length} session(s) in ${branchFilter} document`
                      : 'No sessions yet. Create one using "Add Custom"'
              }
            </div>
          </div>
        </div>

        {selectedHackathonData && (
          <div style={{ marginTop: 16, padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#4b5563' }}>
              <strong style={{ color: '#1f2937' }}>Selected:</strong> {selectedHackathonData.hackathonname || selectedHackathonData.name}
              {selectedHackathonData.startdate && ` • ${new Date(selectedHackathonData.startdate).toLocaleDateString()}`}
              {selectedHackathonData.enddate && ` to ${new Date(selectedHackathonData.enddate).toLocaleDateString()}`}
              {branchFilter && ` • Branch: ${branchFilter} (Separate Doc)`}
            </div>
          </div>
        )}
      </div>

      {selectedHackathon && branchFilter && (
        <>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Filters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>Year</label>
                <select 
                  value={yearFilter} 
                  onChange={e => setYearFilter(e.target.value)}
                  disabled={years.length === 0}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                >
                  <option value="">All Years</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>Search</label>
                <input 
                  value={searchText} 
                  onChange={e => setSearchText(e.target.value)} 
                  placeholder="Name, email, roll no..."
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                />
              </div>
            </div>

            <div className="button-group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button 
                onClick={() => { setSearchText(''); setYearFilter(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 14 }}
              >
                Clear Filters
              </button>
              <button 
                onClick={markAllPresent}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Mark All Present
              </button>
              <button 
                onClick={markAllAbsent}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="stat-box" style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="stat-label" style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Total Students</div>
              <div className="stat-value" style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>{stats.total}</div>
            </div>
            <div className="stat-box" style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
              <div className="stat-label" style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Present</div>
              <div className="stat-value" style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>{stats.present}</div>
            </div>
            <div className="stat-box" style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #ef4444' }}>
              <div className="stat-label" style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Absent</div>
              <div className="stat-value" style={{ fontSize: 32, fontWeight: 700, color: '#ef4444' }}>{stats.absent}</div>
            </div>
          </div>

          {error && (
            <div style={{ padding: 16, background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 8, marginBottom: 16, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          {successMessage && (
            <div style={{ padding: 16, background: '#d1fae5', border: '1px solid #10b981', borderRadius: 8, marginBottom: 16, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={20} />
              {successMessage}
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Attendance - {branchFilter} Branch
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
                Hackathon: {selectedHackathonData?.hackathonname || selectedHackathonData?.name}
              </p>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading students...</div>
            ) : loadingSessionData ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading session data...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state" style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No students found for this branch matching your college/year</div>
            ) : (
              <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="attendance-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>S.No</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Student Name</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Roll No</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Year</th>
                      <th style={{ padding: 16, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, idx) => {
                      const status = attendance[student._id];
                      const isAbsent = status === 'absent';
                      return (
                        <React.Fragment key={student._id}>
                          <tr style={{ borderBottom: isAbsent && remarks[student._id] ? 'none' : '1px solid #f3f4f6' }}>
                            <td style={{ padding: 16, color: '#6b7280' }}>{idx + 1}</td>
                            <td style={{ padding: 16 }}>
                              <div style={{ fontWeight: 600, color: '#1f2937' }}>{student.name}</div>
                              <div style={{ fontSize: 13, color: '#6b7280' }}>{student.email}</div>
                            </td>
                            <td style={{ padding: 16, color: '#6b7280' }}>{student.rollNo}</td>
                            <td style={{ padding: 16, color: '#6b7280' }}>{student.year || student.currentYear}</td>
                            <td style={{ padding: 16 }}>
                              <div className="attendance-buttons" style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => setStudentStatus(student._id, 'present')}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    border: status === 'present' ? 'none' : '1px solid #d1d5db',
                                    background: status === 'present' ? '#10b981' : 'white',
                                    color: status === 'present' ? 'white' : '#6b7280',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {status === 'present' && <Check size={16} />}
                                  Present
                                </button>
                                <button
                                  onClick={() => setStudentStatus(student._id, 'absent')}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    border: status === 'absent' ? 'none' : '1px solid #d1d5db',
                                    background: status === 'absent' ? '#ef4444' : 'white',
                                    color: status === 'absent' ? 'white' : '#6b7280',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {status === 'absent' && <X size={16} />}
                                  Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isAbsent && (
                            <tr className="remarks-row" style={{ borderBottom: '1px solid #f3f4f6', background: '#fef2f2' }}>
                              <td colSpan="5" style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                  <label style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', minWidth: 60 }}>
                                    Remarks:
                                  </label>
                                  <input
                                    type="text"
                                    value={remarks[student._id] || ''}
                                    onChange={(e) => setStudentRemark(student._id, e.target.value)}
                                    placeholder="Enter reason for absence..."
                                    style={{
                                      flex: 1,
                                      minWidth: 150,
                                      padding: '8px 12px',
                                      borderRadius: 6,
                                      border: '1px solid #fca5a5',
                                      fontSize: 13,
                                      background: 'white'
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filteredStudents.length > 0 && (
            <div className="footer-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Total: <strong>{stats.total}</strong> | Present: <strong style={{ color: '#10b981' }}>{stats.present}</strong> | Absent: <strong style={{ color: '#ef4444' }}>{stats.absent}</strong>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || (!session.trim() && !customSession.trim())}
                style={{
                  padding: '16px 32px',
                  borderRadius: 8,
                  border: 'none',
                  background: submitting || (!session.trim() && !customSession.trim()) ? '#9ca3af' : '#6366f1',
                  color: 'white',
                  cursor: submitting || (!session.trim() && !customSession.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}