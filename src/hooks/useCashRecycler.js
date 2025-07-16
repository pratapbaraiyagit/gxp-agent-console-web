import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getSessionItem, setSessionItem } from "./session";
import { cashRecyclerConsoleMQTTAction } from "../redux/reducers/MQTT/cashRecyclerConsoleMQTT";
import { getcashTransactionDetails } from "../redux/reducers/Booking/cashTransaction";
import { notification } from "../helpers/middleware";
import { selectLatestMessage } from "../redux/reducers/MQTT/mqttSlice";
import { restartServiceStatus } from "../redux/reducers/MQTT/serviceStatus";

const useCashRecycler = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector((state) => state.mqtt);
  const latestMessage = useSelector(selectLatestMessage);
  const activecashRecyclerConsoleMQTTList = useSelector(
    (state) => state.cashRecyclerConsoleMQTT.activecashRecyclerConsoleMQTTList
  );
  const activeKioskDeviceList = useSelector(
    (state) => state.kioskDevice.activeKioskDeviceList
  );

  // Refs for managing state
  const seqNumberRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const activeActions = useRef({});
  const loggedActions = useRef({});
  const messageHandlerRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const shownNotificationsRef = useRef(new Set());

  // New refs for timer functionality
  const timerIntervalRef = useRef(null);
  const statusTimerIntervalRef = useRef(null);

  // Get initial connection status from session storage
  const getInitialConnectionStatus = () => {
    const storedStatus = getSessionItem("cashRecyclerConnectionStatus");
    if (storedStatus !== null) {
      return storedStatus === "true";
    }
    return false;
  };

  // Enhanced state management with timer properties
  const [state, setState] = useState({
    isCashRecyclerConnected: getInitialConnectionStatus(),
    isCashRecyclerLoading: false,
    cashRecyclerError: null,
    // New timer states
    actionTimer: 0,
    statusTimer: 0,
    isActionTimerActive: false,
    isStatusTimerActive: false,
    currentAction: null,
  });

  let kioskConfig = null;

  const kioskData = getSessionItem("KioskConfig");
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

  // Memoized device IDs
  const deviceIds = useMemo(() => {
    return (
      activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || []
    );
  }, [activeKioskDeviceList]);

  // Memoized user session
  const userHotelSession = useMemo(() => {
    const userData = getSessionItem("UserSessionAgentConsole");
    return userData
      ? JSON.parse(decodeURIComponent(escape(atob(userData))))
      : null;
  }, []);

  // Batch state updates to reduce re-renders
  const updateState = useCallback((updates) => {
    setState((prevState) => {
      const newState = { ...prevState, ...updates };

      // Store connection status in session storage when it changes
      if ("isCashRecyclerConnected" in updates) {
        setSessionItem(
          "cashRecyclerConnectionStatus",
          updates.isCashRecyclerConnected ? "true" : "false"
        );
      }

      return newState;
    });
  }, []);

  // Timer management functions
  const startActionTimer = useCallback(
    (action, duration = 30) => {
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
    (duration = 30) => {
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
    const notificationKey = `cashRecycler-${message}-${type}`;
    if (!shownNotificationsRef.current.has(notificationKey)) {
      notification(message, type);
      shownNotificationsRef.current.add(notificationKey);
    }
  }, []);

  // Enhanced timeout management for status checking
  const handleStatusTimeout = useCallback(() => {
    updateState({
      isCashRecyclerLoading: false,
      isCashRecyclerConnected: false,
      cashRecyclerError: "Connection timeout - Cash Recycler appears offline",
    });
    showUniqueNotification("Cash Recycler connection timeout", "error");

    // Clear timers and active actions
    clearAllTimers();
    delete activeActions.current["get_status"];
    delete loggedActions.current["get_status"];

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  }, [updateState, showUniqueNotification, clearAllTimers]);

  // Update sequence number when state changes
  useEffect(() => {
    if (activecashRecyclerConsoleMQTTList?.[0]?.seq) {
      seqNumberRef.current = activecashRecyclerConsoleMQTTList[0].seq;
    }
  }, [activecashRecyclerConsoleMQTTList]);

  // Execute cash recycler action
  const executeCashRecyclerAction = useCallback(
    (action, publishAction, transactionData = {}) => {
      return new Promise((resolve) => {
        if (activeActions.current[action] || !mqttState.isConnected) {
          resolve(false);
          return;
        }

        activeActions.current[action] = true;
        loggedActions.current[action] = false;

        const updates = {
          isCashRecyclerLoading: true,
          cashRecyclerError: null,
        };

        if (action === "get_status") {
          // Start both timeout and timer for status checks
          statusTimeoutRef.current = setTimeout(handleStatusTimeout, 30000);
          startStatusTimer(30);
        } else {
          // Start timer for other actions (30 seconds)
          startActionTimer(action, 30);
        }

        updateState(updates);

        const basePayload = {
          cmd: publishAction,
          device_uuid_list: deviceIds,
        };

        let actionPayload;
        if (["get_status", "connect", "disconnect"].includes(publishAction)) {
          actionPayload = {
            ...basePayload,
            payload: {
              agent_user_id: userHotelSession?.id,
            },
          };
        } else if (
          ["collection", "refund", "empty_cashbox"].includes(publishAction)
        ) {
          actionPayload = {
            ...basePayload,
            payload: {
              agent_user_id: userHotelSession?.id,
              total_amount: transactionData?.amount || 1,
              booking_id: transactionData?.booking_id || "",
              transaction_type: transactionData?.transactionType || "",
              guest_name: transactionData?.guestName || "",
            },
          };
        }

        dispatch(cashRecyclerConsoleMQTTAction(actionPayload));

        const timeoutId = setTimeout(() => {
          clearAllTimers();
          updateState({
            isCashRecyclerLoading: false,
            cashRecyclerError: "Connection timeout",
          });
          delete activeActions.current[action];
          delete loggedActions.current[action];
          resolve(false);
        }, 30000);

        timeoutIdRef.current = timeoutId;

        messageHandlerRef.current = (message) => {
          try {
            const data = JSON.parse(message);

            // Handle connection status
            if (data?.cmd === "mqtt_connect" && data?.response?.code === 9001) {
              updateState({
                isCashRecyclerConnected: true,
                isCashRecyclerLoading: false,
              });

              // Clear status timeout and timer if this is in response to get_status
              if (statusTimeoutRef.current && action === "get_status") {
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
              }

              clearAllTimers();

              showUniqueNotification(
                data?.response?.message ||
                  "Cash Recycler connected successfully",
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
                isCashRecyclerConnected: false,
                isCashRecyclerLoading: false,
              });

              clearAllTimers();

              showUniqueNotification(
                data?.response?.message || "Cash Recycler disconnected",
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

            // Handle transaction operations
            if (data?.cmd === "transaction_operations") {
              const isSuccess = data?.payload?.command_result === "success";
              const commandType = data?.payload?.command_data?.transaction_type;

              // Clear status timeout for get_status
              if (commandType === "get_status" && statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
              }

              // Clear action timer when response is received
              clearAllTimers();

              updateState({
                isCashRecyclerLoading: false,
                isCashRecyclerConnected: isSuccess,
              });

              // Convert both seq values to strings for comparison
              const dataSeq = String(data?.seq);
              const currentSeq = String(seqNumberRef.current);

              if (dataSeq === currentSeq || !seqNumberRef.current) {
                showUniqueNotification(
                  data?.payload?.command_message ||
                    (isSuccess
                      ? `${action} completed successfully`
                      : `${action} failed`),
                  isSuccess ? "success" : "error"
                );

                // Handle cash transaction details for get_status
                if (
                  commandType === "get_status" &&
                  data?.payload?.cash_transaction_id
                ) {
                  dispatch(
                    getcashTransactionDetails(
                      data?.payload?.cash_transaction_id
                    )
                  );
                }

                updateState({ cashRecyclerError: null });
                clearTimeout(timeoutId);
                resolve(true);
              } else {
                updateState({
                  cashRecyclerError: `Failed to ${action} Cash Recycler`,
                });
                clearTimeout(timeoutId);
                resolve(false);
              }

              delete activeActions.current[action];
              delete loggedActions.current[action];
            }

            if (!loggedActions.current[action]) {
              loggedActions.current[action] = true;
            }
          } catch (err) {
            clearAllTimers();
            updateState({
              cashRecyclerError: "Error processing Cash Recycler response",
              isCashRecyclerLoading: false,
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
      dispatch,
      handleStatusTimeout,
      updateState,
      showUniqueNotification,
      startActionTimer,
      startStatusTimer,
      clearAllTimers,
    ]
  );

  // Handle latest message
  useEffect(() => {
    if (
      latestMessage &&
      messageHandlerRef.current &&
      kioskConfig?.cash_recycler
    ) {
      if (kioskConfig.cash_recycler === latestMessage?.topic) {
        messageHandlerRef.current(latestMessage.message);
      }
    }
  }, [latestMessage, updateState]);

  // Action methods
  const connectCashRecycler = useCallback(() => {
    return executeCashRecyclerAction("connect", "connect");
  }, [executeCashRecyclerAction]);

  const disconnectCashRecycler = useCallback(() => {
    clearAllTimers();
    updateState({ isCashRecyclerConnected: false });
  }, [updateState, clearAllTimers]);

  const statusCashRecycler = useCallback(() => {
    return executeCashRecyclerAction("get_status", "get_status");
  }, [executeCashRecyclerAction]);

  const collectionCashRecycler = useCallback(
    (transactionData = {}) => {
      return executeCashRecyclerAction(
        "collection",
        "collection",
        transactionData
      );
    },
    [executeCashRecyclerAction]
  );

  const refundCashRecycler = useCallback(
    (transactionData = {}) => {
      return executeCashRecyclerAction("refund", "refund", transactionData);
    },
    [executeCashRecyclerAction]
  );

  const empty_cashboxCashRecycler = useCallback(() => {
    return executeCashRecyclerAction("empty_cashbox", "empty_cashbox");
  }, [executeCashRecyclerAction]);

  const reStartCashRecycler = useCallback(() => {
    return new Promise((resolve) => {
      if (activeActions.current["restart"] || !mqttState.isConnected) {
        resolve(false);
        return;
      }

      activeActions.current["restart"] = true;
      loggedActions.current["restart"] = false;

      const updates = {
        isCashRecyclerLoading: true,
        cashRecyclerError: null,
      };

      // Start timer for restart action (30 seconds)
      startActionTimer("restart", 30);

      updateState(updates);

      // Dispatch the restart action
      dispatch(
        restartServiceStatus({
          cmd: "restart",
          payload: { service: "cash_recycler" },
          device_uuid_list: deviceIds,
        })
      );

      const timeoutId = setTimeout(() => {
        clearAllTimers();
        updateState({
          isCashRecyclerLoading: false,
          cashRecyclerError: "Restart timeout",
        });
        delete activeActions.current["restart"];
        delete loggedActions.current["restart"];
        resolve(false);
      }, 30000);

      // For now, we'll resolve after timeout or you can modify based on your restart response handling
      setTimeout(() => {
        clearAllTimers();
        updateState({
          isCashRecyclerLoading: false,
        });
        delete activeActions.current["restart"];
        delete loggedActions.current["restart"];
        clearTimeout(timeoutId);
        resolve(true);
      }, 30000);
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
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(intervalId);
  }, []);

  // Memoized return object with timer properties
  return useMemo(
    () => ({
      isCashRecyclerLoading: state.isCashRecyclerLoading,
      isCashRecyclerConnected: state.isCashRecyclerConnected,
      cashRecyclerError: state.cashRecyclerError,
      connectCashRecycler,
      disconnectCashRecycler,
      statusCashRecycler,
      collectionCashRecycler,
      refundCashRecycler,
      empty_cashboxCashRecycler,
      reStartCashRecycler,
      updateConnectionStatus: (status) =>
        updateState({ isCashRecyclerConnected: status }),
      // New timer properties
      actionTimer: state.actionTimer,
      statusTimer: state.statusTimer,
      isActionTimerActive: state.isActionTimerActive,
      isStatusTimerActive: state.isStatusTimerActive,
      currentAction: state.currentAction,
      clearAllTimers,
    }),
    [
      state.isCashRecyclerLoading,
      state.isCashRecyclerConnected,
      state.cashRecyclerError,
      state.actionTimer,
      state.statusTimer,
      state.isActionTimerActive,
      state.isStatusTimerActive,
      state.currentAction,
      connectCashRecycler,
      disconnectCashRecycler,
      statusCashRecycler,
      collectionCashRecycler,
      refundCashRecycler,
      empty_cashboxCashRecycler,
      reStartCashRecycler,
      updateState,
      clearAllTimers,
    ]
  );
};

export default useCashRecycler;
