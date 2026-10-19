//설정값
const badgeSizes = new Set(["xsmall", "small", "medium", "large"]); // 사이즈
const badgeVariants = new Set(["fill", "weak"]); // 뱃지 스타일
const badgeTones = new Set(["gray", "green", "amber", "red"]); // 색상

// 잘못된 값이 들어오면 기본값으로 대체
export default function Badge({
  children,
  size = "small",
  variant = "weak",
  tone = "gray",
  className = "",
}) {
  const safeSize = badgeSizes.has(size) ? size : "small";
  const safeVariant = badgeVariants.has(variant) ? variant : "weak";
  const safeTone = badgeTones.has(tone) ? tone : "gray";

 // 뱃지 구성
  return (
    <span className={`badge badge--${safeSize} badge--${safeVariant} badge--${safeTone} ${className}`.trim()}>
      {children}
    </span>
  );
}
