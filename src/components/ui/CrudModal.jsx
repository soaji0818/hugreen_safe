import {
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
} from "react";
import Button from "./button/button";
import { CloseIcon } from "./Icon";
import useNativeDialog from "../../hooks/useNativeDialog";

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

const CrudModal = forwardRef(function CrudModal({
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
  onCancelEdit,
  onInteractionStart,
  onInteractionMove,
  onInteractionEnd,
  resizable = false,
  presentation = "modal",
}, ref) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const editing = mode === "create" || mode === "edit";
  const title = titles[mode] || defaultTitles[mode];
  const sidePanel = presentation === "side-panel";
  const shrinkPanel = presentation === "shrink-panel";
  const bottomPanel = presentation === "bottom-panel";
  const showFooter = !bottomPanel && (editing || Boolean(onEdit) || Boolean(onDelete));
  const panel = sidePanel || shrinkPanel || bottomPanel;
  const Root = sidePanel || shrinkPanel ? "aside" : bottomPanel ? "section" : "dialog";

  useImperativeHandle(ref, () => dialogRef.current);

  useNativeDialog(dialogRef, open, { enabled: !panel });

  if (panel && !open) return null;

  return (
    <Root
      ref={dialogRef}
      className={`detail-dialog crud-dialog${sidePanel ? " crud-dialog--side-panel" : ""}${shrinkPanel ? " crud-dialog--shrink-panel" : ""}${bottomPanel ? " crud-dialog--bottom-panel" : ""} ${className}`.trim()}
      style={!panel && geometry ? {
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
      role={sidePanel || shrinkPanel ? "dialog" : undefined}
      onCancel={!panel ? (event) => {
        event.preventDefault();
        onClose();
      } : undefined}
      onClick={!panel ? (event) => {
        if (event.target === dialogRef.current) onClose();
      } : undefined}
      aria-labelledby={titleId}
    >
      <div className="detail-header">
        <div className="cctv-detail-heading">
          <h2 id={titleId} className={bottomPanel ? "cctv-bottom-detail-title" : undefined} tabIndex={bottomPanel ? -1 : undefined}>{title}</h2>
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
        {bottomPanel ? (
          <div className="cctv-bottom-detail-actions">
            {editing ? (
              <>
                <Button variant="weak" type="button" onClick={onCancelEdit} disabled={saving}>취소</Button>
                <Button variant="fill" type="submit" form={formId} disabled={saving}>
                  {saving ? savingLabel : saveLabel}
                </Button>
              </>
            ) : (
              <>
                {onDelete && <Button variant="fill" className="danger-button" type="button" onClick={onDelete}>삭제</Button>}
                {onEdit && <Button variant="weak" type="button" onClick={onEdit}>수정</Button>}
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="cctv-detail-close"
            aria-label={`${title} 닫기`}
            onClick={onClose}
          >
            <CloseIcon size={20} aria-hidden="true" />
          </button>
        )}
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
            <Button variant="fill" className="danger-button" type="button" onClick={onDelete}>
              삭제
            </Button>
          ) : <span />}
          <div>
            {editing ? (
              <Button
                variant="fill"
                type="submit"
                form={formId}
                disabled={saving}
              >
                {saving ? savingLabel : saveLabel}
              </Button>
            ) : onEdit ? (
              <Button variant="fill" type="button" onClick={onEdit}>
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
    </Root>
  );
});

export default CrudModal;
