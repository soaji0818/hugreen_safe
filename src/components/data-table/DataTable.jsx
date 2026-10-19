import { useRef, useState } from "react";

const MIN_COLUMN_WIDTH = 72;

export default function DataTable({
  columns,
  rows,
  selectable = true,
  selectedId,
  selectedIds = [],
  sortColumn,
  sortAscending = false,
  onSort,
  onRowClick,
  onRowDoubleClick,
  onToggleRow,
  renderCell,
  stateRow,
  emptyState,
  resizableColumns = false,
  className = "",
}) {
  const [columnWidths, setColumnWidths] = useState([]);
  const [tableWidth, setTableWidth] = useState(null);
  const resizeState = useRef(null);

  const measureColumns = (table) => columns.map((_, index) =>
    table.querySelector(`th[data-column-index="${index}"]`)?.offsetWidth || MIN_COLUMN_WIDTH,
  );

  const resizeColumn = (widths, index, delta) => {
    const currentWidth = widths[index];
    const nextWidth = Math.max(MIN_COLUMN_WIDTH, currentWidth + delta);
    const nextWidths = [...widths];
    nextWidths[index] = nextWidth;
    return { widths: nextWidths, appliedDelta: nextWidth - currentWidth };
  };

  const startResize = (event, index) => {
    if (event.button !== 0) return;
    const table = event.currentTarget.closest("table");
    if (!table) return;

    resizeState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      index,
      widths: measureColumns(table),
      tableWidth: table.offsetWidth,
      scale: table.getBoundingClientRect().width / table.offsetWidth || 1,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };

  const moveResize = (event) => {
    const resize = resizeState.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const result = resizeColumn(
      resize.widths,
      resize.index,
      (event.clientX - resize.startX) / resize.scale,
    );
    setColumnWidths(result.widths);
    setTableWidth(resize.tableWidth + result.appliedDelta);
  };

  const stopResize = (event) => {
    if (resizeState.current?.pointerId !== event.pointerId) return;
    resizeState.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const resizeWithKeyboard = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const table = event.currentTarget.closest("table");
    if (!table) return;

    event.preventDefault();
    const widths = columnWidths.length ? columnWidths : measureColumns(table);
    const result = resizeColumn(widths, index, event.key === 'ArrowRight' ? 10 : -10);
    setColumnWidths(result.widths);
    setTableWidth((current) => (current || table.offsetWidth) + result.appliedDelta);
  };

  const tableClassName = [
    selectable ? "" : "no-row-selection",
    resizableColumns ? "resizable-table" : "",
    columnWidths.length ? "columns-resized" : "",
  ].filter(Boolean).join(" ");

  const scrollClassName = [
    "table-scroll",
    className,
    resizableColumns ? "resizable-table-scroll" : "",
    columnWidths.length ? "columns-resized-scroll" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={scrollClassName} tabIndex={0} aria-label="결과 표 가로 스크롤">
      <table
        className={tableClassName || undefined}
        style={tableWidth ? { width: `${tableWidth}px` } : undefined}
      >
        <colgroup>
          {selectable && <col className="selection-column-width" />}
          {columns.map((column, index) => (
            <col key={column} style={columnWidths[index] ? { width: `${columnWidths[index]}px` } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {selectable && <th className="selection-col">선택</th>}
            {columns.map((column, columnIndex) => (
              <th
                key={column}
                scope="col"
                data-column-index={columnIndex}
                aria-sort={column === sortColumn
                  ? sortAscending ? "ascending" : "descending"
                  : undefined}
              >
                {column === sortColumn ? (
                  <button type="button" className="sort-button" onClick={onSort}>
                    {column} {sortAscending ? "↑" : "↓"}
                  </button>
                ) : column}
                {resizableColumns && (
                  <span
                    className="column-resize-handle"
                    role="separator"
                    aria-label={`${column} 열 너비 조절`}
                    aria-orientation="vertical"
                    tabIndex={0}
                    onPointerDown={(event) => startResize(event, columnIndex)}
                    onPointerMove={moveResize}
                    onPointerUp={stopResize}
                    onPointerCancel={stopResize}
                    onKeyDown={(event) => resizeWithKeyboard(event, columnIndex)}
                    onDoubleClick={() => {
                      setColumnWidths([]);
                      setTableWidth(null);
                    }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stateRow}
          {rows.map((row, rowIndex) => {
            const isSelected = selectable
              ? selectedIds.includes(row.id)
              : row.id === selectedId;
            return (
              <tr
                key={row.id}
                className={isSelected ? "selected" : ""}
                onClick={() => onRowClick?.(row.id)}
                onDoubleClick={() => onRowDoubleClick?.(row.id)}
              >
                {selectable && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${row.id} 선택`}
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggleRow?.(row.id)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column, columnIndex) => (
                  <td
                    key={column}
                    className={columnIndex === 0 && /ID|번호/.test(column) ? "identifier" : ""}
                  >
                    {renderCell(row, column, rowIndex)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && !stateRow && emptyState}
    </div>
  );
}
