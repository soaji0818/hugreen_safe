export default function RadioOption({
  name,
  value,
  checked,
  onChange,
  children,
  className = "",
  disabled = false,
}) {
  return (
    <label className={`radio-option ${className}`.trim()}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span>{children}</span>
    </label>
  );
}
