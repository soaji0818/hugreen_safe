import { useId } from "react";
import RadioOption from "../../atoms/RadioOption/RadioOption";
import "./SearchConditions.css";

const DEFAULT_PERIODS = [
  { value: "today", label: "당일" },
  { value: "week", label: "1주일" },
  { value: "month", label: "1개월" },
  { value: "threeMonths", label: "3개월" },
  { value: "sixMonths", label: "6개월" },
];

export default function DateCondition({
  label = "조회기간",
  startDate,
  endDate,
  period = "",
  periods = DEFAULT_PERIODS,
  onStartDateChange,
  onEndDateChange,
  onPeriodChange,
  disabled = false,
  className = "",
}) {
  const radioName = useId();

  return (
    <div className={`search-condition search-condition--date search-condition--radio ${className}`.trim()}>
      <span className="search-condition__label">{label}</span>
      <div className="search-condition__content search-condition__date-content">
        <div className="search-condition__date-range">
          <input
            type="date"
            aria-label={`${label} 시작일`}
            value={startDate}
            max={endDate || undefined}
            disabled={disabled}
            onChange={(event) => onStartDateChange?.(event.target.value)}
          />
          <span className="search-condition__date-separator" aria-hidden="true">–</span>
          <input
            type="date"
            aria-label={`${label} 종료일`}
            value={endDate}
            min={startDate || undefined}
            disabled={disabled}
            onChange={(event) => onEndDateChange?.(event.target.value)}
          />
        </div>
        <div className="search-condition__periods" role="radiogroup" aria-label={`${label} 빠른 선택`}>
          {periods.map((option) => (
            <RadioOption
              key={option.value}
              name={radioName}
              value={option.value}
              checked={period === option.value}
              disabled={disabled || option.disabled}
              onChange={() => onPeriodChange?.(option.value)}
            >
              {option.label}
            </RadioOption>
          ))}
        </div>
      </div>
    </div>
  );
}

DateCondition.gridSpan = "full";
