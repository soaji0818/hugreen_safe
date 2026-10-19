//confirm dialog 컴포넌트
//ConfirmDialog 컴포넌트는 사용자의 액션이나 선택이 필요한 상황에서 사용되는 인터페이스를 제공 
//확인과 취소, 두 개의 버튼을 통해 사용자가 명확한 선택을 할 수 있도록 도와줌
import { useEffect, useId, useRef } from "react";
import Button from "./Button";

//설정값
export default function ConfirmDialog({
  open, // 팝업 열림 여부
  title, //제목 
  description, // 안내문구
  cancelLabel = "취소", //취소 버튼 텍스트
  cancelDisabled = false, // 취소 버튼 활성화 여부
  confirmLabel = "확인", //확인 버튼 텍스트
  confirmVariant = "primary", //확인 버튼 스타일
  confirmDisabled = false, // 확인 버튼 활성화 여부
  onCancel, // 취소했을때 실행할 함수
  onConfirm, // 확인했을때 실행할 함수
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

  // 확인 팝업 화면 구성
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
