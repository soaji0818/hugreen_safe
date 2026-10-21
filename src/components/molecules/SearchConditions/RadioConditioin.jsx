import { useId } from "react";
import RadioOption from "../../atoms/RadioOption/RadioOption";
import "./SearchConditions.css";

export default function RadioConditioin({
  label,
  name,
  value,
  options = [],
  onChange,
  disabled = false,
  className = "",
}) {
  const generatedName = useId();

  return (
    <div className={`search-condition search-condition--radio ${className}`.trim()}>
      <span className="search-condition__label">{label}</span>
      <div className="search-condition__content search-condition__radios" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <RadioOption
            key={option.value}
            name={name || generatedName}
            value={option.value}
            checked={value === option.value}
            disabled={disabled || option.disabled}
            onChange={() => onChange?.(option.value)}
          >
            {option.label}
          </RadioOption>
        ))}
      </div>
    </div>
  );
}
