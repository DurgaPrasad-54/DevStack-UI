import { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';

const API_BASE = 'http://localhost:5000/roomallocation';

const RoomAllocationTable = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const { currentHackathonId } = useHackathon();

  useEffect(() => {
    fetchApprovedSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHackathonId]);

  const fetchApprovedSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!currentHackathonId) {
        setScheduleData({ allocations: [], hackathon: null, totalAllocations: 0 });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/schedule/approved/${currentHackathonId}`);
      const result = await response.json();

      if (!result.success) {
        if (result.message === 'No approved room allocations found for this hackathon') {
          setScheduleData({ allocations: [], hackathon: null, totalAllocations: 0 });
          return;
        }
        throw new Error(result.message || 'Failed to fetch schedule');
      }

      setScheduleData(result.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching approved schedule:', err);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading room allocations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Failed to Load Room Allocations</h3>
        <p>{error}</p>
        <button onClick={fetchApprovedSchedule} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (!scheduleData || scheduleData.allocations.length === 0) {
    return (
      <div className="no-data-container">
        <h3>No Room Allocations Found</h3>
        <p>There are currently no approved room allocations available.</p>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="room-allocation-container">
      <style jsx>{`
        .room-allocation-container {
          max-width: 1200px;
          margin: 0px auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f8fafc;
          min-height: 100vh;
          padding-top: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 5px;
          background-color: #f8fafc;
          padding: 10px 0;
        }

        .header h1 {
          color: #1e293b;
          font-size: 2.5rem;
          font-weight: 600;
          margin: 0;
        }

        .subtitle {
          text-align: center;
          color: #475569;
          font-size: 1.1rem;
          font-weight: 500;
          margin-bottom: 15px;
        }

        .stats-container {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 15px 0 20px 0;
          flex-wrap: wrap;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10px 18px;
          border-radius: 8px;
          text-align: center;
          min-width: 100px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .stat-card h3 {
          margin: 0 0 4px 0;
          font-size: 0.7rem;
          opacity: 0.9;
          font-weight: 500;
        }

        .stat-card p {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .table-wrapper {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .allocation-table {
          width: 100%;
          border-collapse: collapse;
          
        }

        .allocation-table thead {
          background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
          color: white;
        }

        .allocation-table th {
          padding: 18px 15px;
          text-align: left;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 2px solid rgba(255, 255, 255, 0.4);
          background-color: #669bbc;
          color: black;

        }

        .allocation-table th:last-child {
          border-right: none;
        }

        .allocation-table tbody tr {
          border-bottom: 2px solid #cbd5e1;
          transition: background-color 0.2s ease;
        }

        .allocation-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .allocation-table tbody tr:nth-child(even) {
          background-color: #f1f5f9;
        }

        .allocation-table tbody tr:nth-child(even):hover {
          background-color: #e2e8f0;
        }

        .allocation-table td {
          padding: 18px 15px;
          font-size: 0.95rem;
          color: #334155;
          border-right: 2px solid #cbd5e1;
        }

        .allocation-table td:last-child {
          border-right: none;
        }

        .sno-cell {
          font-weight: 600;
          color: #475569;
          text-align: center;
          width: 80px;
        }

        .room-cell {
          font-weight: 600;
          color: #1e40af;
          font-family: 'Courier New', monospace;
        }

        .mentor-cell {
          font-weight: 500;
          color: #059669;
        }

        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 0 10px;
        }

        .entries-info {
          color: #64748b;
          font-size: 0.9rem;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pagination-btn {
          padding: 10px 15px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .loading-container, .error-container, .no-data-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .spinner {
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .retry-btn {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 10px;
        }

        .retry-btn:hover {
          background: #2563eb;
        }

        /* Tablet view - 768px */
        @media (max-width: 768px) {
          .room-allocation-container {
            padding: 15px;
            padding-top: 15px;
          }

          .header {
            padding: 8px 0;
          }
          
          .header h1 {
            font-size: 2rem;
          }

          .subtitle {
            font-size: 1rem;
          }
          
          .stats-container {
            gap: 15px;
          }
          
          .stat-card {
            padding: 12px 16px;
            min-width: 90px;
          }

          .stat-card h3 {
            font-size: 0.65rem;
          }

          .stat-card p {
            font-size: 1.2rem;
          }

          .table-wrapper {
            overflow-x: auto;
            border-radius: 12px;
          }
          
          .allocation-table {
            min-width: 600px;
          }

          .allocation-table th,
          .allocation-table td {
            padding: 12px 10px;
            font-size: 0.85rem;
          }

          .allocation-table th {
            font-size: 0.85rem;
            padding: 15px 10px;
          }

          .sno-cell {
            width: 60px;
          }
          
          .pagination-container {
            flex-direction: column;
            gap: 15px;
            padding: 0 5px;
          }

          .pagination {
            flex-wrap: wrap;
            justify-content: center;
          }

          .pagination-btn {
            padding: 8px 12px;
            font-size: 0.85rem;
          }
        }

        /* Mobile view - 480px */
        @media (max-width: 480px) {
          .room-allocation-container {
            padding: 10px;
            padding-top: 10px;
          }

          .header {
            padding: 6px 0;
          }

          .header h1 {
            font-size: 1.5rem;
            margin-bottom: 10px;
          }

          .subtitle {
            font-size: 0.9rem;
            margin-bottom: 10px;
          }

          .stats-container {
            gap: 10px;
            margin: 10px 0 15px 0;
          }

          .stat-card {
            padding: 10px 12px;
            min-width: 80px;
            border-radius: 6px;
          }

          .stat-card h3 {
            font-size: 0.6rem;
            margin-bottom: 3px;
          }

          .stat-card p {
            font-size: 1.1rem;
          }

          .table-wrapper {
            border-radius: 10px;
            overflow-x: auto;
            margin-bottom: 15px;
          }

          .allocation-table {
            font-size: 0.75rem;
            min-width: 600px;
          }

          .allocation-table th {
            padding: 10px 6px;
            font-size: 0.7rem;
            letter-spacing: 0.3px;
          }

          .allocation-table td {
            padding: 10px 6px;
            font-size: 0.75rem;
          }

          .sno-cell {
            width: 45px;
            padding: 10px 4px;
          }

          .room-cell, .mentor-cell {
            font-size: 0.75rem;
          }

          .pagination-container {
            flex-direction: column;
            gap: 12px;
            padding: 0;
            margin-top: 15px;
          }

          .entries-info {
            font-size: 0.8rem;
            text-align: center;
          }

          .pagination {
            gap: 6px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .pagination-btn {
            padding: 6px 10px;
            font-size: 0.75rem;
            border-radius: 4px;
          }

          .loading-container, .error-container, .no-data-container {
            min-height: 300px;
            padding: 20px 10px;
          }

          .loading-container h3,
          .error-container h3,
          .no-data-container h3 {
            font-size: 1.2rem;
          }

          .loading-container p,
          .error-container p,
          .no-data-container p {
            font-size: 0.9rem;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border-width: 3px;
          }

          .retry-btn {
            padding: 8px 16px;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 320px) {
          .room-allocation-container {
            padding: 8px;
          }

          .header {
            padding: 5px 0;
          }

          .header h1 {
            font-size: 1.3rem;
          }

          .subtitle {
            font-size: 0.85rem;
          }

          .stats-container {
            gap: 8px;
            margin: 8px 0 12px 0;
          }

          .stat-card {
            padding: 8px 10px;
            min-width: 70px;
          }

          .stat-card h3 {
            font-size: 0.55rem;
          }

          .stat-card p {
            font-size: 1rem;
          }

          .table-wrapper {
            overflow-x: auto;
          }

          .allocation-table {
            min-width: 550px;
          }

          .allocation-table th {
            padding: 8px 4px;
            font-size: 0.65rem;
          }

          .allocation-table td {
            padding: 8px 4px;
            font-size: 0.7rem;
          }

          .sno-cell {
            width: 40px;
          }

          .pagination-btn {
            padding: 5px 8px;
            font-size: 0.7rem;
          }
        }
      `}</style>

      <div className="header">
        <h1>Room Allocation</h1>
      </div>

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

      <div className="pagination-container">
        <div className="entries-info">
          Showing {currentItems.length} entries
        </div>
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

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

          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomAllocationTable;