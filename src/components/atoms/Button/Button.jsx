import "./Button.css";

const ICON_SIZE_BY_BUTTON_SIZE = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
};

const buttonSizes = new Set(["small", "medium", "large", "xlarge"]);
const buttonVariants = new Set(["fill", "weak", "text"]);

export default function Button({
  variant = "fill",
  size = "medium",
  disabled = false,
  icon,
  iconSize,
  className = "",
  type = "button",
  children,
  ...props
}) {
  const Icon = icon;
  const resolvedSize = buttonSizes.has(size) ? size : "medium";
  const resolvedVariant = buttonVariants.has(variant) ? variant : "fill";
  const resolvedIconSize =
    iconSize ?? ICON_SIZE_BY_BUTTON_SIZE[resolvedSize];
  const buttonClassName = [
    "ui-button",
    `ui-button--${resolvedSize}`,
    `ui-button--${resolvedVariant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClassName}
      disabled={disabled}
      {...props}
    >
      {Icon && (
        <Icon
          size={resolvedIconSize}
          aria-hidden="true"
          focusable="false"
        />
      )}
      {children}
    </button>
  );
}
