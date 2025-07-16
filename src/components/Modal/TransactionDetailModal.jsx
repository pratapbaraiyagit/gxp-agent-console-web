import { Button, Col, Modal, Row, Space, Table, Typography } from "antd";
import React, { useState } from "react";
import { getcashTransactionLogDetails } from "../../redux/reducers/Booking/cashTransactionLog";
import { useDispatch, useSelector } from "react-redux";
const { Text, Paragraph } = Typography;

const TransactionDetailModal = ({ visible, onClose, transaction }) => {
  const dispatch = useDispatch();
  const [logsVisible, setLogsVisible] = useState(false);

  const { cashTransactionLogLoading, getcashTransactionLogDetailsData } =
    useSelector(({ cashTransactionLog }) => cashTransactionLog);

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      width: "5%",
      render: (_, __, index) => index + 1, // This gives sequential numbering starting from 1
    },
    {
      title: "SENDER TYPE",
      dataIndex: "sender_type",
      key: "sender_type",
      width: "20%",
    },
    {
      title: "COMMAND",
      dataIndex: "command",
      key: "command",
      width: "25%",
    },
    {
      title: "RESULT",
      dataIndex: "command_result",
      key: "command_result",
      width: "20%",
    },
    {
      title: "MESSAGE",
      dataIndex: "command_message",
      key: "command_message",
      width: "30%",
    },
  ];

  const handleClose = () => {
    setLogsVisible(false);
    onClose();
  };

  return (
    <Modal
      title={<h4 className="text-center mb-3">Transaction Details</h4>}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      centered
      className="transaction-modal"
    >
      <Space direction="vertical" size="small" className="w-100">
        <Row align="middle">
          <Col span={7}>
            <Text type="secondary" className="fw-medium">
              GUEST NAME :
            </Text>
          </Col>
          <Col span={17}>
            <Text style={{ fontSize: "16px" }}>{transaction?.guest_name}</Text>
          </Col>
        </Row>
        <Row align="middle">
          <Col span={7}>
            <Text type="secondary" className="fw-medium">
              BOOKING REF. # :
            </Text>
          </Col>
          <Col span={17}>
            <Paragraph copyable className="m-0">
              {transaction?.reference_no}
            </Paragraph>
          </Col>
        </Row>
        <Row align="middle">
          <Col span={7}>
            <Text type="secondary" className="fw-medium">
              TRANSACTION TYPE :
            </Text>
          </Col>
          <Col span={17}>
            <Text style={{ fontSize: "16px", textTransform: "capitalize" }}>
              {transaction?.transaction_type}
            </Text>
          </Col>
        </Row>
        <Row align="middle">
          <Col span={7}>
            <Text type="secondary" className="fw-medium">
              TOTAL AMOUNT :
            </Text>
          </Col>
          <Col span={17}>
            <Text style={{ fontSize: "16px" }}>
              {transaction?.total_amount?.toFixed(2)}
            </Text>
          </Col>
        </Row>
      </Space>

      <div className="my-3">
        <Button
          color="green"
          variant="solid"
          onClick={() => {
            dispatch(getcashTransactionLogDetails(transaction?.id));
            setLogsVisible(!logsVisible);
          }}
        >
          {logsVisible ? "Hide Logs" : "Show Logs"}
        </Button>
      </div>
      {logsVisible && (
        <Table
          loading={cashTransactionLogLoading}
          columns={columns}
          dataSource={getcashTransactionLogDetailsData}
          pagination={false}
          size="middle"
          scroll={{
            x: 400,
            y: 400,
          }}
          tableLayout="fixed"
        />
      )}
    </Modal>
  );
};

export default TransactionDetailModal;
