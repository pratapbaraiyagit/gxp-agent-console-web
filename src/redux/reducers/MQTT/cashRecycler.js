import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// import { notification } from "../../../helpers/middleware";
import { cashRecyclerMQTT } from "../../../utils/apiEndPoint";
import { setSessionItem, getSessionItem } from "../../../hooks/session";

const initialState = {
  // connect
  cashRecyclerLoading: false,
  activeCashRecyclerList: [],
  isCashRecyclerUpdate: false,
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
export const cashRecyclerAction = createAsyncThunk(
  "cashRecycler/connect-cash-recycler",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(cashRecyclerMQTT, payload)
        .then((res) => {
          if (res.data.status) {
            mergePublishTopic(res.data.data, "cashRecycler");
            // notification(
            //   res.data.message || "Successfully connected",
            //   "success"
            // );
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "Connection failed", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(
          //   error?.response?.data?.message || "Connection error",
          //   "error"
          // );
          reject(error);
        });
    });
  }
);

export const cashRecyclerSlice = createSlice({
  name: "cashRecycler",
  initialState,
  reducers: {
    setIsConnectUpdate: (state, action) => {
      state.isCashRecyclerUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cashRecyclerAction.pending, (state) => {
        state.cashRecyclerLoading = true;
        state.isCashRecyclerUpdate = false;
      })
      .addCase(cashRecyclerAction.rejected, (state) => {
        state.cashRecyclerLoading = false;
        state.isCashRecyclerUpdate = false;
      })
      .addCase(cashRecyclerAction.fulfilled, (state, action) => {
        state.cashRecyclerLoading = false;
        state.isCashRecyclerUpdate = true;
        state.activeCashRecyclerList = action.payload;
      });
  },
});

export const { setIsConnectUpdate } = cashRecyclerSlice.actions;

export default cashRecyclerSlice.reducer;
