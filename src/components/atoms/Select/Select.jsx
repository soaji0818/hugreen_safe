export default function Select({
  className = "",
  visibleOptions = 6,
  style,
  children,
  ...props
}) {
  return (
    <select
      className={`ui-select ${className}`.trim()}
      style={{ "--select-visible-options": visibleOptions, ...style }}
      {...props}
    >
      {children}
    </select>
  );
}
