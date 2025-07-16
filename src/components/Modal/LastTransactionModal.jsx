import {
  Button,
  DatePicker,
  Flex,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarOutlined, EyeOutlined, SyncOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getcashTransactionListData } from "../../redux/reducers/Booking/cashTransaction";
import { exportTransactionsToExcel } from "../../utils/exportUtils";

const LastTransactionsModal = ({
  lastTransactionsModalVisible,
  setLastTransactionsModalVisible,
  setSelectedTransaction,
  settransactionModalVisible,
}) => {
  const dispatch = useDispatch();

  const {
    cashTransactionLoading,
    activecashTransactionList,
    getcashTransactionDetailsData,
    totalPages,
    currentPage,
    totalUsers,
  } = useSelector(({ cashTransaction }) => cashTransaction);

  const [selectedDate, setSelectedDate] = useState(dayjs().startOf("day"));

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Update pagination state when data changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: currentPage,
      total: totalUsers,
      pageSize: prev.pageSize || 10, // Keep the current pageSize
    }));
  }, [currentPage, totalUsers]);

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
          text: status || "Unknown",
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

  const handleTableChange = (newPagination, filters, sorter) => {
    // Update local pagination state
    setPagination(newPagination);

    // Dispatch the API call with new parameters
    dispatch(
      getcashTransactionListData({
        params: {
          page_number: newPagination.current,
          page_size: newPagination.pageSize,
          // Include any date filter if selected
          ...(selectedDate && {
            "kct.created_at__date_exact": selectedDate.format("YYYY-MM-DD"),
          }),
          "kct.transaction_type__not_in": "get_status",
        },
      })
    );
  };

  return (
    <Modal
      open={lastTransactionsModalVisible}
      onCancel={() => setLastTransactionsModalVisible(false)}
      footer={null}
      width={1200}
      centered
      className="last-transaction-modal"
      closable={true}
    >
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <Flex
          align="center"
          justify="space-between"
          wrap
          gap={8}
          className="mb-2"
        >
          <Space>
            <Typography.Text strong className="text-primary">
              Last Transactions
            </Typography.Text>
            <Button
              type="text"
              icon={<SyncOutlined spin={cashTransactionLoading} />}
              onClick={() => {
                if (selectedDate) {
                  dispatch(
                    getcashTransactionListData({
                      params: {
                        page_number: pagination.current,
                        page_size: pagination.pageSize,
                        "kct.created_at__date_exact":
                          selectedDate.format("YYYY-MM-DD"),
                        "kct.transaction_type__not_in": "get_status",
                      },
                    })
                  );
                } else {
                  dispatch(
                    getcashTransactionListData({
                      params: {
                        page_number: pagination.current,
                        page_size: pagination.pageSize,
                        "kct.transaction_type__not_in": "get_status",
                      },
                    })
                  );
                }
              }}
            />
          </Space>
          <Space>
            <DatePicker
              value={selectedDate}
              suffixIcon={<CalendarOutlined />}
              placeholder="Select date"
              onChange={(date, dateString) => {
                setSelectedDate(date);
                dispatch(
                  getcashTransactionListData({
                    params: {
                      page_number: pagination.current,
                      page_size: pagination.pageSize,
                      "kct.created_at__date_exact": dateString,
                      "kct.transaction_type__not_in": "get_status",
                    },
                  })
                );
              }}
            />
            <Button
              color="green"
              variant="solid"
              onClick={() =>
                exportTransactionsToExcel(
                  activecashTransactionList,
                  selectedDate
                )
              }
            >
              Export
            </Button>
          </Space>
        </Flex>

        {/* Transactions Table */}
        <Table
          loading={cashTransactionLoading}
          columns={transactionColumns}
          dataSource={activecashTransactionList}
          pagination={{
            ...pagination,
            showSizeChanger: true, // Make sure this is enabled
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          size="middle"
          scroll={{
            x: 400,
            y: 400,
          }}
          bordered
          locale={{
            emptyText: <Typography.Text>No transactions found</Typography.Text>,
          }}
        />
      </div>
    </Modal>
  );
};

export default LastTransactionsModal;
