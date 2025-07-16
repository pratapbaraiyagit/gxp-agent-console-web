import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { bookingCheckoutAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  appBookingCheckoutLogLoading: false,
  appBookingCheckoutLoading: false,
  isBookingCheckoutUpdate: false,
};

export const updateBookingCheckoutDetails = createAsyncThunk(
  "admin/update-BookingCheckout-details",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(bookingCheckoutAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "BookingCheckout update successfully!!",
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

export const bookingCheckoutSlice = createSlice({
  name: "bookingCheckout",
  initialState,
  reducers: {
    setIsBookingCheckoutUpdate: (state, action) => {
      state.isBookingCheckoutUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateBookingCheckoutDetails.pending, (state) => {
        state.isBookingCheckoutUpdate = false;
        state.appBookingCheckoutLoading = true;
      })
      .addCase(updateBookingCheckoutDetails.rejected, (state) => {
        state.isBookingCheckoutUpdate = false;
        state.appBookingCheckoutLoading = false;
      })
      .addCase(updateBookingCheckoutDetails.fulfilled, (state, action) => {
        state.isBookingCheckoutUpdate = true;
        state.appBookingCheckoutLoading = false;
      });
  },
});

export const { setIsBookingCheckoutUpdate } = bookingCheckoutSlice.actions;

export default bookingCheckoutSlice.reducer;
