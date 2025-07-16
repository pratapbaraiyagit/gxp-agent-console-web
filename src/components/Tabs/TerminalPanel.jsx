import React from "react";
import { Typography, Button, Flex, Card } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import { callMQTTAction } from "../../redux/reducers/MQTT/callMQTT";
import { getSessionItem } from "../../hooks/session";

/**
 * TerminalPanel Component
 *
 * This component provides the interface for the credit card terminal,
 * allowing the agent to initiate payment processing.
 */
const TerminalPanel = ({
  deviceId,
  userSession,
  kioskMQTTAction,
  dispatch,
  loading,
}) => {
  const UserSessionAgentConsole = getSessionItem("UserSessionAgentConsole");

  const userHotelSession = UserSessionAgentConsole
    ? JSON.parse(decodeURIComponent(escape(atob(UserSessionAgentConsole))))
    : null;

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const handleProcessTerminal = async () => {
    try {
      dispatch(
        callMQTTAction({
          cmd: "live",
          payload: {
            agent_user_id: userHotelSession?.id,
          },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );

      const paramsData = {
        cmd: "request_terminal",
        device_uuid_list: [deviceId],
        payload: { agent_user_id: userSession?.id },
      };

      dispatch(kioskMQTTAction(paramsData));
    } catch (error) {
      // console.error("Error initiating terminal request:", error);
    }
  };

  return (
    <Card className="credit-card-terminal-container p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4">
      <div className="text-center mb-4">
        <CreditCardOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
        <Typography.Title level={4} className="mt-3 mb-1">
          Credit Card Terminal
        </Typography.Title>
        <Typography.Paragraph className="text-muted">
          Process credit card payments through the connected terminal device
        </Typography.Paragraph>
      </div>

      <div className="terminal-info mb-4">
        <div className="d-flex justify-content-between mb-2">
          <Typography.Text strong>Terminal Status:</Typography.Text>
          <Typography.Text type="success">Ready</Typography.Text>
        </div>
        <div className="d-flex justify-content-between">
          <Typography.Text strong>Connection:</Typography.Text>
          <Typography.Text type="success">Connected</Typography.Text>
        </div>
      </div>

      <Flex vertical gap={12}>
        <Button
          block
          size="large"
          type="primary"
          className="col"
          icon={<CreditCardOutlined />}
          onClick={handleProcessTerminal}
          loading={loading?.terminal}
        >
          {loading?.terminal ? "Processing..." : "Process Payment"}
        </Button>

        <Typography.Paragraph className="text-muted text-center mb-0 small">
          Clicking this button will activate the payment terminal at the kiosk.
          The guest will be prompted to insert/tap their card to complete
          payment.
        </Typography.Paragraph>
      </Flex>
    </Card>
  );
};

export default TerminalPanel;
