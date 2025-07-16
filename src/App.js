import "bootstrap/dist/css/bootstrap.min.css";
import "aos/dist/aos.css";
import "sweetalert2/dist/sweetalert2.min.css";
import "animate.css";
import "react-phone-input-2/lib/style.css";
import "./assets/sass/style.scss";

import Routes from "./router/index";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  setIsLoader,
  setIsLoginStatus,
} from "./redux/reducers/UserLoginAndProfile/auth";
import { getSessionItem } from "./hooks/session";
import axios from "axios";
import setupInterceptors from "./utils/axios-interceptors.js";
import { ThemeProvider } from "./components/theme/ThemeContext.jsx";
import {
  getKioskDeviceDetails,
  getKioskDeviceListData,
} from "./redux/reducers/Kiosk/KioskDevice.js";
import { getKioskDeviceConfigListData } from "./redux/reducers/Kiosk/KioskDeviceConfig.js";
import { initializeMQTT } from "./redux/reducers/MQTT/mqttSlice.js";
import {
  getBookingStatusListData,
  getBookingTypeListData,
  getDocumentTypeListData,
} from "./redux/reducers/Booking/bookingDetails.js";
import { getHotelRoomListData } from "./redux/reducers/Booking/hotelRoom.js";
import InternetStatusModal from "./components/Modal/InternetStatusModal.jsx";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoader, isLoginStatus } = useSelector(({ auth }) => auth);

  useEffect(() => {
    dispatch(setIsLoader(true));
    const values = getSessionItem("TokenAgentConsole");
    if (values) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${atob(values)}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
      navigate("/login");
    }
    dispatch(setIsLoader(false));
  }, [dispatch, navigate]);

  useEffect(() => {
    const { responseInterceptor } = setupInterceptors({ navigate, dispatch }); // Use setupInterceptors here
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  useEffect(() => {
    dispatch(setIsLoginStatus(false));
    const userData = getSessionItem("UserSessionAgentConsole");
    if (userData) {
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
                    page_number: 1,
                    page_size: 1000,
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
    }
  }, [dispatch]);

  return (
    <>
      <ThemeProvider>
        <Routes />
        <InternetStatusModal />
      </ThemeProvider>
    </>
  );
}

export default App;
