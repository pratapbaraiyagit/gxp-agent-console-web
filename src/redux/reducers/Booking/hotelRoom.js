import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { hotelRoomAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  hotelRoomLoading: false,
  activeHotelRoomList: [],
  getHotelRoomDetailsData: {},
  isHotelRoomUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getHotelRoomListData = createAsyncThunk(
  "admin/get-HotelRoom-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${hotelRoomAPI}`, params)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data);
          } else {
            notification(res?.data?.message || "error", "Something went wrong");
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

export const addNewHotelRoom = createAsyncThunk(
  "admin/add-new-HotelRoom",
  (HotelRoom, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(hotelRoomAPI, HotelRoom)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel room create successfully!!",
              "success"
            );
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "error", "Something went wrong");
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

export const getHotelRoomDetails = createAsyncThunk(
  "admin/get-HotelRoom-details-HotelRoom",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${hotelRoomAPI}?id=${id}`)
        .then((res) => {
          if (res.data.status) {
            resolve(res.data.data);
          } else {
            notification(res?.data?.message || "error", "Something went wrong");
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

export const updateHotelRoomDetails = createAsyncThunk(
  "admin/update-HotelRoom-details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${hotelRoomAPI}/${id}`, data)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel room update successfully!!",
              "success"
            );
            resolve({ id, ...data });
          } else {
            notification(res?.data?.message || "error", "Something went wrong");
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

export const deleteHotelRoom = createAsyncThunk(
  "admin/HotelRoom-delete",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${hotelRoomAPI}`, {
          data: {
            room_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel room delete successfully!!",
              "success"
            );
            resolve(id);
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

export const hotelRoomSlice = createSlice({
  name: "HotelRoom",
  initialState,
  reducers: {
    setIsHotelRoomUpdate: (state, action) => {
      state.isHotelRoomUpdate = action.payload;
    },
    setIsHotelRoomList: (state, action) => {
      state.activeHotelRoomList = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getHotelRoomListData.pending, (state) => {
        state.hotelRoomLoading = true;
      })
      .addCase(getHotelRoomListData.rejected, (state) => {
        state.hotelRoomLoading = false;
      })
      .addCase(getHotelRoomListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeHotelRoomList = data;
        state.hotelRoomLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewHotelRoom.pending, (state) => {
        state.hotelRoomLoading = true;
        state.isHotelRoomUpdate = false;
      })
      .addCase(addNewHotelRoom.rejected, (state) => {
        state.hotelRoomLoading = false;
        state.isHotelRoomUpdate = false;
      })
      .addCase(addNewHotelRoom.fulfilled, (state, action) => {
        state.hotelRoomLoading = false;
        state.isHotelRoomUpdate = true;
      })
      .addCase(getHotelRoomDetails.pending, (state) => {
        state.hotelRoomLoading = true;
        state.getHotelRoomDetailsData = "";
      })
      .addCase(getHotelRoomDetails.rejected, (state) => {
        state.hotelRoomLoading = false;
        state.getHotelRoomDetailsData = "";
      })
      .addCase(getHotelRoomDetails.fulfilled, (state, action) => {
        state.hotelRoomLoading = false;
        state.getHotelRoomDetailsData = action.payload;
      })
      .addCase(updateHotelRoomDetails.pending, (state) => {
        state.hotelRoomLoading = true;
        state.isHotelRoomUpdate = false;
      })
      .addCase(updateHotelRoomDetails.rejected, (state) => {
        state.hotelRoomLoading = false;
        state.isHotelRoomUpdate = false;
      })
      .addCase(updateHotelRoomDetails.fulfilled, (state, action) => {
        state.hotelRoomLoading = false;
        state.isHotelRoomUpdate = true;
      })
      .addCase(deleteHotelRoom.pending, (state) => {
        state.hotelRoomLoading = true;
        state.isHotelRoomUpdate = false;
      })
      .addCase(deleteHotelRoom.rejected, (state) => {
        state.hotelRoomLoading = false;
        state.isHotelRoomUpdate = false;
      })
      .addCase(deleteHotelRoom.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activeHotelRoomList = state.activeHotelRoomList.filter(
          (user) => !uuidsToDelete.includes(user.id)
        );
        state.hotelRoomLoading = false;
        state.isHotelRoomUpdate = true;
      });
  },
});

export const { setIsHotelRoomUpdate, setIsHotelRoomList } =
  hotelRoomSlice.actions;

export default hotelRoomSlice.reducer;
