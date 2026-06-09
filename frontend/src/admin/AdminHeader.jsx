import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
  FileExcelOutlined,
  NotificationOutlined,
  ProjectOutlined,
  FileSearchOutlined,
  CodeOutlined,
  MenuOutlined,
  FormOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined, // Icon for mentor approval
  SafetyCertificateOutlined, // Icon for certificate generation
  StarOutlined, // Add this import for feedback icon
} from '@ant-design/icons';
import './AdminHeader.css';

const { Header } = Layout;

const AdminHeader = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { key: '/admin', icon: <HomeOutlined />, label: 'Home' },
    // { key: '/admin/calendar', icon: <CalendarOutlined />, label: 'Calendar' },
    {
      key: '/admin/certificates',
      icon: <FileTextOutlined />,
      label: 'Certificates',
    },
    { key: '/admin/teams', icon: <TeamOutlined />, label: 'Teams' },
    { key: '/admin/csv', icon: <FileExcelOutlined />, label: 'CSV' },
    {
      key: '/admin/notifications',
      icon: <NotificationOutlined />,
      label: 'Notifications',
    },
    { key: '/admin/projects', icon: <ProjectOutlined />, label: 'Projects' },
    {
      key: '/admin/resources',
      icon: <FileSearchOutlined />,
      label: 'Resources',
    },
    { key: '/admin/compiler', icon: <CodeOutlined />, label: 'Compiler' },
    { key: '/admin/exams', icon: <FormOutlined />, label: 'Exams' },
    { key: '/admin/reports', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '/admin/tasks', icon: <UnorderedListOutlined />, label: 'Tasks' },
    {
      key: '/admin/mentorapproval',
      icon: <CheckCircleOutlined />,
      label: 'Mentor-Approval',
    }, // Changed icon
    {
      key: '/admin/grade-criteria',
      icon: <SafetyCertificateOutlined />,
      label: 'Generate Certificates',
    }, // Changed icon
    {
      key: '/admin/bulk-year-management',
      icon: <TeamOutlined />,
      label: 'Promoting Students',
    },
    {
      key: '/admin/mentor-feedbacks',
      icon: <StarOutlined />,
      label: 'Mentor Feedbacks',
    },
    {
      key: '/admin/resource-approval',
      icon: <CheckCircleOutlined />,
      label: 'Resource Approval',
    }, // Add this line
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMenuVisible(false);
  };

  return (
    <Header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-logo">Dev-Orbit Admin</div>
        <div className="admin-header-menu-container" ref={menuRef}>
          <MenuOutlined
            className="admin-header-menu-trigger"
            onClick={() => setMenuVisible(!menuVisible)}
          />
          {menuVisible && (
            <div className="admin-header-menu-dropdown">
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  className="admin-header-menu-item"
                  onClick={() => handleMenuClick({ key: item.key })}
                >
                  <span className="admin-header-menu-icon">{item.icon}</span>
                  <span className="admin-header-menu-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Header>
  );
};

export default AdminHeader;
