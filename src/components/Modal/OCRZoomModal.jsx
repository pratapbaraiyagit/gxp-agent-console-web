import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Space,
  Tooltip,
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  Divider,
  message,
} from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  SyncOutlined,
  SwapOutlined,
  UndoOutlined,
  FullscreenOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { getSessionItem } from "../../hooks/session";
import frontIDCard from "../../assets/images/frontIDCard.png";
import backIDCard from "../../assets/images/backIDCard.png";
import dayjs from "dayjs";

const OCRZoomModal = ({
  visible,
  setVisible,
  updateParentForm, // Function for updating parent form data
  onViewStateChange, // NEW: Function for updating parent view state (showFrontSide, rotation)
  initialShowFrontSide = true, // NEW: Initial state from parent
  initialRotation = 0, // NEW: Initial rotation from parent
}) => {
  // Container ref for mouse events
  const containerRef = useRef(null);

  // States for controlling image display
  const [showFrontSide, setShowFrontSide] = useState(initialShowFrontSide);
  const [rotation, setRotation] = useState(initialRotation);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    id_number: "",
    validity: null,
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
  });

  // Get images from session storage or use default placeholder images
  const displayFrontImage = getSessionItem("front_image") || frontIDCard;
  const displayBackImage = getSessionItem("back_image") || backIDCard;

  // Get OCR data from session storage
  const ocrData = sessionStorage.getItem("OcrSessionData");
  const ocrSession = ocrData ? JSON.parse(ocrData) : null;

  // Determine if we have both front and back card images from session (not placeholders)
  const hasRealFrontImage = getSessionItem("front_image") ? true : false;
  const hasRealBackImage = getSessionItem("back_image") ? true : false;
  const hasFlipOption = hasRealFrontImage && hasRealBackImage;

  // Initialize states when modal opens
  useEffect(() => {
    if (visible) {
      // Reset to parent's current state
      setShowFrontSide(initialShowFrontSide);
      setRotation(initialRotation);

      // Get the latest OCR data directly from session storage
      const currentOcrData = sessionStorage.getItem("OcrSessionData");
      const currentOcrSession = currentOcrData
        ? JSON.parse(currentOcrData)
        : null;

      if (currentOcrSession) {
        setFormData({
          first_name: currentOcrSession.first_name || "",
          last_name: currentOcrSession.last_name || "",
          id_number: currentOcrSession.doc_number || "",
          validity: currentOcrSession.doc_expire_date || null,
          address: currentOcrSession.address_line_first || "",
          city: currentOcrSession.city || "",
          state: currentOcrSession.state || "",
          zip_code: currentOcrSession.zip_code || "",
          country: currentOcrSession.country || "",
        });
      }

      // Reset zoom and position
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [visible, initialShowFrontSide, initialRotation]);

  // Handle zoom in/out
  const handleZoomIn = () => {
    if (zoomLevel < 5) {
      setZoomLevel((prev) => Math.min(prev + 0.25, 5));
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel((prev) => {
        const newZoom = Math.max(prev - 0.25, 0.5);
        // If zooming out to 1 or less, reset position
        if (newZoom <= 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newZoom;
      });
    }
  };

  // Handle wheel event for zooming
  const handleWheel = (e) => {
    if (!containerRef.current?.contains(e.target)) return;

    e.preventDefault();
    if (e.deltaY < 0) {
      // Scroll up - zoom in
      if (zoomLevel < 5) {
        setZoomLevel((prev) => Math.min(prev + 0.25, 5));
      }
    } else {
      // Scroll down - zoom out
      if (zoomLevel > 0.5) {
        setZoomLevel((prev) => {
          const newZoom = Math.max(prev - 0.25, 0.5);
          // If zooming out to 1 or less, reset position
          if (newZoom <= 1) {
            setPosition({ x: 0, y: 0 });
          }
          return newZoom;
        });
      }
    }
  };

  // Handle reset view
  const handleResetView = () => {
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Handle rotation
  const handleRotate = () => {
    setRotation((prev) => (prev + 180) % 360);
    // Reset position when rotating
    setPosition({ x: 0, y: 0 });
  };

  // Handle flipping between front and back
  const handleFlip = () => {
    setShowFrontSide((prev) => !prev);
    // Reset position and zoom when flipping
    setPosition({ x: 0, y: 0 });
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (!containerRef.current?.contains(e.target)) return;

    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      const maxMove = (zoomLevel - 1) * 100; // Restrict movement based on zoom level
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Constrain movement within bounds
      const boundedX = Math.max(-maxMove, Math.min(maxMove, newX));
      const boundedY = Math.max(-maxMove, Math.min(maxMove, newY));

      setPosition({
        x: boundedX,
        y: boundedY,
      });
    }
  };

  // Handle mouse up and mouse leave
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    // Update local form state
    setFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));

    // Update session storage without triggering re-renders
    try {
      const ocrData = sessionStorage.getItem("OcrSessionData");
      const updatedOcrData = ocrData ? JSON.parse(ocrData) : {};

      // Map form fields to OCR session fields
      if (field === "first_name") updatedOcrData.first_name = value;
      if (field === "last_name") updatedOcrData.last_name = value;
      if (field === "id_number") updatedOcrData.doc_number = value;
      if (field === "validity") updatedOcrData.doc_expire_date = value;
      if (field === "address") updatedOcrData.address_line_first = value;
      if (field === "city") updatedOcrData.city = value;
      if (field === "state") updatedOcrData.state = value;
      if (field === "zip_code") updatedOcrData.zip_code = value;
      if (field === "country") updatedOcrData.country = value;

      sessionStorage.setItem("OcrSessionData", JSON.stringify(updatedOcrData));
    } catch (error) {
      // console.error("Error updating OCR session data:", error);
    }
  };

  // Apply changes to parent form
  const applyChanges = () => {
    try {
      // Update session storage
      const updatedOcrData = {
        ...(ocrSession || {}),
        first_name: formData.first_name,
        last_name: formData.last_name,
        doc_number: formData.id_number,
        doc_expire_date: formData.validity,
        address_line_first: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
      };

      sessionStorage.setItem("OcrSessionData", JSON.stringify(updatedOcrData));

      // Call the updateParentForm function passed as a prop
      if (updateParentForm) {
        updateParentForm(formData);
        message.success("ID information updated successfully");
      } else {
        message.warning(
          "Could not update parent form, but session data was saved"
        );
      }
    } catch (error) {
      message.error("Failed to update ID information");
    }
  };

  // Handle modal close with option to save
  const handleClose = (saveChanges = false) => {
    if (saveChanges) {
      applyChanges();
    }

    // NEW: Update parent component's view state
    if (onViewStateChange) {
      onViewStateChange({
        showFrontSide,
        rotation,
      });
    }

    setFullscreen(false);
    setVisible(false);
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: "center" }}>
          <h4 className="mb-0">ID Card Verification</h4>
        </div>
      }
      open={visible}
      onCancel={() => handleClose(false)}
      width={fullscreen ? "100%" : 1000}
      style={{
        top: fullscreen ? 0 : 20,
        maxWidth: "95vw",
      }}
      styles={{
        body: {
          padding: fullscreen ? "20px" : "16px",
          height: fullscreen ? "calc(100vh - 110px)" : "620px",
          backgroundColor: "#f0f2f5",
          overflow: "hidden",
        },
      }}
      centered={!fullscreen}
      footer={[
        <Space key="controls" size="middle" wrap>
          <Space>
            <Tooltip title="Zoom In">
              <Button
                icon={<ZoomInOutlined />}
                onClick={handleZoomIn}
                disabled={zoomLevel >= 5}
              />
            </Tooltip>
            <Tooltip title="Zoom Out">
              <Button
                icon={<ZoomOutOutlined />}
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              />
            </Tooltip>
            <Tooltip title="Rotate">
              <Button icon={<SyncOutlined />} onClick={handleRotate} />
            </Tooltip>
            <Tooltip title="Reset View">
              <Button icon={<UndoOutlined />} onClick={handleResetView} />
            </Tooltip>
            <Tooltip title="Flip Card">
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={handleFlip}
                disabled={!hasFlipOption}
              >
                {showFrontSide ? "View Back" : "View Front"}
              </Button>
            </Tooltip>
          </Space>

          <Space>
            <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <Button
                icon={<FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => handleClose(true)}
            >
              Save & Close
            </Button>
            <Button onClick={() => handleClose(false)}>Cancel</Button>
          </Space>
        </Space>,
      ]}
      maskClosable={!fullscreen}
      closable={!fullscreen}
      keyboard={!fullscreen}
      className="ocr-verification-modal"
    >
      <Row
        gutter={[16, 16]}
        style={{
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Left side - ID Card Image */}
        <Col
          xs={24}
          lg={14}
          style={{
            height: fullscreen ? "100%" : "580px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: "#f9f9f9",
              borderRadius: "4px",
              marginBottom: "12px",
              fontWeight: "500",
            }}
          >
            {showFrontSide ? "ID Card - Front Side" : "ID Card - Back Side"}
            <div
              style={{
                float: "right",
                fontSize: "12px",
                color: "#888",
                marginTop: "2px",
              }}
            >
              Zoom: {(zoomLevel * 100).toFixed(0)}%
            </div>
          </div>

          <div
            ref={containerRef}
            style={{
              flex: 1,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              cursor:
                zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              backgroundColor: "#e6e6e6",
              borderRadius: "4px",
              overflow: "hidden",
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Front side image */}
            {displayFrontImage ? (
              <img
                src={displayFrontImage}
                alt="ID Card Front"
                draggable="false"
                style={{
                  maxWidth: zoomLevel > 1 ? "none" : "100%",
                  maxHeight: zoomLevel > 1 ? "none" : "100%",
                  objectFit: "contain",
                  opacity: showFrontSide ? 1 : 0,
                  position: showFrontSide ? "relative" : "absolute",
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: isDragging
                    ? "none"
                    : "opacity 0.5s ease-in-out, transform 0.3s ease-in-out",
                  display: showFrontSide ? "block" : "none",
                  pointerEvents: showFrontSide ? "auto" : "none",
                }}
              />
            ) : (
              showFrontSide && (
                <div style={{ textAlign: "center" }}>
                  <p>No front image available</p>
                </div>
              )
            )}

            {/* Back side image */}
            {displayBackImage ? (
              <img
                src={displayBackImage}
                alt="ID Card Back"
                draggable="false"
                style={{
                  maxWidth: zoomLevel > 1 ? "none" : "100%",
                  maxHeight: zoomLevel > 1 ? "none" : "100%",
                  objectFit: "contain",
                  opacity: !showFrontSide ? 1 : 0,
                  position: !showFrontSide ? "relative" : "absolute",
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: isDragging
                    ? "none"
                    : "opacity 0.5s ease-in-out, transform 0.3s ease-in-out",
                  display: !showFrontSide ? "block" : "none",
                  pointerEvents: !showFrontSide ? "auto" : "none",
                }}
              />
            ) : (
              !showFrontSide && (
                <div style={{ textAlign: "center" }}>
                  <p>No back image available</p>
                </div>
              )
            )}
          </div>
        </Col>

        {/* Right side - Form Fields */}
        <Col
          xs={24}
          lg={10}
          style={{
            height: fullscreen ? "100%" : "580px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              background: "#f9f9f9",
              borderRadius: "4px",
              marginBottom: "12px",
              fontWeight: "500",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>ID Data (Editable)</span>
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              onClick={applyChanges}
            >
              Apply Changes
            </Button>
          </div>

          <Form layout="vertical" className="ocr-data-form">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="First Name">
                  <Input
                    value={formData.first_name}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    className="form-input"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Last Name">
                  <Input
                    value={formData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    className="form-input"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="ID Number">
                  <Input
                    value={formData.id_number}
                    onChange={(e) =>
                      handleInputChange("id_number", e.target.value)
                    }
                    className="form-input"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Validity">
                  <DatePicker
                    value={formData.validity ? dayjs(formData.validity) : null}
                    onChange={(date) =>
                      handleInputChange(
                        "validity",
                        date ? date.format("YYYY-MM-DD") : null
                      )
                    }
                    className="w-100"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Address">
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="form-input"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="City">
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="form-input"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="State">
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="form-input"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Zip Code">
                  <Input
                    value={formData.zip_code}
                    onChange={(e) =>
                      handleInputChange("zip_code", e.target.value)
                    }
                    className="form-input"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Country">
                  <Input
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    className="form-input"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: "8px 0 16px" }} />

            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  color: "#666",
                  fontSize: "13px",
                  marginBottom: "0",
                }}
              >
                Make corrections then click "Apply Changes" or "Save & Close"
              </p>
            </div>
          </Form>
        </Col>
      </Row>
    </Modal>
  );
};

export default OCRZoomModal;
