import React from "react";
import { Modal, Card, Button, Tag, Typography } from "antd";
import { SelectOutlined, DesktopOutlined } from "@ant-design/icons";

const { Text } = Typography;

const KioskModal = ({
  KioskModalVisible,
  onKioskCancel,
  activeKioskDeviceList,
  onSelectKioskDevice,
}) => {
  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <DesktopOutlined />
          <span>Kiosk Device Selection</span>
        </div>
      }
      open={KioskModalVisible}
      onCancel={onKioskCancel}
      footer={null}
      width={600}
      centered
      className="kiosk-device-modal"
    >
      <div className="kiosk-device-list">
        {activeKioskDeviceList?.map((device) => (
          <Card
            key={device.id}
            className="kiosk-device-card"
            hoverable
            style={{
              marginBottom: 16,
              borderColor: device.is_active ? "#52c41a" : "#ff4d4f",
            }}
          >
            <div
              className="device-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="device-info">
                <Text strong style={{ fontSize: "16px" }}>
                  {device.device_name}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={device.is_active ? "success" : "error"}>
                    {device.is_active ? "Active" : "Inactive"}
                  </Tag>
                </div>
              </div>

              <div
                className="device-actions"
                style={{ display: "flex", gap: 8 }}
              >
                <Button
                  type="primary"
                  icon={<SelectOutlined />}
                  onClick={() => onSelectKioskDevice(device)}
                  disabled={!device.is_active}
                >
                  Select Kiosk Device
                </Button>
              </div>
            </div>

            <div className="device-details" style={{ marginTop: 16 }}>
              <Text type="secondary">Serial No: {device.uniq_serial_no}</Text>
              <br />
              <Text type="secondary">
                Last Activated:{" "}
                {new Date(device.last_activated_at).toLocaleString()}
              </Text>
            </div>
          </Card>
        ))}
      </div>
    </Modal>
  );
};

export default KioskModal;
