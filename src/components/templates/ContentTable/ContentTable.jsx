// 조회조건 + 결과 영역을 배치하는 템플릿
import "./ContentTable.css";

// 첫 번째 자식은 조회조건, 두 번째 자식은 결과 영역에 배치한다.
export default function ContentTable({ className = "", children }) {
  return <div className={`content-table ${className}`.trim()}>{children}</div>;
}
