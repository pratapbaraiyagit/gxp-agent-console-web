import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { restartServiceStatus } from "../redux/reducers/MQTT/serviceStatus";
import { keyDispenserAction } from "../redux/reducers/MQTT/keyDispenser";
import { getSessionItem, setSessionItem } from "./session";
import { selectLatestMessage } from "../redux/reducers/MQTT/mqttSlice";
import { notification } from "../helpers/middleware";

const useKeyDispenser = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);
  const seqNumberRef = useRef(null);
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
  
  const latestMessage = useSelector(selectLatestMessage);

  // Get initial connection status from session storage
  const getInitialConnectionStatus = () => {
    const storedStatus = getSessionItem("keyDispenserConnectionStatus");
    if (storedStatus !== null) {
      return storedStatus === "true";
    }
    return false;
  };

  // Enhanced state management with timer properties
  const [state, setState] = useState({
    isDeviceStatusChecked: getInitialConnectionStatus(),
    isKeyDLoading: false,
    keyError: null,
    keyPosition: null,
    keyPositionData: null,
    // New timer states
    actionTimer: 0,
    statusTimer: 0,
    isActionTimerActive: false,
    isStatusTimerActive: false,
    currentAction: null,
  });

  // Use more specific selectors to prevent unnecessary re-renders
  const activeKioskDeviceList = useSelector(
    (state) => state.kioskDevice.activeKioskDeviceList
  );

  const activeKeyDispenserList = useSelector(
    (state) => state.keyDispenserSlice.activeKeyDispenserList
  );

  // Memoize device IDs to prevent recreation on every render
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
      if ("isDeviceStatusChecked" in updates) {
        setSessionItem(
          "keyDispenserConnectionStatus",
          updates.isDeviceStatusChecked ? "true" : "false"
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
      isKeyDLoading: false,
      isDeviceStatusChecked: false,
      keyError: "Connection timeout - Key Dispenser appears offline",
    });
    showUniqueNotification("Key Dispenser connection timeout", "error");

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
    if (activeKeyDispenserList?.[0]?.seq) {
      seqNumberRef.current = activeKeyDispenserList[0].seq;
    }
  }, [activeKeyDispenserList]);

  // Memoize the message handler to prevent recreation
  const createMessageHandler = useCallback(
    (action, resolve, timeoutId) => {
      return (message) => {
        try {
          const data = JSON.parse(message);

          // Handle connection status with proper notifications
          if (data?.cmd === "mqtt_connect" && data?.response?.code === 9001) {
            updateState({
              isDeviceStatusChecked: true,
              isKeyDLoading: false,
            });

            // Clear status timeout and timer if this is in response to get_status
            if (statusTimeoutRef.current && action === "get_status") {
              clearTimeout(statusTimeoutRef.current);
              statusTimeoutRef.current = null;
            }

            clearAllTimers();

            showUniqueNotification(
              "Key Dispenser connected successfully",
              "success"
            );
          } else if (
            data?.cmd === "mqtt_disconnect" &&
            data?.response?.code === 9002
          ) {
            updateState({
              isDeviceStatusChecked: false,
              isKeyDLoading: false,
            });

            clearAllTimers();

            showUniqueNotification("Key Dispenser disconnected", "warning");
          }

          // Handle get_status response specifically
          if (data?.cmd === "get_status" && data?.response) {
            // Clear the status timeout since we got a response
            if (statusTimeoutRef.current) {
              clearTimeout(statusTimeoutRef.current);
              statusTimeoutRef.current = null;
            }

            updateState({
              keyPositionData: data?.response?.data?.device_status,
            });
            
            clearAllTimers();

            const isConnected = true;
            updateState({
              isKeyDLoading: false,
              isDeviceStatusChecked: isConnected,
            });

            // Convert both seq values to strings for comparison
            const dataSeq = String(data?.seq);
            const currentSeq = String(seqNumberRef.current);

            if (dataSeq === currentSeq || !seqNumberRef.current) {
              showUniqueNotification(
                data?.response?.message ||
                  (isConnected
                    ? "Key Dispenser is online"
                    : "Key Dispenser is offline"),
                isConnected ? "success" : "error"
              );

              if (isConnected) {
                updateState({
                  keyPositionData: data?.response?.data?.device_status,
                });

                try {
                  const deviceStatusData =
                    typeof data?.response?.data?.device_status === "string"
                      ? JSON.parse(data?.response?.data?.device_status)
                      : data?.response?.data?.device_status;

                  updateState({
                    keyPosition: deviceStatusData?.card_position,
                  });

                  // if (
                  //   deviceStatusData?.card_position === "FRONT" ||
                  //   deviceStatusData?.card_position === "READER"
                  // ) {
                  //   moveCapture();
                  // }
                } catch (parseError) {
                  // console.error("Error parsing device status:", parseError);
                  updateState({
                    keyPositionData: data?.response?.data?.device_status,
                  });
                }
              }

              clearTimeout(timeoutId);
              resolve(true);
            } else {
              showUniqueNotification(
                data?.response?.message ||
                  (isConnected
                    ? "Key Dispenser is online"
                    : "Key Dispenser is offline"),
                isConnected ? "success" : "error"
              );
            }

            delete activeActions.current[action];
            delete loggedActions.current[action];
            return;
          }

          // Set general device status data
          if (data?.response?.status) {
            updateState({
              keyPositionData: data?.response?.data?.device_status,
            });
          }

          if (!loggedActions.current[action]) {
            loggedActions.current[action] = true;
          }

          if (data?.cmd === action) {
            // Clear action timer when response is received
            clearAllTimers();

            updateState({ isKeyDLoading: false });

            // Convert both seq values to strings for comparison
            const dataSeq = String(data?.seq);
            const currentSeq = String(seqNumberRef.current);

            if (dataSeq === currentSeq || !seqNumberRef.current) {
              const responseStatus = data?.response?.status;

              showUniqueNotification(
                data?.response?.message || `${action} completed`,
                responseStatus === true ? "success" : "error"
              );

              updateState({
                isDeviceStatusChecked: responseStatus,
                keyPositionData: data?.response?.data?.device_status,
              });

              // Handle specific command responses
              if (
                data?.cmd === "move_front" &&
                (dataSeq === currentSeq || !seqNumberRef.current)
              ) {
                updateState({ keyPosition: "FRONT" });
              } else if (
                data?.cmd === "move_reader" &&
                (dataSeq === currentSeq || !seqNumberRef.current)
              ) {
                updateState({ keyPosition: "READER" });
              } else if (
                data?.cmd === "move_capture" &&
                (dataSeq === currentSeq || !seqNumberRef.current)
              ) {
                updateState({ keyPosition: "FREE" });
              }

              updateState({ keyError: null });
              resolve(true);
            } else {
              updateState({ keyError: `Failed to ${action} Key Dispenser` });
              resolve(false);
            }

            clearTimeout(timeoutId);
            delete activeActions.current[action];
            delete loggedActions.current[action];
          }
        } catch (err) {
          clearAllTimers();
          updateState({
            keyError: "Error processing Key Dispenser response",
            isKeyDLoading: false,
          });
          delete activeActions.current[action];
          delete loggedActions.current[action];
          clearTimeout(timeoutId);
          resolve(false);
        }
      };
    },
    [updateState, showUniqueNotification, clearAllTimers]
  ); // moveCapture will be handled differently

  const executeDispenserAction = useCallback(
    (action, publishAction) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          resolve(false);
          return;
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;

        const updates = {
          isKeyDLoading: true,
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
          keyDispenserAction({
            cmd: publishAction,
            payload: {},
            device_uuid_list: deviceIds,
          })
        );

        const timeoutId = setTimeout(() => {
          clearAllTimers();
          updateState({
            isKeyDLoading: false,
            keyError: "Connection timeout",
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
      createMessageHandler,
      handleStatusTimeout,
      updateState,
      startActionTimer,
      startStatusTimer,
      clearAllTimers,
    ]
  );

  // Handle latest message effect
  useEffect(() => {
    if (
      latestMessage &&
      messageHandlerRef.current &&
      kioskConfig?.key_dispenser
    ) {
      if (kioskConfig.key_dispenser === latestMessage?.topic) {
        messageHandlerRef.current(latestMessage.message);
      }
    }
  }, [latestMessage, updateState]);

  // Action methods with proper dependencies
  const connectKeyDispenser = useCallback(() => {
    return executeDispenserAction("connect", "connect");
  }, [executeDispenserAction]);

  const moveFront = useCallback(() => {
    return executeDispenserAction("move_front", "move_front");
  }, [executeDispenserAction]);

  const moveReader = useCallback(() => {
    return executeDispenserAction("move_reader", "move_reader");
  }, [executeDispenserAction]);

  const moveCapture = useCallback(() => {
    return executeDispenserAction("move_capture", "move_capture");
  }, [executeDispenserAction]);

  const getKeyStatus = useCallback(() => {
    return executeDispenserAction("get_key_status", "get_key_status");
  }, [executeDispenserAction]);

  const statusKeyDispenser = useCallback(() => {
    return executeDispenserAction("get_status", "get_status");
  }, [executeDispenserAction]);

  const acceptKeyDispenser = useCallback(() => {
    return executeDispenserAction("accecpt_key", "accecpt_key");
  }, [executeDispenserAction]);

  const issueKeyDispenser = useCallback(() => {
    return executeDispenserAction("issue_key", "issue_key");
  }, [executeDispenserAction]);

  const deviceStatus = useCallback(() => {
    return executeDispenserAction("devicestatus", "devicestatus");
  }, [executeDispenserAction]);

  const disconnectKeyDispenser = useCallback(() => {
    clearAllTimers();
    updateState({ isDeviceStatusChecked: false });
  }, [updateState, clearAllTimers]);

  const reStartKeyDispenser = useCallback(() => {
    return new Promise((resolve) => {
      if (activeActions.current["restart"] || !mqttState.isConnected) {
        resolve(false);
        return;
      }

      activeActions.current["restart"] = true;
      loggedActions.current["restart"] = false;

      const updates = {
        isKeyDLoading: true,
        keyError: null,
      };

      // Start timer for restart action (10 seconds)
      startActionTimer("restart", 10);

      updateState(updates);

      // Dispatch the restart action
      dispatch(
        restartServiceStatus({
          cmd: "restart",
          payload: { service: "key_dispenser" },
          device_uuid_list: deviceIds,
        })
      );

      const timeoutId = setTimeout(() => {
        clearAllTimers();
        updateState({
          isKeyDLoading: false,
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
          isKeyDLoading: false,
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

  // Memoize return object with timer properties
  return useMemo(
    () => ({
      isKeyDLoading: state.isKeyDLoading,
      keyError: state.keyError,
      connectKeyDispenser,
      moveFront,
      moveReader,
      moveCapture,
      getKeyStatus,
      statusKeyDispenser,
      acceptKeyDispenser,
      issueKeyDispenser,
      deviceStatus,
      keyPosition: state.keyPosition,
      keyPositionData: state.keyPositionData,
      setKeyPosition: (position) => updateState({ keyPosition: position }),
      isDeviceStatusChecked: state.isDeviceStatusChecked,
      disconnectKeyDispenser,
      reStartKeyDispenser,
      // New timer properties
      actionTimer: state.actionTimer,
      statusTimer: state.statusTimer,
      isActionTimerActive: state.isActionTimerActive,
      isStatusTimerActive: state.isStatusTimerActive,
      currentAction: state.currentAction,
      clearAllTimers,
    }),
    [
      state.isKeyDLoading,
      state.keyError,
      state.keyPosition,
      state.keyPositionData,
      state.isDeviceStatusChecked,
      state.actionTimer,
      state.statusTimer,
      state.isActionTimerActive,
      state.isStatusTimerActive,
      state.currentAction,
      connectKeyDispenser,
      moveFront,
      moveReader,
      moveCapture,
      getKeyStatus,
      statusKeyDispenser,
      acceptKeyDispenser,
      issueKeyDispenser,
      deviceStatus,
      disconnectKeyDispenser,
      reStartKeyDispenser,
      updateState,
      clearAllTimers,
    ]
  );
};

export default useKeyDispenser;
