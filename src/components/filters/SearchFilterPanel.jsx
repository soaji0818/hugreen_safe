import { ResetIcon, SearchIcon } from "../ui/Icon";

export default function SearchFilterPanel({
  ariaLabel,
  className = "",
  keyword = "",
  keywordPlaceholder = "이벤트 ID, 설비명, 위치 검색",
  onKeywordChange,
  onReset,
  showKeyword = true,
  showReset = true,
  startAction,
  endAction,
  children,
}) {
  return (
    <form
      className={`filter-panel ${className}`.trim()}
      aria-label={ariaLabel}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={`filter-actions${showKeyword ? "" : " no-keyword"}`}>
        {startAction}
        {showKeyword && (
          <label className="filter-keyword">
            <SearchIcon size={15} aria-hidden="true" />
            <input
              aria-label="통합 검색"
              placeholder={keywordPlaceholder}
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
          </label>
        )}
        {showReset && (
          <button type="button" className="text-btn" onClick={onReset}>
            <ResetIcon size={15} aria-hidden="true" />
            초기화
          </button>
        )}
        {endAction && <div className="filter-actions-end">{endAction}</div>}
      </div>
      {children}
    </form>
  );
}
