import { useEffect, useState } from "react";
import config from '../../../config';
import {
  Card,
  Table,
  Spin,
  Typography,
  Row,
  Col,
  Select,
  Input,
  Button,
  Tag,
  Progress,
  Statistic,
  Space,
  Tabs,
  Badge,
  Tooltip,
  Empty,
  Divider,
} from "antd";
import {
  TrophyOutlined,
  TeamOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  CrownOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from "@ant-design/icons";
import './TeamsProgress.css';

const { Title, Text } = Typography;
const { Option } = Select;

const AllTeamsProgressPage = () => {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  // Filters
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [selectedBranch, setBranch] = useState(null);
  const [selectedCollege, setCollege] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("progress");
  const [sortOrder, setSortOrder] = useState("desc");

  const API_URL = config.backendUrl;
  const token = localStorage.getItem("token");

  const branches = [
    'Artificial Intelligence (AI)',
    'Artificial Intelligence and Machine Learning (CSM)',
    'Artificial Intelligence and Data Science (AID)',
    'Cyber Security (CSC)',
    'Data Science (CSD)'
  ];

  const colleges = ['KIET', 'KIET+', 'KIEW'];

  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    if (selectedHackathon) {
      if (activeTab === "all") {
        fetchAllTeams();
      } else if (activeTab === "leaderboard") {
        fetchLeaderboard();
      } else if (activeTab === "statistics") {
        fetchStatistics();
      }
    }
  }, [
    selectedHackathon,
    selectedBranch,
    selectedCollege,
    sortBy,
    sortOrder,
    activeTab
  ]);

  const fetchHackathons = async () => {
    try {
      console.log('[FRONTEND] Fetching hackathons from:', `${API_URL}/hackteams/hackathons/all`);
      const res = await fetch(`${API_URL}/hackteams/hackathons/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[FRONTEND] Hackathons response:', data);
        setHackathons(data);
        
        if (data.length > 0) {
          // Try to select an ongoing hackathon first, otherwise select the first one
          const ongoingHackathon = data.find(h => h.status === 'ongoing');
          if (ongoingHackathon) {
            setSelectedHackathon(ongoingHackathon._id);
          } else {
            setSelectedHackathon(data[0]._id);
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[FRONTEND] Failed to fetch hackathons:', errorData);
      }
    } catch (error) {
      console.error("[FRONTEND] Error fetching hackathons:", error);
      setHackathons([]);
    }
  };

  const fetchAllTeams = async () => {
    if (!selectedHackathon) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        hackathonId: selectedHackathon,
        sortBy,
        sortOrder,
      });

      if (selectedBranch) params.append('branch', selectedBranch);
      if (selectedCollege) params.append('college', selectedCollege);

      console.log('[FRONTEND] Fetching teams with params:', params.toString());

      const res = await fetch(`${API_URL}/teamprogress/teams/progress/all?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[FRONTEND] Error response:', errorData);
        throw new Error(errorData.message || "Failed to fetch teams");
      }

      const data = await res.json();
      console.log("[FRONTEND] Teams data:", data);
      // backend returns { success, stats, teams }
      setTeams(data.teams || data.progresses || []);
      setStatistics(data.stats || data.statistics || null);
    } catch (error) {
      console.error("[FRONTEND] Error fetching teams:", error);
      setTeams([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!selectedHackathon) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        hackathonId: selectedHackathon,
        limit: 20,
      });

      if (selectedBranch) params.append('branch', selectedBranch);
      if (selectedCollege) params.append('college', selectedCollege);

      console.log('[FRONTEND] Fetching leaderboard with params:', params.toString());

      const res = await fetch(`${API_URL}/teamprogress/teams/progress/leaderboard?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[FRONTEND] Error response:', errorData);
        throw new Error(errorData.message || "Failed to fetch leaderboard");
      }

      const data = await res.json();
      console.log("[FRONTEND] Leaderboard data:", data);
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("[FRONTEND] Error fetching leaderboard:", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!selectedHackathon) return;

    try {
      setLoading(true);

      console.log('[FRONTEND] Fetching statistics for hackathon:', selectedHackathon);

      const res = await fetch(`${API_URL}/teamprogress/teams/progress/statistics?hackathonId=${selectedHackathon}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[FRONTEND] Error response:', errorData);
        throw new Error(errorData.message || "Failed to fetch statistics");
      }

      const data = await res.json();
      console.log("[FRONTEND] Statistics data:", data);
      // backend returns { success, totalTeams, teamsWithProgress, byBranch, byCollege, byYear }
      setStatistics({
        totalTeams: data.totalTeams || 0,
        teamsWithProgress: data.teamsWithProgress || 0,
        completedTeams: data.completedTeams || 0,
        averageProgress: data.averageProgress || 0,
        byBranch: data.byBranch || [],
        byCollege: data.byCollege || [],
        byYear: data.byYear || []
      });
    } catch (error) {
      console.error("[FRONTEND] Error fetching statistics:", error);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setBranch(null);
    setCollege(null);
    setSearchText("");
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

  const getProgressColor = (percentage) => {
    if (percentage === 0) return "#d9d9d9";
    if (percentage < 30) return "#ff4d4f";
    if (percentage < 70) return "#faad14";
    if (percentage < 100) return "#1890ff";
    return "#52c41a";
  };

  const getRankMedal = (rank) => {
    switch (rank) {
      case 1:
        return <CrownOutlined className="medal-gold" />;
      case 2:
        return <CrownOutlined className="medal-silver" />;
      case 3:
        return <CrownOutlined className="medal-bronze" />;
      default:
        return <Text strong className="rank-text-large">#{rank}</Text>;
    }
  };

  const columns = [
    {
      title: "Rank",
      key: "rank",
      width: 80,
      render: (_, __, index) => (
        <Text strong className="rank-text">#{index + 1}</Text>
      ),
    },
    {
      title: "Team Name",
      dataIndex: "name",
      key: "name",
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong className="team-name-text">
            <TeamOutlined className="icon-margin-right" />
            {name}
          </Text>
          <Text type="secondary" className="team-lead-text">
            {record.studentCount} member{record.studentCount !== 1 ? 's' : ''}
          </Text>
        </Space>
      ),
    },
    {
      title: "Team Lead",
      key: "teamLead",
      render: (record) => (
        record.teamLead ? (
          <Space direction="vertical" size={0}>
            <Text>{record.teamLead.name}</Text>
            <Text type="secondary" className="team-lead-text">
              {record.teamLead.branch}
            </Text>
            <Text type="secondary" className="team-lead-text">
              {record.teamLead.college}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">No lead assigned</Text>
        )
      ),
    },
    {
      title: "Progress",
      key: "progress",
      sorter: (a, b) => a.progress.percentage - b.progress.percentage,
      render: (record) => (
        <Space direction="vertical" size="small" className="full-width">
          <Progress
            percent={record.progress.percentage}
            strokeColor={getProgressColor(record.progress.percentage)}
            size="small"
          />
          <Tag color={getStatusColor(record.progress.status)}>
            {record.progress.status}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Mentor",
      key: "mentor",
      render: (record) => (
        record.mentor ? (
          <Text>{record.mentor.name}</Text>
        ) : (
          <Text type="secondary">No mentor</Text>
        )
      ),
    },
    {
      title: "Last Updated",
      key: "lastUpdated",
      render: (record) => (
        record.progress.updatedAt ? (
          <Tooltip title={new Date(record.progress.updatedAt).toLocaleString()}>
            <Text type="secondary" className="team-lead-text">
              {new Date(record.progress.updatedAt).toLocaleDateString()}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">Never</Text>
        )
      ),
    },
  ];

  const leaderboardColumns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      width: 100,
      render: (rank) => (
        <div className="rank-center">
          {getRankMedal(rank)}
        </div>
      ),
    },
    {
      title: "Team",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong className="team-name-text">
            {record.rank <= 3 && <FireOutlined className="fire-icon" />}
            {name}
          </Text>
          {record.teamLead && (
            <Text type="secondary" className="team-lead-text">
              Lead: {record.teamLead.name}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Progress",
      key: "progress",
      width: 300,
      render: (record) => (
        <Space direction="vertical" size="small" className="full-width">
          <div className="progress-flex">
            <Progress
              percent={record.progress.percentage}
              strokeColor={getProgressColor(record.progress.percentage)}
              size="small"
              className="progress-flex-1"
            />
            <Text strong className="progress-percentage">
              {record.progress.percentage}%
            </Text>
          </div>
          <Tag color={getStatusColor(record.progress.status)}>
            {record.progress.status}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Members",
      dataIndex: "studentCount",
      key: "studentCount",
      width: 100,
      render: (count) => (
        <Badge count={count} showZero color="#1890ff" />
      ),
    },
  ];

  const renderFilters = () => (
    <Card className="margin-bottom-24">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Text strong className="filter-label">
            Hackathon
          </Text>
          <Select
            showSearch
            className="full-width"
            placeholder="Search or select hackathon"
            value={selectedHackathon}
            onChange={setSelectedHackathon}
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            optionFilterProp="children"
            defaultActiveFirstOption
          >
            {hackathons.map((h) => (
              <Option key={h._id} value={h._id}>
                {h.hackathonname}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Text strong className="filter-label">
            Branch
          </Text>
          <Select
            className="full-width"
            placeholder="All Branches"
            value={selectedBranch}
            onChange={setBranch}
            allowClear
          >
            {branches.map((b) => (
              <Option key={b} value={b}>
                {b}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Text strong className="filter-label">
            College
          </Text>
          <Select
            className="full-width"
            placeholder="All Colleges"
            value={selectedCollege}
            onChange={setCollege}
            allowClear
          >
            {colleges.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
        </Col>

        {/* {activeTab === "all" && (
          <>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Sort Order
              </Text>
              <Select
                style={{ width: '100%' }}
                value={sortOrder}
                onChange={setSortOrder}
              >
                <Option value="asc">Ascending</Option>
                <Option value="desc">Descending</Option>
              </Select>
              
            </Col>
          </>
        )} */}

        <Col xs={24}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                if (activeTab === "all") fetchAllTeams();
                else if (activeTab === "leaderboard") fetchLeaderboard();
                else if (activeTab === "statistics") fetchStatistics();
              }}
            >
              Refresh
            </Button>
            <Button
              icon={<FilterOutlined />}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const renderStatistics = () => {
    if (!statistics) return <Empty description="No statistics available" />;

    return (
      <div>
        <Row gutter={[16, 16]} className="margin-bottom-24">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Teams"
                value={statistics.totalTeams || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Teams with Progress"
                value={statistics.teamsWithProgress || 0}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Completed Teams"
                value={statistics.completedTeams || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average Progress"
                value={parseFloat(statistics.averageProgress || 0)}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {statistics.byBranch && statistics.byBranch.length > 0 && (
          <Card title="Statistics by Branch" className="margin-bottom-16">
            <Table
              dataSource={statistics.byBranch}
              columns={[
                {
                  title: 'Branch',
                  dataIndex: 'category',
                  key: 'category',
                },
                {
                  title: 'Teams',
                  dataIndex: 'teamCount',
                  key: 'teamCount',
                },
                {
                  title: 'Average Progress',
                  dataIndex: 'averageProgress',
                  key: 'averageProgress',
                  render: (val) => `${parseFloat(val || 0).toFixed(2)}%`,
                },
              ]}
              pagination={false}
              size="small"
              rowKey="category"
            />
          </Card>
        )}

        {statistics.byCollege && statistics.byCollege.length > 0 && (
          <Card title="Statistics by College" className="margin-bottom-16">
            <Table
              dataSource={statistics.byCollege}
              columns={[
                {
                  title: 'College',
                  dataIndex: 'category',
                  key: 'category',
                },
                {
                  title: 'Teams',
                  dataIndex: 'teamCount',
                  key: 'teamCount',
                },
                {
                  title: 'Average Progress',
                  dataIndex: 'averageProgress',
                  key: 'averageProgress',
                  render: (val) => `${parseFloat(val || 0).toFixed(2)}%`,
                },
              ]}
              pagination={false}
              size="small"
              rowKey="category"
            />
          </Card>
        )}
      </div>
    );
  };

  if (!selectedHackathon && hackathons.length === 0) {
    return (
      <div className="teams-progress-container">
        <Empty
          description="No hackathons available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="teams-progress-container">
      <Title level={2}>
        <TrophyOutlined className="icon-margin-right" />
        Teams Progress Dashboard
      </Title>

      {renderFilters()}

      {loading ? (
        <div className="loading-container">
          <Spin size="large" tip="Loading teams data..." />
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: (
                <span>
                  <TeamOutlined />
                  All Teams ({teams.length})
                </span>
              ),
              children: (
                <Card>
                  {statistics && (
                    <Row gutter={[16, 16]} className="margin-bottom-24">
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Total Teams"
                          value={statistics.totalTeams}
                          prefix={<TeamOutlined />}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="In Progress"
                          value={statistics.inProgressTeams}
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Completed"
                          value={statistics.completedTeams}
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Avg Progress"
                          value={statistics.averageProgress}
                          suffix="%"
                          prefix={<RiseOutlined />}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Col>
                    </Row>
                  )}

                  <Divider />

                  <div className="margin-bottom-16">
                    <Input
                      placeholder="Search team name..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <Table
                    dataSource={teams}
                    columns={columns}
                    rowKey="_id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} teams`,
                    }}
                    scroll={{ x: 1000 }}
                  />
                </Card>
              ),
            },
            {
              key: 'leaderboard',
              label: (
                <span>
                  <CrownOutlined />
                  Leaderboard
                </span>
              ),
              children: (
                <Card>
                  {leaderboard.length === 0 ? (
                    <Empty
                      description="No teams with progress yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <>
                      <div className="margin-bottom-24">
                        <Title level={4}>
                          <FireOutlined className="fire-icon" />
                          Top Performing Teams
                        </Title>
                        <Text type="secondary">
                          Showing top {leaderboard.length} teams ranked by progress
                        </Text>
                      </div>

                      {leaderboard.slice(0, 3).length > 0 && (
                        <Row gutter={[16, 16]} className="margin-bottom-24">
                          {leaderboard.slice(0, 3).map((team, index) => (
                            <Col xs={24} sm={8} key={team._id}>
                              <Card
                                className={
                                  index === 0 ? 'leaderboard-card-gold' :
                                  index === 1 ? 'leaderboard-card-silver' :
                                  'leaderboard-card-bronze'
                                }
                              >
                                <div className="leaderboard-card-content">
                                  <div className="leaderboard-medal">
                                    {getRankMedal(team.rank)}
                                  </div>
                                  <Title level={4} className="leaderboard-title">
                                    {team.name}
                                  </Title>
                                  <div className="progress-percentage-large">
                                    {team.progress.percentage}%
                                  </div>
                                  <Tag color={index === 0 ? 'gold' : index === 1 ? 'default' : 'volcano'}>
                                    {team.progress.status}
                                  </Tag>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      )}

                      <Table
                        dataSource={leaderboard}
                        columns={leaderboardColumns}
                        rowKey="_id"
                        pagination={false}
                        scroll={{ x: 800 }}
                      />
                    </>
                  )}
                </Card>
              ),
            },
            {
              key: 'statistics',
              label: (
                <span>
                  <RiseOutlined />
                  Statistics
                </span>
              ),
              children: renderStatistics(),
            },
          ]}
        />
      )}
    </div>
  );
};

export default AllTeamsProgressPage;