import { useState, useEffect } from 'react';
import { Card, Table, Avatar, Tag, Spin, Space, Empty, Typography } from 'antd';
import { TrophyOutlined, CrownOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import config from '../../config';

const { Text } = Typography;

const LeaderboardComponent = ({ showOnlyActiveTime = false }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Retrieve the hackathon ID. It might be stored in context or localStorage under various keys.
      const hackathonId = localStorage.getItem('selectedHackathonId') || 
                          localStorage.getItem('hackathonId') || 
                          localStorage.getItem('activeHackathonId');

      if (!hackathonId) {
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `${config.backendUrl}/teamprogress/teams/progress/leaderboard?hackathonId=${hackathonId}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setLeaderboard(res.data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip="Loading leaderboard..." />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description={
            <span>
              No team progress recorded yet. 
              <br />
              <Text type="secondary">Once teams update their progress, the leaderboard will display here.</Text>
            </span>
          } 
        />
      </Card>
    );
  }

  const getMedalIcon = (rank) => {
    if (rank === 1) return <CrownOutlined style={{ color: '#FFD700', fontSize: '24px' }} />;
    if (rank === 2) return <TrophyOutlined style={{ color: '#C0C0C0', fontSize: '20px' }} />;
    if (rank === 3) return <TrophyOutlined style={{ color: '#CD7F32', fontSize: '18px' }} />;
    return <span style={{ fontWeight: 'bold', color: '#8c8c8c' }}>#{rank}</span>;
  };

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      align: 'center',
      width: 80,
      render: (rank) => getMedalIcon(rank),
    },
    {
      title: 'Team Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Avatar 
            style={{ 
              backgroundColor: record.rank === 1 ? '#FFF9E6' : record.rank === 2 ? '#F5F5F5' : record.rank === 3 ? '#FFF2E8' : '#F0F5FF',
              color: record.rank === 1 ? '#D4B106' : record.rank === 2 ? '#595959' : record.rank === 3 ? '#D4380D' : '#1890FF' 
            }}
            icon={<UserOutlined />} 
          />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Team Lead',
      dataIndex: 'teamLead',
      key: 'teamLead',
      render: (lead) => lead ? lead.name : 'N/A',
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      align: 'center',
      render: (progress) => (
        <Tag color={progress?.percentage === 100 ? 'success' : 'processing'} style={{ padding: '4px 12px', borderRadius: '4px', fontWeight: 600 }}>
          {progress?.percentage}%
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'progress',
      key: 'status',
      render: (progress) => {
        const status = progress?.status || 'Not Started';
        const color = status === 'Completed' ? 'green' : status === 'In Progress' ? 'blue' : 'gray';
        return <Tag color={color}>{status}</Tag>;
      }
    }
  ];

  return (
    <Card 
      title={
        <Space>
          <CrownOutlined style={{ color: '#faad14' }} />
          <span>Hackathon Leaderboard</span>
        </Space>
      }
      style={{ 
        borderRadius: '16px', 
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        border: 'none',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '0px' }}
    >
      <Table 
        dataSource={leaderboard} 
        columns={columns} 
        rowKey="_id"
        pagination={false}
        size="middle"
        style={{ borderRadius: '16px' }}
      />
    </Card>
  );
};

export default LeaderboardComponent;
