import { useEffect, useRef } from "react";

export default function Toast({
  open,
  message,
  duration = 3500,
  onClose,
}) {
  const toastRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const toast = toastRef.current;
    if (!toast || typeof toast.showPopover !== "function") return;

    if (open && !toast.matches(":popover-open")) toast.showPopover();
    if (!open && toast.matches(":popover-open")) toast.hidePopover();
  }, [open]);

  useEffect(() => {
    if (!open || !message || duration <= 0) return undefined;
    const timer = window.setTimeout(() => onCloseRef.current?.(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, open]);

  return (
    <div
      ref={toastRef}
      className={`top-toast${open ? " is-open" : ""}`}
      popover="manual"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
