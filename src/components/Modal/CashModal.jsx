import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Typography,
  Table,
  Divider,
  Card,
  Row,
  Col,
  Tag,
} from "antd";
import React, { useState, useEffect, useRef } from "react";
import { notification } from "../../helpers/middleware";
import useCashRecycler from "../../hooks/useCashRecycler";
import { useDispatch, useSelector } from "react-redux";
import { addNewcashTransactionLog } from "../../redux/reducers/Booking/cashTransactionLog";
import { callMQTTAction } from "../../redux/reducers/MQTT/callMQTT";
import { kioskMQTTAction } from "../../redux/reducers/MQTT/kioskMQTT";
const { Option } = Select;
const { Text } = Typography;

const CashModal = ({
  visible,
  onClose,
  initialTransactionType = "collection",
  kioskRepsonse,
  userHotelSession,
  kioskSession,
  deviceId,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { collectionCashRecycler, refundCashRecycler } = useCashRecycler();
  const [lastSubmittedValues, setLastSubmittedValues] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { cashRecyclerConsoleMQTTLoading } = useSelector(
    ({ cashRecyclerConsoleMQTT }) => cashRecyclerConsoleMQTT
  );

  const { cashTransactionLogLoading } = useSelector(
    ({ cashTransactionLog }) => cashTransactionLog
  );

  const { activecashRecyclerConsoleMQTTList } = useSelector(
    ({ cashRecyclerConsoleMQTT }) => cashRecyclerConsoleMQTT
  );

  const { activeBookingList, bookingLoading } = useSelector(
    ({ booking }) => booking
  );

  const [transactionType, setTransactionType] = useState(
    initialTransactionType
  );

  const [confirmationVisible, setConfirmationVisible] = useState(false);

  // Track real-time transaction data
  const [transactionData, setTransactionData] = useState({
    quantities: {
      1: 0,
      2: 0,
      5: 0,
      10: 0,
      20: 0,
      50: 0,
      100: 0,
    },
    amounts: {
      1: 0,
      2: 0,
      5: 0,
      10: 0,
      20: 0,
      50: 0,
      100: 0,
    },
    totalCollected: 0,
    totalRefunded: 0,
  });

  // Store the last kioskResponse to prevent duplicate processing
  const lastKioskResponseRef = useRef(null);
  // const userData = getSessionItem("HotelSessionAgentConsole");

  // useEffect(() => {
  //   if (userData) {
  //     dispatch(
  //       getBookingListData({
  //         params: { "bs.code_name__in": "confirmed,checked_in" },
  //       })
  //     );
  //   }
  // }, [dispatch, userData]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({ transactionType: initialTransactionType });
      setTransactionType(initialTransactionType);
    }
  }, [visible, form, initialTransactionType]);

  useEffect(() => {
    if (
      kioskRepsonse?.payload?.command_data?.transaction_status === "complete" ||
      kioskRepsonse?.payload?.command_result === "error"
    ) {
      setConfirmationVisible(false);
    }
  }, [
    kioskRepsonse?.payload?.command_data?.transaction_status,
    kioskRepsonse?.payload?.command_result,
  ]);

  const parseDenomination = (denomValue) => {
    if (typeof denomValue === "number") {
      return denomValue;
    }

    if (typeof denomValue === "string") {
      return parseFloat(denomValue.replace(/\$|\s/g, ""));
    }

    return null;
  };

  useEffect(() => {
    if (
      !kioskRepsonse ||
      kioskRepsonse === lastKioskResponseRef.current ||
      !kioskRepsonse.payload
    ) {
      return;
    }

    lastKioskResponseRef.current = kioskRepsonse;

    if (
      kioskRepsonse.payload.command === "transaction_status_update" &&
      kioskRepsonse.payload.command_result === "success"
    ) {
      const commandData = kioskRepsonse.payload.command_data || {};
      const denomination = commandData.denomination;

      if (denomination) {
        const denomValue = parseDenomination(denomination);

        if (denomValue) {
          let billDenom = "";
          if (denomValue === 1) billDenom = "1";
          else if (denomValue === 2) billDenom = "2";
          else if (denomValue === 5) billDenom = "5";
          else if (denomValue === 10) billDenom = "10";
          else if (denomValue === 20) billDenom = "20";
          else if (denomValue === 50) billDenom = "50";
          else if (denomValue === 100) billDenom = "100";

          if (billDenom) {
            setTransactionData((prev) => {
              const newQuantities = {
                ...prev.quantities,
                [billDenom]: (prev.quantities[billDenom] || 0) + 1,
              };

              const newAmounts = {
                ...prev.amounts,
                [billDenom]: (prev.amounts[billDenom] || 0) + denomValue,
              };

              const txType =
                commandData.transaction_type ||
                lastSubmittedValues?.transactionType ||
                initialTransactionType;

              const newTotal =
                commandData.transaction_amount ||
                prev[
                  txType === "collection" ? "totalCollected" : "totalRefunded"
                ] + denomValue;

              return {
                ...prev,
                quantities: newQuantities,
                amounts: newAmounts,
                [txType === "collection" ? "totalCollected" : "totalRefunded"]:
                  newTotal,
              };
            });
          }
        }
      }
    }

    // if (
    //   kioskRepsonse.payload.command === "info_credit" &&
    //   kioskRepsonse.payload.command_result === "success"
    // ) {
    //   const commandData = kioskRepsonse.payload.command_data || {};
    //   const denomination = commandData.denominate;

    //   if (denomination) {
    //     const denomValue = parseDenomination(denomination);

    //     if (denomValue) {
    //       let billDenom = "";
    //       if (denomValue === 1) billDenom = "1";
    //       else if (denomValue === 2) billDenom = "2";
    //       else if (denomValue === 5) billDenom = "5";
    //       else if (denomValue === 10) billDenom = "10";
    //       else if (denomValue === 20) billDenom = "20";
    //       else if (denomValue === 50) billDenom = "50";
    //       else if (denomValue === 100) billDenom = "100";

    //       if (billDenom) {
    //         setTransactionData((prev) => {
    //           const newQuantities = {
    //             ...prev.quantities,
    //             [billDenom]: (prev.quantities[billDenom] || 0) + 1,
    //           };

    //           const newAmounts = {
    //             ...prev.amounts,
    //             [billDenom]: (prev.amounts[billDenom] || 0) + denomValue,
    //           };

    //           const newTotalCollected = prev.totalCollected + denomValue;

    //           return {
    //             ...prev,
    //             quantities: newQuantities,
    //             amounts: newAmounts,
    //             totalCollected: newTotalCollected,
    //           };
    //         });
    //       }
    //     }
    //   }
    // }
  }, [kioskRepsonse, lastSubmittedValues, initialTransactionType]);

  // Update amount label when transaction type changes
  const handleTransactionTypeChange = (value) => {
    setTransactionType(value);
  };

  // Handle booking selection
  const handleBookingChange = (bookingId) => {
    const selectedBooking = activeBookingList.find(
      (booking) => booking.id === bookingId
    );

    if (selectedBooking) {
      form.setFieldsValue({
        guestName: selectedBooking?.guest?.full_name,
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      dispatch(
        callMQTTAction({
          cmd: "live",
          payload: {
            agent_user_id: userHotelSession?.id,
          },
          device_uuid_list: [kioskSession?.[0]?.device_id],
        })
      );
      setLastSubmittedValues(values);

      setTransactionData({
        quantities: {
          1: 0,
          2: 0,
          5: 0,
          10: 0,
          20: 0,
          50: 0,
          100: 0,
        },
        amounts: {
          1: 0,
          2: 0,
          5: 0,
          10: 0,
          20: 0,
          50: 0,
          100: 0,
        },
        totalCollected: 0,
        totalRefunded: 0,
      });

      const { amount, transactionType, guestName, booking_id } = values;
      setConfirmationVisible(true);
      onClose();
      setLoading(true);
      if (transactionType === "collection") {
        await collectionCashRecycler({
          amount,
          transactionType,
          guestName,
          booking_id,
        }).then(() => {
          // setConfirmationVisible(true);
          // onClose();
        });
      } else if (transactionType === "refund") {
        await refundCashRecycler({
          amount,
          transactionType,
          guestName,
          booking_id,
        }).then(() => {
          // setConfirmationVisible(true);
          // onClose();
        });
      }
    } catch (error) {
      setLoading(false);
      notification(`Error: ${error.message}`, "error", 2000, "topRight");
    }
  };

  const handleResume = () => {
    dispatch(
      addNewcashTransactionLog({
        cash_transaction_id:
          activecashRecyclerConsoleMQTTList?.[0]?.payload?.cash_transaction_id,
        command: "start_device",
        sender_type: "agent",
        command_result: "init",
      })
    );
  };

  const handlePause = () => {
    dispatch(
      addNewcashTransactionLog({
        cash_transaction_id:
          activecashRecyclerConsoleMQTTList?.[0]?.payload?.cash_transaction_id,
        command: "stop_device",
        sender_type: "agent",
        command_result: "init",
      })
    );
  };

  const handleCancel = () => {
    dispatch(
      callMQTTAction({
        cmd: "full",
        payload: {
          agent_user_id: userHotelSession?.id,
        },
        device_uuid_list: [kioskSession?.[0]?.device_id],
      })
    );
    const paramsData = {
      cmd: "move_home",
      device_uuid_list: [deviceId],
      payload: { agent_user_id: userHotelSession?.id },
    };

    dispatch(kioskMQTTAction(paramsData));
    dispatch(
      addNewcashTransactionLog({
        cash_transaction_id:
          activecashRecyclerConsoleMQTTList?.[0]?.payload?.cash_transaction_id,
        command: "cancel_transaction",
        sender_type: "agent",
        command_result: "init",
      })
    ).then(() => {
      setConfirmationVisible(false);
    });
  };

  useEffect(() => {
    if (!kioskRepsonse?.payload?.command_data && loading) {
      // Set 15 second timeout when we get null response
      const timeout = setTimeout(() => {
        setLoading(false);
        setErrorMessage(
          "Request timeout. No response received. Please try again later."
        );
      }, 15000);

      // Store timeout ID to clear it later
      window.emptyCashboxTimeout = timeout;

      return () => clearTimeout(timeout);
    }
  }, [kioskRepsonse, loading]);

  // Get the appropriate amount label based on transaction type
  const getAmountLabel = () => {
    switch (transactionType) {
      case "refund":
        return (
          <span>
            ENTER AMOUNT TO BE REFUNDED <Text type="danger">*</Text>{" "}
            <Text type="secondary">(MAX 2000)</Text>
          </span>
        );
      case "collection":
      default:
        return (
          <span>
            ENTER AMOUNT TO BE COLLECTED <Text type="danger">*</Text>{" "}
            <Text type="secondary">(MAX 2000)</Text>
          </span>
        );
    }
  };

  const isProcessingNote =
    kioskRepsonse?.payload?.command_message === "Reading note." ||
    kioskRepsonse?.payload?.command_message === "Stacking note." ||
    kioskRepsonse?.payload?.command_message === "Note in escrow.";

  const isLoading = isProcessingNote || cashTransactionLogLoading;

  const enteredAmount = lastSubmittedValues?.amount || 0;
  const currentTransactionType =
    lastSubmittedValues?.transactionType || initialTransactionType;

  const totalCollected =
    kioskRepsonse?.payload?.command_data?.transaction_amount || // API transaction amount
    kioskRepsonse?.payload?.command_data?.total_accept || // API total accept
    transactionData.totalCollected || // Our tracked total
    (currentTransactionType === "collection" ? enteredAmount : 0); // Fallback to entered amount

  // For total refunded
  const totalRefunded =
    kioskRepsonse?.payload?.command_data?.refund_amount ||
    transactionData.totalRefunded ||
    (currentTransactionType === "refund" ? enteredAmount : 0);

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

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  useEffect(() => {
    if (
      kioskRepsonse?.payload?.command_result === "success" ||
      kioskRepsonse?.payload?.command_result === "error"
    ) {
      setLoading(false);
    }
  }, [kioskRepsonse?.payload?.command_result]);

  return (
    <>
      <Modal
        title={
          <h5 className="text-center mb-3">Create New Cash Transaction</h5>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={"25%"}
        wrapClassName="cash-modal"
        centered
        style={{ marginLeft: "auto", marginRight: "4%" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          initialValues={{ transactionType: initialTransactionType }}
        >
          <Form.Item
            label={
              <span>
                BOOKING REF. # <Text type="danger">*</Text>
              </span>
            }
            name="booking_id"
            rules={[
              { required: true, message: "Booking reference is required" },
            ]}
          >
            <Select
              placeholder="Select booking reference"
              onChange={handleBookingChange}
              loading={bookingLoading}
              showSearch
              optionFilterProp="label"
              options={activeBookingList?.map((booking) => ({
                value: booking.id,
                label: `${booking.reference_no} - ${booking?.guest?.full_name}`,
              }))}
            ></Select>
          </Form.Item>

          <Form.Item
            label={
              <span>
                GUEST NAME <Text type="danger">*</Text>
              </span>
            }
            name="guestName"
            rules={[{ required: true, message: "Guest name is required" }]}
          >
            <Input placeholder="Enter guest name" />
          </Form.Item>

          <Form.Item
            label={
              <span>
                TRANSACTION TYPE <Text type="danger">*</Text>
              </span>
            }
            name="transactionType"
            rules={[
              { required: true, message: "Please select transaction type" },
            ]}
          >
            <Select
              placeholder="Select transaction type"
              onChange={handleTransactionTypeChange}
            >
              <Option value="collection">Collection</Option>
              <Option value="refund">Refund</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={getAmountLabel()}
            name="amount"
            rules={[
              { required: true, message: "Enter valid amount" },
              {
                type: "number",
                min: 0.01,
                message: "Amount must be greater than 0",
              },
              {
                type: "number",
                max: 2000,
                message: "Amount cannot exceed 2000",
              },
            ]}
          >
            <InputNumber
              className="w-100"
              min={0.01}
              max={2000}
              step={0.01}
              precision={2}
              placeholder={`Enter amount to be ${
                transactionType === "refund" ? "refunded" : "collected"
              }`}
              formatter={(value) =>
                `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={cashRecyclerConsoleMQTTLoading}
              disabled={cashRecyclerConsoleMQTTLoading}
            >
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        open={confirmationVisible}
        onCancel={() => setConfirmationVisible(false)}
        footer={null}
        width={"35%"}
        centered
        wrapClassName="cash-modal"
        closable={false}
        maskClosable={false}
        style={{ marginLeft: "auto", marginRight: "4%" }}
      >
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
            Transaction Data
          </h2>

          {!errorMessage && loading && (
            <p
              style={{
                color: loading ? "#F59E0B" : "#52c41a",
                fontSize: "16px",
                margin: "5px 0",
              }}
            >
              {loading ? "Processing..." : "Successfully"}
            </p>
          )}
          {errorMessage && (
            <div style={{ marginBottom: "30px" }}>
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#fff2f0",
                  border: "1px solid #ffccc7",
                  borderRadius: "6px",
                  marginBottom: "15px",
                }}
              >
                <p style={{ fontSize: "16px", color: "#ff4d4f", margin: 0 }}>
                  {errorMessage}
                </p>
              </div>
              <Button
                danger
                onClick={() => {
                  setErrorMessage("");
                  setConfirmationVisible(false);
                  onClose();
                }}
                disabled={loading}
                style={{ minWidth: "100px" }}
              >
                Close
              </Button>
            </div>
          )}
          {kioskRepsonse?.payload?.command_result === "error" && (
            <>
              <p style={{ color: "red", fontSize: "16px", margin: "5px 0" }}>
                {kioskRepsonse?.payload?.command_message}
              </p>
              <Button
                danger
                style={{ flex: 1 }}
                onClick={() => setConfirmationVisible(false)}
                loading={loading || isLoading}
              >
                Close
              </Button>
            </>
          )}
          {kioskRepsonse?.payload?.command_result === "success" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  margin: "15px 0",
                }}
              >
                <Button
                  type="primary"
                  style={{
                    backgroundColor: "#4CAF50",
                    borderColor: "#4CAF50",
                    flex: 1,
                  }}
                  loading={loading || isLoading}
                  onClick={handleResume}
                >
                  Resume
                </Button>
                <Button
                  style={{
                    backgroundColor: "#F9A825",
                    borderColor: "#F9A825",
                    color: "white",
                    flex: 1,
                  }}
                  loading={loading || isLoading}
                  onClick={handlePause}
                >
                  Pause
                </Button>
                <Button danger style={{ flex: 1 }} onClick={handleCancel}>
                  Cancel
                </Button>
              </div>

              <Divider style={{ margin: "15px 0" }} />

              {/* Transaction Summary */}
              <div style={{ textAlign: "left", margin: "10px 0" }}>
                <Row gutter={[16, 8]}>
                  <Col span={24}>
                    <Card
                      size="small"
                      title={
                        currentTransactionType === "collection"
                          ? "Total Collection"
                          : "Total Refund"
                      }
                      headStyle={{
                        background:
                          currentTransactionType === "collection"
                            ? "#e6f7ff"
                            : "#fff7e6",
                        color:
                          currentTransactionType === "collection"
                            ? "#1890ff"
                            : "#fa8c16",
                      }}
                      bodyStyle={{
                        textAlign: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      {currentTransactionType === "collection"
                        ? formatCurrency(totalCollected)
                        : formatCurrency(totalRefunded)}
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Denomination Table */}
              <div style={{ margin: "15px 0" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <h4>Transaction Details</h4>
                  <h4>
                    <Tag>{kioskRepsonse?.payload?.command_message}</Tag>
                  </h4>
                </div>
                <Table
                  columns={billColumns}
                  scroll={{
                    x: 300,
                  }}
                  dataSource={[
                    {
                      key: "1",
                      category: "Qty",
                      1: transactionData.quantities["1"] || 0,
                      2: transactionData.quantities["2"] || 0,
                      5: transactionData.quantities["5"] || 0,
                      10: transactionData.quantities["10"] || 0,
                      20: transactionData.quantities["20"] || 0,
                      50: transactionData.quantities["50"] || 0,
                      100: transactionData.quantities["100"] || 0,
                    },
                    {
                      key: "2",
                      category: "AMOUNT",
                      1: transactionData.amounts["1"] || 0,
                      2: transactionData.amounts["2"] || 0,
                      5: transactionData.amounts["5"] || 0,
                      10: transactionData.amounts["10"] || 0,
                      20: transactionData.amounts["20"] || 0,
                      50: transactionData.amounts["50"] || 0,
                      100: transactionData.amounts["100"] || 0,
                    },
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                  className="bills-table"
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CashModal;
