import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Drawer,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";

const { Panel } = Collapse;

const NotificationModal = ({ visible, onClose }) => {
  // State variables
  const [messages, setMessages] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [isGettingApp, setIsGettingApp] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalDelVisible, setIsModalDelVisible] = useState(false);
  const [selectedApk, setSelectedApk] = useState(null);
  const [selectedActiveApk, setSelectedActiveApk] = useState([]);
  const [apkList, setApkList] = useState([]);
  const [activeApkList, setActiveApkList] = useState([]);
  const [isAppUploading, setIsAppUploading] = useState(false);

  const messageListRef = useRef(null);

  // Utility functions
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageStatusColor = (status) => {
    const statusColors = {
      success: "success",
      error: "error",
      pending: "warning",
      processing: "processing",
    };
    return statusColors[status] || "default";
  };

  const formatDetail = (detail) => {
    if (typeof detail === "object") {
      return JSON.stringify(detail, null, 2);
    }
    return detail;
  };

  // Action functions
  const clearMessages = () => {
    setMessages([]);
  };

  const fetchAppsList = (params) => {
    setIsFetchLoading(true);
    setIsWaitingForResponse(true);

    // Simulated API call
    setTimeout(() => {
      const newMessage = {
        message: `Fetching APK list with command: ${params.cmd}`,
        timestamp: new Date(),
        status: "success",
        align: "end",
      };

      setMessages([...messages, newMessage]);
      setIsFetchLoading(false);
      setIsWaitingForResponse(false);

      // Simulate fetched data
      setActiveApkList([
        { label: "App 1", value: "app1" },
        { label: "App 2", value: "app2" },
        { label: "App 3", value: "app3" },
      ]);
    }, 1000);
  };

  const getApks = () => {
    setIsGettingApp(true);

    // Simulated API call
    setTimeout(() => {
      setIsGettingApp(false);
      setIsModalVisible(true);

      // Simulate available APKs
      setApkList([
        { label: "Available App 1", value: "avail_app1" },
        { label: "Available App 2", value: "avail_app2" },
        { label: "Available App 3", value: "avail_app3" },
      ]);
    }, 1000);
  };

  const addApp = () => {
    if (!selectedApk) return;

    setIsAppUploading(true);

    // Simulated API call
    setTimeout(() => {
      const newMessage = {
        message: `Uploading APK: ${selectedApk}`,
        timestamp: new Date(),
        status: "success",
        align: "end",
        detail: { apk: selectedApk, status: "Uploaded successfully" },
      };

      setMessages([...messages, newMessage]);
      setIsAppUploading(false);
      setIsModalVisible(false);
      setSelectedApk(null);
    }, 1500);
  };

  const deleteApks = () => {
    setIsModalDelVisible(true);
  };

  const deleteApp = () => {
    if (selectedActiveApk.length === 0) return;

    setIsDeleteLoading(true);

    // Simulated API call
    setTimeout(() => {
      const newMessage = {
        message: `Deleting APKs: ${selectedActiveApk.join(", ")}`,
        timestamp: new Date(),
        status: "success",
        align: "end",
        detail: { deleted: selectedActiveApk, status: "Deleted successfully" },
      };

      setMessages([...messages, newMessage]);
      setIsDeleteLoading(false);
      setIsModalDelVisible(false);
      setSelectedActiveApk([]);
    }, 1500);
  };

  // Scroll to bottom of message list when messages update
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Drawer
      title={<h5 className="mb-0">Notifications</h5>}
      open={visible}
      onClose={onClose}
      closeIcon={null}
      width={600}
      className="simple-notification-modal"
      extra={
        <Space>
          <Tooltip placement="left" title="Clear messages">
            <Button type="primary" size="small" danger onClick={clearMessages}>
              Clear
            </Button>
          </Tooltip>
          <Button type="" size="small" onClick={onClose}>
            <Space size={4}>
              <CloseOutlined />
              <span>Close</span>
            </Space>
          </Button>
        </Space>
      }
      footer={
        <Space className="justify-content-center w-100">
          <Button
            type="primary"
            loading={isFetchLoading}
            disabled={isWaitingForResponse}
            onClick={() =>
              fetchAppsList({
                cmd: "list_apks",
                payload: {},
              })
            }
          >
            Fetch Apks
          </Button>
          <Button
            onClick={getApks}
            loading={isGettingApp}
            disabled={isWaitingForResponse}
          >
            Upload Apks
          </Button>
          <Button
            danger
            type="primary"
            onClick={deleteApks}
            loading={isDeleteLoading}
            disabled={isWaitingForResponse}
          >
            Delete Apks
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} className="device-content">
        {/* Message History */}
        <Col
          span={24}
          className={`message-container ${
            isWaitingForResponse ? "with-alert" : ""
          }`}
        >
          <div className="message-list" ref={messageListRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-item mb-3 ${
                  msg.align === "start" ? "message-received" : "message-sent"
                }`}
                style={{
                  maxWidth: "80%",
                  marginLeft: msg.align === "start" ? "0" : "auto",
                }}
              >
                <Card
                  size="small"
                  variant="borderless"
                  className={`rounded ${
                    msg.align === "start" ? "" : "bg-info-subtle"
                  }`}
                  title={
                    <div className="message-header">
                      <span className="message-timestamp">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <Tag
                        color={getMessageStatusColor(msg.status)}
                        className="ms-2 text-capitalize rounded"
                        style={{ marginLeft: "8px" }}
                      >
                        {msg.status}
                      </Tag>
                      {msg.ref && (
                        <span
                          className="message-ref"
                          style={{ marginLeft: "8px" }}
                        >
                          REF: {msg.ref}
                        </span>
                      )}
                    </div>
                  }
                >
                  <div className="message-content">
                    <div className="message-main">{msg.message}</div>
                    {msg.detail && (
                      <Collapse
                        ghost
                        className="message-detail"
                        style={{ marginTop: "8px" }}
                      >
                        <Panel header="View Details" key="1">
                          <pre>{formatDetail(msg.detail)}</pre>
                        </Panel>
                      </Collapse>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
          {isWaitingForResponse && (
            <Alert
              message="Waiting for PI to response..."
              type="info"
              showIcon
              banner
              className="response-alert"
            />
          )}
        </Col>
      </Row>

      {/* Select APKs Modal */}
      <Modal
        title={<span className="m-0 text-primary">Select Apks</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="40%"
        className="mb-3"
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Select
              placeholder="Select Apks"
              className="w-100"
              style={{ width: "100%" }}
              value={selectedApk}
              onChange={setSelectedApk}
              options={apkList}
            />
          </Col>
          <Col span={24} style={{ textAlign: "center" }}>
            <Button type="primary" onClick={addApp} loading={isAppUploading}>
              Upload
            </Button>
          </Col>
        </Row>
      </Modal>

      {/* Delete APKs Modal */}
      <Modal
        title={<span className="m-0 text-primary">Select Apks to Delete</span>}
        open={isModalDelVisible}
        onCancel={() => setIsModalDelVisible(false)}
        footer={null}
        width="40%"
        className="mb-3"
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Select
              mode="multiple"
              placeholder="Select Apks"
              className="w-100"
              style={{ width: "100%" }}
              value={selectedActiveApk}
              onChange={setSelectedActiveApk}
              options={activeApkList}
            />
          </Col>
          <Col span={24} style={{ textAlign: "center" }}>
            <Popconfirm
              title="Are you sure?"
              okText="Yes"
              cancelText="No"
              onConfirm={deleteApp}
            >
              <Button type="primary">Delete</Button>
            </Popconfirm>
          </Col>
        </Row>
      </Modal>
    </Drawer>
  );
};

export default NotificationModal;
