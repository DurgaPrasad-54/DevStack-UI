import { useState, useEffect } from 'react';

import { Calendar, MapPin, User, Building, Clock, Download, Search } from 'lucide-react';
import config from '../../../config';
import { useHackathon } from '../../Student/context/HackathonContext';

const API_BASE = `${config.backendUrl}/roomallocation`;
const ApprovedScheduleViewer = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

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
        setScheduleData({ allocations: [], hackathon: null });
        setLoading(false);
        return;
      }

      // FIX: Use correct backend route
      const response = await fetch(`${API_BASE}/schedule/approved/${currentHackathonId}`);
      const result = await response.json();

      if (!result.success) {
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

  const downloadSchedule = () => {
    if (!scheduleData) return;
    
    const csv = generateCSV(scheduleData.allocations);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scheduleData.hackathon.hackathonname}_approved_schedule.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (allocations) => {
    const headers = ['Room Number', 'Campus', 'Branch', 'Mentor Name', 'Mentor Email', 'Submitted By', 'Approved At'];
    const rows = allocations.map(alloc => [
      alloc.roomNumber,
      alloc.campusName,
      alloc.branch,
      alloc.mentor.name,
      alloc.mentor.email,
      alloc.submittedBy,
      new Date(alloc.approvedAt).toLocaleString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getFilteredAllocations = () => {
    if (!scheduleData) return [];
    
    return scheduleData.allocations.filter(allocation => {
      const matchesSearch = 
        allocation.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allocation.campusName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allocation.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allocation.mentor.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCampus = selectedCampus === 'all' || allocation.campusName === selectedCampus;
      const matchesBranch = selectedBranch === 'all' || allocation.branch === selectedBranch;
      
      return matchesSearch && matchesCampus && matchesBranch;
    });
  };

  const getUniqueCampuses = () => {
    if (!scheduleData) return [];
    return [...new Set(scheduleData.allocations.map(a => a.campusName))];
  };

  const getUniqueBranches = () => {
    if (!scheduleData) return [];
    const filteredAllocations = selectedCampus === 'all' 
      ? scheduleData.allocations 
      : scheduleData.allocations.filter(a => a.campusName === selectedCampus);
    return [...new Set(filteredAllocations.map(a => a.branch))];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approved schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Not Available</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchApprovedSchedule}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredAllocations = getFilteredAllocations();
  const campuses = getUniqueCampuses();
  const branches = getUniqueBranches();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Room Allocation Schedule
              </h1>
              {scheduleData && (
                <p className="text-gray-600 mt-1">
                  {scheduleData.hackathon.hackathonname} • {scheduleData.totalAllocations} rooms allocated
                </p>
              )}
            </div>
            <button
              onClick={downloadSchedule}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms, campus, branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Campus Filter */}
            <select
              value={selectedCampus}
              onChange={(e) => {
                setSelectedCampus(e.target.value);
                setSelectedBranch('all'); // Reset branch when campus changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Campuses</option>
              {campuses.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCampus('all');
                setSelectedBranch('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredAllocations.length} of {scheduleData?.totalAllocations || 0} room allocations
          </p>
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campus & Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAllocations.map((allocation) => (
                  <tr key={allocation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          Room {allocation.roomNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-start gap-1">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{allocation.campusName}</div>
                          <div className="text-gray-500">{allocation.branch}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {allocation.mentor.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {allocation.mentor.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {allocation.submittedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(allocation.approvedAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAllocations.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No room allocations found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {scheduleData && filteredAllocations.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Rooms</h3>
              <p className="text-2xl font-bold text-blue-600">{filteredAllocations.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Unique Mentors</h3>
              <p className="text-2xl font-bold text-green-600">
                {new Set(filteredAllocations.map(a => a.mentor._id)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Campuses</h3>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(filteredAllocations.map(a => a.campusName)).size}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedScheduleViewer;