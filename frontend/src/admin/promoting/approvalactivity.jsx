import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import config from '../../config'; // Adjust path as needed

const ApprovalActivity = () => {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, limit: 20 });
  const [status, setStatus] = useState('all');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = `${config.backendUrl}/promoting-students/admin/approval-activity`;

  const fetchActivity = async (page = 1, statusFilter = status, daysFilter = days) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pagination.limit);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (daysFilter) params.append('days', daysFilter);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch activity');
      setActivities(data.data.activities);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.message || 'Error fetching activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity(1, status, days);
    // eslint-disable-next-line
  }, [status, days]);

  const handlePageChange = (newPage) => {
    fetchActivity(newPage);
  };

  return (
    <div className="promoting-container">
      <div className="promoting-header">
        <h1 className="promoting-title">Student Approval Activity Log</h1>
        <p className="promoting-subtitle">
          View all student approval and rejection actions performed by admins.
        </p>
      </div>

      {/* Filters */}
      <div className="promoting-filters" style={{ marginBottom: '1rem' }}>
        <div className="promoting-filters-content" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label>Status:</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="promoting-search-input">
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <label>Days:</label>
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="promoting-search-input">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 1 year</option>
          </select>
          <button className="promoting-refresh-btn" onClick={() => fetchActivity(1)}>
            <RefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="promoting-alert promoting-alert-error">
          <AlertCircle className="promoting-alert-icon promoting-alert-icon-error" />
          <span className="promoting-alert-title promoting-alert-title-error">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="promoting-table-container" style={{ overflowX: 'auto' }}>
        <table className="promoting-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Email</th>
              <th>Year</th>
              <th>Branch</th>
              <th>College</th>
              <th>Admin</th>
              <th>Date</th>
              <th>Rejection Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  <RefreshCw className="promoting-spin" /> Loading...
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  No activity found.
                </td>
              </tr>
            ) : (
              activities.map((a, idx) => (
                <tr key={a._id || idx}>
                  <td>
                    {a.status === 'approved' ? (
                      <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={16} /> Approved
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={16} /> Rejected
                      </span>
                    )}
                  </td>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.currentYear}</td>
                  <td>{a.branch}</td>
                  <td>{a.college}</td>
                  <td>{a.adminName}</td>
                  <td>{a.formattedDate}</td>
                  <td style={{ color: '#dc2626' }}>{a.status === 'rejected' ? a.rejectionReason : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="promoting-pagination" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button
          className="promoting-btn"
          disabled={pagination.currentPage <= 1 || loading}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        >
          Prev
        </button>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button
          className="promoting-btn"
          disabled={pagination.currentPage >= pagination.totalPages || loading}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ApprovalActivity;
