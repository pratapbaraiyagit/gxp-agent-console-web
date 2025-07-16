import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { notification } from "../helpers/middleware";
import { getSessionItem } from "./session";
import { printerAction } from "../redux/reducers/MQTT/printer";

const usePrinter = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const publishTopic = getSessionItem("publishTopic");
  const publishTopicSession = publishTopic
    ? JSON.parse(decodeURIComponent(escape(atob(publishTopic))))
    : null;

  const newKioskConfig = kioskSession?.[0];

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printerStatus, setPrinterStatus] = useState(null);
  const [lastPrintJob, setLastPrintJob] = useState(null);

  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);

  const executePrinterAction = useCallback(
    (action, publishAction, params = null) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          if (!mqttState.isConnected) {
            notification(
              "Printer: MQTT client is not connected",
              "error",
              2000,
              "topRight"
            );
          }
          return resolve(false);
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;
        setIsLoading(true);
        setError(null);

        // Display notification when sending command
        notification(
          `Printer: Sending ${action} command...`,
          "info",
          2000,
          "topRight"
        );

        const deviceIds =
          activeKioskDeviceList?.map((device) => device.id).filter(Boolean) ||
          [];

        dispatch(
          printerAction({
            cmd: publishAction, // enum ["connect", "disconnect", "get_status", "autocapture_on", "autocapture_off", "capture", "calibrate"]
            payload: {},
            device_uuid_list: deviceIds,
          })
        );

        // If parameters are provided, add them to the publish action
        const finalAction = params
          ? `${publishAction}${JSON.stringify(params)}`
          : publishAction;

        const timeoutId = setTimeout(() => {
          setIsLoading(false);
          setError("Connection timeout");
          notification(
            "Printer: Connection timeout for " + action,
            "error",
            2000,
            "topRight"
          );
          delete activeActions.current[action];
          delete loggedActions.current[action];
          resolve(false);
        }, 10000); // Give printer more time for printing operations

        messageHandlerRef.current = (message) => {
          try {
            const data = JSON.parse(message);

            if (!loggedActions.current[action]) {
              loggedActions.current[action] = true;
            }

            if (data?.Cmd === action) {
              const successConditions = {
                connect: {
                  result: "success",
                  messages: ["device_connect", "printer_ready"],
                },
                status: {
                  result: "success",
                  messages: ["printer_status"],
                },
                print: {
                  result: "success",
                  messages: ["print_success", "printing_complete"],
                },
                disconnect: {
                  result: "success",
                  messages: ["device_disconnect"],
                },
              };

              const isSuccess =
                successConditions[data.Cmd] &&
                data.Result === successConditions[data.Cmd].result &&
                (successConditions[data.Cmd].messages.includes(data.Message) ||
                  successConditions[data.Cmd].messages.length === 0);

              if (isSuccess) {
                if (data.Cmd === "connect") {
                  setIsConnected(true);
                  notification(
                    "Printer: Connected successfully",
                    "success",
                    2000,
                    "topRight"
                  );
                } else if (data.Cmd === "status" && data.Data) {
                  try {
                    const statusData =
                      typeof data.Data === "string"
                        ? JSON.parse(data.Data)
                        : data.Data;
                    setPrinterStatus(statusData);
                    notification(
                      "Printer: Status updated",
                      "success",
                      2000,
                      "topRight"
                    );
                  } catch (err) {
                    // console.error("Error parsing printer status:", err);
                  }
                } else if (data.Cmd === "print") {
                  setIsPrinting(false);
                  setLastPrintJob({
                    type: params?.type || "unknown",
                    timestamp: new Date(),
                    success: true,
                  });
                  notification(
                    "Printer: Document printed successfully",
                    "success",
                    2000,
                    "topRight"
                  );
                } else if (data.Cmd === "disconnect") {
                  setIsConnected(false);
                  notification(
                    "Printer: Disconnected successfully",
                    "success",
                    2000,
                    "topRight"
                  );
                }

                setError(null);
                resolve(true);
              } else {
                const errorMsg = `Failed to ${action} Printer`;
                setError(errorMsg);

                if (data.Cmd === "print") {
                  setIsPrinting(false);
                  setLastPrintJob({
                    type: params?.type || "unknown",
                    timestamp: new Date(),
                    success: false,
                    error: data.Message || "Unknown error",
                  });
                }

                notification(
                  `Printer: ${errorMsg} - ${data.Message || ""}`,
                  "error",
                  2000,
                  "topRight"
                );
                resolve(false);
              }

              clearTimeout(timeoutId);
              delete activeActions.current[action];
              delete loggedActions.current[action];
            }
          } catch (err) {
            const errorMsg = "Error processing printer response";
            setError(errorMsg);
            notification(`Printer: ${errorMsg}`, "error", 2000, "topRight");
            delete activeActions.current[action];
            delete loggedActions.current[action];
            clearTimeout(timeoutId);
            resolve(false);
          }
        };
      });
    },
    [mqttState.isConnected, dispatch]
  );

  useEffect(() => {
    const printerData = publishTopicSession?.find(
      (item) => item.source === "printer"
    );
    if (mqttState.lastMessage && messageHandlerRef.current) {
      if (printerData?.[0]?.topic) {
        messageHandlerRef.current(mqttState.lastMessage.message);
      }
    }
  }, [mqttState.lastMessage, publishTopicSession]);

  const connectPrinter = useCallback(() => {
    notification("Printer: Initializing connection", "info", 2000, "topRight");
    return executePrinterAction("connect", "connect");
  }, [executePrinterAction]);

  const statusPrinter = useCallback(() => {
    notification("Printer: Checking status", "info", 2000, "topRight");
    return executePrinterAction("status", "status");
  }, [executePrinterAction]);

  const printDocument = useCallback(
    (document, type = "receipt") => {
      notification(`Printer: Printing ${type}`, "info", 2000, "topRight");
      setIsPrinting(true);
      return executePrinterAction("print", "print", { document, type });
    },
    [executePrinterAction]
  );

  const disconnectPrinter = useCallback(() => {
    notification("Printer: Disconnecting", "info", 2000, "topRight");
    return executePrinterAction("disconnect", "disconnect");
  }, [executePrinterAction]);

  const reStartPrinter = useCallback(() => {
    notification("Printer: Attempting to restart", "info", 2000, "topRight");
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeActions.current = {};
      loggedActions.current = {};
      messageHandlerRef.current = null;
    };
  }, []);

  return {
    isConnected,
    isPrinting,
    isLoading,
    error,
    printerStatus,
    lastPrintJob,
    connectPrinter,
    statusPrinter,
    printDocument,
    disconnectPrinter,
    reStartPrinter,
  };
};

export default usePrinter;
