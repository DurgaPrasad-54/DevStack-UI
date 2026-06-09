import { useState, useEffect } from 'react';
import {
  Spin,
  Empty,
  Typography,
  Progress,
  Row,
  Col,
  Avatar,
  Button,
  Select,
  Tabs,
  Divider,
  message,
} from 'antd';
import {
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined,
  CodeOutlined,
  GithubOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  UserOutlined,
  BulbOutlined,
  RocketOutlined,
  HistoryOutlined,
  ProjectOutlined,
  DownOutlined,
  ClockCircleOutlined,
  MailOutlined,
  IdcardOutlined,
  BookOutlined,
  StarOutlined,
  ScheduleOutlined,
  LinkOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import config from '../../config';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/* ── Professional clean CSS ── */
const pageStyles = `
  /* ── Stat Cards ── */
  .hh-stat {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e6e9ef;
    padding: 22px 20px;
    transition: all 0.25s ease;
    cursor: default;
  }
  .hh-stat:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    border-color: #d0d7e2;
  }
  .hh-stat.c-blue   { border-left: 4px solid #3b82f6; }
  .hh-stat.c-green  { border-left: 4px solid #22c55e; }
  .hh-stat.c-amber  { border-left: 4px solid #f59e0b; }
  .hh-stat.c-rose   { border-left: 4px solid #ef4444; }

  /* ── Generic card ── */
  .hh-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e6e9ef;
    transition: all 0.25s ease;
  }
  .hh-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }
  .hh-card-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.09);
    border-color: #c7d2e0;
  }

  /* ── Member card ── */
  .hh-member {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e6e9ef;
    padding: 20px;
    transition: all 0.25s ease;
  }
  .hh-member:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    border-color: #5b8fb9;
  }
  .hh-member.is-lead {
    border: 2px solid #eab308;
    background: #fefce8;
  }
  .hh-member.is-lead:hover {
    border-color: #ca8a04;
  }

  /* ── Tabs ── */
  .hh-tabs .ant-tabs-nav { margin-bottom: 0 !important; }
  .hh-tabs .ant-tabs-tab {
    font-size: 14px !important;
    font-weight: 500 !important;
    padding: 14px 20px !important;
    color: #6b7280 !important;
    transition: color 0.2s !important;
  }
  .hh-tabs .ant-tabs-tab:hover { color: #374151 !important; }
  .hh-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #1e40af !important; font-weight: 600 !important; }
  .hh-tabs .ant-tabs-ink-bar { background: #3b82f6 !important; height: 3px !important; border-radius: 3px !important; }

  /* ── Select ── */
  .hh-select .ant-select-selector {
    border-radius: 10px !important;
    border: 1px solid #d1d5db !important;
    height: 44px !important;
    transition: all 0.2s !important;
  }
  .hh-select .ant-select-selector:hover { border-color: #3b82f6 !important; }
  .hh-select.ant-select-focused .ant-select-selector {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
  }
  .hh-select .ant-select-selection-item { line-height: 42px !important; }

  /* ── Info row ── */
  .hh-info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #f0f1f3;
    transition: all 0.2s;
  }
  .hh-info-row:hover { background: #f1f5f9; border-color: #e2e8f0; }

  /* ── Session item ── */
  .hh-session {
    padding: 14px 18px;
    border-radius: 10px;
    border: 1px solid #e6e9ef;
    background: #fff;
    transition: all 0.2s;
  }
  .hh-session:hover {
    background: #f0f7ff;
    border-color: #93c5fd;
    transform: translateX(4px);
  }

  /* ── Button variants ── */
  .hh-btn-primary {
    background: #1e40af !important;
    border: none !important;
    border-radius: 10px !important;
    height: 44px !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    padding: 0 24px !important;
    transition: all 0.2s !important;
    box-shadow: 0 2px 8px rgba(30,64,175,0.25) !important;
  }
  .hh-btn-primary:hover {
    background: #1e3a8a !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 14px rgba(30,64,175,0.35) !important;
  }

  .hh-btn-outline {
    background: #fff !important;
    border: 1.5px solid #d1d5db !important;
    border-radius: 10px !important;
    height: 40px !important;
    font-weight: 500 !important;
    color: #374151 !important;
    transition: all 0.2s !important;
  }
  .hh-btn-outline:hover {
    border-color: #3b82f6 !important;
    color: #1e40af !important;
    background: #eff6ff !important;
  }

  /* ── Content block ── */
  .hh-content-block {
    background: #f8fafc;
    border: 1px solid #e6e9ef;
    border-radius: 10px;
    padding: 20px;
    border-left: 3px solid #3b82f6;
  }

  /* ── Day header ── */
  .hh-day-header {
    background: #f8fafc;
    border-bottom: 1px solid #e6e9ef;
    padding: 14px 20px;
    border-radius: 12px 12px 0 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* ── Responsive ── */
  @media (max-width: 576px) {
    .hh-stat {
      padding: 14px 12px;
      border-radius: 10px;
    }
    .hh-stat .hh-stat-icon {
      width: 34px !important;
      height: 34px !important;
      min-width: 34px !important;
      font-size: 15px !important;
      border-radius: 8px !important;
    }
    .hh-stat .hh-stat-value {
      font-size: 20px !important;
    }
    .hh-stat .hh-stat-label {
      font-size: 9px !important;
      letter-spacing: 0.3px !important;
    }
    .hh-card {
      border-radius: 10px;
    }
    .hh-tabs .ant-tabs-tab {
      padding: 10px 10px !important;
      font-size: 12px !important;
    }
    .hh-tabs .ant-tabs-nav {
      overflow-x: auto !important;
    }
    .hh-select .ant-select-selector {
      height: 40px !important;
    }
    .hh-select .ant-select-selection-item {
      line-height: 38px !important;
    }
    .hh-member {
      padding: 14px;
    }
    .hh-info-row {
      padding: 8px 12px;
    }
    .hh-session {
      padding: 10px 14px;
    }
    .hh-content-block {
      padding: 14px;
    }
    .hh-day-header {
      padding: 10px 14px;
    }
    .hh-btn-primary {
      height: 38px !important;
      padding: 0 16px !important;
      font-size: 13px !important;
    }
    .hh-btn-outline {
      height: 36px !important;
    }
  }
`;

const HackathonHistory = () => {
  const [loading, setLoading] = useState(true);
  const [hackathonList, setHackathonList] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState(null);
  const [selectedHackathonData, setSelectedHackathonData] = useState(null);
  const [summary, setSummary] = useState(null);

  const studentId = localStorage.getItem('student');

  useEffect(() => {
    if (studentId) {
      fetchHackathonHistory();
      fetchSummary();
    }
  }, [studentId]);

  useEffect(() => {
    if (hackathonList.length > 0 && !selectedHackathonId) {
      setSelectedHackathonId(hackathonList[0].hackathon._id);
    }
  }, [hackathonList]);

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
        `${config.backendUrl}/hackathon-history/student/${studentId}/completed`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
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
        `${config.backendUrl}/hackathon-history/student/${studentId}/summary`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
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
      year: 'numeric',
    });
  };

  const getStatusTag = (status) => {
    const s = status?.toLowerCase();
    const map = {
      completed: { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', label: 'Completed' },
      ongoing: { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe', label: 'Ongoing' },
      upcoming: { color: '#d97706', bg: '#fef3c7', border: '#fde68a', label: 'Upcoming' },
    };
    const cfg = map[s] || { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', label: status || 'Unknown' };
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 12px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          color: cfg.color,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          lineHeight: '20px',
        }}
      >
        {cfg.label}
      </span>
    );
  };

  const handleHackathonChange = (hackathonId) => {
    setSelectedHackathonId(hackathonId);
  };

  /* ───── Summary Statistics ───── */
  const SummaryCards = () => {
    const stats = [
      { label: 'REGISTERED HACKATHONS', value: summary?.totalParticipated || 0, icon: <TrophyOutlined />, cls: 'c-blue', iconBg: '#dbeafe', iconColor: '#3b82f6' },
      { label: 'PROJECTS SUBMITTED', value: summary?.projectsSubmitted || 0, icon: <ProjectOutlined />, cls: 'c-green', iconBg: '#dcfce7', iconColor: '#22c55e' },
      { label: 'HACKATHONS COMPLETED', value: summary?.completedHackathons || 0, icon: <CheckCircleOutlined />, cls: 'c-amber', iconBg: '#fef3c7', iconColor: '#f59e0b' },
      { label: 'ONGOING HACKATHONS', value: summary?.ongoingHackathons || 0, icon: <RocketOutlined />, cls: 'c-rose', iconBg: '#fee2e2', iconColor: '#ef4444' },
    ];

    return (
      <Row gutter={[10, 10]} style={{ marginBottom: 20 }}>
        {stats.map((s, i) => (
          <Col xs={12} sm={12} md={6} key={i}>
            <div className={`hh-stat ${s.cls}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="hh-stat-icon"
                  style={{
                    width: 38, height: 38, minWidth: 38, borderRadius: 10,
                    background: s.iconBg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: s.iconColor, flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="hh-stat-value" style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{s.value}</div>
                  <div className="hh-stat-label" style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', letterSpacing: 0.4, marginTop: 2, textTransform: 'uppercase', lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    );
  };

  /* ───── Hackathon Selector ───── */
  const HackathonSelector = () => (
    <div className="hh-card" style={{ padding: '14px 16px', marginBottom: 16 }}>
      <Row align="middle" gutter={[12, 10]}>
        <Col xs={24} sm={10}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: '#dbeafe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#3b82f6', fontSize: 16,
            }}>
              <HistoryOutlined />
            </div>
            <div>
              <Text strong style={{ fontSize: 15, color: '#111827', display: 'block', lineHeight: 1.3 }}>
                Select Hackathon
              </Text>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                Choose a hackathon to view details
              </Text>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={14}>
          <Select
            className="hh-select"
            value={selectedHackathonId}
            onChange={handleHackathonChange}
            style={{ width: '100%' }}
            size="large"
            placeholder="Select a hackathon"
            suffixIcon={<DownOutlined style={{ color: '#9ca3af' }} />}
          >
            {hackathonList.map((item) => (
              <Option key={item.hackathon._id} value={item.hackathon._id}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrophyOutlined style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 500 }}>{item.hackathon.name}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                    padding: '2px 8px', borderRadius: 4,
                    background: item.hackathon.status?.toLowerCase() === 'completed' ? '#dcfce7' : '#dbeafe',
                    color: item.hackathon.status?.toLowerCase() === 'completed' ? '#16a34a' : '#2563eb',
                  }}>
                    {item.hackathon.status}
                  </span>
                </span>
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
    </div>
  );

  /* ───── Hackathon Overview ───── */
  const HackathonOverview = ({ hackathon }) => {
    if (!hackathon) return null;

    return (
      <div className="hh-card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        {/* Top accent stripe */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }} />

        <div style={{ padding: '18px 16px' }}>
          {/* Name + Status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12, background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: '#3b82f6', flexShrink: 0, border: '1px solid #dbeafe',
            }}>
              <TrophyOutlined />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
                {hackathon.name}
              </Title>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {getStatusTag(hackathon.status)}
                {hackathon.year && (
                  <span style={{
                    padding: '3px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb',
                  }}>
                    {hackathon.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Divider style={{ margin: '0 0 14px 0', borderColor: '#f0f1f3' }} />

          {/* Info Grid */}
          <Row gutter={[8, 8]}>
            <Col xs={12} sm={8}>
              <div className="hh-info-row">
                <CalendarOutlined style={{ color: '#3b82f6', fontSize: 14 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Start Date</div>
                  <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{formatDate(hackathon.startDate)}</div>
                </div>
              </div>
            </Col>
            <Col xs={12} sm={8}>
              <div className="hh-info-row">
                <CalendarOutlined style={{ color: '#ef4444', fontSize: 14 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>End Date</div>
                  <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{formatDate(hackathon.endDate)}</div>
                </div>
              </div>
            </Col>
            {hackathon.college && (
              <Col xs={24} sm={8}>
                <div className="hh-info-row">
                  <EnvironmentOutlined style={{ color: '#8b5cf6', fontSize: 14 }} />
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>College</div>
                    <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{hackathon.college}</div>
                  </div>
                </div>
              </Col>
            )}
          </Row>

          {hackathon.description && (
            <div style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, lineHeight: '1.7', color: '#6b7280' }}>
                {hackathon.description}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ───── Team Details Tab ───── */
  const TeamDetailsTab = ({ team }) => {
    if (!team) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No team information available" />;
    }

    return (
      <div>
        {/* Team Header */}
        <div
          className="hh-card"
          style={{ padding: '14px 16px', marginBottom: 16, borderLeft: '4px solid #3b82f6' }}
        >
          <Row align="middle" gutter={[12, 10]} wrap>
            <Col>
              <Avatar
                size={40}
                icon={<TeamOutlined />}
                style={{ background: '#3b82f6', fontSize: 18 }}
              />
            </Col>
            <Col flex="auto">
              <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 600 }}>
                {team.name || 'Unnamed Team'}
              </Title>
              <Text style={{ fontSize: 13, color: '#9ca3af' }}>
                {team.members?.length || 0} Members
              </Text>
            </Col>
            {team.mentor && (
              <Col xs={24} sm="auto">
                <div style={{
                  background: '#f0fdf4', padding: '10px 16px', borderRadius: 10,
                  border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Avatar size={32} icon={<UserOutlined />} style={{ background: '#22c55e', fontSize: 14 }} />
                  <div>
                    <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Mentor</div>
                    <div style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{team.mentor.name}</div>
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </div>

        {/* Members */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: 15, color: '#374151' }}>Team Members</Text>
        </div>
        <Row gutter={[10, 10]}>
          {team.members?.map((member, index) => (
            <Col xs={24} sm={12} lg={8} key={member._id || index}>
              <div className={`hh-member ${member.isTeamLead ? 'is-lead' : ''}`} style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Avatar
                    size={36}
                    icon={<UserOutlined />}
                    style={{ background: member.isTeamLead ? '#eab308' : '#3b82f6', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <Text strong style={{ fontSize: 13, color: '#111827', wordBreak: 'break-word' }}>{member.name}</Text>
                      {member.isTeamLead && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: '#a16207', background: '#fef9c3',
                          padding: '1px 8px', borderRadius: 4, border: '1px solid #fde68a',
                        }}>
                          <StarOutlined style={{ marginRight: 3, fontSize: 10 }} />Lead
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Text style={{ fontSize: 11, color: '#6b7280' }}>
                        <IdcardOutlined style={{ marginRight: 4, fontSize: 10 }} />{member.rollNo || 'N/A'}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#6b7280' }}>
                        <BookOutlined style={{ marginRight: 4, fontSize: 10 }} />{member.branch || 'N/A'}
                      </Text>
                      {member.email && (
                        <Text style={{ fontSize: 11, color: '#6b7280', wordBreak: 'break-all' }}>
                          <MailOutlined style={{ marginRight: 4, fontSize: 10 }} />{member.email}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  /* ───── Problem Statement Tab ───── */
  const ProblemStatementTab = ({ problemStatement }) => {
    if (!problemStatement) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No problem statement assigned" />;
    }

    return (
      <div>
        {/* Title card */}
        <div className="hh-card" style={{ padding: '16px', marginBottom: 14, borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 40, height: 40, minWidth: 40, borderRadius: 10, background: '#f5f3ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: '#8b5cf6', flexShrink: 0, border: '1px solid #e9d5ff',
            }}>
              <BulbOutlined />
            </div>
            <div>
              {problemStatement.domain && (
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#7c3aed',
                  background: '#f5f3ff', padding: '2px 10px', borderRadius: 4,
                  border: '1px solid #e9d5ff', marginBottom: 6,
                }}>
                  {problemStatement.domain}
                </span>
              )}
              <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 600 }}>
                {problemStatement.title}
              </Title>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: 15, color: '#374151' }}>Description</Text>
        </div>
        <div className="hh-content-block">
          <Paragraph style={{ fontSize: 14, lineHeight: '1.8', color: '#4b5563', margin: 0 }}>
            {problemStatement.description}
          </Paragraph>
        </div>
      </div>
    );
  };

  /* ───── Schedule Tab ───── */
  const ScheduleTab = ({ schedule }) => {
    const [selectedDay, setSelectedDay] = useState(0);

    if (!schedule || schedule.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No schedule available" />;
    }

    const convertTimeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(' - ')[0];
      const [time, period] = parts.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let totalMinutes = hours * 60 + (minutes || 0);
      if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
      if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
      return totalMinutes;
    };

    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Day selector buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {schedule.map((dayItem, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: `2px solid #667eea`,
                background: selectedDay === index
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'white',
                color: selectedDay === index ? 'white' : '#667eea',
                cursor: 'pointer',
                borderRadius: 6,
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {dayItem.day}
            </button>
          ))}
        </div>

        {/* Single schedule box showing selected day */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '2px solid #e9ecef',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #6c9bd1 0%, #5a8bc4 100%)',
            color: 'white',
            padding: '15px 20px',
            fontSize: 20,
            fontWeight: 600,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {schedule[selectedDay].day}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f1f3f4' }}>
                  <th style={{
                    padding: '12px 15px', textAlign: 'left', fontWeight: 600,
                    fontSize: 14, color: '#495057', borderBottom: '2px solid #dee2e6',
                    textTransform: 'uppercase', letterSpacing: 0.5, width: '30%', minWidth: 120,
                  }}>Time</th>
                  <th style={{
                    padding: '12px 15px', textAlign: 'left', fontWeight: 600,
                    fontSize: 14, color: '#495057', borderBottom: '2px solid #dee2e6',
                    textTransform: 'uppercase', letterSpacing: 0.5, width: '70%',
                  }}>Session</th>
                </tr>
              </thead>
              <tbody>
                {schedule[selectedDay].sessions?.length > 0 ? (
                  [...schedule[selectedDay].sessions]
                    .sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time))
                    .map((session, sessionIndex) => (
                      <tr key={sessionIndex} style={{
                        background: sessionIndex % 2 === 0 ? 'white' : '#f8f9fa',
                        transition: 'background-color 0.2s ease',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                        onMouseLeave={(e) => e.currentTarget.style.background = sessionIndex % 2 === 0 ? 'white' : '#f8f9fa'}
                      >
                        <td style={{
                          padding: '12px 15px', textAlign: 'left', fontWeight: 600,
                          color: '#495057', border: '1px solid #dee2e6',
                          whiteSpace: 'nowrap', background: '#f8f9fa',
                        }}>{session.time}</td>
                        <td style={{
                          padding: '12px 15px', textAlign: 'left',
                          border: '1px solid #dee2e6', color: '#212529',
                          fontWeight: 500, borderLeft: '4px solid #007bff',
                        }}>{session.session}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="2" style={{
                      padding: 20, textAlign: 'center',
                      color: '#6c757d', fontStyle: 'italic',
                    }}>No sessions scheduled</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ───── Progress Tab ───── */
  const ProgressTab = ({ progress }) => {
    if (!progress) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No progress data available" />;
    }

    return (
      <div>
        {/* Progress ring */}
        <div className="hh-card" style={{ padding: '20px 16px', textAlign: 'center', marginBottom: 14 }}>
          <Progress
            type="dashboard"
            percent={progress.percentage || 0}
            size={130}
            strokeWidth={10}
            strokeColor={{
              '0%': '#3b82f6',
              '100%': '#8b5cf6',
            }}
            format={(percent) => (
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{percent}%</div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Complete</div>
              </div>
            )}
          />
          <div style={{ marginTop: 16 }}>
            {getStatusTag(progress.status)}
          </div>
        </div>

        {/* Update */}
        {progress.description && (
          <div className="hh-card" style={{ padding: '16px', borderLeft: '4px solid #22c55e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <RocketOutlined style={{ color: '#22c55e', fontSize: 16 }} />
              <Text strong style={{ fontSize: 15, color: '#374151' }}>Latest Update</Text>
            </div>
            <Paragraph style={{ fontSize: 14, lineHeight: '1.7', color: '#4b5563', marginBottom: 8 }}>
              {progress.description}
            </Paragraph>
            {progress.lastUpdated && (
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                <ClockCircleOutlined style={{ marginRight: 5 }} />
                Updated: {formatDate(progress.lastUpdated)}
              </Text>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ───── Submission Tab ───── */
  const SubmissionTab = ({ submission }) => {
    if (!submission) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No project submission found" />;
    }

    return (
      <div>
        {/* Project title card */}
        <div className="hh-card" style={{ padding: '16px', marginBottom: 14, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 40, height: 40, minWidth: 40, borderRadius: 10, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#3b82f6', flexShrink: 0, border: '1px solid #bfdbfe',
              }}>
                <CodeOutlined />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Title level={5} style={{ margin: 0, color: '#111827', fontWeight: 600, wordBreak: 'break-word' }}>
                  {submission.projectTitle || 'Untitled Project'}
                </Title>
                {submission.submittedAt && (
                  <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, display: 'block' }}>
                    <CalendarOutlined style={{ marginRight: 5 }} />
                    Submitted on {formatDate(submission.submittedAt)}
                  </Text>
                )}
              </div>
            </div>
            {getStatusTag(submission.status || 'Submitted')}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: 15, color: '#374151' }}>Project Description</Text>
        </div>
        <div className="hh-content-block" style={{ marginBottom: 20 }}>
          <Paragraph style={{ fontSize: 14, lineHeight: '1.8', color: '#4b5563', margin: 0 }}>
            {submission.projectDescription || 'No description provided'}
          </Paragraph>
        </div>

        {/* Tech Stack */}
        {submission.techStack && submission.techStack.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CodeOutlined style={{ color: '#8b5cf6' }} />
              <Text strong style={{ fontSize: 15, color: '#374151' }}>Tech Stack</Text>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {submission.techStack.map((tech, index) => (
                <span
                  key={index}
                  style={{
                    padding: '5px 14px', fontSize: 13, borderRadius: 8, fontWeight: 500,
                    background: '#f5f3ff', border: '1px solid #e9d5ff', color: '#7c3aed',
                    transition: 'all 0.2s',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {submission.githubRepo && (
            <Button
              className="hh-btn-primary"
              type="primary"
              icon={<GithubOutlined />}
              href={submission.githubRepo}
              target="_blank"
            >
              View on GitHub
            </Button>
          )}
          {submission.deployedLink && (
            <Button
              className="hh-btn-outline"
              icon={<LinkOutlined />}
              href={submission.deployedLink}
              target="_blank"
            >
              Live Demo
            </Button>
          )}
        </div>
      </div>
    );
  };

  /* ───── Main Render ───── */
  return (
    <div style={{
      padding: '16px',
      paddingTop: 90,
      maxWidth: 1400,
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f8fafc',
    }}>
      <style>{pageStyles}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#111827', fontWeight: 700 }}>
          <HistoryOutlined style={{ marginRight: 8, color: '#3b82f6' }} />
          My Hackathon Journey
        </Title>
        <Text style={{ fontSize: 13, color: '#9ca3af' }}>
          Explore your hackathon participations, team details, and achievements
        </Text>
      </div>

      {/* Summary Statistics */}
      {summary && <SummaryCards />}

      {/* Loading State */}
      <Spin spinning={loading} size="large">
        {hackathonList.length === 0 && !loading ? (
          <div className="hh-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4} style={{ color: '#9ca3af' }}>No Completed Hackathons Yet</Title>
                  <Text style={{ color: '#9ca3af' }}>
                    Your hackathon history will appear here once you've participated in and completed hackathons.
                  </Text>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <HackathonSelector />

            {selectedHackathonData && (
              <>
                <HackathonOverview hackathon={selectedHackathonData.hackathon} />

                {/* Tabs */}
                <div className="hh-card hh-tabs" style={{ overflow: 'hidden' }}>
                  <Tabs
                    defaultActiveKey="team"
                    tabBarStyle={{
                      padding: '0 12px',
                      background: '#fff',
                      borderBottom: '1px solid #e6e9ef',
                    }}
                    size="middle"
                    items={[
                      {
                        key: 'team',
                        label: <span><TeamOutlined style={{ marginRight: 6 }} />Team</span>,
                        children: <div style={{ padding: '16px 14px' }}><TeamDetailsTab team={selectedHackathonData.team} /></div>,
                      },
                      {
                        key: 'problem',
                        label: <span><BulbOutlined style={{ marginRight: 4 }} />Problem</span>,
                        children: <div style={{ padding: '16px 14px' }}><ProblemStatementTab problemStatement={selectedHackathonData.problemStatement} /></div>,
                      },
                      {
                        key: 'schedule',
                        label: <span><ScheduleOutlined style={{ marginRight: 4 }} />Schedule</span>,
                        children: <div style={{ padding: '16px 14px' }}><ScheduleTab schedule={selectedHackathonData.schedule} /></div>,
                      },
                      {
                        key: 'progress',
                        label: <span><RocketOutlined style={{ marginRight: 4 }} />Progress</span>,
                        children: <div style={{ padding: '16px 14px' }}><ProgressTab progress={selectedHackathonData.teamProgress} /></div>,
                      },
                      {
                        key: 'submission',
                        label: <span><CodeOutlined style={{ marginRight: 4 }} />Submission</span>,
                        children: <div style={{ padding: '16px 14px' }}><SubmissionTab submission={selectedHackathonData.submission} /></div>,
                      },
                    ]}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

export default HackathonHistory;
