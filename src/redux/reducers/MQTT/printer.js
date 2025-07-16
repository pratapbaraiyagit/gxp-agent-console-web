import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { printerMQTT } from "../../../utils/apiEndPoint";
import { setSessionItem, getSessionItem } from "../../../hooks/session";

const initialState = {
  // connect
  printerLoading: false,
  activePrinterList: [],
  isPrinterUpdate: false,
};

// Helper function to merge publish topics (defined inline to avoid new file)
const mergePublishTopic = (newData, source) => {
  try {
    // Get existing data
    const existingEncoded = getSessionItem("publishTopic");
    let existingData = [];

    if (existingEncoded) {
      // Decode existing data
      const decoded = decodeURIComponent(escape(atob(existingEncoded)));
      existingData = JSON.parse(decoded);
    }

    // Merge data
    let mergedData;

    if (Array.isArray(existingData)) {
      // If it's already an array, filter out any items with the same source
      const filteredData = existingData.filter(
        (item) => !item.source || item.source !== source
      );

      // Add the new data with source identifier
      const newItem = { ...newData, source };
      mergedData = [...filteredData, newItem];
    } else {
      // If existing data is an object or empty, convert to array
      const existingItem =
        Object.keys(existingData).length > 0
          ? { ...existingData, source: "unknown" }
          : null;

      const newItem = { ...newData, source };
      mergedData = existingItem ? [existingItem, newItem] : [newItem];
    }

    // Encode and store the merged data
    const encoded = btoa(
      unescape(encodeURIComponent(JSON.stringify(mergedData)))
    );
    setSessionItem("publishTopic", encoded);

    return mergedData;
  } catch (error) {
    // Fallback to just setting the new data
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(newData))));
    setSessionItem("publishTopic", encoded);
    return newData;
  }
};

// Connect
export const printerAction = createAsyncThunk(
  "printer/connect-printer",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(printerMQTT, payload)
        .then((res) => {
          if (res.data.status) {
            mergePublishTopic(res.data.data, "printer");
            notification(
              res.data.message || "Successfully connected",
              "success"
            );
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "Connection failed", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(
            error?.response?.data?.message || "Connection error",
            "error"
          );
          reject(error);
        });
    });
  }
);

export const printerSlice = createSlice({
  name: "printer",
  initialState,
  reducers: {
    setIsConnectUpdate: (state, action) => {
      state.isPrinterUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(printerAction.pending, (state) => {
        state.printerLoading = true;
        state.isPrinterUpdate = false;
      })
      .addCase(printerAction.rejected, (state) => {
        state.printerLoading = false;
        state.isPrinterUpdate = false;
      })
      .addCase(printerAction.fulfilled, (state, action) => {
        state.printerLoading = false;
        state.isPrinterUpdate = true;
        state.activePrinterList = action.payload;
      });
  },
});

export const { setIsConnectUpdate } = printerSlice.actions;

export default printerSlice.reducer;
