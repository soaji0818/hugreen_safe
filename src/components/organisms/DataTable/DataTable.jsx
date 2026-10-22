// 데이터 테이블 컴포넌트
// 선택 가능한 행, 정렬, 열 크기 조절, 툴바 액션 등을 지원하는 테이블 컴포넌트
import { Children, Fragment, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../../atoms/Button/Button";
import Checkbox from "../../atoms/Checkbox/Checkbox";
import Loader from "../../atoms/Loader/Loader";
import TableEmptyState from "../../molecules/EmptyState/TableEmptyState";
import useColumnResize from "../../../hooks/useColumnResize";
import "./DataTable.css";

const VIRTUAL_ROW_HEIGHT = 40;
const VIRTUAL_HEADER_HEIGHT = 34;
const VIRTUAL_OVERSCAN = 8;

// TruncatedCellText 컴포넌트는 셀의 텍스트가 잘리는 경우, 마우스 오버 시 전체 텍스트를 보여주는 기능 제공
function TruncatedCellText({ value, onReveal, onHide }) {
  const textRef = useRef(null);
  const [truncated, setTruncated] = useState(false);  

  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) return undefined;

    // 잘렸는지 검사
    const updateTruncation = () => {
      setTruncated(text.scrollWidth > text.clientWidth + 1);
    };
    updateTruncation();
    const resizeObserver = new ResizeObserver(updateTruncation);
    resizeObserver.observe(text);
    return () => resizeObserver.disconnect();
  }, [value]);

  // 마우스 오버, 포커스 시 전체 텍스트를 보여주는 기능
  return (
    <span
      ref={textRef}
      className={`table-cell-text${truncated ? " is-truncated" : ""}`}
      tabIndex={truncated ? 0 : -1}
      onMouseEnter={(event) => {
        if (truncated) onReveal(value, event.currentTarget);
      }}
      onMouseLeave={() => {
        if (document.activeElement !== textRef.current) onHide();
      }}
      onFocus={(event) => {
        if (truncated) onReveal(value, event.currentTarget);
      }}
      onBlur={() => {
        if (!textRef.current?.matches(":hover")) onHide();
      }}
    >
      {value}
    </span>
  );
}

function normalizeColumn(column) {
  if (typeof column === "string") {
    return { key: column, label: column };
  }

  return {
    key: column.key ?? column.label,
    label: column.label ?? column.key,
    width: column.width,
  };
}

// 툴바 버튼 크기 설정 (small)
function sizeToolbarButtons(actions) {
  return Children.map(actions, (action) => {
    if (!isValidElement(action)) return action;
    if (action.type === Button) {
      return cloneElement(action, { size: action.props.size ?? "small" });
    }
    if (action.type === Fragment) {
      return cloneElement(action, { children: sizeToolbarButtons(action.props.children) });
    }
    return action;
  });
}

