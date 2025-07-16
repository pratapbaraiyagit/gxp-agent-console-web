import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import classNames from "classnames";
import {
  Input,
  Form,
  Button,
  Row,
  Col,
  message,
  Card,
  Avatar,
  Space,
  DatePicker,
  Divider,
  Flex,
  Typography,
  Table,
  Layout,
  Menu,
  Dropdown,
  Drawer,
  Tag,
  Tooltip,
  Modal,
  Select,
  Badge,
  Descriptions,
  Popconfirm,
  Alert,
} from "antd";
import {
  SettingOutlined,
  UserOutlined,
  FullscreenOutlined,
  BellOutlined,
  EyeOutlined,
  SyncOutlined,
  MobileOutlined,
  IdcardOutlined,
  CreditCardOutlined,
  DollarOutlined,
  LogoutOutlined,
  DownOutlined,
  SunOutlined,
  MoonOutlined,
  SearchOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  ZoomInOutlined,
  CloseOutlined,
  HomeOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CarOutlined,
  EditOutlined,
  CameraOutlined,
  ToolOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useForm, Controller } from "react-hook-form";
import whiteLogo from "../../assets/images/WhiteLogo.png";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import NotificationModal from "../../components/Modal/NotificationModal";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "../../hooks/session";
import { useTheme } from "../../components/theme/ThemeContext";
import { notification } from "../../helpers/middleware";
import { goToHotelDetails } from "../../redux/reducers/Booking/Hotel";
import Loader from "../../components/Loader/Loader";
import smallLogo from "../../assets/images/SmallLogo.png";
import darkSmallLogo from "../../assets/images/darkSmallLogo.png";
import frontIDCard from "../../assets/images/frontIDCard.png";
import backIDCard from "../../assets/images/backIDCard.png";
import Logo from "../../assets/images/logo.png";
import darkLogo from "../../assets/images/WhiteLogo.png";
import SettingsModal from "../../components/Modal/SettingsModal";
import BookingModal from "../../components/Modal/BookingModal";
import CashModal from "../../components/Modal/CashModal";
import EmotyCashboxModal from "../../components/Modal/EmptyCashboxModal";
import TransactionDetailModal from "../../components/Modal/TransactionDetailModal";
import useIDScanner from "../../hooks/useIDScanner";
import KioskModal from "../../components/Modal/KioskModal";
import { getKioskDeviceDetails } from "../../redux/reducers/Kiosk/KioskDevice";
import { getKioskDeviceConfigListData } from "../../redux/reducers/Kiosk/KioskDeviceConfig";
import useKeyDispenser from "../../hooks/useKeyDispenser";
import useKeyEncoder from "../../hooks/useKeyEncoder";
import usePrinter from "../../hooks/usePrinter";
import { callMQTTAction } from "../../redux/reducers/MQTT/callMQTT";
import { kioskMQTTAction } from "../../redux/reducers/MQTT/kioskMQTT";
import { agentMQTTAction } from "../../redux/reducers/MQTT/agentMQTT";
import SelfieModal from "../../components/Modal/SelfieModal";
import { UploadImageFile } from "../../redux/reducers/ImageUploadFile/imageUploadFile";
import { removeNullValues } from "../../utils/commonFun";
import useCashRecycler from "../../hooks/useCashRecycler";
import {
  addNewBookingConsole,
  getDocumentTypeListData,
} from "../../redux/reducers/Booking/bookingDetails";
import { getcashTransactionListData } from "../../redux/reducers/Booking/cashTransaction";
import { updateBookingCheckoutDetails } from "../../redux/reducers/Booking/bookingCheckout";
import KioskActivationModal from "../../components/Modal/KioskActivationModal";
import { updateBookingCheckinDetails } from "../../redux/reducers/Booking/bookingCheckin";
import { getHotelRoomListData } from "../../redux/reducers/Booking/hotelRoom";
import {
  disconnectMQTT,
  selectAllMessages,
  selectLatestMessage,
} from "../../redux/reducers/MQTT/mqttSlice";
import VideoControls from "./VideoControls";
import KeyProgressDrawer from "../../components/Modal/KeyProgressDrawer";
import OCRZoomModal from "../../components/Modal/OCRZoomModal";
import LastTransactionsModal from "../../components/Modal/LastTransactionModal";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getBookingListData } from "../../redux/reducers/Booking/booking";
import TerminalPanel from "../../components/Tabs/TerminalPanel";
import PhoneInput from "react-phone-input-2";
import { agentUserMQTTAction } from "../../redux/reducers/MQTT/agentUserMQTT";
import useServiceStatus from "../../hooks/useServiceStatus";
import OCRDetailsModal from "../../components/Modal/OCRDetailsModal";
import { base64ToOCRData } from "../../redux/reducers/MQTT/IDScanner";

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

const { Header, Sider, Content } = Layout;

const items = [
  {
    label: "Self Check-In",
    key: "kiosk_self",
    icon: <UserOutlined />,
  },
  {
    label: "Video Call",
    key: "kiosk_agent",
    icon: <VideoCameraOutlined />,
  },
  {
    label: "Lane Close",
    key: "kiosk_close",
    icon: <InfoCircleOutlined />,
  },
];

