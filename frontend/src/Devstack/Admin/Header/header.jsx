import { useState, useEffect, useRef } from 'react';
import { Layout} from 'antd';
import { useNavigate } from 'react-router-dom';



import {

  CheckCircleOutlined,
  CloudUploadOutlined,
  PlusOutlined,
  HomeOutlined,
  UserOutlined,

  ApartmentOutlined,
  CalendarOutlined,

  PictureOutlined,
  StarOutlined,
  BellOutlined,
  MenuOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined } from
'@ant-design/icons';
import './header.css';

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
    { key: '/hackadmin/csv', icon: <CloudUploadOutlined />, label: 'Bulk Student Registation' },
    { key: '/hackadmin/create', icon: <PlusOutlined />, label: 'Create Hackathon' },
    {
      key: '/hackadmin/winners',
      icon: <HomeOutlined />,
      label: 'Winners',
    },
    { key: '/hackadmin/register-coordinator', icon: <UserOutlined />, label: 'Assign Coordinators' },
    {
      key: '/hackadmin/roomallocation',
      icon: <ApartmentOutlined/>,
      label: 'Room Allocation',
    },
    { key: '/hackadmin/schedule', icon: <CalendarOutlined />, label: 'Schedule' },
    { key: '/hackadmin/hackfeedback', icon: <StarOutlined />, label: 'Mentor Feedback' },
    { key: '/hackadmin/certificates', icon: <SafetyCertificateOutlined />, label: 'Certificates' },
    { key: '/hackadmin/gallery', icon: <PictureOutlined />, label: 'Gallery' },
    {
      key: '/hackadmin/notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
    }, // Changed icon
    {
      key: '/hackadmin/mentorapprovals',
      icon: <CheckCircleOutlined />,
      label: 'Mentor Hackathon Requests',
    },
        {
      key: '/hackadmin/resourceapprovals',
      icon: <CheckCircleOutlined />,
      label: 'Resource Approval',
    }, 
    {
      key: '/adminlogin',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
    // {
    //   key: '/admin/mentor-feedbacks',
    //   icon: <StarOutlined />,
    //   label: 'Mentor Feedbacks',
    // },
    // {
    //   key: '/admin/resource-approval',
    //   icon: <CheckCircleOutlined />,
    //   label: 'Resource Approval',
    // }, // Add this line
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMenuVisible(false);
  };

  return (
    <Header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-logo">DevStack Admin</div>
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
