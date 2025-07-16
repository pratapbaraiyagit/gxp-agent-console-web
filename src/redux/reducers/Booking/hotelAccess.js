import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { notification } from "../../../helpers/middleware";
import { hotelAccessAPI } from "../../../utils/apiEndPoint";

const initialState = {
  hotelAccessLoading: false,
  activeHotelAccessList: [],
  getHotelAccessDetailsData: {},
};

export const getHotelAccessListData = createAsyncThunk(
  "admin/get-hotel-access-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(hotelAccessAPI, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
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

export const getHotelAccessDetails = createAsyncThunk(
  "admin/get-hotel-access-details-hotel",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${hotelAccessAPI}/${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
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

export const hotelAccessSlice = createSlice({
  name: "hotelAccess",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getHotelAccessListData.pending, (state) => {
        state.hotelAccessLoading = true;
      })
      .addCase(getHotelAccessListData.rejected, (state) => {
        state.hotelAccessLoading = false;
      })
      .addCase(getHotelAccessListData.fulfilled, (state, action) => {
        state.activeHotelAccessList = action.payload;
        state.hotelAccessLoading = false;
      })
      .addCase(getHotelAccessDetails.pending, (state) => {
        state.hotelAccessLoading = true;
        state.getHotelAccessDetailsData = {};
      })
      .addCase(getHotelAccessDetails.rejected, (state) => {
        state.hotelAccessLoading = false;
        state.getHotelAccessDetailsData = {};
      })
      .addCase(getHotelAccessDetails.fulfilled, (state, action) => {
        state.hotelAccessLoading = false;
        state.getHotelAccessDetailsData = action.payload;
      });
  },
});

export const {} = hotelAccessSlice.actions;
export default hotelAccessSlice.reducer;
