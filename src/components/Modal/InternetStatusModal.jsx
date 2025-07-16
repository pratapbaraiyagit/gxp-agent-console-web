import React, { useEffect, useState } from "react";
import { Button, message, Modal } from "antd";
import { WifiOutlined } from "@ant-design/icons";

const InternetStatusModal = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isModalOpen, setIsModalOpen] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsModalOpen(false);
      message.success("Back to Online");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsModalOpen(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsModalOpen(false);
    }
  };

  return (
    <Modal
      open={!isOnline}
      closable={false}
      footer={null}
      centered
      title={<h5 className="text-center">No Internet Connection</h5>}
    >
      <div className="text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="96"
          height="96"
          viewBox="0 0 24 24"
        >
          <path
            fill="#11c9ea"
            d="m19.75 22.6l-9.4-9.45q-1.175.275-2.187.825T6.35 15.35l-2.1-2.15q.8-.8 1.725-1.4t1.975-1.05L5.7 8.5q-1.025.525-1.913 1.163T2.1 11.1L0 8.95q.8-.8 1.663-1.437T3.5 6.3L1.4 4.2l1.4-1.4l18.4 18.4zm-1.85-7.55l-.725-.725l-.725-.725l-3.6-3.6q2.025.2 3.787 1.025T19.75 13.2zm4-3.95q-1.925-1.925-4.462-3.012T12 7q-.525 0-1.012.038T10 7.15L7.45 4.6q1.1-.3 2.238-.45T12 4q3.55 0 6.625 1.325T24 8.95zM12 21l-3.525-3.55q.7-.7 1.613-1.075T12 16t1.913.375t1.612 1.075z"
          />
        </svg>
        <p>Please check your internet connection and try again.</p>
        <Button type="primary" onClick={handleRetry}>
          Retry
        </Button>
      </div>
    </Modal>
  );
};

export default InternetStatusModal;
