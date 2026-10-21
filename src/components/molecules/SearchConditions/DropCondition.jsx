import Select from "../../atoms/Select/Select";
import "./SearchConditions.css";

export default function DropCondition({
  label,
  value,
  options = [],
  placeholder,
  onChange,
  disabled = false,
  className = "",
}) {
  return (
    <label className={`search-condition ${className}`.trim()}>
      <span className="search-condition__label">{label}</span>
      <span className="search-condition__content">
        <Select
          aria-label={label}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </Select>
      </span>
    </label>
  );
}
