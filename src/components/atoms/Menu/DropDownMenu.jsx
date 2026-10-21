// 드롭다운메뉴 컴포넌트
// 드롭다운 메뉴를 사용해 항목을 선택하거나 상태를 확인하고 변경
// 버튼 클릭이나 입력과 같은 사용자 동작에 따라 메뉴를 열고 닫을 수 있어서 동적인 UI를 쉽게 구현 가능
import "./DropDownMenu.css";

// 드롭다운 열리는 방향
const MENU_POSITION_AREAS = {
  top: "block-start",
  bottom: "block-end",
  left: "left",
  right: "right",
};

// 드롭다운 메뉴 설정값
export default function DropDownMenu({
  className = "",
  visibleOptions = 6,
  direction = "bottom",
  style,
  children,
  ...props
}) {
  const positionArea = MENU_POSITION_AREAS[direction] || MENU_POSITION_AREAS.bottom;

// 드롭다운 UI는 native <select>를 사용합니다.
  return (
    <select
      className={`ui-select ${className}`.trim()}
      style={{
        "--select-visible-options": visibleOptions,
        "--dropdown-menu-position-area": positionArea,
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
}
