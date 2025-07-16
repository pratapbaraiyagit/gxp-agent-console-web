import React from "react";
import { Button, Modal, Descriptions, Spin } from "antd";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

const OCRDetailsModal = ({
  oCRDetailsModel,
  setOCRDetailsModel,
  updateParentForm,
}) => {
  const { base64ToOCRLoading, base64ToOCRDetails } = useSelector(
    ({ idScannerSlice }) => idScannerSlice
  );

  const formatDate = (date) => {
    return date ? dayjs(date).format("YYYY-MM-DD") : "-";
  };

  return (
    <Modal
      title={<p>Document OCR Details</p>}
      footer={
        <Button
          type="primary"
          onClick={() => {
            const d = base64ToOCRDetails;

            updateParentForm({
              first_name: d?.first_name || "",
              last_name: d?.last_name || "",
              id_number: d?.doc_number || "",
              validity: d?.doc_expire_date
                ? dayjs(d.doc_expire_date).format("YYYY-MM-DD")
                : null,
              address: d?.address_line_first || "",
              city: d?.city || "",
              state: d?.state_name || "",
              zip_code: d?.zip_code || "",
              country: d?.county || "",
            });

            setOCRDetailsModel(false);
          }}
        >
          Confirm
        </Button>
      }
      open={oCRDetailsModel}
      onCancel={() => setOCRDetailsModel(false)}
      width={1200}
      maskClosable="false"
    >
      <Spin spinning={base64ToOCRLoading}>
        <Descriptions
          column={1}
          bordered
          size="small"
          labelStyle={{ fontWeight: 500, width: 160 }}
        >
          <Descriptions.Item label="First Name">
            {base64ToOCRDetails?.first_name}
          </Descriptions.Item>
          <Descriptions.Item label="Middle Name">
            {base64ToOCRDetails?.middle_name}
          </Descriptions.Item>
          <Descriptions.Item label="Last Name">
            {base64ToOCRDetails?.last_name}
          </Descriptions.Item>
          <Descriptions.Item label="Address">
            {base64ToOCRDetails?.address_line_first}
          </Descriptions.Item>
          <Descriptions.Item label="City">
            {base64ToOCRDetails?.city}
          </Descriptions.Item>
          <Descriptions.Item label="State">
            {base64ToOCRDetails?.state_name}
          </Descriptions.Item>
          <Descriptions.Item label="State Name">
            {base64ToOCRDetails?.state_name}
          </Descriptions.Item>
          <Descriptions.Item label="Zip Code">
            {base64ToOCRDetails?.zip_code}
          </Descriptions.Item>
          <Descriptions.Item label="Document Number">
            {base64ToOCRDetails?.doc_number}
          </Descriptions.Item>
          <Descriptions.Item label="Expiration Date">
            {formatDate(base64ToOCRDetails?.doc_expire_date)}
          </Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {formatDate(base64ToOCRDetails?.date_of_birth)}
          </Descriptions.Item>
          <Descriptions.Item label="Date of Issue">
            {formatDate(base64ToOCRDetails?.doc_issue_date)}
          </Descriptions.Item>
          <Descriptions.Item label="ID Type">
            {base64ToOCRDetails?.id_type}
          </Descriptions.Item>
          <Descriptions.Item label="County">
            {base64ToOCRDetails?.county || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Spin>
    </Modal>
  );
};

export default OCRDetailsModal;
