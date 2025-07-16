import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// import { notification } from "../../../helpers/middleware";
import { kioskMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  kioskMQTTLoading: false, // keep for backward compatibility
  commandLoadingStates: {
    // Individual loading states for each command
    move_home: false,
    draw_sign: false,
    capture_selfie: false,
    ask_email_mob: false,
    ask_vehicle_no: false,
    scan_id: false,
    kiosk_self: false,
    kiosk_agent: false,
    kiosk_close: false,
    screen_capture: false,
    screen_mode: false,
    refresh: false,
    // Add more commands as needed
  },
  activeKioskMQTTList: [],
  isKioskMQTTUpdate: false,
  lastCommand: null,
};

export const kioskMQTTAction = createAsyncThunk(
  "kioskMQTT/connect-kioskMQTT-d",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(kioskMQTT, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Successfully connected",
            //   "success"
            // );
            resolve({ data: res.data.data, command: payload.cmd });
          } else {
            // notification(res?.data?.message || "Connection failed", "error");
            reject({ command: payload.cmd });
          }
        })
        .catch((error) => {
          // notification(
          //   error?.response?.data?.message || "Connection error",
          //   "error"
          // );
          reject({ error, command: payload.cmd });
        });
    });
  }
);

export const kioskMQTTSlice = createSlice({
  name: "kioskMQTT",
  initialState,
  reducers: {
    setIsKioskMQTTUpdate: (state, action) => {
      state.isKioskMQTTUpdate = action.payload;
    },
    // Add action to reset loading state for a specific command
    resetCommandLoadingState: (state, action) => {
      const command = action.payload;
      if (command && state.commandLoadingStates[command] !== undefined) {
        state.commandLoadingStates[command] = false;
      }
    },
    // Reset all loading states
    resetAllCommandLoadingStates: (state) => {
      Object.keys(state.commandLoadingStates).forEach((key) => {
        state.commandLoadingStates[key] = false;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(kioskMQTTAction.pending, (state, action) => {
        // Extract command from the action meta
        const command = action.meta.arg.cmd;

        // Set global loading state (for backward compatibility)
        state.kioskMQTTLoading = true;

        // Set command-specific loading state
        if (command && state.commandLoadingStates[command] !== undefined) {
          state.commandLoadingStates[command] = true;
        }

        state.lastCommand = command;
        state.isKioskMQTTUpdate = false;
      })
      .addCase(kioskMQTTAction.rejected, (state, action) => {
        // Extract command from the error payload if available
        const command = action.error?.command || state.lastCommand;

        // Set global loading state (for backward compatibility)
        state.kioskMQTTLoading = false;

        // Set command-specific loading state
        if (command && state.commandLoadingStates[command] !== undefined) {
          state.commandLoadingStates[command] = false;
        }

        state.isKioskMQTTUpdate = false;
      })
      .addCase(kioskMQTTAction.fulfilled, (state, action) => {
        // Extract command from action payload
        const command = action.payload.command;

        // Set global loading state (for backward compatibility)
        state.kioskMQTTLoading = false;

        // Set command-specific loading state
        if (command && state.commandLoadingStates[command] !== undefined) {
          state.commandLoadingStates[command] = false;
        }

        state.isKioskMQTTUpdate = true;
        state.activeKioskMQTTList = action.payload.data;
      });
  },
});

export const {
  setIsKioskMQTTUpdate,
  resetCommandLoadingState,
  resetAllCommandLoadingStates,
} = kioskMQTTSlice.actions;

export default kioskMQTTSlice.reducer;
