import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { cashTransactionLogAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  cashTransactionLogLoading: false,
  activecashTransactionLogList: [],
  getcashTransactionLogDetailsData: {},
  iscashTransactionLogUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getcashTransactionLogListData = createAsyncThunk(
  "admin/get-cashTransactionLog-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${cashTransactionLogAPI}`, params)
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

export const addNewcashTransactionLog = createAsyncThunk(
  "admin/add-new-cashTransactionLog",
  (cashTransactionLog, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(cashTransactionLogAPI, cashTransactionLog)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "cash transaction create successfully!!",
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

export const getcashTransactionLogDetails = createAsyncThunk(
  "admin/get-cashTransactionLog-details-cashTransactionLog",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${cashTransactionLogAPI}?cash_transaction_id=${id}`)
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

export const updatecashTransactionLogDetails = createAsyncThunk(
  "admin/update-cashTransactionLog-details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${cashTransactionLogAPI}/${id}`, data)
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "cash transactionupdate successfully!!",
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

export const deletecashTransactionLog = createAsyncThunk(
  "admin/cashTransactionLog-delete",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${cashTransactionLogAPI}`, {
          data: {
            cashTransactionLogs: id,
          },
        })
        .then((res) => {
          if (res.data.status) {
            notification(
              res.data.message || "cash transactiondelete successfully!!",
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

export const cashTransactionLogSlice = createSlice({
  name: "cashTransactionLog",
  initialState,
  reducers: {
    setIscashTransactionLogUpdate: (state, action) => {
      state.iscashTransactionLogUpdate = action.payload;
    },
    setIscashTransactionLogList: (state, action) => {
      state.activecashTransactionLogList = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getcashTransactionLogListData.pending, (state) => {
        state.cashTransactionLogLoading = true;
      })
      .addCase(getcashTransactionLogListData.rejected, (state) => {
        state.cashTransactionLogLoading = false;
      })
      .addCase(getcashTransactionLogListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activecashTransactionLogList = data;
        state.cashTransactionLogLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewcashTransactionLog.pending, (state) => {
        state.cashTransactionLogLoading = true;
        state.iscashTransactionLogUpdate = false;
      })
      .addCase(addNewcashTransactionLog.rejected, (state) => {
        state.cashTransactionLogLoading = false;
        state.iscashTransactionLogUpdate = false;
      })
      .addCase(addNewcashTransactionLog.fulfilled, (state, action) => {
        state.cashTransactionLogLoading = false;
        state.iscashTransactionLogUpdate = true;
      })
      .addCase(getcashTransactionLogDetails.pending, (state) => {
        state.cashTransactionLogLoading = true;
        state.getcashTransactionLogDetailsData = "";
      })
      .addCase(getcashTransactionLogDetails.rejected, (state) => {
        state.cashTransactionLogLoading = false;
        state.getcashTransactionLogDetailsData = "";
      })
      .addCase(getcashTransactionLogDetails.fulfilled, (state, action) => {
        state.cashTransactionLogLoading = false;
        state.getcashTransactionLogDetailsData = action.payload;
      })
      .addCase(updatecashTransactionLogDetails.pending, (state) => {
        state.cashTransactionLogLoading = true;
        state.iscashTransactionLogUpdate = false;
      })
      .addCase(updatecashTransactionLogDetails.rejected, (state) => {
        state.cashTransactionLogLoading = false;
        state.iscashTransactionLogUpdate = false;
      })
      .addCase(updatecashTransactionLogDetails.fulfilled, (state, action) => {
        state.cashTransactionLogLoading = false;
        state.iscashTransactionLogUpdate = true;
      })
      .addCase(deletecashTransactionLog.pending, (state) => {
        state.cashTransactionLogLoading = true;
        state.iscashTransactionLogUpdate = false;
      })
      .addCase(deletecashTransactionLog.rejected, (state) => {
        state.cashTransactionLogLoading = false;
        state.iscashTransactionLogUpdate = false;
      })
      .addCase(deletecashTransactionLog.fulfilled, (state, action) => {
        const uuidsToDelete = Array.isArray(action.payload)
          ? action.payload
          : [];
        state.activecashTransactionLogList =
          state.activecashTransactionLogList.filter(
            (user) => !uuidsToDelete.includes(user.id)
          );
        state.cashTransactionLogLoading = false;
        state.iscashTransactionLogUpdate = true;
      });
  },
});

export const { setIscashTransactionLogUpdate, setIscashTransactionLogList } =
  cashTransactionLogSlice.actions;

export default cashTransactionLogSlice.reducer;
