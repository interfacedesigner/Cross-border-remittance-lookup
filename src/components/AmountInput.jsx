import { useRef, useEffect } from "react";
import { MAX_AMOUNT, DEBOUNCE_MS, fonts, fontWeight as fw, radius } from "../styles/theme";
import { useTheme } from "../utils/useTheme";

export const AmountInput = ({ amount, setAmount }) => {
  const { c } = useTheme();
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!inputRef.current) return;
    if (document.activeElement === inputRef.current) return;
    inputRef.current.value = amount > 0 ? amount.toLocaleString() : "";
  }, [amount]);

  const parseAndSet = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    const v = parseInt(digits, 10);
    if (!isNaN(v) && v > 0 && v <= MAX_AMOUNT) {
      setAmount(v);
    } else {
      setAmount(0);
    }
  };

  const handleInput = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits.length > 9) {
      e.target.value = digits.slice(0, 9);
    } else if (raw !== digits) {
      e.target.value = digits;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => parseAndSet(e.target.value), DEBOUNCE_MS);
  };

  const handleBlur = (e) => {
    clearTimeout(timerRef.current);
    parseAndSet(e.target.value);
    const digits = e.target.value.replace(/[^0-9]/g, "");
    const v = parseInt(digits, 10);
    if (!isNaN(v) && v > 0) {
      e.target.value = v.toLocaleString();
    } else {
      e.target.value = "";
    }
    e.target.style.borderColor = c.borderInput;
    e.target.style.boxShadow = "none";
  };

  const handleFocus = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    e.target.value = digits === "0" ? "" : digits;
    e.target.style.borderColor = c.accent;
    e.target.style.boxShadow = `0 0 0 3px ${c.accentBorder}`;
    setTimeout(() => e.target.select(), 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      clearTimeout(timerRef.current);
      parseAndSet(e.target.value);
      e.target.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      defaultValue={amount > 0 ? amount.toLocaleString() : ""}
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="송금할 금액을 입력하세요"
      autoComplete="off"
      aria-label="송금 금액 (원화)"
      role="textbox"
      style={{
        width:"100%", boxSizing:"border-box",
        padding:"14px 16px", borderRadius:radius["2xl"],
        border:`1.5px solid ${c.borderInput}`,
        background:c.bgPrimary,
        color:c.text,
        fontSize:"clamp(20px, 6vw, 28px)", fontWeight:fw.bold,
        fontFamily:fonts.numeric,
        textAlign:"right", outline:"none",
        transition:"border-color 0.2s, box-shadow 0.2s",
        WebkitAppearance:"none",
        minHeight:"clamp(54px, 12vw, 60px)",
        letterSpacing:"0.5px",
      }}
    />
  );
};
