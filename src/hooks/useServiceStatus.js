import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getServiceStatus,
  restartServiceStatus,
} from "../redux/reducers/MQTT/serviceStatus";
import { getSessionItem, setSessionItem } from "./session";
import { selectLatestMessage } from "../redux/reducers/MQTT/mqttSlice";
import { notification } from "../helpers/middleware";

const useServiceStatus = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);
  const seqSSNumberRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);
  const shownNotificationsRef = useRef(new Set());
  const timeoutIdRef = useRef(null);

  // New refs for timer functionality
  const timerIntervalRef = useRef(null);
  const statusTimerIntervalRef = useRef(null);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const UserSessionAgentConsole = getSessionItem("UserSessionAgentConsole");
  const userHotelSession = UserSessionAgentConsole
    ? JSON.parse(decodeURIComponent(escape(atob(UserSessionAgentConsole))))
    : null;

  const newKioskConfig = kioskSession?.[0]?.mqtt_config?.subscribe_topics;


  const latestMessage = useSelector(selectLatestMessage);

  // Get initial connection status from session storage
  const getInitialConnectionStatus = () => {
    const storedStatus = getSessionItem("serviceStatusConnectionStatus");
    if (storedStatus !== null) {
      return storedStatus === "true";
    }
    return false;
  };

  // Enhanced state management with timer properties
  const [state, setState] = useState({
    isConnected: getInitialConnectionStatus(),
    isLoading: false,
    keyError: null,
    // New timer states
    actionTimer: 0,
    statusTimer: 0,
    isActionTimerActive: false,
    isStatusTimerActive: false,
    currentAction: null,
  });

  const { activeServiceStatusList } = useSelector(
    ({ serviceStatusSlice }) => serviceStatusSlice
  );

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  // Memoize device IDs to prevent array recreation
  const deviceIds = useMemo(() => {
    return (
      activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || []
    );
  }, [activeKioskDeviceList]);

  // Batch state updates to reduce re-renders
  const updateState = useCallback((updates) => {
    setState((prevState) => {
      const newState = { ...prevState, ...updates };

      // Store connection status in session storage when it changes
      if ("isConnected" in updates) {
        setSessionItem(
          "serviceStatusConnectionStatus",
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

  // Memoize notification function
  const showUniqueNotification = useCallback((message, type) => {
    const notificationKey = `${message}-${type}`;
    if (!shownNotificationsRef.current.has(notificationKey)) {
      notification(message, type);
      shownNotificationsRef.current.add(notificationKey);
    }
  }, []);

  // Enhanced timeout management for status checking
  const handleStatusTimeout = useCallback(() => {
    updateState({
      isLoading: false,
      isConnected: false,
      keyError: "Connection timeout - Service status appears offline",
    });
    showUniqueNotification("Service status connection timeout", "error");

    // Clear timers and active actions
    clearAllTimers();
    delete activeActions.current["get_status"];
    delete loggedActions.current["get_status"];

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  }, [updateState, showUniqueNotification, clearAllTimers]);

  useEffect(() => {
    if (activeServiceStatusList?.[0]?.seq) {
      seqSSNumberRef.current = activeServiceStatusList[0].seq;
    }
  }, [activeServiceStatusList]);

  const executeServiceStatusAction = useCallback(
    (action, publishAction) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          resolve(false);
          return;
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;

        const updates = {
          isLoading: true,
          keyError: null,
        };

        if (action === "get_status") {
          // Start both timeout and timer for status checks
          statusTimeoutRef.current = setTimeout(handleStatusTimeout, 10000);
          startStatusTimer(10);
        } else {
          // Start timer for other actions (10 seconds)
          startActionTimer(action, 10);
        }

        updateState(updates);

        dispatch(
          getServiceStatus({
            cmd: publishAction,
            payload: { agent_user_id: userHotelSession?.id },
            device_uuid_list: deviceIds,
          })
        );

        const timeoutId = setTimeout(() => {
          clearAllTimers();
          updateState({
            isLoading: false,
            keyError: "Connection timeout",
          });
          delete activeActions.current[action];
          delete loggedActions.current[action];
          resolve(false);
        }, 10000);

        timeoutIdRef.current = timeoutId;

        messageHandlerRef.current = (message) => {
          try {
            const data = JSON.parse(message);

            // Handle connection status with proper notifications
            if (data?.cmd === "mqtt_connect" && data?.response?.code === 9001) {
              updateState({
                isConnected: true,
                isLoading: false,
              });

              // Clear status timeout and timer if this is in response to get_status
              if (statusTimeoutRef.current && action === "get_status") {
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
              }

              clearAllTimers();

              showUniqueNotification(
                "Service status connected successfully",
                "success"
              );

              // If this was in response to a get_status call, resolve it
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
                isLoading: false,
              });

              clearAllTimers();

              showUniqueNotification("Service status disconnected", "warning");

              // Clear status timeout if active since device is disconnected
              if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
              }

              // Clear any active actions since device is disconnected
              Object.keys(activeActions.current).forEach((actionKey) => {
                delete activeActions.current[actionKey];
                delete loggedActions.current[actionKey];
              });

              // If this was in response to a get_status call, resolve it as false
              if (action === "get_status") {
                clearTimeout(timeoutId);
                resolve(false);
                return;
              }
            }

            // Handle get_status response specifically
            if (data?.cmd === "get_status" && data?.response) {
              // Clear the status timeout since we got a response
              if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
              }

              clearAllTimers();

              updateState({ isLoading: false });

              // Check if response status is true and handle the data array
              if (
                data.response.status === true &&
                data.response.data &&
                Array.isArray(data.response.data)
              ) {
                data.response.data.forEach((service) => {
                  const deviceName = service.device;
                  const serviceStatus = service.status;
                  updateState({ isConnected: true, isLoading: false });
                  // Update session storage based on service status
                  switch (deviceName) {
                    case "id_scanner":
                      setSessionItem(
                        "idScannerConnectionStatus",
                        serviceStatus === "stopped" ? "false" : "true"
                      );
                      break;
                    case "key_dispenser":
                      setSessionItem(
                        "keyDispenserConnectionStatus",
                        serviceStatus === "stopped" ? "false" : "true"
                      );
                      break;
                    case "key_encoder":
                      setSessionItem(
                        "keyEncoderConnectionStatus",
                        serviceStatus === "stopped" ? "false" : "true"
                      );
                      break;
                    case "cash_recycler":
                      setSessionItem(
                        "cashRecyclerConnectionStatus",
                        serviceStatus === "stopped" ? "false" : "true"
                      );
                      break;
                    case "printer":
                      setSessionItem(
                        "printerConnectionStatus",
                        serviceStatus === "stopped" ? "false" : "true"
                      );
                      break;
                    case "service_status":
                      // Update our own status based on the service_status entry
                      updateState({ isConnected: serviceStatus === "running" });
                      break;
                    default:
                      break;
                  }
                });

                // Service status is considered connected if response.status is true
                updateState({ isConnected: true });
                showUniqueNotification(
                  data.response.message || "Service status check completed",
                  "success"
                );
              } else {
                // Handle case where response.status is false
                updateState({ isConnected: false });
                showUniqueNotification(
                  data.response.message || "Service status check failed",
                  "error"
                );
              }

              // Always resolve for get_status
              clearTimeout(timeoutId);
              delete activeActions.current[action];
              delete loggedActions.current[action];
              resolve(true);
              return;
            }

            if (!loggedActions.current[action]) {
              loggedActions.current[action] = true;
            }

            if (data?.cmd === action) {
              // Clear action timer when response is received
              clearAllTimers();

              updateState({ isLoading: false });

              // Convert both seq values to strings for comparison
              const dataSeq = String(data?.seq);
              const currentSeqSS = String(seqSSNumberRef.current);

              if (dataSeq === currentSeqSS || !seqSSNumberRef.current) {
                const responseStatus = data?.response?.status;

                showUniqueNotification(
                  data?.response?.message || `${action} completed`,
                  responseStatus === true ? "success" : "error"
                );

                if (data.cmd === "connect") {
                  updateState({ isConnected: responseStatus });
                }

                updateState({ keyError: null });
                clearTimeout(timeoutId);
                resolve(true);
              } else {
                updateState({ keyError: `Failed to ${action} Service status` });
                clearTimeout(timeoutId);
                resolve(false);
              }

              delete activeActions.current[action];
              delete loggedActions.current[action];
            }
          } catch (err) {
            clearAllTimers();
            updateState({
              keyError: "Error processing Service status response",
              isLoading: false,
            });
            delete activeActions.current[action];
            delete loggedActions.current[action];
            clearTimeout(timeoutId);
            resolve(false);
          }
        };
      });
    },
    [
      mqttState.isConnected,
      dispatch,
      userHotelSession?.id,
      deviceIds,
      handleStatusTimeout,
      updateState,
      showUniqueNotification,
      startActionTimer,
      startStatusTimer,
      clearAllTimers,
    ]
  );

  useEffect(() => {
    if (
      latestMessage &&
      messageHandlerRef.current &&
      newKioskConfig?.service_status
    ) {
      if (newKioskConfig?.service_status === latestMessage?.topic) {
        messageHandlerRef.current(latestMessage.message);
      }
    }
  }, [latestMessage, updateState]);

  const getStatus = useCallback(() => {
    return executeServiceStatusAction("get_status", "get_status");
  }, [executeServiceStatusAction]);

  const restart = useCallback(() => {
    return new Promise((resolve) => {
      if (activeActions.current["restart"] || !mqttState.isConnected) {
        resolve(false);
        return;
      }

      activeActions.current["restart"] = true;
      loggedActions.current["restart"] = false;

      const updates = {
        isLoading: true,
        keyError: null,
      };

      // Start timer for restart action (10 seconds)
      startActionTimer("restart", 10);

      updateState(updates);

      // Dispatch the restart action
      dispatch(
        restartServiceStatus({
          cmd: "restart",
          payload: { service: "service_status" },
          device_uuid_list: deviceIds,
        })
      );

      const timeoutId = setTimeout(() => {
        clearAllTimers();
        updateState({
          isLoading: false,
          keyError: "Restart timeout",
        });
        delete activeActions.current["restart"];
        delete loggedActions.current["restart"];
        resolve(false);
      }, 10000);

      // For now, we'll resolve after timeout or you can modify based on your restart response handling
      setTimeout(() => {
        clearAllTimers();
        updateState({
          isLoading: false,
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
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(intervalId);
  }, []);

  // Memoized return object with timer properties
  return useMemo(
    () => ({
      isConnected: state.isConnected,
      isLoading: state.isLoading,
      getStatus,
      restart,
      keyError: state.keyError,
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
      state.isLoading,
      state.keyError,
      state.actionTimer,
      state.statusTimer,
      state.isActionTimerActive,
      state.isStatusTimerActive,
      state.currentAction,
      getStatus,
      restart,
      clearAllTimers,
    ]
  );
};

export default useServiceStatus;
