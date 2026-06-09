import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Spin,
  Typography,
  Empty,
  Modal,
  Tag,
  Form,
  Space,
  message,
  Select,
  Table,
  Descriptions,
  Divider,
  InputNumber,
  Statistic,
  Row,
  Col,
  Alert,
  Tooltip,
  List,
} from "antd";
























import {
  TeamOutlined,
  GithubOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LineChartOutlined,

  FileTextOutlined,
  GlobalOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileOutlined,
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined } from
"@ant-design/icons";
import axios from "axios";
import config from "../../../config";
import "./Evaluation.css";

const { Title, Text, Paragraph } = Typography;

const MentorEvaluationPage = () => {
  const [loading, setLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [evaluationModalVisible, setEvaluationModalVisible] = useState(false);
  const [submissionDetailModalVisible, setSubmissionDetailModalVisible] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [detailedSubmission, setDetailedSubmission] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [evaluationForm] = Form.useForm();

  const token = localStorage.getItem("token");
  const mentorId = localStorage.getItem("mentor");

  // Helper function to get file icon based on file type
  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      case 'ppt':
      case 'pptx':
        return <FilePptOutlined style={{ color: '#fa8c16', fontSize: 20 }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImageOutlined style={{ color: '#722ed1', fontSize: 20 }} />;
      default:
        return <FileOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />;
    }
  };

  // Helper function to open document in new tab
  const openDocument = async (doc, submissionId) => {
    const loadingMessage = message.loading('Opening document...', 0);
    try {
      const response = await axios.get(
        `${config.backendUrl}/mentorevaluation/submission/${submissionId}/document/${doc._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      loadingMessage();

      const blob = new Blob([response.data], { type: doc.fileType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        message.warning('Please allow pop-ups to view documents');
      } else {
        message.success('Document opened in new tab');
      }
      
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      loadingMessage();
      console.error('Error opening document:', error);
      
      if (error.response?.status === 403) {
        message.error('You do not have permission to view this document');
      } else if (error.response?.status === 404) {
        message.error('Document not found');
      } else {
        message.error('Failed to open document. Please try again.');
      }
    }
  };

  // Helper function to download document
  const downloadDocument = async (doc, submissionId) => {
    const loadingMessage = message.loading('Downloading document...', 0);
    try {
      const response = await axios.get(
        `${config.backendUrl}/mentorevaluation/submission/${submissionId}/document/${doc._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      loadingMessage();
      
      const blob = new Blob([response.data], { type: doc.fileType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      message.success(`Downloaded: ${doc.filename}`);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      loadingMessage();
      console.error('Error downloading document:', error);
      
      if (error.response?.status === 403) {
        message.error('You do not have permission to download this document');
      } else if (error.response?.status === 404) {
        message.error('Document not found');
      } else {
        message.error('Failed to download document. Please try again.');
      }
    }
  };

  // Fetch approved hackathons for mentor
  const fetchApprovedHackathons = async () => {
    if (!mentorId) {
      message.error("Mentor ID not found in localStorage");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${config.backendUrl}/mentorevaluation/hackathons/${mentorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setHackathons(res.data);

      if (res.data.length === 1) {
        const hackathon = res.data[0];
        setSelectedHackathon(hackathon);
        await fetchTeamsAndSubmissions(hackathon._id);
      }
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      message.error(
        error.response?.data?.message || "Failed to fetch hackathons"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch teams and their submissions for selected hackathon
  const fetchTeamsAndSubmissions = async (hackathonId) => {
    if (!mentorId) {
      message.error("Mentor ID not found");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${config.backendUrl}/mentorevaluation/hackteams/${mentorId}/${hackathonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTeams(res.data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      message.error(
        error.response?.data?.message || "Failed to fetch teams and submissions"
      );
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch evaluation statistics
  const fetchStatistics = async () => {
    if (!mentorId) return;

    try {
      setStatisticsLoading(true);
      const res = await axios.get(
        `${config.backendUrl}/mentorevaluation/statistics/${mentorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatistics(res.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setStatisticsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedHackathons();
    fetchStatistics();
  }, []);

  // Handle hackathon selection change
  const handleHackathonChange = async (hackathonId) => {
    const hack = hackathons.find((h) => h._id === hackathonId);
    setSelectedHackathon(hack);
    setTeams([]);
    if (hack) {
      await fetchTeamsAndSubmissions(hackathonId);
    }
  };

  // View submission details
  const viewSubmissionDetails = async (submission, team) => {
    setDetailedSubmission(submission);
    setCurrentTeam(team);
    setSubmissionDetailModalVisible(true);
    
    const loadingMessage = message.loading('Loading documents...', 0);
    try {
      const response = await axios.get(
        `${config.backendUrl}/mentorevaluation/submission/${submission._id}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      loadingMessage();
      setDocuments(response.data || []);
    } catch (error) {
      loadingMessage();
      setDocuments([]);
      console.error('Error fetching documents metadata:', error);
      
      if (error.response?.status !== 404) {
        message.warning('Could not load documents for this submission');
      }
    }
  };

  // Handle evaluation submission
  const handleEvaluate = async (values) => {
    if (!currentSubmission) return;

    try {
      const res = await axios.put(
        `${config.backendUrl}/mentorevaluation/evaluate/${currentSubmission._id}`,
        { evaluationScore: values.evaluationScore },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(
        res.data.message || "Evaluation submitted successfully!"
      );
      setEvaluationModalVisible(false);
      evaluationForm.resetFields();
      setCurrentSubmission(null);
      setCurrentTeam(null);

      if (selectedHackathon) {
        await fetchTeamsAndSubmissions(selectedHackathon._id);
      }
      fetchStatistics();
    } catch (error) {
      console.error("Evaluation error:", error);
      message.error(
        error.response?.data?.message || "Failed to submit evaluation"
      );
    }
  };

  // Open evaluation modal
  const openEvaluationModal = (team, submission) => {
    setCurrentTeam(team);
    setCurrentSubmission(submission);
    evaluationForm.setFieldsValue({
      evaluationScore: submission.evaluationScore || 0,
    });
    setEvaluationModalVisible(true);
  };

  // Table columns for teams
  const columns = [
    {
      title: "Team Name",
      dataIndex: "teamname",
      key: "teamname",
      width: 200,
      fixed: "left",
      render: (text) => (
        <Space>
          <TeamOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text || "Unnamed Team"}</Text>
        </Space>
      ),
    },
    {
      title: "Team Lead",
      key: "teamlead",
      width: 220,
      render: (_, record) => {
        const leadName = record.teamLead?.name || "N/A";
        const leadEmail = record.teamLead?.email || "";
        return (
          <div>
            <div>
              <UserOutlined /> <Text strong>{leadName}</Text>
            </div>
            {leadEmail && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {leadEmail}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "GitHub Link",
      key: "github",
      width: 250,
      render: (_, record) => {
        const sub = record.submissions && record.submissions[0];
        return sub && (sub.github || sub.githubRepo) ? (
          <a
            href={sub.github || sub.githubRepo}
            target="_blank"
            rel="noopener noreferrer"
            style={{ wordBreak: "break-all" }}
          >
            <GithubOutlined /> Repository
          </a>
        ) : (
          <Text type="secondary">
            <GithubOutlined /> No link
          </Text>
        );
      },
    },
    {
      title: "Documents",
      key: "documents",
      width: 120,
      align: "center",
      render: (_, record) => {
        const sub = record.submissions && record.submissions[0];
        const docCount = sub?.documents || 0;
          return docCount > 0 ? (
            <Tooltip title="View documents">
              <Tag
                color="blue"
                icon={<FileTextOutlined />}
                style={{ cursor: "pointer" }}
                onClick={() => viewSubmissionDetails(sub, record)}
              >
                {docCount} {docCount === 1 ? 'file' : 'files'}
              </Tag>
            </Tooltip>
          ) : (
            <Text type="secondary">-</Text>
          );
      },
    },
    {
      title: "Score",
      key: "score",
      width: 150,
      render: (_, record) => {
        const sub = record.submissions && record.submissions[0];
        return sub ? (
          <Space>
            {typeof sub.evaluationScore === 'number' ? (
              <Tag color="green">{sub.evaluationScore}/100</Tag>
            ) : (
              <Tag color="orange">Pending</Tag>
            )}
            <Button
              type="primary"
              size="small"
              icon={<TrophyOutlined />}
              onClick={() => openEvaluationModal(record, sub)}
            >
              {typeof sub.evaluationScore === 'number' ? 'Update' : 'Add Score'}
            </Button>
          </Space>
        ) : (
          <Tag color="red">No Submission</Tag>
        );
      },
    },
  ];

  // Get hackathon status tag
  const getStatusTag = (status) => {
    switch (status) {
      case 'ongoing':
        return <Tag icon={<ClockCircleOutlined />} color="processing">Ongoing</Tag>;
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'upcoming':
        return <Tag icon={<CalendarOutlined />} color="warning">Upcoming</Tag>;
      default:
        return <Tag color="default">{status || 'Unknown'}</Tag>;
    }
  };

  // All hackathons sorted: ongoing first, then completed, then upcoming
  const allHackathons = [...hackathons].sort((a, b) => {
    const order = { 'ongoing': 0, 'completed': 1, 'upcoming': 2 };
    return (order[a.status] || 3) - (order[b.status] || 3);
  });
  
  // Ongoing hackathons only (for backwards compatibility)
  const ongoingHackathons = hackathons.filter(
    (h) => h.status === "ongoing" || !h.status
  );

  return (
    <div style={{ padding: 30 }} className="evaluation-container">
      <Title level={3}>
        <TrophyOutlined /> Team Evaluations
      </Title>
      <Text type="secondary">
        Evaluate team submissions for your assigned hackathons
      </Text>

      {/* Statistics Cards */}
      {statistics && !statisticsLoading && (
        <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }} className="evaluation-stats-row">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Teams"
                value={statistics.totalTeams}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Submissions"
                value={statistics.totalSubmissions}
                prefix={<GithubOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Evaluated"
                value={statistics.evaluatedSubmissions}
                suffix={`/ ${statistics.totalSubmissions}`}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={statistics.averageScore}
                suffix="/ 100"
                prefix={<LineChartOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Hackathon Selection */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Select Hackathon:</Text>
            <Select
              showSearch
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Search or select a hackathon"
              value={selectedHackathon?._id}
              onChange={handleHackathonChange}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              optionLabelProp="label"
              loading={loading && !selectedHackathon}
            >
              {allHackathons.map((h) => (
                <Select.Option key={h._id} value={h._id} label={h.name}>
                  <Space>
                    <span>{h.name}</span>
                    {getStatusTag(h.status)}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Hackathon Details */}
          {selectedHackathon && (
            <>
              <Divider style={{ margin: "12px 0" }} />
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Hackathon" span={2}>
                  <Space>
                    <Text strong>{selectedHackathon.name}</Text>
                    {getStatusTag(selectedHackathon.status)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {selectedHackathon.description || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Start Date">
                  {selectedHackathon.startDate
                    ? new Date(selectedHackathon.startDate).toLocaleDateString()
                    : "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="End Date">
                  {selectedHackathon.endDate
                    ? new Date(selectedHackathon.endDate).toLocaleDateString()
                    : "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </Space>
      </Card>

      {/* Info Alert for completed hackathon */}
      {selectedHackathon && selectedHackathon.status === 'completed' && (
        <Alert
          message="Completed Hackathon"
          description="This hackathon has ended. You can view and update evaluations for submitted projects."
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}
      
      {/* Info Alert for upcoming hackathon */}
      {selectedHackathon && selectedHackathon.status === 'upcoming' && (
        <Alert
          message="Upcoming Hackathon"
          description="This hackathon hasn't started yet. Teams and submissions will be available once the hackathon begins."
          type="warning"
          showIcon
          icon={<CalendarOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Evaluation Guidelines Alert */}
      {selectedHackathon && selectedHackathon.status !== 'upcoming' && teams.length > 0 && (
        <Alert
          message="Evaluation Guidelines"
          description="Review each team's GitHub repository and project details before assigning a score. Scores must be between 0 and 100. You can re-evaluate submissions if needed."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Teams Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading teams and submissions...</Text>
          </div>
        </div>
      ) : selectedHackathon ? (
        teams.length > 0 ? (
          <Card>
            <div className="evaluation-table-wrapper">
              <Table
                columns={columns}
                dataSource={teams}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} teams`,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50']
                }}
                scroll={{ x: 1200 }}
              />
            </div>
          </Card>
        ) : (
          <Empty
            description="No teams assigned to you for this hackathon"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )
      ) : (
        <Empty
          description="Please select a hackathon to view teams"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {/* Submission Detail Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Submission Details</span>
          </Space>
        }
        open={submissionDetailModalVisible}
        onCancel={() => {
          setSubmissionDetailModalVisible(false);
          setDetailedSubmission(null);
          setCurrentTeam(null);
          setDocuments([]);
        }}
        footer={null}
        width={700}
        wrapperClassName="submission-detail-modal"
      >
        {detailedSubmission && currentTeam && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Team Name">
                  <Text strong>{currentTeam.teamname}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Team Lead">
                  {currentTeam.teamLead?.name || "N/A"}
                  {currentTeam.teamLead?.email && (
                    <> ({currentTeam.teamLead.email})</>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="GitHub Repository">
                  {detailedSubmission.github || detailedSubmission.githubRepo ? (
                    <a
                      href={detailedSubmission.github || detailedSubmission.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GithubOutlined /> {detailedSubmission.github || detailedSubmission.githubRepo}
                    </a>
                  ) : (
                    <Text type="secondary">No GitHub link provided</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Live Demo Link">
                  {detailedSubmission.liveDemoLink ? (
                    <a
                      href={detailedSubmission.liveDemoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GlobalOutlined /> {detailedSubmission.liveDemoLink}
                    </a>
                  ) : (
                    <Text type="secondary">No live demo link</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Project Description">
                  {detailedSubmission.projectDescription ? (
                    <Paragraph
                      ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                      style={{ marginBottom: 0 }}
                    >
                      {detailedSubmission.projectDescription}
                    </Paragraph>
                  ) : (
                    <Text type="secondary">No description provided</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Documents Section */}
            <Card 
              size="small" 
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Uploaded Documents</span>
                  {documents.length > 0 && (
                    <Tag color="blue">{documents.length} {documents.length === 1 ? 'file' : 'files'}</Tag>
                  )}
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              {documents.length > 0 ? (
                <List
                  size="small"
                  dataSource={documents}
                  renderItem={(doc) => (
                    <List.Item 
                      key={doc._id}
                      actions={[
                        <Tooltip title="View document in new tab">
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => openDocument(doc, detailedSubmission._id)}
                            size="small"
                          >
                            View
                          </Button>
                        </Tooltip>,
                        <Tooltip title="Download document">
                          <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            onClick={() => downloadDocument(doc, detailedSubmission._id)}
                            size="small"
                          >
                            Download
                          </Button>
                        </Tooltip>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={getFileIcon(doc.filename)}
                        title={<Text strong>{doc.filename}</Text>}
                        description={
                          <Space size="small">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {(doc.size / 1024).toFixed(1)} KB
                            </Text>
                            {doc.uploadedAt && (
                              <>
                                <Text type="secondary">•</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {new Date(doc.uploadedAt).toLocaleDateString()}
                                </Text>
                              </>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  description="No documents uploaded"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '24px 0' }}
                />
              )}
            </Card>

            {/* Team Members Section */}
            {detailedSubmission.teamMembers && detailedSubmission.teamMembers.length > 0 && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <TeamOutlined />
                    <span>Team Members</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <List
                  size="small"
                  dataSource={detailedSubmission.teamMembers}
                  renderItem={(member, idx) => (
                    <List.Item key={idx}>
                      <Space>
                        <UserOutlined />
                        <div>
                          <Text strong>{member.student?.name || 'Unknown'}</Text>
                          {member.student?.email && (
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                              ({member.student.email})
                            </Text>
                          )}
                          {member.contribution && (
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Contribution: {member.contribution}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            <Form
              layout="vertical"
              initialValues={{ evaluationScore: detailedSubmission.evaluationScore || 0 }}
              onFinish={async (values) => {
                setSubmissionDetailModalVisible(false);
                setCurrentSubmission(detailedSubmission);
                setCurrentTeam(currentTeam);
                await handleEvaluate(values);
                setDocuments([]);
              }}
            >
              <Form.Item
                name="evaluationScore"
                label="Add Score (0-100)"
                rules={[
                  { required: true, message: "Please enter a score" },
                  {
                    type: "number",
                    min: 0,
                    max: 100,
                    message: "Score must be between 0 and 100",
                  },
                ]}
              >
                <InputNumber min={0} max={100} style={{ width: "100%" }} placeholder="Enter score (0-100)" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button
                    onClick={() => {
                      setSubmissionDetailModalVisible(false);
                      setDetailedSubmission(null);
                      setCurrentTeam(null);
                      setDocuments([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<TrophyOutlined />}>
                    Submit Score
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Evaluation Modal */}
      <Modal
        title={
          <Space>
            <TrophyOutlined />
            <span>Evaluate Submission</span>
          </Space>
        }
        open={evaluationModalVisible}
        footer={null}
        onCancel={() => {
          setEvaluationModalVisible(false);
          evaluationForm.resetFields();
          setCurrentSubmission(null);
          setCurrentTeam(null);
        }}
        width={650}
        wrapperClassName="evaluation-modal"
      >
        {currentTeam && currentSubmission && (
          <>
            <Card style={{ marginBottom: 16, backgroundColor: "#fafafa" }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Team Name">
                  <Text strong>{currentTeam.teamname}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Team Lead">
                  {currentTeam.teamLead?.name || "N/A"}
                  {currentTeam.teamLead?.email && (
                    <> ({currentTeam.teamLead.email})</>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="GitHub Repository">
                  {currentSubmission.github || currentSubmission.githubRepo ? (
                    <a
                      href={currentSubmission.github || currentSubmission.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GithubOutlined /> View Repository
                    </a>
                  ) : (
                    <Text type="secondary">No GitHub link provided</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Submitted At">
                  {currentSubmission.submittedAt
                    ? new Date(currentSubmission.submittedAt).toLocaleString()
                    : "N/A"}
                </Descriptions.Item>
                {(currentSubmission.evaluationScore !== null && 
                  currentSubmission.evaluationScore !== undefined) && (
                  <Descriptions.Item label="Current Score">
                    <Tag color="blue" style={{ fontSize: 14 }}>
                      {currentSubmission.evaluationScore}/100
                    </Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Divider />

            <Form
              form={evaluationForm}
              layout="vertical"
              onFinish={handleEvaluate}
            >
              <Form.Item
                name="evaluationScore"
                label="Evaluation Score (0-100)"
                rules={[
                  { required: true, message: "Please enter a score" },
                  {
                    type: "number",
                    min: 0,
                    max: 100,
                    message: "Score must be between 0 and 100",
                  },
                ]}
                extra="Enter a score based on the team's submission quality, completeness, and innovation."
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: "100%" }}
                  placeholder="Enter score (0-100)"
                  size="large"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button
                    onClick={() => {
                      setEvaluationModalVisible(false);
                      evaluationForm.resetFields();
                      setCurrentSubmission(null);
                      setCurrentTeam(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<TrophyOutlined />}>
                    Submit Evaluation
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MentorEvaluationPage;