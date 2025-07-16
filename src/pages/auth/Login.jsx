import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";
import React, { useEffect, useState } from "react";
import { Card, Input, Form, Button, Row, Col } from "antd";
import packageJson from "../../../package.json";

// Custom Components
import whiteLogo from "../../assets/images/WhiteLogo.png";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  loginAction,
  sendOtp,
} from "../../redux/reducers/UserLoginAndProfile/auth.js";
import { placeholders } from "../../utils/validation.js";
import {
  ArrowRightOutlined,
  MailOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { notification } from "../../helpers/middleware.js";

const Login = () => {
  const dispatch = useDispatch();

  const { loginLoading, responseId, otpEnterOption } = useSelector(
    ({ auth }) => auth
  );

  let [loginWithOtp, setLoginWithOtp] = useState(false);
  let [isSendingOTP, setIsSendingOTP] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resenData, setResenData] = useState("");

  useEffect(() => {
    let otpInterval;
    if (otpEnterOption && otpTimer > 0) {
      otpInterval = setInterval(() => {
        setOtpTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }

    return () => clearInterval(otpInterval);
  }, [otpEnterOption, otpTimer]);

  useEffect(() => {
    let resendInterval;
    if (otpEnterOption && resendTimer > 0) {
      resendInterval = setInterval(() => {
        setResendTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(resendInterval);
  }, [otpEnterOption, resendTimer]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    let visitorId = "";
    await getCurrentBrowserFingerPrint().then((fingerprint) => {
      visitorId = fingerprint;
    });
    const loginData = {
      ...data,
      platform: "Console-Web",
      device_data: { id: visitorId },
    };
    if (loginWithOtp) {
      if (!otpEnterOption) {
        delete loginData?.password;
        handleOTPLogin(loginData);
        setResenData(loginData);
      } else {
        const finalData = {
          email: data?.email,
          otp_number: data?.otp,
          auth_verification_otp_id: responseId,
          device_data: { id: visitorId },
          platform: "Console-Web",
        };
        handleLogin(finalData);
      }
    } else {
      handleLogin(loginData);
    }
  };
  const changeLoginType = () => {
    loginWithOtp = !loginWithOtp;
    setLoginWithOtp(loginWithOtp);
  };

  const handleLogin = async (loginData) => {
    await dispatch(loginAction(loginData));
  };

  const handleOTPLogin = async (loginData) => {
    try {
      const platformAdd = {
        ...loginData,
        platform: "Console-Web",
      };
      setIsSendingOTP(true);
      await dispatch(sendOtp(platformAdd));
      setIsSendingOTP(false);
      startTimers();
    } catch (error) {}
  };

  const startTimers = () => {
    setOtpTimer(90); // Set OTP timer to 90 seconds
    setResendTimer(90); // Set resend timer to 90 seconds
    setCanResend(false);
  };
  const handleResendOTP = () => {
    if (canResend) {
      dispatch(sendOtp(resenData));
      notification("OTP resend successfully", "success");
      startTimers();
    }
  };
  const formatTime = (time) => {
    const minutes = String(Math.floor(time / 60)).padStart(2, "0");
    const seconds = String(time % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };
  return (
    <div className="login-container responsive-container">
      <div className="login-background">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <Form
        onFinish={handleSubmit(onSubmit)}
        layout="vertical"
        className="w-100"
      >
        <Card className="login-card-wrapper responsive-card">
          <Row className="login-row responsive-row">
            <Col xs={24} md={12} className="login-left-col">
              <div className="brand-section">
                <div className="brand-logo">
                  <img src={whiteLogo} alt="logo" className="responsive-logo" />
                </div>
                <h1 className="brand-heading responsive-heading">
                  Kiosk <span className="highlight-text">Terminal</span>
                </h1>
                <p className="brand-text responsive-text">
                  Our platform streamlines your hotel operations and elevates
                  guest experiences through smart automation and personalized
                  touchpoints.
                </p>
                <div className="mt-auto m-2 opacity-50 responsive-version">
                  V {packageJson.version}
                </div>
              </div>
            </Col>

            <Col xs={24} md={12} className="login-right-col">
              <div className="login-form-container responsive-form">
                <div className="login-header responsive-header">
                  <h2 className="login-title responsive-title">Welcome Back</h2>
                  <p className="login-subtitle responsive-subtitle">
                    {!loginWithOtp
                      ? "Sign in to access your terminal"
                      : "We'll send a verification code to your email"}
                  </p>
                </div>

                <div className="login-form-fields responsive-fields">
                  <Form.Item
                    label="Email Address"
                    validateStatus={errors.email ? "error" : ""}
                    help={errors.email ? errors.email.message : ""}
                    className="responsive-form-item"
                  >
                    <Controller
                      name="email"
                      control={control}
                      defaultValue=""
                      rules={{
                        required: "Email is required",
                        pattern: {
                          value:
                            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/,
                          message: "Invalid email address",
                        },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          autoComplete="email"
                          placeholder={placeholders.emailp}
                          size="large"
                          className="custom-input responsive-input"
                          prefix={<MailOutlined className="input-icon" />}
                        />
                      )}
                    />
                  </Form.Item>

                  {!loginWithOtp && (
                    <Form.Item
                      label="Password"
                      validateStatus={errors.password ? "error" : ""}
                      help={errors.password ? errors.password.message : ""}
                      className="responsive-form-item"
                    >
                      <Controller
                        name="password"
                        control={control}
                        defaultValue=""
                        rules={{ required: "Password is required" }}
                        render={({ field }) => (
                          <Input.Password
                            {...field}
                            autoComplete="password"
                            placeholder={placeholders.passwordp}
                            size="large"
                            className="custom-input responsive-input"
                            prefix={<KeyOutlined className="input-icon" />}
                          />
                        )}
                      />
                    </Form.Item>
                  )}

                  {loginWithOtp && otpEnterOption && (
                    <Form.Item
                      label="Verification Code"
                      validateStatus={errors.otp ? "error" : ""}
                      help={errors.otp ? errors.otp.message : ""}
                      className="responsive-form-item"
                    >
                      <Controller
                        name="otp"
                        control={control}
                        defaultValue=""
                        rules={{ required: "OTP is required" }}
                        render={({ field }) => (
                          <Input.OTP
                            formatter={(str) => str.replace(/\D/g, "")}
                            length={6}
                            {...field}
                            size="large"
                            className="custom-otp responsive-otp"
                          />
                        )}
                      />
                    </Form.Item>
                  )}

                  {loginWithOtp && otpEnterOption && (
                    <div className="otp-timer-container responsive-timer">
                      {canResend ? (
                        <button
                          type="button"
                          className="resend-button responsive-button"
                          onClick={handleResendOTP}
                        >
                          Resend Code
                        </button>
                      ) : (
                        <p className="timer-text responsive-text">
                          Resend available in{" "}
                          <span className="timer-count">
                            {formatTime(resendTimer)}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    type="primary"
                    size="large"
                    className="signin-button responsive-signin-button"
                    htmlType="submit"
                    loading={loginLoading}
                  >
                    {loginWithOtp
                      ? isSendingOTP
                        ? "Sending Code..."
                        : otpEnterOption
                        ? "Verify & Sign In"
                        : "Send Verification Code"
                      : "Sign In"}
                    <ArrowRightOutlined className="button-icon" />
                  </Button>

                  <div className="auth-divider responsive-divider">
                    <span>Or</span>
                  </div>

                  <Button
                    className="toggle-auth-button responsive-toggle-button"
                    size="large"
                    onClick={changeLoginType}
                  >
                    {loginWithOtp
                      ? "Use Password Instead"
                      : "Sign In With Email Verification"}
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default Login;
