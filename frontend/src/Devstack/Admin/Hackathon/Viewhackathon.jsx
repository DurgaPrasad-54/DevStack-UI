import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Spin,
  Popconfirm,
  Typography,
  Row,
  Col,
  Tooltip,
  Empty,
  Segmented,
  Tag,
  Modal,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  GiftOutlined,
  PlusOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import config from "../../../config";
import { useNavigate } from "react-router-dom";
import "./Viewhackathon.css";

const { Title } = Typography;

const ViewHackathonsPage = () => {
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [filter, setFilter] = useState("ongoing");
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigate = useNavigate();

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.backendUrl}/hackathon/all`);
      setHackathons(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch hackathons");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${config.backendUrl}/hackathon/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Hackathon deleted successfully!");
      fetchHackathons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete hackathon");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id) => {
    navigate(`/hackadmin/edithackathon/${id}`);
  };

  const getFilteredHackathons = () => hackathons.filter((hack) => hack.status === filter);

  useEffect(() => {
    fetchHackathons();
  }, []);

  const renderStatusTag = (status) => {
    if (status === "ongoing") return <Tag color="green">LIVE</Tag>;
    if (status === "upcoming") return <Tag color="blue">UPCOMING</Tag>;
    if (status === "completed") return <Tag color="red">COMPLETED</Tag>;
    return null;
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr)
      .toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");
  };

  const handleViewMore = (hack) => {
    setSelectedHackathon(hack);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedHackathon(null);
  };

  // Extract card rendering for clarity
  const renderHackathonCard = (hack) => {
    const posterUrl = `${config.backendUrl}/hackathon/poster/${hack._id}`;
    return (
      <Col
        xs={24}
        sm={12}
        md={8}
        lg={6}
        xl={4}
        xxl={4}
        key={hack._id}
        style={{ display: "flex", flex: "0 0 20%", maxWidth: "20%" }}
      >
        <Card className="view-hackathon-card" hoverable>
          <div
            className="hackathon-poster"
            style={{
              backgroundImage: hack.hackathonposter ? `url(${posterUrl})` : undefined,
              backgroundColor: !hack.hackathonposter ? "#f5f5f5" : undefined,
            }}
            aria-label={hack.hackathonname}
          >
            {renderStatusTag(hack.status)}
          </div>
          <div className="hackathon-content">
            <h2 className="hackathon-name">{hack.hackathonname}</h2>
            <p className="hackathon-date">
              <CalendarOutlined /> {formatDateTime(hack.startdate)}
            </p>
            <p className="hackathon-location">
              <EnvironmentOutlined /> {hack.location}
            </p>
            <div className="hackathon-actions">
              <Tooltip title="View Details">
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handleViewMore(hack)}
                >
                  View More
                </Button>
              </Tooltip>
              {hack.status !== "completed" && (
                <>
                  <Tooltip title="Edit Hackathon">
                    <Button
                      icon={<EditOutlined />}
                      type="default"
                      onClick={() => handleEdit(hack._id)}
                    />
                  </Tooltip>
                  <Tooltip title="Delete Hackathon">
                    <Popconfirm
                      title="Are you sure to delete this hackathon?"
                      onConfirm={() => handleDelete(hack._id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="default"
                        icon={<DeleteOutlined />}
                        loading={deletingId === hack._id}
                      />
                    </Popconfirm>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div>
      <ToastContainer />
      <div className="viewhackathons-container">
        <div className="view-page-header">
          <Title level={3}>Manage Hackathons</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/hackadmin/create")}
          >
            Publish Hackathon
          </Button>
        </div>
        <div className="filter-container">
          <Segmented
            options={[
              { label: "Ongoing", value: "ongoing" },
              { label: "Upcoming", value: "upcoming" },
              { label: "Completed", value: "completed" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>
        {loading ? (
          <div className="loading">
            <Spin size="large" />
          </div>
        ) : getFilteredHackathons().length === 0 ? (
          <Empty
            description={
              <span>
                No hackathons available for{" "}
                <b>{filter.charAt(0).toUpperCase() + filter.slice(1)}</b>
              </span>
            }
            style={{ marginTop: 40 }}
          />
        ) : (
          <Row gutter={[16, 16]} justify="start">
            {getFilteredHackathons().map(renderHackathonCard)}
          </Row>
        )}
      </div>

      {/* View More Modal */}
      <Modal
        title={
          <div className="modal-header">
            <span>{selectedHackathon?.hackathonname}</span>
            {selectedHackathon && renderStatusTag(selectedHackathon.status)}
          </div>
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        centered
        destroyOnClose
        maskClosable={true}
        footer={
          selectedHackathon?.status !== "completed" ? (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                handleCloseModal();
                handleEdit(selectedHackathon._id);
              }}
            >
              Edit Hackathon
            </Button>
          ) : null
        }
        width={500}
        className="hackathon-modal"
        zIndex={1050}
      >
        {selectedHackathon && (
          <div className="modal-content">
            {selectedHackathon.hackathonposter && (
              <div
                className="modal-poster"
                style={{
                  backgroundImage: `url(${config.backendUrl}/hackathon/poster/${selectedHackathon._id})`,
                }}
              />
            )}
            <div className="modal-details">
              <div className="detail-row">
                <CalendarOutlined className="detail-icon" />
                <div>
                  <strong>Duration</strong>
                  <p>{formatDateTime(selectedHackathon.startdate)} - {formatDateTime(selectedHackathon.enddate)}</p>
                </div>
              </div>
              <div className="detail-row">
                <EnvironmentOutlined className="detail-icon" />
                <div>
                  <strong>Location</strong>
                  <p>{selectedHackathon.location}</p>
                </div>
              </div>
              <div className="detail-row">
                <DollarOutlined className="detail-icon" />
                <div>
                  <strong>Entry Fee</strong>
                  <p>{selectedHackathon.entryfee || "Free"}</p>
                </div>
              </div>
              {selectedHackathon.status !== "completed" && (
                <div className="detail-row">
                  <ClockCircleOutlined className="detail-icon warning" />
                  <div>
                    <strong>Registration Ends</strong>
                    <p className="warning-text">{formatDateTime(selectedHackathon.regend)}</p>
                  </div>
                </div>
              )}
              <div className="detail-section">
                <strong>Description</strong>
                <p>{selectedHackathon.description}</p>
              </div>
              <div className="detail-section">
                <strong>Prizes</strong>
                <div className="hackathon-prizes modal-prizes">
                  <Tag icon={<GiftOutlined />} color="gold">
                    1st: {selectedHackathon.firstprize || "-"}
                  </Tag>
                  <Tag icon={<GiftOutlined />} color="silver">
                    2nd: {selectedHackathon.secondprize || "-"}
                  </Tag>
                  <Tag icon={<GiftOutlined />} color="#cd7f32">
                    3rd: {selectedHackathon.thirdprize || "-"}
                  </Tag>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewHackathonsPage;
