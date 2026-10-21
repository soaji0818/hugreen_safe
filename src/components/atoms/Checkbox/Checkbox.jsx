import { forwardRef } from "react";
import "./Checkbox.css";

//사이즈와 모양
const checkboxSizes = new Set(["small", "medium", "large"]);
const checkboxShapes = new Set(["circle", "square"]); //라디오: circle, 체크박스: square

// 설정값
const Checkbox = forwardRef(function Checkbox({
  inputType = "checkbox",
  shape = "auto",
  size = "medium",
  name,
  value,
  checked,
  defaultChecked,
  onChange,
  children,
  className = "",
  inputClassName = "",
  disabled = false,
  ...inputProps
}, ref) {
  const type = inputType === "radio" ? "radio" : "checkbox";
  const normalizedShape = String(shape).toLowerCase();
  const controlShape = checkboxShapes.has(normalizedShape)
    ? normalizedShape
    : type === "radio" ? "circle" : "square";
  const normalizedSize = checkboxSizes.has(size) ? size : "medium";
  const input = (
    <input
      {...inputProps}
      ref={ref}
      className={`checkbox__control checkbox__control--${controlShape} checkbox__control--${normalizedSize} ${children == null ? className : inputClassName}`.trim()}
      type={type}
      name={name}
      value={value}
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onChange}
    />
  );

  if (children === undefined || children === null) return input;

  const optionClass = type === "radio" ? "radio-option" : "checkbox-option";
  return (
    <label className={`${optionClass} checkbox ${optionClass}--${controlShape} ${className}`.trim()}>
      {input}
      <span>{children}</span>
    </label>
  );
});

export default Checkbox;
