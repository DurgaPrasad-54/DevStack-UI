import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Input, 
  Select, 
  Button, 
  Modal, 
  Form, 
  Tabs,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Typography,
  message
} from 'antd';
import { Github, Linkedin, Eye, Check, X, Search, Filter } from 'lucide-react';
import './mentorapproval.css';
import config from '../../config';


const { Title, Text } = Typography;
const { TabPane } = Tabs;

const MentorManagement = () => {
  const [mentors, setMentors] = useState([]);
  const [allMentors, setAllMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortBy: 'requestDate',
    order: 'desc'
  });
 
  const [counts, setCounts] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [detailDialog, setDetailDialog] = useState({ open: false, mentor: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, mentorId: null, status: '', reason: '' });
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch all mentors initially
  useEffect(() => {
    fetchMentors();
  }, []);
  
  // Apply filters locally when filter state changes
  useEffect(() => {
    if (allMentors.length > 0) {
      applyFilters();
    }
  }, [filters, allMentors]);
  
  const fetchMentors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${config.backendUrl}/mentor-approval/mentors`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch mentors');
      }
      
      const data = await response.json();
      setAllMentors(data.mentors);
      setMentors(data.mentors);
      setCounts(data.counts);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters locally instead of fetching from backend
  const applyFilters = () => {
    let filteredResults = [...allMentors];
    
    // Apply status filter
    if (filters.status) {
      filteredResults = filteredResults.filter(mentor => mentor.status === filters.status);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredResults = filteredResults.filter(mentor => 
        (mentor.name && mentor.name.toLowerCase().includes(searchTerm)) ||
        (mentor.email && mentor.email.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply sorting
    filteredResults.sort((a, b) => {
      const sortField = filters.sortBy;
      const direction = filters.order === 'desc' ? -1 : 1;
      
      if (a[sortField] < b[sortField]) return -1 * direction;
      if (a[sortField] > b[sortField]) return 1 * direction;
      return 0;
    });
    
    setMentors(filteredResults);
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    
    // Clear any existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set a timeout to avoid too many filter operations while typing
    window.searchTimeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchValue }));
    }, 500);
  };

  const handleUpdateStatus = async (mentorId, newStatus, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.backendUrl}/mentor-approval/admin/mentors/${mentorId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update mentor status');
      }

      // Fetch all mentors again to update counts and data
      await fetchMentors();
      message.success(`Mentor ${newStatus} successfully`);
    } catch (err) {
      message.error(err.message || 'Failed to update mentor status');
    } finally {
      setStatusDialog({ open: false, mentorId: null, status: '', reason: '' });
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Profiles',
      key: 'profiles',
      render: (_, record) => (
        <Space>
          {record.github && <a href={record.github} target="_blank" rel="noopener noreferrer"><Github /></a>}
          {record.linkedin && <a href={record.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin /></a>}
        </Space>
      )
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      )
    },
   
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<Eye />}
            onClick={() => setDetailDialog({ open: true, mentor: record })}
          />
          {record.status === 'pending' && (
            <>
              <Button
                type="text"
                icon={<Check className="text-success" />}
                onClick={() => handleUpdateStatus(record._id, 'approved')}
              />
              <Button
                type="text"
                icon={<X className="text-error" />}
                onClick={() => setStatusDialog({
                  open: true,
                  mentorId: record._id,
                  status: 'rejected',
                  reason: ''
                })}
              />
            </>
          )}
          {record.status === 'approved' && (
            <Button
              danger
              onClick={() => handleUpdateStatus(record._id, 'rejected', 'Removed from approved mentors')}
            >
              Remove
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Apply tab filter
  const filteredMentors = mentors.filter(mentor => {
    return activeTab === 'all' ? true : mentor.status === activeTab;
  });

  return (
    <div className="mentor-containers">
      <Card className="mentor-card">
        <div className="dashboard-header">
          <div>
            <Title level={2}>Mentor Management</Title>
            <Text type="secondary">Manage and monitor all mentors</Text>
          </div>
          
          <Space className="filter-space">
            <Input
              placeholder="Search mentors..."
              prefix={<Search className="search-icon" />}
              defaultValue={filters.search}
              onChange={handleSearchChange}
              allowClear
              className="mentors-search-input"
            />
            <Select
              placeholder="Filter by status"
              value={filters.status || undefined}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              className="status-select"
              allowClear
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
          </Space>
        </div>

        <Row className="stats-section">
          <Col className="stats-col">
            <Card hoverable onClick={() => {
              setFilters(prev => ({ ...prev, status: '' }));
              setActiveTab('all');
            }}>
              <Statistic title="Total Mentors" value={counts.total} />
            </Card>
          </Col>
          <Col className="stats-col">
            <Card hoverable onClick={() => {
              setFilters(prev => ({ ...prev, status: 'pending' }));
              setActiveTab('pending');
            }}>
              <Statistic 
                title="Pending" 
                value={counts.pending}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col className="stats-col">
            <Card hoverable onClick={() => {
              setFilters(prev => ({ ...prev, status: 'approved' }));
              setActiveTab('approved');
            }}>
              <Statistic 
                title="Approved" 
                value={counts.approved}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col className="stats-col">
            <Card
              hoverable
              onClick={() => {
                setFilters(prev => ({ ...prev, status: 'rejected' }));
                setActiveTab('rejected');
              }}
            >
              <Statistic 
                title="Rejected" 
                value={counts.rejected}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* <Tabs 
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setFilters(prev => ({ 
              ...prev, 
              status: key === 'all' ? '' : key 
            }));
          }}
          className="mentor-tabs"
        >
          <TabPane tab="All" key="all" />
          <TabPane tab="Pending" key="pending" />
          <TabPane tab="Approved" key="approved" />
          <TabPane tab="Rejected" key="rejected" />
        </Tabs> */}

        {error && <div className="error-message">{error}</div>}

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={filteredMentors}
            loading={loading}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No mentors found' }}
          />
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Mentor Details"
        open={detailDialog.open}
        onCancel={() => setDetailDialog({ open: false, mentor: null })}
        footer={[
          <Button
            key="update"
            type="primary"
            onClick={() => {
              setStatusDialog({
                open: true,
                mentorId: detailDialog.mentor?._id,
                status: detailDialog.mentor?.status,
                reason: ''
              });
              setDetailDialog({ open: false, mentor: null });
            }}
          >
            Update Status
          </Button>,
          <Button key="close" onClick={() => setDetailDialog({ open: false, mentor: null })}>
            Close
          </Button>
        ]}
      >
        {detailDialog.mentor && (
          <div className="mentor-details">
            <Title level={4}>{detailDialog.mentor.name}</Title>
            <Tag color={
              detailDialog.mentor.status === 'approved' ? 'success' :
              detailDialog.mentor.status === 'pending' ? 'warning' :
              'error'
            }>
              {detailDialog.mentor.status.charAt(0).toUpperCase() + detailDialog.mentor.status.slice(1)}
            </Tag>
            
            <div className="detail-section">
              <Title level={5}>Contact Information</Title>
              <p><strong>Email:</strong> {detailDialog.mentor.email}</p>
              <p><strong>Phone:</strong> {detailDialog.mentor.phoneNumber}</p>
            </div>
            
            <div className="detail-section">
              <Title level={5}>Status History</Title>
              <p><strong>Request Date:</strong> {new Date(detailDialog.mentor.requestDate).toLocaleString()}</p>
              {detailDialog.mentor.approvalDate && (
                <p><strong>Status Update:</strong> {new Date(detailDialog.mentor.approvalDate).toLocaleString()}</p>
              )}
              {detailDialog.mentor.rejectionReason && (
                <p><strong>Rejection Reason:</strong> {detailDialog.mentor.rejectionReason}</p>
              )}
            </div>

            <div className="detail-section">
              <Title level={5}>Online Profiles</Title>
              <Space>
                {detailDialog.mentor.github && (
                  <a href={detailDialog.mentor.github} target="_blank" rel="noopener noreferrer">
                    <Github /> GitHub Profile
                  </a>
                )}
                {detailDialog.mentor.linkedin && (
                  <a href={detailDialog.mentor.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin /> LinkedIn Profile
                  </a>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        title="Update Mentor Status"
        open={statusDialog.open}
        onCancel={() => setStatusDialog({ open: false, mentorId: null, status: '', reason: '' })}
        onOk={() => handleUpdateStatus(statusDialog.mentorId, statusDialog.status, statusDialog.reason)}
        okButtonProps={{
          disabled: !statusDialog.status || (statusDialog.status === 'rejected' && !statusDialog.reason)
        }}
      >
        <Form layout="vertical">
          <Form.Item label="New Status">
            <Select
              value={statusDialog.status}
              onChange={(value) => setStatusDialog(prev => ({ ...prev, status: value }))}
              style={{ width: '100%' }}
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
          </Form.Item>

          {statusDialog.status === 'rejected' && (
            <Form.Item label="Rejection Reason">
              <Input.TextArea
                value={statusDialog.reason}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for rejection..."
                rows={4}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MentorManagement;