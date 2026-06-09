import { useEffect, useState } from 'react';
import { Download, Calendar, Users, FileText, AlertCircle, Search, Filter } from 'lucide-react';
import config from '../../../config';
import './attendance.css';

export default function AttendanceHistoryViewer() {
  const API_BASE = config.backendUrl;
  
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

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
      setBranches([]);
      setSelectedBranch('');
      setSessions([]);
      setSelectedSession('');
      setAttendanceData(null);
      return;
    }

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    fetch(`${API_BASE}/hackathonattendance/hackathon/${selectedHackathon}/sessions`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch branches'))
      .then(data => {
        if (data.success && data.data.branches) {
          const branchList = data.data.branches.map(b => b.branch);
          setBranches(branchList);
        }
      })
      .catch(err => {
        console.error('Error fetching branches:', err);
        setBranches([]);
      });
  }, [selectedHackathon]);

  useEffect(() => {
    if (!selectedHackathon || !selectedBranch) {
      setSessions([]);
      setSelectedSession('');
      setAttendanceData(null);
      return;
    }

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    fetch(`${API_BASE}/hackathonattendance/hackathon/${selectedHackathon}/sessions?branch=${encodeURIComponent(selectedBranch)}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject('Failed to fetch sessions'))
      .then(data => {
        if (data.success && data.data.branches && data.data.branches.length > 0) {
          setSessions(data.data.branches[0].sessions || []);
        } else {
          setSessions([]);
        }
      })
      .catch(err => {
        console.error('Error fetching sessions:', err);
        setSessions([]);
      });
  }, [selectedHackathon, selectedBranch]);

  useEffect(() => {
    if (!selectedHackathon || !selectedBranch || !selectedSession) {
      setAttendanceData(null);
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    fetch(
      `${API_BASE}/hackathonattendance/hackathon/${selectedHackathon}?sessionName=${encodeURIComponent(selectedSession)}&branch=${encodeURIComponent(selectedBranch)}`,
      { headers }
    )
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load attendance data'))
      .then(data => {
        if (data.success && data.data.branches && data.data.branches.length > 0) {
          const branchData = data.data.branches[0];
          const sessionData = branchData.sessions.find(s => s.session === selectedSession);
          
          if (sessionData && sessionData.students) {
            setAttendanceData({
              branch: branchData.branch,
              year: branchData.year,
              session: sessionData.session,
              students: sessionData.students
            });
          } else {
            setAttendanceData(null);
            setError('No attendance data found for this session');
          }
        } else {
          setAttendanceData(null);
          setError('No attendance data found');
        }
      })
      .catch(err => {
        console.error('Error loading attendance:', err);
        setError(String(err));
        setAttendanceData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedHackathon, selectedBranch, selectedSession]);

  const selectedHackathonData = hackathons.find(h => (h._id || h.id) === selectedHackathon);

  const filteredStudents = attendanceData?.students.filter(student => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    const studentData = student.student;
    if (typeof studentData === 'object' && studentData) {
      const name = (studentData.name || '').toLowerCase();
      const email = (studentData.email || '').toLowerCase();
      const rollNo = (studentData.rollNo || '').toLowerCase();
      return name.includes(q) || email.includes(q) || rollNo.includes(q);
    }
    return false;
  }) || [];

  const stats = {
    total: filteredStudents.length,
    present: filteredStudents.filter(s => s.status === 'present').length,
    absent: filteredStudents.filter(s => s.status === 'absent').length,
    presentPercent: filteredStudents.length > 0 
      ? ((filteredStudents.filter(s => s.status === 'present').length / filteredStudents.length) * 100).toFixed(1)
      : 0
  };

  const downloadPDF = () => {
    if (!attendanceData || filteredStudents.length === 0) return;

    const printWindow = window.open('', '_blank');
    const hackathonName = selectedHackathonData?.hackathonname || selectedHackathonData?.name || 'Hackathon';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report - ${hackathonName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #6366f1;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #1f2937;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 14px;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
          }
          .info-item {
            display: flex;
            gap: 10px;
          }
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          .info-value {
            color: #6b7280;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
          }
          .stat-card.present .stat-value { color: #10b981; }
          .stat-card.absent .stat-value { color: #ef4444; }
          .stat-card.percent .stat-value { color: #6366f1; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          thead {
            background: #f9fafb;
          }
          th {
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 13px;
          }
          tr:hover {
            background: #fafafa;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-present {
            background: #d1fae5;
            color: #065f46;
          }
          .status-absent {
            background: #fee2e2;
            color: #991b1b;
          }
          .remarks {
            color: #ef4444;
            font-style: italic;
            font-size: 12px;
            margin-top: 4px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          @media print {
            body { padding: 20px; }
            .stat-card { break-inside: avoid; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Attendance Report</h1>
          <p>${hackathonName}</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="info-section">
          <div class="info-item">
            <span class="info-label">Branch:</span>
            <span class="info-value">${attendanceData.branch}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Session:</span>
            <span class="info-value">${attendanceData.session}</span>
          </div>
          ${attendanceData.year ? `
          <div class="info-item">
            <span class="info-label">Year:</span>
            <span class="info-value">${attendanceData.year}</span>
          </div>
          ` : ''}
          <div class="info-item">
            <span class="info-label">Date Range:</span>
            <span class="info-value">
              ${selectedHackathonData?.startdate ? new Date(selectedHackathonData.startdate).toLocaleDateString() : 'N/A'} - 
              ${selectedHackathonData?.enddate ? new Date(selectedHackathonData.enddate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Students</div>
            <div class="stat-value">${stats.total}</div>
          </div>
          <div class="stat-card present">
            <div class="stat-label">Present</div>
            <div class="stat-value">${stats.present}</div>
          </div>
          <div class="stat-card absent">
            <div class="stat-label">Absent</div>
            <div class="stat-value">${stats.absent}</div>
          </div>
          <div class="stat-card percent">
            <div class="stat-label">Attendance %</div>
            <div class="stat-value">${stats.presentPercent}%</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>Email</th>
              <th>Year</th>
              <th>Status</th>
              <th>Check-In Time</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((student, idx) => {
              const studentData = student.student;
              const name = studentData?.name || 'N/A';
              const rollNo = studentData?.rollNo || 'N/A';
              const email = studentData?.email || 'N/A';
              const year = studentData?.year || studentData?.currentYear || 'N/A';
              const status = student.status || 'absent';
              const checkInTime = student.checkInTime 
                ? new Date(student.checkInTime).toLocaleString() 
                : '-';
              const remarks = student.remarks || '-';
              
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${name}</strong></td>
                  <td>${rollNo}</td>
                  <td>${email}</td>
                  <td>${year}</td>
                  <td>
                    <span class="status-badge status-${status}">
                      ${status}
                    </span>
                  </td>
                  <td>${checkInTime}</td>
                  <td>${remarks !== '-' ? `<span class="remarks">${remarks}</span>` : remarks}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated report and does not require a signature.</p>
          <p>© ${new Date().getFullYear()} Hackathon Management System</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="attendance-container" style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={32} />
          Attendance History
        </h1>
        <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
          View and download attendance records - Filtered by {coordinatorCollege || 'your college'} {coordinatorYear && `(Year ${coordinatorYear})`}
        </p>
      </div>

      <div className="attendance-card" style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Filter size={20} style={{ color: '#6366f1' }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Filters</h3>
        </div>
        
        <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
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
              value={selectedBranch} 
              onChange={e => setSelectedBranch(e.target.value)}
              disabled={!selectedHackathon || branches.length === 0}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: 'white' }}
            >
              <option value="">-- Select Branch --</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Session *</label>
            <select 
              value={selectedSession} 
              onChange={e => setSelectedSession(e.target.value)}
              disabled={!selectedBranch || sessions.length === 0}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: 'white' }}
            >
              <option value="">-- Select Session --</option>
              {sessions.map((s, idx) => (
                <option key={idx} value={s.name}>
                  {s.name} ({s.studentCount || 0} students)
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedHackathonData && selectedBranch && selectedSession && (
          <div style={{ marginTop: 16, padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#4b5563' }}>
              <strong style={{ color: '#1f2937' }}>Viewing:</strong> {selectedHackathonData.hackathonname || selectedHackathonData.name} • 
              Branch: {selectedBranch} • Session: {selectedSession}
            </div>
          </div>
        )}
      </div>

      {attendanceData && (
        <>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="stat-box" style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="stat-label" style={{ fontSize: 14, color: '#6b7280', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} />
                Total Students
              </div>
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
            <div className="stat-box" style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #6366f1' }}>
              <div className="stat-label" style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>Attendance %</div>
              <div className="stat-value" style={{ fontSize: 32, fontWeight: 700, color: '#6366f1' }}>{stats.presentPercent}%</div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Attendance Records</h3>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
                  {attendanceData.branch} - {attendanceData.session}
                </p>
              </div>
              <div className="search-container" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="search-input-wrapper" style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Search students..."
                    style={{ paddingLeft: 40, padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, width: '100%', minWidth: 200 }}
                  />
                </div>
                <button
                  className="download-btn"
                  onClick={downloadPDF}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#6366f1',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading attendance data...</div>
            ) : error ? (
              <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
                <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state" style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No students found</div>
            ) : (
              <div className="table-container" style={{ overflowX: 'auto' }}>
                <table className="attendance-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>S.No</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Student Name</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Roll No</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Year</th>
                      <th style={{ padding: 16, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Check-In Time</th>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, idx) => {
                      const studentData = student.student;
                      const name = studentData?.name || 'N/A';
                      const rollNo = studentData?.rollNo || 'N/A';
                      const email = studentData?.email || 'N/A';
                      const year = studentData?.year || studentData?.currentYear || 'N/A';
                      const status = student.status || 'absent';
                      const checkInTime = student.checkInTime 
                        ? new Date(student.checkInTime).toLocaleString()
                        : '-';
                      const remarks = student.remarks || '-';

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: 16, color: '#6b7280' }}>{idx + 1}</td>
                          <td style={{ padding: 16 }}>
                            <div style={{ fontWeight: 600, color: '#1f2937' }}>{name}</div>
                          </td>
                          <td style={{ padding: 16, color: '#6b7280' }}>{rollNo}</td>
                          <td style={{ padding: 16, color: '#6b7280', fontSize: 13 }}>{email}</td>
                          <td style={{ padding: 16, color: '#6b7280' }}>{year}</td>
                          <td style={{ padding: 16, textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              background: status === 'present' ? '#d1fae5' : '#fee2e2',
                              color: status === 'present' ? '#065f46' : '#991b1b'
                            }}>
                              {status}
                            </span>
                          </td>
                          <td style={{ padding: 16, color: '#6b7280', fontSize: 13 }}>{checkInTime}</td>
                          <td style={{ padding: 16, color: remarks !== '-' ? '#ef4444' : '#6b7280', fontSize: 13, fontStyle: remarks !== '-' ? 'italic' : 'normal' }}>
                            {remarks}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedHackathon && (
        <div style={{ background: 'white', padding: 60, borderRadius: 12, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Calendar size={64} style={{ color: '#d1d5db', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px', color: '#6b7280' }}>No Hackathon Selected</h3>
          <p style={{ margin: 0, color: '#9ca3af' }}>Please select a hackathon, branch, and session to view attendance history</p>
        </div>
      )}
    </div>
  );
}