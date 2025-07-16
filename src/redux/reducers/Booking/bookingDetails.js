import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  bookingConsoleAPI,
  bookingStatusAPI,
  bookingTypeAPI,
  businessSourceAPI,
  hotelDocumentTypeAPI,
} from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";
import { setSessionItem } from "../../../hooks/session";

const initialState = {
  businessSourceLoading: false,
  activeBusinessSourceList: [],
  isBusinessSourceUpdate: false,

  bookingStatusLoading: false,
  activeBookingStatusList: [],
  isBookingStatusUpdate: false,

  bookingTypeLoading: false,
  activeBookingTypeList: [],
  isBookingTypeUpdate: false,

  documentTypeLoading: false,
  activeDocumentTypeList: [],
  isDocumentTypeUpdate: false,

  bookingConsoleLoading: false,
  isBookingConsoleUpdate: false,
};

export const getBusinessSourceListData = createAsyncThunk(
  "admin/get-BusinessSource-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${businessSourceAPI}`, params)
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

export const getBookingStatusListData = createAsyncThunk(
  "admin/get-BookingStatus-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${bookingStatusAPI}`, params)
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

export const getBookingTypeListData = createAsyncThunk(
  "admin/get-BookingType-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${bookingTypeAPI}`, params)
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

export const getDocumentTypeListData = createAsyncThunk(
  "agent/get-DocumentType-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(hotelDocumentTypeAPI, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data?.data);
          } else {
            reject();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
);

export const addNewBookingConsole = createAsyncThunk(
  "console/add-new-booking-console",
  (payload, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(bookingConsoleAPI, payload)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Booking create successfully!!",
              "success"
            );
            setSessionItem(
              "bookingConsoleData",
              btoa(JSON.stringify(res.data.data))
            );
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

export const bookingDetailsSlice = createSlice({
  name: "bookingDetails",
  initialState,
  reducers: {
    setIsBusinessSourceUpdate: (state, action) => {
      state.isBusinessSourceUpdate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBusinessSourceListData.pending, (state) => {
        state.businessSourceLoading = true;
        state.isBusinessSourceUpdate = false;
      })
      .addCase(getBusinessSourceListData.rejected, (state) => {
        state.businessSourceLoading = false;
        state.isBusinessSourceUpdate = false;
      })
      .addCase(getBusinessSourceListData.fulfilled, (state, action) => {
        state.activeBusinessSourceList = action.payload;
        state.businessSourceLoading = false;
        state.isBusinessSourceUpdate = true;
      })
      .addCase(getBookingStatusListData.pending, (state) => {
        state.bookingStatusLoading = true;
        state.isBookingStatusUpdate = false;
      })
      .addCase(getBookingStatusListData.rejected, (state) => {
        state.bookingStatusLoading = false;
        state.isBookingStatusUpdate = false;
      })
      .addCase(getBookingStatusListData.fulfilled, (state, action) => {
        state.activeBookingStatusList = action.payload;
        state.bookingStatusLoading = false;
        state.isBookingStatusUpdate = true;
      })
      .addCase(getBookingTypeListData.pending, (state) => {
        state.bookingTypeLoading = true;
        state.isBookingTypeUpdate = false;
      })
      .addCase(getBookingTypeListData.rejected, (state) => {
        state.bookingTypeLoading = false;
        state.isBookingTypeUpdate = false;
      })
      .addCase(getBookingTypeListData.fulfilled, (state, action) => {
        state.activeBookingTypeList = action.payload;
        state.bookingTypeLoading = false;
        state.isBookingTypeUpdate = true;
      })
      .addCase(getDocumentTypeListData.pending, (state) => {
        state.documentTypeLoading = true;
        state.isDocumentTypeUpdate = false;
      })
      .addCase(getDocumentTypeListData.rejected, (state) => {
        state.documentTypeLoading = false;
        state.isDocumentTypeUpdate = false;
      })
      .addCase(getDocumentTypeListData.fulfilled, (state, action) => {
        state.activeDocumentTypeList = action.payload;
        state.documentTypeLoading = false;
        state.isDocumentTypeUpdate = true;
      })
      .addCase(addNewBookingConsole.pending, (state) => {
        state.bookingConsoleLoading = true;
        state.isBookingConsoleUpdate = false;
      })
      .addCase(addNewBookingConsole.rejected, (state) => {
        state.bookingConsoleLoading = false;
        state.isBookingConsoleUpdate = false;
      })
      .addCase(addNewBookingConsole.fulfilled, (state, action) => {
        state.bookingConsoleLoading = false;
        state.isBookingConsoleUpdate = true;
      });
  },
});

export const { setIsBusinessSourceUpdate } = bookingDetailsSlice.actions;

export default bookingDetailsSlice.reducer;
