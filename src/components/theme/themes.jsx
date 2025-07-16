import { theme } from "antd";

const { defaultAlgorithm, darkAlgorithm } = theme;

export const lightTheme = (tokens) => ({
  algorithm: defaultAlgorithm,
  token: {
    ...tokens,
    colorPrimary: "#2a5298",
    colorSuccess: "#10B981",
    colorWarning: "#F59E0B",
    colorError: "#E34A5A",
    colorInfo: "#06B6D4",
    colorLink: "",
  },
  components: {
    Layout: {
      siderBg: "#fff",
      headerBg: "#fff",
      bodyBg: "#fff",
      headerHeight: 50,
    },
    Button: {
      defaultShadow: "none",
      primaryShadow: "none",
    },
    Drawer: {
      zIndexPopup: 1010,
    },
  },
});
export const darkTheme = (tokens) => ({
  algorithm: darkAlgorithm,
  token: {
    ...tokens,
    colorPrimary: "#2a5298",
    colorSuccess: "#10B981",
    colorWarning: "#F59E0B",
    colorError: "#EF4444",
    colorInfo: "#06B6D4",
    colorLink: "",
  },
  components: {
    Layout: {
      siderBg: "#141414",
      headerBg: "#141414",
      bodyBg: "#141414",
      headerHeight: 50,
    },
    Button: {
      defaultShadow: "none",
      primaryShadow: "none",
    },
    Drawer: {
      zIndexPopup: 1010,
    },
    Modal: {
      contentBg: "#141414",
      headerBg: "#141414",
      footerBg: "#141414",
      titleColor: "rgba(255, 255, 255, 0.88)",
      headerBorderColor: "#303030",
      footerBorderColor: "#303030",
      maskBg: "rgba(0, 0, 0, 0.45)",
    },
  },
});
