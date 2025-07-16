import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import {
  authLogin,
  authLogout,
  authRefreshToken,
  userProfile,
} from "../../../utils/apiEndPoint";
import { getSessionItem, setSessionItem } from "../../../hooks/session";
import { notification } from "../../../helpers/middleware";

const initialState = {
  loginLoading: false,
  isLoader: true,
  responseId: "",
  otpEnterOption: false,
  profileData: null,
  isdrawerVisiable: false,
  isLoginStatus: false,
};

export const loginAction = createAsyncThunk(
  "auth/login",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      const data = btoa(JSON.stringify(dataProp));
      axios
        .post(authLogin, { data: data })
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
              "hotelListAC",
              btoa(
                unescape(
                  encodeURIComponent(JSON.stringify(res.data.data.user?.hotels))
                )
              )
            );
            notification(res.data.message || "Login successfully!!", "success");
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

export const sendOtp = createAsyncThunk(
  "auth/send-otp",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      const data = btoa(JSON.stringify(dataProp));
      axios
        .post(authLogin, { data: data })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Please check you email.",
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

export const getProfileData = createAsyncThunk(
  "admin/get-profile-data",
  (user) => {
    return new Promise((resolve, reject) => {
      axios
        .get(userProfile)
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

export const profileUpdate = createAsyncThunk(
  "auth/profile-update",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .patch(userProfile, dataProp)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Profile Update SuccessFully!!",
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

export const refreshToken = createAsyncThunk(
  "auth/access-token",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      const data = btoa(JSON.stringify(dataProp));
      // Get the refresh token from session storage
      const refreshTokenValue = getSessionItem("RefreshAgentConsole");

      // Create headers object with refresh token
      const headers = {
        "Content-Type": "application/json",
      };

      // Add refresh token as Authorization header if it exists
      if (refreshTokenValue) {
        headers["Authorization"] = `Bearer ${atob(refreshTokenValue)}`;
      }
      axios
        .post(authRefreshToken, { data: data }, { headers })
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
            // notification(res.data.message || "Login successfully!!", "success");
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

export const logoutAction = createAsyncThunk(
  "auth/log-out",
  (dataProp, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(authLogout)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "Logout successfully!!",
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

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setDrawerVisible: (state, action) => {
      state.isdrawerVisiable = action.payload;
    },
    setIsLoader: (state, action) => {
      state.isLoader = action.payload;
    },
    setLoginLoading: (state, action) => {
      state.loginLoading = action.payload;
    },
    setIsLoginStatus: (state, action) => {
      state.isLoginStatus = action.payload;
    },
    setUserDevice: (state, action) => {
      state.device = action.payload;
      if (action.payload) {
        sessionStorage.setItem(
          "DeviceType",
          window.btoa(JSON.stringify(action.payload))
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAction.pending, (state) => {
        state.loginLoading = true;
        state.isLoginStatus = false;
      })
      .addCase(loginAction.rejected, (state) => {
        state.loginLoading = false;
        state.isLoginStatus = false;
      })
      .addCase(loginAction.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.otpEnterOption = false;
        state.isLoginStatus = true;
      })
      .addCase(refreshToken.pending, (state) => {
        state.loginLoading = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.loginLoading = false;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.otpEnterOption = false;
      })
      .addCase(sendOtp.pending, (state) => {
        state.responseId = {};
        state.loginLoading = true;
        state.otpEnterOption = false;
      })
      .addCase(sendOtp.rejected, (state) => {
        state.responseId = {};
        state.loginLoading = false;
        state.otpEnterOption = false;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.responseId = action.payload.data?.id;
        state.otpEnterOption = true;
        state.loginLoading = false;
      })
      .addCase(getProfileData.pending, (state) => {
        state.loginLoading = true;
        state.profileData = null;
      })
      .addCase(getProfileData.rejected, (state) => {
        state.loginLoading = false;
        state.profileData = null;
      })
      .addCase(getProfileData.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.profileData = action.payload;
      })
      .addCase(profileUpdate.pending, (state) => {
        state.loginLoading = true;
        state.profileData = null;
      })
      .addCase(profileUpdate.rejected, (state) => {
        state.loginLoading = false;
        state.profileData = null;
      })
      .addCase(profileUpdate.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.profileData = action.payload;
      });
  },
});

export const {
  setIsLoader,
  setLoginLoading,
  setDrawerVisible,
  setIsLoginStatus,
} = authSlice.actions;

export default authSlice.reducer;
