import { useLayoutEffect } from "react";

export default function useNativeDialog(dialogRef, open, { enabled = true } = {}) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [dialogRef, enabled, open]);
}
