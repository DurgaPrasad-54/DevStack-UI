import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  Spin,
  Typography,
  Row,
  Col,
  Empty,
  Tag,
  message,
  Modal,
  Alert,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  LockOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useHackathon } from "../context/HackathonContext";
import "./Problemstatements.css";

const { Title, Text, Paragraph } = Typography;

const TeamProblemStatementsPage = () => {
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [problemStatements, setProblemStatements] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [notInTeam, setNotInTeam] = useState(false);
  const [hackathonCompleted, setHackathonCompleted] = useState(false);
  const [hackathonUpcoming, setHackathonUpcoming] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  const API_URL = "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Get userId from localStorage
  const userIdRaw = localStorage.getItem("student") || localStorage.getItem("userId");
  const userId = userIdRaw ? userIdRaw.toString() : null;

  // Use HackathonContext to get the current hackathon ID
  const { currentHackathonId, loading: hackathonContextLoading } = useHackathon();

  useEffect(() => {
    console.log("[FRONTEND] Component mounted");
    console.log("[FRONTEND] Token:", token ? "Present" : "Missing");
    console.log("[FRONTEND] User ID from localStorage:", userId);
    console.log("[FRONTEND] Current Hackathon ID from context:", currentHackathonId);
    console.log("[FRONTEND] Context loading:", hackathonContextLoading);

    if (!userId) {
      console.error("[FRONTEND] No user ID found in localStorage");
      message.error("User ID not found. Please log in again.");
      return;
    }

    // Wait for hackathon context to finish loading before fetching
    if (hackathonContextLoading) {
      console.log("[FRONTEND] Waiting for hackathon context to load...");
      return;
    }

    fetchTeamData();
  }, [currentHackathonId, hackathonContextLoading]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setNotInTeam(false);
      setHackathonCompleted(false);
      setHackathonUpcoming(false);
      setNotRegistered(false);
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

      // Check if the hackathon is still active
      try {
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
        }
      } catch (err) {
        console.error('[FRONTEND] Error checking hackathon status:', err);
      }

      // Build URL with hackathonId query parameter
      const teamUrl = `${API_URL}/studenthackteam/myteam?hackathonId=${selectedHackathonId}`;

      const teamRes = await fetch(teamUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[FRONTEND] Team response status:", teamRes.status);

      if (teamRes.status === 404) {
        const errorData = await teamRes.json().catch(() => ({}));
        console.log("[FRONTEND] Team 404:", errorData.message);

        if (errorData.message?.includes('No registration')) {
          // User is not registered for this hackathon
          setNotRegistered(true);
        } else {
          // User is registered but not in a team yet
          setNotInTeam(true);
        }
        setLoading(false);
        return;
      }

      if (teamRes.status === 400) {
        // Hackathon is not ongoing
        const errorData = await teamRes.json().catch(() => ({}));
        console.log("[FRONTEND] Hackathon not ongoing:", errorData.message);
        if (errorData.message?.includes('not ongoing')) {
          setHackathonCompleted(true);
        } else {
          setNotRegistered(true);
        }
        setLoading(false);
        return;
      }

      if (!teamRes.ok) {
        const errorData = await teamRes.json();
        console.error("[FRONTEND] Team fetch error:", errorData);
        throw new Error(errorData.message || "Failed to fetch team");
      }

      const teamData = await teamRes.json();
      console.log("[FRONTEND] Team data received:", {
        teamId: teamData._id,
        teamName: teamData.name,
        teamLeadId: teamData.teamLead?._id,
        selectedProblem: teamData.selectedProblemStatement,
      });

      // Normalize teamLead to ensure _id is a string
      if (teamData.teamLead) {
        if (typeof teamData.teamLead === "string") {
          teamData.teamLead = { _id: teamData.teamLead.toString() };
        } else if (teamData.teamLead._id) {
          teamData.teamLead._id = teamData.teamLead._id.toString();
        }
      }

      // Fetch hackathon details and check if it's still active
      if (teamData.hackathon) {
        const isActive = await fetchHackathonDetails(teamData.hackathon);
        if (!isActive) {
          setHackathonCompleted(true);
          setLoading(false);
          return;
        }
      }

      setTeam(teamData);
      setNotInTeam(false);

      if (!teamData.mentor || !teamData.mentor._id) {
        console.log("[FRONTEND] No mentor assigned to team");
        setLoading(false);
        return;
      }

      await fetchProblemStatements(teamData._id);
      setLoading(false);
    } catch (error) {
      console.error("[FRONTEND] Error fetching team:", error);
      message.error(error.message || "Failed to fetch team details");
      setLoading(false);
    }
  };

  const fetchHackathonDetails = async (hackathonId) => {
    try {
      console.log("[FRONTEND] Fetching hackathon details:", hackathonId);
      const res = await fetch(`${API_URL}/hackathon/${hackathonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch hackathon details");
      }

      const data = await res.json();
      console.log("[FRONTEND] Hackathon data:", data.hackathonname);
      setHackathon(data);

      // Check if hackathon is completed
      if (data.status === "completed") {
        return false; // Hackathon is completed
      }
      return true; // Hackathon is active
    } catch (error) {
      console.error("[FRONTEND] Error fetching hackathon:", error);
      return false;
    }
  };

  const fetchProblemStatements = async (teamId) => {
    try {
      console.log("[FRONTEND] Fetching problem statements for team:", teamId);
      const res = await fetch(`${API_URL}/problemstatements/${teamId}/problem-statements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[FRONTEND] Problem statements response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("[FRONTEND] Problem statements error:", errorData);
        throw new Error(errorData.message || "Failed to fetch problem statements");
      }

      const data = await res.json();
      console.log("[FRONTEND] Problem statements received:", data.problemStatements?.length || 0);
      console.log("[FRONTEND] Team lead from backend:", data.teamLead);
      console.log("[FRONTEND] Team selection status:", {
        hasSelection: !!data.team?.selectedProblemStatement,
        selectedProblem: data.team?.selectedProblemStatement,
        selectedSubId: data.team?.selectedProblemStatementSubId,
      });

      // Normalize team selection IDs to strings to avoid object/string mismatches
      const teamSelectedParent = data.team?.selectedProblemStatement ? String(data.team.selectedProblemStatement) : null;
      const teamSelectedSub = data.team?.selectedProblemStatementSubId ? String(data.team.selectedProblemStatementSubId) : null;

      // Normalize teamLead _id
      if (data.teamLead && data.teamLead._id) {
        data.teamLead._id = String(data.teamLead._id);
      }

      // Process problem statements to ensure proper selection state (use string compares)
      const processedStatements = (data.problemStatements || []).map(ps => {
        const psId = ps._id ? String(ps._id) : null;
        const psParent = ps.parentId ? String(ps.parentId) : null;
        const psSelectedBy = ps.selectedBy ? String(ps.selectedBy) : null;

        const isSelectedByTeam = teamSelectedParent && teamSelectedSub && teamSelectedParent === psParent && teamSelectedSub === psId;
        const isSelectedByOther = ps.isSelected && psSelectedBy && psSelectedBy !== String(teamId);

        return {
          ...ps,
          _id: psId,
          parentId: psParent,
          selectedBy: psSelectedBy,
          isSelected: isSelectedByTeam || isSelectedByOther,
        };
      });

      // Set problem statements with processed selection state
      setProblemStatements(processedStatements);

      // Update team state with latest data from backend (use normalized ids)
      if (data.team) {
        setTeam(prevTeam => ({
          ...prevTeam,
          ...data.team,
          teamLead: data.teamLead || prevTeam.teamLead,
          selectedProblemStatement: teamSelectedParent,
          selectedProblemStatementSubId: teamSelectedSub,
        }));
      } else {
        setProblemStatements([]);
      }
    } catch (error) {
      console.error("[FRONTEND] Error fetching problem statements:", error);
      message.error(error.message || "Failed to fetch problem statements");
      setProblemStatements([]);
    }
  };

  const handleSelectClick = (problem) => {
    console.log("[FRONTEND] Select button clicked");
    console.log("[FRONTEND] Problem:", problem._id);
    console.log("[FRONTEND] Current user ID:", userId);
    console.log("[FRONTEND] Team lead ID:", team?.teamLead?._id);

    if (!team || !team.teamLead) {
      message.error("Team lead information not available.");
      return;
    }

    const teamLeadId = team.teamLead._id?.toString();
    const currentUserId = userId?.toString();
    const isTeamLead = teamLeadId === currentUserId;

    console.log("[FRONTEND] Team lead check:", {
      teamLeadId,
      currentUserId,
      isTeamLead,
    });

    if (!isTeamLead) {
      message.error("Only the team lead can select a problem statement.");
      return;
    }

    if (team.selectedProblemStatement) {
      message.error("Your team has already selected a problem statement.");
      return;
    }

    setSelectedProblem(problem);
    setIsModalVisible(true);
  };

  const handleConfirmSelection = async () => {
    if (!selectedProblem || !team || !team.hackathon) {
      message.error("Missing required information");
      return;
    }

    try {
      setModalLoading(true);

      const requestBody = {
        parentId: selectedProblem.parentId,
        problemStatementSubId: selectedProblem._id,
        hackathonId: team.hackathon._id || team.hackathon,
      };

      console.log("[FRONTEND] ▶ Submitting problem selection");
      console.log("[FRONTEND] Request body:", requestBody);
      console.log("[FRONTEND] Team ID:", team._id);
      console.log("[FRONTEND] API URL:", `${API_URL}/problemstatements/${team._id}/select-problem`);

      const res = await fetch(`${API_URL}/problemstatements/${team._id}/select-problem`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("[FRONTEND] Response status:", res.status);

      const data = await res.json();
      console.log("[FRONTEND] Response data:", data);

      if (!res.ok) {
        console.error("[FRONTEND] Error response:", data);
        throw new Error(data.message || data.error || "Failed to select problem statement");
      }

      console.log("[FRONTEND] ✓ Problem statement selected successfully!");
      console.log("[FRONTEND] Selected IDs:", {
        parentId: data.selectedProblemStatement,
        subId: data.selectedProblemStatementSubId,
      });

      message.success(data.message || "Problem statement selected successfully!");

      // CRITICAL: Update team state with selection
      setTeam((prevTeam) => {
        console.log("[FRONTEND] Updating team state from:", {
          oldSelection: prevTeam.selectedProblemStatement,
          oldSubId: prevTeam.selectedProblemStatementSubId,
        });
        console.log("[FRONTEND] Updating team state to:", {
          newSelection: data.selectedProblemStatement,
          newSubId: data.selectedProblemStatementSubId,
        });

        return {
          ...prevTeam,
          selectedProblemStatement: data.selectedProblemStatement,
          selectedProblemStatementSubId: data.selectedProblemStatementSubId,
        };
      });

      // Update all problem statements to reflect the new selection
      setProblemStatements((prevStatements) =>
        prevStatements.map((ps) => ({
          ...ps,
          isSelected: ps._id === selectedProblem._id || (ps.isSelected && ps.selectedBy !== team._id),
          selectedBy: ps._id === selectedProblem._id ? team._id : ps.selectedBy
        }))
      );

      // Refresh problem statements from server to ensure consistent state
      await fetchProblemStatements(team._id);

      // Close modal
      setIsModalVisible(false);
      setSelectedProblem(null);

      // Force re-render check
      console.log("[FRONTEND] State update complete, hasSelectedProblem should now be true");

    } catch (error) {
      console.error("[FRONTEND] ✗ Error selecting problem:", error);
      message.error(error.message || "Failed to select problem statement");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelSelection = () => {
    console.log("[FRONTEND] Selection cancelled");
    setIsModalVisible(false);
    setSelectedProblem(null);
  };

  // Determine if current user is team lead
  const isTeamLead = React.useMemo(() => {
    if (!team || !team.teamLead || !userId) return false;

    const teamLeadId = (team.teamLead._id || team.teamLead).toString();
    const currentUserId = userId.toString();

    return teamLeadId === currentUserId;
  }, [team, userId]);

  const hasSelectedProblem = !!(team && team.selectedProblemStatement);

  console.log("[FRONTEND] Render state:", {
    isTeamLead,
    hasSelectedProblem,
    problemCount: problemStatements.length,
    loading,
    teamName: team?.name,
  });

  const renderProblemCard = (problem) => {
    // Check if this problem is selected by the current team
    const isSelectedByTeam =
      hasSelectedProblem &&
      team.selectedProblemStatementSubId?.toString() === problem._id.toString() &&
      team.selectedProblemStatement?.toString() === problem.parentId?.toString();

    // Check if problem is selected by another team
    const isSelectedByOther =
      problem.isSelected &&
      problem.selectedBy &&
      problem.selectedBy.toString() !== team._id.toString();

    // Can only select if:
    // 1. User is team lead
    // 2. Team hasn't selected any problem yet
    // 3. This problem isn't selected by another team
    const canSelect = isTeamLead && !hasSelectedProblem && !isSelectedByOther;

    const cardClassName = `problem-card ${isSelectedByTeam ? 'selected-by-team' : ''} ${isSelectedByOther ? 'unavailable' : ''}`;

    return (
      <Col xs={24} sm={24} md={12} lg={8} key={problem._id}>
        <Card
          className={cardClassName}
          title={
            <div className="problem-card-title">
              <span>{problem.title}</span>
              {isSelectedByTeam && (
                <CheckCircleOutlined />
              )}
              {isSelectedByOther && (
                <LockOutlined />
              )}
            </div>
          }
          extra={
            isSelectedByTeam ? (
              <span className="problem-status-badge selected">
                <CheckCircleOutlined /> Your Selection
              </span>
            ) : isSelectedByOther ? (
              <span className="problem-status-badge unavailable">
                <LockOutlined /> Unavailable
              </span>
            ) : (
              <span className="problem-status-badge available">Available</span>
            )
          }
        >
          <Paragraph className="problem-description" ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
            {problem.description}
          </Paragraph>

          {problem.technologies && problem.technologies.length > 0 && (
            <div className="tech-tags-section">
              <span className="tech-tags-label">Technologies</span>
              <div className="tech-tags-container">
                {problem.technologies.map((tech, idx) => (
                  <span key={idx} className="tech-tag">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Button - different states based on selection */}
          {isSelectedByTeam ? (
            <Button
              type="primary"
              disabled
              block
              className="problem-action-btn selected-btn"
              icon={<CheckCircleOutlined />}
            >
              Your Team's Selected Problem
            </Button>
          ) : isSelectedByOther ? (
            <Button
              type="default"
              disabled
              block
              className="problem-action-btn unavailable-btn"
              icon={<LockOutlined />}
            >
              Selected by Another Team
            </Button>
          ) : hasSelectedProblem ? (
            <Button
              type="default"
              disabled
              block
              className="problem-action-btn locked-btn"
              icon={<InfoCircleOutlined />}
            >
              Selection Locked
            </Button>
          ) : !isTeamLead ? (
            <Tooltip title="Only the team lead can select problem statements">
              <Button
                type="default"
                disabled
                block
                className="problem-action-btn team-lead-only"
                icon={<UserOutlined />}
              >
                Team Lead Only
              </Button>
            </Tooltip>
          ) : (
            <Button
              type="primary"
              onClick={() => handleSelectClick(problem)}
              block
              className="problem-action-btn select-btn"
              icon={<TrophyOutlined />}
            >
              Select This Problem
            </Button>
          )}
        </Card>
      </Col>
    );
  };

  // Show message when hackathon is completed
  if (hackathonCompleted) {
    return (
      <div className="problem-status-page">
        <div className="problem-status-card">
          <div className="status-icon warning">
            <ExclamationCircleOutlined />
          </div>
          <h3>Hackathon Completed</h3>
          <p>
            {hackathon?.hackathonname ? (
              <>The hackathon "<strong>{hackathon.hackathonname}</strong>" has been completed. </>
            ) : (
              <>Your previous hackathon has been completed. </>
            )}
            Register for a new hackathon to view and select problem statements.
          </p>
          <Button
            type="primary"
            size="large"
            icon={<TrophyOutlined />}
            className="status-btn primary"
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
      <div className="problem-status-page">
        <div className="problem-status-card">
          <div className="status-icon info">
            <CalendarOutlined />
          </div>
          <h3>Hackathon Starting Soon</h3>
          <p>
            {hackathon?.hackathonname ? (
              <>The hackathon "<strong>{hackathon.hackathonname}</strong>" hasn't started yet. </>
            ) : (
              <>Your hackathon hasn't started yet. </>
            )}
            Problem statements will be available once the hackathon begins.
            {hackathon?.startdate && (
              <><br /><strong>Start Date:</strong> {new Date(hackathon.startdate).toLocaleDateString()}</>
            )}
          </p>
          <Button
            type="default"
            size="large"
            icon={<TeamOutlined />}
            className="status-btn secondary"
            onClick={() => window.location.href = '/hackstudent/team-formation'}
          >
            Manage Your Team
          </Button>
        </div>
      </div>
    );
  }

  // Show message when not registered for any hackathon
  if (notRegistered) {
    return (
      <div className="problem-status-page">
        <div className="problem-status-card">
          <div className="status-icon info">
            <TeamOutlined />
          </div>
          <h3>Not Registered for Any Hackathon</h3>
          <p>
            You are not currently registered for any active hackathon.
            Register for a hackathon and join a team to view problem statements.
          </p>
          <Button
            type="primary"
            size="large"
            icon={<TrophyOutlined />}
            className="status-btn primary"
            onClick={() => window.location.href = '/hackstudent/hackathon'}
          >
            Browse Hackathons
          </Button>
        </div>
      </div>
    );
  }

  if (notInTeam) {
    return (
      <div className="problem-status-page">
        <div className="problem-status-card">
          <div className="status-icon info">
            <TeamOutlined />
          </div>
          <h3>Not in a Team Yet</h3>
          <p>
            {hackathon?.hackathonname ? (
              <>You are registered for "<strong>{hackathon.hackathonname}</strong>" but haven't joined a team yet. </>
            ) : (
              <>You are registered for a hackathon but haven't joined a team yet. </>
            )}
            Join or create a team to view and select problem statements.
          </p>
          <Button
            type="primary"
            size="large"
            icon={<TeamOutlined />}
            className="status-btn primary"
            onClick={() => window.location.href = '/hackstudent/team-formation'}
          >
            Join or Create Team
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="problem-statements-loading">
        <Spin size="large" tip="Loading team data..." />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="problem-status-page">
        <div className="problem-status-card">
          <div className="status-icon info">
            <TeamOutlined />
          </div>
          <h3>No Team Found</h3>
          <p>
            No team found for your registration. Please join or create a team to view problem statements.
          </p>
          <Button
            type="primary"
            size="large"
            icon={<TeamOutlined />}
            className="status-btn primary"
            onClick={() => window.location.href = '/hackstudent/team-formation'}
          >
            Join or Create Team
          </Button>
        </div>
      </div>
    );
  }

  if (!team.mentor || !team.mentor._id) {
    return (
      <div className="problem-status-page">
        <div className="problem-status-card">
          <div className="status-icon warning">
            <UserOutlined />
          </div>
          <h3>No Mentor Assigned</h3>
          <p>
            Your team does not have a mentor assigned yet. A mentor must be assigned before you can view problem statements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-statements-container">
      <div className="problem-statements-header">
        <h2>
          <FileTextOutlined />
          Problem Statements
        </h2>
      </div>

      <Card className="team-info-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div>
              <div className="info-label">Team Name</div>
              <div className="info-value">
                <TeamOutlined />
                {team.name}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <div className="info-label">Mentor</div>
              <div className="info-value">
                <UserOutlined />
                {team.mentor.name}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <div className="info-label">Hackathon</div>
              <div className="info-value">
                <TrophyOutlined />
                {hackathon?.hackathonname || "Loading..."}
              </div>
            </div>
          </Col>
        </Row>

        <div className="team-tags-row">
          {isTeamLead && (
            <Tag color="blue" icon={<UserOutlined />}>
              You are the Team Lead
            </Tag>
          )}

          {!isTeamLead && team.teamLead && (
            <Tag color="default" icon={<TeamOutlined />}>
              Team Member {team.teamLead.name ? `(Lead: ${team.teamLead.name})` : ''}
            </Tag>
          )}

          {hasSelectedProblem && (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Problem Statement Selected
            </Tag>
          )}

          {!hasSelectedProblem && isTeamLead && (
            <Tag color="warning" icon={<InfoCircleOutlined />}>
              Please select a problem statement
            </Tag>
          )}
        </div>
      </Card>

      <div className="problem-cards-container">
        {problemStatements.length === 0 ? (
          <div className="problem-empty-state">
            <Empty
              description="No problem statements available from your mentor for this hackathon."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <>
            {/* Show selected problem statement at the very top if exists */}
            {hasSelectedProblem && (
              <>
                <div className="problem-section-title selected">
                  <CheckCircleOutlined /> Your Selected Problem Statement
                </div>
                <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                  {problemStatements
                    .filter(ps =>
                      team.selectedProblemStatementSubId?.toString() === ps._id.toString() &&
                      team.selectedProblemStatement?.toString() === ps.parentId?.toString()
                    )
                    .map(renderProblemCard)}
                </Row>
                <div className="problem-section-title">
                  Other Problem Statements
                </div>
              </>
            )}
            <div className="problem-count-text">
              Showing {problemStatements.length} problem statement
              {problemStatements.length !== 1 ? "s" : ""} from your mentor
            </div>
            <Row gutter={[16, 16]}>
              {problemStatements
                .filter(ps => {
                  // Don't show the selected problem again in the list below
                  if (!hasSelectedProblem) return true;
                  return !(
                    team.selectedProblemStatementSubId?.toString() === ps._id.toString() &&
                    team.selectedProblemStatement?.toString() === ps.parentId?.toString()
                  );
                })
                .map(renderProblemCard)}
            </Row>
          </>
        )}
      </div>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircleOutlined style={{ color: "#2563eb" }} />
            Confirm Problem Statement Selection
          </div>
        }
        open={isModalVisible}
        onOk={handleConfirmSelection}
        onCancel={handleCancelSelection}
        okText="Confirm Selection"
        cancelText="Cancel"
        confirmLoading={modalLoading}
        closable={!modalLoading}
        maskClosable={!modalLoading}
        width={600}
        className="problem-confirm-modal"
      >
        <div>
          <Alert
            message="Important: This action cannot be undone"
            description="Once you select a problem statement, you cannot change it. Make sure this is the right choice for your team."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {selectedProblem && (
            <div className="confirm-problem-details">
              <h5>{selectedProblem.title}</h5>
              <p>{selectedProblem.description}</p>

              {selectedProblem.technologies && selectedProblem.technologies.length > 0 && (
                <div className="tech-tags-container">
                  {selectedProblem.technologies.map((tech, idx) => (
                    <span key={idx} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {hackathon && (
                <div className="confirm-hackathon-info">
                  <span>Hackathon: </span>
                  {hackathon.hackathonname}
                </div>
              )}
            </div>
          )}

          <p style={{ marginTop: 16, marginBottom: 0, color: '#4b5563' }}>
            Are you sure you want to select this problem statement for your team?
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default TeamProblemStatementsPage;