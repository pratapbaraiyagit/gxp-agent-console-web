import { Modal } from "antd";
import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectLatestMessage } from "../../redux/reducers/MQTT/mqttSlice";
import { getSessionItem, setSessionItem } from "../../hooks/session";

const SelfieModal = ({
  visible,
  setSelfieVisible,
  setLoadingcmd,
  currentModel,
  setCurrentModel,
}) => {
  const [selfieFullscreenVisible, setSelfieFullscreenVisible] = useState(false);

  // Get the latest message from Redux
  const latestMessage = useSelector(selectLatestMessage);

  // Retrieve stored images from session
  const drawSign = getSessionItem("draw_sign");
  const captureSelfie = getSessionItem("capture_selfie");
  const screenCapture = getSessionItem("screen_capture");

  // Parse the latest message into a JSON object
  const kioskResponse = useMemo(() => {
    if (latestMessage?.message) {
      try {
        return JSON.parse(latestMessage.message);
      } catch {
        return null;
      }
    }
    return null;
  }, [latestMessage]);

  // Handle responses for selfie, signature, and screen capture
  useEffect(() => {
    const cmd = kioskResponse?.cmd;
    if (
      cmd === "capture_selfie" ||
      cmd === "draw_sign" ||
      cmd === "screen_capture"
    ) {
      setSelfieVisible(true);
      setLoadingcmd(cmd);
    }

    if (cmd === "capture_selfie") {
      setSessionItem(
        "capture_selfie",
        kioskResponse.response.data.selfie_image
      );
      setCurrentModel("selfie");
    } else if (cmd === "draw_sign") {
      setSessionItem("draw_sign", kioskResponse.response.data.signature_image);
      setCurrentModel("Sign");
    } else if (cmd === "screen_capture") {
      setSessionItem("screen_capture", kioskResponse.response.data.image);
      setCurrentModel("screen");
    }
  }, [kioskResponse, setSelfieVisible, setLoadingcmd, setCurrentModel]);

  // Determine which image to display
  const displayedImage =
    currentModel === "Sign"
      ? drawSign
      : currentModel === "screen"
      ? screenCapture
      : captureSelfie;

  // Helper to get modal title based on model
  const getTitle = () => {
    if (currentModel === "Sign") return "Draw Sign";
    if (currentModel === "screen") return "Screen Capture";
    return "Capture Selfie";
  };

  return (
    <>
      <Modal
        title={<h4 className="text-center mb-3">{getTitle()}</h4>}
        open={visible}
        onCancel={() => setSelfieVisible(false)}
        onOk={() => setSelfieFullscreenVisible(true)}
        okText="View Fullscreen"
        centered
        className="selfie-modal"
        closable
        maskClosable
      >
        <div style={{ cursor: "pointer", textAlign: "center" }}>
          {displayedImage ? (
            <img
              src={displayedImage}
              alt="PreviewImage"
              className="img-fluid"
            />
          ) : (
            <p>No image available</p>
          )}
        </div>
      </Modal>

      <Modal
        title={<h4 className="text-center mb-3">{getTitle()}</h4>}
        open={selfieFullscreenVisible}
        onCancel={() => setSelfieFullscreenVisible(false)}
        width="100%"
        onOk={() => setSelfieFullscreenVisible(false)}
        okText="Close Fullscreen"
        centered
        className="selfie-full-modal"
        wrapClassName="full-modal"
        closable
        maskClosable
      >
        <div className="text-center">
          {displayedImage ? (
            <img
              src={displayedImage}
              alt="PreviewImage"
              className="img-fluid"
            />
          ) : (
            <p>No image available</p>
          )}
        </div>
      </Modal>
    </>
  );
};

export default SelfieModal;
