import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { addConnect } from "../redux/reducers/MQTT/IDScanner";
import { restartServiceStatus } from "../redux/reducers/MQTT/serviceStatus";
import { getSessionItem, setSessionItem } from "./session";
import {
  selectLatestMessage,
  selectMessagesByTopic,
} from "../redux/reducers/MQTT/mqttSlice";
import { notification } from "../helpers/middleware";

const useIDScanner = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Optimize Redux selectors
  const mqttState = useSelector((state) => state.mqtt);
  const activeConnectList = useSelector(
    (state) => state.idScannerSlice.activeConnectList
  );
  const activeKioskDeviceList = useSelector(
    (state) => state.kioskDevice.activeKioskDeviceList
  );
  const latestMessage = useSelector(selectLatestMessage);

  const seqNumberRef = useRef(null);
  const shownNotificationsRef = useRef(new Set());
  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  // New refs for timer functionality
  const timerIntervalRef = useRef(null);
  const statusTimerIntervalRef = useRef(null);

  // Memoize kiosk configuration parsing to prevent re-parsing on every render
  const kioskData = getSessionItem("KioskConfig");

  let kioskConfig = null;
  if (kioskData) {
    try {
      const kioskSession = JSON.parse(
        decodeURIComponent(escape(atob(kioskData)))
      );
      kioskConfig = kioskSession?.[0]?.mqtt_config?.console_subscribe_topics;
    } catch (error) {
      // console.error("Error parsing kiosk config:", error);
    }
  }

  // Memoize device IDs to prevent array recreation
  const deviceIds = useMemo(() => {
    return (
      activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || []
    );
  }, [activeKioskDeviceList]);

  // Get initial connection status from session storage
  const getInitialConnectionStatus = () => {
    const storedStatus = getSessionItem("idScannerConnectionStatus");
    if (storedStatus !== null) {
      return storedStatus === "true";
    }
    return false;
  };

  // Enhanced state management with timer properties
  const [state, setState] = useState({
    isConnected: getInitialConnectionStatus(),
    isSendOCR: false,
    isFlip: false,
    isOcrFound: false,
    isIdScannerLoading: false,
    deviceIdScannerLoading: false,
    error: null,
    ocrData: null,
    // New timer states
    actionTimer: 0,
    statusTimer: 0,
    isActionTimerActive: false,
    isStatusTimerActive: false,
    currentAction: null,
  });

  // Batch state updates to reduce re-renders
  const updateState = useCallback((updates) => {
    setState((prevState) => {
      const newState = { ...prevState, ...updates };

      // Store connection status in session storage when it changes
      if ("isConnected" in updates) {
        setSessionItem(
          "idScannerConnectionStatus",
          updates.isConnected ? "true" : "false"
        );
      }

      return newState;
    });
  }, []);

  // Timer management functions
  const startActionTimer = useCallback(
    (action, duration = 10) => {
      // Clear existing timer if any
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      updateState({
        actionTimer: duration,
        isActionTimerActive: true,
        currentAction: action,
      });

      timerIntervalRef.current = setInterval(() => {
        setState((prevState) => {
          const newTimer = prevState.actionTimer - 1;
          if (newTimer <= 0) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            return {
              ...prevState,
              actionTimer: 0,
              isActionTimerActive: false,
              currentAction: null,
            };
          }
          return {
            ...prevState,
            actionTimer: newTimer,
          };
        });
      }, 1000);
    },
    [updateState]
  );

  const startStatusTimer = useCallback(
    (duration = 10) => {
      // Clear existing timer if any
      if (statusTimerIntervalRef.current) {
        clearInterval(statusTimerIntervalRef.current);
      }

      updateState({
        statusTimer: duration,
        isStatusTimerActive: true,
      });

      statusTimerIntervalRef.current = setInterval(() => {
        setState((prevState) => {
          const newTimer = prevState.statusTimer - 1;
          if (newTimer <= 0) {
            clearInterval(statusTimerIntervalRef.current);
            statusTimerIntervalRef.current = null;
            return {
              ...prevState,
              statusTimer: 0,
              isStatusTimerActive: false,
            };
          }
          return {
            ...prevState,
            statusTimer: newTimer,
          };
        });
      }, 1000);
    },
    [updateState]
  );

  const clearAllTimers = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (statusTimerIntervalRef.current) {
      clearInterval(statusTimerIntervalRef.current);
      statusTimerIntervalRef.current = null;
    }
    updateState({
      actionTimer: 0,
      statusTimer: 0,
      isActionTimerActive: false,
      isStatusTimerActive: false,
      currentAction: null,
    });
  }, [updateState]);

  // Memoize notification function to prevent recreation
  const showUniqueNotification = useCallback((message, type) => {
    const notificationKey = `${message}-${type}`;
    if (!shownNotificationsRef.current.has(notificationKey)) {
      notification(message, type);
      shownNotificationsRef.current.add(notificationKey);
    }
  }, []);

  // Update sequence number when activeConnectList changes
  useEffect(() => {
    if (activeConnectList?.[0]?.seq) {
      seqNumberRef.current = activeConnectList[0].seq;
    }
  }, [activeConnectList]);

  // Enhanced timeout management for status checking
  const handleStatusTimeout = useCallback(() => {
    updateState({
      isConnected: false,
      deviceIdScannerLoading: false,
      error: "Connection timeout - Scanner appears offline",
    });
    showUniqueNotification("ID Scanner connection timeout", "error");

    // Clear timers and active actions
    clearAllTimers();
    delete activeActions.current["get_status"];
    delete loggedActions.current["get_status"];

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  }, [updateState, showUniqueNotification, clearAllTimers]);

  // Memoize message handler creation
  const createMessageHandler = useCallback(
    (action, resolve, timeoutId) => {
      return (message) => {
        try {
          const data = JSON.parse(message);
          // Handle connection status
          if (data?.cmd === "mqtt_connect" && data?.response?.code === 9001) {
            updateState({
              isConnected: true,
              deviceIdScannerLoading: false,
              error: null,
            });

            // Clear status timeout and timer if this is in response to get_status
            if (statusTimeoutRef.current && action === "get_status") {
              clearTimeout(statusTimeoutRef.current);
              statusTimeoutRef.current = null;
            }

            clearAllTimers();

            showUniqueNotification(
              data?.response?.message || "ID Scanner connected successfully",
              "success"
            );

            if (action === "get_status") {
              clearTimeout(timeoutId);
              delete activeActions.current[action];
              delete loggedActions.current[action];
              resolve(true);
              return;
            }
          } else if (
            data?.cmd === "mqtt_disconnect" &&
            data?.response?.code === 9002
          ) {
            updateState({
              isConnected: false,
              deviceIdScannerLoading: false,
              error: "Scanner disconnected",
            });

            clearAllTimers();

            showUniqueNotification(
              data?.response?.message || "ID Scanner disconnected",
              "warning"
            );

            if (statusTimeoutRef.current) {
              clearTimeout(statusTimeoutRef.current);
              statusTimeoutRef.current = null;
            }

            Object.keys(activeActions.current).forEach((actionKey) => {
              delete activeActions.current[actionKey];
              delete loggedActions.current[actionKey];
            });

            if (action === "get_status") {
              clearTimeout(timeoutId);
              resolve(false);
              return;
            }
          }

          if (!loggedActions.current[action]) {
            loggedActions.current[action] = true;
          }

          // Enhanced get_status response handling
          if (data?.cmd === "get_status" && data?.response) {
            if (statusTimeoutRef.current) {
              clearTimeout(statusTimeoutRef.current);
              statusTimeoutRef.current = null;
            }

            clearAllTimers();

            const isConnected = true;
            const updates = {
              deviceIdScannerLoading: false,
              isConnected: isConnected,
              error: isConnected ? null : "Scanner is offline",
            };

            const dataSeq = String(data?.seq);
            const currentSeq = String(seqNumberRef.current);

            if (dataSeq === currentSeq || !seqNumberRef.current) {
              const responseStatus = data?.response?.status;

              showUniqueNotification(
                data?.response?.message ||
                  (responseStatus ? "Scanner is online" : "Scanner is offline"),
                responseStatus === true ? "success" : "error"
              );

              Object.assign(updates, {
                error: null,
              });

              clearTimeout(timeoutId);
              resolve(true);
            } else {
              showUniqueNotification(
                data?.response?.message ||
                  (isConnected ? "Scanner is online" : "Scanner is offline"),
                isConnected ? "success" : "error"
              );
            }

            updateState(updates);
            delete activeActions.current[action];
            delete loggedActions.current[action];
            return;
          }

          if (data?.cmd === action) {
            const updates = { isIdScannerLoading: false };

            // Clear action timer when response is received
            clearAllTimers();

            const dataSeq = String(data?.seq);
            const currentSeq = String(seqNumberRef.current);

            if (dataSeq === currentSeq || !seqNumberRef.current) {
              const responseStatus = data?.response?.status;

              showUniqueNotification(
                data?.response?.message,
                responseStatus === true ? "success" : "error"
              );

              Object.assign(updates, {
                isConnected: true,
                error: null,
              });

              if (data.cmd === "connect") {
                updates.isConnected = responseStatus;
              }

              if (
                data.cmd === "autocapture_on" &&
                data.response.data.process === "ocr"
              ) {
                if (dataSeq === currentSeq || !seqNumberRef.current) {
                  updates.isSendOCR = true;
                }

                if (
                  data?.response?.data?.process === "flip" &&
                  (dataSeq === currentSeq || !seqNumberRef.current)
                ) {
                  updates.isFlip = true;
                }

                if (
                  data?.response?.data?.process === "ocr" &&
                  (dataSeq === currentSeq || !seqNumberRef.current)
                ) {
                  Object.assign(updates, {
                    isOcrFound: true,
                    ocrData: data?.response?.data?.ocr,
                    isFlip: false,
                  });
                  delete activeActions.current[action];
                  delete loggedActions.current[action];
                }

                if (
                  (dataSeq === currentSeq || !seqNumberRef.current) &&
                  data?.response?.status === false &&
                  data?.response?.code === 404
                ) {
                  Swal.fire({
                    text: "Not able to scan your id",
                    icon: "error",
                    confirmButtonText: "Ok",
                    showClass: {
                      popup:
                        "animate__animated animate__fadeInUp animate__faster",
                    },
                    hideClass: {
                      popup:
                        "animate__animated animate__fadeOutDown animate__faster",
                    },
                  });
                  updates.isOcrFound = false;
                  delete activeActions.current[action];
                  delete loggedActions.current[action];
                  navigate("/check-in/find-booking");
                }
              }

              clearTimeout(timeoutId);
              resolve(true);
            } else {
              updates.error = `Failed to ${action} ID Scanner`;
              clearTimeout(timeoutId);
              resolve(false);
            }

            updateState(updates);
            delete activeActions.current[action];
            delete loggedActions.current[action];
          }
        } catch (err) {
          clearAllTimers();
          updateState({
            error: "Error processing scanner response",
            isIdScannerLoading: false,
          });
          delete activeActions.current[action];
          delete loggedActions.current[action];
          clearTimeout(timeoutId);
          resolve(false);
        }
      };
    },
    [updateState, showUniqueNotification, navigate, clearAllTimers]
  );

  const executeScannerAction = useCallback(
    (action, publishAction) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          resolve(false);
          return;
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;

        const updates = {
          isIdScannerLoading: true,
          error: null,
        };

        if (action === "get_status") {
          updates.deviceIdScannerLoading = true;

          // Start both timeout and timer for status checks
          statusTimeoutRef.current = setTimeout(handleStatusTimeout, 10000);
          startStatusTimer(10);
        } else {
          // Start timer for other actions (10 seconds)
          startActionTimer(action, 10);
        }

        updateState(updates);

        dispatch(
          addConnect({
            cmd: publishAction,
            payload: {},
            device_uuid_list: deviceIds,
          })
        );

        const timeoutId = setTimeout(() => {
          clearAllTimers();
          updateState({
            isIdScannerLoading: false,
            error: "Connection timeout",
          });
          delete activeActions.current[action];
          delete loggedActions.current[action];
          resolve(false);
        }, 10000);

        timeoutIdRef.current = timeoutId;

        messageHandlerRef.current = createMessageHandler(
          action,
          resolve,
          timeoutId
        );
      });
    },
    [
      mqttState.isConnected,
      deviceIds,
      dispatch,
      updateState,
      createMessageHandler,
      handleStatusTimeout,
      startActionTimer,
      startStatusTimer,
      clearAllTimers,
    ]
  );

  // Optimize MQTT message handling
  useEffect(() => {
    if (latestMessage && messageHandlerRef.current && kioskConfig?.id_scanner) {
      if (kioskConfig.id_scanner === latestMessage?.topic) {
        messageHandlerRef.current(latestMessage.message);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestMessage, updateState]);

  // Memoize action callbacks to prevent recreation
  const connectScanner = useCallback(() => {
    return executeScannerAction("connect", "connect");
  }, [executeScannerAction]);

  const calibrateScanner = useCallback(() => {
    return executeScannerAction("calibrate", "calibrate");
  }, [executeScannerAction]);

  const autoCaptureOn = useCallback(() => {
    return executeScannerAction("autocapture_on", "autocapture_on");
  }, [executeScannerAction]);

  const autoCaptureOff = useCallback(() => {
    return executeScannerAction("autocapture_off", "autocapture_off");
  }, [executeScannerAction]);

  const statusIDScanner = useCallback(() => {
    return executeScannerAction("get_status", "get_status");
  }, [executeScannerAction]);

  const disconnectScanner = useCallback(() => {
    clearAllTimers();
    updateState({ isConnected: false });
  }, [updateState, clearAllTimers]);

  const reStartIdScanner = useCallback(() => {
    return new Promise((resolve) => {
      if (activeActions.current["restart"] || !mqttState.isConnected) {
        resolve(false);
        return;
      }

      activeActions.current["restart"] = true;
      loggedActions.current["restart"] = false;

      const updates = {
        deviceIdScannerLoading: true,
        error: null,
      };

      // Start timer for restart action (10 seconds)
      startActionTimer("restart", 10);

      updateState(updates);

      // Dispatch the restart action
      dispatch(
        restartServiceStatus({
          cmd: "restart",
          payload: { service: "id_scanner" },
          device_uuid_list: deviceIds,
        })
      );

      const timeoutId = setTimeout(() => {
        clearAllTimers();
        updateState({
          deviceIdScannerLoading: false,
          error: "Restart timeout",
        });
        delete activeActions.current["restart"];
        delete loggedActions.current["restart"];
        resolve(false);
      }, 10000);

      // You might need to handle the response differently since restart might not follow
      // the same message pattern as other scanner actions. You may need to modify
      // the message handler or create a separate handler for restart responses.

      // For now, we'll resolve after timeout or you can modify based on your restart response handling
      setTimeout(() => {
        clearAllTimers();
        updateState({
          deviceIdScannerLoading: false,
        });
        delete activeActions.current["restart"];
        delete loggedActions.current["restart"];
        clearTimeout(timeoutId);
        resolve(true);
      }, 10000);
    });
  }, [
    mqttState.isConnected,
    deviceIds,
    dispatch,
    updateState,
    startActionTimer,
    clearAllTimers,
  ]);

  const scanID = useCallback(() => {
    if (!state.isConnected) {
      updateState({ error: "Scanner is not connected" });
      return;
    }
  }, [state.isConnected, updateState]);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts and intervals
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (statusTimerIntervalRef.current) {
        clearInterval(statusTimerIntervalRef.current);
      }

      // Clear active actions
      activeActions.current = {};
      loggedActions.current = {};
      messageHandlerRef.current = null;
      shownNotificationsRef.current.clear();
    };
  }, []);

  // Cleanup shown notifications periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      shownNotificationsRef.current.clear();
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Memoize return object with timer properties
  return useMemo(
    () => ({
      isConnected: state.isConnected,
      isIdScannerLoading: state.isIdScannerLoading,
      deviceIdScannerLoading: state.deviceIdScannerLoading,
      error: state.error,
      connectScanner,
      statusIDScanner,
      calibrateScanner,
      disconnectScanner,
      scanID,
      autoCaptureOn,
      autoCaptureOff,
      isFlip: state.isFlip,
      isSendOCR: state.isSendOCR,
      isOcrFound: state.isOcrFound,
      ocrData: state.ocrData,
      reStartIdScanner,
      // New timer properties
      actionTimer: state.actionTimer,
      statusTimer: state.statusTimer,
      isActionTimerActive: state.isActionTimerActive,
      isStatusTimerActive: state.isStatusTimerActive,
      currentAction: state.currentAction,
      clearAllTimers,
    }),
    [
      state.isConnected,
      state.isIdScannerLoading,
      state.deviceIdScannerLoading,
      state.error,
      state.isFlip,
      state.isSendOCR,
      state.isOcrFound,
      state.ocrData,
      state.actionTimer,
      state.statusTimer,
      state.isActionTimerActive,
      state.isStatusTimerActive,
      state.currentAction,
      connectScanner,
      statusIDScanner,
      calibrateScanner,
      disconnectScanner,
      scanID,
      autoCaptureOn,
      autoCaptureOff,
      reStartIdScanner,
      clearAllTimers,
    ]
  );
};

export default useIDScanner;
