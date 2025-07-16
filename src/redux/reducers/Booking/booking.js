import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { bookingAPI } from "../../../utils/apiEndPoint";

const initialState = {
  bookingLoading: false,
  activeBookingList: [],
  getBookingDetailsData: {},
  isBookingUpdate: false,
  isBookingcheckoutUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
  referenceNumber: "",
};

export const getBookingListData = createAsyncThunk(
  "admin/get-booking-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${bookingAPI}`, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
          } else {
            // notification(res?.data?.message || "error", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const addNewBooking = createAsyncThunk(
  "admin/add-new-booking",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(bookingAPI, payload)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Booking create successfully!!",
            //   "success"
            // );
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "error", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const getBookingDetails = createAsyncThunk(
  "admin/get-booking-details",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${bookingAPI}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            // notification(res?.data?.message || "error", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const updateBookingDetails = createAsyncThunk(
  "admin/update-booking-details",
  (props, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(`${bookingAPI}`, props)
        .then((res) => {
          if (res.data.status) {
            // notification(
            //   res.data.message || "Booking update successfully!!",
            //   "success"
            // );
            resolve(res.data);
          } else {
            // notification(res?.data?.message || "error", "error");
            reject();
          }
        })
        .catch((error) => {
          // notification(error?.response?.data?.message || "error", "error");
          reject(error);
        });
    });
  }
);

export const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setIsBookingUpdate: (state, action) => {
      state.isBookingUpdate = action.payload;
    },
    setIsBookingCheckoutUpdate: (state, action) => {
      state.isBookingcheckoutUpdate = action.payload;
    },
    setIsActiveBookingList: (state, action) => {
      state.activeBookingList = action.payload;
    },
    setIsBookingDetailsList: (state, action) => {
      state.getBookingDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBookingListData.pending, (state) => {
        state.bookingLoading = true;
        state.isBookingUpdate = false;
      })
      .addCase(getBookingListData.rejected, (state) => {
        state.bookingLoading = false;
        state.isBookingUpdate = false;
      })
      .addCase(getBookingListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeBookingList = data;
        state.bookingLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
        state.isBookingUpdate = true;
      })
      .addCase(addNewBooking.pending, (state) => {
        state.bookingLoading = true;
        state.isBookingUpdate = false;
        state.referenceNumber = "";
      })
      .addCase(addNewBooking.rejected, (state) => {
        state.bookingLoading = false;
        state.isBookingUpdate = false;
        state.referenceNumber = "";
      })
      .addCase(addNewBooking.fulfilled, (state, action) => {
        state.referenceNumber = action.payload.booking.reference_no;
        state.bookingLoading = false;
        state.isBookingUpdate = true;
      })
      .addCase(getBookingDetails.pending, (state) => {
        state.bookingLoading = true;
        state.getBookingDetailsData = "";
      })
      .addCase(getBookingDetails.rejected, (state) => {
        state.bookingLoading = false;
        state.getBookingDetailsData = "";
      })
      .addCase(getBookingDetails.fulfilled, (state, action) => {
        state.bookingLoading = false;
        state.getBookingDetailsData = action.payload;
      })
      .addCase(updateBookingDetails.pending, (state) => {
        state.isBookingUpdate = false;
        state.bookingLoading = true;
        state.isBookingcheckoutUpdate = false;
      })
      .addCase(updateBookingDetails.rejected, (state) => {
        state.isBookingUpdate = false;
        state.bookingLoading = false;
        state.isBookingcheckoutUpdate = false;
      })
      .addCase(updateBookingDetails.fulfilled, (state, action) => {
        state.isBookingUpdate = true;
        state.isBookingcheckoutUpdate = true;
        state.bookingLoading = false;
      });
  },
});

export const {
  setIsBookingUpdate,
  setIsBookingCheckoutUpdate,
  setIsActiveBookingList,
  setIsBookingDetailsList,
} = bookingSlice.actions;

export default bookingSlice.reducer;
