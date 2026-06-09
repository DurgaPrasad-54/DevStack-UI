import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../../../config';
import './roomallocation.css';

const UserRoomAllocationBatch = () => {
  const submittedBy = localStorage.getItem("coordinatorname") || 'Anonymous';
  const coordinatorYear = localStorage.getItem("coordinatoryear") || '';
  const coordinatorCollege = localStorage.getItem("coordinatordetails") || '';
  
  const [hackathons, setHackathons] = useState([]);
  console.log(hackathons)
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [mentors, setMentors] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [hackathonBatches, setHackathonBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editBatchId, setEditBatchId] = useState(null);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Current allocation being edited
  const [currentAllocation, setCurrentAllocation] = useState({
    campusName: '',
    branch: '',
    mentor: '',
    roomNumber: ''
  });

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const hackathonParams = new URLSearchParams();
        if (coordinatorYear) hackathonParams.append('coordinatorYear', coordinatorYear);
        if (coordinatorCollege) hackathonParams.append('coordinatordetails', coordinatorCollege);
        
        const [hackRes, batchRes] = await Promise.all([
          axios.get(`${config.backendUrl}/roomallocation/hackathons?${hackathonParams.toString()}`),
          axios.get(`${config.backendUrl}/roomallocation/user/${submittedBy}`)
        ]);
        
        setHackathons(hackRes.data.data);
        setBatches(batchRes.data.data);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data');
      }
    }
    fetchInitialData();
  }, [submittedBy, coordinatorYear, coordinatorCollege]);

  useEffect(() => {
    async function fetchMentorsForHackathon() {
      if (!selectedHackathon) {
        setMentors([]);
        return;
      }
      
      try {
        setLoadingMentors(true);
        setError('');
        
        const mentorRes = await axios.get(
          `${config.backendUrl}/hackteams/mentors/search?hackathonId=${selectedHackathon}`
        );
        
        setMentors(mentorRes.data || []);
        
        if (!mentorRes.data || mentorRes.data.length === 0) {
          setError('No approved mentors found for this hackathon');
        }
      } catch (err) {
        console.error('Error fetching mentors:', err);
        setMentors([]);
        setError('Failed to load mentors for selected hackathon');
      } finally {
        setLoadingMentors(false);
      }
    }
    
    fetchMentorsForHackathon();
  }, [selectedHackathon]);

  useEffect(() => {
    async function fetchHackathonBatches() {
      if (!selectedHackathon) {
        setHackathonBatches([]);
        return;
      }
      try {
        const res = await axios.get(`${config.backendUrl}/roomallocation/hackathon/${selectedHackathon}`);
        setHackathonBatches(res.data.data);
      } catch {
        setHackathonBatches([]);
      }
    }
    fetchHackathonBatches();
  }, [selectedHackathon]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAllocation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addToTable = () => {
    if (!currentAllocation.campusName || !currentAllocation.branch || 
        !currentAllocation.mentor || !currentAllocation.roomNumber) {
      setError('Please fill all fields before adding to table');
      return;
    }

    setAllocations([...allocations, { ...currentAllocation }]);
    setCurrentAllocation({
      campusName: '',
      branch: '',
      mentor: '',
      roomNumber: ''
    });
    setError('');
    setSuccess('Allocation added to table!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const removeFromTable = (index) => {
    const newAllocs = [...allocations];
    newAllocs.splice(index, 1);
    setAllocations(newAllocs);
  };

  const editFromTable = (index) => {
    setCurrentAllocation(allocations[index]);
    removeFromTable(index);
  };

  const validateForm = () => {
    if (!selectedHackathon) {
      setError('Please select a hackathon');
      return false;
    }
    if (allocations.length === 0) {
      setError('Please add at least one allocation to the table');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setSelectedHackathon('');
    setAllocations([]);
    setCurrentAllocation({
      campusName: '',
      branch: '',
      mentor: '',
      roomNumber: ''
    });
    setEditBatchId(null);
    setError('');
    setSuccess('');
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setLoading(true);
    const allocationsWithHackathon = allocations.map(a => ({ ...a, hackathon: selectedHackathon }));
    try {
      if (editBatchId) {
        await axios.put(`${config.backendUrl}/roomallocation/edit/${editBatchId}`, { allocations: allocationsWithHackathon });
        setSuccess('Batch updated successfully!');
        toast.success('Batch updated successfully!');
      } else {
        await axios.post(`${config.backendUrl}/roomallocation/create`, {
          allocations: allocationsWithHackathon,
          submittedBy,
        });
        setSuccess('Batch created successfully!');
        toast.success('Batch created successfully!');
      }
      const batchRes = await axios.get(`${config.backendUrl}/roomallocation/user/${submittedBy}`);
      setBatches(batchRes.data.data);
      if (selectedHackathon) {
        const res = await axios.get(`${config.backendUrl}/roomallocation/hackathon/${selectedHackathon}`);
        setHackathonBatches(res.data.data);
      }
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      const message = err.response?.data?.message || 'Submission failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch) => {
    if (batch.submittedBy !== submittedBy) {
      alert("You can only edit batches you submitted.");
      return;
    }
    setEditBatchId(batch._id);
    setSelectedHackathon(batch.allocations[0]?.hackathon?._id || '');
    const allocs = batch.allocations.map(({ campusName, branch, mentor, roomNumber }) => ({
      campusName, branch, mentor, roomNumber
    }));
    setAllocations(allocs);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const batch = hackathonBatches.find(b => b._id === id);
    if (!batch || batch.submittedBy !== submittedBy) {
      alert("You can only delete batches you submitted.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await axios.delete(`${config.backendUrl}/roomallocation/delete/${id}`);
      setSuccess('Batch deleted successfully!');
      toast.success('Batch deleted successfully!');
      const batchRes = await axios.get(`${config.backendUrl}/roomallocation/user/${submittedBy}`);
      setBatches(batchRes.data.data);
      if (selectedHackathon) {
        const res = await axios.get(`${config.backendUrl}/roomallocation/hackathon/${selectedHackathon}`);
        setHackathonBatches(res.data.data);
      }
      if (editBatchId === id) resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete batch';
      setError(message);
      toast.error(message);
    }
  };

  const getMentorName = (mentorId) => {
    const mentor = mentors.find(m => m._id === mentorId);
    return mentor ? `${mentor.name} (${mentor.email})` : 'Unknown';
  };

  const getMentorDisplayName = (mentorData) => {
    if (!mentorData) return 'N/A';
    if (typeof mentorData === 'string') {
      return getMentorName(mentorData);
    }
    if (typeof mentorData === 'object' && mentorData.name) {
      return mentorData.name;
    }
    return 'N/A';
  };

  return (
    <div className="coordinator-roomalloc-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="coordinator-roomalloc-form-header">
        <h1>Room Allocation Management</h1>
        <p>Manage room allocations for hackathon participants</p>
      </div>

      <div className="coordinator-roomalloc-info-card">
        <div className="coordinator-roomalloc-info-grid">
          <div className="coordinator-roomalloc-info-item">
            <span className="coordinator-roomalloc-info-label">Coordinator:</span>
            <span className="coordinator-roomalloc-info-value">{submittedBy}</span>
          </div>
          <div className="coordinator-roomalloc-info-item">
            <span className="coordinator-roomalloc-info-label">Year:</span>
            <span className="coordinator-roomalloc-info-value">{coordinatorYear}</span>
          </div>
          <div className="coordinator-roomalloc-info-item">
            <span className="coordinator-roomalloc-info-label">College:</span>
            <span className="coordinator-roomalloc-info-value">{coordinatorCollege}</span>
          </div>
        </div>
        <p className="coordinator-roomalloc-info-note">
          Showing hackathons matching your year and college
        </p>
      </div>

      <div className="coordinator-roomalloc-form">
        <div className="coordinator-roomalloc-form-section">
          <div className="coordinator-roomalloc-form-group">
            <label>
              <strong>Select Hackathon:</strong>
            </label>
            <select
              value={selectedHackathon}
              onChange={e => {
                setSelectedHackathon(e.target.value);
                setShowForm(false);
                setAllocations([]);
                setCurrentAllocation({
                  campusName: '',
                  branch: '',
                  mentor: '',
                  roomNumber: ''
                });
              }}
            >
              <option value="">-- Select a Hackathon --</option>
              {hackathons.map(h => (
                <option key={h._id} value={h._id}>
                  {h.hackathonname} ({h.year})
                </option>
              ))}
            </select>
            {hackathons.length === 0 && (
              <p className="coordinator-roomalloc-message coordinator-roomalloc-warning-message">
                No hackathons found matching your year and college.
              </p>
            )}
            {loadingMentors && (
              <p className="coordinator-roomalloc-message coordinator-roomalloc-info-message">
                Loading mentors...
              </p>
            )}
            {selectedHackathon && mentors.length > 0 && (
              <p className="coordinator-roomalloc-message coordinator-roomalloc-success-message">
                {mentors.length} approved mentor(s) available
              </p>
            )}
          </div>
        </div>

        {selectedHackathon && !showForm && hackathonBatches.length === 0 && (
          <div className="coordinator-roomalloc-create-batch-section">
            <button
              className="coordinator-roomalloc-create-batch-btn"
              onClick={() => setShowForm(true)}
            >
              Create New Room Allocation Batch
            </button>
          </div>
        )}

        {showForm && selectedHackathon && (
          <div className="coordinator-roomalloc-allocation-form">
            <div className="coordinator-roomalloc-section-header">
              <h2>{editBatchId ? 'Edit' : 'Create'} Room Allocation Batch</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="coordinator-roomalloc-form-content">
                <div className="coordinator-roomalloc-input-section">
                  <h3>Add Allocation Details</h3>
                  <div className="coordinator-roomalloc-form-grid">
                    <div className="coordinator-roomalloc-form-group">
                      <label>Campus Name</label>
                      <input
                        type="text"
                        name="campusName"
                        value={currentAllocation.campusName}
                        onChange={handleInputChange}
                        placeholder="Enter campus name"
                      />
                    </div>
                    <div className="coordinator-roomalloc-form-group">
                      <label>Branch</label>
                      <input
                        type="text"
                        name="branch"
                        value={currentAllocation.branch}
                        onChange={handleInputChange}
                        placeholder="Enter branch"
                      />
                    </div>
                    <div className="coordinator-roomalloc-form-group">
                      <label>Mentor</label>
                      <select
                        name="mentor"
                        value={currentAllocation.mentor}
                        onChange={handleInputChange}
                        disabled={loadingMentors || mentors.length === 0}
                      >
                        <option value="">
                          {loadingMentors ? 'Loading...' : mentors.length === 0 ? 'No mentors available' : '-- Select Mentor --'}
                        </option>
                        {mentors.map(m => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="coordinator-roomalloc-form-group">
                      <label>Room Number</label>
                      <input
                        type="text"
                        name="roomNumber"
                        value={currentAllocation.roomNumber}
                        onChange={handleInputChange}
                        placeholder="Enter room number"
                      />
                    </div>
                  </div>
                  <div className="coordinator-roomalloc-add-to-table-section">
                    <button
                      type="button"
                      className="coordinator-roomalloc-add-to-table-btn"
                      onClick={addToTable}
                    >
                      Add to Table
                    </button>
                  </div>
                </div>

                {allocations.length > 0 && (
                  <div className="coordinator-roomalloc-table-section">
                    <h3>Allocations ({allocations.length})</h3>
                    <div className="coordinator-roomalloc-table-wrapper">
                      <table className="coordinator-roomalloc-table">
                        <thead>
                          <tr>
                            <th>s.No</th>
                            <th>Campus Name</th>
                            <th>Branch</th>
                            <th>Mentor</th>
                            <th>Room Number</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allocations.map((alloc, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{alloc.campusName}</td>
                              <td>{alloc.branch}</td>
                              <td>{getMentorName(alloc.mentor)}</td>
                              <td>{alloc.roomNumber}</td>
                              <td>
                                <div className="coordinator-roomalloc-table-actions">
                                  <button
                                    type="button"
                                    className="coordinator-roomalloc-table-edit-btn"
                                    onClick={() => editFromTable(index)}
                                    title="Edit"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="coordinator-roomalloc-table-delete-btn"
                                    onClick={() => removeFromTable(index)}
                                    title="Delete"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="coordinator-roomalloc-message coordinator-roomalloc-error-message">
                  {error}
                </div>
              )}

              {success && (
                <div className="coordinator-roomalloc-message coordinator-roomalloc-success-message">
                  {success}
                </div>
              )}

              <div className="coordinator-roomalloc-form-actions">
                <button
                  type="submit"
                  className="coordinator-roomalloc-submit-btn"
                  disabled={loading || loadingMentors || allocations.length === 0}
                >
                  {loading ? 'Submitting...' : (editBatchId ? 'Update Batch' : 'Submit Batch')}
                </button>
                <button
                  type="button"
                  className="coordinator-roomalloc-cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="coordinator-roomalloc-batches-section">
          <div className="coordinator-roomalloc-section-header">
            <h2>Submitted Batches for Selected Hackathon</h2>
          </div>

          {!selectedHackathon && (
            <p className="coordinator-roomalloc-message coordinator-roomalloc-info-message">
              Please select a hackathon to view batches.
            </p>
          )}

          {selectedHackathon && hackathonBatches.length === 0 && !showForm && (
            <p className="coordinator-roomalloc-message coordinator-roomalloc-info-message">
              No batches submitted for this hackathon yet. Create one above!
            </p>
          )}

          {hackathonBatches.map(batch => (
            <div key={batch._id} className="coordinator-roomalloc-batch-card">
              <div className="coordinator-roomalloc-batch-header">
                <div>
                  <span className={`coordinator-roomalloc-status-badge coordinator-roomalloc-status-${batch.status.toLowerCase()}`}>
                    {batch.status}
                  </span>
                </div>
                <div className="coordinator-roomalloc-batch-meta">
                  <strong>Submitted By:</strong> {batch.submittedBy} | 
                  <strong>Submitted At:</strong> {new Date(batch.createdAt).toLocaleString()}
                </div>
              </div>

              {batch.rejectionReason && (
                <div className="coordinator-roomalloc-rejection-reason">
                  <strong>Rejection Reason:</strong> {batch.rejectionReason}
                </div>
              )}

              <h4>Allocations ({batch.allocations.length}):</h4>
              <div className="coordinator-roomalloc-table-wrapper">
                <table className="coordinator-roomalloc-table coordinator-roomalloc-batch-table">
                  <thead>
                    <tr>
                      <th>S.NO</th>
                      <th>Hackathon</th>
                      <th>Campus</th>
                      <th>Branch</th>
                      <th>Mentor</th>
                      <th>Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.allocations.map((alloc, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{alloc.hackathon?.hackathonname || 'N/A'}</td>
                        <td>{alloc.campusName || 'N/A'}</td>
                        <td>{alloc.branch || 'N/A'}</td>
                        <td>{getMentorDisplayName(alloc.mentor)}</td>
                        <td>{alloc.roomNumber || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {batch.submittedBy === submittedBy && !editBatchId ? (
                <div className="coordinator-roomalloc-batch-actions">
                  <button
                    className="coordinator-roomalloc-edit-btn"
                    onClick={() => handleEdit(batch)}
                  >
                    Edit
                  </button>
                  <button
                    className="coordinator-roomalloc-delete-btn"
                    onClick={() => handleDelete(batch._id)}
                  >
                    Delete
                  </button>
                </div>
              ) : batch.submittedBy !== submittedBy && (
                <p className="coordinator-roomalloc-view-only">
                  <em>View only - This batch was submitted by another coordinator</em>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserRoomAllocationBatch;