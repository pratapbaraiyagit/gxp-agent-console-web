import {
  Button,
  Card,
  Col,
  Flex,
  message,
  Modal,
  Row,
  Skeleton,
  Space,
  Tooltip,
  Typography,
  Badge,
  Divider,
  Input,
  Empty,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getKioskDeviceListData } from "../../redux/reducers/Kiosk/KioskDevice";
import { getSessionItem } from "../../hooks/session";
import {
  CopyOutlined,
  EditOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Text, Title } = Typography;

const KioskActivationModal = ({ visible, onCancel }) => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");

  const userData = getSessionItem("UserSessionCRM");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const {
    activeKioskDeviceList,
    kioskDeviceLoading,
  } = useSelector(({ kioskDevice }) => kioskDevice);

  useEffect(() => {
    if (visible) dispatch(getKioskDeviceListData());
  }, [visible]);

  const handleKioskRefresh = () => {
    dispatch(getKioskDeviceListData());
    message.success("Kiosk data refreshed successfully!");
  };

  const copyToClipboard = (loginCode, deviceName) => {
    navigator.clipboard
      .writeText(loginCode)
      .then(() => {
        message.success(
          `Activation code for ${deviceName} copied to clipboard!`
        );
      })
      .catch(() => {
        message.error("Failed to copy activation code");
      });
  };

  // Filter kiosks based on search text
  const filteredKioskList = activeKioskDeviceList?.filter(
    (device) =>
      device.device_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      device.hotel_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      device.login_code?.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusBadge = (lastActivated) => {
    const daysSinceActivation = moment().diff(moment(lastActivated), "days");

    if (daysSinceActivation <= 1) {
      return <Badge status="success" text="Recently Active" />;
    } else if (daysSinceActivation <= 7) {
      return <Badge status="warning" text="Active This Week" />;
    } else {
      return <Badge status="error" text="Inactive" />;
    }
  };

  const renderKioskCard = (data, index) => (
    <Col xs={24} sm={12} lg={10} xl={10} key={index}>
      <Card
        className="kiosk-card"
        style={{
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
          border: "1px solid #f0f0f0",
        }}
        hoverable
        bodyStyle={{ padding: "20px" }}
      >
        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <Flex align="center" justify="space-between">
            <div>
              <Title level={5} className="text-primary">
                <QrcodeOutlined style={{ marginRight: "8px" }} />
                {data.device_name}
              </Title>
              <div style={{ marginTop: "4px" }}>
                {getStatusBadge(data.last_activated_at)}
              </div>
            </div>
            <Space>
              <Tooltip title="Refresh Data">
                <Button
                  icon={<ReloadOutlined />}
                  type="text"
                  size="small"
                  onClick={handleKioskRefresh}
                  style={{ color: "#52c41a" }}
                />
              </Tooltip>
              {userSession?.user_type === "gxp_staff" && (
                <Tooltip title="Edit Device">
                  <Button
                    icon={<EditOutlined />}
                    type="text"
                    size="small"
                    style={{ color: "#1890ff" }}
                  />
                </Tooltip>
              )}
            </Space>
          </Flex>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Content */}
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Hotel Name */}
          <div>
            <Text
              type="secondary"
              style={{ fontSize: "12px", display: "block" }}
            >
              <HomeOutlined style={{ marginRight: "4px" }} />
              HOTEL
            </Text>
            <Text strong style={{ fontSize: "14px", color: "#262626" }}>
              {data?.hotel_name || "No hotel assigned"}
            </Text>
          </div>

          {/* Activation Code */}
          <div>
            <Text
              type="secondary"
              style={{ fontSize: "12px", display: "block" }}
            >
              ACTIVATION CODE
            </Text>
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "4px",
              }}
            >
              <Text
                code
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#52c41a",
                  fontFamily: "Monaco, Consolas, monospace",
                }}
              >
                {data.login_code}
              </Text>
              <Button
                icon={<CopyOutlined />}
                type="primary"
                size="small"
                onClick={() =>
                  copyToClipboard(data.login_code, data.device_name)
                }
                style={{
                  borderRadius: "6px",
                  height: "32px",
                  minWidth: "32px",
                }}
              />
            </div>
          </div>

          {/* Timestamps */}
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: "11px", display: "block" }}
                >
                  <ClockCircleOutlined style={{ marginRight: "4px" }} />
                  Model Name
                </Text>
                <Text style={{ fontSize: "12px", fontWeight: "500" }}>
                  {data?.model_name}
                </Text>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text
                  type="secondary"
                  style={{ fontSize: "11px", display: "block" }}
                >
                  <CheckCircleOutlined style={{ marginRight: "4px" }} />
                  LAST ACTIVE
                </Text>
                <Text style={{ fontSize: "12px", fontWeight: "500" }}>
                  {data?.last_activated_at
                    ? moment(data.last_activated_at).format("MMM DD, YYYY")
                    : "Never"}
                </Text>
              </div>
            </Col>
          </Row>
        </Space>
      </Card>
    </Col>
  );

  const renderEmptyState = () => (
    <Col span={24}>
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Text type="secondary" style={{ fontSize: "16px" }}>
                {searchText
                  ? "No kiosks found matching your search"
                  : "No kiosks available"}
              </Text>
              {searchText && (
                <div style={{ marginTop: "8px" }}>
                  <Button type="link" onClick={() => setSearchText("")}>
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          }
        />
      </div>
    </Col>
  );

  const renderLoadingSkeleton = () => (
    <Row gutter={[16, 16]}>
      {[1, 2].map((item) => (
        <Col xs={24} sm={12} lg={12} xl={12} key={item}>
          <Card style={{ borderRadius: "12px" }}>
            <Skeleton active paragraph={{ rows: 3 }} />
            <div style={{ marginTop: "16px" }}>
              <Skeleton.Button active size="small" style={{ width: "100%" }} />
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <Modal
      title={
        <div style={{ textAlign: "center", paddingBottom: "8px" }}>
          <Title
            level={3}
            className="text-primary"
          >
            <QrcodeOutlined style={{ marginRight: "12px" }} />
            Kiosk Management
          </Title>
          <Text type="secondary" style={{ fontSize: "14px" }}>
            Manage and monitor your kiosk devices
          </Text>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      className="kiosk-settings-modal"
      closable={true}
      styles={{
        header: {
          borderBottom: "1px solid #f0f0f0",
          paddingBottom: "20px",
        },
        body: {
          paddingTop: "12px",
        },
      }}
    >
      <div>
        {/* Content */}
        {kioskDeviceLoading ? (
          renderLoadingSkeleton()
        ) : (
          <Row gutter={[16, 16]}>
            {filteredKioskList?.length > 0
              ? filteredKioskList.map(renderKioskCard)
              : renderEmptyState()}
          </Row>
        )}
      </div>

      <style jsx>{`
        .kiosk-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
        }

        .ant-modal-header {
          text-align: center;
        }

        .ant-empty-img-simple {
          margin-bottom: 16px;
        }
      `}</style>
    </Modal>
  );
};

export default KioskActivationModal;