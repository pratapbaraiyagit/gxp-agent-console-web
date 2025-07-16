import { Avatar, Button, Input, Modal, Space, Table, Tag, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import {
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  KeyOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getBookingListData } from "../../redux/reducers/Booking/booking";
import { keyDispenserAction } from "../../redux/reducers/MQTT/keyDispenser";
import { exportBookingsToExcel } from "../../utils/exportUtils";
import moment from "moment";
import { kioskMQTTAction } from "../../redux/reducers/MQTT/kioskMQTT";

const BookingModal = ({
  visible,
  onClose,
  onEditBooking,
  onOpenCashModal,
  isVideoCall,
}) => {
  const dispatch = useDispatch();
  const {
    activeBookingList,
    bookingLoading,
    totalPages,
    currentPage,
    totalUsers,
  } = useSelector(({ booking }) => booking);

  const { activeKioskDeviceList } = useSelector(
    ({ kioskDevice }) => kioskDevice
  );

  const deviceIds =
    activeKioskDeviceList?.map((device) => device.id).filter(Boolean) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const searchTimeoutRef = React.useRef(null);

  // Update pagination state when data changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: currentPage || 1,
      total: totalUsers || 0,
    }));
  }, [currentPage, totalUsers]);

  const handleEdit = (record) => {
    onEditBooking(record);
    onClose(); // Close the modal after selecting a booking to edit
  };

  const handleOpenCashModal = (record) => {
    setSelectedBooking(record);
    onClose(); // Close the booking modal
    onOpenCashModal(); // Open the cash modal
  };

  const handleModalClose = () => {
    // Clear the search query
    setSearchQuery("");
    // Reset pagination
    setPagination({
      current: 1,
      pageSize: 10,
      total: 0,
    });

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Call the original onClose prop
    onClose();
  };

  const bookingColumns = [
    {
      title: "REFERENCE NO.",
      dataIndex: "reference_no",
      key: "reference_no",
      render: (text, record) => {
        return (
          <div className="d-flex align-items-start">
            <Avatar
              size="small"
              src={record?.guest?.profile_picture}
              className="flex-shrink-0 me-2"
            ></Avatar>
            {text}
          </div>
        );
      },
    },
    {
      title: "NAME",
      dataIndex: "guest",
      key: "name",
      render: (guest) => guest?.full_name || "",
    },
    {
      title: "EMAIL",
      dataIndex: "guest",
      key: "email",
      render: (guest) => {
        const primaryEmail =
          guest?.email_details?.find((email) => email.is_primary)?.email || "";
        return primaryEmail;
      },
    },
    {
      title: "ROOM NUMBER",
      dataIndex: "room_number",
      key: "roomNumber",
    },
    {
      title: "AMOUNT",
      dataIndex: "total_charge",
      key: "amount",
      render: (amount) => `$${amount?.toFixed(2) || "0.00"}`,
    },
    {
      title: "MOBILE",
      dataIndex: "guest",
      key: "mobile",
      render: (guest) => {
        const primaryPhone =
          guest?.phone_details?.find((phone) => phone.is_primary)?.phone || "";
        return primaryPhone;
      },
    },
    {
      title: "STATUS",
      dataIndex: "code_name",
      key: "status",
      render: (status) => {
        const statusConfig = {
          new: { color: "yellow", text: "New" },
          confirmed: { color: "purple", text: "Confirmed" },
          checked_in: { color: "green", text: "Checked In" },
          checked_out: { color: "blue", text: "Checked Out" },
          reserved: { color: "orange", text: "Reserved" },
          cancelled: { color: "red", text: "Cancelled" },
        };

        const config = statusConfig[status] || {
          color: "default",
          text: status || "Unknown",
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "ACTION",
      key: "action",
      width: 150,
      render: (_, record) => {
        return (
          <Space size={8}>
            <Tooltip title="Contract" color={""}>
              <FileTextOutlined />
            </Tooltip>
            <Tooltip title="Edit" color={"gold"}>
              <EditOutlined
                style={{ color: "gold" }}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            {isVideoCall && (
              <>
                <Tooltip title="New Collection" color={"green"}>
                  <DollarOutlined
                    style={{ color: "green" }}
                    onClick={() => handleOpenCashModal(record)}
                  />
                </Tooltip>
                <Tooltip title="New Refund" color={"purple"}>
                  <DollarOutlined
                    style={{ color: "purple" }}
                    onClick={() => handleOpenCashModal(record)}
                  />
                </Tooltip>
              </>
            )}
            <Tooltip title="Duplicate Key" color={"cyan"}>
              <KeyOutlined
                style={{ color: "cyan" }}
                onClick={() => {
                  dispatch(
                    kioskMQTTAction({
                      cmd: "issue_key",
                      device_uuid_list: deviceIds,
                      payload: {
                        building: "1",
                        building_lock_id: record?.building_lock_id || "1",
                        floor: "1",
                        floor_lock_id: record?.floor_lock_id || "1",
                        room_no: record?.room_number,
                        room_lock_id: record?.room_lock_id || "1",
                        check_in_date: record?.check_in_date,
                        check_in_time: moment(
                          record?.check_in_time,
                          "HH:mm:ss"
                        ).format("HH:mm"),
                        check_out_date: record?.check_out_date,
                        check_out_time: moment(
                          record?.check_out_time,
                          "HH:mm:ss"
                        ).format("HH:mm"),
                        is_duplicate: true,
                        meta: {},
                      },
                    })
                  );
                }}
              />
            </Tooltip>
            {/* <Tooltip title="Delete" color={"red"}>
              <DeleteOutlined style={{ color: "red" }} />
            </Tooltip> */}
          </Space>
        );
      },
    },
  ];

  // Fetch data function
  const fetchBookingData = (page = 1, pageSize = 10, searchValue = "") => {
    const params = {
      page_number: page,
      page_size: pageSize,
      "bs.code_name__in": "confirmed,checked_in",
    };

    if (searchValue) {
      params.first_name__istartswith = searchValue;
    }

    dispatch(getBookingListData({ params }));
  };

  useEffect(() => {
    if (visible) {
      fetchBookingData(1, pagination.pageSize);
    }
  }, [visible]);

  const handleSearch = (value) => {
    setSearchQuery(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Reset to first page on search
    setPagination((prev) => ({ ...prev, current: 1 }));

    // Set a new timeout
    searchTimeoutRef.current = setTimeout(() => {
      fetchBookingData(1, pagination.pageSize, value);
    }, 500); // 500ms delay, adjust as needed
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    // Update local pagination state
    setPagination(newPagination);

    // Fetch data with new pagination
    fetchBookingData(
      newPagination.current,
      newPagination.pageSize,
      searchQuery
    );
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Modal
      title={<h4 className="text-center mb-3">Booking List</h4>}
      open={visible}
      onCancel={handleModalClose}
      footer={null}
      width={1200}
      centered
      className="booking-modal"
      closable={true}
    >
      <div className="booking-modal-content">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
          <div className="flex-grow-1">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search booking by name"
              className="w-100"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button
            color="primary"
            variant="solid"
            type="primary"
            className="flex-shrink-0"
            onClick={() => exportBookingsToExcel(activeBookingList)}
          >
            <DownloadOutlined /> Download EXCEL
          </Button>
        </div>

        <div className="booking-table">
          <Table
            columns={bookingColumns}
            dataSource={activeBookingList}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} bookings`,
            }}
            loading={bookingLoading}
            onChange={handleTableChange}
            scroll={{
              x: 1000,
              y: "calc(100vh - 350px)", // Adjusted height to accommodate pagination
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default BookingModal;
