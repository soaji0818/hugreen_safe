import { useId } from "react";
import "./CountedInput.css";

export default function CountedInput({ value = "", maxLength, className = "", ...props }) {
  const countId = useId();
  const describedBy = [props["aria-describedby"], countId].filter(Boolean).join(" ");

  return (
    <span className={`counted-input ${className}`.trim()}>
      <input
        {...props}
        type="text"
        value={value}
        maxLength={maxLength}
        aria-describedby={describedBy}
      />
      <span id={countId} className="counted-input__count">{value.length}/{maxLength}</span>
    </span>
  );
}
