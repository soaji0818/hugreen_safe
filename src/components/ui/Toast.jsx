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

    if (open) {
      if (!toast.matches(":popover-open")) toast.showPopover();
      toast.classList.remove("is-closing");
      toast.classList.add("is-open");
      return undefined;
    }

    if (!toast.matches(":popover-open")) {
      toast.classList.remove("is-open", "is-closing");
      return undefined;
    }

    toast.classList.remove("is-open");
    toast.classList.add("is-closing");
    const closeDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160;
    const closeTimer = window.setTimeout(() => {
      if (toast.matches(":popover-open")) toast.hidePopover();
      toast.classList.remove("is-closing");
    }, closeDelay);

    return () => window.clearTimeout(closeTimer);
  }, [open]);

  useEffect(() => {
    if (!open || !message || duration <= 0) return undefined;
    const timer = window.setTimeout(() => onCloseRef.current?.(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, open]);

  return (
    <div
      ref={toastRef}
      className="top-toast"
      popover="manual"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
