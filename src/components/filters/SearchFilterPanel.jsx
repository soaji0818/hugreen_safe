import Icon from "../ui/Icon";

export default function SearchFilterPanel({
  ariaLabel,
  className = "",
  keyword = "",
  keywordPlaceholder = "이벤트 ID, 설비명, 위치 검색",
  onKeywordChange,
  onReset,
  children,
}) {
  return (
    <form
      className={`filter-panel ${className}`.trim()}
      aria-label={ariaLabel}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="filter-actions">
        <label className="filter-keyword">
          <Icon name="search" size={15} />
          <input
            aria-label="통합 검색"
            placeholder={keywordPlaceholder}
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </label>
        <button type="button" className="text-btn" onClick={onReset}>
          <Icon name="reset" size={15} />
          초기화
        </button>
      </div>
      {children}
    </form>
  );
}
