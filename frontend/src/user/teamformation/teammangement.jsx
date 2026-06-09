import React, { useEffect, useState,useRef } from 'react';
import { UserPlus, UserCircle2, Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../teamformation/teammangement.css';
import config from '../../config';

const TeamPage = () => {
    const [teamDetails, setTeamDetails] = useState(null);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('invitations');
    const [teamRequest,setteamRequest] = useState([])
    const searchSectionRef = useRef(null);
    const [sentJoinRequests, setSentJoinRequests] = useState([]);
    const [allTeamRequests, setAllTeamRequests] = useState([]);
    const [hasNewRequests, setHasNewRequests] = useState({
        invitations: false,
        requests: false,
        teamRequests: false,
    });

    const TEAM_SIZE_LIMIT = 4;

    const showError = (message) => toast.error(message);
    const showSuccess = (message) => toast.success(message);
    const showInfo = (message) => toast.info(message);

    const fetchWithToken = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });
    };

    const fetchTeamDetails = async () => {
        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/my-team`);
            if (!response.ok) throw new Error('Failed to fetch team details');
            const data = await response.json();
            setTeamDetails(data);
            console.log(data)
        } catch (error) {
            showError('Error fetching team details');
        } finally {
            setLoading(false);
        }
    };
    

    const fetchAvailableStudents = async () => {
        if (!search) {
            setAvailableStudents([]);
            return;
        }
        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/available-students?search=${search}`);
            if (!response.ok) throw new Error('Failed to fetch available students');
            const data = await response.json();
            setAvailableStudents(data.students || []);
        } catch (error) {
            showError('Error fetching available students');
        } finally {
            setLoading(false);
        }
    };
    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    const handleStudentSelect = (student) => {
        if (!student?._id) {
            showError('Invalid student data');
            return;
        }


        const currentTeamSize = teamDetails?.teamDetails?.members?.length || 0;
        if (currentTeamSize + selectedStudents.length + 1 > TEAM_SIZE_LIMIT) {
            showError(`Team size cannot exceed ${TEAM_SIZE_LIMIT} members`);
            return;
        }
        
        if (!student.inTeam && !selectedStudents.includes(student._id)) {
            setSelectedStudents([...selectedStudents, student._id]);
            showSuccess('Student selected successfully');
        }
    };

    const handleStudentDeselect = (studentId) => {
        if (!studentId) return;
        setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        showInfo('Student removed from selection');
    };

    const handleSendRequests = async () => {
        if (!teamName || selectedStudents.length === 0) {
            showError("Please select students and provide a unique name for your new team");
            return;
        }
        if (selectedStudents.length + 1 > TEAM_SIZE_LIMIT) {
            showError(`Team size cannot exceed ${TEAM_SIZE_LIMIT} members`);
            return;
        }
        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/send-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientIds: selectedStudents, teamName }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send requests');
            }
            setSelectedStudents([]);
            setTeamName('');
            showSuccess('Team requests sent successfully');
            fetchTeamDetails();
           
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    };
    const handleSendJoinRequest = async (student) => {
        if (!student?.teamInfo?.teamId) {
            showError('Invalid team information');
            return;
        }

        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/send-join-request`, {
                method: 'POST',
                body: JSON.stringify({ teamId: student.teamInfo.teamId }),
            });
            if (!response.ok) throw new Error('Failed to send join request');
            showSuccess('Join request sent to the team lead');
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        if (!requestId) {
            showError('Invalid request ID');
            return;
        }
    
        try {
            const teamSize = teamDetails?.teamDetails?.students?.length || 0;
    
            if (teamSize >= TEAM_SIZE_LIMIT) {
                throw new Error(`Cannot accept request as it exceeds the maximum allowed team size of ${TEAM_SIZE_LIMIT} members.`);
            }
    
            setLoading(true);
            const response = await fetchWithToken(
                `${config.backendUrl}/teamformation/accept-request`,
                { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId })
                }
            );
    
            if (!response.ok) throw new Error('Failed to accept request');
            showSuccess('Request accepted successfully');
            await fetchJoinRequests();
            await fetchTeamDetails();
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (!requestId) {
            showError('Invalid request ID');
            return;
        }

        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/reject-request`, {
                method: 'POST',
                body: JSON.stringify({ requestId })
            });
            if (!response.ok) throw new Error('Failed to reject join request');
            showSuccess('Request rejected successfully');
            await fetchJoinRequests();
        } catch (error) {
            showError('Error rejecting join request');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptJoinRequest = async (requestId) => {
        try {
            setLoading(true);
    
            // Prepare the data to send in the request body
            const requestData = {
                requestId,  // Passing the requestId to the backend to identify which request to accept
            };
    
            // Perform the POST request with the token included
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/accept-join-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Tell the backend that the body is JSON
                },
                body: JSON.stringify(requestData), // Send the requestId as a JSON string
            });
    
            // Handle response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to accept request');
            }
    
            // If the request was successful, show success message
            showSuccess('Join request accepted successfully!');
    
            // Fetch updated data: Updated join requests and team details
            fetchJoinRequests();  // Function that fetches the updated list of join requests
            fetchTeamDetails();   // Function that fetches the updated team details
    
        } catch (error) {
            // Handle any errors that occur during the request
            showError(error.message);
        } finally {
            // Stop the loading spinner regardless of success or failure
            setLoading(false);
        }
    };

    const handleRejectJoinRequest = async (requestId) => {
        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/reject-join-request`, {
                method: 'POST',
                body: JSON.stringify({ requestId }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject request');
            }

            showSuccess('Join request rejected successfully!');
            fetchJoinRequests();
            fetchTeamDetails();
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudentsToTeam = async () => {
        if (selectedStudents.length === 0) {
            showError("Please select at least one student");
            return;
        }
    
        const currentTeamSize = teamDetails?.teamDetails?.members?.length || 0;
        if (currentTeamSize + selectedStudents.length > TEAM_SIZE_LIMIT) {
            showError(`Adding these students would exceed the team limit of ${TEAM_SIZE_LIMIT}`);
            return;
        }
    
        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/add-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentIds: selectedStudents 
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send team requests');
            }

            showSuccess('Team join requests sent successfully');
            setSelectedStudents([]);
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTeamRequests = async () => {
        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/all-team-requests`);
            if (!response.ok) throw new Error('Failed to fetch team requests');
            const data = await response.json();
            setAllTeamRequests(data || []);
            console.log('Team requests:', data);
        } catch (error) {
            showError('Error fetching team requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamDetails();
        if (search) {
            fetchAvailableStudents();
        }
        fetchJoinRequests();
        fetchAllTeamRequests(); // Fetch all team requests
    }, [search]);

    useEffect(() => {
        fetchTeamDetails();
        fetchJoinRequests();
    }, []);
    


    useEffect(() => {
        fetchTeamDetails();
        fetchJoinRequests();
    }, []);

    const handleToggleView = (view) => {setActiveTab(view);}
    const handleTabClick = async (tab) => {
        try {
            setActiveTab(tab);
            if (['invitations', 'requests', 'teamRequests'].includes(tab)) {
                await deleteRequests(); // Call deleteRequests only for specific tabs
                setHasNewRequests((prev) => ({ ...prev, [tab]: false })); // Remove dot indicator
            }
            handleToggleView(tab);
        } catch (error) {
            console.error('Error handling tab click:', error.message);
        }
    };

    const fetchJoinRequests = async () => {
        try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/join-requests`);
            if (!response.ok) throw new Error('Failed to fetch join requests');
            const data = await response.json();
            setJoinRequests(data || []);
            if (data.length > 0) setHasNewRequests((prev) => ({ ...prev, requests: true })); // Set dot
            console.log(data)
        } catch (error) {
            setError('Error fetching join requests');
        } finally {
            setLoading(false);
        }
    };

    
    useEffect(() => {
        const fetchSentRequests = async () => {
          try {
            setLoading(true);
            const response = await fetchWithToken(`${config.backendUrl}/teamformation/sent-user-requests`);
            if (!response.ok) throw new Error('Failed to fetch sent requests');
            const data = await response.json();
            setInvitations(data || []);
            if (data.length > 0) setHasNewRequests((prev) => ({ ...prev, invitations: true })); // Set dot
          } catch (error) {
            setError('Error fetching sent requests');
            console.error('Fetch error:', error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchSentRequests();
      }, []);
           
const deleteRequests = async () => {
    try {
        const response = await fetch(`${config.backendUrl}/teamformation/delete-requests`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete requests');
        }
        
        const data = await response.json();
        return data.message;
        console.log("deleted",data)
    } catch (error) {
        console.error('Error deleting requests:', error);
        throw error;
    }
};
useEffect(() => {
    deleteRequests();
  }, []);

      // In your component, make sure you're correctly passing the student object to the function
// In your component, make sure you're correctly passing the student object to the function
const sendRequest = async (student) => {
    if (!student?.teamInfo?.teamId) {
        setError('Invalid team selected');
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
        const response = await fetchWithToken(`${config.backendUrl}/teamformation/send-join-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                teamId: student.teamInfo.teamId,
                type: 'join_team'
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send join request');
        }

        // Show success message
        showSuccess('Join request sent successfully!');
        
        // Refresh sent join requests to update the UI
        fetchSentJoinRequests();
        
    } catch (err) {
        setError(err.message);
        showError(err.message);
    } finally {
        setLoading(false);
    }
};


