import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { cashTransactionAPI } from "../../../utils/apiEndPoint";
import { notification } from "../../../helpers/middleware";

const initialState = {
  cashTransactionLoading: false,
  cashTransactionDetailsLoading: false,
  activecashTransactionList: [],
  getcashTransactionDetailsData: [],
  iscashTransactionUpdate: false,
  totalPages: 0,
  currentPage: 1,
  totalUsers: 0,
};

export const getcashTransactionListData = createAsyncThunk(
  "admin/get-cashTransaction-list",
  (params) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${cashTransactionAPI}`, params)
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

export const addNewcashTransaction = createAsyncThunk(
  "admin/add-new-cashTransaction",
  (cashTransaction, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .post(cashTransactionAPI, cashTransaction)
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

export const getcashTransactionDetails = createAsyncThunk(
  "admin/get-cashTransaction-details-cashTransaction",
  (id, { dispatch }) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`${cashTransactionAPI}?id=${id}`)
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

export const updatecashTransactionDetails = createAsyncThunk(
  "admin/update-cashTransaction-details",
  (props, { dispatch }) => {
    const { id, data } = props;
    return new Promise((resolve, reject) => {
      axios
        .patch(`${cashTransactionAPI}/${id}`, data)
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

export const deletecashTransaction = createAsyncThunk(
  "admin/cashTransaction-delete",
  (props, { dispatch }) => {
    const { id } = props;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${cashTransactionAPI}`, {
          data: {
            cashTransactions: id,
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

export const cashTransactionSlice = createSlice({
  name: "cashTransaction",
  initialState,
  reducers: {
    setIscashTransactionUpdate: (state, action) => {
      state.iscashTransactionUpdate = action.payload;
    },
    setIscashTransactionList: (state, action) => {
      state.activecashTransactionList = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getcashTransactionListData.pending, (state) => {
        state.cashTransactionLoading = true;
      })
      .addCase(getcashTransactionListData.rejected, (state) => {
        state.cashTransactionLoading = false;
      })
      .addCase(getcashTransactionListData.fulfilled, (state, action) => {
        const { data, total_pages, page_number, page_size, count } =
          action.payload;
        state.activecashTransactionList = data;
        state.cashTransactionLoading = false;
        state.totalPages = total_pages;
        state.currentPage = page_number;
        state.pageSize = page_size;
        state.totalUsers = count;
      })
      .addCase(addNewcashTransaction.pending, (state) => {
        state.cashTransactionLoading = true;
        state.iscashTransactionUpdate = false;
      })
      .addCase(addNewcashTransaction.rejected, (state) => {
        state.cashTransactionLoading = false;
        state.iscashTransactionUpdate = false;
      })
      .addCase(addNewcashTransaction.fulfilled, (state, action) => {
        state.cashTransactionLoading = false;
        state.iscashTransactionUpdate = true;
      })
      .addCase(getcashTransactionDetails.pending, (state) => {
        state.cashTransactionDetailsLoading = true;
      })
      .addCase(getcashTransactionDetails.rejected, (state) => {
        state.cashTransactionDetailsLoading = false;
      })
      .addCase(getcashTransactionDetails.fulfilled, (state, action) => {
        state.cashTransactionDetailsLoading = false;
        state.getcashTransactionDetailsData = action.payload;
      })
      .addCase(updatecashTransactionDetails.pending, (state) => {
        state.cashTransactionLoading = true;
        state.iscashTransactionUpdate = false;
      })
      .addCase(updatecashTransactionDetails.rejected, (state) => {
        state.cashTransactionLoading = false;
        state.iscashTransactionUpdate = false;
      })
      .addCase(updatecashTransactionDetails.fulfilled, (state, action) => {
        state.cashTransactionLoading = false;
        state.iscashTransactionUpdate = true;
      });
    // .addCase(deletecashTransaction.pending, (state) => {
    //   state.cashTransactionLoading = true;
    //   state.iscashTransactionUpdate = false;
    // })
    // .addCase(deletecashTransaction.rejected, (state) => {
    //   state.cashTransactionLoading = false;
    //   state.iscashTransactionUpdate = false;
    // })
    // .addCase(deletecashTransaction.fulfilled, (state, action) => {
    //   const uuidsToDelete = Array.isArray(action.payload)
    //     ? action.payload
    //     : [];
    //   state.activecashTransactionList =
    //     state.activecashTransactionList.filter(
    //       (user) => !uuidsToDelete.includes(user.id)
    //     );
    //   state.cashTransactionLoading = false;
    //   state.iscashTransactionUpdate = true;
    // });
  },
});

export const { setIscashTransactionUpdate, setIscashTransactionList } =
  cashTransactionSlice.actions;

export default cashTransactionSlice.reducer;
