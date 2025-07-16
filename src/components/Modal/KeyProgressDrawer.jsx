import React, { useState, useEffect, useRef } from "react";
import { Drawer, Steps, Space, Button, Alert, Typography, Tag } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  KeyOutlined,
  CreditCardOutlined,
  EditOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Step } = Steps;
const { Title, Text } = Typography;

const KeyProgressDrawer = ({
  visible,
  onClose,
  issueKeyData,
  dispatch,
  kioskMQTTAction,
  deviceIds,
  hotelSession,
  kioskResponse,
  loading,
  activeHotelRoomList,
}) => {
  const [netWorkIssues, setNetWorkIssues] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({
    issueKey: "wait",
    sendWriteKey: "wait",
    writeKey: "wait",
    keyOut: "wait",
  });
  const [errorDetails, setErrorDetails] = useState(null);
  const [hasErrorOccurred, setHasErrorOccurred] = useState(false);
  const [isTimeoutError, setIsTimeoutError] = useState(false);

  // Timeout refs for each step
  const timeoutRefs = useRef({
    issueKey: null,
    sendWriteKey: null,
    writeKey: null,
    keyOut: null,
  });

  // Define the steps for the key issuing process
  const steps = [
    {
      title: "Issue Key",
      description: "Initiating key issue process",
      icon: <KeyOutlined />,
      key: "issueKey",
    },
    {
      title: "Send Write Key",
      description: "Sending key write command",
      icon: <EditOutlined />,
      key: "sendWriteKey",
    },
    {
      title: "Write Key",
      description: "Writing key data to card",
      icon: <CreditCardOutlined />,
      key: "writeKey",
    },
    {
      title: "Key Out",
      description: "Dispensing the key card",
      icon: <ExportOutlined />,
      key: "keyOut",
    },
  ];

  // Clear all timeouts
  const clearAllTimeouts = () => {
    Object.keys(timeoutRefs.current).forEach((key) => {
      if (timeoutRefs.current[key]) {
        clearTimeout(timeoutRefs.current[key]);
        timeoutRefs.current[key] = null;
      }
    });
  };

  // Set timeout for a specific step
  const setStepTimeout = (stepKey) => {
    // Clear existing timeout for this step
    if (timeoutRefs.current[stepKey]) {
      clearTimeout(timeoutRefs.current[stepKey]);
    }

    // Set new timeout
    timeoutRefs.current[stepKey] = setTimeout(() => {
      updateStepStatus(stepKey, "error");
      setErrorDetails(
        "Request timeout. No response received. Please try again later."
      );
      setHasErrorOccurred(true);
      setIsTimeoutError(true);
    }, 35000);
  };

  // Clear timeout for a specific step
  const clearStepTimeout = (stepKey) => {
    if (timeoutRefs.current[stepKey]) {
      clearTimeout(timeoutRefs.current[stepKey]);
      timeoutRefs.current[stepKey] = null;
    }
  };

  // Update step status based on MQTT responses
  useEffect(() => {
    if (kioskResponse && visible) {
      const { cmd, response } = kioskResponse;
      const status = response?.status;

      switch (cmd) {
        case "mqtt_disconnect":
          clearStepTimeout("issueKey");
          if (status) {
            updateStepStatus("issueKey", "wait");
            setNetWorkIssues(true);
          } else {
            updateStepStatus("issueKey", "error");
            setErrorDetails(response?.message || "Key dispensing failed");
            setHasErrorOccurred(true);
          }
          break;

        case "issue_key":
          clearStepTimeout("issueKey");
          if (status) {
            if (response?.data?.status_mode === "issue_key") {
              // Key dispensed successfully
              clearAllTimeouts();
              updateStepStatus("keyOut", "finish");
              setCurrentStep(4);
            } else {
              // Issue key command initiated
              updateStepStatus("issueKey", "finish");
              // updateStepStatus("sendWriteKey", "process");
              setCurrentStep(1);
              // Set timeout for next step
              setStepTimeout("sendWriteKey");
            }
          } else {
            updateStepStatus("issueKey", "error");
            setErrorDetails(response?.message || "Key dispensing failed");
            setHasErrorOccurred(true);
          }
          break;

        case "ui_write":
          clearStepTimeout("sendWriteKey");
          if (status) {
            updateStepStatus("sendWriteKey", "finish");
            // updateStepStatus("writeKey", "process");
            setCurrentStep(2);
            // Set timeout for next step
            setStepTimeout("writeKey");
          } else {
            updateStepStatus("sendWriteKey", "error");
            updateStepStatus("issueKey", "error");
            setErrorDetails(response?.message || "Send write key failed");
            setHasErrorOccurred(true);
          }
          break;

        case "write_key":
          clearStepTimeout("writeKey");
          if (status) {
            updateStepStatus("writeKey", "finish");
            updateStepStatus("keyOut", "process");
            setCurrentStep(3);
            // Set timeout for final step
            setStepTimeout("keyOut");
          } else {
            updateStepStatus("writeKey", "error");
            updateStepStatus("issueKey", "error");
            setErrorDetails(response?.message || "Write key failed");
            setHasErrorOccurred(true);
          }
          break;

        default:
          break;
      }
    }
  }, [kioskResponse, visible]);

  const updateStepStatus = (stepKey, status) => {
    setStepStatus((prev) => ({
      ...prev,
      [stepKey]: status,
    }));
  };

  // Reset states when drawer opens
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setStepStatus({
        issueKey: "process",
        sendWriteKey: "wait",
        writeKey: "wait",
        keyOut: "wait",
      });
      setErrorDetails(null);
      setHasErrorOccurred(false);
      setNetWorkIssues(false);
      setIsTimeoutError(false);

      // Start the key issuing process
      startKeyProcess();
    } else {
      // Clear all timeouts when drawer closes
      clearAllTimeouts();
    }
  }, [visible]);

  // Cleanup timeouts on component unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  const startKeyProcess = () => {
    if (issueKeyData?.room_number) {
      // Set timeout for the first step
      setStepTimeout("issueKey");

      dispatch(
        kioskMQTTAction({
          cmd: "issue_key",
          device_uuid_list: deviceIds,
          payload: {
            building: "1",
            building_lock_id: issueKeyData?.building_lock_id || "1",
            floor: "1",
            floor_lock_id: issueKeyData?.floor_lock_id || "1",
            room_no: issueKeyData.room_number,
            room_lock_id: issueKeyData?.room_lock_id || "1",
            check_in_date: issueKeyData.check_in_date,
            check_in_time: moment(
              issueKeyData?.check_in_time,
              "HH:mm:ss"
            ).format("HH:mm"),
            check_out_date: issueKeyData.check_out_date,
            check_out_time: moment(
              issueKeyData?.check_out_time,
              "HH:mm:ss"
            ).format("HH:mm"),
            is_duplicate: true,
            meta: {},
          },
        })
      );
    }
  };

  const retryProcess = () => {
    // Clear all existing timeouts
    clearAllTimeouts();

    // Reset error state and retry
    setErrorDetails(null);
    setHasErrorOccurred(false);
    setIsTimeoutError(false);
    setStepStatus({
      issueKey: "process",
      sendWriteKey: "wait",
      writeKey: "wait",
      keyOut: "wait",
    });
    setCurrentStep(0);
    startKeyProcess();
  };

  const handleClose = () => {
    // Clear all timeouts before closing
    clearAllTimeouts();
    onClose();
  };

  const getStepIcon = (stepKey) => {
    const status = stepStatus[stepKey];
    switch (status) {
      case "finish":
        return <CheckCircleFilled style={{ color: "#52c41a", fontSize: 24 }} />;
      case "error":
        return <CloseCircleFilled style={{ color: "#ff4d4f", fontSize: 24 }} />;
      case "process":
        return <LoadingOutlined style={{ fontSize: 24 }} />;
      default:
        return null;
    }
  };

  // Render header action buttons
  const renderHeaderButtons = () => {
    if (
      (hasErrorOccurred && stepStatus.keyOut !== "finish") ||
      isTimeoutError
    ) {
      return (
        <Space>
          <Button type="primary" danger onClick={retryProcess}>
            Retry
          </Button>
          <Button onClick={handleClose}>Cancel</Button>
        </Space>
      );
    }

    if (stepStatus.keyOut === "finish") {
      return <Button onClick={handleClose}>Done</Button>;
    }

    return null;
  };

  return (
    <Drawer
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Space>
            <KeyOutlined />
            <span>Key Progress - Room {issueKeyData?.room_number}</span>
          </Space>
          {renderHeaderButtons()}
        </div>
      }
      placement="right"
      width={500}
      open={visible}
      onClose={handleClose}
      closable={false}
      maskClosable={false}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Room Information */}
        <div
          style={{
            background: "#f5f5f5",
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <Title level={5} style={{ marginBottom: 12 }}>
            Key Information
          </Title>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>Room Number:</Text>{" "}
              <Tag color="blue">{issueKeyData?.room_number}</Tag>
            </div>
            <div>
              <Text strong>Check-in:</Text>{" "}
              {moment(issueKeyData?.check_in_date).format("MMM DD, YYYY")}
            </div>
            <div>
              <Text strong>Check-out:</Text>{" "}
              {moment(issueKeyData?.check_out_date).format("MMM DD, YYYY")}
            </div>
          </Space>
        </div>

        {/* Progress Steps */}
        <Steps
          current={currentStep}
          direction="vertical"
          size="small"
          items={steps.map((step, index) => ({
            title: step.title,
            description: step.description,
            status: stepStatus[step.key],
            icon: getStepIcon(step.key) || step.icon,
          }))}
        />

        {/* Error Alert */}
        {errorDetails && (
          <Alert
            message={isTimeoutError ? "Request Timeout" : "Error Occurred"}
            description={
              <Space direction="vertical">
                <Text>{errorDetails}</Text>
                <Text type="secondary">
                  {isTimeoutError
                    ? "The operation timed out. Please check the connection and try again."
                    : "Please check the key dispenser connection and try again."}
                </Text>
              </Space>
            }
            type="error"
            showIcon
            closable
            onClose={() => {
              setErrorDetails(null);
              setIsTimeoutError(false);
            }}
          />
        )}

        {/* Success Message */}
        {stepStatus.keyOut === "finish" && (
          <Alert
            message="Key Issued Successfully!"
            description={`The key for room ${issueKeyData?.room_number} has been dispensed.`}
            type="success"
            showIcon
          />
        )}
        {netWorkIssues && (
          <Alert
            message="Network Issue Detected"
            description={`There was a problem while processing the request for room ${issueKeyData?.room_number}. Please check your connection and try again.`}
            type="error"
            showIcon
          />
        )}
      </Space>
    </Drawer>
  );
};

export default KeyProgressDrawer;
