const badgeSizes = new Set(["xsmall", "small", "medium", "large"]);
const badgeVariants = new Set(["fill", "weak"]);
const badgeTones = new Set(["gray", "green", "amber", "red"]);

export default function Badge({
  children,
  size = "small",
  variant = "weak",
  tone = "neutral",
  className = "",
}) {
  const safeSize = badgeSizes.has(size) ? size : "small";
  const safeVariant = badgeVariants.has(variant) ? variant : "weak";
  const safeTone = badgeTones.has(tone) ? tone : "gray";

  return (
    <span className={`badge badge--${safeSize} badge--${safeVariant} badge--${safeTone} ${className}`.trim()}>
      {children}
    </span>
  );
}
