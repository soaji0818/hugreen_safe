import { Children } from "react";
import Button from "../../atoms/Button/Button";
import { ResetIcon, SearchIcon } from "../../atoms/Icon/Icon";
import "./SearchConditions.css";

function normalizeColumns(columns, automaticColumns) {
  if (columns === undefined || columns === null || columns === "auto") {
    return automaticColumns;
  }

  const parsedColumns = Number.parseInt(columns, 10);
  return Number.isFinite(parsedColumns)
    ? Math.max(1, Math.min(parsedColumns, 12))
    : automaticColumns;
}

export function SearchConditionsRow({ columns, className = "", children }) {
  const conditionChildren = Children.toArray(children);
  const automaticColumns = Math.max(
    1,
    conditionChildren.filter((child) => child.type?.gridSpan !== "full").length,
  );
  const columnCount = normalizeColumns(columns, automaticColumns);

  return (
    <div
      className={`search-conditions__grid ${className}`.trim()}
      style={{ "--search-condition-columns": columnCount }}
    >
      {conditionChildren}
    </div>
  );
}

export default function SearchConditions({
  columns,
  ariaLabel,
  keyword = "",
  keywordPlaceholder = "검색어를 입력하세요",
  onKeywordChange,
  showKeyword = Boolean(onKeywordChange),
  onReset,
  showReset = true,
  resetLabel = "초기화",
  title = "조회조건",
  startAction,
  endAction,
  className = "",
  children,
}) {
  const conditionChildren = Children.toArray(children);
  const hasExplicitRows = conditionChildren.some(
    (child) => child.type === SearchConditionsRow,
  );

  return (
    <form
      className={`search-conditions ${className}`.trim()}
      aria-label={ariaLabel || title || undefined}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="search-conditions__actions">
        {startAction || (title && <span className="search-conditions__heading">{title}</span>)}
        {showKeyword && onKeywordChange && (
          <label className="filter-keyword search-conditions__keyword">
            <SearchIcon size={15} aria-hidden="true" />
            <input
              aria-label="통합 검색"
              placeholder={keywordPlaceholder}
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
          </label>
        )}
        {endAction || (showReset && (
          <Button
            type="button"
            variant="text"
            size="small"
            className="search-conditions__reset"
            icon={ResetIcon}
            iconSize={15}
            onClick={onReset}
          >
            {resetLabel}
          </Button>
        ))}
      </div>
      <div className="search-conditions__rows">
        {hasExplicitRows
          ? conditionChildren
          : <SearchConditionsRow columns={columns}>{conditionChildren}</SearchConditionsRow>}
      </div>
    </form>
  );
}

SearchConditions.Row = SearchConditionsRow;
