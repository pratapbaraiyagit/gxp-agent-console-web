import { Button, Modal, Divider } from "antd";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectLatestMessage } from "../../redux/reducers/MQTT/mqttSlice";
import { cashRecyclerConsoleMQTTAction } from "../../redux/reducers/MQTT/cashRecyclerConsoleMQTT";

const EmptyCashBoxModal = ({ visible, onClose, kioskRepsonse }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const latestMessage = useSelector(selectLatestMessage);

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  // Start loading when empty_cashbox transaction starts
  useEffect(() => {
    if (
      kioskRepsonse?.payload?.command_data?.transaction_type === "empty_cashbox"
    ) {
      setLoading(true);
      setShowConfirmation(false);
      setErrorMessage("");
    }
  }, [kioskRepsonse?.payload?.command_data?.transaction_type]);

  // Handle null/undefined kioskResponse only when loading
  useEffect(() => {
    if (!kioskRepsonse?.payload?.command_data && loading && !showConfirmation) {
      // Set 15 second timeout when we get null response
      const timeout = setTimeout(() => {
        setLoading(false);
        setErrorMessage(
          "Request timeout. No response received. Please try again later."
        );
      }, 15000);

      // Store timeout ID to clear it later
      window.emptyCashboxTimeout = timeout;

      return () => clearTimeout(timeout);
    }
  }, [kioskRepsonse, loading, showConfirmation]);

  // Handle success and error responses
  useEffect(() => {
    if (
      kioskRepsonse?.payload?.command_message === "Cashbox empty successfully."
    ) {
      // Clear timeout when we get success response
      if (window.emptyCashboxTimeout) {
        clearTimeout(window.emptyCashboxTimeout);
        window.emptyCashboxTimeout = null;
      }
      setLoading(false);
      setErrorMessage("");
    } else if (kioskRepsonse?.payload?.command_result === "error") {
      // Clear timeout when we get error response
      if (window.emptyCashboxTimeout) {
        clearTimeout(window.emptyCashboxTimeout);
        window.emptyCashboxTimeout = null;
      }
      setLoading(false);
      setErrorMessage(
        kioskRepsonse?.payload?.command_message ||
          "An error occurred during the process."
      );
    }
  }, [
    kioskRepsonse?.payload?.command_message,
    kioskRepsonse?.payload?.command_result,
  ]);

  const handleConfirmEmpty = () => {
    dispatch(
      cashRecyclerConsoleMQTTAction({
        cmd: "empty_cashbox",
        payload: {},
        device_uuid_list: deviceIds,
      })
    );
    setShowConfirmation(false);
    setLoading(true);
    setErrorMessage("");
  };

  const handleCancel = () => {
    // Clear timeout when modal is closed
    if (window.emptyCashboxTimeout) {
      clearTimeout(window.emptyCashboxTimeout);
      window.emptyCashboxTimeout = null;
    }
    setShowConfirmation(true);
    setLoading(false);
    setErrorMessage("");
    onClose();
  };

  const renderConfirmationContent = () => (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Empty Cash Box</h2>
      <p style={{ marginBottom: "30px", fontSize: "16px" }}>
        Are you sure you want to process empty cashbox?
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <Button
          type="primary"
          onClick={handleConfirmEmpty}
          style={{ minWidth: "80px" }}
        >
          Yes
        </Button>
        <Button onClick={handleCancel} style={{ minWidth: "80px" }}>
          No
        </Button>
      </div>
    </div>
  );

  const renderProcessingContent = () => (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <h2 style={{ fontSize: "20px", marginBottom: "30px" }}>
        Empty Cash Box Process
      </h2>

      {loading && (
        <div style={{ marginBottom: "30px" }}>
          <div
            className="loading-spinner"
            style={{
              display: "inline-block",
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #1890ff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "15px",
            }}
          ></div>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Processing empty cashbox...
          </p>
        </div>
      )}

      {errorMessage && (
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              padding: "15px",
              backgroundColor: "#fff2f0",
              border: "1px solid #ffccc7",
              borderRadius: "6px",
              marginBottom: "15px",
            }}
          >
            <p style={{ fontSize: "16px", color: "#ff4d4f", margin: 0 }}>
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      <Button
        danger
        onClick={handleCancel}
        disabled={loading}
        style={{ minWidth: "100px" }}
      >
        {loading ? "Processing..." : "Close"}
      </Button>
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <Modal
        open={visible}
        onCancel={loading ? undefined : onClose}
        footer={null}
        width={"35%"}
        centered
        wrapClassName="cash-modal"
        closable={!loading}
        maskClosable={!loading}
        style={{ marginLeft: "auto", marginRight: "4%" }}
      >
        {showConfirmation
          ? renderConfirmationContent()
          : renderProcessingContent()}
      </Modal>
    </>
  );
};

export default EmptyCashBoxModal;
