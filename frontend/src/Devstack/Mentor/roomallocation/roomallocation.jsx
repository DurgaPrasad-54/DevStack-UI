import { useState, useEffect } from 'react';
import config from '../../../config';
import './roomallocation.css';

const API_BASE = `${config.backendUrl}/roomallocation`; // Replace with your actual config
const BACKEND_URL = config.backendUrl; // Replace with your actual config

const RoomAllocationTable = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    mentorId: null,
    token: null,
    allRequests: [],
    filteredRequests: [],
    selectedHackathonId: null,
    step: 'initializing',
    timestamp: null
  });

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found in localStorage');
        return null;
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('✅ Token decoded successfully:', payload);
      
      setDebugInfo(prev => ({
        ...prev,
        token: token.substring(0, 20) + '...',
        mentorId: payload.userId
      }));
      
      return payload.userId;
    } catch (err) {
      console.error('❌ Failed to decode token:', err);
      setDebugInfo(prev => ({
        ...prev,
        step: 'token_decode_failed',
        error: err.message
      }));
      return null;
    }
  };

  const findMentorApprovedHackathon = async () => {
    try {
      const token = localStorage.getItem('token');
      const mentorId = getUserIdFromToken();
      
      console.log('='.repeat(60));
      console.log('🔍 STARTING HACKATHON SEARCH FOR MENTOR');
      console.log('='.repeat(60));
      console.log('📋 Mentor ID:', mentorId);
      
      setDebugInfo(prev => ({
        ...prev,
        step: 'fetching_mentor_requests',
        timestamp: new Date().toISOString()
      }));

      if (!mentorId || !token) {
        console.log('❌ Missing mentor ID or token');
        setDebugInfo(prev => ({
          ...prev,
          step: 'missing_credentials',
          error: 'No mentor ID or token found'
        }));
        return null;
      }

      const endpoint = `${BACKEND_URL}/hackathonrequests/mentor/${mentorId}`;
      console.log('🌐 Fetching from:', endpoint);

      const resp = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📡 Response status:', resp.status);

      if (!resp.ok) {
        console.log('❌ Response not OK');
        setDebugInfo(prev => ({
          ...prev,
          step: 'fetch_failed',
          error: `HTTP ${resp.status}`
        }));
        return null;
      }

      const data = await resp.json();
      console.log('📦 Raw response data:', data);
      console.log('📊 Response type:', Array.isArray(data) ? 'Array' : typeof data);
      console.log('📏 Response length:', Array.isArray(data) ? data.length : 'N/A');

      setDebugInfo(prev => ({
        ...prev,
        allRequests: data,
        step: 'processing_requests'
      }));

      if (!Array.isArray(data)) {
        console.log('❌ Response is not an array');
        return null;
      }

      console.log('\n' + '='.repeat(60));
      console.log('🔎 FILTERING HACKATHONS');
      console.log('='.repeat(60));

      // Log all requests
      data.forEach((item, index) => {
        console.log(`\n📌 Request #${index + 1}:`);
        console.log('  - Hackathon ID:', item.hackathon?._id || item.hackathon);
        console.log('  - Hackathon Name:', item.hackathon?.hackathonname || 'N/A');
        console.log('  - Request Status:', item.mentorRequest?.status || 'N/A');
        console.log('  - Hackathon Status:', item.hackathon?.status || 'N/A');
      });

      // Priority 1: Approved + Ongoing
      console.log('\n🎯 Priority 1: Looking for APPROVED + ONGOING...');
      const approvedOngoing = data.find(item => 
        item.mentorRequest?.status === 'approved' && 
        item.hackathon?.status === 'ongoing'
      );

      if (approvedOngoing && approvedOngoing.hackathon) {
        const hid = approvedOngoing.hackathon._id || approvedOngoing.hackathon;
        console.log('✅ FOUND APPROVED + ONGOING HACKATHON!');
        console.log('🎉 Hackathon ID:', hid);
        console.log('🎉 Hackathon Name:', approvedOngoing.hackathon.hackathonname);
        
        setDebugInfo(prev => ({
          ...prev,
          selectedHackathonId: hid,
          filteredRequests: [approvedOngoing],
          step: 'found_approved_ongoing',
          hackathonName: approvedOngoing.hackathon.hackathonname
        }));
        
        return hid;
      }

      // Priority 2: Approved (any status)
      console.log('🎯 Priority 2: Looking for APPROVED (any status)...');
      const approved = data.find(item => 
        item.mentorRequest?.status === 'approved' && 
        item.hackathon
      );

      if (approved) {
        const hid = approved.hackathon._id || approved.hackathon;
        console.log('✅ FOUND APPROVED HACKATHON!');
        console.log('🎉 Hackathon ID:', hid);
        console.log('🎉 Hackathon Name:', approved.hackathon.hackathonname);
        console.log('📊 Hackathon Status:', approved.hackathon.status);
        
        setDebugInfo(prev => ({
          ...prev,
          selectedHackathonId: hid,
          filteredRequests: [approved],
          step: 'found_approved',
          hackathonName: approved.hackathon.hackathonname
        }));
        
        return hid;
      }

      // Priority 3: Pending + Ongoing
      console.log('🎯 Priority 3: Looking for PENDING + ONGOING...');
      const pendingOngoing = data.find(item => 
        item.mentorRequest?.status === 'pending' && 
        item.hackathon?.status === 'ongoing'
      );

      if (pendingOngoing) {
        const hid = pendingOngoing.hackathon._id || pendingOngoing.hackathon;
        console.log('⏳ FOUND PENDING + ONGOING HACKATHON');
        console.log('📌 Hackathon ID:', hid);
        console.log('📌 Hackathon Name:', pendingOngoing.hackathon.hackathonname);
        
        setDebugInfo(prev => ({
          ...prev,
          selectedHackathonId: hid,
          filteredRequests: [pendingOngoing],
          step: 'found_pending_ongoing',
          hackathonName: pendingOngoing.hackathon.hackathonname
        }));
        
        return hid;
      }

      console.log('❌ NO MATCHING HACKATHON FOUND');
      setDebugInfo(prev => ({
        ...prev,
        step: 'no_match_found',
        selectedHackathonId: null
      }));
      
      return null;
    } catch (err) {
      console.error('❌ ERROR in findMentorApprovedHackathon:', err);
      setDebugInfo(prev => ({
        ...prev,
        step: 'error',
        error: err.message
      }));
      return null;
    }
  };

  useEffect(() => {
    fetchApprovedSchedule();
  }, []);

  const fetchApprovedSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('\n' + '='.repeat(60));
      console.log('🚀 FETCHING ROOM ALLOCATION SCHEDULE');
      console.log('='.repeat(60));

      const hackIdToUse = await findMentorApprovedHackathon();

      if (!hackIdToUse) {
        console.log('⚠️ No hackathon ID available - showing empty state');
        setScheduleData({ allocations: [], hackathon: null, totalAllocations: 0 });
        setLoading(false);
        setDebugInfo(prev => ({
          ...prev,
          step: 'no_hackathon_id'
        }));
        return;
      }

      const scheduleEndpoint = `${API_BASE}/schedule/approved/${hackIdToUse}`;
      console.log('🌐 Fetching room allocation from:', scheduleEndpoint);
      console.log('🎯 Using Hackathon ID:', hackIdToUse);

      setDebugInfo(prev => ({
        ...prev,
        step: 'fetching_room_allocation'
      }));

      const response = await fetch(scheduleEndpoint);
      const result = await response.json();

      console.log('📦 Room allocation response:', result);
      console.log('✅ Success:', result.success);

      if (!result.success) {
        if (result.message === 'No approved room allocations found for this hackathon') {
          console.log('ℹ️ No room allocations found for this hackathon');
          setScheduleData({ allocations: [], hackathon: null, totalAllocations: 0 });
          setDebugInfo(prev => ({
            ...prev,
            step: 'no_allocations_found'
          }));
          return;
        }

        throw new Error(result.message || 'Failed to fetch schedule');
      }

      console.log('✅ Room allocations loaded successfully!');
      console.log('📊 Total allocations:', result.data.allocations?.length || 0);
      
      setScheduleData(result.data);
      setDebugInfo(prev => ({
        ...prev,
        step: 'success',
        allocationsCount: result.data.allocations?.length || 0
      }));

      console.log('='.repeat(60));
      console.log('✅ PROCESS COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));

    } catch (err) {
      console.error('❌ ERROR in fetchApprovedSchedule:', err);
      setError(err.message);
      setDebugInfo(prev => ({
        ...prev,
        step: 'fetch_error',
        error: err.message
      }));
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = () => {
    if (!scheduleData || !scheduleData.allocations) return { totalRooms: 0, uniqueMentors: 0, uniqueCampuses: 0 };
    
    const allocations = scheduleData.allocations;
    const uniqueMentors = new Set(allocations.map(a => a.mentor._id)).size;
    const uniqueCampuses = new Set(allocations.map(a => a.campusName)).size;
    
    return {
      totalRooms: allocations.length,
      uniqueMentors,
      uniqueCampuses
    };
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = scheduleData?.allocations?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((scheduleData?.allocations?.length || 0) / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStepIcon = (step) => {
    const icons = {
      initializing: '🔄',
      fetching_mentor_requests: '🔍',
      processing_requests: '⚙️',
      found_approved_ongoing: '✅',
      found_approved: '✅',
      found_pending_ongoing: '⏳',
      no_match_found: '❌',
      fetching_room_allocation: '📡',
      success: '🎉',
      error: '❌',
      no_hackathon_id: '⚠️',
      no_allocations_found: 'ℹ️'
    };
    return icons[step] || '📌';
  };

  const getStepColor = (step) => {
    if (step.includes('success') || step.includes('found_approved')) return '#10b981';
    if (step.includes('error') || step.includes('no_match')) return '#ef4444';
    if (step.includes('pending')) return '#f59e0b';
    return '#3b82f6';
  };

  if (loading) {
    return (
      <div className="room-allocation-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading room allocations...</p>
          <p className="debug-step">{getStepIcon(debugInfo.step)} {debugInfo.step.replace(/_/g, ' ')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-allocation-container">
        <div className="error-container">
          <h3>Failed to Load Room Allocations</h3>
          <p>{error}</p>
          <button onClick={fetchApprovedSchedule} className="retry-btn">Try Again</button>
        </div>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100vh' }}>


      {/* Header */}
      <div className="header">
        <h1>Room Allocation Schedule</h1>
      </div>

      {/* Debug Console */}
    

      {/* Main Content */}
      {!scheduleData || scheduleData.allocations.length === 0 ? (
        <div className="no-data-container">
          <h3>No Room Allocations Found</h3>
          <p>There are currently no approved room allocations available.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          {/* <div className="stats-container">
            <div className="stat-card">
              <h3>Total Rooms</h3>
              <p>{stats.totalRooms}</p>
            </div>
            <div className="stat-card">
              <h3>Unique Mentors</h3>
              <p>{stats.uniqueMentors}</p>
            </div>
            <div className="stat-card">
              <h3>Campuses</h3>
              <p>{stats.uniqueCampuses}</p>
            </div>
          </div> */}

          {/* Table */}
          <div className="table-wrapper">
            <table className="allocation-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Campus</th>
                  <th>Branch</th>
                  <th>Mentor Name</th>
                  <th>Room No</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((allocation, index) => (
                  <tr key={allocation._id}>
                    <td className="sno-cell">{indexOfFirstItem + index + 1}</td>
                    <td>{allocation.campusName}</td>
                    <td>{allocation.branch}</td>
                    <td className="mentor-cell">{allocation.mentor.name}</td>
                    <td className="room-cell">{allocation.roomNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container">
            <div className="entries-info">Showing {currentItems.length} entries</div>
            <div className="pagination">
              <button className="pagination-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>

              {[...Array(Math.min(totalPages, 3))].map((_, index) => {
                let pageNum;
                if (totalPages <= 3) {
                  pageNum = index + 1;
                } else if (currentPage <= 2) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 1) {
                  pageNum = totalPages - 2 + index;
                } else {
                  pageNum = currentPage - 1 + index;
                }

                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => paginate(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button className="pagination-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoomAllocationTable;