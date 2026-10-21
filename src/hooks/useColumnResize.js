import { useRef, useState } from "react";

const MIN_COLUMN_WIDTH = 72;

export default function useColumnResize(columns) {
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
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const table = event.currentTarget.closest("table");
    if (!table) return;

    event.preventDefault();
    const widths = columnWidths.length ? columnWidths : measureColumns(table);
    const result = resizeColumn(widths, index, event.key === "ArrowRight" ? 10 : -10);
    setColumnWidths(result.widths);
    setTableWidth((current) => (current || table.offsetWidth) + result.appliedDelta);
  };

  const resetColumnWidths = () => {
    setColumnWidths([]);
    setTableWidth(null);
  };

  return {
    columnWidths,
    tableWidth,
    startResize,
    moveResize,
    stopResize,
    resizeWithKeyboard,
    resetColumnWidths,
  };
}
