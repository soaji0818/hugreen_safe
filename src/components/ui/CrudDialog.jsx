import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from "react";
import Button from "./Button";
import Icon from "./Icon";

const resizeHandles = [
  { key: "n-left", direction: "n" },
  { key: "n-right", direction: "n" },
  ...["e", "s", "w", "ne", "se", "sw", "nw"].map((direction) => ({
    key: direction,
    direction,
  })),
];

const defaultTitles = {
  create: "등록",
  edit: "수정",
  detail: "상세 정보",
};

const CrudDialog = forwardRef(function CrudDialog({
  open,
  mode = "detail",
  titles = defaultTitles,
  formId,
  className = "",
  geometry,
  saving = false,
  saveLabel = "저장",
  savingLabel = "저장 중...",
  children,
  onClose,
  onSubmit,
  onEdit,
  onDelete,
  onInteractionStart,
  onInteractionMove,
  onInteractionEnd,
  resizable = false,
}, ref) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const editing = mode === "create" || mode === "edit";
  const title = titles[mode] || defaultTitles[mode];
  const showFooter = editing || Boolean(onEdit) || Boolean(onDelete);

  useImperativeHandle(ref, () => dialogRef.current);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`detail-dialog crud-dialog ${className}`.trim()}
      style={geometry ? {
        position: "fixed",
        inset: "auto",
        left: `${geometry.left}px`,
        top: `${geometry.top}px`,
        width: `${geometry.width}px`,
        height: `${geometry.height}px`,
        maxWidth: "none",
        maxHeight: "none",
        margin: 0,
      } : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      aria-labelledby={titleId}
    >
      <div className="detail-header">
        <div className="cctv-detail-heading">
          <h2 id={titleId}>{title}</h2>
        </div>
        {onInteractionStart && (
          <button
            type="button"
            className="cctv-dialog-drag-handle"
            aria-label="팝업 이동"
            onPointerDown={(event) => onInteractionStart(event, "drag")}
            onPointerMove={onInteractionMove}
            onPointerUp={onInteractionEnd}
            onPointerCancel={onInteractionEnd}
          />
        )}
        <button
          type="button"
          className="cctv-detail-close"
          aria-label={`${title} 닫기`}
          onClick={onClose}
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <form
        id={formId}
        className="detail-body"
        noValidate
        onSubmit={onSubmit}
      >
        {children}
      </form>

      {showFooter && (
        <div className="detail-footer">
          {!editing && onDelete ? (
            <Button variant="danger-button" type="button" onClick={onDelete}>
              삭제
            </Button>
          ) : <span />}
          <div>
            {editing ? (
              <Button
                variant="primary"
                type="submit"
                form={formId}
                disabled={saving}
              >
                {saving ? savingLabel : saveLabel}
              </Button>
            ) : onEdit ? (
              <Button variant="primary" type="button" onClick={onEdit}>
                수정
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {resizable && resizeHandles.map(({ key, direction }) => (
        <span
          key={key}
          className={`cctv-dialog-resize-handle is-${key}`}
          aria-hidden="true"
          onPointerDown={(event) => onInteractionStart?.(event, direction)}
          onPointerMove={onInteractionMove}
          onPointerUp={onInteractionEnd}
          onPointerCancel={onInteractionEnd}
        />
      ))}
    </dialog>
  );
});

export default CrudDialog;