const fetchSentJoinRequests = async () => {
    try {
        setLoading(true);
        const response = await fetchWithToken(`${config.backendUrl}/teamformation/sent-join-requests`);
        if (!response.ok) throw new Error('Failed to fetch sent join requests');
        const data = await response.json();
        console.log("hi",data)
        setSentJoinRequests(data || []);
    } catch (error) {
        setError('Error fetching sent join requests');
    } finally {
        setLoading(false);
    }
};





      const fetchRequests = async () => {
        try {
          const response = await fetch(`${config.backendUrl}/teamformation/received-requests`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
    
          if (!response.ok) {
            throw new Error('Failed to fetch requests');
          }
    
          const data = await response.json();
          setteamRequest(data);
          if (data.length > 0) setHasNewRequests((prev) => ({ ...prev, teamRequests: true })); // Set dot
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
    
      useEffect(() => {
        fetchRequests();
      }, []);

      const fetchsendTeamleadRequests = async () => {
        try {
          const response = await fetch(`${config.backendUrl}/teamformation/team-join-requests`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
    
          if (!response.ok) {
            throw new Error('Failed to fetch requests');
          }
    
          const data = await response.json();
        //   setRequests(data.requests || []);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
    
      useEffect(() => {
        fetchRequests();
      }, []);
      const scrollToSearch = () => {
        searchSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      };

    // Compute members and remainingSlots from teamDetails
    const members = teamDetails?.teamDetails?.members || [];
    const remainingSlots = TEAM_SIZE_LIMIT - members.length;
   
  
        const LoadingOverlay = () => (
        <div className="loading-overlay">
            <div className="loader"></div>
        </div>
    );



    

    // Function to generate background colors based on name

    return (
        <div className="team-management-container">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            {/* Team Status Section */}
            <div className={`team-status-section ${loading ? 'loading' : ''}`}>
            {teamDetails?.inTeam ? (
                    <>
                       {(teamDetails.teamDetails?.members?.length || 0) < TEAM_SIZE_LIMIT && (
                            <div className="team-header">
                            <div className="team-info">
                                <span className="label">Team Name</span>
                                <div className="team-name-container">
                                    <h2 className="team-name">
                                        {teamDetails.teamDetails?.name || 'Unnamed Team'}
                                    </h2>
                                    <span className="member-count">
                                        {teamDetails.teamDetails?.members?.length || 0}/{TEAM_SIZE_LIMIT} Members
                                    </span>
                                </div>
                            </div>
                            </div>

                        )}
    
                        <div className="team-details">
                            <div className="team-info">
                                <span className="label">Mentor Name</span>
                                <div className="team-name-container">
                                    <h2 className="team-name">
                                        {teamDetails.teamDetails?.mentor?.name || 'Not assigned'}
                                    </h2>
                                </div>
                            </div>
                        </div>
    
                        <div className="team-details">
                            <div className="team-lead-section">
                                <h3>Team Lead</h3>
                                <div className="team-lead-info">
                                    <UserCircle2 className="icon" />
                                    <span>
                                        {teamDetails.teamDetails?.teamLead?.name || 'Not assigned'}
                                    </span>
                                </div>
                            </div>
    
                            <div className="team-members-section">
                                <h3>Team Members</h3>
                                <div className="members-list">
                                    {teamDetails.teamDetails?.members?.map((member, index) => (
                                        <div key={member._id || index} className="member-item">
                                            <div>{member.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
    
                            {(teamDetails.teamDetails?.members?.length || 0) < TEAM_SIZE_LIMIT && (
                                <div className="add-members-section">
                                    <div className="add-members-banner">
                                    <div>
                                        <p className="banner-title">Team slots available</p>
                                        <p className="banner-subtitle">
                                        {TEAM_SIZE_LIMIT - (teamDetails.teamDetails?.members?.length || 0)} spots remaining
                                        </p>
                                    </div>
                                    <UserPlus 
                                        className="icon" 
                                        onClick={scrollToSearch}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    </div>
                                </div>
                                )}
                        </div>
                    </>
                ) : (
                    <div className="no-team-message">
                        <p>You are not part of any team yet.</p>
                        <p>Search and select students below to create or join a team.</p>
                    </div>
                )}
            </div>
    
            <div className="teamformation-request-container">
                <div className="teamformation-request-content">
                    <h2 className="title">Manage Requests</h2>
    
                    <div className="requests-section">
                        <div className="tab-buttons">
                            {['invitations', 'requests', 'teamRequests'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        handleTabClick(tab);
                                        deleteRequests();
                                    }}
                                    className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
                                    {hasNewRequests[tab] && <span className="dot-indicator"></span>}
                                </button>
                            ))}
                        </div>
    
                        <div className="tab-content">
                            {activeTab === 'invitations' && (
                               <div className={`tab-panel ${loading ? 'loading' : ''}`}>
                                    <h3 className="section-title">Invitations</h3>
                                    {loading ? (
                                        <p className="text-muted">Loading...</p>
                                    ) : invitations.length > 0 ? (
                                        invitations.map((invitation) => (
                                            <div key={invitation._id} className="card">
                                                <span className="font-medium">
                                                    Invitation sent to {invitation.recipient.name}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted">No pending invitations</p>
                                    )}
                                    
                                </div>
                            )}
    
                            {activeTab === 'requests' && (
                               <div className={`tab-panel ${loading ? 'loading' : ''}`}>
                                    <h3 className="section-title">Join Requests</h3>
                                    {joinRequests.length > 0 ? (
                                        joinRequests.map((request) => (
                                            <div key={request._id} className="card request-card">
                                                <span className="font-medium">{request.sender.name}</span>
                                                <div className="button-group">
                                                    <button
                                                        onClick={() => handleAcceptRequest(request._id, 'join')}
                                                        className="accept-button"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(request._id, 'join')}
                                                        className="reject-button"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted">No pending join requests</p>
                                    )}
                                </div>
                            )}
    
                            {activeTab === 'teamRequests' && (
                                <div className={`tab-panel ${loading ? 'loading' : ''}`}>
                                    <h3 className="section-title">Team Requests</h3>
                                    {teamRequest.length > 0 ? (
                                        teamRequest.map((request) => (
                                            <div key={request._id} className="card request-card">
                                                <span className="font-medium">{request.sender.name}</span>
                                                <div className="button-group">
                                                    <button
                                                        onClick={() => handleAcceptJoinRequest(request._id)}
                                                        className="accept-button"
                                                    >
                                                        Accept to join in team
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectJoinRequest(request._id, 'team')}
                                                        className="reject-button"
                                                    >
                                                        Reject to join in team
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted">No pending team requests</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
    
            {/* Search and Selection Section */}
{/* <div className="search-section" ref={searchSectionRef}> */}
<div ref={searchSectionRef} className={`search-section  ${loading ? 'loading' : ''}`}>
    <input
        type="text"
        placeholder="Search for students with name,rollno,email..."
        value={search}
        onChange={handleSearchChange}
        className={`search-input-student ${loading ? 'loading' : ''}`}
    />

    <div className="students-container" style={{ display: 'flex', gap: '20px' }}>
        {/* Available Students */}
        <div className="available-students" style={{ flex: 1 }}>
            <h3>Available Students</h3>
            <div className="student-list-container">
            <div className="student-list scrollable">
            <div className="student-list">
            {availableStudents
    ?.filter(student => 
        student && 
        student._id && // Add null check for _id
        !selectedStudents.includes(student._id) && 
        (search === '' || 
         (student.name?.toLowerCase().includes(search.toLowerCase()) || 
          student.email?.toLowerCase().includes(search.toLowerCase()) || 
          student.rollNo?.toLowerCase().includes(search.toLowerCase()))
        )
    )
    .map(student => student && ( // Add null check in map
    <div key={student._id} className="student-card">
        <div className="student-info">
            <div>
                <p className="student-name">{student.name || 'No name'}</p>
                <p className="student-details">{student.email || 'No email'}</p>
                <p className="student-details">{student.rollNo || 'No Roll No'}</p>
            </div>
            {student.inTeam && student.teamInfo ? (
                <div className="team-info">
                    <p>Team: {student.teamInfo?.teamName || 'Unnamed Team'}</p>
                    <p>Team Lead: {student.teamInfo?.teamLead?.name || 'No Lead'}</p>
                    <p>Vacancies: {student.teamInfo?.vacancies || 0}</p>
                    {(() => {
                        // Check if a request already exists for this team
                        const pendingRequestExists = allTeamRequests.some(
                            req => req.teamId?.toString() === student.teamInfo?.teamId &&
                                   req.recipient?.toString() === student.teamInfo?.teamLead?._id
                        );

                        return pendingRequestExists ? (
                            <div className="request-status">
                                {/* <p className="text-muted"> */}
                                    {/* Request sent to {student.teamInfo?.teamLead?.name || 'team lead'} */}
                                    <button className="join-button" disabled={pendingRequestExists}>Request sent</button>
                                    
                                {/* </p> */}
                            </div>
                        ) : (
                            <button
                                onClick={() => sendRequest(student)}
                                className="join-button"
                                disabled={pendingRequestExists}
                            >
                                Request to Join
                            </button>
                        );
                    })()}
                </div>
            ) : (
                (() => {
                    // Check if this student is already in a pending invitation or request
                    const isInRequest = 
                        invitations?.some(inv => inv?.recipient?._id === student._id) || 
                        joinRequests?.some(req => req?.sender?._id === student._id) ||
                        teamRequest?.some(req => req?.recipient?._id === student._id);

                    return isInRequest ? (
                        <button
                            className="join-request-sent-button"
                            disabled
                        >
                            Request Sent
                        </button>
                    ) : (
                        <button
                            onClick={() => handleStudentSelect(student)}
                            className="select-button"
                        >
                            Select
                        </button>
                    );
                })()
            )}
        </div>
    </div>
))}
            </div>
        </div>
        </div>
        </div>

        {/* Selected Students */}
        <div className="selected-students" style={{ flex: 1 }}>
            <h3>Selected Students ({selectedStudents?.length || 0})</h3>
            <div className="student-list-container">
        <div className="student-list scrollable">
            <div className="selected-list">
                {availableStudents
                    ?.filter(student => student && selectedStudents?.includes(student._id))
                    .map(student => student && (
                        <div key={student._id} className="selected-student-item student-info">
                            <div>
                                <p className="student-name">{student.name || 'No name'}</p>
                                <p className="student-details">{student.email || 'No email'}</p>
                                <p className="student-details">{student.rollNo || 'No Roll No'}</p>
                            </div>
                            <button
                                onClick={() => handleStudentDeselect(student._id)}
                                className="remove-button"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
            </div>

            {selectedStudents?.length > 0 && (
                <div className="action-section">
                    {teamDetails?.inTeam ? (
                        <button
                            onClick={handleAddStudentsToTeam}
                            className="add-team-button"
                        >
                            <UserPlus className="icon" />
                            Add to Team
                        </button>
                    ) : (
                        <div className="create-team-controls">
                            <input
                                type="text"
                                placeholder="Enter team name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="team-name-input"
                            />
                            <button
                                onClick={handleSendRequests}
                                className="create-team-button"
                            >
                                Create Team
                            </button>
                        </div>
                    )}
                </div>
            )}
            </div>
            </div>
        </div>
    </div>
</div>
        </div>
    );
};


export default TeamPage;
