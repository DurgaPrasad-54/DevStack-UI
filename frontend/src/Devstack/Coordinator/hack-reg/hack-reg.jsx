import { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Clock, Users, Download, AlertCircle } from 'lucide-react';
import config from '../../../config';
import './hack-reg.css';

const HackathonDashboard = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    department: 'all',
    branch: 'all'
  });
  const [activeStat, setActiveStat] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [coordinatorId] = useState(localStorage.getItem("coordinatorid"));
  const [coordinatorYear] = useState(localStorage.getItem("coordinatoryear") || '');
  const [coordinatorCollege] = useState(localStorage.getItem("coordinatordetails") || '');
  const [receiptModal, setReceiptModal] = useState({ open: false, imgUrl: '', studentName: '' });
  const [imageLoading, setImageLoading] = useState(true);

  const API_BASE = `${config.backendUrl}/hackreg`;

  useEffect(() => {
    if (!coordinatorYear || !coordinatorCollege) {
      console.error('Coordinator year or college not found in localStorage');
      return;
    }
    fetchHackathons();
  }, [coordinatorYear, coordinatorCollege]);

  useEffect(() => {
    filterStudents();
  }, [students, filters]);

  const fetchHackathons = async () => {
    try {
      // Pass coordinator year and college to get only matching hackathons
      const queryParams = new URLSearchParams();
      queryParams.append('year', coordinatorYear);
      queryParams.append('college', coordinatorCollege);
      
      const response = await fetch(`${API_BASE}/hackathons/all?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setHackathons(data.hackathons);
        console.log(`Loaded ${data.hackathons.length} hackathons for ${coordinatorCollege} - ${coordinatorYear}`);
      } else {
        console.error('Failed to fetch hackathons:', data);
      }
    } catch (error) { 
      console.error('Error fetching hackathons:', error); 
    }
  };

  const fetchStudents = async (hackathonId) => {
    if (!hackathonId) return;
    setLoading(true);
    
    try {
      // Pass coordinator year and college to filter students
      const queryParams = new URLSearchParams();
      queryParams.append('coordinatorYear', coordinatorYear);
      queryParams.append('coordinatorCollege', coordinatorCollege);
      
      const [studentsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/hackathon/${hackathonId}/students?${queryParams.toString()}`),
        fetch(`${API_BASE}/hackathon/${hackathonId}/stats`)
      ]);
      
      const studentsData = await studentsRes.json();
      const statsData = await statsRes.json();
      
      if (studentsRes.status === 403) {
        alert('You do not have permission to view this hackathon');
        setStudents([]);
        setStats({});
        return;
      }
      
      if (studentsData.success) {
        setStudents(studentsData.students);
        console.log(studentsData.students)
        console.log(`Loaded ${studentsData.students.length} students matching ${coordinatorCollege} - ${coordinatorYear}`);
      } else {
        console.error('Failed to fetch students:', studentsData);
        setStudents([]);
      }
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) { 
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally { 
      setLoading(false); 
    }
  };

  const filterStudents = () => {
    let filtered = [...students];
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(student => student.status === filters.status);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(student =>
        student.student.name.toLowerCase().includes(searchTerm) ||
        student.student.email.toLowerCase().includes(searchTerm) ||
        student.student.rollNo.toLowerCase().includes(searchTerm) ||
        student.transactionId.toLowerCase().includes(searchTerm) ||
        (student.upiUtrNumber && student.upiUtrNumber.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filters.department !== 'all') {
      filtered = filtered.filter(student => student.student.department === filters.department);
    }
    
    if (filters.branch !== 'all') {
      filtered = filtered.filter(student => student.student.branch === filters.branch);
    }
    
    setFilteredStudents(filtered);
  };

  const updateStudentStatus = async (registrationId, studentRegId, status, remarks = '') => {
    try {
      const response = await fetch(`${API_BASE}/student/${registrationId}/${studentRegId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, coordinatorId, remarks })
      });
      const data = await response.json();
      if (data.success) {
        setStudents(prev => prev.map(student =>
          student.studentRegId === studentRegId
            ? { ...student, status, verifiedAt: new Date(), verifiedBy: { name: 'Current User' } }
            : student
        ));
        fetchStudents(selectedHackathon);
        return true;
      }
    } catch (error) { 
      console.error('Error updating status:', error); 
    }
    return false;
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedStudents.length === 0) return;
    
    const updates = selectedStudents.map(studentId => {
      const student = students.find(s => s.studentRegId === studentId);
      return {
        registrationId: student.registrationId,
        studentRegId: student.studentRegId,
        status,
        remarks: `Bulk ${status} by coordinator`
      };
    });
    
    try {
      const response = await fetch(`${API_BASE}/hackathon/${selectedHackathon}/bulk-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, coordinatorId })
      });
      const data = await response.json();
      if (data.success) {
        setSelectedStudents([]);
        setShowBulkActions(false);
        fetchStudents(selectedHackathon);
      }
    } catch (error) { 
      console.error('Error in bulk update:', error); 
    }
  };

  const handleStudentSelection = (studentRegId) => {
    setSelectedStudents(prev => {
      const newSelection = prev.includes(studentRegId)
        ? prev.filter(id => id !== studentRegId)
        : [...prev, studentRegId];
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const viewReceipt = (registrationId, studentRegId, studentName) => {
    const url = `${API_BASE}/receipt/${registrationId}/${studentRegId}`;
    setReceiptModal({ open: true, imgUrl: url, studentName });
    setImageLoading(true);
  };

  const downloadReceipt = async () => {
    try {
      const response = await fetch(receiptModal.imgUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${receiptModal.studentName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  const closeModal = () => {
    setReceiptModal({ open: false, imgUrl: '', studentName: '' });
    setImageLoading(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const departments = [...new Set(students.map(s => s.student.department).filter(Boolean))];
  const branches = [...new Set(students.map(s => s.student.branch).filter(Boolean))];

  // Check if coordinator info is missing
  if (!coordinatorYear || !coordinatorCollege) {
    return (
      <div className="coordinator-hackreg-container">
        <div className="coordinator-hackreg-wrapper">
          <div style={{ 
            padding: '48px 24px', 
            textAlign: 'center',
            background: '#fef2f2',
            borderRadius: 8,
            border: '1px solid #fecaca'
          }}>
            <AlertCircle style={{ width: 48, height: 48, color: '#dc2626', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
              Missing Coordinator Information
            </h2>
            <p style={{ color: '#991b1b' }}>
              Please log in again to access the dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="coordinator-hackreg-container">
      <div className="coordinator-hackreg-wrapper">
        {/* Header */}
        <div className="coordinator-hackreg-header">
          <h1>Hackathon Fee Verification Dashboard</h1>
          <p>Manage student registrations and fee verifications</p>
          <div style={{ 
            marginTop: 12, 
            padding: '8px 16px',
            background: '#eff6ff',
            borderRadius: 6,
            border: '1px solid #bfdbfe',
            display: 'inline-block'
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1e40af' }}>
              Viewing: {coordinatorCollege} • {coordinatorYear}
            </span>
          </div>
        </div>

        {/* Hackathon Selection */}
        <div className="coordinator-hackreg-section-box">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Hackathon
          </label>
          <select
            value={selectedHackathon}
            onChange={(e) => {
              setSelectedHackathon(e.target.value);
              fetchStudents(e.target.value);
              setSelectedStudents([]);
              setShowBulkActions(false);
            }}
            className="coordinator-hackreg-select-input"
          >
            <option value="">Choose a hackathon...</option>
            {hackathons.map(hackathon => (
              <option key={hackathon._id} value={hackathon._id}>
                {hackathon.hackathonname} - ₹{hackathon.entryfee} ({hackathon.status})
              </option>
            ))}
          </select>
          {hackathons.length === 0 && (
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: '#fef3c7', 
              borderRadius: 6,
              border: '1px solid #fcd34d'
            }}>
              <p style={{ fontSize: 14, color: '#92400e', margin: 0 }}>
                ⚠️ No hackathons found for <strong>{coordinatorCollege} - {coordinatorYear}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Statistic Cards */}
        {selectedHackathon && (
          <div className="coordinator-hackreg-stats-grid">
            <div
              className={`coordinator-hackreg-stat-card cursor-pointer border ${activeStat === 'all' ? 'border-blue-600 shadow-lg' : 'border-transparent'}`}
              onClick={() => { setFilters(prev => ({ ...prev, status: 'all' })); setActiveStat('all'); }}>
              <Users className="coordinator-hackreg-icon text-blue-600" />
              <div>
                <div className="coordinator-hackreg-label">Total Students</div>
                <div className="coordinator-hackreg-value">{stats.totalRegistrations || 0}</div>
              </div>
            </div>
            <div
              className={`coordinator-hackreg-stat-card cursor-pointer border ${activeStat === 'pending' ? 'border-yellow-600 shadow-lg' : 'border-transparent'}`}
              onClick={() => { setFilters(prev => ({ ...prev, status: 'pending' })); setActiveStat('pending'); }}>
              <Clock className="coordinator-hackreg-icon text-yellow-600" />
              <div>
                <div className="coordinator-hackreg-label">Pending</div>
                <div className="coordinator-hackreg-value">{stats.pending || 0}</div>
              </div>
            </div>
            <div
              className={`coordinator-hackreg-stat-card cursor-pointer border ${activeStat === 'approved' ? 'border-green-600 shadow-lg' : 'border-transparent'}`}
              onClick={() => { setFilters(prev => ({ ...prev, status: 'approved' })); setActiveStat('approved'); }}>
              <Check className="coordinator-hackreg-icon text-green-600" />
              <div>
                <div className="coordinator-hackreg-label">Approved</div>
                <div className="coordinator-hackreg-value">{stats.approved || 0}</div>
              </div>
            </div>
            <div
              className={`coordinator-hackreg-stat-card cursor-pointer border ${activeStat === 'rejected' ? 'border-red-600 shadow-lg' : 'border-transparent'}`}
              onClick={() => { setFilters(prev => ({ ...prev, status: 'rejected' })); setActiveStat('rejected'); }}>
              <X className="coordinator-hackreg-icon text-red-600" />
              <div>
                <div className="coordinator-hackreg-label">Rejected</div>
                <div className="coordinator-hackreg-value">{stats.rejected || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {selectedHackathon && (
          <div className="coordinator-hackreg-section-box">
            <div className="coordinator-hackreg-filters">
              <div style={{ flex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 12, top: 12, width: 16, height: 16, color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, roll number, transaction ID, or UTR number..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    style={{ paddingLeft: 36 }}
                    className="coordinator-hackreg-select-input"
                  />
                </div>
              </div>
              <select
                value={filters.status}
                onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setActiveStat(e.target.value); }}
                className="coordinator-hackreg-select-input"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="coordinator-hackreg-select-input"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={`dept-${dept}`} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filters.branch}
                onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                className="coordinator-hackreg-select-input"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={`branch-${branch}`} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="coordinator-hackreg-bulk-actions">
            <span>
              {selectedStudents.length} students selected
            </span>
            <div>
              <button
                onClick={() => handleBulkStatusUpdate('approved')}
                className="coordinator-hackreg-approve"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('rejected')}
                className="coordinator-hackreg-reject"
              >
                Bulk Reject
              </button>
              <button
                onClick={() => {
                  setSelectedStudents([]);
                  setShowBulkActions(false);
                }}
                className="coordinator-hackreg-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Students Table */}
        {selectedHackathon && (
          <div className="coordinator-hackreg-table-container">
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allIds = filteredStudents.map(s => s.studentRegId);
                            setSelectedStudents(allIds);
                            setShowBulkActions(allIds.length > 0);
                          } else {
                            setSelectedStudents([]);
                            setShowBulkActions(false);
                          }
                        }}
                        checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th>Student Details</th>
                    <th>Transaction Details</th>
                    <th>Status</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '48px 0' }}>
                        <div className="coordinator-hackreg-spinner" style={{ display: 'inline-block', verticalAlign: 'middle' }}></div>
                        <span style={{ marginLeft: 8, color: '#6b7280' }}>Loading students...</span>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '48px 0' }}>
                        <div style={{ color: '#6b7280' }}>
                          <AlertCircle style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.5 }} />
                          <p style={{ fontWeight: 500, marginBottom: 4 }}>No students found</p>
                          <p style={{ fontSize: 14 }}>
                            No students from <strong>{coordinatorCollege} - {coordinatorYear}</strong> have registered yet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.studentRegId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.studentRegId)}
                            onChange={() => handleStudentSelection(student.studentRegId)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 500, color: '#111827' }}>
                              {student.student.name}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: 14 }}>
                              {student.student.rollNo} • {student.student.department}
                            </div>
                            {student.student.branch && (
                              <div style={{ color: '#6b7280', fontSize: 13 }}>
                                Branch: {student.student.branch}
                              </div>
                            )}
                            <div style={{ 
                              color: '#2563eb', 
                              fontSize: 12, 
                              fontWeight: 500,
                              marginTop: 4,
                              padding: '2px 8px',
                              background: '#eff6ff',
                              borderRadius: 4,
                              display: 'inline-block'
                            }}>
                              {student.student.college} • {student.student.year}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                              {student.student.email}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ color: '#111827' }}>
                            <div style={{ fontWeight: 500 }}>TXN: {student.transactionId}</div>
                            {student.upiUtrNumber && (
                              <div style={{ color: '#374151', fontSize: 14 }}>UTR: {student.upiUtrNumber}</div>
                            )}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                            {new Date(student.registeredAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td>
                          <span className={`coordinator-hackreg-status-badge coordinator-hackreg-status-${student.status || 'default'}`}>
                            {getStatusIcon(student.status)}
                            <span style={{ marginLeft: 4, textTransform: 'capitalize' }}>{student.status}</span>
                          </span>
                          {student.verifiedAt && (
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                              Verified: {new Date(student.verifiedAt).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => viewReceipt(student.registrationId, student.studentRegId, student.student.name)}
                            className="coordinator-hackreg-btn coordinator-hackreg-btn-view"
                          >
                            <Eye style={{ width: 16, height: 16, marginRight: 4 }} />
                            View
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {student.status !== 'approved' && (
                              <button
                                onClick={() => updateStudentStatus(student.registrationId, student.studentRegId, 'approved')}
                                className="coordinator-hackreg-btn coordinator-hackreg-btn-approve"
                              >
                                Approve
                              </button>
                            )}
                            {student.status !== 'rejected' && (
                              <button
                                onClick={() => updateStudentStatus(student.registrationId, student.studentRegId, 'rejected')}
                                className="coordinator-hackreg-btn coordinator-hackreg-btn-reject"
                              >
                                Reject
                              </button>
                            )}
                            {student.status !== 'pending' && (
                              <button
                                onClick={() => updateStudentStatus(student.registrationId, student.studentRegId, 'pending')}
                                className="coordinator-hackreg-btn coordinator-hackreg-btn-pending"
                              >
                                Pending
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {receiptModal.open && (
          <div className="coordinator-hackreg-modal-backdrop" onClick={closeModal}>
            <div className="coordinator-hackreg-modal-content" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                  Receipt - {receiptModal.studentName}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={downloadReceipt}
                    className="coordinator-hackreg-btn coordinator-hackreg-btn-view"
                  >
                    <Download style={{ width: 16, height: 16, marginRight: 4 }} />
                    Download
                  </button>
                  <button
                    className="coordinator-hackreg-modal-close-btn"
                    onClick={closeModal}
                  >
                    <X style={{ width: 20, height: 20 }} />
                  </button>
                </div>
              </div>
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                {imageLoading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 8 }}>
                    <div className="coordinator-hackreg-spinner"></div>
                    <p style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>Loading receipt...</p>
                  </div>
                )}
                <img
                  src={receiptModal.imgUrl}
                  alt="Receipt"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    console.error('Failed to load receipt image');
                  }}
                  className="coordinator-hackreg-modal-receipt-img"
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HackathonDashboard;