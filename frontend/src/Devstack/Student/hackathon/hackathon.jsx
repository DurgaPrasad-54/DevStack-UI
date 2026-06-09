import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import config from "../../../config";
import "./hackathon.css";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  GiftOutlined,
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useHackathon } from "../context/HackathonContext";

const HackathonsByStatus = () => {
  const [hackathons, setHackathons] = useState([]);
  const [statusFilter, setStatusFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [registrationStatuses, setRegistrationStatuses] = useState({});
  const [posterImages, setPosterImages] = useState({}); // Store poster images separately
  const navigate = useNavigate();

  const [transactionId, setTransactionId] = useState("");
  const [upiUtrNumber, setUpiUtrNumber] = useState("");
  const [feeReceipt, setFeeReceipt] = useState(null);
  const [preview, setPreview] = useState("");
  const [registering, setRegistering] = useState(false);

  const [amount, setAmount] = useState("");
  const [upiUrl, setUpiUrl] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  
  // View More Modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewHackathon, setViewHackathon] = useState(null);

  const { setSelectedHackathon: setContextSelectedHackathon } = useHackathon();

  const handleViewMore = (hackathon) => {
    setViewHackathon(hackathon);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewHackathon(null);
  };

  const storeSelectedHackathonId = useCallback((hackathonId) => {
    if (setContextSelectedHackathon) {
      setContextSelectedHackathon(hackathonId);
    } else {
      localStorage.setItem("selectedHackathonId", hackathonId);
    }
  }, [setContextSelectedHackathon]);

  const storeDefaultOngoingHackathonId = useCallback((hackathonsData, registrationStatusesData) => {
    const studentYear = localStorage.getItem("studentYear");
    const studentCollege = localStorage.getItem("studentColleage");
    
    if (!studentYear || !studentCollege) return;

    const ongoingApprovedHackathon = hackathonsData.find(hackathon => 
      hackathon.status === "ongoing" && 
      hackathon.year === studentYear &&
      hackathon.college === studentCollege &&
      registrationStatusesData[hackathon._id] === "approved"
    );

    if (ongoingApprovedHackathon) {
      storeSelectedHackathonId(ongoingApprovedHackathon._id);
    }
  }, [storeSelectedHackathonId]);

  // Fetch hackathons WITHOUT poster images first
  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      setError("");
      
      try {
        const studentYear = localStorage.getItem("studentYear");
        const studentCollege = localStorage.getItem("studentColleage");
        
        const params = {};
        if (studentYear) params.year = studentYear;
        if (studentCollege) params.college = studentCollege;

        const response = await axios.get(`${config.backendUrl}/hackreg/hackathons/all`, {
          params,
          // timeout: 10000
        });

        if (response.data.success) {
          // Store hackathons without poster data
          const hackathonsData = response.data.hackathons.map(h => ({
            ...h,
            hackathonposter: null // Don't include poster initially
          }));
          
          setHackathons(hackathonsData);
          
          // Fetch registration statuses in parallel
          const statusesData = await checkRegistrationStatuses(hackathonsData);
          storeDefaultOngoingHackathonId(hackathonsData, statusesData);
          
          // Lazy load poster images after main data is displayed
          loadPosterImages(response.data.hackathons);
        }
      } catch (err) {
        console.error("Error fetching hackathons:", err);
        setError("Failed to load hackathons. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  // Lazy load poster images one by one
  const loadPosterImages = useCallback((hackathonsData) => {
    hackathonsData.forEach((hackathon, index) => {
      if (hackathon.hackathonposter) {
        // Stagger image loading to avoid overwhelming the browser
        setTimeout(() => {
          const imageUrl = getImageUrl(hackathon.hackathonposter);
          if (imageUrl) {
            setPosterImages(prev => ({
              ...prev,
              [hackathon._id]: imageUrl
            }));
          }
        }, index * 100); // Load each image 100ms apart
      }
    });
  }, []);

  const checkRegistrationStatuses = useCallback(async (hackathonsData) => {
    const studentData = localStorage.getItem("student");
    if (!studentData || !hackathonsData.length) return {};

    let studentId;
    try {
      const parsedStudentData = JSON.parse(studentData);
      studentId = parsedStudentData._id || parsedStudentData.id;
    } catch (error) {
      studentId = studentData;
    }

    if (!studentId) return {};

    try {
      const statusPromises = hackathonsData.map(async (hackathon) => {
        try {
          const response = await axios.get(
            `${config.backendUrl}/hackreg/hackathon/${hackathon._id}/student/${studentId}/status`,
            { timeout: 5000 }
          );
          return { hackathonId: hackathon._id, status: response.data.status };
        } catch (error) {
          return { hackathonId: hackathon._id, status: null };
        }
      });

      const results = await Promise.allSettled(statusPromises);
      const statusMap = {};
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { hackathonId, status } = result.value;
          statusMap[hackathonId] = status;
        }
      });
      
      setRegistrationStatuses(statusMap);
      return statusMap;
    } catch (error) {
      console.error("Error fetching registration statuses:", error);
      return {};
    }
  }, []);

  const renderActionButton = useCallback((hackathon) => {
    if (hackathon.status === "completed") {
      return null;
    }

    const registrationStatus = registrationStatuses[hackathon._id];
    
    if (hackathon.status === "upcoming") {
      if (registrationStatus === "pending") {
        return (
          <button 
            className="student-hackathon-status-btn student-hackathon-pending-btn"
            onClick={() => storeSelectedHackathonId(hackathon._id)}
          >
            Fee Verification Pending
          </button>
        );
      } else if (registrationStatus === "approved") {
        return (
          <button className="student-hackathon-status-btn student-hackathon-approved-btn" disabled>
            Registered - Event Starting Soon
          </button>
        );
      } else if (registrationStatus === "rejected") {
        return (
          <button className="student-hackathon-status-btn student-hackathon-rejected-btn" disabled>
            Registration Rejected
          </button>
        );
      } else {
        return (
          <button className="student-hackathon-status-btn student-hackathon-upcoming-btn" disabled>
            Registration Not Available
          </button>
        );
      }
    }

    if (hackathon.status === "ongoing") {
      if (registrationStatus === "pending") {
        return (
          <button 
            className="student-hackathon-status-btn student-hackathon-pending-btn"
            onClick={() => storeSelectedHackathonId(hackathon._id)}
          >
            Fee Verification Pending
          </button>
        );
      } else if (registrationStatus === "approved") {
        return (
          <button 
            className="student-hackathon-status-btn student-hackathon-approved-btn"
            onClick={() => {
              storeSelectedHackathonId(hackathon._id);
              alert(`Redirecting to create team for ${hackathon.hackathonname}`);
              navigate("/hackstudent/team-formation");
            }}
          >
            Create a Team
          </button>
        );
      } else if (registrationStatus === "rejected") {
        return (
          <button className="student-hackathon-status-btn student-hackathon-rejected-btn" disabled>
            Registration Rejected
          </button>
        );
      } else {
        return (
          <button 
            className="student-hackathon-register-btn"
            onClick={() => {
              storeSelectedHackathonId(hackathon._id);
              openRegistrationModal(hackathon);
            }}
          >
            Register Now
          </button>
        );
      }
    }

    return null;
  }, [registrationStatuses, storeSelectedHackathonId]);

  const filteredHackathons = hackathons.filter(
    (hackathon) => hackathon.status === statusFilter
  );

  const getImageUrl = useCallback((imageData) => {
    if (!imageData || !imageData.data) return null;
    
    if (typeof imageData.data === 'string') {
      return `data:${imageData.contentType};base64,${imageData.data}`;
    }
    
    if (imageData.data.type === 'Buffer' && imageData.data.data) {
      const base64String = btoa(
        new Uint8Array(imageData.data.data).reduce(
          (data, byte) => data + String.fromCharCode(byte), ''
        )
      );
      return `data:${imageData.contentType};base64,${base64String}`;
    }
    
    if (imageData.data instanceof ArrayBuffer) {
      const base64String = btoa(
        new Uint8Array(imageData.data).reduce(
          (data, byte) => data + String.fromCharCode(byte), ''
        )
      );
      return `data:${imageData.contentType};base64,${base64String}`;
    }
    
    return null;
  }, []);

  const openRegistrationModal = (hackathon) => {
    const studentData = localStorage.getItem("student");
    if (!studentData) {
      alert("Please login first to register for hackathons");
      navigate("/login");
      return;
    }

    setSelectedHackathon(hackathon);
    setShowRegistrationModal(true);
    setTransactionId("");
    setUpiUtrNumber("");
    setFeeReceipt(null);
    setPreview("");
    setAmount(hackathon.entryfee || "");
    setUpiUrl("");
    setShowQRCode(false);
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    setSelectedHackathon(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Calculate file size in MB
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    if (file.size > 10 * 1024 * 1024) {
      alert(`File size is ${fileSizeMB}MB. Please upload an image smaller than 5MB.`);
      e.target.value = ''; // Clear the file input
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file");
      e.target.value = '';
      return;
    }
    
    setFeeReceipt(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      setFeeReceipt(null);
      setPreview("");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateUPILink = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    try {
      const response = await axios.post(
        `${config.backendUrl}/hackreg/upi/generate`,
        { amount: Number(amount) },
        { timeout: 5000 }
      );
      setUpiUrl(response.data.upiUrl);
      setShowQRCode(true);
    } catch (err) {
      setShowQRCode(false);
      setUpiUrl("");
      alert("Failed to generate UPI payment link");
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    const studentData = localStorage.getItem("student");
    if (!studentData) {
      alert("Please login first to register");
      navigate("/login");
      return;
    }

    let studentId;
    try {
      const parsedStudentData = JSON.parse(studentData);
      studentId = parsedStudentData._id || parsedStudentData.id;
    } catch (error) {
      studentId = studentData;
    }

    if (!studentId || !transactionId || !upiUtrNumber || !feeReceipt) {
      alert("Please fill all required fields");
      return;
    }

    setRegistering(true);

    try {
      const fileReader = new FileReader();
      fileReader.onloadend = async () => {
        const base64Data = fileReader.result.split(',')[1];

        const registrationData = {
          hackathonId: selectedHackathon._id,
          students: [{
            studentId: studentId,
            transactionId: transactionId,
            upiUtrNumber: upiUtrNumber,
            feeReceipt: {
              data: base64Data,
              contentType: feeReceipt.type,
              filename: feeReceipt.name
            }
          }]
        };

        try {
          await axios.post(
            `${config.backendUrl}/hackreg/register`,
            registrationData,
            {
              headers: { "Content-Type": "application/json" },
              // timeout: 30000
            }
          );
          alert("Registration successful ✅");
          closeRegistrationModal();
          
          const statusesData = await checkRegistrationStatuses(hackathons);
          storeDefaultOngoingHackathonId(hackathons, statusesData);
        } catch (err) {
          console.error(err);
          alert(err.response?.data?.error || "Error while registering ❌");
        } finally {
          setRegistering(false);
        }
      };
      fileReader.readAsDataURL(feeReceipt);
    } catch (err) {
      console.error(err);
      alert("Error while registering ❌");
      setRegistering(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="student-hackathon-container">
      <div className="student-hackathon-header">
        <div className="student-hackathon-header-content">
          <h1 className="student-hackathon-page-title">
            Hackathons - {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </h1>
        </div>
      </div>

      <div className="student-hackathon-status-filter">
        <button
          className={`student-hackathon-filter-btn ${statusFilter === "upcoming" ? "active" : ""}`}
          onClick={() => setStatusFilter("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`student-hackathon-filter-btn ${statusFilter === "ongoing" ? "active" : ""}`}
          onClick={() => setStatusFilter("ongoing")}
        >
          Ongoing
        </button>
        <button
          className={`student-hackathon-filter-btn ${statusFilter === "completed" ? "active" : ""}`}
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </button>
      </div>

      {loading && <div className="student-hackathon-loading">Loading hackathons...</div>}
      {error && (
        <div className="student-hackathon-error">
          {error}
          <button onClick={handleRetry} style={{ marginLeft: 10 }}>
            Retry
          </button>
        </div>
      )}

      {!loading && filteredHackathons.length === 0 && (
        <div className="student-hackathon-no-hackathons">
          <p>No {statusFilter} hackathons found for your college and year.</p>
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
                {renderActionButton(hackathon)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showRegistrationModal && (
        <div className="student-hackathon-modal-overlay" onClick={closeRegistrationModal}>
          <div className="student-hackathon-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="student-hackathon-modal-header">
              <h2>Register for {selectedHackathon?.hackathonname}</h2>
              <button className="student-hackathon-close-btn" onClick={closeRegistrationModal}>×</button>
            </div>
            <form onSubmit={handleRegistrationSubmit}>
              <div className="student-hackathon-form-group">
                <label>Transaction ID *</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter Transaction ID"
                  required
                />
              </div>
              <div className="student-hackathon-form-group">
                <label>UPI UTR Reference Number *</label>
                <input
                  type="text"
                  value={upiUtrNumber}
                  onChange={(e) => setUpiUtrNumber(e.target.value)}
                  placeholder="Enter UPI UTR number"
                  required
                />
              </div>
              <div className="student-hackathon-form-group">
                <label>Upload Fee Receipt * (Max 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                {preview && (
                  <div className="student-hackathon-image-preview">
                    <img 
                      src={preview} 
                      alt="Receipt preview" 
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginTop: '10px'
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="student-hackathon-registration-info">
                <p><strong>Entry Fee:</strong> ₹{selectedHackathon?.entryfee}</p>
                <p><strong>Registration Ends:</strong> {new Date(selectedHackathon?.regend).toLocaleDateString()}</p>
              </div>
              <div className="upi-payment-section" style={{ margin: "20px 0" }}>
                <button
                  type="button"
                  onClick={handleGenerateUPILink}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}
                >
                  Generate UPI Payment Link
                </button>
                {showQRCode && upiUrl && (
                  <div className="upi-info" style={{ textAlign: "center", marginTop: "10px" }}>
                    <p>Scan the QR code or use the UPI ID:</p>
                    <QRCodeCanvas value={upiUrl} size={180} />
                    <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>UPI Link: {upiUrl}</p>
                    <p>UPI ID: 9492113371@ybl</p>
                  </div>
                )}
              </div>
              <div className="student-hackathon-modal-actions">
                <button type="button" onClick={closeRegistrationModal}>Cancel</button>
                <button type="submit" disabled={registering}>
                  {registering ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default HackathonsByStatus;