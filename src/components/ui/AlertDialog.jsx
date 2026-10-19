import { useEffect, useId, useRef } from "react";
import Button from "./Button";

export default function AlertDialog({
  open,
  title = "알려드릴게요",
  description,
  actionLabel = "확인하기",
  onClose,
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
      className="alert-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="alert-dialog-content">
        <h2 id={titleId}>{title}</h2>
        {description && <p id={descriptionId}>{description}</p>}
      </div>
      <div className="alert-dialog-actions">
        <Button variant="alert-dialog-action" onClick={onClose}>{actionLabel}</Button>
      </div>
    </dialog>
  );
}
