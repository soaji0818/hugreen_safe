import "./Loader.css";

export default function Loader({
  size = 36,
  color = "#159B83",
  label = "불러오는 중",
  className = "",
}) {
  const loaderSize = typeof size === "number" && Number.isFinite(size) && size > 0 ? `${size}px` : size;

  return (
    <span
      className={`loader ${className}`.trim()}
      role="status"
      aria-label={label}
      style={{ "--loader-size": loaderSize, color }}
    >
      <svg className="loader__ring" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="var(--loader-track-color, #B8E4D9)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="77 101"
          transform="rotate(-105 20 20)"
        />
      </svg>
    </span>
  );
}
