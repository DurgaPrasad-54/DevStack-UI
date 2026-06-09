import { useEffect, useState } from "react";

import {
  Card,
  Button,
  Spin,
  Typography,


  Empty,
  Modal,
  Input,
  Tag,
  Form,

  message,
  Select,
  Alert } from
"antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axios from "axios";
import config from "../../../config";
import "./Problemstatements.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

const MentorProblemStatementsPage = () => {
  const [loading, setLoading] = useState(false);
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [problemStatements, setProblemStatements] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [techInput, setTechInput] = useState("");
  const [technologies, setTechnologies] = useState([]);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const token = localStorage.getItem("token");
  const mentorId = localStorage.getItem("mentor"); // ✅ make sure this key is correct

  // ✅ Fetch approved hackathons
  const fetchApprovedHackathons = async () => {
    if (!mentorId) {
      message.error("Mentor ID not found in localStorage");
      console.error("Mentor ID missing. localStorage.getItem('mentor'):", mentorId);
      return;
    }
  const url = `${config.backendUrl}/hackathonrequests/mentor/${mentorId}`;
    console.log("Fetching hackathons for mentorId:", mentorId, "URL:", url);
    try {
      setLoading(true);
      const res = await axios.get(
        url,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Only include approved hackathons
      const approved = res.data.filter(
        (h) => h.mentorRequest?.status === "approved"
      );
      setHackathons(approved);
      // Store approved hackathon IDs in localStorage
      const ids = approved.map((h) => h.hackathon?._id);
      localStorage.setItem("approvedHackathonIds", JSON.stringify(ids));
      // If only one approved hackathon, select it by default
      if (approved.length === 1) {
        setSelectedHackathon(approved[0]);
        fetchProblemStatements(approved[0].hackathon._id);
      }
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      message.error("Failed to fetch hackathons");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch problem statements for selected hackathon
  const fetchProblemStatements = async (hackathonId) => {
    try {
      const res = await axios.get(
        `${config.backendUrl}/problemstatements/mentor/${mentorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const hackathonData = res.data.find(
        (p) => p.hackathon?._id === hackathonId
      );
      setProblemStatements(hackathonData?.problemStatements || []);
    } catch (error) {
      console.error("Error fetching problem statements:", error);
      setProblemStatements([]);
      message.error("Failed to fetch problem statements");
    }
  };

  useEffect(() => {
  fetchApprovedHackathons();
  }, []);

  // ✅ Add Problem Statement
  const handleAddProblem = async (values) => {
    if (!selectedHackathon) return;
    try {
      const payload = { ...values, technologies };
      const res = await axios.post(
        `${config.backendUrl}/problemstatements/${selectedHackathon.hackathon._id}/add`,
        { problemStatements: [payload] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Problem statement added!");
      setProblemStatements(res.data.problemDoc.problemStatements);
      setModalVisible(false);
      addForm.resetFields();
      setTechnologies([]);
      setTechInput("");
    } catch (error) {
      console.error("Add problem error:", error);
      message.error(
        error.response?.data?.message || "Failed to add problem statement."
      );
    }
  };

  // ✅ Edit Problem
  const handleEditProblem = async (values) => {
    if (!selectedHackathon || !currentProblem) return;
    try {
      const payload = { ...values, technologies };
      await axios.put(
        `${config.backendUrl}/problemstatements/${selectedHackathon.hackathon._id}/${currentProblem._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Problem updated successfully!");
      setEditModalVisible(false);
      setCurrentProblem(null);
      editForm.resetFields();
      setTechnologies([]);
      setTechInput("");
      fetchProblemStatements(selectedHackathon.hackathon._id);
    } catch (error) {
      console.error("Edit problem error:", error);
      message.error(
        error.response?.data?.message || "Failed to update problem statement."
      );
    }
  };

  // ✅ Delete Problem
  const handleDeleteProblem = async (problemId) => {
    if (!selectedHackathon) return;
    try {
      await axios.delete(
        `${config.backendUrl}/problemstatements/${selectedHackathon.hackathon._id}/${problemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Problem statement deleted!");
      fetchProblemStatements(selectedHackathon.hackathon._id);
    } catch (error) {
      console.error("Delete problem error:", error);
      message.error(
        error.response?.data?.message || "Failed to delete problem statement."
      );
    }
  };

  // ✅ Manage Technologies
  const handleAddTech = () => {
    if (techInput && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()]);
      setTechInput("");
    }
  };

  const handleRemoveTech = (tech) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  // ✅ UI Rendering
  
  // Get hackathon status tag
  const getStatusTag = (status) => {
    switch (status) {
      case 'ongoing':
        return <Tag className="hackathon-status-tag ongoing" icon={<ClockCircleOutlined />}>Ongoing</Tag>;
      case 'completed':
        return <Tag className="hackathon-status-tag completed" icon={<CheckCircleOutlined />}>Completed</Tag>;
      case 'upcoming':
        return <Tag className="hackathon-status-tag upcoming" icon={<CalendarOutlined />}>Upcoming</Tag>;
      default:
        return <Tag color="default">{status || 'Unknown'}</Tag>;
    }
  };

  // Check if hackathon is editable (ongoing or upcoming)
  const isHackathonEditable = (hack) => {
    const status = hack?.hackathon?.status;
    return status === 'ongoing' || status === 'upcoming';
  };

  const renderProblemCard = (problem) => {
    const isEditable = isHackathonEditable(selectedHackathon);
    
    return (
      <div key={problem._id} className="mentor-problem-card">
        <div className="mentor-problem-card-header">
          <h4 className="mentor-problem-title">{problem.title}</h4>
        </div>
        <p className="mentor-problem-description">{problem.description}</p>
        {problem.technologies && problem.technologies.length > 0 && (
          <div className="mentor-tech-tags">
            {problem.technologies.map((tech, idx) => (
              <span key={idx} className="mentor-tech-tag">{tech}</span>
            ))}
          </div>
        )}
        {isEditable && (
          <div className="mentor-problem-actions">
            <Button
              className="mentor-edit-btn"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentProblem(problem);
                setTechnologies(problem.technologies || []);
                setTechInput("");
                editForm.setFieldsValue({
                  title: problem.title,
                  description: problem.description,
                });
                setEditModalVisible(true);
              }}
            >
              Edit
            </Button>
            <Button
              className="mentor-delete-btn"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteProblem(problem._id)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderHackathonCard = (hack) => {
    if (!hack.hackathon) return null;
    const isEditable = isHackathonEditable(hack);
    const hackathonStatus = hack.hackathon.status;
    
    return (
      <Card
        key={hack.hackathon._id}
        className="hackathon-card"
        title={hack.hackathon.hackathonname}
        extra={
          isEditable && (
            <Button
              className="add-problem-btn"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedHackathon(hack);
                setTechnologies([]);
                setTechInput("");
                setModalVisible(true);
                addForm.resetFields();
              }}
            >
              Add Problem
            </Button>
          )
        }
        onClick={() => {
          setSelectedHackathon(hack);
          fetchProblemStatements(hack.hackathon._id);
        }}
      >
        {selectedHackathon?.hackathon._id === hack.hackathon._id && (
          <div>
            {problemStatements.length === 0 ? (
              <div className="mentor-empty-state">
                <Empty description="No problem statements yet. Click 'Add Problem' to create one." />
              </div>
            ) : (
              problemStatements.map(renderProblemCard)
            )}
          </div>
        )}
      </Card>
    );
  };


  // All hackathons with valid hackathon object (sorted: ongoing first, then upcoming, then completed)
  const allHackathons = hackathons
    .filter(h => h.hackathon)
    .sort((a, b) => {
      const order = { 'ongoing': 0, 'upcoming': 1, 'completed': 2 };
      return (order[a.hackathon.status] || 3) - (order[b.hackathon.status] || 3);
    });
  
  // Only ongoing hackathons for adding new problem statements
  const ongoingHackathons = hackathons.filter(h => h.hackathon && h.hackathon.status === 'ongoing');

  return (
    <div className="mentor-problem-container">
      <div className="mentor-problem-content">
        <div className="mentor-problem-header">
          <h3>
            <FileTextOutlined />
            My Approved Hackathons
          </h3>
        </div>

        {/* Hackathon Dropdown with Search */}
        <div className="hackathon-selector-section">
          <span className="hackathon-selector-label">Select Hackathon</span>
          <Select
            showSearch
            className="hackathon-selector"
            placeholder="Search or select a hackathon"
            value={selectedHackathon?.hackathon?._id || undefined}
            onChange={hackathonId => {
              const hack = allHackathons.find(h => h.hackathon._id === hackathonId);
              setSelectedHackathon(hack);
              fetchProblemStatements(hackathonId);
            }}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            optionLabelProp="label"
            optionFilterProp="label"
            searchPlaceholder="Search hackathon by name..."
          >
            {ongoingHackathons.map(h => (
              <Select.Option 
                key={h.hackathon._id} 
                value={h.hackathon._id}
                label={h.hackathon.hackathonname}
              >
                <div className="hackathon-option-content">
                  <span>{h.hackathon.hackathonname}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
        
        {/* Info message for completed/upcoming hackathons */}
        {selectedHackathon && selectedHackathon.hackathon.status === 'completed' && (
          <Alert
            className="hackathon-status-alert completed"
            message="Completed Hackathon"
            description="This hackathon has ended. Problem statements are shown in read-only mode."
            type="info"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}
        {selectedHackathon && selectedHackathon.hackathon.status === 'upcoming' && (
          <Alert
            className="hackathon-status-alert upcoming"
            message="Upcoming Hackathon"
            description="This hackathon hasn't started yet. You can add and edit problem statements."
            type="warning"
            showIcon
            icon={<CalendarOutlined />}
          />
        )}
        
        {/* Show selected hackathon's problem statements */}
        {loading ? (
          <div className="mentor-loading-state">
            <Spin size="large" />
          </div>
        ) : (
          selectedHackathon && renderHackathonCard(selectedHackathon)
        )}

        {/* ✅ Add Problem Modal */}
        <Modal
          className="mentor-problem-modal"
          title={`Add Problem Statement - ${selectedHackathon?.hackathon.hackathonname || ""}`}
          open={modalVisible}
          footer={null}
          onCancel={() => {
            setModalVisible(false);
            addForm.resetFields();
            setTechnologies([]);
            setTechInput("");
          }}
        >
          <Form
            className="mentor-problem-form"
            layout="vertical"
            onFinish={handleAddProblem}
            form={addForm}
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input placeholder="Problem Title" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Description is required" }]}
            >
              <TextArea rows={4} placeholder="Describe the problem..." />
            </Form.Item>
            <Form.Item label="Technologies">
              <div className="tech-input-section">
                <div className="tech-input-wrapper">
                  <Input
                    placeholder="Enter technology and press Enter"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      handleAddTech();
                    }}
                  />
                  <Button className="add-tech-btn" onClick={handleAddTech}>
                    Add
                  </Button>
                </div>
                <div className="tech-tags-list">
                  {technologies.map((tech, idx) => (
                    <Tag
                      key={idx}
                      closable
                      onClose={() => handleRemoveTech(tech)}
                    >
                      {tech}
                    </Tag>
                  ))}
                </div>
              </div>
            </Form.Item>
            <div className="form-actions">
              <Button className="form-submit-btn" type="primary" htmlType="submit">
                Create
              </Button>
              <Button
                className="form-cancel-btn"
                onClick={() => {
                  setModalVisible(false);
                  addForm.resetFields();
                  setTechnologies([]);
                  setTechInput("");
                }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal>

        {/* ✅ Edit Problem Modal */}
        <Modal
          className="mentor-problem-modal"
          title={`Edit Problem Statement - ${selectedHackathon?.hackathon.hackathonname || ""}`}
          open={editModalVisible}
          footer={null}
          onCancel={() => {
            setEditModalVisible(false);
            editForm.resetFields();
            setTechnologies([]);
            setTechInput("");
          }}
        >
          <Form
            className="mentor-problem-form"
            layout="vertical"
            onFinish={handleEditProblem}
            form={editForm}
            initialValues={{
              title: currentProblem?.title,
              description: currentProblem?.description,
            }}
            key={currentProblem?._id || 'edit-form'}
          >
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Title is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Description is required" }]}
            >
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item label="Technologies">
              <div className="tech-input-section">
                <div className="tech-input-wrapper">
                  <Input
                    placeholder="Enter technology and press Enter"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      handleAddTech();
                    }}
                  />
                  <Button className="add-tech-btn" onClick={handleAddTech}>
                    Add
                  </Button>
                </div>
                <div className="tech-tags-list">
                  {technologies.map((tech, idx) => (
                    <Tag
                      key={idx}
                      closable
                      onClose={() => handleRemoveTech(tech)}
                    >
                      {tech}
                    </Tag>
                  ))}
                </div>
              </div>
            </Form.Item>
            <div className="form-actions">
              <Button className="form-submit-btn" type="primary" htmlType="submit">
                Update
              </Button>
              <Button
                className="form-cancel-btn"
                onClick={() => {
                  setEditModalVisible(false);
                  editForm.resetFields();
                  setTechnologies([]);
                  setTechInput("");
                }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default MentorProblemStatementsPage;
