import { useEffect, useState } from "react";
import config from '../../../config';


import {
  Card,
  Button,
  Spin,
  Typography,
  Row,
  Col,
  message,
  Progress,
  Slider,
  Input,
  Alert,
  Tag,

  Space,

  Empty } from

"antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  SaveOutlined,
  TeamOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  RocketOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useHackathon } from "../context/HackathonContext";
import "./TeamProgress.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TeamProgressPage = () => {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [team, setTeam] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [progress, setProgress] = useState(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [nextUpdateTime, setNextUpdateTime] = useState(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const [hackathonCompleted, setHackathonCompleted] = useState(false);
  const [hackathonUpcoming, setHackathonUpcoming] = useState(false);
  const [notInTeam, setNotInTeam] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editPercentage, setEditPercentage] = useState(0);
  const [editDescription, setEditDescription] = useState("");

  const API_URL = config.backendUrl;
  const token = localStorage.getItem("token");
  
  const userIdRaw = localStorage.getItem("student") || localStorage.getItem("userId");
  const userId = userIdRaw ? userIdRaw.toString() : null;
  
  // Use HackathonContext to get the current hackathon ID
  const { currentHackathonId, loading: hackathonContextLoading } = useHackathon();

  // Countdown timer
  useEffect(() => {
    if (remainingCooldown > 0) {
      const interval = setInterval(() => {
        setRemainingCooldown((prev) => {
          const newValue = prev - 1000;
          if (newValue <= 0) {
            setCanUpdate(isTeamLead);
            return 0;
          }
          return newValue;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [remainingCooldown, isTeamLead]);

  useEffect(() => {
    console.log("[FRONTEND] Team Progress Page mounted");
    console.log("[FRONTEND] Token:", token ? "Present" : "Missing");
    console.log("[FRONTEND] User ID:", userId);
    console.log("[FRONTEND] Current Hackathon ID from context:", currentHackathonId);
    console.log("[FRONTEND] Context loading:", hackathonContextLoading);

    if (!userId) {
      message.error("User ID not found. Please log in again.");
      return;
    }

    // Wait for hackathon context to finish loading before fetching
    if (hackathonContextLoading) {
      console.log("[FRONTEND] Waiting for hackathon context to load...");
      return;
    }

    fetchTeamAndProgress();
  }, [currentHackathonId, hackathonContextLoading]);

  const fetchTeamAndProgress = async () => {
    try {
      setLoading(true);
      setNotRegistered(false);
      setHackathonCompleted(false);
      setHackathonUpcoming(false);
      setNotInTeam(false);
      console.log("[FRONTEND] Fetching team data...");
      
      // Use currentHackathonId from context ONLY (no localStorage fallback to avoid stale data)
      const selectedHackathonId = currentHackathonId;
      
      if (!selectedHackathonId) {
        console.log("[FRONTEND] No hackathon ID available, showing not registered");
        setNotRegistered(true);
        setLoading(false);
        return;
      }
      
      console.log("[FRONTEND] Using hackathon ID:", selectedHackathonId);
      
      try {
          // First check if the hackathon is still active
          const hackathonRes = await fetch(`${API_URL}/hackathon/${selectedHackathonId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          
          if (hackathonRes.ok) {
            const hackathonData = await hackathonRes.json();
            setHackathon(hackathonData);
            
            // If hackathon is completed, show appropriate message
            if (hackathonData.status === "completed") {
              console.log('[FRONTEND] Hackathon is completed');
              setHackathonCompleted(true);
              setLoading(false);
              return;
            }
            
            // If hackathon is upcoming, show appropriate message
            if (hackathonData.status === "upcoming") {
              console.log('[FRONTEND] Hackathon is upcoming');
              setHackathonUpcoming(true);
              setLoading(false);
              return;
            }
          } else {
            // Hackathon not found, clear the stored ID
            console.log('[FRONTEND] Hackathon not found, clearing stored ID');
            localStorage.removeItem('selectedHackathonId');
          }

          // Try to fetch team for this specific hackathon
          const teamUrl = `${API_URL}/studenthackteam/myteam?hackathonId=${selectedHackathonId}`;
          const teamRes = await fetch(teamUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (teamRes.ok) {
            const teamData = await teamRes.json();
            console.log("[FRONTEND] Team data:", teamData);
            setTeam(teamData);
            
            // Try the team-specific progress endpoint
            await fetchProgress(selectedHackathonId, teamData._id);
            setLoading(false);
            return;
          } else if (teamRes.status === 404) {
            // Check if it's "no registration" or "no team"
            const errorData = await teamRes.json().catch(() => ({}));
            console.log('[FRONTEND] Team fetch 404:', errorData.message);
            
            if (errorData.message?.includes('No registration')) {
              // User is not registered for this hackathon
              setNotRegistered(true);
            } else {
              // User is registered but not in a team yet
              setNotInTeam(true);
            }
            setLoading(false);
            return;
          } else if (teamRes.status === 400) {
            // Hackathon is not ongoing
            const errorData = await teamRes.json().catch(() => ({}));
            console.log('[FRONTEND] Hackathon not ongoing:', errorData.message);
            setHackathonCompleted(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('[FRONTEND] Error fetching team for selected hackathon:', err);
          message.error("Failed to fetch team details");
          setLoading(false);
        }
    } catch (error) {
      console.error("[FRONTEND] Error:", error);
      message.error(error.message);
      setLoading(false);
    }
  };

  const fetchHackathonDetails = async (hackathonId) => {
    try {
      const res = await fetch(`${API_URL}/hackathon/${hackathonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHackathon(data);
        
        // Check if hackathon is completed
        if (data.status === "completed") {
          setHackathonCompleted(true);
          return false; // Hackathon is completed
        }
        return true; // Hackathon is active
      }
      return false;
    } catch (error) {
      console.error("[FRONTEND] Error fetching hackathon:", error);
      return false;
    }
  };

  const fetchProgress = async (hackathonId, teamId) => {
    try {
      console.log("[FRONTEND] Fetching progress...");
      
      const res = await fetch(
        `${API_URL}/teamprogress/teamprogress/${hackathonId}/${teamId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch progress");
      }

      const data = await res.json();
      console.log("[FRONTEND] Progress data:", data);

      setProgress(data);
      setCanUpdate(data.canUpdate || false);

      // Some backend responses (when no progress exists yet) don't include isTeamLead.
      // In that case, query the consolidated myteam endpoint to get accurate role/permissions.
      if (typeof data.isTeamLead === 'undefined') {
        try {
          const myTeamProgressRes = await fetch(`${API_URL}/teamprogress/teamprogress/myteam/${hackathonId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (myTeamProgressRes.ok) {
            const myData = await myTeamProgressRes.json();
            console.log('[FRONTEND] myteam fallback response for role:', myData);
            setIsTeamLead(Boolean(myData.isTeamLead));
            setCanUpdate(myData.canUpdate || false);
            setRemainingCooldown(myData.remainingCooldown || 0);
            setNextUpdateTime(myData.nextUpdateAvailable || null);
          } else {
            console.log('[FRONTEND] myteam fallback returned', myTeamProgressRes.status);
            setIsTeamLead(false);
            setRemainingCooldown(data.remainingCooldown || 0);
            setNextUpdateTime(data.nextUpdateAvailable || null);
          }
        } catch (err) {
          console.error('[FRONTEND] Error fetching myteam fallback:', err);
          setIsTeamLead(false);
          setRemainingCooldown(data.remainingCooldown || 0);
          setNextUpdateTime(data.nextUpdateAvailable || null);
        }
      } else {
        setIsTeamLead(data.isTeamLead || false);
        setRemainingCooldown(data.remainingCooldown || 0);
        setNextUpdateTime(data.nextUpdateAvailable);
      }

      // Set initial edit values
      setEditPercentage(data.percentage || 0);
      setEditDescription(data.description || "");
    } catch (error) {
      console.error("[FRONTEND] Error fetching progress:", error);
      message.error(error.message);
    }
  };

  const handleStartEdit = () => {
    if (!canUpdate) {
      if (!isTeamLead) {
        message.warning("Only the team lead can update progress");
      } else {
        message.warning("Please wait for the cooldown to end");
      }
      return;
    }

    setEditPercentage(progress?.percentage || 0);
    setEditDescription(progress?.description || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditPercentage(progress?.percentage || 0);
    setEditDescription(progress?.description || "");
  };

  const handleSaveProgress = async () => {
    if (!team || !team.hackathon) {
      message.error("Team information not available");
      return;
    }

    if (editPercentage < 0 || editPercentage > 100) {
      message.error("Percentage must be between 0 and 100");
      return;
    }

    try {
      setUpdating(true);
      console.log("[FRONTEND] Updating progress...");

      const requestBody = {
        hackathonId: team.hackathon._id || team.hackathon,
        teamId: team._id,
        percentage: editPercentage,
        description: editDescription.trim(),
      };

      console.log("[FRONTEND] Request body:", requestBody);

      const res = await fetch(`${API_URL}/teamprogress/teamprogress`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("[FRONTEND] Response:", data);

      if (!res.ok) {
        if (data.error === "COOLDOWN_ACTIVE") {
          message.warning(data.message);
          setRemainingCooldown(data.remainingTime);
          setCanUpdate(false);
        } else if (data.error === "NOT_TEAM_LEAD") {
          message.error(data.message);
          setIsTeamLead(false);
          setCanUpdate(false);
        } else {
          throw new Error(data.message || "Failed to update progress");
        }
        setUpdating(false);
        setIsEditing(false);
        return;
      }

      message.success("Progress updated successfully!");
      
      // Update state
      setProgress(data.progress);
      setCanUpdate(false);
      setRemainingCooldown(30 * 60 * 1000); // 30 minutes
      setNextUpdateTime(data.nextUpdateAvailable);
      setIsEditing(false);

      // Refresh after a short delay
      setTimeout(() => {
        fetchProgress(team.hackathon._id || team.hackathon, team._id);
      }, 1000);

    } catch (error) {
      console.error("[FRONTEND] Error updating progress:", error);
      message.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatCooldownTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getProgressColor = (percentage) => {
    if (percentage === 0) return "#d9d9d9";
    if (percentage < 30) return "#ff4d4f";
    if (percentage < 70) return "#faad14";
    if (percentage < 100) return "#1890ff";
    return "#52c41a";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Not Started":
        return "default";
      case "In Progress":
        return "processing";
      case "Completed":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="team-progress-loading">
        <Spin size="large" tip="Loading team progress..." />
      </div>
    );
  }

  // Show message when hackathon is completed
  if (hackathonCompleted) {
    return (
      <div className="team-progress-container">
        <div className="team-progress-empty-state">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={null}
          />
          <Title level={3} style={{ color: "#595959", marginBottom: 12 }}>
            <ExclamationCircleOutlined style={{ marginRight: 8, color: "#faad14" }} />
            Hackathon Completed
          </Title>
          <Paragraph style={{ color: "#8c8c8c", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
            {hackathon?.hackathonname ? (
              <>The hackathon "<strong>{hackathon.hackathonname}</strong>" has been completed. </>
            ) : (
              <>Your previous hackathon has been completed. </>
            )}
            Register for a new hackathon to track your team's progress.
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            icon={<TrophyOutlined />}
            style={{ marginTop: 24 }}
            onClick={() => window.location.href = '/hackstudent/hackathon'}
          >
            Browse Hackathons
          </Button>
        </div>
      </div>
    );
  }

  // Show message when hackathon hasn't started yet
  if (hackathonUpcoming) {
    return (
      <div className="team-progress-container">
        <div className="team-progress-empty-state">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={null}
          />
          <Title level={3} style={{ color: "#595959", marginBottom: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Hackathon Starting Soon
          </Title>
          <Paragraph style={{ color: "#8c8c8c", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
            {hackathon?.hackathonname ? (
              <>The hackathon "<strong>{hackathon.hackathonname}</strong>" hasn't started yet. </>
            ) : (
              <>Your hackathon hasn't started yet. </>
            )}
            Progress tracking will be available once the hackathon begins.
            {hackathon?.startdate && (
              <div style={{ marginTop: 12 }}>
                <strong>Start Date:</strong> {new Date(hackathon.startdate).toLocaleDateString()}
              </div>
            )}
          </Paragraph>
          <Button 
            type="default" 
            size="large"
            icon={<TeamOutlined />}
            style={{ marginTop: 24 }}
            onClick={() => window.location.href = '/hackstudent/team-formation'}
          >
            Manage Your Team
          </Button>
        </div>
      </div>
    );
  }

  // Show message when registered but not in a team yet
  if (notInTeam) {
    return (
      <div className="team-progress-container">
        <div className="team-progress-empty-state">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={null}
          />
          <Title level={3} style={{ color: "#595959", marginBottom: 12 }}>
            <TeamOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Not in a Team Yet
          </Title>
          <Paragraph style={{ color: "#8c8c8c", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
            {hackathon?.hackathonname ? (
              <>You are registered for "<strong>{hackathon.hackathonname}</strong>" but haven't joined a team yet. </>
            ) : (
              <>You are registered for a hackathon but haven't joined a team yet. </>
            )}
            Join or create a team to start tracking your progress.
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            icon={<TeamOutlined />}
            style={{ marginTop: 24 }}
            onClick={() => window.location.href = '/hackstudent/team-formation'}
          >
            Join or Create Team
          </Button>
        </div>
      </div>
    );
  }

  // Show message when not registered for any hackathon
  if (notRegistered || !team) {
    return (
      <div className="team-progress-container">
        <div className="team-progress-empty-state">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={null}
          />
          <Title level={3} style={{ color: "#595959", marginBottom: 12 }}>
            <TrophyOutlined style={{ marginRight: 8, color: "#faad14" }} />
            Not Registered for Any Hackathon
          </Title>
          <Paragraph style={{ color: "#8c8c8c", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
            You are not currently registered for any active hackathon. 
            Register for a hackathon and join or create a team to start tracking progress.
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            icon={<TrophyOutlined />}
            style={{ marginTop: 24 }}
            onClick={() => window.location.href = '/hackstudent/hackathon'}
          >
            Browse Hackathons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="team-progress-container">
      {/* Header Section */}
      <div className="team-progress-header">
        <div className="team-progress-title-section">
          <Title level={2} className="team-progress-main-title">
            <RocketOutlined />
            Team Progress
          </Title>
          <Text type="secondary" className="team-progress-subtitle">
            Track and update your team's hackathon progress
          </Text>
        </div>
      </div>

      {/* Team Info Card */}
      <Card className="team-progress-info-card" bordered={false}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <div className="team-progress-stat-item">
              <div className="team-progress-stat-icon" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                <TeamOutlined />
              </div>
              <div className="team-progress-stat-content">
                <Text type="secondary" className="team-progress-stat-label">Team Name</Text>
                <Text strong className="team-progress-stat-value">{team.name}</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="team-progress-stat-item">
              <div className="team-progress-stat-icon" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
                <TrophyOutlined />
              </div>
              <div className="team-progress-stat-content">
                <Text type="secondary" className="team-progress-stat-label">Hackathon</Text>
                <Text strong className="team-progress-stat-value">{hackathon?.hackathonname || "Loading..."}</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="team-progress-stat-item">
              <div className="team-progress-stat-icon" style={{ background: isTeamLead ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" : "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" }}>
                {isTeamLead ? <StarOutlined /> : <UserOutlined />}
              </div>
              <div className="team-progress-stat-content">
                <Text type="secondary" className="team-progress-stat-label">Your Role</Text>
                <Text strong className="team-progress-stat-value" style={{ color: isTeamLead ? "#1890ff" : "#595959" }}>
                  {isTeamLead ? "Team Lead" : "Team Member"}
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="team-progress-stat-item">
              <div className="team-progress-stat-icon" style={{ 
                background: progress?.status === "Completed" 
                  ? "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" 
                  : progress?.status === "In Progress"
                    ? "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                    : "linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)"
              }}>
                {progress?.status === "Completed" ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              </div>
              <div className="team-progress-stat-content">
                <Text type="secondary" className="team-progress-stat-label">Status</Text>
                <Tag 
                  color={getStatusColor(progress?.status)} 
                  className="team-progress-status-tag"
                >
                  {progress?.status || "Not Started"}
                </Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Cooldown Alert */}
      {!canUpdate && isTeamLead && remainingCooldown > 0 && (
        <Alert
          message="Update Cooldown Active"
          description={
            <Space direction="vertical" size="small">
              <Text>
                You can update progress again in:{" "}
                <Text strong>{formatCooldownTime(remainingCooldown)}</Text>
              </Text>
              {nextUpdateTime && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Next update available at:{" "}
                  {new Date(nextUpdateTime).toLocaleTimeString()}
                </Text>
              )}
            </Space>
          }
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          className="team-progress-alert"
        />
      )}

      {/* Not Team Lead Alert */}
      {!isTeamLead && (
        <Alert
          message="Team Member View"
          description="Only the team lead can update progress. You can view the current progress below."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          className="team-progress-alert"
        />
      )}

      {/* Progress Card */}
      <Card
        className="team-progress-main-card"
        bordered={false}
        title={
          <div className="team-progress-card-header">
            <RocketOutlined className="team-progress-card-icon" />
            <span>Current Progress</span>
          </div>
        }
        extra={
          !isEditing && isTeamLead ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleStartEdit}
              disabled={!canUpdate}
              className="team-progress-update-btn"
            >
              Update Progress
            </Button>
          ) : null
        }
      >
        {!isEditing ? (
          <div className="team-progress-display">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={10}>
                <div className="team-progress-circle-container">
                  <Progress
                    type="circle"
                    percent={progress?.percentage || 0}
                    strokeColor={{
                      '0%': getProgressColor(progress?.percentage || 0),
                      '100%': progress?.percentage >= 70 ? '#52c41a' : getProgressColor(progress?.percentage || 0),
                    }}
                    strokeWidth={8}
                    width={200}
                    format={(percent) => (
                      <div className="team-progress-circle-content">
                        <div className="team-progress-circle-percent">{percent}%</div>
                        <div className="team-progress-circle-status">
                          {progress?.status || "Not Started"}
                        </div>
                      </div>
                    )}
                  />
                </div>
              </Col>
              <Col xs={24} md={14}>
                <div className="team-progress-details">
                  {progress?.description ? (
                    <div className="team-progress-description-section">
                      <Text strong className="team-progress-section-title">
                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                        Progress Update
                      </Text>
                      <Paragraph className="team-progress-description">
                        {progress.description}
                      </Paragraph>
                    </div>
                  ) : (
                    <div className="team-progress-no-description">
                      <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        description="No progress description yet"
                      />
                    </div>
                  )}
                  
                  {progress?.updatedAt && (
                    <div className="team-progress-updated-info">
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      <Text type="secondary">
                        Last updated: {new Date(progress.updatedAt).toLocaleString()}
                      </Text>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="team-progress-edit-section">
            <Row gutter={[16, 24]}>
              <Col span={24}>
                <div>
                  <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
                    Progress Percentage: {editPercentage}%
                  </Text>
                  <Slider
                    min={0}
                    max={100}
                    value={editPercentage}
                    onChange={setEditPercentage}
                    marks={{
                      0: "0%",
                      25: "25%",
                      50: "50%",
                      75: "75%",
                      100: "100%",
                    }}
                    tooltip={{
                      formatter: (value) => `${value}%`,
                    }}
                  />
                  <Progress
                    percent={editPercentage}
                    strokeColor={getProgressColor(editPercentage)}
                    style={{ marginTop: 16 }}
                  />
                </div>
              </Col>

              <Col span={24}>
                <div>
                  <Text strong style={{ fontSize: 16, marginBottom: 8, display: "block" }}>
                    Progress Description (Optional)
                  </Text>
                  <TextArea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Describe what your team has accomplished, current challenges, or next steps..."
                    rows={6}
                    maxLength={1000}
                    showCount
                  />
                </div>
              </Col>

              <Col span={24}>
                <Alert
                  message="Important: 30-Minute Update Limit"
                  description="After updating, you will need to wait 30 minutes before making another update. Make sure your progress information is accurate."
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                />
              </Col>

              <Col span={24}>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveProgress}
                    loading={updating}
                    size="large"
                  >
                    Save Progress
                  </Button>
                  <Button onClick={handleCancelEdit} disabled={updating} size="large">
                    Cancel
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Progress History Info */}
      <Card 
        title={
          <Space>
            <InfoCircleOutlined />
            <span>Progress Tracking Guidelines</span>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                Team Lead Responsibilities:
              </Text>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>Update team progress regularly</li>
                <li>Provide accurate percentage estimates</li>
                <li>Describe completed milestones and challenges</li>
                <li>Updates are limited to once every 30 minutes</li>
              </ul>
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                <ClockCircleOutlined style={{ color: "#1890ff", marginRight: 8 }} />
                Progress Milestones:
              </Text>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>0-30%: Initial planning and setup</li>
                <li>30-70%: Active development phase</li>
                <li>70-99%: Testing and refinement</li>
                <li>100%: Project completed</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default TeamProgressPage;