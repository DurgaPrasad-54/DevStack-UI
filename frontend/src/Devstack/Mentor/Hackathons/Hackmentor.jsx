import { useEffect, useState, useCallback } from "react";

import {
  Modal } from

"antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  GiftOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import config from "../../../config";
import "../../Student/hackathon/hackathon.css";

const MentorHackathonPage = () => {
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [filter, setFilter] = useState("ongoing");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [mentorRequests, setMentorRequests] = useState({});
  const [posterImages, setPosterImages] = useState({});
  
  // View More Modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewHackathon, setViewHackathon] = useState(null);

  const handleViewMore = (hackathon) => {
    setViewHackathon(hackathon);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewHackathon(null);
  };

  // Get poster image URL
  const getPosterUrl = useCallback((hackathonId) => {
    return `${config.backendUrl}/hackathon/poster/${hackathonId}`;
  }, []);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.backendUrl}/hackathon/all`);
      const hackathonsData = res.data || [];
      setHackathons(hackathonsData);
      
      // Load poster images
      hackathonsData.forEach((hackathon) => {
        if (hackathon.hackathonposter) {
          setPosterImages(prev => ({
            ...prev,
            [hackathon._id]: getPosterUrl(hackathon._id)
          }));
        }
      });
      
      // Fetch mentor request status for each hackathon
      await fetchMentorRequestsStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch hackathons");
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorRequestsStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const mentorId = getUserIdFromToken();
      
      if (!mentorId) {
        console.log("No mentor ID found, skipping request status fetch");
        return;
      }

      console.log("Fetching mentor requests for:", mentorId);
      console.log("Using endpoint:", `${config.backendUrl}/hackathonrequests/mentor/${mentorId}`);

      // Fetch all mentor requests for this mentor using correct endpoint
      const res = await axios.get(
        `${config.backendUrl}/hackathonrequests/mentor/${mentorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log("Mentor requests response:", res.data);
      
      // Create a mapping of hackathon ID to request status
      const requestsStatus = {};
      
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach(item => {
          if (item.hackathon && item.mentorRequest) {
            requestsStatus[item.hackathon._id] = item.mentorRequest.status;
          }
        });
      }
      
      console.log("Processed mentor requests:", requestsStatus);
      setMentorRequests(requestsStatus);
    } catch (error) {
      console.error("Error fetching mentor requests:", error);
      if (error.response?.status === 404) {
        console.error("Route not found - check if /hackmentor routes are properly mounted in your backend");
      }
      setMentorRequests({});
    }
  };

  // Helper function to extract user ID from token
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  };

  const handleRequestMentor = (hackathon) => {
    setSelectedHackathon(hackathon);
    setShowConfirmModal(true);
  };

  const confirmMentorRequest = async () => {
    if (!selectedHackathon) return;

    setRequestingId(selectedHackathon._id);
    try {
      const token = localStorage.getItem("token");
      const mentorId = getUserIdFromToken();
      
      if (!mentorId) {
        toast.error("Please login to request mentoring");
        return;
      }

      console.log("Submitting mentor request:", {
        hackathonId: selectedHackathon._id,
        mentorId,
        endpoint: `${config.backendUrl}/hackathonrequests/${selectedHackathon._id}/request`
      });

      // Use correct endpoint for mentor request
      await axios.post(
        `${config.backendUrl}/hackathonrequests/${selectedHackathon._id}/request`,
        {
          mentorId: mentorId
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Mentor request submitted successfully! Waiting for admin approval.");
      
      // Update local state to reflect the pending status
      setMentorRequests(prev => ({
        ...prev,
        [selectedHackathon._id]: 'pending'
      }));
      
      setShowConfirmModal(false);
      setSelectedHackathon(null);
    } catch (error) {
      console.error("Error submitting mentor request:", error);
      if (error.response?.status === 404) {
        console.error("Route not found - check if /hackmentor routes are properly mounted");
        toast.error("Server configuration error. Please contact support.");
      } else {
        toast.error(error.response?.data?.message || "Failed to submit mentor request");
      }
    } finally {
      setRequestingId(null);
    }
  };

  // Add a function to refresh mentor request status
  const refreshMentorRequestStatus = async () => {
    await fetchMentorRequestsStatus();
  };

  useEffect(() => {
    fetchHackathons();
    
    // Set up polling to check for status updates every 30 seconds
    const interval = setInterval(() => {
      refreshMentorRequestStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const canRequestMentor = (hackathon) => {
    const requestStatus = mentorRequests[hackathon._id];
    const isNotCompleted = hackathon.status !== "completed";
    const hasNoRequest = !requestStatus;
    
    return isNotCompleted && hasNoRequest;
  };

  const getRequestButtonText = (hackathon) => {
    const requestStatus = mentorRequests[hackathon._id];
    if (requestStatus === 'pending') return "Request Pending";
    if (requestStatus === 'approved') return "Approved";
    if (requestStatus === 'rejected') return "Request Rejected";
    return "Request to Mentor";
  };

  const getRequestButtonStyle = (hackathon) => {
    const requestStatus = mentorRequests[hackathon._id];
    if (requestStatus === 'approved') {
      return { 
        backgroundColor: '#52c41a', 
        borderColor: '#52c41a',
        color: 'white'
      };
    } else if (requestStatus === 'pending') {
      return { 
        backgroundColor: '#faad14', 
        borderColor: '#faad14',
        color: 'white'
      };
    } else if (requestStatus === 'rejected') {
      return { 
        backgroundColor: '#ff4d4f', 
        borderColor: '#ff4d4f',
        color: 'white'
      };
    }
    return undefined;
  };

  const getRequestButtonClass = (hackathon) => {
    const requestStatus = mentorRequests[hackathon._id];
    if (requestStatus === 'approved') return "student-hackathon-status-btn student-hackathon-approved-btn";
    if (requestStatus === 'pending') return "student-hackathon-status-btn student-hackathon-pending-btn";
    if (requestStatus === 'rejected') return "student-hackathon-status-btn student-hackathon-rejected-btn";
    return "student-hackathon-register-btn";
  };

  const filteredHackathons = hackathons.filter((hack) => hack.status === filter);

  return (
    <div className="student-hackathon-container">
      <ToastContainer />
      
      <div className="student-hackathon-header">
        <div className="student-hackathon-header-content">
          <h1 className="student-hackathon-page-title">
            Hackathons - {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </h1>
        </div>
      </div>

      <div className="student-hackathon-status-filter">
        <button
          className={`student-hackathon-filter-btn ${filter === "ongoing" ? "active" : ""}`}
          onClick={() => setFilter("ongoing")}
        >
          Ongoing
        </button>
        <button
          className={`student-hackathon-filter-btn ${filter === "upcoming" ? "active" : ""}`}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`student-hackathon-filter-btn ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

      {loading && <div className="student-hackathon-loading">Loading hackathons...</div>}

      {!loading && filteredHackathons.length === 0 && (
        <div className="student-hackathon-no-hackathons">
          <p>No {filter} hackathons available.</p>
        </div>
      )}

      <div className="student-hackathon-grid">
        {filteredHackathons.map((hackathon) => (
          <div key={hackathon._id} className="student-hackathon-card">
            {/* Poster at top */}
            <div 
              className="student-hackathon-poster"
              style={{
                backgroundImage: posterImages[hackathon._id] ? `url(${posterImages[hackathon._id]})` : undefined,
                backgroundColor: !posterImages[hackathon._id] ? "#f5f5f5" : undefined,
              }}
            >
              <span className={`student-hackathon-status-badge ${hackathon.status}`}>
                {hackathon.status.charAt(0).toUpperCase() + hackathon.status.slice(1)}
              </span>
              {mentorRequests[hackathon._id] && (
                <span className={`student-hackathon-status-badge ${mentorRequests[hackathon._id]}`} style={{ top: 32 }}>
                  {mentorRequests[hackathon._id] === 'pending' ? 'Request Pending' : 
                   mentorRequests[hackathon._id] === 'approved' ? 'Mentor Approved' : 'Request Rejected'}
                </span>
              )}
            </div>
            
            <div className="student-hackathon-content">
              <h2 className="student-hackathon-title">{hackathon.hackathonname}</h2>
              
              <p className="student-hackathon-info">
                <CalendarOutlined /> {new Date(hackathon.startdate).toLocaleDateString()} - {new Date(hackathon.enddate).toLocaleDateString()}
              </p>
              <p className="student-hackathon-info">
                <EnvironmentOutlined /> {hackathon.location}
              </p>
              <p className="student-hackathon-info student-hackathon-description">
                {hackathon.description}
              </p>
              <p className="student-hackathon-info">
                <DollarOutlined /> Entry Fee: <b>{hackathon.entryfee === 0 ? "Free" : `₹${hackathon.entryfee}`}</b>
              </p>
              
              <div className="student-hackathon-meta">
                <span><TeamOutlined /> Team: {hackathon.minteam}-{hackathon.maxteam}</span>
                <span><UserOutlined /> {hackathon.technology}</span>
              </div>
              
              <div className="student-hackathon-prizes">
                <span className="prize gold"><GiftOutlined /> 1st: ₹{hackathon.firstprize || "-"}</span>
                <span className="prize silver"><GiftOutlined /> 2nd: ₹{hackathon.secondprize || "-"}</span>
                <span className="prize bronze"><GiftOutlined /> 3rd: ₹{hackathon.thirdprize || "-"}</span>
              </div>
              
              <p className="student-hackathon-regend">
                <ClockCircleOutlined /> Registration Ends: {new Date(hackathon.regend).toLocaleDateString()}
              </p>
              
              <div className="student-hackathon-actions">
                <button 
                  className="student-hackathon-view-btn"
                  onClick={() => handleViewMore(hackathon)}
                >
                  <EyeOutlined /> View More
                </button>
                
                {hackathon.status !== "completed" && (
                  <button
                    className={getRequestButtonClass(hackathon)}
                    disabled={!canRequestMentor(hackathon) || requestingId === hackathon._id}
                    onClick={() => handleRequestMentor(hackathon)}
                  >
                    {requestingId === hackathon._id ? "Requesting..." : getRequestButtonText(hackathon)}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View More Modal */}
      {showViewModal && viewHackathon && (
        <div className="student-hackathon-modal-overlay" onClick={closeViewModal}>
          <div className="student-hackathon-view-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="student-hackathon-close-btn" onClick={closeViewModal}>×</button>
            
            <div 
              className="student-hackathon-modal-poster"
              style={{
                backgroundImage: posterImages[viewHackathon._id] 
                  ? `url(${posterImages[viewHackathon._id]})` 
                  : undefined,
                backgroundColor: !posterImages[viewHackathon._id] ? "#f5f5f5" : undefined,
              }}
            />
            
            <h2 className="student-hackathon-modal-title">{viewHackathon.hackathonname}</h2>
            
            <div className="student-hackathon-modal-details">
              <p><CalendarOutlined /> <strong>Duration:</strong> {new Date(viewHackathon.startdate).toLocaleDateString()} - {new Date(viewHackathon.enddate).toLocaleDateString()}</p>
              <p><ClockCircleOutlined /> <strong>Registration:</strong> {new Date(viewHackathon.regstart).toLocaleDateString()} - {new Date(viewHackathon.regend).toLocaleDateString()}</p>
              <p><EnvironmentOutlined /> <strong>Location:</strong> {viewHackathon.location}</p>
              <p><DollarOutlined /> <strong>Entry Fee:</strong> {viewHackathon.entryfee === 0 ? "Free" : `₹${viewHackathon.entryfee}`}</p>
              <p><TeamOutlined /> <strong>Team Size:</strong> {viewHackathon.minteam} - {viewHackathon.maxteam} members</p>
              <p><UserOutlined /> <strong>Technology:</strong> {viewHackathon.technology}</p>
              <p><strong>College:</strong> {viewHackathon.college} | <strong>Year:</strong> {viewHackathon.year}</p>
              
              <div className="student-hackathon-modal-description">
                <strong>Description:</strong>
                <p>{viewHackathon.description}</p>
              </div>
              
              <div className="student-hackathon-modal-prizes">
                <strong>Prizes:</strong>
                <div className="prizes-list">
                  <span className="prize gold"><GiftOutlined /> 1st: ₹{viewHackathon.firstprize || "-"}</span>
                  <span className="prize silver"><GiftOutlined /> 2nd: ₹{viewHackathon.secondprize || "-"}</span>
                  <span className="prize bronze"><GiftOutlined /> 3rd: ₹{viewHackathon.thirdprize || "-"}</span>
                </div>
              </div>
              
              {viewHackathon.virtualeventlink && (
                <p className="student-hackathon-modal-link">
                  <strong>Virtual Link:</strong> 
                  <a href={viewHackathon.virtualeventlink} target="_blank" rel="noopener noreferrer">
                    Join Event
                  </a>
                </p>
              )}
              
              {viewHackathon.rules && viewHackathon.rules.length > 0 && (
                <div className="student-hackathon-modal-rules">
                  <strong>Rules:</strong>
                  <ul>
                    {viewHackathon.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Mentor Request"
        open={showConfirmModal}
        onOk={confirmMentorRequest}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedHackathon(null);
        }}
        okText="Send Request"
        cancelText="Cancel"
        confirmLoading={requestingId === selectedHackathon?._id}
      >
        {selectedHackathon && (
          <div>
            <p>
              Are you sure you want to request to mentor <strong>{selectedHackathon.hackathonname}</strong>?
            </p>
            <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f0f2ff', borderRadius: 6 }}>
              <p style={{ margin: '4px 0', color: '#64748b' }}>
                <strong>Event Details:</strong>
              </p>
              <p style={{ margin: '4px 0', color: '#64748b' }}>
                <CalendarOutlined /> {new Date(selectedHackathon.startdate).toLocaleDateString()} - {new Date(selectedHackathon.enddate).toLocaleDateString()}
              </p>
              <p style={{ margin: '4px 0', color: '#64748b' }}>
                <UserOutlined /> Technology: {selectedHackathon.technology}
              </p>
              <p style={{ margin: '4px 0', color: '#64748b' }}>
                <EnvironmentOutlined /> Location: {selectedHackathon.location}
              </p>
              <p style={{ margin: '4px 0', color: '#64748b' }}>
                College: {selectedHackathon.college} | Year: {selectedHackathon.year}
              </p>
              <p style={{ margin: '4px 0', color: '#64748b' }}>
                <TeamOutlined /> Team Size: {selectedHackathon.minteam}-{selectedHackathon.maxteam}
              </p>
            </div>
            <p style={{ marginTop: 16 }}>
              Your request will be sent to the admin for approval. You'll be notified once it's reviewed.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MentorHackathonPage;