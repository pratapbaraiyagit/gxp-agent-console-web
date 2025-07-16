import { width } from "@fortawesome/free-solid-svg-icons/fa0";
import { message as antdMessage, notification as antdNotification } from "antd";
import Compressor from "compressorjs";

// Main notification function
export const notification = (
  message,
  type = "info",
  duration = 2000,
  placement = "top",
  showCloseIcon = false
) => {
  const durationInSeconds = typeof duration === "number" ? duration / 1000 : 2;

  // Split the message by colon to create a title and description
  const parts = message.split(":");
  const title = parts[0] || "Notification";
  const description = parts.length > 1 ? parts.slice(1).join(":").trim() : "";

  const config = {
    message: title,
    description: description,
    duration: durationInSeconds,
    placement: placement,
    closeIcon: showCloseIcon ? undefined : null,
    style: {
      padding: "9px 16px",
      width: "max-content",
    },
    className: "gxp-notification",
  };

  switch (type) {
    case "success":
      antdNotification.success(config);
      break;
    case "error":
      antdNotification.error(config);
      break;
    case "info":
      antdNotification.info(config);
      break;
    case "warn":
    case "warning":
      antdNotification.warning(config);
      break;
    default:
      antdNotification.open(config);
      break;
  }
};

// Function to show delayed notifications
export const showDelayedNotification = (
  message,
  type = "info",
  delay = 2000,
  duration = 3000,
  placement = "top"
) => {
  setTimeout(() => {
    notification(message, type, duration, placement);
  }, delay);
};

// Enhanced function to process MQTT messages and show appropriate notifications
export const showMessages = (topic, data) => {
  let message = `${topic.charAt(0).toUpperCase() + topic.slice(1)}: `;
  let type = "info";
  let duration = 3000;
  let placement = "topRight";

  try {
    // If data is a string, try to parse it as JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // If parsing fails, keep data as string
      }
    }

    // Process based on device type
    if (topic === "dispenser") {
      handleDispenserMessages(data, message);
    } else if (topic === "encoder") {
      handleEncoderMessages(data, message);
    } else if (topic === "scanner") {
      handleScannerMessages(data, message);
    } else if (topic === "console") {
      handleConsoleMessages(data, message);
    } else {
      // Generic handler for other device types
      message += typeof data === "string" ? data : "Message received";
    }
  } catch (error) {
    notification(
      `Error processing ${topic} message: ${error.message}`,
      "error",
      3000,
      "topRight"
    );
  }

  return message;
};

// Handler for dispenser messages
function handleDispenserMessages(data, message) {
  let msg = message;
  let type = "info";

  if (typeof data === "object" && data !== null) {
    if (data.Msg === "") {
      msg += `Device is not connected, Please check device status.`;
      type = "error";
    } else if (data.cardlocation === "read_position") {
      msg += `Card is on read position.`;
    } else if (data.cardlocation === "card_at_front") {
      msg += `Card is on front position.`;
    } else if (data.cardbox === "insufficiant") {
      msg += `Card box is insufficient.`;
      type = "warn";
      if (data.capturebox === "empty") {
        showDelayedNotification(
          "Dispenser: Capture box is empty.",
          "info",
          500
        );
      }
    } else if (data.cardbox === "full") {
      msg += `Card box is full.`;
      type = "success";
    } else if (data.cardlocation === "no") {
      msg += `Card is not on write position.`;
    } else if (data.capturebox === "empty") {
      msg += `Capture box is empty.`;
    } else if (data.capturebox === "full") {
      msg += `Capture box is full.`;
      type = "warn";
    } else if (data.moveReader === "move_reader_suceess") {
      msg += "Card at read position";
      type = "success";
      setTimeout(() => {
        notification(
          "Dispenser: Card is moving to write position.",
          "info",
          3000,
          "topRight"
        );
      }, 3500);
    } else if (data.moveFront === "move_front_success") {
      msg += `Please collect your room key.`;
      type = "success";
    } else if (data.Cmd && data.Result) {
      msg += `Command ${data.Cmd} ${
        data.Result === "success" ? "successful" : "failed"
      }`;
      type = data.Result === "success" ? "success" : "error";
    }
  } else if (typeof data === "string") {
    msg += data;
  }

  notification(msg, type, 3000, "topRight");
}

