import * as XLSX from "xlsx";
import moment from "moment";
import { message } from "antd";

/**
 * Exports transaction data to Excel
 * @param {Array} transactionList - List of transactions to export
 * @param {moment} selectedDate - Selected date for filename (optional)
 * @param {string} sheetName - Name of the Excel sheet (optional)
 * @returns {void}
 */
export const exportTransactionsToExcel = (
  transactionList,
  selectedDate,
  sheetName = "Transactions"
) => {
  // Check if there are transactions to export
  if (!transactionList || transactionList.length === 0) {
    message.warning("No transactions available to export");
    return;
  }

  // Prepare the data for Excel export
  const excelData = transactionList.map((transaction) => {
    return {
      "GUEST NAME": transaction.guest_name || "",
      AMOUNT: transaction.total_amount
        ? `$${parseFloat(transaction.total_amount).toFixed(2)}`
        : "$0.00",
      TYPE: transaction.transaction_type
        ? transaction.transaction_type.charAt(0).toUpperCase() +
          transaction.transaction_type.slice(1)
        : "",
      STATUS: transaction.transaction_status
        ? transaction.transaction_status.charAt(0).toUpperCase() +
          transaction.transaction_status.slice(1)
        : "",
      DATE: transaction.created_at
        ? moment(transaction.created_at).format("YYYY-MM-DD HH:mm:ss")
        : "",
    //   "TRANSACTION ID": transaction.reference_no || transaction.id || "",
    };
  });

  // Create a new workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and download
  const fileName = `transactions_${
    selectedDate
      ? selectedDate.format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD")
  }.xlsx`;
  XLSX.writeFile(workbook, fileName);

  // Show success message
  message.success("Transactions exported successfully");
};

/**
 * Exports booking data to Excel
 * @param {Array} bookingList - List of bookings to export
 * @param {string} sheetName - Name of the Excel sheet (optional)
 * @returns {void}
 */
export const exportBookingsToExcel = (bookingList, sheetName = "Bookings") => {
  // Check if there are bookings to export
  if (!bookingList || bookingList.length === 0) {
    message.warning("No bookings available to export");
    return;
  }

  // Prepare the data for Excel export
  const excelData = bookingList.map((booking) => {
    const guest = booking.guest || {};
    const primaryEmail =
      guest.email_details?.find((email) => email.is_primary)?.email || "";
    const primaryPhone =
      guest.phone_details?.find((phone) => phone.is_primary)?.phone || "";
    const statusConfig = {
      new: "New",
      confirmed: "Confirmed",
      checked_in: "Checked In",
      checked_out: "Checked Out",
      reserved: "Reserved",
      cancelled: "Cancelled",
    };

    return {
      "REFERENCE NO.": booking.reference_no || "",
      NAME: guest.full_name || "",
      EMAIL: primaryEmail,
      "ROOM NUMBER": booking.room_number || "",
      AMOUNT: booking.total_charge
        ? `$${booking.total_charge.toFixed(2)}`
        : "$0.00",
      MOBILE: primaryPhone,
      STATUS: statusConfig[booking.code_name] || booking.code_name || "Unknown",
      "CHECK-IN DATE": booking.check_in_date || "",
      "CHECK-OUT DATE": booking.check_out_date || "",
    };
  });

  // Create a new workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and download
  const fileName = `booking_list_${moment().format("YYYY-MM-DD")}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  // Show success message
  message.success("Bookings exported successfully");
};

/**
 * Generic export function for exporting any data to Excel
 * @param {Array} dataList - List of data objects to export
 * @param {Object} columnMapping - Mapping of data keys to column names
 * @param {string} fileName - Name of the file without extension
 * @param {string} sheetName - Name of the Excel sheet (optional)
 * @returns {void}
 */
export const exportDataToExcel = (
  dataList,
  columnMapping,
  fileName,
  sheetName = "Data"
) => {
  // Check if there is data to export
  if (!dataList || dataList.length === 0) {
    message.warning("No data available to export");
    return;
  }

  // Prepare the data for Excel export
  const excelData = dataList.map((item) => {
    const row = {};

    // Map each key in columnMapping to the corresponding value in the data item
    Object.entries(columnMapping).forEach(([key, columnName]) => {
      row[columnName] = item[key] !== undefined ? item[key] : "";
    });

    return row;
  });

  // Create a new workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and download
  const fullFileName = `${fileName}_${moment().format("YYYY-MM-DD")}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);

  // Show success message
  message.success("Data exported successfully");
};
