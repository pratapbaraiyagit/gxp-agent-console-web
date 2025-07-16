import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { keyEncoderAction } from "../redux/reducers/MQTT/keyEncoder";
import { restartServiceStatus } from "../redux/reducers/MQTT/serviceStatus";
import { getSessionItem, setSessionItem } from "./session";
import { selectLatestMessage } from "../redux/reducers/MQTT/mqttSlice";
import { notification } from "../helpers/middleware";

const useKeyEncoder = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);
  const seqKDNumberRef = useRef(null);
  const seqKENumberRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);
  const keyDataRef = useRef(null);
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

  const KioskDeviceInfo = getSessionItem("KioskDeviceInfo");
  const KioskDeviceInfoSession = KioskDeviceInfo
    ? JSON.parse(decodeURIComponent(escape(atob(KioskDeviceInfo))))
    : null;

  const newKioskConfig =
    kioskSession?.[0]?.mqtt_config?.console_subscribe_topics;
  

  const newKioskDeviceInfo = KioskDeviceInfoSession?.[0]?.mode;
  const latestMessage = useSelector(selectLatestMessage);

  // Get initial connection status from session storage
  const getInitialConnectionStatus = () => {
    const storedStatus = getSessionItem("keyEncoderConnectionStatus");
    if (storedStatus !== null) {
      return storedStatus === "true";
    }
    return false;
  };

  // Enhanced state management with timer properties
  const [state, setState] = useState({
    isConnected: getInitialConnectionStatus(),
    isKEConnect: false,
    isKeyELoading: false,
    keyError: null,
    keyPosition: null,
    // New timer states
    actionTimer: 0,
    statusTimer: 0,
    isActionTimerActive: false,
    isStatusTimerActive: false,
    currentAction: null,
  });

  const { activeKeyEncoderList } = useSelector(
    ({ keyEncoderSlice }) => keyEncoderSlice
  );

  const { activeKeyDispenserList } = useSelector(
    ({ keyDispenserSlice }) => keyDispenserSlice
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
          "keyEncoderConnectionStatus",
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
    const notificationKey = `keyEncoder-${message}-${type}`;
    if (!shownNotificationsRef.current.has(notificationKey)) {
      notification(message, type);
      shownNotificationsRef.current.add(notificationKey);
    }
  }, []);

  // Enhanced timeout management for status checking
  const handleStatusTimeout = useCallback(() => {
    updateState({
      isKeyELoading: false,
      isConnected: false,
      keyError: "Connection timeout - Key Encoder appears offline",
    });
    showUniqueNotification("Key Encoder connection timeout", "error");

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
      seqKDNumberRef.current = activeKeyDispenserList[0].seq;
    }
  }, [activeKeyDispenserList]);

  useEffect(() => {
    if (activeKeyEncoderList?.[0]?.seq) {
      seqKENumberRef.current = activeKeyEncoderList[0].seq;
    }
  }, [activeKeyEncoderList]);

  const executeEncoderAction = useCallback(
    (action, publishAction, keyData = null) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          resolve(false);
          return;
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;

        const updates = {
          isKeyELoading: true,
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

        const actionPayload = {
          cmd: publishAction,
          payload: {
            agent_user_id: userHotelSession?.id,
            ...(keyData && { ...keyData }),
          },
          device_uuid_list: deviceIds,
        };

        dispatch(keyEncoderAction(actionPayload));

        const timeoutId = setTimeout(() => {
          clearAllTimers();
          updateState({
            isKeyELoading: false,
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
                isKeyELoading: false,
              });

              // Clear status timeout and timer if this is in response to get_status
              if (statusTimeoutRef.current && action === "get_status") {
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
              }

              clearAllTimers();

              showUniqueNotification(
                data?.response?.message || "Key Encoder connected successfully",
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
                isKeyELoading: false,
              });

              clearAllTimers();

              showUniqueNotification(
                data?.response?.message || "Key Encoder disconnected",
                "warning"
              );

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

              const isConnected = true;
              updateState({
                isKeyELoading: false,
                isConnected: isConnected,
              });

              // Convert both seq values to strings for comparison
              const dataSeq = String(data?.seq);
              const currentSeqKD = String(seqKDNumberRef.current);
              const currentSeqKE = String(seqKENumberRef.current);

              if (
                dataSeq === currentSeqKD ||
                dataSeq === currentSeqKE ||
                !seqKDNumberRef.current
              ) {
                showUniqueNotification(
                  data?.response?.message ||
                    (isConnected
                      ? "Key Encoder is online"
                      : "Key Encoder is offline"),
                  isConnected ? "success" : "error"
                );

                if (isConnected) {
                  updateState({ isKEConnect: true });
                  const dataNew = data?.response?.data?.device_status;
                  updateState({ keyPosition: dataNew?.card_position });

                  // Trigger next action based on card location
                  if (dataNew?.card_position === "FREE") {
                    moveReader();
                  } else if (
                    dataNew?.card_position === "FRONT" &&
                    (dataSeq === currentSeqKD || !seqKDNumberRef.current)
                  ) {
                    // moveCapture();
                  } else if (
                    dataNew?.card_position === "READER" &&
                    (dataSeq === currentSeqKD || !seqKDNumberRef.current)
                  ) {
                    if (newKioskDeviceInfo !== "live") {
                      moveFront();
                    } else {
                      write();
                    }
                  }
                }

                clearTimeout(timeoutId);
                resolve(true);
              } else {
                showUniqueNotification(
                  data?.response?.message ||
                    (isConnected
                      ? "Key Encoder is online"
                      : "Key Encoder is offline"),
                  isConnected ? "success" : "error"
                );
              }

              delete activeActions.current[action];
              delete loggedActions.current[action];
              return;
            }

            if (!loggedActions.current[action]) {
              loggedActions.current[action] = true;
            }

            if (data?.cmd === action) {
              // Clear action timer when response is received
              clearAllTimers();

              updateState({ isKeyELoading: false });

              // Convert both seq values to strings for comparison
              const dataSeq = String(data?.seq);
              const currentSeqKD = String(seqKDNumberRef.current);
              const currentSeqKE = String(seqKENumberRef.current);

              if (
                dataSeq === currentSeqKD ||
                dataSeq === currentSeqKE ||
                !seqKDNumberRef.current
              ) {
                const responseStatus = data?.response?.status;

                showUniqueNotification(
                  data?.response?.message || `${action} completed`,
                  responseStatus === true ? "success" : "error"
                );

                if (data.cmd === "connect") {
                  updateState({
                    isKEConnect: responseStatus,
                    isConnected: responseStatus,
                  });
                }

                // Handle various command responses
                if (
                  data.cmd === "move_reader" &&
                  (dataSeq === currentSeqKD || !seqKDNumberRef.current)
                ) {
                  updateState({ keyPosition: "READER" });
                  if (newKioskDeviceInfo !== "live") {
                    moveFront();
                  } else {
                    write();
                  }
                } else if (
                  data.cmd === "move_capture" &&
                  (dataSeq === currentSeqKE || !seqKENumberRef.current)
                ) {
                  updateState({ keyPosition: "FREE" });
                  moveReader();
                } else if (
                  data.cmd === "write_key" &&
                  (dataSeq === currentSeqKD || !seqKDNumberRef.current)
                ) {
                  moveFront();
                } else if (
                  data.cmd === "move_front" &&
                  (dataSeq === currentSeqKD || !seqKDNumberRef.current)
                ) {
                  updateState({ keyPosition: "FRONT" });
                }

                updateState({ keyError: null });
                clearTimeout(timeoutId);
                resolve(true);
              } else {
                updateState({ keyError: `Failed to ${action} Key Encoder` });
                clearTimeout(timeoutId);
                resolve(false);
              }

              delete activeActions.current[action];
              delete loggedActions.current[action];
            }
          } catch (err) {
            clearAllTimers();
            updateState({
              keyError: "Error processing Key Encoder response",
              isKeyELoading: false,
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
      deviceIds,
      userHotelSession?.id,
      handleStatusTimeout,
      updateState,
      showUniqueNotification,
      newKioskDeviceInfo,
      startActionTimer,
      startStatusTimer,
      clearAllTimers,
    ]
  );

  useEffect(() => {
    if (
      latestMessage &&
      messageHandlerRef.current &&
      newKioskConfig?.key_encoder
    ) {
      if (newKioskConfig?.key_encoder === latestMessage?.topic) {
        messageHandlerRef.current(latestMessage.message);
      }
    }
  }, [latestMessage, updateState]);

  const connectKeyEncoder = useCallback(() => {
    return executeEncoderAction("connect", "connect");
  }, [executeEncoderAction]);

  const moveFront = useCallback(() => {
    return executeEncoderAction("move_front", "move_front");
  }, [executeEncoderAction]);

  const moveReader = useCallback(() => {
    return executeEncoderAction("move_reader", "move_reader");
  }, [executeEncoderAction]);

  const write = useCallback(
    (keyData = null) => {
      const dataToWrite = keyData || keyDataRef.current || {};
      keyDataRef.current = dataToWrite;
      return executeEncoderAction("write_key", "write_key", dataToWrite);
    },
    [executeEncoderAction]
  );

  const moveCapture = useCallback(() => {
    return executeEncoderAction("move_capture", "move_capture");
  }, [executeEncoderAction]);

  const statusKeyEncoder = useCallback(() => {
    return executeEncoderAction("get_status", "get_status");
  }, [executeEncoderAction]);

  const reStartKeyEncoder = useCallback(() => {
    return new Promise((resolve) => {
      if (activeActions.current["restart"] || !mqttState.isConnected) {
        resolve(false);
        return;
      }

      activeActions.current["restart"] = true;
      loggedActions.current["restart"] = false;

      const updates = {
        isKeyELoading: true,
        keyError: null,
      };

      // Start timer for restart action (10 seconds)
      startActionTimer("restart", 10);

      updateState(updates);

      // Dispatch the restart action
      dispatch(
        restartServiceStatus({
          cmd: "restart",
          payload: { service: "key_encoder" },
          device_uuid_list: deviceIds,
        })
      );

      const timeoutId = setTimeout(() => {
        clearAllTimers();
        updateState({
          isKeyELoading: false,
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
          isKeyELoading: false,
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
      keyDataRef.current = null;
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

  // Return object with timer properties
  return useMemo(
    () => ({
      isKeyELoading: state.isKeyELoading,
      keyError: state.keyError,
      connectKeyEncoder,
      moveFront,
      moveReader,
      write,
      moveCapture,
      statusKeyEncoder,
      keyPosition: state.keyPosition,
      setKeyPosition: (position) => updateState({ keyPosition: position }),
      isKEConnect: state.isKEConnect,
      isConnected: state.isConnected,
      reStartKeyEncoder,
      // New timer properties
      actionTimer: state.actionTimer,
      statusTimer: state.statusTimer,
      isActionTimerActive: state.isActionTimerActive,
      isStatusTimerActive: state.isStatusTimerActive,
      currentAction: state.currentAction,
      clearAllTimers,
    }),
    [
      state.isKeyELoading,
      state.keyError,
      state.keyPosition,
      state.isKEConnect,
      state.isConnected,
      state.actionTimer,
      state.statusTimer,
      state.isActionTimerActive,
      state.isStatusTimerActive,
      state.currentAction,
      connectKeyEncoder,
      moveFront,
      moveReader,
      write,
      moveCapture,
      statusKeyEncoder,
      reStartKeyEncoder,
      updateState,
      clearAllTimers,
    ]
  );
};

export default useKeyEncoder;