// 설정값
export default function DataTable({
  columns,
  rows,
  selectable = true,
  totalCount = rows.length,
  toolbarActions,
  showToolbar = true,
  selectedId,
  selectedIds = [],
  sortColumn,
  sortAscending = false,
  onSort,
  onRowClick,
  onRowDoubleClick,
  onToggleRow,
  onToggleAll,
  renderCell,
  stateRow,
  emptyState,
  loading = false,
  loadingLabel = "목록 불러오는 중",
  emptyResetLabel,
  onEmptyReset,
  resizableColumns = false,
  verticalScroll = false,
  virtualizeRows = false,
  className = "",
}) {
  const displayRows = loading ? [] : rows;
  const scrollRef = useRef(null);
  const [virtualViewport, setVirtualViewport] = useState({ firstRow: 0, height: 600 });
  const isVirtualized = virtualizeRows && verticalScroll && !loading && !stateRow && displayRows.length > 0;
  const firstVisibleRow = isVirtualized ? Math.min(displayRows.length - 1, virtualViewport.firstRow) : 0;
  const virtualStart = isVirtualized ? Math.max(0, firstVisibleRow - VIRTUAL_OVERSCAN) : 0;
  const virtualEnd = isVirtualized
    ? Math.min(displayRows.length, firstVisibleRow + Math.ceil(virtualViewport.height / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN)
    : displayRows.length;
  const renderedRows = isVirtualized ? displayRows.slice(virtualStart, virtualEnd) : displayRows;
  const virtualTopHeight = virtualStart * VIRTUAL_ROW_HEIGHT;
  const virtualBottomHeight = (displayRows.length - virtualEnd) * VIRTUAL_ROW_HEIGHT;
  const tableColumns = columns.map(normalizeColumn);
  const hasColumnWidths = tableColumns.some((column) => column.width != null);
  const fixedTableWidth = tableColumns.length > 0 && tableColumns.every((column) => typeof column.width === "number" && column.width > 0)
    ? tableColumns.reduce((width, column) => width + column.width, selectable ? 42 : 0)
    : null;
  // 컬럼 너비 조절 hook
  const {
    columnWidths,
    tableWidth,
    startResize,
    moveResize,
    stopResize,
    resizeWithKeyboard,
    resetColumnWidths,
  } = useColumnResize(tableColumns);

  // 선택된 행 상태 관리
  const [revealedText, setRevealedText] = useState(null);
  const selectAllRef = useRef(null);
  useEffect(() => {
    if (!virtualizeRows || !verticalScroll || !scrollRef.current) return undefined;
    const scrollElement = scrollRef.current;
    const updateViewport = () => {
      const firstRow = Math.floor(Math.max(0, scrollElement.scrollTop - VIRTUAL_HEADER_HEIGHT) / VIRTUAL_ROW_HEIGHT);
      const height = scrollElement.clientHeight;
      setVirtualViewport((current) => current.firstRow === firstRow && current.height === height
        ? current
        : { firstRow, height });
    };
    const observer = new ResizeObserver(updateViewport);
    observer.observe(scrollElement);
    const frame = requestAnimationFrame(updateViewport);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [virtualizeRows, verticalScroll]);

  useEffect(() => {
    if (virtualizeRows && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [rows, virtualizeRows]);

  const visibleRowIds = displayRows.map((row) => row.id);
  const selectedVisibleCount = visibleRowIds.filter((id) => selectedIds.includes(id)).length;
  const allVisibleRowsSelected = visibleRowIds.length > 0 && selectedVisibleCount === visibleRowIds.length;
  const someVisibleRowsSelected = selectedVisibleCount > 0 && !allVisibleRowsSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleRowsSelected;
    }
  }, [someVisibleRowsSelected]);

  // 팝오버 닫기
  useEffect(() => {
    if (!revealedText) return undefined;
    const close = () => setRevealedText(null);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [revealedText]);

  // 팝오버 열기
  const revealCellText = (text, target) => {
    const rect = target.getBoundingClientRect();
    const maxWidth = Math.min(420, window.innerWidth - 24);
    const openAbove = rect.bottom + 140 > window.innerHeight && rect.top > 140;
    setRevealedText({
      text,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - maxWidth - 12)),
      top: openAbove ? rect.top - 8 : rect.bottom + 6,
      maxWidth,
      openAbove,
    });
  };

  // 전체 선택/해제 토글
  const toggleAllRows = (checked) => {
    if (onToggleAll) {
      onToggleAll(visibleRowIds, checked);
      return;
    }

    visibleRowIds
      .filter((id) => checked ? !selectedIds.includes(id) : selectedIds.includes(id))
      .forEach((id) => onToggleRow?.(id));
  };

  const tableClassName = [
    selectable ? "" : "no-row-selection",
    resizableColumns ? "resizable-table" : "",
    hasColumnWidths ? "has-column-widths" : "",
    columnWidths.length ? "columns-resized" : "",
    isVirtualized ? "is-virtualized" : "",
  ].filter(Boolean).join(" ");

  const scrollClassName = [
    "table-scroll",
    className,
    verticalScroll ? "data-table-vertical-scroll" : "",
    loading ? "is-loading" : "",
    resizableColumns ? "resizable-table-scroll" : "",
    columnWidths.length ? "columns-resized-scroll" : "",
  ].filter(Boolean).join(" ");
  const resolvedTableWidth = tableWidth ?? fixedTableWidth;

//데이터 테이블 구현
  return (
    <div className="data-table">
      {showToolbar && (
        <div className="list-actions data-table-toolbar" aria-label="목록 작업">
          <span className="table-result-count" role="status">총 {loading ? 0 : totalCount}건</span>
          {toolbarActions && (
            <div className="data-table-toolbar__actions">{sizeToolbarButtons(toolbarActions)}</div>
          )}
        </div>
      )}
      <div
      ref={scrollRef}
      className={scrollClassName}
      tabIndex={0}
      aria-busy={loading}
      aria-label={verticalScroll ? "결과 표 스크롤" : "결과 표 가로 스크롤"}
      onScroll={isVirtualized ? (event) => {
        const firstRow = Math.floor(Math.max(0, event.currentTarget.scrollTop - VIRTUAL_HEADER_HEIGHT) / VIRTUAL_ROW_HEIGHT);
        setVirtualViewport((current) => current.firstRow === firstRow ? current : { ...current, firstRow });
      } : undefined}
    >
      <table
        className={tableClassName || undefined}
        aria-rowcount={isVirtualized ? displayRows.length + 1 : undefined}
        style={resolvedTableWidth != null ? {
          width: `${resolvedTableWidth}px`,
          minWidth: "100%",
        } : undefined}
      >
        <colgroup>
          {selectable && <col className="selection-column-width" />}
          {tableColumns.map((column, index) => {
            const width = columnWidths[index] ?? column.width;
            return <col key={column.key} style={width != null ? { width } : undefined} />;
          })}
        </colgroup>
        <thead>
          <tr>
            {selectable && (
              <th className="selection-col" scope="col">
                <Checkbox
                  ref={selectAllRef}
                  inputType="checkbox"
                  shape="square"
                  aria-label={allVisibleRowsSelected ? "전체 선택 해제" : "전체 선택"}
                  checked={allVisibleRowsSelected}
                  disabled={visibleRowIds.length === 0}
                  onChange={(event) => toggleAllRows(event.target.checked)}
                />
              </th>
            )}
            {tableColumns.map((column, columnIndex) => (
              <th
                key={column.key}
                scope="col"
                data-column-index={columnIndex}
                aria-sort={column.key === sortColumn
                  ? sortAscending ? "ascending" : "descending"
                  : undefined}
              >
                {column.key === sortColumn ? (
                  <button type="button" className="sort-button" onClick={onSort}>
                    {column.label} {sortAscending ? "↑" : "↓"}
                  </button>
                ) : column.label}
                {resizableColumns && (
                  <span
                    className="column-resize-handle"
                    role="separator"
                    aria-label={`${column.label} 열 너비 조절`}
                    aria-orientation="vertical"
                    tabIndex={0}
                    onPointerDown={(event) => startResize(event, columnIndex)}
                    onPointerMove={moveResize}
                    onPointerUp={stopResize}
                    onPointerCancel={stopResize}
                    onKeyDown={(event) => resizeWithKeyboard(event, columnIndex)}
                    onDoubleClick={resetColumnWidths}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!loading && stateRow}
          {isVirtualized && virtualTopHeight > 0 && <tr className="data-table-spacer-row" aria-hidden="true"><td colSpan={tableColumns.length + (selectable ? 1 : 0)} style={{ height: virtualTopHeight }} /></tr>}
          {renderedRows.map((row, visibleIndex) => {
            const rowIndex = virtualStart + visibleIndex;
            const isSelected = selectable
              ? selectedIds.includes(row.id)
              : row.id === selectedId;
            return (
              <tr
                key={row.id}
                className={isSelected ? "selected" : ""}
                aria-rowindex={isVirtualized ? rowIndex + 2 : undefined}
                onClick={() => onRowClick?.(row.id)}
                onDoubleClick={() => onRowDoubleClick?.(row.id)}
              >
                {selectable && (
                  <td className="selection-cell">
                    <Checkbox
                      inputType="checkbox"
                      shape="square"
                      aria-label={`${row.id} 선택`}
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggleRow?.(row.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </td>
                )}
                {tableColumns.map((column, columnIndex) => {
                  const content = renderCell ? renderCell(row, column.key, rowIndex) : row[column.key];
                  const isText = typeof content === "string" || typeof content === "number";
                  return (
                    <td
                      key={column.key}
                      className={columnIndex === 0 && /ID|번호/.test(column.label) ? "identifier" : ""}
                    >
                      {isText ? (
                        <TruncatedCellText
                          value={String(content)}
                          onReveal={revealCellText}
                          onHide={() => setRevealedText(null)}
                        />
                      ) : content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {isVirtualized && virtualBottomHeight > 0 && <tr className="data-table-spacer-row" aria-hidden="true"><td colSpan={tableColumns.length + (selectable ? 1 : 0)} style={{ height: virtualBottomHeight }} /></tr>}
        </tbody>
      </table>
      {loading ? <div className="data-table-loading"><Loader label={loadingLabel} /></div> : !displayRows.length && !stateRow && (emptyState || (
        <TableEmptyState
          actionLabel={emptyResetLabel}
          onAction={onEmptyReset}
        />
      ))}
      {revealedText && createPortal(
        <div
          className="table-cell-popover"
          role="tooltip"
          style={{
            left: `${revealedText.left}px`,
            top: `${revealedText.top}px`,
            maxWidth: `${revealedText.maxWidth}px`,
            transform: revealedText.openAbove ? "translateY(-100%)" : undefined,
          }}
        >
          {revealedText.text}
        </div>,
        document.body,
      )}
      </div>
    </div>
  );
}
