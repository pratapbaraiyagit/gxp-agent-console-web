import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";

const Input = forwardRef(
  (
    {
      numDigits = 6,
      inputType = "text",
      inputClass = "",
      disabled = false,
      value = "",
      onChange,
      onPaste,
    },
    ref
  ) => {
    const inputRefs = useRef([]);

    useImperativeHandle(ref, () => ({
      focusInput: (index) => {
        if (index >= 0 && index < numDigits) {
          inputRefs.current[index]?.focus();
        }
      },
    }));

    useEffect(() => {
      const indexToFocus =
        value.split("").findIndex((char) => char === "") ?? value.length;
      if (indexToFocus < numDigits) {
        inputRefs.current[indexToFocus]?.focus();
      }
    }, [value, numDigits]);

    const handleChange = (e, index) => {
      const newDigit = e.target.value.slice(-1);
      onChange(index, newDigit, "input");
    };

    const handleKeyDown = (e, index) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (value[index]) {
          onChange(index, "", "backspace");
        } else if (index > 0) {
          onChange(index - 1, "", "backspace");
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < numDigits - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").slice(0, numDigits);

      if (onPaste) {
        onPaste(pastedData);
      } else {
        pastedData.split("").forEach((char, index) => {
          if (index < numDigits) {
            onChange(index, char, "input");
          }
        });
      }
    };

    return (
      <div
        className="modal-input d-flex align-items-center justify-content-center gap-2"
        onPaste={handlePaste}
      >
        {Array.from({ length: numDigits }, (_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type={inputType}
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`otp-input ${inputClass}`}
            disabled={disabled}
            autoComplete="off"
          />
        ))}
      </div>
    );
  }
);

export default Input;
