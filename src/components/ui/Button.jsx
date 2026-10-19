import Icon from "./Icon";

export default function Button({
  variant = "secondary",
  icon,
  iconSize = 16,
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`${variant} ${className}`.trim()}
      {...props}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </button>
  );
}
