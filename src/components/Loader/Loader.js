import { Spin } from "antd";
import React from "react";

export default function Loader() {
  return (
    <div className="d-flex align-items-center justify-content-center mct-loader">
      <Spin size="large">
        <span className="visually-hidden">Loading...</span>
      </Spin>
    </div>
  );
}
