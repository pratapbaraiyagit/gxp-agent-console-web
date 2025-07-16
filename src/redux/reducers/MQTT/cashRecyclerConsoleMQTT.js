import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// import { notification } from "../../../helpers/middleware";
import { cashRecyclerConsoleMQTT } from "../../../utils/apiEndPoint";

const initialState = {
  cashRecyclerConsoleMQTTLoading: false,
  activecashRecyclerConsoleMQTTList: [],
  iscashRecyclerConsoleMQTTUpdate: false,
};

export const cashRecyclerConsoleMQTTAction = createAsyncThunk(
  "cashRecyclerConsoleMQTT/connect-cashRecyclerConsoleMQTT-d",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(cashRecyclerConsoleMQTT, payload)
        .then((res) => {
          if (res.data.status) {
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

export const cashRecyclerConsoleMQTTSlice = createSlice({
  name: "cashRecyclerConsoleMQTT",
  initialState,
  reducers: {
    setIscashRecyclerConsoleMQTTUpdate: (state, action) => {
      state.iscashRecyclerConsoleMQTTUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(cashRecyclerConsoleMQTTAction.pending, (state) => {
        state.cashRecyclerConsoleMQTTLoading = true;
        state.iscashRecyclerConsoleMQTTUpdate = false;
      })
      .addCase(cashRecyclerConsoleMQTTAction.rejected, (state) => {
        state.cashRecyclerConsoleMQTTLoading = false;
        state.iscashRecyclerConsoleMQTTUpdate = false;
      })
      .addCase(cashRecyclerConsoleMQTTAction.fulfilled, (state, action) => {
        state.cashRecyclerConsoleMQTTLoading = false;
        state.iscashRecyclerConsoleMQTTUpdate = true;
        state.activecashRecyclerConsoleMQTTList = action.payload;
      });
  },
});

export const { setIscashRecyclerConsoleMQTTUpdate } =
  cashRecyclerConsoleMQTTSlice.actions;

export default cashRecyclerConsoleMQTTSlice.reducer;
