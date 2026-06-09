// src/components/AdminRoomAllocationBatch.js
// src/components/AdminRoomAllocationBatch.js
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import config from '../../../config';
import './roomallocation.css';

const AdminRoomAllocationBatch = () => {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(''); // Set to empty string for "All Hackathons"
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [allocationDetails, setAllocationDetails] = useState([]);
  
  // Modal pagination states
  const [modalPage, setModalPage] = useState(1);
  const [modalItemsPerPage] = useState(8);
  const [updatingModalId, setUpdatingModalId] = useState(null);
  
  // Search state for filtering table
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce timer ref
  const searchTimerRef = useRef(null);

  // Fetch hackathons
  const fetchHackathons = async () => {
    try {
      const res = await axios.get(`${config.backendUrl}/roomallocation/hackathons`);
      const fetchedHackathons = res.data.data || [];
      setHackathons(fetchedHackathons);
    } catch (err) {
      console.error('Error fetching hackathons:', err);
      setError('Failed to fetch hackathons');
    }
  };

  // Fetch batches based on filters
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 10,
      };

      // Only add hackathonId if a specific hackathon is selected
      if (selectedHackathon) {
        params.hackathonId = selectedHackathon;
      }

      const res = await axios.get(`${config.backendUrl}/roomallocation/admin/all`, {
        params,
      });
      setBatches(res.data.data);
      setTotalPages(res.data.pagination.total);

      // Fetch counts
      const countParams = { page: 1, limit: 1000 };
      if (selectedHackathon) {
        countParams.hackathonId = selectedHackathon;
      }

      const allBatchesRes = await axios.get(`${config.backendUrl}/roomallocation/admin/all`, {
        params: countParams,
      });
      const allBatches = allBatchesRes.data.data;
      setCounts({
        all: allBatches.length,
        pending: allBatches.filter(b => b.status === 'pending').length,
        approved: allBatches.filter(b => b.status === 'approved').length,
        rejected: allBatches.filter(b => b.status === 'rejected').length,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to fetch batches');
      setLoading(false);
    }
  };

  // Filter batches based on search term
  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      setFilteredBatches(batches);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = batches.filter(batch => {
      const hackathonName = batch.allocations?.[0]?.hackathon?.hackathonname || '';
      return hackathonName.toLowerCase().includes(searchLower);
    });
    
    setFilteredBatches(filtered);
  }, [searchTerm, batches]);

  // Fetch allocation details for a specific batch
  const fetchAllocationDetails = async (batchId, hackathonId) => {
    try {
      setModalLoading(true);
      const res = await axios.get(`${config.backendUrl}/roomallocation/admin/batch/${batchId}`);
      
      console.log('Raw allocation response:', res.data);
      
      let allocationsToProcess = res.data.data.allocations || [];
      
      if (hackathonId) {
        allocationsToProcess = allocationsToProcess.filter(allocation => 
          allocation.hackathon?._id === hackathonId || 
          allocation.hackathonId === hackathonId
        );
      }
      
      console.log('Filtered allocations for hackathon:', allocationsToProcess);
      
      const processedData = allocationsToProcess.map((allocation, index) => {
        console.log('Processing allocation:', allocation);
        
        return {
          sno: index + 1,
          campus: allocation.campus || allocation.Campus || allocation.campusName || 'N/A',
          branch: allocation.branch || allocation.Branch || allocation.branchName || 'N/A',
          mentorName: allocation.mentorname || allocation.mentorName || allocation.MentorName || allocation.mentor_name || 'N/A',
          roomNo: allocation.roomno || allocation.roomNo || allocation.roomNumber || allocation.RoomNo || allocation.room_no || 'N/A'
        };
      });
      
      console.log('Final processed data:', processedData);
      setAllocationDetails(processedData);
      setModalLoading(false);
    } catch (error) {
      console.error('Failed to fetch allocation details:', error);
      setAllocationDetails([]);
      setModalLoading(false);
    }
  };

  // Initial hackathon fetch
  useEffect(() => {
    fetchHackathons();
  }, []);

  // Fetch batches when filters change
  useEffect(() => {
    fetchBatches();
  }, [statusFilter, page, selectedHackathon]);

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Update batch status in modal
  const updateModalStatus = async (id, newStatus) => {
    if (!window.confirm(`Update batch status to "${newStatus}"?`)) return;
    try {
      setUpdatingModalId(id);
      await axios.patch(`${config.backendUrl}/roomallocation/admin/update-status/${id}`, { status: newStatus });
      setUpdatingModalId(null);
      
      // Update the selected batch status for immediate UI feedback
      if (selectedBatch && selectedBatch._id === id) {
        setSelectedBatch(prev => ({ ...prev, status: newStatus }));
      }
      
      // Refresh the main batch list
      fetchBatches();
      
      alert(`Batch ${newStatus} successfully!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
      setUpdatingModalId(null);
    }
  };

  // View batch details in modal
  const viewBatchDetails = async (batch) => {
    setSelectedBatch(batch);
    setShowModal(true);
    setModalPage(1);
    
    const hackathonId = batch.allocations?.[0]?.hackathon?._id || batch.allocations?.[0]?.hackathonId || selectedHackathon;
    
    await fetchAllocationDetails(batch._id, hackathonId);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedBatch(null);
    setAllocationDetails([]);
    setModalPage(1);
  };

  // Modal pagination logic
  const totalModalPages = Math.ceil(allocationDetails.length / modalItemsPerPage);
  const startIndex = (modalPage - 1) * modalItemsPerPage;
  const endIndex = startIndex + modalItemsPerPage;
  const currentModalData = allocationDetails.slice(startIndex, endIndex);

  const goToModalPage = (pageNumber) => {
    setModalPage(pageNumber);
  };

  const goToPreviousModalPage = () => {
    if (modalPage > 1) {
      setModalPage(modalPage - 1);
    }
  };

  const goToNextModalPage = () => {
    if (modalPage < totalModalPages) {
      setModalPage(modalPage + 1);
    }
  };

  return (
    <div className="admin-room-allocation">
      <div className="page-header">
        <h1>Admin Room Allocation Batches</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Search Bar for Hackathon Name */}
      <div className="hackathon-selection">
        <label className="hackathon-label">Search Hackathon:</label>
        <div className="hackathon-search-bar">
          <input
            type="text"
            className="hackathon-search-input-separate"
            placeholder="Type hackathon name to filter results..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button 
              className="search-clear-btn"
              onClick={clearSearch}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="status-tabs">
        <button
          className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setPage(1); setStatusFilter('all'); }}
        >
          All ({counts.all})
        </button>
        <button
          className={`status-tab ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => { setPage(1); setStatusFilter('pending'); }}
        >
          Pending ({counts.pending})
        </button>
        <button
          className={`status-tab ${statusFilter === 'approved' ? 'active' : ''}`}
          onClick={() => { setPage(1); setStatusFilter('approved'); }}
        >
          Approved ({counts.approved})
        </button>
        <button
          className={`status-tab ${statusFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => { setPage(1); setStatusFilter('rejected'); }}
        >
          Rejected ({counts.rejected})
        </button>
      </div>

      {loading && (
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <span>Loading batches...</span>
        </div>
      )}

      {!loading && filteredBatches.length === 0 && (
        <div className="no-data-message">
          {searchTerm ? `No batches found for hackathon name containing "${searchTerm}"` : 'No batches found.'}
        </div>
      )}

      {!loading && filteredBatches.length > 0 && (
        <div className="batches-table-container">
          <table className="batches-table">
            <thead>
              <tr>
                <th>SUBMITTED BY</th>
                <th>HACKATHON</th>
                <th>ALLOCATIONS</th>
                <th>REQUESTED DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map(batch => (
                <tr key={batch._id}>
                  <td className="submitter-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {batch.submittedBy?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="user-name">{batch.submittedBy}</span>
                    </div>
                  </td>
                  <td className="hackathon-cell">
                    <span className="hackathon-name">
                      {batch.allocations?.[0]?.hackathon?.hackathonname || 'N/A'}
                    </span>
                  </td>
                  <td className="allocations-cell">
                    <button
                      className="view-button"
                      onClick={() => viewBatchDetails(batch)}
                    >
                      View
                    </button>
                  </td>
                  <td className="date-cell">
                    <span className="date-icon">📅</span>
                    {new Date(batch.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric'
                    })}, {new Date(batch.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge-new status-${batch.status}`}>
                      {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination-section">
          <button
            className="pagination-button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button
            className="pagination-button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal for Allocation Details */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container-new" onClick={e => e.stopPropagation()}>
            <div className="modal-header-new">
              <h2>Room Allocation</h2>
              <button className="modal-close-btn-new" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-content-new">
              {modalLoading ? (
                <div className="modal-loading-new">
                  <div className="loading-spinner"></div>
                  <span>Loading allocation details...</span>
                </div>
              ) : allocationDetails.length === 0 ? (
                <div className="modal-no-data-new">
                  No allocation details found for this hackathon.
                </div>
              ) : (
                <>
                  <div className="modal-info-section">
                    <div className="modal-info-item">
                      <strong>Hackathon:</strong> 
                      <span>{selectedBatch?.allocations?.[0]?.hackathon?.hackathonname || 'N/A'}</span>
                    </div>
                    <div className="modal-info-item">
                      <strong>Submitted By:</strong> 
                      <span>{selectedBatch?.submittedBy || 'N/A'}</span>
                    </div>
                    <div className="modal-info-item">
                      <strong>Total Allocations:</strong> 
                      <span>{allocationDetails.length}</span>
                    </div>
                    <div className="modal-info-item">
                      <strong>Current Status:</strong> 
                      <span className={`status-badge-new status-${selectedBatch?.status}`}>
                        {selectedBatch?.status?.charAt(0)?.toUpperCase() + selectedBatch?.status?.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="modal-table-container">
                    <table className="modal-allocation-table">
                      <thead>
                        <tr>
                          <th className="sno-header">S.No</th>
                          <th className="campus-header">Campus</th>
                          <th className="branch-header">Branch</th>
                          <th className="mentor-header">Mentor Name</th>
                          <th className="room-header">Room No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentModalData.map((allocation, index) => (
                          <tr key={index} className="modal-table-row">
                            <td className="sno-cell-modal">{allocation.sno}</td>
                            <td className="campus-cell-modal">{allocation.campus}</td>
                            <td className="branch-cell-modal">{allocation.branch}</td>
                            <td className="mentor-cell-modal">{allocation.mentorName}</td>
                            <td className="room-cell-modal">{allocation.roomNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal Pagination */}
                  {totalModalPages > 1 && (
                    <div className="modal-pagination">
                      <div className="modal-pagination-info">
                        Showing {startIndex + 1} - {Math.min(endIndex, allocationDetails.length)} of {allocationDetails.length} entries
                      </div>
                      <div className="modal-pagination-controls">
                        <button
                          className="modal-pagination-btn"
                          onClick={goToPreviousModalPage}
                          disabled={modalPage === 1}
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: totalModalPages }, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            className={`modal-pagination-number ${modalPage === pageNum ? 'active' : ''}`}
                            onClick={() => goToModalPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        ))}
                        
                        <button
                          className="modal-pagination-btn"
                          onClick={goToNextModalPage}
                          disabled={modalPage === totalModalPages}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer-new">
              <div className="status-change-section">
                <span className="status-label">Change Status:</span>
                <div className="status-buttons-group">
                  {selectedBatch?.status !== 'pending' && (
                    <button 
                      className="modal-btn pending-btn-modal"
                      onClick={() => updateModalStatus(selectedBatch._id, 'pending')}
                      disabled={updatingModalId === selectedBatch._id}
                    >
                      {updatingModalId === selectedBatch._id ? 'Updating...' : 'Mark as Pending'}
                    </button>
                  )}
                  {selectedBatch?.status !== 'approved' && (
                    <button 
                      className="modal-btn approve-btn-modal"
                      onClick={() => updateModalStatus(selectedBatch._id, 'approved')}
                      disabled={updatingModalId === selectedBatch._id}
                    >
                      {updatingModalId === selectedBatch._id ? 'Updating...' : 'Approve'}
                    </button>
                  )}
                  {selectedBatch?.status !== 'rejected' && (
                    <button 
                      className="modal-btn reject-btn-modal"
                      onClick={() => updateModalStatus(selectedBatch._id, 'rejected')}
                      disabled={updatingModalId === selectedBatch._id}
                    >
                      {updatingModalId === selectedBatch._id ? 'Updating...' : 'Reject'}
                    </button>
                  )}
                </div>
              </div>
              <button className="modal-btn close-btn-modal" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoomAllocationBatch;