import { configureStore } from "@reduxjs/toolkit";
import auth from "./reducers/UserLoginAndProfile/auth.js";
import mqttReducer from "./reducers/MQTT/mqttSlice.js";
import hotel from "./reducers/Booking/Hotel.js";
import booking from "./reducers/Booking/booking.js";
import hotelAccess from "./reducers/Booking/hotelAccess.js";
import kioskDevice from "./reducers/Kiosk/KioskDevice.js";
import idScannerSlice from "./reducers/MQTT/IDScanner.js";
import keyDispenserSlice from "./reducers/MQTT/keyDispenser.js";
import keyEncoderSlice from "./reducers/MQTT/keyEncoder.js";
import serviceStatusSlice from "./reducers/MQTT/serviceStatus.js";
import agentMQTT from "./reducers/MQTT/agentMQTT.js";
import kioskMQTT from "./reducers/MQTT/kioskMQTT.js";
import callMQTT from "./reducers/MQTT/callMQTT.js";
import cashRecyclerConsoleMQTT from "./reducers/MQTT/cashRecyclerConsoleMQTT.js";
import image from "./reducers/ImageUploadFile/imageUploadFile.js";
import bookingDetails from "./reducers/Booking/bookingDetails.js";
import hotelRoom from "./reducers/Booking/hotelRoom.js";
import cashTransaction from "./reducers/Booking/cashTransaction.js";
import cashTransactionLog from "./reducers/Booking/cashTransactionLog.js";
import bookingCheckout from "./reducers/Booking/bookingCheckout.js";
import bookingCheckin from "./reducers/Booking/bookingCheckin.js";
import agentUserMQTT from "./reducers/MQTT/agentUserMQTT.js";

const store = configureStore(
  {
    reducer: {
      auth: auth,
      mqtt: mqttReducer,
      hotel: hotel,
      booking: booking,
      hotelAccess: hotelAccess,
      kioskDevice: kioskDevice,
      serviceStatusSlice: serviceStatusSlice,
      idScannerSlice: idScannerSlice,
      keyDispenserSlice: keyDispenserSlice,
      keyEncoderSlice: keyEncoderSlice,
      // cashRecyclerSlice: cashRecyclerSlice,
      // printSlice: printSlice,
      agentMQTT: agentMQTT,
      kioskMQTT: kioskMQTT,
      callMQTT: callMQTT,
      cashRecyclerConsoleMQTT: cashRecyclerConsoleMQTT,
      image: image,
      bookingDetails: bookingDetails,
      hotelRoom: hotelRoom,
      cashTransaction: cashTransaction,
      cashTransactionLog: cashTransactionLog,
      bookingCheckout: bookingCheckout,
      bookingCheckin: bookingCheckin,
      agentUserMQTT: agentUserMQTT,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore mqtt client actions and state paths
          ignoredActions: ["mqtt/setClient"],
          ignoredActionPaths: ["payload.client"],
          ignoredPaths: ["mqtt.client"],
        },
      }),
    devTools: false, // Redux devtools false when live
  }
  // window.REDUX_DEVTOOLS_EXTENSION && window.REDUX_DEVTOOLS_EXTENSION()
);

export default store;
