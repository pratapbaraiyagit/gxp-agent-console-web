import { Button, Card, Col, Modal, Row, Spin, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { getSessionItem } from "../../hooks/session";
import { kioskMQTTAction } from "../../redux/reducers/MQTT/kioskMQTT";
import { useDispatch } from "react-redux";

const SettingsModal = ({
  visible,
  onCancel,
  deviceStatuses,
  toggleDeviceStatus,
  onRestartDevice,
  isIdScannerLoading,
  isKeyELoading,
  isServiceStatusLoading,
  isKeyDLoading,
  isCashRecyclerLoading,
  deviceIdScannerLoading,
  getIDStatusTimer,
  restartIDTimer,
  getEncoderTimer,
  restartEncoderTimer,
  getDispenderTimer,
  restartDispenderTimer,
  getCashTimer,
  restartCashTimer,
  getServiceTimer,
  restartServiceTimer,
  deviceId,
  userHotelSession,
  kioskStatus,
}) => {
  const dispatch = useDispatch();
  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const [kioskLoading, setKioskLoading] = useState(false);
  const [kioskGetStatusTimer, setKioskGetStatusTimer] = useState(0);

  useEffect(() => {
    if (kioskStatus) {
      setKioskLoading(false);
    }
  }, [kioskStatus]);

  useEffect(() => {
    let interval;
    if (kioskGetStatusTimer > 0) {
      interval = setInterval(() => {
        setKioskGetStatusTimer((prev) => {
          if (prev === 1) {
            setKioskLoading(false); // stop loading when timer ends
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [kioskGetStatusTimer]);

  const DeviceCard = ({
    title,
    status,
    onRefresh,
    showRestart = true,
    onRestart,
    isLoading,
    is_active,
    isGetStatusTimer,
    isRestartedTimer,
  }) => {
    return (
      <Card size="small" className="text-center h-100">
        <div className="">
          <span className="mx-auto">{title}</span>
          {is_active && (
            <>
              {!status && onRefresh && !isLoading && (
                <Tooltip placement="bottom" title="Get Status">
                  <ReloadOutlined
                    className="ms-auto text-primary float-end"
                    onClick={onRefresh}
                  />
                </Tooltip>
              )}
            </>
          )}
          {onRefresh && isLoading && (
            <ReloadOutlined
              className="ms-auto text-gray float-end"
              style={{ color: "#d9d9d9", cursor: "not-allowed" }}
            />
          )}
        </div>
        {isLoading && <Spin size="small" className="text-primary" />}
        {isLoading ? (
          <div
            className={`my-3 ${
              isLoading
                ? "text-warning"
                : status
                ? "text-success"
                : "text-danger"
            }`}
          >
            {isGetStatusTimer
              ? `Getting Status... (${isGetStatusTimer}s)`
              : null}
            {isRestartedTimer ? `Restarting... (${isRestartedTimer}s)` : null}
          </div>
        ) : (
          <>
            {is_active ? (
              <>
                <div
                  className={`my-3 ${status ? "text-success" : "text-danger"}`}
                >
                  {status ? "Online" : "Offline"}
                </div>
                {showRestart && (
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={onRestart}
                  >
                    Restart
                  </Button>
                )}
              </>
            ) : (
              <div className={`my-4 `}>
                <span className="text-danger">{title} (Unavailable)</span>
              </div>
            )}
          </>
        )}
      </Card>
    );
  };

  return (
    <Modal
      title={<h4 className="text-center mb-3">KIOSK DEVICE SETTINGS</h4>}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      centered
      className="settings-modal"
      closable={true}
    >
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <DeviceCard
            title="Kiosk Status"
            isLoading={kioskLoading}
            status={deviceStatuses.kiosk}
            onRefresh={() => {
              setKioskLoading(true);
              setKioskGetStatusTimer(10); // start countdown
              const paramsData = {
                cmd: "kiosk_online",
                device_uuid_list: [deviceId],
                payload: { agent_user_id: userHotelSession?.id },
              };
              dispatch(kioskMQTTAction(paramsData));
            }}
            is_active="true"
            showRestart={false}
            isGetStatusTimer={kioskGetStatusTimer}
          />
        </Col>

        {kioskSession?.[0]?.service_status_config?.is_active && (
          <Col span={6}>
            <DeviceCard
              title="Service Status"
              isLoading={isServiceStatusLoading}
              status={deviceStatuses.service_status}
              onRefresh={() => {
                toggleDeviceStatus("service_status");
              }}
              onRestart={() => {
                onRestartDevice("service_status");
              }}
              is_active={kioskSession?.[0]?.service_status_config?.is_active}
              showRestart={false}
              isRestartedTimer={restartServiceTimer}
              isGetStatusTimer={getServiceTimer}
            />
          </Col>
        )}
        {kioskSession?.[0]?.id_scanner_config?.is_active && (
          <Col span={6}>
            <DeviceCard
              title="ID SCANNER"
              isLoading={deviceIdScannerLoading}
              status={deviceStatuses.id_scanner}
              onRefresh={() => {
                toggleDeviceStatus("id_scanner");
              }}
              onRestart={() => {
                onRestartDevice("id_scanner");
              }}
              is_active={kioskSession?.[0]?.id_scanner_config?.is_active}
              isRestartedTimer={restartIDTimer}
              isGetStatusTimer={getIDStatusTimer}
            />
          </Col>
        )}
        {kioskSession?.[0]?.key_encoder_config?.is_active && (
          <Col span={6}>
            <DeviceCard
              title="KEY ENCODER"
              isLoading={isKeyELoading}
              status={deviceStatuses.key_encoder}
              onRefresh={() => {
                toggleDeviceStatus("key_encoder");
              }}
              onRestart={() => {
                onRestartDevice("key_encoder");
              }}
              is_active={kioskSession?.[0]?.key_encoder_config?.is_active}
              isRestartedTimer={restartEncoderTimer}
              isGetStatusTimer={getEncoderTimer}
            />
          </Col>
        )}

        {kioskSession?.[0]?.key_dispenser_config?.is_active && (
          <Col span={6}>
            <DeviceCard
              title="KEY DISPENSER"
              isLoading={isKeyDLoading}
              status={deviceStatuses.key_dispenser}
              onRefresh={() => {
                toggleDeviceStatus("key_dispenser");
              }}
              onRestart={() => {
                onRestartDevice("key_dispenser");
              }}
              is_active={kioskSession?.[0]?.key_dispenser_config?.is_active}
              isRestartedTimer={restartDispenderTimer}
              isGetStatusTimer={getDispenderTimer}
            />
          </Col>
        )}

        {kioskSession?.[0]?.cash_recycler_config?.is_active && (
          <Col span={6}>
            <DeviceCard
              title="CASH RECYCLER"
              status={deviceStatuses.cash_recycler}
              isLoading={isCashRecyclerLoading}
              onRefresh={() => {
                toggleDeviceStatus("cash_recycler");
              }}
              onRestart={() => {
                onRestartDevice("cash_recycler");
              }}
              is_active={kioskSession?.[0]?.cash_recycler_config?.is_active}
              isRestartedTimer={restartCashTimer}
              isGetStatusTimer={getCashTimer}
            />
          </Col>
        )}

        {/* <Col span={6}>
          <DeviceCard
            title="PRINTER"
            status={deviceStatuses.printer}
            onRefresh={() => {
              toggleDeviceStatus("printer");
            }}
            onRestart={() => {
              onRestartDevice("printer");
            }}
            is_active={kioskSession?.[0]?.printer_config?.is_active}
          />
        </Col> */}

        {/* <Col span={6}>
          <DeviceCard
            title="CC TERMINAL"
            status={deviceStatuses.terminal}
            onRefresh={() => {
              toggleDeviceStatus("kiosk");
            }}
            onRestart={() => {
              onRestartDevice("CCTerminal");
            }}
            // is_active={kioskSession?.[0]?.cash_recycler_config?.is_active}
          />
        </Col> */}

        {/* <Col span={6}>
          <DeviceCard
            title="USB HUB"
            status={false}
            onRefresh={null}
            showRestart={false}
            is_active={kioskSession?.[0]?.usb_hub_config?.is_active}
          />
        </Col> */}
      </Row>
    </Modal>
  );
};

export default SettingsModal;
