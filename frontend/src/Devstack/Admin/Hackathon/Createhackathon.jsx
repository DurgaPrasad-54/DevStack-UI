import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Upload,
  Button,
  Select,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  message,
  Collapse,
  Card,
} from "antd";
import { UploadOutlined, SendOutlined, ClearOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import dayjs from "dayjs";
import config from "../../../config";
import "./Createhackathon.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

const YEAR_OPTIONS = ["first year", "second year", "third year", "fourth year"];
const COLLEGE_OPTIONS = ["All", "KIET", "KIET+", "KIEW"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const HackathonCreationPage = () => {
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [qrFile, setQrFile] = useState(null); // <-- QR code file state
  const [loading, setLoading] = useState(false);
  const [eventMode, setEventMode] = useState("Online");
  const [isEdit, setIsEdit] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch hackathon data if editing
  useEffect(() => {
    if (id) {
      setIsEdit(true);
      const fetchHackathon = async () => {
        try {
          const res = await axios.get(`${config.backendUrl}/hackathon/${id}`);
          const hackathon = res.data;
          // Set event mode based on loaded data
          setEventMode(hackathon.location === "Online" ? "Online" : "Offline");
          form.setFieldsValue({
            hackathonname: hackathon.hackathonname,
            college: hackathon.college,
            year: hackathon.year,
            technology: hackathon.technology,
            entryfee: hackathon.entryfee,
            firstprize: hackathon.firstprize,
            secondprize: hackathon.secondprize,
            thirdprize: hackathon.thirdprize,
            description: hackathon.description,
            eventduration:
              hackathon.startdate && hackathon.enddate
                ? [dayjs(hackathon.startdate), dayjs(hackathon.enddate)]
                : [],
            regduration:
              hackathon.regstart && hackathon.regend
                ? [dayjs(hackathon.regstart), dayjs(hackathon.regend)]
                : [],
            minteam: hackathon.minteam,
            maxteam: hackathon.maxteam,
            location: hackathon.location,
            virtualeventlink: hackathon.virtualeventlink,
            rules: hackathon.rules || [],
          });
          if (hackathon.hackathonposter) {
            setFile({
              name: `Poster_${hackathon._id}`,
              url: `${config.backendUrl}/hackathon/poster/${hackathon._id}`,
            });
          }
          if (hackathon.qrcode && hackathon.qrcode.data) {
            setQrFile({
              name: `QRCode_${hackathon._id}`,
              url: `${config.backendUrl}/hackathon/qrcode/${hackathon._id}`,
            });
          }
        } catch (err) {
          toast.error("Failed to load hackathon data");
        }
      };
      fetchHackathon();
    } else {
      setIsEdit(false);
      setFile(null);
      setQrFile(null);
      setEventMode("Online");
      form.resetFields();
    }
  }, [id, form]);

  const beforeUpload = useCallback((file) => {
    const isValidType = ALLOWED_FILE_TYPES.includes(file.type);
    const isValidSize = file.size <= MAX_FILE_SIZE;
    if (!isValidType) {
      message.error("Please upload a valid image file (JPEG, PNG, WebP)");
      return Upload.LIST_IGNORE;
    }
    if (!isValidSize) {
      message.error("File size must be less than 5MB");
      return Upload.LIST_IGNORE;
    }
    setFile(file);
    message.success(`${file.name} selected successfully`);
    return false;
  }, []);

  // QR code beforeUpload
  const beforeUploadQr = useCallback((file) => {
    const isValidType = ALLOWED_FILE_TYPES.includes(file.type);
    const isValidSize = file.size <= MAX_FILE_SIZE;
    if (!isValidType) {
      message.error("Please upload a valid image file (JPEG, PNG, WebP)");
      return Upload.LIST_IGNORE;
    }
    if (!isValidSize) {
      message.error("File size must be less than 5MB");
      return Upload.LIST_IGNORE;
    }
    setQrFile(file);
    message.success(`${file.name} selected successfully`);
    return false;
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    message.info("File removed");
  }, []);

  const handleRemoveQrFile = useCallback(() => {
    setQrFile(null);
    message.info("QR code removed");
  }, []);

  const validateDatesOnSubmit = (values) => {
    const { startdate, enddate, regstart, regend } = values;
    if (startdate && enddate && dayjs(startdate).isAfter(dayjs(enddate))) {
      throw new Error("Start date must be before end date");
    }
    if (regstart && regend && dayjs(regstart).isAfter(dayjs(regend))) {
      throw new Error("Registration start must be before registration end");
    }
    if (regend && startdate && dayjs(regend).isAfter(dayjs(startdate))) {
      throw new Error("Registration must end before hackathon starts");
    }
  };

  const validateTeamSizeOnSubmit = (values) => {
    const { minteam, maxteam } = values;
    if (minteam && maxteam && minteam > maxteam) {
      throw new Error("Minimum team size cannot exceed maximum team size");
    }
  };

  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Extract eventduration to startdate and enddate
        if (values.eventduration && Array.isArray(values.eventduration)) {
          values.startdate = values.eventduration[0];
          values.enddate = values.eventduration[1];
        }
        // Extract regduration to regstart and regend (same as event dates)
        if (values.regduration && Array.isArray(values.regduration)) {
          values.regstart = values.regduration[0];
          values.regend = values.regduration[1];
        } else {
          values.regstart = values.startdate;
          values.regend = values.enddate;
        }

        validateDatesOnSubmit(values);
        validateTeamSizeOnSubmit(values);

        if (!file) {
          toast.error("Please upload a hackathon poster");
          return;
        }

        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (!value) return;
          if (["startdate", "enddate", "regstart", "regend"].includes(key)) {
            formData.append(key, dayjs(value).toISOString());
          } else if (key === "rules" && Array.isArray(value)) {
            value.forEach((rule) => {
              if (rule.trim()) formData.append("rules[]", rule.trim());
            });
          } else {
            formData.append(key, value);
          }
        });
        // Only append file if it's a File object (not a URL object)
        if (file instanceof File) {
          formData.append("hackathonposter", file);
        }
        if (qrFile instanceof File) {
          formData.append("qrcode", qrFile);
        }

        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Authentication token not found. Please login again.");
          setLoading(false);
          return;
        }

        let endpoint, method, successMsg;
        if (isEdit) {
          endpoint = `${config.backendUrl}/hackathon/${id}`;
          method = "put";
          successMsg = "Hackathon updated successfully!";
        } else {
          endpoint = `${config.backendUrl}/hackathon/createhackathon`;
          method = "post";
          successMsg = "Hackathon published successfully!";
        }

        const response = await axios[method](endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        });

        toast.success(response.data.message || successMsg);
        if (isEdit) {
          setTimeout(() => navigate("/hackadmin/hackathons"), 1500);
        } else {
          form.resetFields();
          setFile(null);
          setQrFile(null);
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          (isEdit ? "Error updating hackathon" : "Error creating hackathon");
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [file, qrFile, form, isEdit, id, navigate]
  );

  const onFinish = useCallback(
    (values) => handleSubmit(values),
    [handleSubmit]
  );

  const handleReset = useCallback(() => {
    form.resetFields();
    setFile(null);
    setQrFile(null);
    message.info("Form reset successfully");
  }, [form]);

  return (
    <div>
      <div className="create-hackathon-page">
        <ToastContainer />
        <div className="form-container">
          {/* Header Row: Title/Subtitle and View Hackathons side by side */}
          <div className="header-row header-row-sidebyside">
            <div className="header-left">
              <Title level={2} style={{ marginBottom: 0 }}>
                {isEdit ? "Edit Hackathon" : "Create Hackathon"}
              </Title>
              <Text>
                {isEdit
                  ? "Update the hackathon details below"
                  : "Fill in the details below to create a new hackathon event"}
              </Text>
            </div>
            <div className="header-right header-right-align">
              <Button
                type="primary"
                onClick={() => navigate("/hackadmin/hackathons")}
              >
                View Hackathons
              </Button>
            </div>
          </div>
          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              college: "KIET",
              year: "Select Year",
              location: "Online",
              minteam: 2,
              maxteam: 5,
            }}
          >
            {/* Basic Info + Technology */}
            <Title level={4}>Basic Information</Title>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="hackathonname"
                  label="Hackathon Name"
                  rules={[
                    { required: true, message: "Please enter hackathon name" },
                    { min: 3, message: "At least 3 characters" },
                    { max: 100, message: "Cannot exceed 100 characters" },
                  ]}
                >
                  <Input placeholder="Enter hackathon name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="technology"
                  label="Technology/Theme"
                  rules={[
                    { required: true, message: "Please enter technology/theme" },
                    { min: 2, message: "At least 2 characters" },
                  ]}
                >
                  <Input placeholder="e.g., Web Development, AI/ML" />
                </Form.Item>
              </Col>
            </Row>

            {/* College & Year */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="college"
                  label="College"
                  rules={[{ required: true, message: "Please select college" }]}
                >
                  <Select placeholder="Select college">
                    {COLLEGE_OPTIONS.map((college) => (
                      <Option key={college} value={college}>
                        {college}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="year"
                  label="Target Year"
                  rules={[{ required: true, message: "Please select target year" }]}
                >
                  <Select placeholder="Select year">
                    {YEAR_OPTIONS.map((year) => (
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Description */}
            <Form.Item
              name="description"
              label="Description"
              rules={[
                { required: true, message: "Please enter description" },
                { min: 20, message: "At least 20 characters" },
                { max: 500, message: "Cannot exceed 500 characters" },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Describe your hackathon..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            {/* Combined Date, Prizes, Team, and Location Section */}
            <Divider />
            <Row gutter={24} className="date-team-location-row">
              {/* Date & Prizes Card */}
              <Col xs={24} md={12}>
                <Card
                  title={
                    <Title level={4} style={{ margin: 0 }}>
                      Date, Entry Fee & Prizes
                    </Title>
                  }
                  bordered={false}
                  className="date-team-location-card"
                >
                  {/* Date Configuration */}
                  <Form.Item
                    name="regduration"
                    label="Registration Duration"
                    rules={[
                      { required: true, message: "Please select registration duration" },
                    ]}
                  >
                    <RangePicker
                      showTime={{ format: "HH:mm" }}
                      format="YYYY-MM-DD HH:mm"
                      className="full-width-input"
                      placeholder={["Registration Start", "Registration End"]}
                      disabledDate={(current) =>
                        current && current < dayjs().startOf("day")
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    name="eventduration"
                    label="Event Duration"
                    rules={[{ required: true, message: "Please select event duration" }]}
                  >
                    <RangePicker
                      showTime={{ format: "HH:mm" }}
                      format="YYYY-MM-DD HH:mm"
                      className="full-width-input"
                      placeholder={["Event Start", "Event End"]}
                      disabledDate={(current) =>
                        current && current < dayjs().startOf("day")
                      }
                    />
                  </Form.Item>
                  {/* Prizes & Fee */}
                  <Row gutter={12}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="entryfee"
                        label="Entry Fee (₹)"
                        rules={[{ type: "number", message: "Cannot be negative" }]}
                      >
                        <InputNumber
                          placeholder="Entry Fee"
                          min={0}
                          className="full-width-input"
                          formatter={(value) =>
                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="firstprize"
                        label="First Prize"
                        rules={[{ required: true, message: "Enter first prize" }]}
                      >
                        <Input placeholder="e.g., ₹25,000" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="secondprize"
                        label="Second Prize"
                        rules={[{ required: true, message: "Enter second prize" }]}
                      >
                        <Input placeholder="e.g., ₹15,000" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="thirdprize"
                        label="Third Prize"
                        rules={[{ required: true, message: "Enter third prize" }]}
                      >
                        <Input placeholder="e.g., ₹10,000" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>
              {/* Team & Location Card (stacked inside one card) */}
              <Col xs={24} md={12}>
                <Card
                  title={
                    <Title level={4} style={{ margin: 0 }}>
                      Team & Location
                    </Title>
                  }
                  bordered={false}
                  className="date-team-location-card"
                >
                  {/* Team Configuration */}
                  <div className="team-location-inner">
                    <div className="team-config-section">
                      <Text strong style={{ fontSize: 16 }}>Team Configuration</Text>
                      <Row gutter={8} align="middle" style={{ marginTop: 8 }}>
                        <Col>
                          <Text>Team Size:</Text>
                        </Col>
                        <Col>
                          <Form.Item
                            name="minteam"
                            noStyle
                            rules={[
                              { required: true, message: "Please enter minimum size" },
                              { type: "number", min: 1 },
                            ]}
                          >
                            <InputNumber min={1} max={20} placeholder="Min" style={{ width: 70 }} />
                          </Form.Item>
                        </Col>
                        <Col>
                          <Text>to</Text>
                        </Col>
                        <Col>
                          <Form.Item
                            name="maxteam"
                            noStyle
                            rules={[
                              { required: true, message: "Please enter maximum size" },
                              { type: "number", min: 1 },
                            ]}
                          >
                            <InputNumber min={1} max={20} placeholder="Max" style={{ width: 70 }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Set the minimum and maximum number of members per team.
                      </Text>
                    </div>
                    <Divider style={{ margin: "16px 0" }} />
                    {/* Location Details */}
                    <div className="location-config-section">
                      <Text strong style={{ fontSize: 16 }}>Location Details</Text>
                      <Form.Item label="Event Mode" required style={{ marginBottom: 12, marginTop: 8 }}>
                        <Select
                          value={eventMode}
                          onChange={(val) => {
                            setEventMode(val);
                            form.setFieldsValue({
                              location: val === "Online" ? "Online" : "",
                              virtualeventlink: "",
                            });
                          }}
                          style={{ width: "100%" }}
                        >
                          <Option value="Online">Online</Option>
                          <Option value="Offline">Offline</Option>
                        </Select>
                      </Form.Item>
                      {eventMode === "Online" && (
                        <Form.Item
                          name="virtualeventlink"
                          label="Virtual Event Link"
                          rules={[
                            { type: "url", message: "Please enter a valid URL" },
                            { required: true, message: "Please enter virtual event link" },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="https://meet.google.com/abc-def-ghi" />
                        </Form.Item>
                      )}
                      {eventMode === "Offline" && (
                        <Form.Item
                          name="location"
                          label="Location"
                          rules={[
                            { required: true, message: "Please enter location" },
                            { min: 2, message: "At least 2 characters" },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="e.g., Mumbai" />
                        </Form.Item>
                      )}
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Choose event mode and specify location or link.
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Rules & Poster in Collapse */}
            <Divider />
            <Collapse>
              <Panel header="Rules and Media" key="rulesmedia">
                <Form.Item
                  name="rules"
                  label="Rules and Guidelines"
                  extra="Enter rules separated by commas or press Enter"
                >
                  <Select
                    mode="tags"
                    tokenSeparators={[","]}
                    placeholder="Add rules (e.g., Original work only)"
                    className="full-width-input"
                  />
                </Form.Item>
                <Form.Item
                  label="Hackathon Poster"
                  required
                  extra="Upload JPEG/PNG/WebP (Max 5MB)"
                >
                  <Upload
                    beforeUpload={beforeUpload}
                    onRemove={handleRemoveFile}
                    maxCount={1}
                    accept="image/*"
                    fileList={
                      file
                        ? [
                            {
                              uid: "-1",
                              name: file.name,
                              status: "done",
                              url: file.url || "",
                            },
                          ]
                        : []
                    }
                  >
                    <Button icon={<UploadOutlined />} disabled={!!file}>
                      {file ? "Poster Selected" : "Upload Poster"}
                    </Button>
                  </Upload>
                  {file && (
                    <div>
                      <Text type="success">
                        Selected: {file.name}
                        {file.size && ` (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                      </Text>
                    </div>
                  )}
                </Form.Item>
                <Form.Item
                  label="QR Code (optional)"
                  extra="Upload QR code image (JPEG/PNG/WebP, Max 5MB)"
                >
                  <Upload
                    beforeUpload={beforeUploadQr}
                    onRemove={handleRemoveQrFile}
                    maxCount={1}
                    accept="image/*"
                    fileList={
                      qrFile
                        ? [
                            {
                              uid: "-2",
                              name: qrFile.name,
                              status: "done",
                              url: qrFile.url || "",
                            },
                          ]
                        : []
                    }
                  >
                    <Button icon={<UploadOutlined />} disabled={!!qrFile}>
                      {qrFile ? "QR Code Selected" : "Upload QR Code"}
                    </Button>
                  </Upload>
                  {qrFile && (
                    <div>
                      <Text type="success">
                        Selected: {qrFile.name}
                        {qrFile.size && ` (${(qrFile.size / 1024 / 1024).toFixed(2)} MB)`}
                      </Text>
                    </div>
                  )}
                </Form.Item>
              </Panel>
            </Collapse>

            {/* Form Buttons aligned right */}
            <Divider />
            <Form.Item>
              <div className="form-buttons-right">
                <Space size="middle" wrap>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading
                      ? isEdit
                        ? "Updating..."
                        : "Publishing..."
                      : isEdit
                      ? "Update Hackathon"
                      : "Publish Hackathon"}
                  </Button>
                  <Button
                    type="primary"
                    icon={<ClearOutlined />}
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Reset Form
                  </Button>
                </Space>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default HackathonCreationPage;
