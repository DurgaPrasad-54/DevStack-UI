import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter,
  AlertCircle,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  Hash,
  BookOpen,
  Building,
  RefreshCw
} from 'lucide-react';

const AdminYearChangeDashboard = () => {
  const [yearChangeRequests, setYearChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  // API base URL - adjust this to match your backend
  const API_BASE_URL = 'http://127.0.0.1:5000/secondyear-change';

  // Fetch year change requests from the actual API
  const fetchYearChangeRequests = async (page = 1, status = 'pending') => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `${API_BASE_URL}/admin/year-change-requests?status=${status}&page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setYearChangeRequests(data.data.requests);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching year change requests:', error);
      setError('Failed to connect to server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchYearChangeRequests(1, filterStatus);
  }, [filterStatus]);

  // Handle individual approval
  const handleApprove = async (studentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/year-change-request/${studentId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'approve',
            adminId: localStorage.getItem('adminId') || 'admin',
            adminResponse: 'Approved by admin'
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        // Remove the approved request from the list
        setYearChangeRequests(prev => 
          prev.filter(req => req.studentId !== studentId)
        );
        alert('Year change request approved successfully!');
      } else {
        alert(data.message || 'Error approving request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  // Handle individual rejection
  const handleReject = async () => {
    if (!rejectingRequest || !rejectionReason.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/year-change-request/${rejectingRequest.studentId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'reject',
            adminId: localStorage.getItem('adminId') || 'admin',
            adminResponse: rejectionReason
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setYearChangeRequests(prev => 
          prev.filter(req => req.studentId !== rejectingRequest.studentId)
        );
        setShowRejectModal(false);
        setRejectingRequest(null);
        setRejectionReason('');
        alert('Year change request rejected successfully!');
      } else {
        alert(data.message || 'Error rejecting request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/bulk-approve-year-changes`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            adminId: localStorage.getItem('adminId') || 'admin',
            adminResponse: 'Bulk approved by admin'
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        // Refresh the data
        fetchYearChangeRequests(pagination.currentPage, filterStatus);
        setSelectedRequests([]);
        alert(`${data.data.approved.length} requests approved successfully!`);
      } else {
        alert(data.message || 'Error bulk approving requests');
      }
    } catch (error) {
      console.error('Error bulk approving requests:', error);
      alert('Error bulk approving requests');
    }
  };

  // Handle bulk rejection
  const handleBulkReject = async () => {
    if (selectedRequests.length === 0) return;

    const reason = prompt('Please provide a reason for bulk rejection:');
    if (!reason) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/bulk-reject-year-changes`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            adminId: localStorage.getItem('adminId') || 'admin',
            adminResponse: reason
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        // Refresh the data
        fetchYearChangeRequests(pagination.currentPage, filterStatus);
        setSelectedRequests([]);
        alert(`${data.data.rejected.length} requests rejected successfully!`);
      } else {
        alert(data.message || 'Error bulk rejecting requests');
      }
    } catch (error) {
      console.error('Error bulk rejecting requests:', error);
      alert('Error bulk rejecting requests');
    }
  };

  // Filter requests based on search term
  const filteredRequests = yearChangeRequests.filter(request => {
    const student = request.studentInfo;
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(req => req.studentId));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading year change requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="text-blue-600" />
                Year Change Requests Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Manage student year change requests</p>
            </div>
            <button
              onClick={() => fetchYearChangeRequests(pagination.currentPage, filterStatus)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{pagination.totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Page</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.currentPage}</p>
              </div>
              <Eye className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalPages}</p>
              </div>
              <Filter className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-blue-600">{selectedRequests.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or roll number..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All Status</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              {filterStatus === 'pending' && (
                <>
                  <button
                    onClick={handleBulkApprove}
                    disabled={selectedRequests.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve All Pending
                  </button>
                  <button
                    onClick={handleBulkReject}
                    disabled={selectedRequests.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject All Pending
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {filterStatus === 'pending' && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {filterStatus === 'pending' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.studentId} className="hover:bg-gray-50">
                    {filterStatus === 'pending' && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request.studentId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequests(prev => [...prev, request.studentId]);
                            } else {
                              setSelectedRequests(prev => prev.filter(id => id !== request.studentId));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {request.studentInfo.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.studentInfo.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.studentInfo.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {request.studentInfo.rollNo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen className="h-3 w-3 text-gray-400" />
                          {request.studentInfo.branch}
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Building className="h-3 w-3 text-gray-400" />
                          {request.studentInfo.college}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          Current: {request.studentInfo.currentYear}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium text-green-600 mb-1">
                          → {request.request.requestedYear}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(request.request.requestedAt)}
                        </div>
                        {request.request.reason && (
                          <div className="text-xs text-gray-600 italic">
                            "{request.request.reason}"
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.request.status)}
                      {request.request.processedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(request.request.processedAt)}
                        </div>
                      )}
                    </td>
                    {filterStatus === 'pending' && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.studentId)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingRequest(request);
                              setShowRejectModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && !error && (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No requests found</p>
              <p className="text-gray-400 text-sm">
                {filterStatus === 'pending' ? 'No pending requests at the moment' : `No ${filterStatus} requests found`}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchYearChangeRequests(pagination.currentPage - 1, filterStatus)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchYearChangeRequests(pagination.currentPage + 1, filterStatus)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Year Change Request
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to reject <strong>{rejectingRequest?.studentInfo.name}</strong>'s 
                request to change to <strong>{rejectingRequest?.request.requestedYear}</strong>?
                Please provide a reason:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="3"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingRequest(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminYearChangeDashboard;