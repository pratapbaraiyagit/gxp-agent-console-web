import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { bookingCheckinAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  appBookingCheckinLogLoading: false,
  appBookingCheckinLoading: false,
  isBookingCheckinUpdate: false,
};

export const updateBookingCheckinDetails = createAsyncThunk(
  "admin/update-BookingCheckin-details",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(bookingCheckinAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "BookingCheckin update successfully!!",
              "success"
            );
            resolve(res.data);
          } else {
            notification(res?.data?.message || "Something went wrong", "error");
            reject();
          }
        })
        .catch((error) => {
          notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const bookingCheckinSlice = createSlice({
  name: "bookingCheckin",
  initialState,
  reducers: {
    setIsBookingCheckinUpdate: (state, action) => {
      state.isBookingCheckinUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateBookingCheckinDetails.pending, (state) => {
        state.isBookingCheckinUpdate = false;
        state.appBookingCheckinLoading = true;
      })
      .addCase(updateBookingCheckinDetails.rejected, (state) => {
        state.isBookingCheckinUpdate = false;
        state.appBookingCheckinLoading = false;
      })
      .addCase(updateBookingCheckinDetails.fulfilled, (state, action) => {
        state.isBookingCheckinUpdate = true;
        state.appBookingCheckinLoading = false;
      });
  },
});

export const { setIsBookingCheckinUpdate } = bookingCheckinSlice.actions;

export default bookingCheckinSlice.reducer;
