import { useState, useEffect, useRef, useMemo } from "react";
import { Space, Tooltip } from "antd";
import {
  AudioOutlined,
  PhoneOutlined,
  PhoneFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";

import { Select } from "antd";
import { getSessionItem } from "../../hooks/session";
import { useSelector } from "react-redux";
import { selectLatestMessage } from "../../redux/reducers/MQTT/mqttSlice";
const { Option } = Select;

const videoModeIcons = {
  monitor: <EyeInvisibleOutlined style={{ marginRight: 8 }} />,
  live: <EyeOutlined style={{ marginRight: 8 }} />,
  full: <FullscreenOutlined style={{ marginRight: 8 }} />,
};

const videoModeLabels = {
  monitor: "Monitor",
  live: "Live",
  full: "Full",
};

const VideoControls = ({
  disconnectOn,
  isAudioMuted,
  toggleDisconnect,
  setIsAudioMuted,
  userHotelSession,
  kioskSession,
  dispatch,
  callMQTTAction,
  videoMode,
  handleVideoModeChange,
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stream, setStream] = useState(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphone = useRef(null);
  const animationFrameRef = useRef(null);
  const laneClosed = getSessionItem("laneClosedStatus");
  const latestMessage = useSelector(selectLatestMessage);
 
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
  
  useEffect(() => {
    // Initialize audio level detection
    const initAudioLevelDetection = async () => {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(audioStream);

        // Create new audio context
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        microphone.current =
          audioContextRef.current.createMediaStreamSource(audioStream);

        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
        microphone.current.connect(analyserRef.current);

        const detectAudioLevel = () => {
          if (!analyserRef.current) return;

          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          );
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate RMS for better voice detection
          const rms = Math.sqrt(
            dataArray.reduce((acc, val) => acc + val * val, 0) /
              dataArray.length
          );

          const normalizedLevel = Math.min(rms / 128, 1); // Normalize to 0-1

          setAudioLevel(normalizedLevel);
          setIsSpeaking(normalizedLevel > 0.05);

          animationFrameRef.current = requestAnimationFrame(detectAudioLevel);
        };

        detectAudioLevel();
      } catch (error) {
        // console.error("Error accessing microphone:", error);
      }
    };

    // Cleanup function
    const cleanup = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }

      if (microphone.current) {
        microphone.current.disconnect();
        microphone.current = null;
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };

    if (!isAudioMuted) {
      initAudioLevelDetection();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isAudioMuted]);

  const controlButtonStyle = {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
    outline: "none",
    position: "relative",
    backgroundColor: "rgba(32, 33, 36, 0.75)",
    backdropFilter: "blur(32px)",
    WebkitBackdropFilter: "blur(32px)",
  };

  const endCallButtonStyle = {
    ...controlButtonStyle,
    width: "56px",
    height: "56px",
    backgroundColor: "#ea4335",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
  };

  // Google Meet style speaking animation
  const SpeakingAnimation = () => {
    if (isAudioMuted || !isSpeaking) return null;

    const waveStyle = (delay, scale) => ({
      position: "absolute",
      top: "50%",
      left: "50%",
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: `2px solid #34a853`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity: audioLevel * 0.8,
      animation: `soundWave 1.5s ease-out ${delay}s infinite`,
      pointerEvents: "none",
    });

    return (
      <>
        <div style={waveStyle(0, 1.3)} />
        <div style={waveStyle(0.5, 1.5)} />
        <div style={waveStyle(1, 1.7)} />
      </>
    );
  };

  useEffect(() => {
    if (laneClosed === "true") {
      toggleDisconnect(true);
    }
    if (
      kioskResponse?.cmd === "kiosk_close" &&
      kioskResponse?.response?.status 
    ) {
      toggleDisconnect(true);
    }
  }, [laneClosed]);

  // Audio level bars - Google Meet style
  const AudioLevelBars = () => {
    if (isAudioMuted || !isSpeaking) return null;

    const barPositions = [
      { x: -12, y: 0 },
      { x: 0, y: -12 },
      { x: 12, y: 0 },
    ];

    return (
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {barPositions.map((pos, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "3px",
              height: `${Math.max(8, audioLevel * 20)}px`,
              backgroundColor: "#34a853",
              transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
              borderRadius: "2px",
              transition: "height 0.1s ease-out",
              opacity: 0.8,
            }}
          />
        ))}
      </div>
    );
  };

  // Slash overlay for muted states
  const SlashOverlay = () => (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "2px",
          height: "35px",
          backgroundColor: "#601410",
          transform: "translate(-50%, -50%) rotate(-45deg)",
          borderRadius: "1px",
        }}
      />
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes soundWave {
            0% {
              opacity: 0.8;
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(2);
            }
          }

          .video-controls-wrapper {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 24px;
            background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
            z-index: 10;
          }

          .video-mode-dropdown .ant-select-item-option-content {
            color: #fff;
            display: flex;
            align-items: center;
          }

          .video-mode-dropdown .ant-select-item-option-active {
            background-color: #3c4043 !important;
          }

        `}
      </style>
      <div className="video-controls-wrapper">
        <div
          className="video-controls"
          style={{
            backgroundColor: "rgba(32, 33, 36, 0.75)",
            borderRadius: "24px",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            boxShadow:
              "0 1px 3px 0 rgba(0,0,0,0.3), 0 4px 8px 3px rgba(0,0,0,0.15)",
            display: "inline-block",
            padding: "16px 24px",
          }}
        >
          <Space size={16} align="center">
            <div
              style={{
                padding: "0 12px",
                backgroundColor: "rgba(60, 64, 67, 0.75)",
                borderRadius: "8px",
                minWidth: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "48px",
              }}
            >
              <Tooltip title="Call Screen Mode" placement="left">
                <Select
                  value={videoMode}
                  onChange={handleVideoModeChange}
                  variant="borderless"
                  dropdownStyle={{ backgroundColor: "#2c2c2e", color: "#fff" }}
                  popupClassName="video-mode-dropdown"
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    color: "#fff",
                  }}
                >
                  {["monitor", "live", "full"].map((mode) => (
                    <Option key={mode} value={mode}>
                      <span style={{ color: "#fff" }}>
                        {videoModeIcons[mode]}
                        {videoModeLabels[mode]}
                      </span>
                    </Option>
                  ))}
                </Select>
              </Tooltip>
            </div>

            {/* Audio Control with Google Meet style */}
            <Tooltip
              title={
                isAudioMuted ? "Turn on microphone" : "Turn off microphone"
              }
            >
              <button
                style={{
                  ...controlButtonStyle,
                  backgroundColor: isAudioMuted
                    ? "#e5cdcb"
                    : "rgba(60, 64, 67, 0.75)",
                }}
                onClick={() => {
                  const newMuteState = !isAudioMuted;
                  setIsAudioMuted(newMuteState);

                  if (window.jitsiApi) {
                    window.jitsiApi.executeCommand("toggleAudio");
                  }

                  dispatch(
                    callMQTTAction({
                      cmd: newMuteState ? "mute" : "unmute",
                      payload: {
                        agent_user_id: userHotelSession?.id,
                      },
                      device_uuid_list: [kioskSession?.[0]?.device_id],
                    })
                  );
                }}
                onMouseEnter={(e) => {
                  if (!isAudioMuted) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(95, 99, 104, 0.75)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isAudioMuted
                    ? "#e5cdcb"
                    : "rgba(60, 64, 67, 0.75)";
                }}
              >
                <AudioLevelBars />
                <SpeakingAnimation />
                <AudioOutlined
                  style={{
                    fontSize: "24px",
                    color: isAudioMuted ? "#601410" : "#ffffff",
                    zIndex: 2,
                    position: "relative",
                  }}
                />
                {isAudioMuted && <SlashOverlay />}
              </button>
            </Tooltip>

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "28px",
                backgroundColor: "rgba(95, 99, 104, 0.5)",
                margin: "0 8px",
              }}
            />

            {/* End Call/Connect Control */}
            <Tooltip title={!disconnectOn ? "Leave call" : "Join call"}>
              <button
                style={{
                  ...endCallButtonStyle,
                  backgroundColor: !disconnectOn ? "#ea4335" : "#00897b",
                }}
                onClick={() => toggleDisconnect(!disconnectOn)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.08)";
                  if (!disconnectOn) {
                    e.currentTarget.style.backgroundColor = "#d33b2c";
                  } else {
                    e.currentTarget.style.backgroundColor = "#00796b";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor = !disconnectOn
                    ? "#ea4335"
                    : "#00897b";
                }}
              >
                {!disconnectOn ? (
                  <PhoneOutlined
                    style={{
                      fontSize: "26px",
                      color: "#ffffff",
                      transform: "rotate(135deg)",
                    }}
                  />
                ) : (
                  <PhoneFilled style={{ fontSize: "26px", color: "#ffffff" }} />
                )}
              </button>
            </Tooltip>
          </Space>
        </div>
      </div>
    </>
  );
};

export default VideoControls;