// Handler for encoder messages
function handleEncoderMessages(data, message) {
  let msg = message;
  let type = "info";

  if (typeof data === "object" && data !== null) {
    if (data.writeKey === "write_success") {
      msg += `Write key successfully.`;
      type = "success";
      setTimeout(() => {
        notification(
          "Encoder: Card is moving to front position.",
          "info",
          3000,
          "topRight"
        );
      }, 500);
    } else if (data.Cmd && data.Result) {
      msg += `Command ${data.Cmd} ${
        data.Result === "success" ? "successful" : "failed"
      }`;
      type = data.Result === "success" ? "success" : "error";
    } else {
      msg += `Something is wrong.`;
      type = "error";
    }
  } else if (typeof data === "string") {
    msg += data;
  }

  notification(msg, type, 3000, "topRight");
}

// Handler for scanner messages
function handleScannerMessages(data, message) {
  let msg = message;
  let type = "info";

  if (typeof data === "object" && data !== null && data.Cmd) {
    // Handle command responses
    msg += `Command ${data.Cmd} ${
      data.Result === "success" ? "successful" : "failed"
    }`;
    type = data.Result === "success" ? "success" : "error";

    if (data.Message) {
      if (
        data.Message === "capture_done_send_OCR" ||
        data.Message === "capture_done"
      ) {
        msg = "Scanner: One side image captured.";
      } else if (data.Message === "flip_document_id") {
        msg = "Scanner: Please flip the document.";
      } else if (
        data.Message === "capture_ocr_success" ||
        data.Message === "capture_ocr_successfully"
      ) {
        msg = "Scanner: Document successfully scanned.";
        type = "success";
        setTimeout(() => {
          notification(
            "Scanner: Processing OCR data...",
            "info",
            3000,
            "topRight"
          );
        }, 200);
      } else if (data.Message === "ocr_not_found") {
        msg = "Scanner: OCR data not found. Please try again.";
        type = "error";
      }
    }
  } else if (typeof data === "string") {
    if (data === "barcode_not_found") {
      msg += "Barcode Not Found.";
      type = "warn";
    } else if (data === "capture_done_send_OCR") {
      msg += "One side image captured.";
    } else if (data === "flip_document_id") {
      msg += "Scan other side of document.";
    } else if (data === "capture_ocr_success") {
      msg += "Other side of document capture.";
      type = "success";
      setTimeout(() => {
        notification(
          "Scanner: We are fetching OCR data.",
          "info",
          3000,
          "topRight"
        );
      }, 200);
    } else if (data === "capture_ocr_successfully") {
      msg += "Other side of document capture.";
      type = "success";
      setTimeout(() => {
        notification(
          "Scanner: We are fetching OCR data.",
          "info",
          3000,
          "topRight"
        );
      }, 200);
    } else {
      msg += data;
    }
  }

  notification(msg, type, 3000, "topRight");
}

// Handler for console messages
function handleConsoleMessages(data, message) {
  let msg = message;
  let type = "info";

  if (typeof data === "string") {
    if (data === "callMode") {
      msg += "Kiosk mode change command successfully sent.";
      type = "success";
    } else if (data === "refresh") {
      msg += "Refresh command successfully sent.";
      type = "success";
    } else {
      msg += data;
    }
  } else if (typeof data === "object" && data !== null) {
    if (data.Cmd && data.Result) {
      msg += `Command ${data.Cmd} ${
        data.Result === "success" ? "successful" : "failed"
      }`;
      type = data.Result === "success" ? "success" : "error";
    } else {
      msg += "Message received";
    }
  }

  notification(msg, type, 3000, "topRight");
}

export const compressImage = async (file) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/heic",
    "image/webp",
    "image/svg",
  ];

  if (!allowedTypes.includes(file.type)) {
    notification(`Invalid file type for file: ${file.name}`, "warn");
    return null;
  }

  const compressImageFunc = (file) => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.4,
        success: (result) => {
          const blobToFile = (blob, fileName) => {
            return new File([blob], fileName, { type: blob.type });
          };
          const compressedFile = blobToFile(result, file.name);
          resolve(compressedFile);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  };

  try {
    const compressedImage = await compressImageFunc(file);
    if (!compressedImage) {
      throw new Error("Image compression failed");
    }
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.readAsDataURL(compressedImage);
      reader.onload = (event) => {
        resolve({ compressedImage, dataUrl: event.target.result });
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  } catch (error) {
    throw error;
  }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  notification,
  compressImage,
  showMessages,
  showDelayedNotification,
};
