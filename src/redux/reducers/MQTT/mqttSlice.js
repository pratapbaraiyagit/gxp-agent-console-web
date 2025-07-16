import { createSlice } from "@reduxjs/toolkit";
import mqtt from "mqtt";
import { getSessionItem } from "../../../hooks/session";
import { notification } from "../../../helpers/middleware";

const generateGUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const UserSessionAgentConsole = getSessionItem("UserSessionAgentConsole");
const userHotelSession = UserSessionAgentConsole
  ? JSON.parse(decodeURIComponent(escape(atob(UserSessionAgentConsole))))
  : null;

const initialState = {
  client: null,
  isConnected: false,
  error: null,
  allMessages: [], // Array to store all messages
  maxMessages: 100, // Optional: limit the number of messages stored
};

const mqttSlice = createSlice({
  name: "mqtt",
  initialState,
  reducers: {
    setClient: (state, action) => {
      state.client = action.payload;
    },
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addMessage: (state, action) => {
      // Add message to the messages array
      if (action.payload) {
        state.allMessages.push({
          ...action.payload,
          timestamp: new Date().toISOString(),
          id: generateGUID(), // Add unique ID for each message
        });

        // Optional: Limit array size to prevent memory issues
        if (state.allMessages.length > state.maxMessages) {
          state.allMessages.shift(); // Remove oldest message
        }
      }
    },
    clearMessages: (state) => {
      state.allMessages = [];
    },
    removeMessage: (state, action) => {
      // Remove a specific message by ID
      state.allMessages = state.allMessages.filter(
        (msg) => msg.id !== action.payload
      );
    },
    clearClient: (state) => {
      state.client = null;
      state.isConnected = false;
      state.error = null;
      state.allMessages = []; // Clear all messages on disconnect
    },
  },
});

export const {
  setClient,
  setConnected,
  setError,
  addMessage,
  clearMessages,
  removeMessage,
  clearClient,
} = mqttSlice.actions;

// Selectors for easier access to messages
export const selectAllMessages = (state) => state.mqtt.allMessages;
export const selectLatestMessage = (state) => {
  const messages = state.mqtt.allMessages;
  return messages.length > 0 ? messages[messages.length - 1] : null;
};
export const selectMessagesByTopic = (state, topic) =>
  state.mqtt.allMessages.filter((msg) => msg.topic === topic);
export const selectMessagesByCommand = (state, cmd) =>
  state.mqtt.allMessages.filter((msg) => {
    try {
      const parsed = JSON.parse(msg.message);
      return parsed.cmd === cmd;
    } catch {
      return false;
    }
  });
export const selectRecentMessages = (state, count = 10) =>
  state.mqtt.allMessages.slice(-count);

export const initializeMQTT = (configPayload) => (dispatch, getState) => {
  try {
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    const clientId = `agentconsole-${userHotelSession?.email}-${randomNumber}`;

    const url = configPayload?.mqtt_config?.uri;

    if (!url) {
      dispatch(setError("MQTT URL not available"));
      return;
    }

    const options = {
      clean: true, // Changed from true to false for more stable connections
      connectTimeout: 4000, // Increased from 4000 to 10000ms
      clientId: clientId || "kiosk_emqx_test",
      username: configPayload?.mqtt_config?.username,
      password: configPayload?.mqtt_config?.password,
      keepalive: 60, // Added keepalive option
      reconnectPeriod: 5000, // Increased from 1000ms to 5000ms
      will: {
        topic: configPayload?.mqtt_config?.subscribe_topics?.console_agent,
        payload: JSON.stringify({
          cmd: "disconnect",
          seq: "9001",
          device_uuid_list: [configPayload?.device_id],
          payload: { agent_user_id: userHotelSession?.id },
        }),
        qos: 2,
        retain: false,
      },
    };

    // Create the connection
    const client = mqtt.connect(url, options);

    client.on("connect", () => {
      // notification("MQTT client connected successfully", "success");
      dispatch(setConnected(true));

      if (configPayload?.mqtt_config?.console_subscribe_topics) {
        const topicsArray = Object.values(
          configPayload.mqtt_config.console_subscribe_topics
        );

        topicsArray.forEach((topic) => {
          client.subscribe(topic, { qos: 2 }, (error) => {
            if (error) {
              // console.error(`Error subscribing to ${topic}:`, error);
            } else {
            }
          });
        });
      }
    });

    client.on("reconnect", () => {
      // notification("MQTT client reconnecting...", "warn");
    });

    client.on("offline", () => {
      // notification("MQTT client is offline", "warn");
      dispatch(setConnected(false));
    });

    client.on("disconnect", () => {
      notification("Disconnected from MQTT server", "warn");
      dispatch(setConnected(false));
    });

    client.on("error", (err) => {
      dispatch(setError(err.message));
    });

    client.on("close", () => {
      dispatch(setConnected(false));
    });

    client.on("message", (topic, message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        dispatch(addMessage({ topic, message: message.toString() }));
      } catch (error) {
        // console.error("Error handling MQTT message:", error);
      }
    });

    dispatch(setClient(client));
  } catch (error) {
    dispatch(setError(error.message));
  }
};

// Function to properly disconnect MQTT
export const disconnectMQTT = () => (dispatch, getState) => {
  if (getState && typeof getState === "function") {
    const state = getState();
    const client = state?.mqtt?.client;
    if (client) {
      try {
        // Simply end the connection with force=true
        client.end(true);
        // notification("MQTT client disconnected", "info");
        dispatch(clearClient());
      } catch (error) {
        // console.error("Error disconnecting MQTT client:", error);
        // Try to force close anyway
        try {
          client.end(true);
        } catch (endError) {
          // console.error("Error ending MQTT client:", endError);
        }
        dispatch(clearClient());
      }
    } else {
      dispatch(clearClient());
    }
  } else {
    dispatch(clearClient());
  }
};

export default mqttSlice.reducer;
