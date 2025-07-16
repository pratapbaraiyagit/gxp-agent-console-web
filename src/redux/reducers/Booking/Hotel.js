import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { hotelAccessAPI, HotelAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";
import { setSessionItem } from "../../../hooks/session";
import {
  getKioskDeviceDetails,
  getKioskDeviceListData,
} from "../Kiosk/KioskDevice";
import { getKioskDeviceConfigListData } from "../Kiosk/KioskDeviceConfig";
import { initializeMQTT } from "../MQTT/mqttSlice";
import {
  getBookingStatusListData,
  getBookingTypeListData,
  getDocumentTypeListData,
} from "./bookingDetails";
import { getHotelRoomListData } from "./hotelRoom";

const initialState = {
  hotelLoading: false,
  goTOhotelLoading: false,
  activeHotelList: [],
  getHotelDetailsData: {},
  isHotelUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getHotelListData = createAsyncThunk(
  "admin/get-Hotel-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${HotelAPI}`, params)
        .then((res) => {
          if (res.data.status) {
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

export const addNewHotel = createAsyncThunk(
  "admin/add-new-Hotel",
  (Hotel, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(HotelAPI, Hotel)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel create successfully!!",
              "success"
            );
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

export const getHotelDetails = createAsyncThunk(
  "admin/get-Hotel-details-Hotel",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${HotelAPI}?id=${id}`)
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

export const updateHotelDetails = createAsyncThunk(
  "admin/update-Hotel-details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${HotelAPI}/${id}`, data)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel update successfully!!",
              "success"
            );
            resolve({ id, ...data });
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

export const deleteHotel = createAsyncThunk(
  "admin/Hotel-delete",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${HotelAPI}`, {
          data: {
            hotel_ids: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Hotel delete successfully!!",
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

export const goToHotelDetails = createAsyncThunk(
  "admin/goTo-Hotel-list",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(`${hotelAccessAPI}/${id}`)
        .then((res) => {
          if (res.data.status) {
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${res.data.data.access_token}`;
            setSessionItem(
              "TokenAgentConsole",
              btoa(res.data.data.access_token)
            );
            setSessionItem(
              "RefreshAgentConsole",
              btoa(res.data.data.refresh_token)
            );
            setSessionItem(
              "UserSessionAgentConsole",
              btoa(
                unescape(encodeURIComponent(JSON.stringify(res.data.data.user)))
              )
            );
            setSessionItem(
              "HotelSessionAgentConsole",
              btoa(JSON.stringify(res.data.data.hotel))
            );

            // Dispatch the getKioskDeviceListData action here
            dispatch(getKioskDeviceListData())
              .unwrap()
              .then((listData) => {
                if (listData?.data && listData?.data?.length > 0) {
                  dispatch(getKioskDeviceDetails(listData?.data?.[0]?.id));
                  dispatch(
                    getKioskDeviceConfigListData({
                      params: { device_id: listData?.data?.[0]?.id },
                    })
                  ).then((configData) => {
                    dispatch(initializeMQTT(configData?.payload?.data?.[0]));
                    dispatch(getBookingStatusListData());
                    dispatch(getBookingTypeListData());
                    dispatch(
                      getHotelRoomListData({
                        params: {
                          booking_id__isnull: true,
                        },
                      })
                    );
                    dispatch(getDocumentTypeListData());
                  });
                }
              })
              .catch((error) => {
                // console.error("Failed to fetch kiosk device list:", error);
              });

            resolve(res.data);
            //  notification(
            //    res?.data?.message || "Property selected successfully",
            //    "success"
            //  );
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

export const hotelSlice = createSlice({
  name: "Hotel",
  initialState,
  reducers: {
    setIsHotelUpdate: (state, action) => {
      state.isHotelUpdate = action.payload;
    },
    setGetHotelDetails: (state, action) => {
      state.getHotelDetailsData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getHotelListData.pending, (state) => {
        state.hotelLoading = true;
      })
      .addCase(getHotelListData.rejected, (state) => {
        state.hotelLoading = false;
      })
      .addCase(getHotelListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activeHotelList = data;
        state.hotelLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewHotel.pending, (state) => {
        state.hotelLoading = true;
        state.isHotelUpdate = false;
      })
      .addCase(addNewHotel.rejected, (state) => {
        state.hotelLoading = false;
        state.isHotelUpdate = false;
      })
      .addCase(addNewHotel.fulfilled, (state, action) => {
        state.hotelLoading = false;
        state.isHotelUpdate = true;
      })
      .addCase(getHotelDetails.pending, (state) => {
        state.hotelLoading = true;
        state.getHotelDetailsData = "";
      })
      .addCase(getHotelDetails.rejected, (state) => {
        state.hotelLoading = false;
        state.getHotelDetailsData = "";
      })
      .addCase(getHotelDetails.fulfilled, (state, action) => {
        state.hotelLoading = false;
        state.getHotelDetailsData = action.payload;
      })
      .addCase(updateHotelDetails.pending, (state) => {
        state.isHotelUpdate = false;
        state.hotelLoading = true;
      })
      .addCase(updateHotelDetails.rejected, (state) => {
        state.isHotelUpdate = false;
        state.hotelLoading = false;
      })
      .addCase(updateHotelDetails.fulfilled, (state, action) => {
        const { id, ...updatedHotelData } = action.payload;
        state.activeHotelList = state.activeHotelList.map((hotel) =>
          hotel.id === id ? { ...hotel, ...updatedHotelData } : hotel
        );
        state.isHotelUpdate = true;
        state.hotelLoading = false;
      })
      .addCase(deleteHotel.pending, (state) => {
        state.hotelLoading = true;
        state.isHotelUpdate = false;
      })
      .addCase(deleteHotel.rejected, (state) => {
        state.hotelLoading = false;
        state.isHotelUpdate = false;
      })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activeHotelList = state.activeHotelList.filter(
          (user) => !uuidsToDelete.includes(user.id)
        );
        state.hotelLoading = false;
        state.isHotelUpdate = true;
      })
      .addCase(goToHotelDetails.pending, (state) => {
        state.goTOhotelLoading = true;
      })
      .addCase(goToHotelDetails.rejected, (state) => {
        state.goTOhotelLoading = false;
      })
      .addCase(goToHotelDetails.fulfilled, (state, action) => {
        state.goTOhotelLoading = false;
        state.isHotelUpdate = true;
      });
  },
});

export const { setIsHotelUpdate, setGetHotelDetails } = hotelSlice.actions;

export default hotelSlice.reducer;
