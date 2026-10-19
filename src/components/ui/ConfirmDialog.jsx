import { useEffect, useId, useRef } from "react";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel = "취소",
  cancelDisabled = false,
  confirmLabel = "확인",
  confirmVariant = "primary",
  confirmDisabled = false,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      className="confirm-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (!cancelDisabled) onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !cancelDisabled) onCancel();
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="confirm-dialog-content">
        <h2 id={titleId}>{title}</h2>
        {description && <p id={descriptionId}>{description}</p>}
      </div>
      <div className="confirm-dialog-actions">
        <Button variant="secondary" disabled={cancelDisabled} onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={confirmVariant} disabled={confirmDisabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
