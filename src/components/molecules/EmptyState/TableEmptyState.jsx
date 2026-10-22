// 테이블 빈 상태 표시 컴포넌트
import { SearchIcon } from "../../atoms/Icon/Icon";
import Button from "../../atoms/Button/Button";
import "./TableEmptyState.css";

// 설정값
export default function TableEmptyState({
  actionLabel = "조건 초기화",
  onAction,
}) {
  // 구현
  return (
    <section className="table-empty-state" role="status">
      <SearchIcon className="table-empty-state__icon" aria-hidden="true" />
      <h2 className="table-empty-state__title">검색 결과가 없습니다</h2>
      <p className="table-empty-state__description">검색 조건을 변경하거나 초기화해 주세요.</p>
      {onAction && (
        <Button
          className="table-empty-state__action"
          size="medium"
          variant="weak"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </section>
  );
}
