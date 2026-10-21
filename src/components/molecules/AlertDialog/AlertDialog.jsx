//AlertDialog 컴포넌트
//AlertDialog 컴포넌트는 사용자에게 중요한 정보를 전달하고 단일 확인 버튼을 사용해서 알림을 닫을 수 있는 인터페이스를 제공
//주로 작업 완료 알림이나 상태 변경 알림 등 사용자에게 피드백을 제공할 때 사용

import { useId, useRef } from "react";
import useNativeDialog from "../../../hooks/useNativeDialog";
import Button from "../../atoms/Button/Button"; // 액션 버튼 컴포넌트 임포트
import "./AlertDialog.css";

export default function AlertDialog({
  open, // 다이얼로그 열림 여부
  title = "알려드릴게요", //제목
  description, //설명
  actionLabel = "확인하기", //액션 버튼 라벨
  onClose, //닫았을 때 실행 함수
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  // open 상태를 네이티브 다이얼로그에 반영한다.
  useNativeDialog(dialogRef, open);

  // 알림 다이얼로그 화면 구성
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
        <Button variant="weak" className="alert-dialog-action" onClick={onClose}>{actionLabel}</Button>
      </div>
    </dialog>
  );
}
