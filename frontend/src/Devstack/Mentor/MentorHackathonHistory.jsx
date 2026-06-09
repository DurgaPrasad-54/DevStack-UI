

import { useState, useEffect } from 'react';
import {
  Card,
  Spin,
  Empty,
  Typography,
  Tag,
  Timeline,
  Progress,
  Row,
  Col,
  Avatar,
  Space,
  Button,
  Statistic,
  Select,
  Tabs,

  Descriptions,
  List,
  Collapse,
  message,
  Table,
  Rate,
  Tooltip,
} from 'antd';
import {
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  CodeOutlined,
  GithubOutlined,

  CheckCircleOutlined,
  UserOutlined,
  BulbOutlined,
  RocketOutlined,
  HistoryOutlined,
  ProjectOutlined,
  DownOutlined,
  ClockCircleOutlined,

  BookOutlined,
  StarOutlined,
  ScheduleOutlined,
  SolutionOutlined,

  BarChartOutlined,
  FileSearchOutlined,
  CommentOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import config from '../../config';
import '../Student/hackathon/hackathon.css';
import './MentorHackathonHistory.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const MentorHackathonHistory = () => {
  const [loading, setLoading] = useState(true);
  const [hackathonList, setHackathonList] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState(null);
  const [selectedHackathonData, setSelectedHackathonData] = useState(null);
  const [summary, setSummary] = useState(null);

  const mentorId = localStorage.getItem('mentor');

  useEffect(() => {
    if (mentorId) {
      fetchHackathonHistory();
      fetchSummary();
    }
  }, [mentorId]);

  // Auto-select first hackathon when list loads
  useEffect(() => {
    if (hackathonList.length > 0 && !selectedHackathonId) {
      setSelectedHackathonId(hackathonList[0].hackathon._id);
    }
  }, [hackathonList]);

  // Fetch detailed data when hackathon is selected
  useEffect(() => {
    if (selectedHackathonId && hackathonList.length > 0) {
      const selected = hackathonList.find(h => h.hackathon._id === selectedHackathonId);
      setSelectedHackathonData(selected || null);
    }
  }, [selectedHackathonId, hackathonList]);

  const fetchHackathonHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${config.backendUrl}/mentor-hackathon-history/mentor/${mentorId}/completed`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.data.success) {
        setHackathonList(response.data.hackathons || []);
      }
    } catch (error) {
      console.error('Error fetching hackathon history:', error);
      message.error('Failed to fetch hackathon history');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(
        `${config.backendUrl}/mentor-hackathon-history/mentor/${mentorId}/summary`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#52c41a';
      case 'ongoing': return '#1890ff';
      case 'upcoming': return '#faad14';
      default: return '#8c8c8c';
    }
  };

  const handleHackathonChange = (hackathonId) => {
    setSelectedHackathonId(hackathonId);
  };

  // Summary Cards Component
  const SummaryCards = () => (
    <Row gutter={[4, 4]} className="mentor-history-summary-row" style={{ marginBottom: '16px' }}>
      <Col xs={12} sm={12} md={8} lg={4}>
        <Card style={{ borderRadius: '10px', background: '#f0f5ff', border: '1px solid #d6e4ff' }} bodyStyle={{ padding: '12px', textAlign: 'center' }}>
          <TrophyOutlined style={{ fontSize: '22px', color: '#667eea', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a365d' }}>{summary?.totalParticipated || 0}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>Participated</Text>
        </Card>
      </Col>
      <Col xs={12} sm={12} md={8} lg={4}>
        <Card style={{ borderRadius: '10px', background: '#f6ffed', border: '1px solid #b7eb8f' }} bodyStyle={{ padding: '12px', textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: '22px', color: '#52c41a', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a365d' }}>{summary?.completedHackathons || 0}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>Completed</Text>
        </Card>
      </Col>
      <Col xs={12} sm={12} md={8} lg={4}>
        <Card style={{ borderRadius: '10px', background: '#fff0f6', border: '1px solid #ffadd2' }} bodyStyle={{ padding: '12px', textAlign: 'center' }}>
          <TeamOutlined style={{ fontSize: '22px', color: '#eb2f96', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a365d' }}>{summary?.totalTeamsMentored || 0}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>Teams Mentored</Text>
        </Card>
      </Col>
      <Col xs={12} sm={12} md={8} lg={4}>
        <Card style={{ borderRadius: '10px', background: '#e6f7ff', border: '1px solid #91d5ff' }} bodyStyle={{ padding: '12px', textAlign: 'center' }}>
          <ProjectOutlined style={{ fontSize: '22px', color: '#1890ff', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a365d' }}>{summary?.totalSubmissions || 0}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>Submissions</Text>
        </Card>
      </Col>
      <Col xs={12} sm={12} md={8} lg={4}>
        <Card style={{ borderRadius: '10px', background: '#fff7e6', border: '1px solid #ffd591' }} bodyStyle={{ padding: '12px', textAlign: 'center' }}>
          <RocketOutlined style={{ fontSize: '22px', color: '#fa8c16', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a365d' }}>{summary?.ongoingHackathons || 0}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>Ongoing</Text>
        </Card>
      </Col>
    </Row>
  );

  // Hackathon Selector Dropdown
  const HackathonSelector = () => (
    <Card
      className="mentor-history-selector"
      style={{
        borderRadius: '16px',
        marginBottom: '24px',
        background: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <Row align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text strong style={{ fontSize: '16px', color: '#1a1a1a' }}>
              <HistoryOutlined style={{ marginRight: '8px', color: '#667eea' }} />
              Select Hackathon
            </Text>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Choose a hackathon to view your mentoring history
            </Text>
          </Space>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Select
            value={selectedHackathonId}
            onChange={handleHackathonChange}
            style={{ width: '100%' }}
            size="large"
            placeholder="Select a hackathon"
            suffixIcon={<DownOutlined style={{ color: '#667eea' }} />}
            dropdownStyle={{ borderRadius: '12px' }}
          >
            {hackathonList.map((item) => (
              <Option key={item.hackathon._id} value={item.hackathon._id}>
                <Space>
                  <TrophyOutlined style={{ color: '#667eea' }} />
                  <span style={{ wordBreak: 'break-word' }}>{item.hackathon.name}</span>
                  <Tag color="blue">{item.teamsCount} teams</Tag>
                </Space>
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Card>
  );

  // Team Card Component
  const TeamCard = ({ team, index }) => (
    <Card
      style={{
        borderRadius: '16px',
        marginBottom: '16px',
        border: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Team Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px 20px',
        margin: '-24px -24px 16px -24px',
        borderRadius: '10px 10px 0 0',
      }} className="mentor-history-team-header">
        <Row align="middle" justify="space-between" wrap gutter={[8, 8]}>
          <Col xs={24} sm={12}>
            <Space>
              <Avatar
                size={48}
                icon={<TeamOutlined />}
                style={{ background: 'rgba(255,255,255,0.2)' }}
              />
              <div>
                <Title level={4} style={{ color: 'white', margin: 0, wordBreak: 'break-word' }}>
                  {team.name || 'Unnamed Team'}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
                  {team.members?.length || 0} Members
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
            <Space wrap>
              {team.progress && (
                <Tag color="white" style={{ color: '#333', fontWeight: 600 }}>
                  {team.progress.percentage || 0}% Progress
                </Tag>
              )}
              {team.submission && (
                <Tag color="green">Submitted</Tag>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      <Collapse ghost expandIconPosition="end">
        {/* Team Members */}
        <Panel 
          header={
            <Text strong>
              <UserOutlined style={{ marginRight: '8px', color: '#667eea' }} />
              Team Members ({team.members?.length || 0})
            </Text>
          } 
          key="members"
        >
          <Row gutter={[12, 12]} className="mentor-history-members-grid">
            {team.members?.map((member, idx) => (
              <Col xs={24} sm={24} md={12} key={member._id || idx}>
                <Card
                  size="small"
                  style={{
                    borderRadius: '10px',
                    border: member.isTeamLead ? '2px solid #ffd700' : '1px solid #f0f0f0',
                    background: member.isTeamLead ? '#fffef0' : 'white',
                  }}
                >
                  <Space>
                    <Avatar
                      size={36}
                      icon={<UserOutlined />}
                      style={{
                        background: member.isTeamLead
                          ? 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Space size={4} wrap>
                        <Text strong style={{ fontSize: '14px', wordBreak: 'break-word' }}>{member.name}</Text>
                        {member.isTeamLead && <Tag color="gold" style={{ fontSize: '10px' }}>Lead</Tag>}
                      </Space>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px', wordBreak: 'break-word' }}>
                          {member.rollNo} • {member.branch}
                        </Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Panel>

        {/* Problem Statement */}
        {team.problemStatement && (
          <Panel
            header={
              <Text strong>
                <BulbOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                Problem Statement
              </Text>
            }
            key="problem"
          >
            <Card
              size="small"
              style={{ borderRadius: '10px', background: '#f9f9f9' }}
            >
              <Tag color="purple" style={{ marginBottom: '8px' }}>{team.problemStatement.domain}</Tag>
              <Title level={5} style={{ marginBottom: '4px' }}>{team.problemStatement.title}</Title>
              <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: '13px' }}>
                {team.problemStatement.description}
              </Paragraph>
            </Card>
          </Panel>
        )}

        {/* Progress */}
        {team.progress && (
          <Panel
            header={
              <Text strong>
                <RocketOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                Team Progress
              </Text>
            }
            key="progress"
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Progress
                type="circle"
                percent={team.progress.percentage || 0}
                size={120}
                strokeColor={{
                  '0%': '#667eea',
                  '100%': '#764ba2',
                }}
              />
              <div style={{ marginTop: '16px' }}>
                <Tag color={
                  team.progress.status === 'Completed' ? 'success' :
                  team.progress.status === 'In Progress' ? 'processing' : 'default'
                }>
                  {team.progress.status || 'Not Started'}
                </Tag>
              </div>
              {team.progress.description && (
                <Paragraph type="secondary" style={{ marginTop: '12px', fontSize: '13px' }}>
                  {team.progress.description}
                </Paragraph>
              )}
            </div>
          </Panel>
        )}

        {/* Submission */}
        {team.submission && (
          <Panel
            header={
              <Text strong>
                <CodeOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                Project Submission
              </Text>
            }
            key="submission"
          >
            <Card
              size="small"
              style={{ borderRadius: '10px', background: '#f0fff0' }}
            >
              <Title level={5} style={{ marginBottom: '8px' }}>
                {team.submission.projectTitle || 'Untitled Project'}
              </Title>
              <Paragraph style={{ marginBottom: '12px', fontSize: '13px' }}>
                {team.submission.projectDescription}
              </Paragraph>
              {team.submission.techStack?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <Space wrap size={[4, 4]}>
                    {team.submission.techStack.map((tech, i) => (
                      <Tag key={i} color="geekblue">{tech}</Tag>
                    ))}
                  </Space>
                </div>
              )}
              {team.submission.githubRepo && (
                <Button
                  type="primary"
                  icon={<GithubOutlined />}
                  size="small"
                  href={team.submission.githubRepo}
                  target="_blank"
                  style={{ background: '#24292e', border: 'none' }}
                >
                  GitHub
                </Button>
              )}
            </Card>
          </Panel>
        )}
      </Collapse>
    </Card>
  );

  // Teams Tab
  const TeamsTab = ({ teams }) => {
    if (!teams || teams.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No teams mentored in this hackathon"
        />
      );
    }

    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ fontSize: '16px' }}>
            <TeamOutlined style={{ marginRight: '8px', color: '#667eea' }} />
            Teams You Mentored ({teams.length})
          </Text>
        </div>
        {teams.map((team, index) => (
          <TeamCard key={team._id || index} team={team} index={index} />
        ))}
      </div>
    );
  };

  // Schedule Tab
  const ScheduleTab = ({ schedule }) => {
    if (!schedule || schedule.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No schedule available"
        />
      );
    }

    return (
      <div>
        {schedule.map((dayItem, dayIndex) => (
          <Card
            key={dayIndex}
            style={{
              borderRadius: '10px',
              marginBottom: '16px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div className="mentor-history-gradient-header" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '14px 20px',
              margin: '-24px -24px 16px -24px',
            }}>
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                <CalendarOutlined style={{ marginRight: '10px' }} />
                {dayItem.day}
              </Title>
            </div>

            <Timeline mode="left">
              {dayItem.sessions?.map((session, sessionIndex) => (
                <Timeline.Item
                  key={sessionIndex}
                  color="#667eea"
                  dot={<ClockCircleOutlined style={{ fontSize: '16px', color: '#667eea' }} />}
                >
                  <Card
                    size="small"
                    style={{
                      borderRadius: '10px',
                      background: '#f8f9ff',
                      border: '1px solid #e8ecff',
                    }}
                  >
                    <Row justify="space-between" align="middle" gutter={[8, 8]}>
                      <Col flex="auto">
                        <Text strong style={{ fontSize: '14px' }}>{session.session}</Text>
                      </Col>
                      <Col>
                        <Tag color="blue" icon={<ClockCircleOutlined />}>{session.time}</Tag>
                      </Col>
                    </Row>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        ))}
      </div>
    );
  };

  // Problem Statements Tab
  const ProblemStatementsTab = ({ problemStatements }) => {
    if (!problemStatements || problemStatements.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No problem statements available"
        />
      );
    }

    // Group by domain
    const groupedByDomain = problemStatements.reduce((acc, ps) => {
      if (!acc[ps.domain]) acc[ps.domain] = [];
      acc[ps.domain].push(ps);
      return acc;
    }, {});

    return (
      <div>
        {Object.entries(groupedByDomain).map(([domain, problems], idx) => (
          <Card
            key={domain}
            style={{
              borderRadius: '10px',
              marginBottom: '16px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div className="mentor-history-gradient-header" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '14px 20px',
              margin: '-24px -24px 16px -24px',
            }}>
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                <BulbOutlined style={{ marginRight: '10px' }} />
                {domain}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                {problems.length} Problem{problems.length > 1 ? 's' : ''}
              </Text>
            </div>

            <List
              itemLayout="vertical"
              dataSource={problems}
              renderItem={(item, index) => (
                <List.Item style={{ padding: '12px 0', borderBottom: index < problems.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <Title level={5} style={{ marginBottom: '4px' }}>{item.title}</Title>
                  <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: '13px' }}>
                    {item.description}
                  </Paragraph>
                </List.Item>
              )}
            />
          </Card>
        ))}
      </div>
    );
  };

  // All Teams Progress Tab
  const AllTeamsProgressTab = ({ allTeamsProgress }) => {
    if (!allTeamsProgress || allTeamsProgress.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No teams progress data available"
        />
      );
    }

    // Sort by progress percentage (descending)
    const sortedTeams = [...allTeamsProgress].sort((a, b) => 
      (b.progress?.percentage || 0) - (a.progress?.percentage || 0)
    );

    const columns = [
      {
        title: '#',
        key: 'rank',
        width: 45,
        render: (_, __, index) => (
          <Avatar
            size={24}
            style={{
              background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#e8e8e8',
              color: index < 3 ? '#333' : '#666',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            {index + 1}
          </Avatar>
        ),
      },
      {
        title: 'Team',
        dataIndex: 'name',
        key: 'name',
        render: (name, record) => (
          <Space direction="vertical" size={0}>
            <Space size={4} wrap>
              <Text strong style={{ fontSize: '13px' }}>{name}</Text>
              {record.isMentoredByMe && (
                <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>My Team</Tag>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.teamLead || 'N/A'} • {record.memberCount} members
            </Text>
          </Space>
        ),
      },
      {
        title: 'Mentor',
        dataIndex: 'mentorName',
        key: 'mentorName',
        responsive: ['md'],
        render: (mentor) => <Text style={{ fontSize: '13px' }}>{mentor}</Text>,
      },
      {
        title: 'Progress',
        key: 'progress',
        width: 140,
        render: (_, record) => (
          <div>
            <Progress
              percent={record.progress?.percentage || 0}
              size="small"
              strokeColor={{
                '0%': '#667eea',
                '100%': '#764ba2',
              }}
            />
            <Tag 
              color={
                record.progress?.status === 'Completed' ? 'success' :
                record.progress?.status === 'In Progress' ? 'processing' : 'default'
              }
              style={{ marginTop: '4px', fontSize: '10px' }}
            >
              {record.progress?.status || 'Not Started'}
            </Tag>
          </div>
        ),
      },
    ];

    // Calculate summary stats
    const completedCount = sortedTeams.filter(t => t.progress?.status === 'Completed').length;
    const inProgressCount = sortedTeams.filter(t => t.progress?.status === 'In Progress').length;
    const notStartedCount = sortedTeams.filter(t => t.progress?.status === 'Not Started' || !t.progress?.status).length;
    const avgProgress = sortedTeams.length > 0 
      ? Math.round(sortedTeams.reduce((sum, t) => sum + (t.progress?.percentage || 0), 0) / sortedTeams.length)
      : 0;

    return (
      <div>
        {/* Summary Stats */}
        <Row gutter={[8,8]} className="mentor-history-summary-row" style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={12} md={6}>
            <Card className="summary-card" style={{ borderRadius: '12px', textAlign: 'center', background: '#f0f5ff' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: '12px' }}>Total Teams</Text>}
                value={sortedTeams.length} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="summary-card" style={{ borderRadius: '12px', textAlign: 'center', background: '#f6ffed' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: '12px' }}>Completed</Text>}
                value={completedCount} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="summary-card" style={{ borderRadius: '12px', textAlign: 'center', background: '#e6f7ff' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: '12px' }}>In Progress</Text>}
                value={inProgressCount} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="summary-card" style={{ borderRadius: '12px', textAlign: 'center', background: '#fff7e6' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: '12px' }}>Avg Progress</Text>}
                value={avgProgress} 
                suffix="%" 
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Teams Table */}
        <Card style={{ borderRadius: '12px', marginTop: '16px' }} bodyStyle={{ padding: '12px' }}>
          <div className="mentor-history-table-wrapper">
            <Table
              dataSource={sortedTeams}
              columns={columns}
              rowKey="_id"
              pagination={{ pageSize: 20 }}
              rowClassName={(record) => record.isMentoredByMe ? 'my-team-row' : ''}
            />
          </div>
        </Card>

        <style>{`
          .my-team-row {
            background-color: #f0f5ff !important;
          }
          .my-team-row:hover td {
            background-color: #e6f0ff !important;
          }
        `}</style>
      </div>
    );
  };

  // All Submissions Tab
  const AllSubmissionsTab = ({ allSubmissions }) => {
    if (!allSubmissions || allSubmissions.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No submissions available"
        />
      );
    }

    // Sort by score (descending)
    const sortedSubmissions = [...allSubmissions].sort((a, b) => (b.score || 0) - (a.score || 0));

    const columns = [
      {
        title: '#',
        key: 'rank',
        width: 45,
        render: (_, __, index) => (
          <Avatar
            size={24}
            style={{
              background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#e8e8e8',
              color: index < 3 ? '#333' : '#666',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            {index + 1}
          </Avatar>
        ),
      },
      {
        title: 'Team',
        key: 'team',
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Space size={4} wrap>
              <Text strong style={{ fontSize: '13px' }}>{record.teamName}</Text>
              {record.isMentoredByMe && (
                <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>My Team</Tag>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.teamLead || 'N/A'}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Problem',
        dataIndex: 'problemTitle',
        key: 'problemTitle',
        responsive: ['md'],
        ellipsis: true,
        render: (title) => (
          <Tooltip title={title}>
            <Text style={{ fontSize: '13px' }}>{title}</Text>
          </Tooltip>
        ),
      },
      {
        title: 'Score',
        dataIndex: 'score',
        key: 'score',
        width: 80,
        render: (score) => (
          <Tag 
            color={score >= 80 ? 'green' : score >= 60 ? 'blue' : score >= 40 ? 'orange' : 'default'}
            style={{ fontSize: '12px', padding: '2px 8px' }}
          >
            {score || 0}/100
          </Tag>
        ),
      },
      {
        title: 'Links',
        key: 'links',
        width: 80,
        responsive: ['sm'],
        render: (_, record) => (
          <Space size={4}>
            {record.githubRepo && (
              <Tooltip title="GitHub Repo">
                <Button 
                  type="text" 
                  icon={<GithubOutlined />} 
                  href={record.githubRepo}
                  target="_blank"
                  size="small"
                />
              </Tooltip>
            )}
            {record.liveDemoLink && (
              <Tooltip title="Live Demo">
                <Button 
                  type="text" 
                  icon={<LinkOutlined />} 
                  href={record.liveDemoLink}
                  target="_blank"
                  size="small"
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
      {
        title: 'Submitted',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        responsive: ['lg'],
        render: (date) => <Text style={{ fontSize: '12px' }}>{formatDate(date)}</Text>,
      },
    ];

    // Calculate summary stats
    const avgScore = sortedSubmissions.length > 0 
      ? Math.round(sortedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / sortedSubmissions.length)
      : 0;
    const topScore = sortedSubmissions.length > 0 ? (sortedSubmissions[0]?.score || 0) : 0;
    const myTeamSubmissions = sortedSubmissions.filter(s => s.isMentoredByMe);

    return (
      <div>
        {/* Summary Stats */}
        <Row gutter={[4, 4]} className="mentor-history-summary-row" style={{ marginBottom: '16px' }}>
          <Col xs={12} sm={12} md={6}>
            <Card className="summary-card" style={{ borderRadius: '12px', textAlign: 'center', background: '#f0f5ff' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: '12px' }}>Total Submissions</Text>}
                value={sortedSubmissions.length} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="summary-card" style={{ borderRadius: '12px', textAlign: 'center', background: '#f6ffed' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: '12px' }}>Top Score</Text>}
                value={topScore} 
                suffix="/100"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="summary-card" style={{ borderRadius: '12px', textAlign: 'center', background: '#fff7e6' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: '12px' }}>Average Score</Text>}
                value={avgScore} 
                suffix="/100"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="summary-card" style={{ borderRadius: '12px', textAlign: 'center', background: '#f9f0ff' }}>
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: '12px' }}>My Teams</Text>}
                value={myTeamSubmissions.length} 
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Submissions Table */}
        <Card style={{ borderRadius: '12px' }} bodyStyle={{ padding: '12px' }}>
          <div className="mentor-history-table-wrapper">
            <Table
              dataSource={sortedSubmissions}
              columns={columns}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              size="small"
              rowClassName={(record) => record.isMentoredByMe ? 'my-team-row' : ''}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
                    <Title level={5} style={{ marginBottom: '8px', fontSize: '14px' }}>Project Description</Title>
                    <Paragraph style={{ marginBottom: 0, fontSize: '13px' }}>{record.projectDescription}</Paragraph>
                  </div>
                ),
              }}
            />
          </div>
        </Card>
      </div>
    );
  };

  // Evaluation/Feedback Tab
  const EvaluationTab = ({ evaluation }) => {
    if (!evaluation || evaluation.totalFeedbacks === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No feedback received for this hackathon"
        />
      );
    }

    return (
      <div>
        {/* Overall Rating Card */}
        <Card
          style={{
            borderRadius: '16px',
            marginBottom: '24px',
            overflow: 'hidden',
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <div className="mentor-history-rating-header" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '32px',
            margin: '-24px -24px 24px -24px',
            textAlign: 'center',
          }}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              {evaluation.averageRating}
            </Title>
            <Rate 
              disabled 
              allowHalf 
              value={parseFloat(evaluation.averageRating)} 
              style={{ color: '#ffd700', fontSize: '24px' }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.9)', display: 'block', marginTop: '8px' }}>
              Based on {evaluation.totalFeedbacks} feedback{evaluation.totalFeedbacks > 1 ? 's' : ''}
            </Text>
          </div>

          <Row gutter={[16, 16]} className="mentor-history-summary-row">
            <Col xs={24} sm={12}>
              <Card style={{ borderRadius: '10px', background: '#f6ffed', textAlign: 'center' }}>
                <Statistic
                  title="Total Feedbacks"
                  value={evaluation.totalFeedbacks}
                  prefix={<CommentOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card style={{ borderRadius: '10px', background: '#fff7e6', textAlign: 'center' }}>
                <Statistic
                  title="Average Rating"
                  value={evaluation.averageRating}
                  suffix="/ 5"
                  prefix={<StarOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Individual Feedbacks */}
        <Title level={5} style={{ marginBottom: '16px' }}>
          <CommentOutlined style={{ marginRight: '8px', color: '#667eea' }} />
          Student Feedbacks
        </Title>

        <List
          itemLayout="vertical"
          dataSource={evaluation.feedbacks}
          renderItem={(item, index) => (
            <Card
              key={index}
              style={{
                borderRadius: '12px',
                marginBottom: '16px',
                border: '1px solid #f0f0f0',
              }}
            >
              <Row align="middle" gutter={[8, 8]} wrap className="mentor-history-feedback-row">
                <Col xs={24} sm={4} md={3} style={{ textAlign: 'center' }}>
                  <Avatar
                    size={48}
                    icon={<UserOutlined />}
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={14}>
                  <Space direction="vertical" size={0}>
                    <Text strong style={{ wordBreak: 'break-word' }}>{item.studentName}</Text>
                    {item.studentRollNo && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>{item.studentRollNo}</Text>
                    )}
                  </Space>
                </Col>
                <Col xs={24} sm={8} md={7} style={{ textAlign: 'right' }}>
                  <Rate disabled value={item.rating} style={{ fontSize: '16px' }} />
                </Col>
              </Row>
              {item.feedback && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: '#f9f9f9', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #667eea'
                }}>
                  <Paragraph style={{ marginBottom: 0, fontStyle: 'italic' }}>
                    "{item.feedback}"
                  </Paragraph>
                </div>
              )}
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                {formatDate(item.date)}
              </Text>
            </Card>
          )}
        />
      </div>
    );
  };

  // Hackathon Overview Component
  const HackathonOverview = ({ hackathon, teamsCount }) => {
    if (!hackathon) return null;

    return (
      <Card
        style={{
          borderRadius: '16px',
          marginBottom: '24px',
          overflow: 'hidden',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div className="mentor-history-overview-header" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px 28px',
          margin: '-24px -24px 24px -24px',
          borderRadius: '10px 10px 0 0',
        }}>
          <Row align="middle" gutter={[16, 12]} wrap>
            <Col xs={24} sm={4} md={3} style={{ textAlign: 'center' }}>
              <Avatar
                size={64}
                icon={<TrophyOutlined />}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                }}
              />
            </Col>
            <Col xs={24} sm={20} md={21}>
              <Title level={3} style={{ color: 'white', margin: 0, fontSize: '20px', wordBreak: 'break-word' }}>
                {hackathon.name}
              </Title>
              <Space style={{ marginTop: '8px' }} wrap>
                <Tag color={getStatusColor(hackathon.status)} style={{ fontSize: '12px' }}>
                  {hackathon.status?.toUpperCase()}
                </Tag>
                {hackathon.year && (
                  <Tag style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px' }}>
                    {hackathon.year}
                  </Tag>
                )}
                <Tag color="blue" icon={<TeamOutlined />} style={{ fontSize: '12px' }}>
                  {teamsCount} Teams Mentored
                </Tag>
              </Space>
            </Col>
          </Row>
        </div>

        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="middle">
          <Descriptions.Item label={<><CalendarOutlined style={{ marginRight: '6px' }} />Start Date</>}>
            {formatDate(hackathon.startDate)}
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined style={{ marginRight: '6px' }} />End Date</>}>
            {formatDate(hackathon.endDate)}
          </Descriptions.Item>
          {hackathon.college && (
            <Descriptions.Item label={<><BookOutlined style={{ marginRight: '6px' }} />College</>}>
              {hackathon.college}
            </Descriptions.Item>
          )}
        </Descriptions>

        {hackathon.description && (
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {hackathon.description}
            </Text>
          </div>
        )}
      </Card>
    );
  };

  // Main Render
  return (
    <div className="student-hackathon-container">
      {/* Page Header */}
      <div className="student-hackathon-header">
        <div className="student-hackathon-header-content">
          <h2 className="student-hackathon-page-title">
            <SolutionOutlined style={{ marginRight: '10px', color: '#1a365d' }} />
            My Mentoring Journey
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
            View your hackathon mentoring history, teams, and achievements
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && <SummaryCards />}

      {/* Loading State */}
      <Spin spinning={loading} size="large">
        {hackathonList.length === 0 && !loading ? (
          <Card style={{
            borderRadius: '16px',
            textAlign: 'center',
            padding: '60px 24px',
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4} style={{ color: '#8c8c8c' }}>No Completed Hackathons Yet</Title>
                  <Text type="secondary">
                    Your hackathon mentoring history will appear here once you've completed hackathons as a mentor.
                  </Text>
                </div>
              }
            />
          </Card>
        ) : (
          <>
            {/* Hackathon Selector */}
            {/* <HackathonSelector /> */}

            {/* Selected Hackathon Content */}
            {selectedHackathonData && (
              <>
                {/* Hackathon Overview */}
                <HackathonOverview 
                  hackathon={selectedHackathonData.hackathon} 
                  teamsCount={selectedHackathonData.teamsCount}
                />

                {/* Tabs for different sections */}
                <Card
                  style={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  bodyStyle={{ padding: '0' }}
                >
                  <Tabs
                    defaultActiveKey="teams"
                    tabBarStyle={{
                      padding: '12px 16px 0 16px',
                      marginBottom: 0,
                      background: '#fafafa',
                      borderRadius: '16px 16px 0 0',
                    }}
                    size="small"
                    moreIcon={null}
                    items={[
                      {
                        key: 'teams',
                        label: (
                          <span className="tab-label">
                            <TeamOutlined className="tab-icon" />
                            <span className="tab-text">My Teams</span>
                          </span>
                        ),
                        children: (
                          <div className="mentor-history-tab-content">
                            <TeamsTab teams={selectedHackathonData.teams} />
                          </div>
                        ),
                      },
                      {
                        key: 'allProgress',
                        label: (
                          <span className="tab-label">
                            <BarChartOutlined className="tab-icon" />
                            <span className="tab-text">Progress</span>
                          </span>
                        ),
                        children: (
                          <div className="mentor-history-tab-content">
                            <AllTeamsProgressTab allTeamsProgress={selectedHackathonData.allTeamsProgress} />
                          </div>
                        ),
                      },
                      {
                        key: 'allSubmissions',
                        label: (
                          <span className="tab-label">
                            <FileSearchOutlined className="tab-icon" />
                            <span className="tab-text">Submissions</span>
                          </span>
                        ),
                        children: (
                          <div className="mentor-history-tab-content">
                            <AllSubmissionsTab allSubmissions={selectedHackathonData.allSubmissions} />
                          </div>
                        ),
                      },
                      {
                        key: 'schedule',
                        label: (
                          <span className="tab-label">
                            <ScheduleOutlined className="tab-icon" />
                            <span className="tab-text">Schedule</span>
                          </span>
                        ),
                        children: (
                          <div className="mentor-history-tab-content">
                            <ScheduleTab schedule={selectedHackathonData.schedule} />
                          </div>
                        ),
                      },
                      {
                        key: 'problems',
                        label: (
                          <span className="tab-label">
                            <BulbOutlined className="tab-icon" />
                            <span className="tab-text">Problems</span>
                          </span>
                        ),
                        children: (
                          <div className="mentor-history-tab-content">
                            <ProblemStatementsTab problemStatements={selectedHackathonData.problemStatements} />
                          </div>
                        ),
                      },
                      {
                        key: 'evaluation',
                        label: (
                          <span className="tab-label">
                            <CommentOutlined className="tab-icon" />
                            <span className="tab-text">Feedback</span>
                          </span>
                        ),
                        children: (
                          <div className="mentor-history-tab-content">
                            <EvaluationTab evaluation={selectedHackathonData.evaluation} />
                          </div>
                        ),
                      },
                    ]}
                  />
                </Card>
              </>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

export default MentorHackathonHistory;