const KioskTerminal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const mqttState = useSelector((state) => state.mqtt);
  const latestMessage = useSelector(selectLatestMessage);
  const allMessages = useSelector(selectAllMessages);

  // Parse the latest message
  const kioskResponse = useMemo(() => {
    if (latestMessage && latestMessage.message) {
      try {
        return JSON.parse(latestMessage.message);
      } catch (error) {
        return null;
      }
    }
    return null;
  }, [latestMessage]);

  const { imgLoading, singledatabaseImage } = useSelector(({ image }) => image);

  const { bookingLoading, isBookingUpdate, getBookingDetailsData } =
    useSelector(({ booking }) => booking);

  const { activeDocumentTypeList } = useSelector(
    ({ bookingDetails }) => bookingDetails
  );

  const {
    cashTransactionLoading,
    activecashTransactionList,
    getcashTransactionDetailsData,
    totalPages,
    currentPage,
    totalUsers,
  } = useSelector(({ cashTransaction }) => cashTransaction);

  const { cashRecyclerConsoleMQTTLoading } = useSelector(
    ({ cashRecyclerConsoleMQTT }) => cashRecyclerConsoleMQTT
  );

  const { keyDispenserLoading } = useSelector(
    ({ keyDispenserSlice }) => keyDispenserSlice
  );

  const { commandLoadingStates } = useSelector(({ kioskMQTT }) => kioskMQTT);

  const {
    bookingConsoleLoading,
    activeBookingStatusList,
    activeBookingTypeList,
  } = useSelector(({ bookingDetails }) => bookingDetails);

  const { appBookingCheckoutLoading } = useSelector(
    ({ bookingCheckout }) => bookingCheckout
  );
  const { appBookingCheckinLoading } = useSelector(
    ({ bookingCheckin }) => bookingCheckin
  );

  const { hotelRoomLoading, activeHotelRoomList } = useSelector(
    ({ hotelRoom }) => hotelRoom
  );

  const bookingStatusId = activeBookingStatusList?.length
    ? activeBookingStatusList?.find((x) => x.code_name === "checked_in")?.id
    : null;

  const bookingTypeId = activeBookingTypeList?.length
    ? activeBookingTypeList?.find((x) => x.code_name === "guest")?.id
    : null;

  const drawSign = getSessionItem("draw_sign");
  const captureSelfie = getSessionItem("capture_selfie");

  const {
    isConnected: isScannerConnected,
    actionTimer: isIdScanRestartedTimer,
    statusTimer: isIdScanGetStatusTimer,
    isIdScannerLoading,
    deviceIdScannerLoading,
    statusIDScanner,
    reStartIdScanner,
  } = useIDScanner();

  const {
    isKeyDLoading,
    moveFront,
    moveCapture,
    moveReader,
    acceptKeyDispenser,
    isDeviceStatusChecked,
    statusKeyDispenser,
    keyPositionData,
    reStartKeyDispenser,
    actionTimer: isKeyDispenderRestartedTimer,
    statusTimer: isKeyDispenderGetStatusTimer,
  } = useKeyDispenser();

  const {
    isConnected: isEncoderConnected,
    actionTimer: isKeyEncoderRestartedTimer,
    statusTimer: isKeyEncoderGetStatusTimer,
    isKeyELoading,
    statusKeyEncoder,
    reStartKeyEncoder,
  } = useKeyEncoder();

  const {
    isConnected: isServiceStatusConnected,
    isLoading: isServiceStatusLoading,
    getStatus: getServiceStatus,
    restart: reStartServiceStatus,
    actionTimer: isServiceRestartedTimer,
    statusTimer: isServiceGetStatusTimer,
  } = useServiceStatus();

  const {
    isCashRecyclerConnected,
    isCashRecyclerLoading,
    connectCashRecycler,
    statusCashRecycler,
    reStartCashRecycler,
    actionTimer: isCashRestartedTimer,
    statusTimer: isCashGetStatusTimer,
  } = useCashRecycler();

  const { isConnected: isPrinterConnected, reStartPrinter } = usePrinter();

  const userData = getSessionItem("UserSessionAgentConsole");
  const userSession = userData
    ? JSON.parse(decodeURIComponent(escape(atob(userData))))
    : null;

  const ocrData = sessionStorage.getItem("OcrSessionData");
  const ocrSession = JSON.parse(ocrData);

  const emailPhoneData = sessionStorage.getItem("EmailPhoneSessionData");
  const emailPhoneSession = JSON.parse(emailPhoneData);

  const vehicleNumberData = sessionStorage.getItem("vehicleNumberSessionData");
  const vehicleNumberSession = JSON.parse(vehicleNumberData);

  const kioskData = getSessionItem("KioskConfig");
  const kioskSession = kioskData
    ? JSON.parse(decodeURIComponent(escape(atob(kioskData))))
    : null;

  const hotelListAC = getSessionItem("hotelListAC");
  const hotelList = hotelListAC
    ? JSON.parse(decodeURIComponent(escape(atob(hotelListAC))))
    : null;

  const hotelData = getSessionItem("HotelSessionAgentConsole");
  const hotelSession = hotelData
    ? JSON.parse(decodeURIComponent(escape(atob(hotelData))))
    : null;

  const bookingConsoleData = getSessionItem("bookingConsoleData");
  const bookingConsoleSession = bookingConsoleData
    ? JSON.parse(decodeURIComponent(escape(atob(bookingConsoleData))))
    : null;

  const { goTOhotelLoading } = useSelector(({ hotel }) => hotel);

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  const [collapsed, setCollapsed] = useState(
    sessionStorage.getItem("sidebarCollapsed") === "true" ||
      window.innerWidth < 1200
  );

  const [keyProgressDrawerVisible, setKeyProgressDrawerVisible] =
    useState(false);
  const [selectedRoomData, setSelectedRoomData] = useState(null);
  const [issueKeyData, setIssueKeyData] = useState({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isHovered, setIsHovered] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [KioskModalVisible, setKioskModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [emptyCashBoxModalVisible, setEmptyCashBoxModalVisible] =
    useState(false);
  const [lastTransactionsModalVisible, setLastTransactionsModalVisible] =
    useState(false);
  const [cashModalType, setCashModalType] = useState("collection");
  const [transactionModalVisible, settransactionModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selfieVisible, setSelfieVisible] = useState(false);
  const [loadingcmd, setLoadingcmd] = useState("");
  const [activationModalVisible, setActivationModalVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);

  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotTimeout, setSnapshotTimeout] = useState(null);
  const [snapshotRetryCount, setSnapshotRetryCount] = useState(0);
  const MAX_SNAPSHOT_RETRIES = 3;
  const SNAPSHOT_TIMEOUT_DURATION = 15000;

  const [selectedLabel, setSelectedLabel] = useState(() => {
    const storedMode = sessionStorage.getItem("selectedKioskMode");
    if (storedMode) {
      const matchingItem = items.find((item) => item.label === storedMode);
      if (matchingItem) {
      }
      return storedMode;
    }
    return "Self Check-In";
  });

  const useSessionStorageState = (key, defaultValue = null) => {
    const [value, setValue] = useState(() => {
      const item = getSessionItem(key);
      return item !== null ? item : defaultValue;
    });

    useEffect(() => {
      // Handler for storage events (cross-tab changes)
      const handleStorageChange = (e) => {
        if (e.key === key) {
          setValue(e.newValue);
        }
      };

      // Handler for same-tab changes (using custom event)
      const handleCustomStorageChange = (e) => {
        if (e.detail.key === key) {
          setValue(e.detail.newValue);
        }
      };

      // Listen for cross-tab storage changes
      window.addEventListener("storage", handleStorageChange);

      // Listen for same-tab storage changes
      window.addEventListener(
        "sessionStorageChange",
        handleCustomStorageChange
      );

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(
          "sessionStorageChange",
          handleCustomStorageChange
        );
      };
    }, [key]);

    return value;
  };

  const setSessionItemWithEvent = (key, value) => {
    setSessionItem(key, value);

    // Dispatch custom event for same-tab detection
    window.dispatchEvent(
      new CustomEvent("sessionStorageChange", {
        detail: { key, newValue: value },
      })
    );
  };

  const onlineKiosk = useSessionStorageState("KioskOnline", "false");

  const [deviceStatuses, setDeviceStatuses] = useState({
    kiosk: onlineKiosk === "true" ? true : false,
    service_status: isServiceStatusConnected,
    id_scanner: isScannerConnected,
    key_encoder: isEncoderConnected,
    key_dispenser: isDeviceStatusChecked,
    printer: isPrinterConnected,
    terminal: false,
    cash_recycler: isCashRecyclerConnected,
  });
  const [startScanLoading, setStartScanLoading] = useState(false);
  const [loading, setLoading] = useState({
    ask_email_mob: false,
    ask_vehicle_no: false,
    scan_id: false,
    draw_sign: false,
    issue_key: false,
    capture_selfie: false,
  });

  useEffect(() => {
    if (selfieVisible) {
      dispatch(
        callMQTTAction({
          cmd: "full",
          payload: {
            agent_user_id: userHotelSession?.id,
          },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );
      if (loadingcmd === "draw_sign") {
        setStartScanLoading(false);
        setLoading((prev) => ({
          ...prev,
          draw_sign: false,
        }));
      } else if (loadingcmd === "capture_selfie") {
        setStartScanLoading(false);
        setSelfieCapture(false);
        setLoading((prev) => ({
          ...prev,
          capture_selfie: false,
        }));
      }
    }
  }, [selfieVisible]);

  useEffect(() => {
    if (
      kioskResponse?.cmd === "kiosk_online" &&
      kioskResponse?.response?.status
    ) {
      const statusMode = kioskResponse?.response?.data?.status_mode;
      if (statusMode === "online") {
        setSessionItemWithEvent("KioskOnline", "true");
      } else if (statusMode === "offline") {
        setSessionItemWithEvent("KioskOnline", "false");
      }
    }
  }, [kioskResponse]);

  useEffect(() => {
    setDeviceStatuses((prev) => ({
      ...prev,
      kiosk: onlineKiosk === "true",
      service_status: isServiceStatusConnected,
      id_scanner: isScannerConnected,
      key_encoder: isEncoderConnected,
      key_dispenser: isDeviceStatusChecked,
      cash_recycler: isCashRecyclerConnected,
      printer: isPrinterConnected,
    }));
  }, [
    onlineKiosk,
    isServiceStatusConnected,
    isCashRecyclerConnected,
    isDeviceStatusChecked,
    isEncoderConnected,
    isPrinterConnected,
    isScannerConnected,
  ]);

  useEffect(() => {
    if (kioskResponse) {
      if (kioskResponse.cmd === "screen_capture") {
        if (kioskResponse.response?.status) {
          handleSnapshotSuccess(kioskResponse);
        } else {
          handleSnapshotError(
            kioskResponse.response?.message || "Snapshot capture failed"
          );
        }
        return;
      }

      if (kioskResponse?.cmd === "autocapture_on") {
        setStartScanLoading(true);
        setLoading((prev) => ({
          ...prev,
          scan_id: true,
        }));
      } else if (kioskResponse?.cmd === "autocapture_off") {
        dispatch(
          callMQTTAction({
            cmd: "full",
            payload: {
              agent_user_id: userHotelSession?.id,
            },
            device_uuid_list: [kioskSession?.[0]?.device_id],
          })
        );
        setStartScanLoading(false);
        setLoading((prev) => ({
          ...prev,
          scan_id: false,
        }));
      } else if (
        kioskResponse?.cmd === "issue_key" &&
        kioskResponse?.response?.status &&
        kioskResponse?.response?.data?.status_mode === "issue_key"
      ) {
        setStartScanLoading(false);
        dispatch(
          callMQTTAction({
            cmd: "full",
            payload: {
              agent_user_id: userHotelSession?.id,
            },
            device_uuid_list: [kioskSession?.[0]?.device_id],
          })
        );
        setLoading((prev) => ({
          ...prev,
          issue_key: false,
        }));
      }
    }
  }, [kioskResponse]);

  useEffect(() => {
    return () => {
      if (snapshotTimeout) {
        clearTimeout(snapshotTimeout);
      }
    };
  }, [snapshotTimeout]);

  // Add window resize effect
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      // Auto-collapse on smaller screens
      if (newWidth < 1200) {
        setCollapsed(true);
        sessionStorage.setItem("sidebarCollapsed", "true");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed]);

  const toggleCollapse = () => {
    // Only allow pinning/unpinning above 1200px
    if (windowWidth >= 1200) {
      const newCollapsedState = !collapsed;
      setCollapsed(newCollapsedState);
      sessionStorage.setItem("sidebarCollapsed", newCollapsedState);
    }
  };

  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    if (!hotelSession) {
      setOpenDrawer(true);
    }
  }, [hotelSession]);

  const UserSessionAgentConsole = getSessionItem("UserSessionAgentConsole");
  const userHotelSession = UserSessionAgentConsole
    ? JSON.parse(decodeURIComponent(escape(atob(UserSessionAgentConsole))))
    : null;

  const getLocalStorageItem = (key) => {
    const item = localStorage.getItem(key);
    return item || null;
  };

  const kioskDeviceDetails = getLocalStorageItem("kioskDeviceDetails");
  const userKioskDeviceDetails = kioskDeviceDetails
    ? JSON.parse(decodeURIComponent(escape(atob(kioskDeviceDetails))))
    : null;

  const onSelectKioskDevice = (device) => {
    dispatch(getKioskDeviceDetails(device?.id));

    dispatch(getKioskDeviceConfigListData());
  };

  const toggleDeviceStatus = (device) => {
    const statusCheckers = {
      service_status: getServiceStatus,
      id_scanner: statusIDScanner,
      key_encoder: statusKeyEncoder,
      key_dispenser: statusKeyDispenser,
      printer: isPrinterConnected,
      cash_recycler: statusCashRecycler,
    };

    if (statusCheckers[device]) {
      statusCheckers[device]();
    }
  };

  const filteredHotels = hotelList?.filter((hotel) =>
    hotel.hotel_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestartDevice = async (device) => {
    const restartFunctions = {
      service_status: reStartServiceStatus,
      id_scanner: reStartIdScanner,
      key_encoder: reStartKeyEncoder,
      key_dispenser: reStartKeyDispenser,
      printer: reStartPrinter,
      cash_recycler: reStartCashRecycler,
      kiosk: () => {},
    };

    if (restartFunctions[device]) {
      await restartFunctions[device]();
    }
  };

  const logOutUse = async () => {
    try {
      setLogoutLoading(true);
      // const paramsData = {
      //   cmd: "kiosk_close",
      //   device_uuid_list: [deviceId],
      //   payload: { agent_user_id: userHotelSession?.id },
      // };

      // await dispatch(kioskMQTTAction(paramsData));

      await dispatch(
        callMQTTAction({
          cmd: "disconnect",
          payload: { agent_user_id: userHotelSession?.id },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );

      await dispatch(disconnectMQTT());
      setDeviceId(null);
      localStorage.clear();
      sessionStorage.clear();

      notification("Logout successfully!!", "success");
      navigate("/login");
      setLogoutLoading(false);
    } catch (error) {
      setLogoutLoading(false);
      notification("Logout failed. Please try again.", "error");
    }
  };

  const [mqttCommandLoading, setMqttCommandLoading] = useState({
    kiosk_self: false,
    kiosk_agent: false,
    kiosk_close: false,
  });

  const mqttTimeoutsRef = useRef({});

  const handleDropdownMenuClick = (e) => {
    const selectedItem = items.find((item) => item.key === e.key);

    // Set loading state for this command
    setMqttCommandLoading((prev) => ({
      ...prev,
      [e.key]: true,
    }));

    const paramsData = {
      cmd: e.key,
      device_uuid_list: [deviceId],
      payload: { agent_user_id: userHotelSession?.id },
    };

    dispatch(kioskMQTTAction(paramsData));

    if (selectedItem) {
      setSelectedLabel(selectedItem.label);
      // Store the selected label in sessionStorage
      sessionStorage.setItem("selectedKioskMode", selectedItem.label);

      // If Lane Close is selected, set a flag
      if (e.key === "kiosk_close") {
        sessionStorage.setItem("laneClosedStatus", "true");
      } else {
        // For other selections, remove the flag
        sessionStorage.removeItem("laneClosedStatus");
      }
    }

    const timeoutId = setTimeout(() => {
      setMqttCommandLoading((prev) => ({
        ...prev,
        [e.key]: false,
      }));
      notification(
        `No response received for "${
          selectedItem?.label || e.key
        }" command. Request timed out.`,
        "warning",
        4000
      );
      setSelectedLabel("Self Check-In");
      // Also update sessionStorage when reverting to default
      sessionStorage.setItem("selectedKioskMode", "Self Check-In");
    }, 20000);

    if (!mqttTimeoutsRef.current) {
      mqttTimeoutsRef.current = {};
    }
    mqttTimeoutsRef.current[e.key] = timeoutId;
  };

  const handleSnapshotCapture = async () => {
    try {
      if (snapshotLoading) {
        return;
      }

      if (!window.jitsiApi || disconnectOn) {
        return;
      }

      setSnapshotLoading(true);

      try {
        if (window.jitsiApi) {
          const isVideoMuted = window.jitsiApi.isVideoMuted();
          if (isVideoMuted) {
            window.jitsiApi.executeCommand("toggleVideo");
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      } catch (videoError) {
        // console.warn("Could not prepare video for snapshot:", videoError);
      }

      const paramsData = {
        cmd: "screen_capture",
        device_uuid_list: [deviceId],
        payload: { agent_user_id: userHotelSession?.id },
      };

      dispatch(kioskMQTTAction(paramsData));

      // Set timeout for snapshot response
      const timeoutId = setTimeout(() => {
        handleSnapshotTimeout();
      }, SNAPSHOT_TIMEOUT_DURATION);

      setSnapshotTimeout(timeoutId);
    } catch (error) {
      handleSnapshotError("Failed to initiate snapshot capture");
    }
  };

  // Handle snapshot timeout
  const handleSnapshotTimeout = () => {
    if (snapshotRetryCount < MAX_SNAPSHOT_RETRIES) {
      setSnapshotRetryCount((prev) => prev + 1);

      resetSnapshotState();
      setTimeout(() => {
        handleSnapshotCapture();
      }, 1000);
    } else {
      handleSnapshotError("Snapshot capture failed after multiple attempts");
    }
  };

  // Handle snapshot error
  const handleSnapshotError = (errorMessage) => {
    resetSnapshotState();
    notification(errorMessage, "error");
    setSnapshotRetryCount(0);
  };

  // Reset snapshot state
  const resetSnapshotState = () => {
    setSnapshotLoading(false);
    setMqttCommandLoading((prev) => ({ ...prev, screen_capture: false }));

    if (snapshotTimeout) {
      clearTimeout(snapshotTimeout);
      setSnapshotTimeout(null);
    }
  };

  // Handle successful snapshot
  const handleSnapshotSuccess = (response) => {
    resetSnapshotState();
    setSnapshotRetryCount(0);
  };

  // Update useEffect that watches for messages
  useEffect(() => {
    if (latestMessage && latestMessage?.message) {
      try {
        const response = JSON.parse(latestMessage.message);
        if (response.cmd && mqttCommandLoading[response.cmd]) {
          setMqttCommandLoading((prev) => ({
            ...prev,
            [response.cmd]: false,
          }));
          if (
            mqttTimeoutsRef.current &&
            mqttTimeoutsRef.current[response.cmd]
          ) {
            clearTimeout(mqttTimeoutsRef.current[response.cmd]);
            delete mqttTimeoutsRef.current[response.cmd];
          }
        }
      } catch (error) {}
    }
  }, [latestMessage, mqttCommandLoading]);

  function isDaylightSaving(timeZone, standardOffset) {
    const now = new Date();

    // Get actual timezone offsets for January and July in the specified timezone
    const currentActualOffset = getTimezoneOffsetForDate(now, timeZone);

    const isDST = currentActualOffset !== standardOffset;
    const dstOffset = standardOffset + 1;

    return {
      isDST,
      currentOffset: currentActualOffset,
      standardOffset: standardOffset,
      dstOffset: dstOffset,
    };
  }

  function getTimezoneOffsetForDate(date, timeZone) {
    // Get the timezone offset using Intl API
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timeZone,
      timeZoneName: "longOffset",
    });

    const parts = formatter.formatToParts(date);
    const offsetString = parts.find(
      (part) => part.type === "timeZoneName"
    )?.value;

    if (offsetString) {
      // Parse offset string like "GMT-5" or "GMT+5:30"
      const match = offsetString.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const sign = match[1] === "+" ? 1 : -1;
        const hours = parseInt(match[2]);
        const minutes = match[3] ? parseInt(match[3]) : 0;
        return sign * (hours + minutes / 60);
      }
    }

    // Fallback method
    const localDate = new Date(date.toLocaleString("en-US", { timeZone }));
    const utcTime = date.getTime();
    const localTime = localDate.getTime();
    return (utcTime - localTime) / (1000 * 60 * 60);
  }

  // Usage with your hotel session data
  const { currentOffset } = isDaylightSaving(
    hotelSession?.time_zone,
    hotelSession?.time_zone_offset
  );

  // Use the current actual offset
  const finalOffset = currentOffset;

  const getLocalizedTime = () => {
    if (!hotelSession?.time_zone_offset) {
      return dayjs(); // fallback to local time
    }

    // Ensure time_zone_offset is a valid number
    const offset = Number(finalOffset);
    if (isNaN(offset)) {
      return dayjs(); // fallback if offset is not a number
    }

    return dayjs().utcOffset(offset * 60);
  };

  const fixedOffsetTime = getLocalizedTime();

  const checkInDate = fixedOffsetTime.format("YYYY-MM-DD");
  const checkInTime = fixedOffsetTime.format("HH:mm") || "14:34";

  const checkOutDate = dayjs(checkInDate).add(1, "day").format("YYYY-MM-DD");

  const checkOutTime =
    dayjs
      .utc(`1970-01-01T${hotelSession?.check_out_time || "11:00:00"}`)
      .utcOffset(finalOffset * 60)
      .format("HH:mm") || "11:00";

  const jitsiContainerRef = useRef(null);
  const [selfieCapture, setSelfieCapture] = useState(false);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [videoMode, setVideoMode] = useState("live");
  const [monitorOn, setMonitorOn] = useState(true);
  const [disconnectOn, setDisconnectOn] = useState(false);
  const [activeTab, setActiveTab] = useState("booking");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [bookingData, setBookingData] = useState({
    name: null,
    id_number: null,
    validity: null,
    address: null,
    city: null,
    state: null,
    zip_code: null,
    email: null,
    mobile: null,
    check_in_date: checkInDate || dayjs().format("YYYY-MM-DD"),
    check_in_time: checkInTime || "14:34",
    check_out_date: checkOutDate || dayjs().add(1, "day").format("YYYY-MM-DD"),
    check_out_time: checkOutTime || "07:34",
    vehicle_number: null,
    room_number: null,
    total_charge: null,
    first_name: null,
    last_name: null,
    country: null,
    date_of_birth: null,
    gender: null,
  });

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: null,
      id_number: null,
      validity: null,
      address: null,
      city: null,
      state: null,
      zip_code: null,
      email: null,
      mobile: null,
      check_in_date: checkInDate || dayjs().format("YYYY-MM-DD"),
      check_in_time: checkInTime || "14:34",
      check_out_date:
        checkOutDate || dayjs().add(1, "day").format("YYYY-MM-DD"),
      check_out_time: checkOutTime || "07:34",
      vehicle_number: null,
      room_number: null,
      total_charge: null,
      first_name: null,
      last_name: null,
      country: null,
      date_of_birth: null,
      gender: null,
    },
    mode: "onSubmit",
  });

  const updateFormWithExternalData = useCallback(
    (data) => {
      if (!data) return;

      // Create a batch of updates
      const updates = {};

      if (data.first_name) updates.first_name = data.first_name;
      if (data.last_name) updates.last_name = data.last_name;
      if (data.first_name || data.last_name) {
        updates.name = `${data.first_name || null} ${
          data.last_name || null
        }`.trim();
      }
      if (data.doc_number) updates.id_number = data.doc_number;
      if (data.doc_expire_date)
        updates.validity = dayjs(data.doc_expire_date).format("YYYY-MM-DD");
      if (data.date_of_birth)
        updates.date_of_birth = dayjs(data.date_of_birth).format("YYYY-MM-DD");
      if (data?.gender) updates.gender = data?.gender;
      if (data.address_line_first || data.address_line_second) {
        updates.address =
          data.address_line_first || data.address_line_second || null;
      }
      if (data.city) updates.city = data.city;
      if (data.state) updates.state = data.state;
      if (data.zip_code) updates.zip_code = data.zip_code;
      if (data.country) updates.country = data.country || "United States";
      if (data.email) updates.email = data.email;

      // Handle phone number with dial code
      if (data.phone || data.dial_code) {
        // Combine dial code and phone number for react-phone-input-2
        const dialCode = data.dial_code || "";
        const phoneNumber = data.phone || "";

        if (dialCode && phoneNumber) {
          // Format: dial_code + phone_number (e.g., "354" + "22222222222" = "35422222222222")
          updates.mobile = dialCode + phoneNumber;
        } else if (data.full_phone) {
          // If full_phone is available, use it (remove the + sign)
          updates.mobile = data.full_phone.replace("+", "");
        } else if (phoneNumber) {
          // If only phone number is available, use it as is
          updates.mobile = phoneNumber;
        }
      }

      if (data.vehicle_number) updates.vehicle_number = data.vehicle_number;

      // Apply all updates at once
      Object.entries(updates).forEach(([field, value]) => {
        setValue(field, value, { shouldValidate: true, shouldDirty: true });
      });
    },
    [setValue]
  );
  // Load data from session storage when component mounts
  useEffect(() => {
    if (ocrSession) updateFormWithExternalData(ocrSession);
    if (emailPhoneSession) updateFormWithExternalData(emailPhoneSession);
    if (vehicleNumberSession) updateFormWithExternalData(vehicleNumberSession);
  }, []);

  useEffect(() => {
    // Part 1: Load data from session storage when component mounts
    if (!latestMessage) {
      try {
        // Get OCR data from session storage with safety check
        const ocrData = sessionStorage.getItem("OcrSessionData");
        let savedOcrData = null;

        if (ocrData) {
          try {
            // First try to parse it as JSON directly (no encoding)
            savedOcrData = JSON.parse(ocrData);
          } catch (e) {
            // If direct JSON parsing fails, try base64 decoding if it looks like base64
            if (isBase64(ocrData)) {
              try {
                savedOcrData = JSON.parse(
                  decodeURIComponent(escape(atob(ocrData)))
                );
              } catch (decodeError) {
                // console.error("Error decoding OCR data:", decodeError);
              }
            }
          }
        }

        // Get email/phone data from session storage with safety check
        const emailPhoneData = sessionStorage.getItem("EmailPhoneSessionData");
        let savedEmailPhoneData = null;

        if (emailPhoneData) {
          try {
            // First try to parse it as JSON directly (no encoding)
            savedEmailPhoneData = JSON.parse(emailPhoneData);
          } catch (e) {
            // If direct JSON parsing fails, try base64 decoding if it looks like base64
            if (isBase64(emailPhoneData)) {
              try {
                savedEmailPhoneData = JSON.parse(
                  decodeURIComponent(escape(atob(emailPhoneData)))
                );
              } catch (decodeError) {
                // console.error("Error decoding email/phone data:", decodeError);
              }
            }
          }
        }

        // Get email/phone data from session storage with safety check
        const vehicleNumberData = sessionStorage.getItem(
          "vehicleNumberSessionData"
        );
        let savedVehicleNumberData = null;

        if (vehicleNumberData) {
          try {
            // First try to parse it as JSON directly (no encoding)
            savedVehicleNumberData = JSON.parse(vehicleNumberData);
          } catch (e) {
            // If direct JSON parsing fails, try base64 decoding if it looks like base64
            if (isBase64(vehicleNumberData)) {
              try {
                savedVehicleNumberData = JSON.parse(
                  decodeURIComponent(escape(atob(vehicleNumberData)))
                );
              } catch (decodeError) {
                // console.error("Error decoding email/phone data:", decodeError);
              }
            }
          }
        }

        // If we have saved data, update the form
        if (savedOcrData || savedEmailPhoneData || savedVehicleNumberData) {
          let newBookingData = { ...bookingData };

          // Update with OCR data if available
          if (savedOcrData) {
            // Update booking data with OCR information
            newBookingData = {
              ...newBookingData,
              name: `${savedOcrData.first_name || null} ${
                savedOcrData.last_name || null
              }`.trim(),
              first_name: savedOcrData.first_name || null,
              last_name: savedOcrData.last_name || null,
              gender:
                savedOcrData.gender == "f"
                  ? "female"
                  : "m"
                  ? "male"
                  : "other" || null,
              date_of_birth: dayjs(savedOcrData?.date_of_birth).format(
                "YYYY-MM-DD"
              ),
              id_number: savedOcrData.doc_number || null,
              validity: dayjs(savedOcrData?.doc_expire_date).format(
                "YYYY-MM-DD"
              ),
              address:
                savedOcrData.address_line_first ||
                savedOcrData.address_line_second ||
                null,
              city: savedOcrData.city || null,
              state: savedOcrData.state || null,
              zip_code: savedOcrData.zip_code || null,
              country: savedOcrData.country || "United States",
            };
          }

          // Update with email/phone data if available
          if (savedEmailPhoneData) {
            newBookingData = {
              ...newBookingData,
              email: savedEmailPhoneData.email || newBookingData.email || null,
              mobile:
                savedEmailPhoneData.phone || newBookingData.mobile || null,
            };
          }

          if (savedVehicleNumberData) {
            newBookingData = {
              ...newBookingData,
              vehicle_number:
                savedVehicleNumberData.vehicle_number ||
                newBookingData.vehicle_number ||
                null,
            };
          }

          // Update the booking data state
          setBookingData(newBookingData);
        }
      } catch (error) {
        // console.error("Error loading data from session storage:", error);
      }
    }

    // Part 2: Process MQTT messages
    if (latestMessage && latestMessage.message) {
      try {
        const response = JSON.parse(latestMessage.message);

        // Process OCR data from MQTT response
        if (response?.response?.data?.ocr) {
          const ocrData = response.response.data.ocr;
          dispatch(
            callMQTTAction({
              cmd: "full",
              payload: {
                agent_user_id: userHotelSession?.id,
              },
              device_uuid_list: [kioskSession?.[0]?.device_id],
            })
          );

          // Store OCR data in session storage as plain JSON (no encoding)
          sessionStorage.setItem("OcrSessionData", JSON.stringify(ocrData));
          updateFormWithExternalData(ocrData);
          if (ocrData.first_name && ocrData.last_name) {
            setSessionItem("ScannedComplete", true);
          }

          // Update bookingData with OCR information
          setBookingData((prevData) => ({
            ...prevData,
            name: `${ocrData.first_name || null} ${
              ocrData.last_name || null
            }`.trim(),
            first_name: ocrData.first_name || null,
            last_name: ocrData.last_name || null,
            id_number: ocrData.doc_number || null,
            address:
              ocrData.address_line_first || ocrData.address_line_second || null,
            city: ocrData.city || null,
            state: ocrData.state || null,
            zip_code: ocrData.zip_code || null,
            country: ocrData.country || "United States",
          }));
        }

        // Process email/phone data from MQTT response
        if (
          response?.response?.data?.email ||
          response?.response?.data?.phone ||
          response?.response?.data?.dial_code
        ) {
          dispatch(
            callMQTTAction({
              cmd: "full",
              payload: {
                agent_user_id: userHotelSession?.id,
              },
              device_uuid_list: [kioskSession?.[0]?.device_id],
            })
          );
          const emailPhoneData = response.response.data;
          setStartScanLoading(false);
          setLoading((prev) => ({
            ...prev,
            ask_email_mob: false,
          }));

          // Store email/phone data in session storage as plain JSON (no encoding)
          sessionStorage.setItem(
            "EmailPhoneSessionData",
            JSON.stringify(emailPhoneData)
          );
          updateFormWithExternalData(emailPhoneData);

          // Update bookingData with email/phone information
          setBookingData((prevData) => {
            const dialCode = emailPhoneData.dial_code || "";
            const phoneNumber = emailPhoneData.phone || "";
            let formattedPhone = null;

            if (dialCode && phoneNumber) {
              formattedPhone = dialCode + phoneNumber;
            } else if (emailPhoneData.full_phone) {
              formattedPhone = emailPhoneData.full_phone.replace("+", "");
            } else if (phoneNumber) {
              formattedPhone = phoneNumber;
            }

            return {
              ...prevData,
              email: emailPhoneData.email || prevData.email || null,
              mobile: formattedPhone || prevData.mobile || null,
            };
          });
        }

        if (response?.response?.data?.status_mode === "ask_vehicle_no") {
          dispatch(
            callMQTTAction({
              cmd: "full",
              payload: {
                agent_user_id: userHotelSession?.id,
              },
              device_uuid_list: [kioskSession?.[0]?.device_id],
            })
          );
          const vehicleNumberData = response.response.data;
          setStartScanLoading(false);
          setLoading((prev) => ({
            ...prev,
            ask_vehicle_no: false,
          }));
          // Store vehicle_number data in session storage as plain JSON (no encoding)
          sessionStorage.setItem(
            "vehicleNumberSessionData",
            JSON.stringify(vehicleNumberData)
          );
          updateFormWithExternalData(vehicleNumberData);

          // Update bookingData with email/phone information
          setBookingData((prevData) => ({
            ...prevData,
            vehicle_number:
              vehicleNumberData.vehicle_number ||
              prevData.vehicle_number ||
              null,
          }));
        }

        // Handle MQTT command responses
        if (response.cmd && mqttCommandLoading[response.cmd]) {
          setMqttCommandLoading((prev) => ({
            ...prev,
            [response.cmd]: false,
          }));
          if (
            mqttTimeoutsRef.current &&
            mqttTimeoutsRef.current[response.cmd]
          ) {
            clearTimeout(mqttTimeoutsRef.current[response.cmd]);
            delete mqttTimeoutsRef.current[response.cmd];
          }
        }
      } catch (error) {
        // console.error("Error parsing MQTT response:", error);
      }
    }
  }, [latestMessage, mqttCommandLoading, updateFormWithExternalData]);

  // Helper function to check if a string is base64 encoded
  function isBase64(str) {
    try {
      return btoa(atob(str)) == str;
    } catch (err) {
      return false;
    }
  }

  const initJitsi = () => {
    if (window.jitsiApi) {
      return window.jitsiApi;
    }

    if (!hotelSession) {
      return null;
    }

    if (!window.JitsiMeetExternalAPI) {
      return null;
    }

    if (!jitsiContainerRef.current) {
      return null;
    }

    // Don't initialize if already disconnected
    if (disconnectOn) {
      return null;
    }

    const options = {
      roomName: `${kioskSession?.[0]?.device_meet_token}/${kioskSession?.[0]?.device_meet_id}`,
      parentNode: jitsiContainerRef.current,
      lang: "en",
      configOverwrite: {
        toolbarButtons: ["select-background", "recording"],
        prejoinPageEnabled: false,
        disableSelfView: false,
        disableSelfViewSettings: true,
        hideDisplayName: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        hideRecordingLabel: false,
        hideParticipantsStats: true,
        doNotFlipLocalVideo: true,
        disableLocalVideoFlip: true,
        disableReactions: false,
        requireDisplayName: false,
        enableWelcomePage: false,
        enableClosePage: true,
        enableDisplayNameInStats: false,
        disableTileView: true,
        disableTileEnlargement: true,
        disableSimulcast: true,
        startWithAudioMuted: true,
        disableFilmstripAutohiding: true,
        fileRecordingsEnabled: false,
        fileRecordingsServiceEnabled: false,
        remoteVideoMenu: {
          disabled: true,
        },
        connectionIndicators: {
          disabled: true,
          disableDetails: true,
        },
        userInfo: {
          displayName: "agent",
          email: "kiosk@agent.com",
          id: "agent",
        },
        disabledSounds: ["RECORDING_ON_SOUND", "RECORDING_OFF_SOUND"],
        constraints: {
          video: {
            height: {
              ideal: 1280,
              max: 1440,
              min: 720,
            },
            width: {
              ideal: 720,
              max: 720,
              min: 480,
            },
            aspectRatio: 9 / 16,
          },
        },
      },
      interfaceConfigOverwrite: {
        VIDEO_QUALITY_LABEL_DISABLED: false,
      },
    };

    try {
      // This will be umcommnet after once project done with mqtt
      const api = new window.JitsiMeetExternalAPI("8x8.vc", options);
      api.addEventListeners({
        videoConferenceJoined: handleVideoConferenceJoined,
        videoConferenceLeft: handleReadyToClose,
        audioMuteStatusChanged: handleAudioMuteStatusChanged,
        videoMuteStatusChanged: handleVideoMuteStatusChanged,
        participantJoined: handleParticipantJoined,
        readyToClose: handleReadyToClose,
      });
      // Execute additional commands to simplify the UI
      api.executeCommand("setTileView", true);
      api.executeCommand("setVideoQuality", 720);
      window.jitsiApi = api;
      setJitsiLoaded(true);
      return api;
    } catch (error) {
      message.error("Failed to initialize video call");
      return null;
    }
  };

  const cleanupJitsi = () => {
    if (window.jitsiApi) {
      try {
        window.jitsiApi.executeCommand("hangup");
        window.jitsiApi.dispose();
      } catch (error) {
        // console.error("Error disposing Jitsi:", error);
      }
      window.jitsiApi = null;
      setJitsiLoaded(false);
    }
  };

  // Load Jitsi script when in Video Call mode
  useEffect(() => {
    // Add Jitsi Meet API script
    if (!document.getElementById("jitsi-api-script")) {
      const script = document.createElement("script");
      script.id = "jitsi-api-script";
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => {
        if (!disconnectOn) {
          initJitsi();
        }
      };
      document.body.appendChild(script);

      return () => {
        if (document.getElementById("jitsi-api-script")) {
          document.getElementById("jitsi-api-script").remove();
        }
      };
    }
  }, [disconnectOn]);

  useEffect(() => {
    return () => {
      if (window.jitsiApi) {
        window.jitsiApi.dispose();
        window.jitsiApi = null;
        setJitsiLoaded(false);
      }
    };
  }, []);

  const [editingBooking, setEditingBooking] = useState(null);
  const [currentModel, setCurrentModel] = useState("");

  const handleEditBooking = (bookingData) => {
    const primaryDocument =
      bookingData.guest_document?.find((doc) => doc.is_primary === true) ||
      bookingData.guest_document?.[0] ||
      {};

    const primaryContact =
      bookingData.guest_contact?.find(
        (contact) => contact.is_primary === true
      ) ||
      bookingData.guest_contact?.[0] ||
      {};

    const guest = bookingData.guest || {};

    const primaryEmail =
      guest.email_details && guest.email_details.length > 0
        ? guest.email_details.find((email) => email.is_primary === true)
            ?.email || null
        : null;

    const primaryPhone =
      guest.phone_details && guest.phone_details.length > 0
        ? guest.phone_details.find((phone) => phone.is_primary === true)
            ?.phone || null
        : null;

    const checkInDate = bookingData.check_in_date || null;
    const checkInTime = bookingData.check_in_time || null;
    const checkOutDate = bookingData.check_out_date || null;
    const checkOutTime = bookingData.check_out_time || null;

    let checkInDateTime = null;
    let checkOutDateTime = null;

    if (checkInDate) {
      if (checkInTime) {
        checkInDateTime = dayjs(
          `${checkInDate} ${checkInTime}`,
          "YYYY-MM-DD HH:mm:ss"
        );
      } else {
        checkInDateTime = dayjs(checkInDate, "YYYY-MM-DD");
      }
    }

    if (checkOutDate) {
      if (checkOutTime) {
        checkOutDateTime = dayjs(
          `${checkOutDate} ${checkOutTime}`,
          "YYYY-MM-DD HH:mm:ss"
        );
      } else {
        checkOutDateTime = dayjs(checkOutDate, "YYYY-MM-DD");
      }
    }

    const formData = {
      name: guest.full_name || null,
      id_number: primaryDocument.doc_number || null,
      validity: primaryDocument.expiry_date || null,
      address:
        primaryDocument.address_line_first ||
        primaryContact.address_line_first ||
        null,
      city: primaryDocument.city || primaryContact.city || null,
      state: primaryDocument.state || primaryContact.state || null,
      zip_code: primaryDocument.zip_code || primaryContact.zip_code || null,
      country: primaryDocument.country || primaryContact.country || null,
      email: primaryContact.email || primaryEmail || null,
      mobile: primaryContact.phone_number || primaryPhone || null,
      check_in_date: checkInDateTime,
      check_in_time: checkInTime ? checkInTime.substring(0, 5) : null,
      check_out_date: checkOutDateTime,
      check_out_time: checkOutTime ? checkOutTime.substring(0, 5) : null,
      room_number: bookingData.room_number || null,
      total_charge: bookingData.total_charge
        ? bookingData.total_charge.toFixed(2)
        : "0.00",
      first_name: guest.first_name || null,
      last_name: guest.last_name || null,
      date_of_birth: guest.date_of_birth || null,
      gender: guest.gender || null,
      vehicle_number: primaryContact.vehicle_no || null,
      reference_no: bookingData.reference_no || null,
    };

    setBookingData(formData);

    Object.keys(formData).forEach((key) => {
      setValue(key, formData[key]);
    });

    setEditingBooking(bookingData);
  };

  const onSubmit = (data) => {};

  const [dispatchCompleted, setDispatchCompleted] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [keyButtonDisabled, setKeyButtonDisabled] = useState(false);

  // Use a separate effect to track when kioskSession is available
  useEffect(() => {
    if (kioskSession?.[0]?.device_id && !deviceId) {
      setDeviceId(kioskSession[0].device_id);
    }
  }, [kioskSession, deviceId]);

  useEffect(() => {
    if (deviceId && !dispatchCompleted) {
      dispatch(
        callMQTTAction({
          cmd: "connect",
          payload: { agent_user_id: userHotelSession?.id },
          device_uuid_list: [deviceId],
        })
      ).then(() => {
        // Initialize Jitsi after connect command is sent
        if (!window.jitsiApi && !disconnectOn) {
          initJitsi();
        }
        dispatch(
          agentMQTTAction({
            cmd: "connect",
            device_uuid_list: [kioskSession?.[0]?.device_id],
            payload: { agent_user_id: userHotelSession?.id },
          })
        ).then(() => {
          if (kioskSession?.[0]?.id_scanner_config?.is_active) {
            statusIDScanner();
          }
          if (kioskSession?.[0]?.key_dispenser_config?.is_active) {
            statusKeyDispenser();
          }
          if (kioskSession?.[0]?.cash_recycler_config?.is_active) {
            connectCashRecycler();
          }
          if (kioskSession?.[0]?.key_encoder_config?.is_active) {
            statusKeyEncoder();
          }
          // if (kioskSession?.[0]?.usb_hub_config?.is_active) {
          // }
          // if (kioskSession?.[0]?.printer_config?.is_active) {
          // }
        });
        dispatch(
          callMQTTAction({
            cmd: "mute",
            payload: { agent_user_id: userHotelSession?.id },
            device_uuid_list: [deviceId],
          })
        );
      });
    }
  }, [deviceId, dispatchCompleted, userHotelSession?.id]);

  const toggleMonitor = () => {
    const newState = !monitorOn;
    setMonitorOn(newState);

    dispatch(
      callMQTTAction({
        cmd: !newState ? "monitor" : "live",
        payload: { agent_user_id: userHotelSession?.id },
        device_uuid_list: [kioskSession?.[0]?.device_id],
      })
    );

    if (window.jitsiApi) {
      if (newState) {
        window.jitsiApi.executeCommand("setVideoMuted", false);
      } else {
        window.jitsiApi.executeCommand("setVideoMuted", true);
      }
    }
  };

  const handleVideoModeChange = (mode) => {
    setVideoMode(mode);

    // Camera ON/OFF via Jitsi
    if (window.jitsiApi) {
      if (mode === "monitor") {
        window.jitsiApi.executeCommand("toggleVideo"); // OFF
      } else if (videoMode === "monitor") {
        window.jitsiApi.executeCommand("toggleVideo"); // ON (when changing from monitor)
      }
    }

    // Notify the other side (if needed)
    dispatch(
      callMQTTAction({
        cmd: mode,
        payload: {
          agent_user_id: userHotelSession?.id,
        },
        device_uuid_list: [kioskSession?.[0]?.device_id],
      })
    );
  };

  const toggleDisconnect = () => {
    const newState = !disconnectOn;
    setDisconnectOn(newState);

    if (newState) {
      // DISCONNECT CASE
      dispatch(
        callMQTTAction({
          cmd: "disconnect",
          payload: { agent_user_id: userHotelSession?.id },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );

      // Clean up Jitsi
      cleanupJitsi();
    } else {
      setVideoMode("live");
      // CONNECT CASE
      dispatch(
        callMQTTAction({
          cmd: "connect",
          payload: { agent_user_id: userHotelSession?.id },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      ).then(() => {
        // Initialize Jitsi after successful connection if not already initialized
        if (!window.jitsiApi && !disconnectOn) {
          initJitsi();
        }
      });
    }
  };

  useEffect(() => {
    return () => {
      cleanupJitsi();
    };
  }, []);

  // Event handler functions
  const handleVideoConferenceJoined = () => {
    // message.success("You joined the video call");

    // Update UI state when joining
    if (window.jitsiApi) {
      const isMuted = window.jitsiApi.isVideoMuted();
      setMonitorOn(!isMuted);
    }
  };

  const handleAudioMuteStatusChanged = (muted) => {
    const newMuteState = muted?.muted;
    setIsAudioMuted(newMuteState);
  };

  const handleVideoMuteStatusChanged = (muted) => {
    setMonitorOn(!muted.muted);
  };

  const handleReadyToClose = () => {
    setDisconnectOn(true);
  };

  const handleParticipantJoined = (participant) => {};

  const transactionColumns = [
    {
      title: "GUEST",
      dataIndex: "guest_name",
      key: "guest_name",
      render: (text) => text,
    },
    {
      title: "AMT",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (text) => text,
    },
    {
      title: "Type",
      dataIndex: "transaction_type",
      key: "transaction_type",
      render: (text) => (
        <span style={{ textTransform: "capitalize" }}>{text || "-"}</span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "transaction_status",
      key: "transaction_status",
      render: (status) => {
        const statusConfig = {
          complete: { color: "green", text: "complete" },
          pending: { color: "yellow", text: "pending" },
          running: { color: "blue", text: "running" },
          cancelled: { color: "red", text: "cancelled" },
        };

        const config = statusConfig[status] || {
          color: "default",
          text: status || "?",
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "View",
      key: "view",
      width: 60,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedTransaction(record);
            settransactionModalVisible(true);
          }}
        />
      ),
    },
  ];

  // Data for the bills table
  const billColumns = [
    {
      title: "BILLS",
      dataIndex: "category",
      key: "category",
      width: "20%",
      render: (text) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: "1",
      dataIndex: "1",
      key: "1",
    },
    {
      title: "2",
      dataIndex: "2",
      key: "2",
    },
    {
      title: "5",
      dataIndex: "5",
      key: "5",
    },
    {
      title: "10",
      dataIndex: "10",
      key: "10",
    },
    {
      title: "20",
      dataIndex: "20",
      key: "20",
    },
    {
      title: "50",
      dataIndex: "50",
      key: "50",
    },
    {
      title: "100",
      dataIndex: "100",
      key: "100",
    },
  ];

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const BookingContent = ({ setActiveTab }) => {
    const handleHomeClick = () => {
      dispatch(
        callMQTTAction({
          cmd: "full",
          payload: {
            agent_user_id: userHotelSession?.id,
          },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );
      setStartScanLoading(false);
      setLoading({
        ask_email_mob: false,
        ask_vehicle_no: false,
        scan_id: false,
        draw_sign: false,
        issue_key: false,
        capture_selfie: false,
      });
      const paramsData = {
        cmd: "move_home",
        device_uuid_list: [deviceId],
        payload: { agent_user_id: userHotelSession?.id },
      };

      dispatch(kioskMQTTAction(paramsData));
    };

  
    const normalizeString = (str) => {
      return str
        .toLowerCase()
        .replace(/[^a-z\s]/g, "") // Remove special characters
        .replace(/\blicence\b/g, "license") // Handle "licence" → "license"
        .replace(/\bdl\b/g, "driver license") // Handle "DL" → "driver license"
        .replace(/\bdriver\b/g, "driver license") // Handle "driver" → "driver license"
        .split(" ");
    };

    const getBestMatchId = (searchTerm) => {
      if (!searchTerm) return null;

      const searchWords = normalizeString(searchTerm);

      const matchedDoc = activeDocumentTypeList.find((doc) => {
        const docWords = normalizeString(doc.document_name);
        return docWords.some((word) => searchWords.includes(word));
      });

      return matchedDoc?.id;
    };

    const handleCancelClick = () => {
      reset({
        name: null,
        id_number: null,
        validity: null,
        date_of_birth: null,
        gender: null,
        address: null,
        city: null,
        state: null,
        zip_code: null,
        email: null,
        mobile: null,
        check_in_date: checkInDate || dayjs().format("YYYY-MM-DD"),
        check_in_time: checkInTime || "14:34",
        check_out_date:
          checkOutDate || dayjs().add(1, "day").format("YYYY-MM-DD"),
        check_out_time: checkOutTime || "07:34",
        vehicle_number: null,
        room_number: null,
        total_charge: null,
        first_name: null,
        last_name: null,
        country: null,
        deposit: null,
      });

      removeSessionItem("ScannedComplete");
      removeSessionItem("back_image");
      removeSessionItem("front_image");
      removeSessionItem("front_image_base64");
      removeSessionItem("back_image_base64");
      removeSessionItem("ScannedComplete");
      removeSessionItem("draw_sign");
      removeSessionItem("capture_selfie");

      // Reset booking data state
      setBookingData({
        name: null,
        id_number: null,
        validity: null,
        date_of_birth: null,
        gender: null,
        address: null,
        city: null,
        state: null,
        zip_code: null,
        email: null,
        mobile: null,
        check_in_date: checkInDate || dayjs().format("YYYY-MM-DD"),
        check_in_time: checkInTime || "14:34",
        check_out_date:
          checkOutDate || dayjs().add(1, "day").format("YYYY-MM-DD"),
        check_out_time: checkOutTime || "07:34",
        vehicle_number: null,
        room_number: null,
        total_charge: null,
        first_name: null,
        last_name: null,
        country: null,
      });

      // Reset editing state if it was set
      setEditingBooking(null);

      // Clear session storage for uploaded documents
      sessionStorage.removeItem("OcrSessionData");
      sessionStorage.removeItem("EmailPhoneSessionData");
      sessionStorage.removeItem("vehicleNumberSessionData");

      notification("Cancelling operation", "info", 2000, "topRight");
    };

    const handleScanIDClick = () => {
      if (!deviceStatuses.id_scanner) {
        notification(
          "ID Scanner service is not running. Please start the service to continue.",
          "warn",
          4000,
          "topRight"
        );

        return;
      }
      setStartScanLoading(true);
      dispatch(
        callMQTTAction({
          cmd: "live",
          payload: {
            agent_user_id: userHotelSession?.id,
          },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );
      setLoading((prev) => ({
        ...prev,
        scan_id: true,
      }));
      const paramsData = {
        cmd: "scan_id",
        device_uuid_list: [deviceId],
        payload: { agent_user_id: userHotelSession?.id },
      };

      dispatch(kioskMQTTAction(paramsData));
      setActiveTab("idScanning");
    };
    return isAnyMqttCommandLoading ? (
      <Loader isLoading={goTOhotelLoading} />
    ) : (
      <Form
        onFinish={handleSubmit(onSubmit)}
        layout="vertical"
        className="info-form"
      >
        {/* Guest Information Section */}
        <Card
          title={
            <div className="d-flex align-items-center ">
              <UserOutlined className="me-2" />
              Guest Information
            </div>
          }
          size="small"
          className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4"
        >
          <Form.Item label="" className="form-input-row">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div>
                  <Input {...field} placeholder="" className="form-input" />
                  <label>Full Name</label>
                </div>
              )}
            />
            <Button
              color="orange"
              variant="solid"
              className="absolute-btn"
              loading={loading?.scan_id || commandLoadingStates.scan_id}
              disabled={startScanLoading}
              onClick={handleScanIDClick}
            >
              Scan ID
            </Button>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="" className="form-input-row m-0">
                <Controller
                  name="id_number"
                  control={control}
                  defaultValue={bookingData.id_number || null}
                  render={({ field }) => (
                    <div>
                      <Input {...field} placeholder="" className="form-input" />
                      <label>ID Number</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item className="form-input-row m-0">
                <Controller
                  name="validity"
                  control={control}
                  defaultValue={bookingData.validity || null}
                  render={({ field }) => (
                    <div>
                      <DatePicker
                        placeholder=""
                        className="w-100"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => {
                          field.onChange(
                            date ? date.format("YYYY-MM-DD") : null
                          );
                        }}
                      />
                      <label>ID Expiry Date</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} className="mt-2">
            <Col span={12}>
              <Form.Item label="" className="form-input-row m-0">
                <Controller
                  name="date_of_birth"
                  control={control}
                  defaultValue={bookingData.date_of_birth || null}
                  render={({ field }) => (
                    <div>
                      <DatePicker
                        placeholder=""
                        className="w-100"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => {
                          field.onChange(
                            date ? date.format("YYYY-MM-DD") : null
                          );
                        }}
                      />
                      <label>Date of Birth</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item className="form-input-row m-0">
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        {...field}
                        className="form-input w-100"
                        placeholder="Gender"
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={[
                          {
                            label: "Male",
                            value: "male",
                          },
                          {
                            label: "Female",
                            value: "female",
                          },
                        ]?.map((item, index) => ({
                          value: item?.value,
                          label: item?.label,
                        }))}
                      />
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Address Information Section */}
        <Card
          title={
            <div className="d-flex align-items-center">
              <HomeOutlined className="me-2" />
              Address & Contact Information
            </div>
          }
          size="small"
          className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="" className="form-input-row">
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input {...field} placeholder="" className="form-input" />
                      <label>Street Address</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="" className="form-input-row">
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input {...field} placeholder="" className="form-input" />
                      <label>City</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="" className="form-input-row">
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input {...field} placeholder="" className="form-input" />
                      <label>State</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="" className="form-input-row">
                <Controller
                  name="zip_code"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input {...field} placeholder="" className="form-input" />
                      <label>Zip Code</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={21}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label=""
                    className="form-input-row m-0"
                    validateStatus={errors.email ? "error" : ""}
                    help={errors.email?.message}
                  >
                    <Controller
                      name="email"
                      control={control}
                      rules={{
                        pattern: {
                          value:
                            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/,
                          message: "Invalid email format",
                        },
                        validate: (value) => {
                          const mobile = getValues("mobile");
                          if (!value && !mobile) {
                            return "Mobile number is required";
                          }
                          return true;
                        },
                      }}
                      render={({ field }) => (
                        <div>
                          <Input
                            {...field}
                            placeholder=""
                            className="form-input"
                            status={errors.email ? "error" : ""}
                          />
                          <label>Email Address</label>
                        </div>
                      )}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label=""
                    className="form-input-row m-0"
                    validateStatus={errors.mobile ? "error" : ""}
                    help={errors.mobile?.message}
                  >
                    <Controller
                      name="mobile"
                      control={control}
                      rules={{
                        validate: (value) => {
                          const email = getValues("email");
                          if (!value && !email) {
                            return "Email is required";
                          }
                          if (value && value.length < 7) {
                            return "Mobile number is too short";
                          }
                          return true;
                        },
                      }}
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <PhoneInput
                            country={"us"}
                            value={value}
                            onChange={onChange}
                            inputClass={`form-input ${
                              errors.mobile ? "phone-error" : ""
                            }`}
                            inputStyle={{ width: "100%" }}
                            inputProps={{
                              name: "mobile",
                              required: false,
                            }}
                            containerClass="mct-phone-input"
                          />
                          <label>Phone Number</label>
                        </div>
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col span={3}>
              <Button
                color="orange"
                variant="solid"
                className="absolute-btn h-100"
                loading={
                  loading?.ask_email_mob || commandLoadingStates.ask_email_mob
                }
                onClick={() => {
                  setStartScanLoading(true);
                  dispatch(
                    callMQTTAction({
                      cmd: "live",
                      payload: {
                        agent_user_id: userHotelSession?.id,
                      },
                      device_uuid_list: [kioskSession?.[0]?.device_id],
                    })
                  );
                  setLoading((prev) => ({
                    ...prev,
                    ask_email_mob: true,
                  }));
                  const formValues = getValues();
                  const paramsData = {
                    cmd: "ask_email_mob",
                    device_uuid_list: [deviceId],
                    payload: {
                      agent_user_id: userHotelSession?.id,
                      data: {
                        name: formValues?.name,
                      },
                    },
                  };

                  dispatch(kioskMQTTAction(paramsData));
                }}
                disabled={startScanLoading}
              >
                ASK
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Booking Details Section */}
        <Card
          title={
            <div className="d-flex align-items-center">
              <CalendarOutlined className="me-2" />
              Booking Details
            </div>
          }
          size="small"
          className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="" className="form-input-row m-0">
                <Controller
                  name="check_in_date"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <DatePicker
                        showTime={{
                          format: "HH:mm",
                          defaultValue: dayjs("14:00", "HH:mm"),
                          showNow: true,
                          use12Hours: false,
                        }}
                        format="YYYY-MM-DD HH:mm"
                        placeholder=""
                        className="w-100"
                        value={
                          field.value
                            ? dayjs(
                                `${field.value} ${
                                  getValues("check_in_time") || "14:00"
                                }`,
                                "YYYY-MM-DD HH:mm"
                              )
                            : null
                        }
                        onChange={(date, dateString) => {
                          if (date) {
                            const formattedDate = date.format("YYYY-MM-DD");
                            const formattedTime = date.format("HH:mm");

                            field.onChange(formattedDate);
                            setValue("check_in_time", formattedTime, {
                              shouldValidate: true,
                            });

                            const checkOutDate = getValues("check_out_date");
                            const checkOutDayjs = checkOutDate
                              ? dayjs(checkOutDate)
                              : null;

                            if (
                              !checkOutDate ||
                              !checkOutDayjs ||
                              checkOutDayjs.isSame(
                                dayjs(formattedDate),
                                "day"
                              ) ||
                              checkOutDayjs.isBefore(dayjs(formattedDate))
                            ) {
                              const nextDay = date.clone().add(1, "day");
                              setValue(
                                "check_out_date",
                                nextDay.format("YYYY-MM-DD"),
                                { shouldValidate: true }
                              );
                              setValue("check_out_time", checkOutTime, {
                                shouldValidate: true,
                              });
                            }
                          } else {
                            field.onChange(null);
                            setValue("check_in_time", null, {
                              shouldValidate: true,
                            });
                          }
                        }}
                        disabledDate={(current) => {
                          return current && current < dayjs().startOf("day");
                        }}
                        popupClassName="date-time-popup"
                        onOpenChange={(open) => {
                          if (open) {
                            setTimeout(() => {
                              const nowBtn = document.querySelector(
                                ".ant-picker-now-btn"
                              );
                              if (nowBtn) {
                                nowBtn.addEventListener("click", () => {
                                  const now = dayjs().utcOffset(
                                    finalOffset * 60
                                  );
                                  const formattedDate =
                                    now.format("YYYY-MM-DD");
                                  const formattedTime = now.format("HH:mm");

                                  field.onChange(formattedDate);
                                  setValue("check_in_time", formattedTime, {
                                    shouldValidate: true,
                                  });

                                  const checkOutDate =
                                    getValues("check_out_date");
                                  const checkOutDayjs = checkOutDate
                                    ? dayjs(checkOutDate)
                                    : null;

                                  if (
                                    !checkOutDate ||
                                    !checkOutDayjs ||
                                    checkOutDayjs.isSame(now, "day") ||
                                    checkOutDayjs.isBefore(now)
                                  ) {
                                    const nextDay = now.clone().add(1, "day");
                                    setValue(
                                      "check_out_date",
                                      nextDay.format("YYYY-MM-DD"),
                                      {
                                        shouldValidate: true,
                                      }
                                    );
                                    setValue("check_out_time", checkOutTime, {
                                      shouldValidate: true,
                                    });
                                  }
                                });
                              }
                            }, 100); // Allow time for DOM to render
                          }
                        }}
                      />
                      <label>Check-in Date & Time</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="" className="form-input-row m-0">
                <Controller
                  name="check_out_date"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <DatePicker
                        showTime={{
                          format: "HH:mm",
                          defaultValue: dayjs(checkOutTime, "HH:mm"),
                          showNow: true,
                          use12Hours: false,
                        }}
                        format="YYYY-MM-DD HH:mm"
                        placeholder=""
                        className="w-100"
                        value={
                          field.value
                            ? dayjs(
                                `${field.value} ${
                                  getValues("check_out_time") || "11:00"
                                }`,
                                "YYYY-MM-DD HH:mm"
                              )
                            : null
                        }
                        onChange={(date, dateString) => {
                          if (date) {
                            const formattedDate = date.format("YYYY-MM-DD");
                            const formattedTime = date.format("HH:mm");

                            field.onChange(formattedDate);
                            setValue("check_out_time", formattedTime, {
                              shouldValidate: true,
                            });

                            const checkInDate = getValues("check_in_date");
                            if (
                              checkInDate &&
                              dayjs(formattedDate).isBefore(dayjs(checkInDate))
                            ) {
                              const nextDay = dayjs(checkInDate).add(1, "day");
                              field.onChange(nextDay.format("YYYY-MM-DD"));
                              setValue("check_out_time", checkOutTime, {
                                shouldValidate: true,
                              });
                              message.warning(
                                "Check-out date must be after check-in date"
                              );
                            }
                          } else {
                            field.onChange(null);
                            setValue("check_out_time", null, {
                              shouldValidate: true,
                            });
                          }
                        }}
                        disabledDate={(current) => {
                          const checkInDate = getValues("check_in_date");
                          return (
                            checkInDate &&
                            current &&
                            current < dayjs(checkInDate).startOf("day")
                          );
                        }}
                        disabledTime={(currentDate) => {
                          const checkInDate = getValues("check_in_date");
                          const checkInTime = getValues("check_in_time");

                          if (!checkInDate || !checkInTime || !currentDate)
                            return {};

                          const selectedCheckIn = dayjs(
                            `${checkInDate} ${checkInTime}`,
                            "YYYY-MM-DD HH:mm"
                          );

                          // Only apply when same day
                          if (!currentDate.isSame(selectedCheckIn, "day"))
                            return {};

                          const checkInHour = selectedCheckIn.hour();
                          const checkInMinute = selectedCheckIn.minute();

                          return {
                            disabledHours: () =>
                              Array.from({ length: 24 }, (_, i) => i).filter(
                                (h) => h < checkInHour
                              ),

                            disabledMinutes: (selectedHour) => {
                              if (selectedHour === checkInHour) {
                                return Array.from(
                                  { length: 60 },
                                  (_, i) => i
                                ).filter((m) => m <= checkInMinute);
                              }
                              return [];
                            },
                          };
                        }}
                        popupClassName="date-time-popup"
                        renderExtraFooter={() => (
                          <div
                            style={{ padding: "8px 0", textAlign: "center" }}
                          >
                            <Typography.Text type="secondary">
                              Standard check-out: {checkOutTime}
                            </Typography.Text>
                          </div>
                        )}
                      />
                      <label>Check-out Date & Time</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Room & Vehicle Information Section */}
        <Card
          title={
            <div className="d-flex align-items-center">
              <CarOutlined className="me-2" />
              Room & Vehicle Details
            </div>
          }
          size="small"
          className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label=""
                className="form-input-row m-0"
                validateStatus={errors.room_number ? "error" : ""}
                help={errors.room_number?.message}
              >
                <Controller
                  name="room_number"
                  control={control}
                  rules={{
                    required: "Room selection is required",
                  }}
                  render={({ field }) => (
                    <div>
                      <Select
                        {...field}
                        className="form-input w-100"
                        placeholder="Room"
                        status={errors.room_number ? "error" : ""}
                        loading={hotelRoomLoading}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={activeHotelRoomList?.map((room) => ({
                          value: room.id,
                          label: room.room_number || `Room ${room.id}`,
                        }))}
                      />
                    </div>
                  )}
                />
                <Button
                  color="orange"
                  variant="solid"
                  className="absolute-btn"
                  loading={loading?.issue_key || keyDispenserLoading}
                  disabled={
                    startScanLoading ||
                    keyButtonDisabled ||
                    !watch("room_number")
                  }
                  onClick={() => {
                    const formValues = getValues();
                    setStartScanLoading(true);
                    dispatch(
                      callMQTTAction({
                        cmd: "live",
                        payload: {
                          agent_user_id: userHotelSession?.id,
                        },
                        device_uuid_list: [kioskSession?.[0]?.device_id],
                      })
                    );

                    setLoading((prev) => ({
                      ...prev,
                      issue_key: true,
                    }));

                    if (formValues.room_number) {
                      const selectedRoom = activeHotelRoomList?.find(
                        (room) => room.id === formValues.room_number
                      );
                      const actualRoomNumber =
                        selectedRoom?.room_number || formValues.room_number;

                      const keyData = {
                        room_number: actualRoomNumber,
                        building_lock_id: selectedRoom?.building_lock_id,
                        floor_lock_id: selectedRoom?.floor_lock_id,
                        room_lock_id: selectedRoom?.room_lock_id,
                        check_in_date: formValues?.check_in_date,
                        check_out_date: formValues?.check_out_date,
                        check_in_time: formValues?.check_in_time,
                        check_out_time: formValues?.check_out_time,
                      };

                      setIssueKeyData(keyData);
                      setSelectedRoomData(keyData);
                      setKeyProgressDrawerVisible(true);
                    }
                  }}
                >
                  KEY
                </Button>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="" className="form-input-row m-0">
                <Controller
                  name="vehicle_number"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input {...field} placeholder="" className="form-input" />
                      <label>Vehicle Number</label>
                    </div>
                  )}
                />
                <Button
                  color="orange"
                  variant="solid"
                  className="absolute-btn"
                  loading={
                    loading.ask_vehicle_no ||
                    commandLoadingStates.ask_vehicle_no
                  }
                  onClick={() => {
                    setStartScanLoading(true);
                    dispatch(
                      callMQTTAction({
                        cmd: "live",
                        payload: {
                          agent_user_id: userHotelSession?.id,
                        },
                        device_uuid_list: [kioskSession?.[0]?.device_id],
                      })
                    );
                    setLoading((prev) => ({
                      ...prev,
                      ask_vehicle_no: true,
                    }));
                    const paramsData = {
                      cmd: "ask_vehicle_no",
                      device_uuid_list: [deviceId],
                      payload: { agent_user_id: userHotelSession?.id },
                    };

                    dispatch(kioskMQTTAction(paramsData));
                  }}
                  disabled={startScanLoading}
                >
                  ASK
                </Button>
              </Form.Item>
            </Col>
          </Row>
          {(vehicleNumberSession?.vehicle_make ||
            vehicleNumberSession?.vehicle_model ||
            vehicleNumberSession?.vehicle_color) && (
            <Row gutter={16}>
              <Col span={24}>
                <Card
                  size="small"
                  title="Vehicle Info"
                  bordered
                  className="mt-2 shadow-sm"
                  bodyStyle={{ padding: "12px 16px" }}
                >
                  <Descriptions
                    size="small"
                    column={3}
                    labelStyle={{
                      fontWeight: 500,
                      minWidth: 60,
                      paddingRight: 8,
                    }}
                    contentStyle={{
                      color: "#333",
                      paddingRight: 16,
                    }}
                    colon={false}
                  >
                    {vehicleNumberSession?.vehicle_make && (
                      <Descriptions.Item label="Make">
                        {vehicleNumberSession.vehicle_make}
                      </Descriptions.Item>
                    )}
                    {vehicleNumberSession?.vehicle_model && (
                      <Descriptions.Item label="Model">
                        {vehicleNumberSession.vehicle_model}
                      </Descriptions.Item>
                    )}
                    {vehicleNumberSession?.vehicle_color && (
                      <Descriptions.Item label="Color">
                        {vehicleNumberSession.vehicle_color}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          )}
        </Card>

        {/* Payment Information Section */}
        <Card
          title={
            <div className="d-flex align-items-center">
              <DollarOutlined className="me-2" />
              Payment Information
            </div>
          }
          size="small"
          className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="" className="form-input-row m-0">
                <Controller
                  name="total_charge"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Input {...field} placeholder="" className="form-input" />
                      <label>Room Charge</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="" className="form-input-row m-0">
                <Controller
                  name="deposit"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <div>
                      <Input {...field} placeholder="" className="form-input" />
                      <label>Deposit</label>
                    </div>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Flex align="center" wrap gap={8}>
          <Button
            color="primary"
            variant="solid"
            className="col"
            loading={commandLoadingStates.move_home}
            onClick={handleHomeClick}
            icon={<HomeOutlined />}
          >
            Home
          </Button>
          <Button
            color="green"
            variant="solid"
            className="col"
            loading={
              bookingConsoleLoading ||
              appBookingCheckoutLoading ||
              appBookingCheckinLoading
            }
            onClick={() => {
              handleSubmit((data) => {
                setKeyButtonDisabled(true);
                setStartScanLoading(true);

                if (kioskResponse?.response?.data?.signature_image) {
                  const signatureData =
                    kioskResponse?.response?.data?.signature_image;

                  const byteCharacters = atob(signatureData?.split(",")[1]);
                  const byteNumbers = new Array(byteCharacters.length);

                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }

                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: "image/png" });

                  const file = new File([blob], "signature.png", {
                    type: "image/png",
                  });

                  const imageData = {
                    media_type: "signature_image",
                    file_type: "png",
                    file: file,
                    fieldKeyName: "image",
                    ocrModule: true,
                  };

                  dispatch(UploadImageFile(imageData));
                }
                if (editingBooking?.code_name === "checked_in") {
                  dispatch(
                    updateBookingCheckoutDetails({
                      booking: {
                        id: editingBooking?.id,
                      },
                    })
                  )
                    .then((res) => {
                      setKeyButtonDisabled(false);
                      setStartScanLoading(false);
                      reset();
                      sessionStorage.removeItem("OcrSessionData");
                      sessionStorage.removeItem("EmailPhoneSessionData");
                      sessionStorage.removeItem("vehicleNumberSessionData");
                      setEditingBooking(null);
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
                    })
                    .catch((error) => {
                      setKeyButtonDisabled(false);
                      setStartScanLoading(false);
                    });
                } else if (editingBooking?.code_name === "confirmed") {
                  dispatch(
                    updateBookingCheckinDetails({
                      booking: {
                        id: editingBooking?.id,
                      },
                    })
                  )
                    .then((res) => {
                      setKeyButtonDisabled(false);
                      setStartScanLoading(false);
                      reset();
                      sessionStorage.removeItem("OcrSessionData");
                      sessionStorage.removeItem("EmailPhoneSessionData");
                      sessionStorage.removeItem("vehicleNumberSessionData");
                      setEditingBooking(null);
                    })
                    .catch((error) => {
                      setKeyButtonDisabled(false);
                      setStartScanLoading(false);
                    });
                } else {
                  const checkInDate =
                    data.check_in_date || dayjs().format("YYYY-MM-DD");

                  const checkInTime = data.check_in_time || "00:00";
                  const checkOutDate =
                    data.check_out_date ||
                    dayjs().add(1, "day").format("YYYY-MM-DD");

                  const checkOutTime = data.check_out_time || "00:00";

                  const basePayload = {
                    booking: {
                      check_in_date: checkInDate,
                      check_in_time: dayjs
                        .tz(
                          `${dayjs().format("YYYY-MM-DD")}T${checkInTime}`,
                          hotelSession?.time_zone || "UTC"
                        )
                        .utc()
                        .format("HH:mm"),
                      check_out_date: checkOutDate,
                      check_out_time: dayjs
                        .tz(
                          `${dayjs().format("YYYY-MM-DD")}T${checkOutTime}`,
                          hotelSession?.time_zone || "UTC"
                        )
                        .utc()
                        .format("HH:mm"),
                      type_id: bookingTypeId,
                      total_charge: Number(data.total_charge || 0),
                      total_payment: 0.0,
                      total_refund: 0.0,
                      total_extra_charge: 0.0,
                      is_authorised: false,
                      total_authorised: 0.0,
                    },
                    booking_room: [
                      {
                        rooms: [
                          {
                            room_id: data.room_number,
                          },
                        ],
                      },
                    ],
                    guest: {
                      first_name:
                        data.first_name || ocrSession?.first_name || null,
                      last_name:
                        data.last_name || ocrSession?.last_name || null,
                      email: data.email || emailPhoneSession?.email || null,
                      phone_number:
                        data.mobile || emailPhoneSession?.phone || null,
                      address_line_first:
                        data.address || ocrSession?.address_line_first || null,
                      address_line_second:
                        ocrSession?.address_line_second || null,
                      date_of_birth:
                        data.date_of_birth || ocrSession?.date_of_birth || null,
                      gender: data.gender || ocrSession?.gender || null,
                      city: data.city || ocrSession?.city || null,
                      state: data.state || ocrSession?.state || null,
                      zip_code: data.zip_code || ocrSession?.zip_code || null,
                      country: data.country || ocrSession?.country || null,
                      vehicle_no: data.vehicle_number || null,
                      vehicle_model:
                        vehicleNumberSession?.vehicle_model || null,
                      vehicle_make: vehicleNumberSession?.vehicle_make || null,
                      vehicle_color:
                        vehicleNumberSession?.vehicle_color || null,
                      signature_image:
                        kioskResponse?.response?.data?.signature_image ||
                        drawSign,
                      profile_picture:
                        kioskResponse?.response?.data?.selfie_image ||
                        captureSelfie,
                      guest_document: {
                        document_type_id:
                          getBestMatchId(ocrSession?.doc_type) ||
                          activeDocumentTypeList.find(
                            (docName) => docName.short_name == "OTHER"
                          )?.id,
                        first_name:
                          data.first_name || ocrSession?.first_name || null,
                        full_name: data.first_name
                          ? data.first_name
                          : null + data.last_name
                          ? data.last_name
                          : null ||
                            ocrSession?.first_name + ocrSession?.last_name ||
                            null,
                        doc_number:
                          data.id_number || ocrSession?.doc_number || null,
                        expiry_date:
                          data.validity || ocrSession?.doc_expire_date || null,
                        address_line_first:
                          data.address ||
                          ocrSession?.address_line_first ||
                          null,
                        address_line_second:
                          ocrSession?.address_line_second || null,
                        date_of_birth:
                          data.date_of_birth ||
                          ocrSession?.date_of_birth ||
                          null,
                        gender: data.gender || ocrSession?.gender || null,
                        city: data.city || ocrSession?.city || null,
                        state: data.state || ocrSession?.state || null,
                        zip_code: data.zip_code || ocrSession?.zip_code || null,
                        country: data.country || ocrSession?.country || null,
                        last_name:
                          data.last_name || ocrSession?.last_name || null,
                        front_image: getSessionItem("front_image_base64"),
                        back_image: getSessionItem("back_image_base64"),
                      },
                    },
                  };
                  const addPayload = removeNullValues(basePayload);

                  dispatch(addNewBookingConsole(addPayload))
                    .then((res) => {
                      setKeyButtonDisabled(false);
                      setStartScanLoading(false);
                      reset();
                      dispatch(
                        callMQTTAction({
                          cmd: "live",
                          payload: {
                            agent_user_id: userHotelSession?.id,
                          },
                          device_uuid_list: [kioskSession?.[0]?.device_id],
                        })
                      );
                      dispatch(
                        agentUserMQTTAction({
                          cmd: "check_in",
                          device_uuid_list: [kioskSession?.[0]?.device_id],
                          payload: {
                            agent_user_id: userHotelSession?.id,
                            data: res?.payload,
                          },
                        })
                      );
                      removeSessionItem("OcrSessionData");
                      removeSessionItem("EmailPhoneSessionData");
                      removeSessionItem("vehicleNumberSessionData");
                      removeSessionItem("draw_sign");
                      removeSessionItem("capture_selfie");
                      removeSessionItem("ScannedComplete");
                      removeSessionItem("front_image");
                      removeSessionItem("back_image");
                      removeSessionItem("front_image_base64");
                      removeSessionItem("back_image_base64");
                    })
                    .catch((error) => {
                      setKeyButtonDisabled(false);
                      setStartScanLoading(false);
                    });
                }
              })();
            }}
            disabled={startScanLoading}
            icon={<CheckOutlined />}
          >
            {editingBooking?.code_name === "checked_in"
              ? "Check-Out"
              : "Check-In"}
          </Button>
          

          <Button
            className="col"
            type="primary"
            danger
            onClick={handleCancelClick}
            disabled={startScanLoading}
            icon={<CloseOutlined />}
          >
            Cancel / Clear
          </Button>
        </Flex>
      </Form>
    );
  };

  const IdScanningContent = ({ setActiveTab }) => {
    const [zoomModalVisible, setZoomModalVisible] = useState(false);
    const [ocrDataLoaded, setOcrDataLoaded] = useState(false);
    const [oCRDetailsModel, setOCRDetailsModel] = useState(false);
    const [showFrontSide, setShowFrontSide] = useState(true);
    const [rotation, setRotation] = useState(0); // stores rotation in degrees

    const displayFrontImage = getSessionItem("front_image") || frontIDCard;
    const displayBackImage = getSessionItem("back_image") || backIDCard;

    const scanned = getSessionItem("ScannedComplete") ? true : false;
    const origiCard =
      getSessionItem("front_image") && getSessionItem("back_image")
        ? true
        : false;

    const zoomOption = origiCard || ocrSession?.doc_type == "passport";

    const base64ToBlob = (base64) => {
      try {
        // If it's already a fully qualified base64 data URL
        if (base64.startsWith("data:")) {
          const byteString = atob(base64.split(",")[1]);
          const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];

          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);

          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }

          return new Blob([ab], { type: mimeString });
        }
        // If it's just a raw base64 string
        else {
          const byteString = atob(base64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);

          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }

          return new Blob([ab], { type: "image/jpeg" });
        }
      } catch (error) {
        return null;
      }
    };

    useEffect(() => {
      if (kioskResponse?.cmd === "autocapture_on") {
        // Handle base_image (raw scan data)
        if (kioskResponse?.response?.data?.base_image) {
          try {
            const blob = base64ToBlob(kioskResponse.response.data.base_image);
            if (blob) {
              const imageUrl = URL.createObjectURL(blob);

              // If this is a back image scan, set it as back image
              if (kioskResponse?.response?.data?.process === "back_image") {
                setSessionItem("back_image", imageUrl);
                setSessionItem(
                  "back_image_base64",
                  kioskResponse.response.data.base_image
                );
                setShowFrontSide(true);
              } else {
                setSessionItem("front_image", imageUrl);
                setSessionItem(
                  "front_image_base64",
                  kioskResponse.response.data.base_image
                );
                setShowFrontSide(true);
              }
            }
          } catch (error) {
            // console.error("Error processing base image:", error);
          }
        }

        // Handle OCR data with front and back images
        // if (kioskResponse?.response?.data?.ocr) {
        //   const ocrData = kioskResponse.response.data.ocr;

        //   // Update OCR form data
        //   updateFormWithExternalData(ocrData);
        //   setOcrDataLoaded(true);

        //   // Set front image if present in OCR data
        //   if (ocrData.doc_front_image) {
        //     setSessionItem("front_image", ocrData.doc_front_image);
        //   }

        //   // Set back image if present in OCR data
        //   if (ocrData.doc_back_image) {
        //     setSessionItem("back_image", ocrData.doc_back_image);
        //   }
        // }

        // Auto flip to back side when process is back_image
        if (kioskResponse?.response?.data?.process === "back_image") {
          setShowFrontSide(false);
        } else if (kioskResponse?.response?.data?.process === "front_image") {
          setShowFrontSide(true);
        }
      }
    }, [kioskResponse]);

    const handleSignClick = () => {
      setStartScanLoading(true);
      dispatch(
        callMQTTAction({
          cmd: "live",
          payload: {
            agent_user_id: userHotelSession?.id,
          },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );
      setLoading((prev) => ({
        ...prev,
        draw_sign: true,
      }));
      const paramsData = {
        cmd: "draw_sign",
        device_uuid_list: [deviceId],
        payload: { agent_user_id: userHotelSession?.id },
      };

      dispatch(kioskMQTTAction(paramsData));
    };

    const handleSelfieClick = () => {
      setStartScanLoading(true);
      dispatch(
        callMQTTAction({
          cmd: "live",
          payload: {
            agent_user_id: userHotelSession?.id,
          },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );
      setLoading((prev) => ({
        ...prev,
        capture_selfie: true,
      }));
      const paramsData = {
        cmd: "capture_selfie",
        device_uuid_list: [deviceId],
        payload: { agent_user_id: userHotelSession?.id },
      };

      dispatch(kioskMQTTAction(paramsData));
    };

    const handleSelfieCapture = () => {
      setSelfieCapture(true);
      const paramsData = {
        cmd: "capture_selfie",
        device_uuid_list: [deviceId],
        payload: {
          agent_user_id: userHotelSession?.id,
          action: "capture_selfie",
        },
      };

      dispatch(kioskMQTTAction(paramsData));
    };


    const handleStartScan = async () => {
      if (!deviceStatuses.id_scanner) {
        notification(
          "ID Scanner service is not running. Please start the service to continue.",
          "warn",
          4000,
          "topRight"
        );

        return;
      }
      dispatch(
        callMQTTAction({
          cmd: "live",
          payload: {
            agent_user_id: userHotelSession?.id,
          },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );
      setStartScanLoading(true);
      setLoading((prev) => ({
        ...prev,
        scan_id: true,
      }));
      setOcrDataLoaded(false);
      try {
        const paramsData = {
          cmd: "scan_id",
          device_uuid_list: [deviceId],
          payload: { agent_user_id: userHotelSession?.id },
        };

        dispatch(kioskMQTTAction(paramsData));
      } catch (error) {
        // console.error("Error starting scan:", error);
      }
    };

    const handleSaveClick = () => {
      setActiveTab("booking");
    };

    const handleCancelClick = () => {
      if (loading?.scan_id) {
        dispatch(
          callMQTTAction({
            cmd: "full",
            payload: {
              agent_user_id: userHotelSession?.id,
            },
            device_uuid_list: [kioskSession?.[0]?.device_id],
          })
        );
        removeSessionItem("ScannedComplete");
        removeSessionItem("back_image");
        removeSessionItem("front_image");
        removeSessionItem("front_image_base64");
        removeSessionItem("back_image_base64");
        removeSessionItem("ScannedComplete");

        setStartScanLoading(false);
        setLoading((prev) => ({
          ...prev,
          ask_email_mob: false,
          ask_vehicle_no: false,
          scan_id: false,
          draw_sign: false,
          issue_key: false,
          capture_selfie: false,
        }));
        const paramsData = {
          cmd: "move_home",
          device_uuid_list: [deviceId],
          payload: { agent_user_id: userHotelSession?.id },
        };

        dispatch(kioskMQTTAction(paramsData));
      } else {
        setActiveTab("booking");
      }
    };

    const getScanStatusColor = () => {
      const process = kioskResponse?.response?.data?.process;
      const ocr = kioskResponse?.response?.data?.ocr;
      const status = kioskResponse?.responsestatus?.status;

      const hasOcrData = ocr?.first_name && ocr?.last_name;

      if (kioskResponse?.cmd === "autocapture_on") {
        if (process === "flip" || process === "back_image") {
          return "orange"; // Awaiting back side
        }

        if (process === "capture") {
          return "processing"; // Capturing image
        }

        if (isIdScannerLoading) {
          return "processing"; // Still scanning
        }

        if (status === false) {
          return "error"; // Some failure
        }

        if (ocrDataLoaded || hasOcrData) {
          return "success"; // OCR success
        }

        return "blue"; // In progress
      }

      if (scanned) {
        return "success"; // Already scanned
      }

      return "default"; // Initial / idle state
    };

    const updateParentForm = (updatedData) => {
      // Update form fields
      if (updatedData.first_name || updatedData.last_name) {
        const fullName = `${updatedData.first_name || ""} ${
          updatedData.last_name || ""
        }`.trim();
        setValue("name", fullName);
      }

      setValue("first_name", updatedData.first_name);
      setValue("last_name", updatedData.last_name);
      setValue("id_number", updatedData.id_number);
      setValue("validity", updatedData.validity);
      setValue("address", updatedData.address);
      setValue("city", updatedData.city);
      setValue("state", updatedData.state);
      setValue("zip_code", updatedData.zip_code);
      setValue("country", updatedData.country);

      // Also update OCR session data in storage for consistency
      const updatedOcrData = {
        first_name: updatedData.first_name,
        last_name: updatedData.last_name,
        doc_number: updatedData.id_number,
        gender: updatedData.dender,
        date_of_birth: updatedData.date_of_birth,
        address_line_first: updatedData.address,
        city: updatedData.city,
        state: updatedData.state,
        zip_code: updatedData.zip_code,
        country: updatedData.country,
      };

      sessionStorage.setItem("OcrSessionData", JSON.stringify(updatedOcrData));
    };

    const getScanStatusMessage = () => {
      // Case: Document was already scanned
      if (!kioskResponse?.cmd || kioskResponse.cmd !== "autocapture_on") {
        return scanned
          ? "Document scanned successfully."
          : "Ready to scan an ID document.";
      }

      const process = kioskResponse?.response?.data?.process;
      const status = kioskResponse?.responsestatus?.status;
      const statusMessage = kioskResponse?.responsestatus?.message;
      const ocr = kioskResponse?.response?.data?.ocr;
      const hasOcrName = ocr?.first_name && ocr?.last_name;
      const isFlipping = process === "flip" || process === "back_image";
      const isCapturing = process === "capture";

      // 1. Prompt to flip document
      if (isFlipping) {
        return "Please scan the reverse side of the document.";
      }

      // 2. Capturing document
      if (isCapturing) {
        return kioskResponse?.response?.message || "Capturing document...";
      }

      // 3. Processing
      if (isIdScannerLoading) {
        return "Processing the document. Please wait...";
      }

      // 4. Error message
      if (status === false) {
        return statusMessage || "An error occurred during scanning.";
      }

      // 5. OCR data loaded externally
      if (ocrDataLoaded) {
        return "Document data successfully retrieved.";
      }

      // 6. OCR names are present
      if (hasOcrName) {
        return "Document scanned successfully.";
      }

      // 7. Default while scanning
      return "Scanning in progress...";
    };

    const handleViewStateChange = ({
      showFrontSide: newShowFrontSide,
      rotation: newRotation,
    }) => {
      setShowFrontSide(newShowFrontSide);
      setRotation(newRotation);
    };

    const handleGetOCR = () => {
      setOCRDetailsModel(true);
      const payload = {
        doc_images:
          getSessionItem("front_image_base64") ||
          getSessionItem("back_image_base64"),
      };
      dispatch(base64ToOCRData(payload));
    };

    return isAnyMqttCommandLoading ? (
      <Loader isLoading={goTOhotelLoading} />
    ) : (
      <div className="id-scanning-container">
        <div className="id-display-area bg-dark border-2 border-primary rounded d-flex flex-column align-items-center justify-content-center mb-3 position-relative">
          <div
            className="id-card-container position-relative my-4"
            style={{
              height: "320px",
              width: "95%",
              maxWidth: "450px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
              borderRadius: "8px",
              overflow: "hidden",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            {/* Scanning overlay effect */}
            <div className="position-absolute w-100" />

            {/* Front side image */}
            <img
              src={displayFrontImage}
              alt="ID Card Front"
              className="rounded position-absolute w-100 h-100"
              style={{
                objectFit: "contain",
                objectPosition: "center",
                opacity: showFrontSide ? 1 : 0,
                transition:
                  "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
                transform: `${
                  showFrontSide ? "scale(0.98)" : "scale(0.88) rotateY(180deg)"
                } rotate(${rotation}deg)`,
                padding: "12px",
              }}
            />

            {/* Back side image */}
            <img
              src={displayBackImage}
              alt="ID Card Back"
              className="rounded position-absolute w-100 h-100"
              style={{
                objectFit: "contain",
                objectPosition: "center",
                opacity: showFrontSide ? 0 : 1,
                transition:
                  "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
                transform: `${
                  showFrontSide ? "scale(0.98)" : "scale(0.88) rotateY(180deg)"
                } rotate(${rotation}deg)`,
                padding: "12px",
              }}
            />
          </div>
        </div>
        <Form layout="vertical" className="info-form">
          <div
            style={{
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <Tag icon={<IdcardOutlined />} color={getScanStatusColor()}>
              {getScanStatusMessage()}
            </Tag>
            <Tag
              icon={<SyncOutlined />}
              color="lime"
              onClick={() => {
                setRotation((prevRotation) => (prevRotation + 180) % 360);
              }}
              style={{ cursor: "pointer" }}
            >
              Rotate
            </Tag>

            {getSessionItem("front_image") && (
              <Tag
                icon={<ZoomInOutlined />}
                color="green"
                onClick={() => setZoomModalVisible(true)} // This opens the modal
                style={{ cursor: "pointer" }}
              >
                Zoom
              </Tag>
            )}

            {(getSessionItem("front_image_base64") ||
              getSessionItem("back_image_base64")) && (
              <Popconfirm
                title="Are you sure you want to get OCR data?"
                onConfirm={handleGetOCR}
                okText="Yes"
                cancelText="No"
              >
                <Tag
                  icon={<EyeOutlined />}
                  color="blue"
                  style={{ cursor: "pointer" }}
                >
                  Get OCR
                </Tag>
              </Popconfirm>
            )}

            {oCRDetailsModel && (
              <OCRDetailsModal
                oCRDetailsModel={oCRDetailsModel}
                setOCRDetailsModel={setOCRDetailsModel}
                updateParentForm={updateParentForm}
              />
            )}

            <OCRZoomModal
              visible={zoomModalVisible}
              setVisible={setZoomModalVisible}
              updateParentForm={updateParentForm}
              onViewStateChange={handleViewStateChange} // NEW: Add this prop
              initialShowFrontSide={showFrontSide} // NEW: Add this prop
              initialRotation={rotation} // NEW: Add this prop
            />
            {origiCard && (
              <Tag
                icon={<SyncOutlined />}
                color="#3b5999"
                onClick={() => setShowFrontSide(!showFrontSide)}
                style={{ cursor: "pointer" }}
              >
                {showFrontSide ? "View Front Side" : "View Back Side"}
              </Tag>
            )}
          </div>
          {/* Personal Information Section */}
          <Card
            title="Personal Information"
            size="small"
            className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item className="form-input-row m-0">
                  <Controller
                    name="first_name"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          placeholder=""
                          className="form-input"
                        />
                        <label>First Name</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item className="form-input-row m-0">
                  <Controller
                    name="last_name"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          placeholder=""
                          className="form-input"
                        />
                        <label>Last Name</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Identification Section */}
          <Card
            title="Identification Details"
            size="small"
            className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item className="form-input-row m-0">
                  <Controller
                    name="id_number"
                    control={control}
                    defaultValue={bookingData.id_number || null}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          placeholder=""
                          className="form-input"
                        />
                        <label>ID Number</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item className="form-input-row m-0">
                  <Controller
                    name="validity"
                    control={control}
                    defaultValue={bookingData.validity || null}
                    render={({ field }) => (
                      <div>
                        <DatePicker
                          placeholder=""
                          className="w-100"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => {
                            field.onChange(
                              date ? date.format("YYYY-MM-DD") : null
                            );
                          }}
                        />
                        <label>ID Validity Date</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Address Information Section */}
          <Card
            title="Address Information"
            size="small"
            className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4"
          >
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item className="form-input-row">
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          placeholder=""
                          className="form-input"
                        />
                        <label>Address</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item className="form-input-row">
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          placeholder=""
                          className="form-input"
                        />
                        <label>City</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item className="form-input-row">
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          placeholder=""
                          className="form-input"
                        />
                        <label>State/Province</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item className="form-input-row m-0">
                  <Controller
                    name="zip_code"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          placeholder=""
                          className="form-input"
                        />
                        <label>Zip/Postal Code</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item className="form-input-row m-0">
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          placeholder=""
                          className="form-input"
                        />
                        <label>Country</label>
                      </div>
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Flex align="center" wrap gap={8}>
            <Button
              block
              color="primary"
              variant="solid"
              className="col"
              onClick={handleStartScan}
              loading={loading?.scan_id}
              disabled={startScanLoading}
            >
              {loading?.scan_id ? "Scanning..." : "Start Scan"}
            </Button>
            <Button
              block
              color="green"
              variant="solid"
              className="col"
              onClick={handleSaveClick}
              disabled={startScanLoading}
            >
              Save
            </Button>
            <Button.Group className="col">
              <Button
                color="gold"
                variant="solid"
                loading={loading?.draw_sign || commandLoadingStates.draw_sign}
                onClick={handleSignClick}
                disabled={startScanLoading}
                icon={<EditOutlined />}
              >
                Sign
              </Button>
              <Tooltip title="View Sign Preview">
                <Button
                  color="gold"
                  variant="solid"
                  className="border-start"
                  icon={<EyeOutlined />}
                  disabled={
                    loading?.capture_selfie ||
                    commandLoadingStates.capture_selfie ||
                    loading?.draw_sign ||
                    commandLoadingStates.draw_sign
                  }
                  onClick={() => {
                    setCurrentModel("Sign");
                    setSelfieVisible(true);
                  }}
                />
              </Tooltip>
            </Button.Group>
            <Button.Group className="col">
              <Button
                color="blue"
                variant="solid"
                className="col"
                loading={
                  loading?.capture_selfie || commandLoadingStates.capture_selfie
                }
                onClick={handleSelfieClick}
                disabled={startScanLoading}
                icon={<CameraOutlined />}
              >
                Selfie
              </Button>
              <Tooltip title="View Selfie Preview">
                <Button
                  color="blue"
                  variant="solid"
                  className="border-start"
                  icon={<EyeOutlined />}
                  disabled={
                    loading?.capture_selfie ||
                    commandLoadingStates.capture_selfie ||
                    loading?.draw_sign ||
                    commandLoadingStates.draw_sign
                  }
                  onClick={() => {
                    setCurrentModel("selfie");
                    setSelfieVisible(true);
                  }}
                />
              </Tooltip>
            </Button.Group>
            {loading?.capture_selfie && (
              <>
                <Button
                  color="blue"
                  variant="solid"
                  className="col"
                  loading={selfieCapture}
                  onClick={handleSelfieCapture}
                  icon={<CameraOutlined />}
                >
                  Selfie Capture
                </Button>
              </>
            )}

            <Button
              block
              type="primary"
              className="col"
              danger
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
          </Flex>
        </Form>
      </div>
    );
  };

  const KeyDispenserContent = () => {
    return (
      <Card className="mb-2 p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4">
        <div className="key-dispenser-container">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <Typography.Title
              level={5}
              className="m-0 d-flex align-items-center"
            >
              <ToolOutlined className="me-2" />
              Key Dispenser Control
            </Typography.Title>
            <Badge
              status={deviceStatuses.key_dispenser ? "success" : "error"}
              text={deviceStatuses.key_dispenser ? "Connected" : "Disconnected"}
            />
          </div>

          {/* Action Buttons */}
          <div className="mb-3">
            <Typography.Text strong className="d-block mb-2">
              Movement Controls
            </Typography.Text>
            <Space wrap className="w-100">
              <Button
                color="green"
                variant="solid"
                loading={isKeyDLoading || keyDispenserLoading}
                disabled={
                  startScanLoading ||
                  keyDispenserLoading ||
                  keyPositionData?.card_position === "READER"
                }
                onClick={() => moveReader()}
                icon={<ArrowRightOutlined />}
              >
                Move Reader
              </Button>
              <Button
                color="green"
                variant="solid"
                loading={isKeyDLoading || keyDispenserLoading}
                disabled={
                  startScanLoading ||
                  keyDispenserLoading ||
                  keyPositionData?.card_position === "FRONT"
                }
                onClick={() => moveFront()}
                icon={<ArrowLeftOutlined />}
              >
                Move Front
              </Button>
              <Button
                color="green"
                variant="solid"
                loading={isKeyDLoading || keyDispenserLoading}
                disabled={
                  startScanLoading ||
                  keyDispenserLoading ||
                  (keyPositionData?.card_position &&
                    !["READER", "EMPTY"].includes(
                      keyPositionData.card_position
                    ))
                }
                onClick={() => moveCapture()}
                icon={<ArrowDownOutlined />}
              >
                Move Capture
              </Button>
            </Space>
          </div>

          {/* Key Operations */}
          <div className="mb-3">
            <Typography.Text strong className="d-block mb-2">
              Key Operations
            </Typography.Text>
            <Space wrap className="w-100">
              <Button
                color="orange"
                variant="solid"
                loading={isKeyDLoading || keyDispenserLoading}
                disabled={startScanLoading || keyDispenserLoading}
                onClick={() => acceptKeyDispenser()}
                icon={<CheckOutlined />}
              >
                Accept Key
              </Button>
              <Button
                color="primary"
                variant="solid"
                disabled={
                  isKeyDLoading || startScanLoading || keyDispenserLoading
                }
                loading={keyDispenserLoading}
                onClick={() => statusKeyDispenser()}
                icon={<SyncOutlined />}
              >
                Get Status
              </Button>
            </Space>
          </div>

          {/* Device Status Information */}
          <div className="device-status-section">
            <Typography.Text strong className="d-block mb-2">
              Device Status
            </Typography.Text>
            <Row gutter={[16, 12]}>
              <Col span={24}>
                <Card size="small" className="status-card">
                  <Row gutter={[16, 8]}>
                    <Col span={8}>
                      <div className="d-flex align-items-center">
                        <Badge
                          status={
                            keyPositionData?.card_position === "READER"
                              ? "success"
                              : keyPositionData?.card_position === "FRONT"
                              ? "warning"
                              : keyPositionData?.card_position === "CAPTURE"
                              ? "processing"
                              : "default"
                          }
                          className="me-2"
                        />
                        <div>
                          <Typography.Text
                            type="secondary"
                            className="d-block"
                            style={{ fontSize: "12px" }}
                          >
                            Key Position
                          </Typography.Text>
                          <Typography.Text strong>
                            {keyPositionData?.card_position || "?"}
                          </Typography.Text>
                        </div>
                      </div>
                    </Col>

                    <Col span={8}>
                      <div className="d-flex align-items-center">
                        {keyPositionData?.card_box === "EMPTY" ? (
                          <div
                            className={`custom-badge-dot me-2 ${
                              keyPositionData?.card_box === "EMPTY"
                                ? "pulse-red"
                                : ""
                            }`}
                          ></div>
                        ) : (
                          <Badge
                            status={
                              keyPositionData?.card_box === "EMPTY"
                                ? "error"
                                : keyPositionData?.card_box === "PRE-EMPTY"
                                ? "warning"
                                : keyPositionData?.card_box
                                ? "success"
                                : "default"
                            }
                            className="me-2"
                          />
                        )}
                        <div>
                          <Typography.Text
                            type="secondary"
                            className="d-block"
                            style={{ fontSize: "12px" }}
                          >
                            Card Box
                          </Typography.Text>
                          <Typography.Text strong>
                            {keyPositionData?.card_box || "?"}
                          </Typography.Text>
                        </div>
                      </div>
                    </Col>

                    <Col span={8}>
                      <div className="d-flex align-items-center">
                        <Badge
                          status={
                            keyPositionData?.capture_box ? "success" : "default"
                          }
                          className="me-2"
                        />
                        <div>
                          <Typography.Text
                            type="secondary"
                            className="d-block"
                            style={{ fontSize: "12px" }}
                          >
                            Capture Box
                          </Typography.Text>
                          <Typography.Text strong>
                            {keyPositionData?.capture_box || "?"}
                          </Typography.Text>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Additional Status Information */}
          {(isKeyDLoading || keyDispenserLoading) && (
            <div className="mt-3">
              <Alert
                message="Processing Command"
                description="Please wait while the key dispenser processes your request..."
                type="info"
                showIcon
              />
            </div>
          )}

          {/* Error States */}
          {keyPositionData?.card_box === "EMPTY" && (
            <div className="mt-3">
              <Alert
                message="Card Box Empty"
                description="The card box is empty. Please refill the card box before issuing keys."
                type="warning"
                showIcon
              />
            </div>
          )}

          {!deviceStatuses.key_dispenser && (
            <div className="mt-3">
              <Alert
                message="Device Disconnected"
                description="Key dispenser is not connected. Please check the connection and restart the service."
                type="error"
                showIcon
                action={
                  <Button
                    size="small"
                    onClick={() => handleRestartDevice("key_dispenser")}
                    loading={isKeyDLoading}
                  >
                    Restart
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </Card>
    );
  };

  const CashMachineContent = () => {
    const transformToDenominationObject = (denomArray) => {
      if (!denomArray || !Array.isArray(denomArray)) {
        return {};
      }

      const result = {};

      denomArray.forEach((item) => {
        // Convert denomination to string for object key
        const denomKey = String(item.denomination);
        result[denomKey] = {
          count: item.count,
          total: item.total,
        };
      });

      return result;
    };

    const newDenomination =
      kioskResponse?.payload?.command_data?.after_denomination;

    // Replace your existing Table component with this one
    // Calculate the denomination map once before rendering
    const denominationMap = transformToDenominationObject(
      getcashTransactionDetailsData?.before_denomination ||
        newDenomination ||
        []
    );

    const handleGetStatusClick = () => {
      statusCashRecycler();
    };

    const handleCollectCashClick = () => {
      setCashModalType("collection");
      setCashModalVisible(true);
    };

    const handleEmptyCashbox = () => {
      setEmptyCashBoxModalVisible(true);
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount || 0);
    };
    return isAnyMqttCommandLoading ? (
      <Loader isLoading={goTOhotelLoading} />
    ) : (
      <Card className="mb-2  p-6 rounded-2xl shadow-xl border border-gray-200 max-w-md mx-auto space-y-4">
        <div className="cash-machine-container">
          <div className="d-flex align-items-center justify-content-between mb-2 gap-2">
            <Typography.Title level={5} className="m-0">
              Cash In Payout Box
            </Typography.Title>
            <Typography.Title level={5} className="m-0">
              Total Balance:{" "}
              {formatCurrency(
                getcashTransactionDetailsData?.before_denomination_balance ||
                  kioskResponse?.payload?.command_data
                    ?.after_denomination_balance
              )}
            </Typography.Title>
          </div>

          {/* Bills Table */}
          <div className="mb-2">
            <Table
              columns={billColumns}
              scroll={{
                x: 300,
              }}
              dataSource={[
                {
                  key: "1",
                  category: "Qty",
                  1: denominationMap["1"]?.count || 0,
                  2: denominationMap["2"]?.count || 0,
                  5: denominationMap["5"]?.count || 0,
                  10: denominationMap["10"]?.count || 0,
                  20: denominationMap["20"]?.count || 0,
                  50: denominationMap["50"]?.count || 0,
                  100: denominationMap["100"]?.count || 0,
                },
                {
                  key: "2",
                  category: "AMOUNT",
                  1: denominationMap["1"]?.total || 0,
                  2: denominationMap["2"]?.total || 0,
                  5: denominationMap["5"]?.total || 0,
                  10: denominationMap["10"]?.total || 0,
                  20: denominationMap["20"]?.total || 0,
                  50: denominationMap["50"]?.total || 0,
                  100: denominationMap["100"]?.total || 0,
                },
              ]}
              pagination={false}
              size="middle"
              bordered
              className="bills-table"
            />
          </div>

          {/* Action Buttons */}
          <Flex align="center" wrap gap={8} className="mb-4">
            <Button
              block
              color="primary"
              variant="solid"
              className="col"
              onClick={handleGetStatusClick}
              loading={cashRecyclerConsoleMQTTLoading}
            >
              Get Status
            </Button>
            <Button
              block
              color="green"
              variant="solid"
              className="col"
              onClick={handleCollectCashClick}
            >
              Collect/Refund Cash
            </Button>
            <Button
              block
              color="danger"
              variant="solid"
              className="col"
              loading={cashRecyclerConsoleMQTTLoading}
              onClick={handleEmptyCashbox}
            >
              Empty Cashbox
            </Button>
          </Flex>

          <Button
            block
            color="orange"
            variant="solid"
            className="col"
            onClick={() => setLastTransactionsModalVisible(true)}
          >
            Show Last Transaction
          </Button>
        </div>
      </Card>
    );
  };

  const isVideoCall =
    // kioskResponse?.cmd === "kiosk_agent" && // need to check this
    // kioskResponse?.response?.status &&
    selectedLabel === "Video Call" && onlineKiosk === "true";

  const contentList = {
    booking: <BookingContent setActiveTab={setActiveTab} />,
    idScanning: <IdScanningContent setActiveTab={setActiveTab} />,
    cash_recycler: <CashMachineContent setActiveTab={setActiveTab} />,
    key_dispenser: <KeyDispenserContent />,
    terminal: (
      <TerminalPanel
        deviceId={deviceId}
        userSession={userSession}
        kioskMQTTAction={kioskMQTTAction}
        dispatch={dispatch}
        loading={loading}
      />
    ),
  };

  const isAnyMqttCommandLoading = Object.values(mqttCommandLoading).some(
    (loading) => loading
  );

  const tabList = [
    {
      key: "booking",
      tab: <span>Booking</span>,
      disabled: !isVideoCall || isAnyMqttCommandLoading,
    },
    {
      key: "idScanning",
      tab: <span>ID</span>,
      disabled: !isVideoCall || isAnyMqttCommandLoading,
    },
    kioskSession?.[0]?.cash_recycler_config?.is_active && {
      key: "cash_recycler",
      tab: <span>Cash</span>,
      disabled: !isVideoCall || startScanLoading || isAnyMqttCommandLoading,
    },
    kioskSession?.[0]?.key_dispenser_config?.is_active && {
      key: "key_dispenser",
      tab: <span>Key</span>,
      disabled: !isVideoCall || startScanLoading || isAnyMqttCommandLoading,
    },
    {
      key: "terminal",
      tab: <span>CC</span>,
      disabled: !isVideoCall || startScanLoading || isAnyMqttCommandLoading,
    },
  ].filter(Boolean);

  const isTabDisabled = tabList.find((tab) => tab.key === activeTab)?.disabled;

  const [dismissedConnectionModal, setDismissedConnectionModal] =
    useState(false);

  useEffect(() => {
    setDismissedConnectionModal(false);
  }, [mqttState]);

  return goTOhotelLoading ? (
    <Loader isLoading={goTOhotelLoading} />
  ) : (
    <>
      <Layout className={`main-layout`}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed && !isHovered}
          className={classNames(
            "leftSider border-end",
            { "collapsed-hover": collapsed && isHovered },
            { "sidebar-absolute": !collapsed && windowWidth < 1200 }
          )}
          // breakpoint="lg"
          // onBreakpoint={(broken) => {
          //   if (broken && !collapsed) {
          //     setCollapsed(true);
          //     sessionStorage.setItem("sidebarCollapsed", "true");
          //   }
          // }}
          width={200}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: collapsed && "fixed",
          }}
        >
          <div className="demo-logo-vertical position-relative p-3 ps-3 pe-2">
            {collapsed && !isHovered ? (
              isDarkMode ? (
                <img
                  src={darkSmallLogo}
                  alt="small-logo"
                  className="small-logo"
                />
              ) : (
                <img src={smallLogo} alt="small-logo" className="small-logo" />
              )
            ) : isDarkMode ? (
              <img src={darkLogo} alt="small-logo" />
            ) : (
              <img src={Logo} alt="logo" />
            )}
            {windowWidth >= 1200 && (
              <Tooltip
                placement="right"
                title={collapsed ? "Pin Sidebar" : "Unpin Sidebar"}
              >
                <Button
                  className="toggle-sidebar-btn lh-1"
                  size="small"
                  icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
                  onClick={toggleCollapse}
                />
              </Tooltip>
            )}
          </div>

          <Menu
            onClick={() => setSettingsModalVisible(true)}
            mode="inline"
            defaultSelectedKeys={"1"}
            items={[
              {
                key: "1",
                icon: (
                  <div>
                    {collapsed && !isHovered && (
                      <span
                        className={`status-dot-sm ${
                          deviceStatuses.kiosk ? "bg-success" : "bg-danger"
                        }`}
                      ></span>
                    )}
                    <MobileOutlined />
                  </div>
                ),
                label: (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Kiosk Status</span>
                    <span
                      className={`status-dot ${
                        deviceStatuses.kiosk ? "bg-success" : "bg-danger"
                      }`}
                    />
                  </div>
                ),
              },
              kioskSession?.[0]?.service_status_config?.is_active && {
                key: "2",
                icon: (
                  <div>
                    {collapsed && !isHovered && (
                      <span
                        className={`status-dot-sm ${
                          deviceStatuses.service_status
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      ></span>
                    )}
                    <CreditCardOutlined />
                  </div>
                ),
                label: (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Service Status</span>
                    <span
                      className={`status-dot ${
                        deviceStatuses.service_status
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    />
                  </div>
                ),
              },
              kioskSession?.[0]?.id_scanner_config?.is_active && {
                key: "3",
                icon: (
                  <div>
                    {collapsed && !isHovered && (
                      <span
                        className={`status-dot-sm ${
                          deviceIdScannerLoading
                            ? "bg-warning"
                            : deviceStatuses.id_scanner
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      ></span>
                    )}
                    <IdcardOutlined />
                  </div>
                ),
                label: (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>ID Scanner</span>
                    <span
                      className={`status-dot ${
                        deviceIdScannerLoading
                          ? "bg-warning"
                          : deviceStatuses.id_scanner
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    />
                  </div>
                ),
              },
              kioskSession?.[0]?.key_encoder_config?.is_active && {
                key: "4",
                icon: (
                  <div>
                    {collapsed && !isHovered && (
                      <span
                        className={`status-dot-sm ${
                          deviceStatuses.key_encoder
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      ></span>
                    )}
                    <CreditCardOutlined />
                  </div>
                ),
                label: (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Key Encoder</span>
                    <span
                      className={`status-dot ${
                        deviceStatuses.key_encoder ? "bg-success" : "bg-danger"
                      }`}
                    />
                  </div>
                ),
              },
              kioskSession?.[0]?.key_dispenser_config?.is_active && {
                key: "5",
                icon: (
                  <div>
                    {collapsed && !isHovered && (
                      <span
                        className={`status-dot-sm ${
                          deviceStatuses.key_dispenser
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      ></span>
                    )}
                    <CreditCardOutlined />
                  </div>
                ),
                label: (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Key Dispenser</span>
                    <span
                      className={`status-dot ${
                        deviceStatuses.key_dispenser
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    />
                  </div>
                ),
              },
              kioskSession?.[0]?.cash_recycler_config?.is_active && {
                key: "6",
                icon: (
                  <div>
                    {collapsed && !isHovered && (
                      <span
                        className={`status-dot-sm ${
                          deviceStatuses.cash_recycler
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      ></span>
                    )}
                    <DollarOutlined />
                  </div>
                ),
                label: (
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Cash Machine</span>
                    <span
                      className={`status-dot ${
                        deviceStatuses.cash_recycler
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    />
                  </div>
                ),
              },
              // {
              //   key: "6",
              //   icon: (
              //     <div>
              //       {collapsed && !isHovered && (
              //         <span
              //           className={`status-dot-sm ${
              //             deviceStatuses.printer ? "bg-success" : "bg-danger"
              //           }`}
              //         ></span>
              //       )}
              //       <PrinterOutlined />
              //     </div>
              //   ),
              //   label: (
              //     <div className="d-flex align-items-center justify-content-between">
              //       <span>Printer</span>
              //       <span
              //         className={`status-dot ${
              //           deviceStatuses.printer ? "bg-success" : "bg-danger"
              //         }`}
              //       />
              //     </div>
              //   ),
              // },
            ]}
            inlineIndent={16}
          />

          {/* Logout button */}
          <div className="sidebar-logout-container p-3">
            <Popconfirm
              title="Are you sure you want to logout without closing the LAN connection?"
              onConfirm={logOutUse}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                danger
                icon={<LogoutOutlined />}
                block
                loading={logoutLoading}
                className="sidebar-logout-button"
              >
                {(!collapsed || isHovered) && "Logout"}
              </Button>
            </Popconfirm>
          </div>
        </Sider>
        <Layout
          style={{
            // marginLeft: windowWidth >= 1200 && !collapsed ? "200px" : "80px",
            paddingLeft: collapsed && "80px",
            transition: "margin-left 0.3s",
          }}
          className="main-content-warpper"
        >
          <Header className="d-flex align-items-center justify-content-between p-0 border-bottom ps-3">
            <span
              className="text-truncate flex-shrink-1 cursor"
              onClick={() => setActivationModalVisible(true)}
            >
              {hotelSession?.hotel_name} - {hotelSession?.city}
            </span>
            <div className="d-flex align-items-center text-capitalize gap-2 me-3 ms-auto">
              <h6
                onClick={() => {
                  setOpenDrawer(true);
                }}
                className="fw-semibold text-primary cursor m-0"
              >
                Hotel
              </h6>
              <Dropdown
                menu={{ items, onClick: handleDropdownMenuClick }}
                disabled={isAnyMqttCommandLoading}
              >
                <Button color="primary" variant="outlined">
                  <Space>
                    {selectedLabel}
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
              <Button
                color="primary"
                variant="solid"
                onClick={() => setBookingModalVisible(true)}
              >
                Booking
              </Button>
              <Button
                color="primary"
                variant="filled"
                type="primary"
                loading={snapshotLoading || commandLoadingStates.screen_capture}
                onClick={handleSnapshotCapture}
              >
                Snapshot
              </Button>
              <Button
                color="primary"
                variant="solid"
                className="col"
                onClick={async () => {
                  try {
                    // Get current form values
                    const formValues = getValues();

                    // Create flat form data object with all keys at root level
                    const formData = {
                      // Guest Information
                      full_name: formValues.name || null,
                      first_name:
                        formValues.first_name || ocrSession?.first_name || null,
                      last_name:
                        formValues.last_name || ocrSession?.last_name || null,
                      date_of_birth:
                        formValues.date_of_birth ||
                        ocrSession?.date_of_birth ||
                        null,
                      gender: formValues.gender || ocrSession?.gender || null,
                      email:
                        formValues.email || emailPhoneSession?.email || null,
                      phone:
                        formValues.mobile || emailPhoneSession?.phone || null,

                      // Address Information
                      address:
                        formValues.address ||
                        ocrSession?.address_line_first ||
                        null,
                      city: formValues.city || ocrSession?.city || null,
                      state: formValues.state || ocrSession?.state || null,
                      zip_code:
                        formValues.zip_code || ocrSession?.zip_code || null,
                      country:
                        formValues.country ||
                        ocrSession?.country ||
                        "United States",

                      // Document Information
                      id_number:
                        formValues.id_number || ocrSession?.doc_number || null,
                      document_type: ocrSession?.doc_type || "OTHER",
                      expiry_date:
                        formValues.validity ||
                        ocrSession?.doc_expire_date ||
                        null,

                      // Booking Details
                      check_in_date: formValues.check_in_date || checkInDate,
                      check_in_time: formValues.check_in_time || checkInTime,
                      check_out_date: formValues.check_out_date || checkOutDate,
                      check_out_time: formValues.check_out_time || checkOutTime,
                      room_number: formValues.room_number
                        ? activeHotelRoomList?.find(
                            (room) => room.id === formValues.room_number
                          )?.room_number || formValues.room_number
                        : null,
                      total_charge: formValues.total_charge
                        ? Number(formValues.total_charge)
                        : 0,
                      deposit: formValues.deposit
                        ? Number(formValues.deposit)
                        : 0,

                      // Vehicle Information
                      vehicle_number:
                        formValues.vehicle_number ||
                        vehicleNumberSession?.vehicle_number ||
                        null,
                      vehicle_make: vehicleNumberSession?.vehicle_make || null,
                      vehicle_model:
                        vehicleNumberSession?.vehicle_model || null,
                      vehicle_color:
                        vehicleNumberSession?.vehicle_color || null,

                      // Hotel Information
                      hotel_name: hotelSession?.hotel_name || null,
                      hotel_city: hotelSession?.city || null,
                      time_zone: hotelSession?.time_zone || null,

                      timestamp: new Date().toISOString(),
                    };

                    // Convert to JSON string with proper formatting
                    const jsonString = JSON.stringify(formData, null, 2);

                    // Copy to clipboard
                    await navigator.clipboard.writeText(jsonString);

                    // Show success notification
                    notification(
                      "Form data copied to clipboard successfully!",
                      "success",
                      3000
                    );
                  } catch (error) {
                    try {
                      const formValues = getValues();
                      const fallbackData = {
                        full_name: formValues.name,
                        email: formValues.email,
                        phone: formValues.mobile,
                        check_in_date: formValues.check_in_date,
                        check_out_date: formValues.check_out_date,
                        room_number: formValues.room_number,
                        total_charge: formValues.total_charge,
                        city: formValues.city,
                        state: formValues.state,
                        zip_code: formValues.zip_code,
                      };

                      const textArea = document.createElement("textarea");
                      textArea.value = JSON.stringify(fallbackData, null, 2);
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand("copy");
                      document.body.removeChild(textArea);

                      notification(
                        "Form data copied to clipboard (fallback method)!",
                        "success",
                        3000
                      );
                    } catch (fallbackError) {
                      notification(
                        "Failed to copy to clipboard. Please try again.",
                        "error",
                        3000
                      );
                    }
                  }
                }}
              >
                Write To PMS
              </Button>

              {!fullScreenMode ? (
                <Tooltip placement="bottom" title="Full Screen Mode">
                  <Button
                    color="primary"
                    variant="outlined"
                    shape="circle"
                    loading={commandLoadingStates.screen_mode}
                    icon={
                      <div style={{ display: "flex", gap: "8px" }}>
                        <FullscreenOutlined
                          style={{ fontSize: "16px" }}
                          onClick={() => {
                            setFullScreenMode(true);
                            const paramsData = {
                              cmd: "screen_mode",
                              device_uuid_list: [deviceId],
                              payload: {
                                agent_user_id: userHotelSession?.id,
                                status_mode: "full_screen",
                              },
                            };

                            dispatch(kioskMQTTAction(paramsData));
                          }}
                        />
                      </div>
                    }
                  />
                </Tooltip>
              ) : (
                <Tooltip placement="bottom" title="Normal Screen Mode">
                  <Button
                    color="primary"
                    variant="solid"
                    shape="circle"
                    loading={commandLoadingStates.screen_mode}
                    icon={
                      <div style={{ display: "flex", gap: "8px" }}>
                        <FullscreenExitOutlined
                          style={{ fontSize: "16px" }}
                          onClick={() => {
                            setFullScreenMode(false);
                            const paramsData = {
                              cmd: "screen_mode",
                              device_uuid_list: [deviceId],
                              payload: {
                                agent_user_id: userHotelSession?.id,
                                status_mode: "normal_screen",
                              },
                            };
                            dispatch(kioskMQTTAction(paramsData));
                          }}
                        />
                      </div>
                    }
                  />
                </Tooltip>
              )}

              {/* <Button
                color="gold"
                variant="outlined"
                shape="circle"
                icon={
                  <BellOutlined
                    onClick={() => {
                      setNotificationModalVisible(true);
                    }}
                  />
                }
              ></Button> */}
              <Button
                color="primary"
                variant="outlined"
                shape="circle"
                icon={<ReloadOutlined spin={isAnimating} />}
                onClick={() => {
                  const paramsData = {
                    cmd: "refresh",
                    device_uuid_list: [deviceId],
                    payload: { agent_user_id: userHotelSession?.id },
                  };

                  dispatch(kioskMQTTAction(paramsData));
                  setIsAnimating(true);
                  setTimeout(() => setIsAnimating(false), 1000);
                }}
              />
              <Button
                color="primary"
                variant="outlined"
                shape="circle"
                icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
              />

              {userSession?.profile_picture && (
                <div className="text-decoration-none">
                  <Avatar
                    src={userSession?.profile_picture}
                    className="sky-blue-bg flex-shrink-0"
                  />
                </div>
              )}
            </div>
          </Header>
          <Content className="main-content d-flex flex-column position-relative">
            <>
              {/* Main Content */}
              <Row gutter={[16, 16]} className="kiosk-content">
                <Col
                  sm={24}
                  lg={isFullscreen ? 24 : 14}
                  xl={isFullscreen ? 24 : 16}
                >
                  <Card className="main-panel p-0 h-100">
                    <div className="d-flex justify-content-between align-items-center py-2 px-3 fs-5">
                      <Tooltip title="Setting">
                        <div
                          className="text-muted cursor"
                          onClick={() => {
                            if (window.jitsiApi) {
                              // Try multiple possible commands for 8x8.vc
                              try {
                                // First attempt: For standard Jitsi
                                window.jitsiApi.executeCommand(
                                  "toggleVirtualBackgroundDialog"
                                );

                                // Second attempt: For 8x8.vc specific implementation
                                window.jitsiApi.executeCommand(
                                  "backgroundEffects"
                                );

                                // Third attempt: Direct iframe access as a fallback
                                const jitsiIframe = document.querySelector(
                                  "#jitsi-container iframe"
                                );
                                if (jitsiIframe && jitsiIframe.contentWindow) {
                                  // Try to click the button directly via postMessage
                                  jitsiIframe.contentWindow.postMessage(
                                    {
                                      type: "request",
                                      name: "toggle-background-effect",
                                    },
                                    "*"
                                  );
                                }

                                // Just in case, try to directly invoke the button
                                const toolbarSelector = ".select-background";
                                const virtualBgButton =
                                  document.querySelector(toolbarSelector);
                                if (virtualBgButton) {
                                  virtualBgButton.click();
                                }
                              } catch (error) {
                                // console.error(
                                //   "Error triggering background selector:",
                                //   error
                                // );
                              }
                            } else {
                              // console.warn("Jitsi API not available");
                            }
                          }}
                        >
                          <SettingOutlined />
                        </div>
                      </Tooltip>
                      <div className="">
                        Kiosk Current Page:{" "}
                        <span className="text-success">Idle</span>
                      </div>
                      <div
                        className="text-muted cursor"
                        // onClick={() => {
                        //   if (window.jitsiApi) {
                        //     window.jitsiApi.executeCommand("toggleFilmStrip");
                        //   }
                        // }}
                        onClick={toggleFullscreen}
                      >
                        {isFullscreen ? (
                          <FullscreenExitOutlined />
                        ) : (
                          <FullscreenOutlined />
                        )}
                      </div>
                    </div>

                    <div className="video-panel d-flex flex-column position-relative">
                      <div
                        ref={jitsiContainerRef}
                        id="jitsi-container"
                        className="video-container"
                        style={{
                          width: "100%",
                          height: "100%",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {!jitsiLoaded && (
                          <>
                            <Avatar size={100} icon={<UserOutlined />} />
                            <div className="position-absolute top-0 start-0 p-3">
                              <img src={whiteLogo} alt="Logo" height={30} />
                            </div>
                          </>
                        )}
                      </div>

                      <VideoControls
                        disconnectOn={disconnectOn}
                        isAudioMuted={isAudioMuted}
                        toggleDisconnect={toggleDisconnect}
                        setIsAudioMuted={setIsAudioMuted}
                        userHotelSession={userHotelSession}
                        kioskSession={kioskSession}
                        dispatch={dispatch}
                        callMQTTAction={callMQTTAction}
                        videoMode={videoMode}
                        handleVideoModeChange={handleVideoModeChange}
                      />
                    </div>
                  </Card>
                </Col>

                {!isFullscreen && (
                  <Col sm={24} lg={10} xl={8}>
                    <Card
                      tabList={tabList}
                      activeTabKey={activeTab}
                      size="small"
                      className="tab-card"
                      onTabChange={(key) => {
                        if (key === "cash_recycler") {
                          dispatch(
                            getcashTransactionListData({
                              params: {
                                page_number: 1,
                                page_size: 10,
                                "kct.transaction_type__not_in": "get_status",
                                "kct.created_at__date_exact": dayjs()
                                  .startOf("day")
                                  .format("YYYY-MM-DD"),
                              },
                            })
                          );
                          dispatch(
                            getBookingListData({
                              params: {
                                "bs.code_name__in": "confirmed,checked_in",
                              },
                            })
                          );
                        }

                        const isDisabled = tabList.find(
                          (tab) => tab.key === key
                        )?.disabled;
                        if (!isDisabled) {
                          setActiveTab(key);
                        }
                      }}
                    >
                      {isTabDisabled && (
                        <div className="disabled-overlay"></div>
                      )}
                      {contentList[activeTab]}
                    </Card>
                  </Col>
                )}
              </Row>

              {kioskResponse?.cmd === "kiosk_close" &&
                kioskResponse?.response?.status &&
                selectedLabel === "Lane Close" && (
                  <div className="lane-text d-flex align-items-center justify-content-center">
                    <h2 className="display-3 fw-semibold mb-0 text-warning">
                      Lane Closed Now On Kiosk
                    </h2>
                  </div>
                )}

              {sessionStorage.getItem("laneClosedStatus") === "true" &&
                selectedLabel === "Lane Close" && (
                  <div className="lane-text d-flex align-items-center justify-content-center">
                    <h2 className="display-3 fw-semibold mb-0 text-warning">
                      Lane Closed Now On Kiosk
                    </h2>
                  </div>
                )}

              <NotificationModal
                visible={notificationModalVisible}
                onClose={() => setNotificationModalVisible(false)}
              />
            </>
          </Content>
        </Layout>
      </Layout>

      <Drawer
        closable={false}
        destroyOnClose
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {hotelSession && (
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => hotelSession && setOpenDrawer(false)}
                  style={{ marginRight: 8 }}
                />
              )}
              <p className="m-0">Hotel</p>
            </div>

            <Tooltip title="Logout">
              {hotelSession ? (
                <Popconfirm
                  title="Are you sure you want to logout without closing the LAN connection?"
                  onConfirm={logOutUse}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    loading={logoutLoading}
                  />
                </Popconfirm>
              ) : (
                <Button
                  type="primary"
                  danger
                  onClick={logOutUse}
                  icon={<LogoutOutlined />}
                  loading={logoutLoading}
                />
              )}
            </Tooltip>
          </div>
        }
        placement="right"
        open={openDrawer}
        onClose={() => hotelSession && setOpenDrawer(false)}
        className="hotel-list-drawer"
      >
        <Input
          placeholder="Select a hotel"
          suffix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
        {/* {goTOhotelLoading ? (
            <Skeleton active className="mt-3" />
          ) : ( */}
        <ul className="hotel-list list-unstyled">
          {filteredHotels?.map((hotel) => (
            <li
              key={hotel.id}
              className={`my-2 ${
                hotelSession && hotel.id === hotelSession.id && "active"
              }`}
              onClick={() => {
                dispatch(goToHotelDetails(hotel.id)).then((res) => {
                  setTimeout(() => {
                    if (kioskSession?.[0]?.device_id) {
                      dispatch(
                        agentMQTTAction({
                          cmd: "connect",
                          device_uuid_list: [kioskSession?.[0]?.device_id],
                          payload: { agent_user_id: userHotelSession?.id },
                        })
                      ).then(() => {
                        if (kioskSession?.[0]?.id_scanner_config?.is_active) {
                          statusIDScanner();
                        }
                        if (
                          kioskSession?.[0]?.key_dispenser_config?.is_active
                        ) {
                          statusKeyDispenser();
                        }
                        if (
                          kioskSession?.[0]?.cash_recycler_config?.is_active
                        ) {
                          connectCashRecycler();
                        }
                        if (kioskSession?.[0]?.key_encoder_config?.is_active) {
                          statusKeyEncoder();
                        }
                        // if (kioskSession?.[0]?.usb_hub_config?.is_active) {
                        // }
                        // if (kioskSession?.[0]?.printer_config?.is_active) {
                        // }
                      });
                    }
                  }, 2000);
                });
                setOpenDrawer(false);
                setSelectedLabel("Self Check-In");
              }}
            >
              <Link rel="noopener noreferrer" className="text-decoration-none">
                {hotel?.hotel_name}-{hotel?.city}
              </Link>
              {hotelSession && hotel.id === hotelSession.id && (
                <CheckOutlined className="fs-4 text-white" />
              )}
            </li>
          ))}
        </ul>
        {/* )} */}
      </Drawer>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        deviceStatuses={deviceStatuses}
        toggleDeviceStatus={toggleDeviceStatus}
        onRestartDevice={handleRestartDevice}
        isIdScannerLoading={isIdScannerLoading}
        deviceIdScannerLoading={deviceIdScannerLoading}
        isKeyELoading={isKeyELoading}
        isServiceStatusLoading={isServiceStatusLoading}
        isKeyDLoading={isKeyDLoading}
        isCashRecyclerLoading={isCashRecyclerLoading}
        getIDStatusTimer={isIdScanGetStatusTimer}
        restartIDTimer={isIdScanRestartedTimer}
        getEncoderTimer={isKeyEncoderGetStatusTimer}
        restartEncoderTimer={isKeyEncoderRestartedTimer}
        getDispenderTimer={isKeyDispenderGetStatusTimer}
        restartDispenderTimer={isKeyDispenderRestartedTimer}
        getCashTimer={isCashGetStatusTimer}
        restartCashTimer={isCashRestartedTimer}
        getServiceTimer={isServiceGetStatusTimer}
        restartServiceTimer={isServiceRestartedTimer}
        deviceId={deviceId}
        userHotelSession={userHotelSession}
        kioskStatus={deviceStatuses.kiosk}
      />

      {/* Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        onEditBooking={handleEditBooking}
        onOpenCashModal={() => setCashModalVisible(true)}
        isVideoCall={isVideoCall}
      />

      {/* Cash Modal */}
      <CashModal
        visible={cashModalVisible}
        onClose={() => setCashModalVisible(false)}
        initialTransactionType={cashModalType}
        kioskRepsonse={kioskResponse}
        userHotelSession={userHotelSession}
        kioskSession={kioskSession}
        deviceId={deviceId}
      />

      <EmotyCashboxModal
        visible={emptyCashBoxModalVisible}
        onClose={() => setEmptyCashBoxModalVisible(false)}
        initialTransactionType={cashModalType}
        kioskRepsonse={kioskResponse}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        visible={transactionModalVisible}
        onClose={() => settransactionModalVisible(false)}
        transaction={selectedTransaction}
      />

      <LastTransactionsModal
        lastTransactionsModalVisible={lastTransactionsModalVisible}
        setLastTransactionsModalVisible={setLastTransactionsModalVisible}
        setSelectedTransaction={setSelectedTransaction}
        settransactionModalVisible={settransactionModalVisible}
      />

      {/* Kiosk Modal */}
      <KioskModal
        KioskModalVisible={KioskModalVisible}
        onKioskCancel={() => setKioskModalVisible(false)}
        activeKioskDeviceList={activeKioskDeviceList}
        onSelectKioskDevice={onSelectKioskDevice}
      />

      <Modal
        open={
          !dismissedConnectionModal &&
          kioskResponse?.response?.data?.status_mode ===
            "already_connect_agent" &&
          userHotelSession?.id === kioskResponse?.response?.data?.userId
        }
        closeIcon={null}
        footer={[
          <Button
            key="no"
            onClick={() => {
              // Just hide the modal without changing MQTT state
              setDismissedConnectionModal(true);
            }}
          >
            No
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              // Reset the state or do any cleanup needed
              dispatch(
                agentMQTTAction({
                  cmd: "re_connect",
                  payload: {
                    agent_user_id: userHotelSession?.id,
                    data: {
                      re_connect_status: true,
                    },
                  },
                  device_uuid_list: [kioskSession?.[0]?.device_id],
                })
              );
              setDismissedConnectionModal(true);
            }}
          >
            Yes
          </Button>,
        ]}
        centered
        maskClosable={false}
        closable={false}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Typography.Title level={4} style={{ color: "#ff4d4f" }}>
            Already Connected
          </Typography.Title>
          <Typography.Paragraph>
            This kiosk is already connected to another agent. Please try again
            later or contact the other agent.
          </Typography.Paragraph>
        </div>
      </Modal>

      {/* Selfie Modal */}
      <SelfieModal
        visible={selfieVisible}
        setSelfieVisible={setSelfieVisible}
        setLoadingcmd={setLoadingcmd}
        currentModel={currentModel}
        setCurrentModel={setCurrentModel}
      />

      {/* Kiosk Activation Code Modal  */}
      <KioskActivationModal
        visible={activationModalVisible}
        onCancel={() => setActivationModalVisible(false)}
      />

      <KeyProgressDrawer
        visible={keyProgressDrawerVisible}
        onClose={() => {
          setKeyProgressDrawerVisible(false);
          setStartScanLoading(false);
          setLoading((prev) => ({
            ...prev,
            issue_key: false,
          }));
        }}
        issueKeyData={selectedRoomData}
        dispatch={dispatch}
        kioskMQTTAction={kioskMQTTAction}
        deviceIds={deviceIds}
        hotelSession={hotelSession}
        kioskResponse={kioskResponse}
        loading={loading}
        activeHotelRoomList={activeHotelRoomList}
      />
    </>
  );
};

export default KioskTerminal;
