import { useEffect, useMemo, useState } from "react";
import { fetchAiEvents } from "../../api/eventApi";
import Button from "../../components/atoms/Button/Button";
import { DownloadIcon } from "../../components/atoms/Icon/Icon";
import DataTable from "../../components/organisms/DataTable/DataTable";
import SearchConditions from "../../components/organisms/SearchConditions/SearchConditions";
import ContentTable from "../../components/templates/ContentTable/ContentTable";
import DateCondition from "../../components/molecules/SearchConditions/DateCondition";
import DropCondition from "../../components/molecules/SearchConditions/DropCondition";
import TableEmptyState from "../../components/molecules/EmptyState/TableEmptyState";
import useCameraList from "../../hooks/useCameraList";
import useCommonCodes from "../../hooks/useCommonCodes";
import "./styles/equipment-events.css";

const eventColumns = [
  { key: "eventNo", label: "이벤트 ID" },
  { key: "occurDt", label: "발생일시" },
  { key: "cameraNm", label: "카메라명" },
  { key: "zoneNm", label: "구역" },
  { key: "eventTypeCd", label: "이벤트 유형" },
  { key: "riskLvCd", label: "위험 단계" },
  { key: "statusCd", label: "처리 상태" },
];

function localDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function initialFilters() {
  const today = localDate(new Date());
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - 6);
  return { fromDt: localDate(start), toDt: today, period: "week", factoryCd: "", cameraId: "", eventTypeCd: "", statusCd: "" };
}

function periodRange(period, anchor) {
  const days = { today: 0, week: 6, month: 29, threeMonths: 89, sixMonths: 179 };
  const end = new Date(`${anchor || localDate(new Date())}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - (days[period] ?? 6));
  return { fromDt: localDate(start), toDt: localDate(end), period };
}

function formatDateTime(value) {
  return value ? String(value).replace("T", " ").slice(0, 19) : "-";
}

function requestState(error, loading, colSpan, label) {
  if (!error && !loading) return undefined;
  return <tr className="api-state-row"><td colSpan={colSpan} role="status">{loading ? `${label} 불러오는 중입니다.` : error}</td></tr>;
}

function exportEventRows(rows, eventTypeNames, riskNames, statusNames) {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [
    ["이벤트 ID", "발생일시", "카메라 ID", "카메라명", "구역", "이벤트 유형", "위험 단계", "처리 상태"],
    ...rows.map((row) => [
      row.eventNo,
      formatDateTime(row.occurDt),
      row.cameraId,
      row.cameraNm || row.cameraId,
      row.zoneNm || row.zoneId,
      eventTypeNames.get(row.eventTypeCd) || row.eventTypeCd,
      riskNames.get(row.riskLvCd) || row.riskLvCd,
      statusNames.get(row.statusCd) || row.statusCd,
    ]),
  ];
  const blob = new Blob(["\uFEFF", lines.map((line) => line.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `AI_CCTV_이벤트_${localDate(new Date())}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function EquipmentEventsPage({ user, onUnauthorized }) {
  const [filters, setFilters] = useState(initialFilters);
  const [eventRows, setEventRows] = useState([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState("");

  const { data: cameras, error: cameraListError } = useCameraList({
    enabled: Boolean(user?.token), token: user?.token, factoryCd: filters.factoryCd, onUnauthorized,
  });
  const { data: factories, error: factoryError } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "FACTORY", onUnauthorized });
  const { data: eventTypes, error: eventTypeError } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "EVT_TYPE", onUnauthorized });
  const { data: statuses, error: statusError } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "EVT_STATUS", onUnauthorized });
  const { data: riskLevels } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "RISK_LV", onUnauthorized });

  const cameraOptions = useMemo(() => cameras.filter((camera) => camera.cameraId).map((camera) => ({
    value: camera.cameraId,
    label: camera.cameraNm || camera.cameraId,
  })), [cameras]);
  const eventTypeNames = useMemo(() => new Map(eventTypes.map((item) => [item.value, item.label])), [eventTypes]);
  const statusNames = useMemo(() => new Map(statuses.map((item) => [item.value, item.label])), [statuses]);
  const riskNames = useMemo(() => new Map(riskLevels.map((item) => [item.value, item.label])), [riskLevels]);
  useEffect(() => {
    if (!user?.token || !filters.fromDt || !filters.toDt) return undefined;
    const controller = new AbortController();
    // Each filter change starts a new request and clears stale results.
    // eslint-disable-next-line react/set-state-in-effect
    setEventLoading(true);
    setEventError("");
    setEventRows([]);
    fetchAiEvents({
      token: user.token,
      fromDt: filters.fromDt,
      toDt: filters.toDt,
      factoryCd: filters.factoryCd,
      cameraId: filters.cameraId,
      eventTypeCd: filters.eventTypeCd,
      statusCd: filters.statusCd,
      signal: controller.signal,
    })
      .then((payload) => setEventRows((payload.data || []).map((row, index) => ({ ...row, id: row.eventNo || `event-${index}` }))))
      .catch((error) => {
        if (error.name === "AbortError") return;
        if (error.status === 401) onUnauthorized?.();
        else setEventError(error.message);
      })
      .finally(() => { if (!controller.signal.aborted) setEventLoading(false); });
    return () => controller.abort();
  }, [user?.token, filters.fromDt, filters.toDt, filters.factoryCd, filters.cameraId, filters.eventTypeCd, filters.statusCd, onUnauthorized]);

  function changeFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function renderEventCell(row, key) {
    if (key === "occurDt") return formatDateTime(row.occurDt);
    if (key === "cameraNm") return row.cameraNm || row.cameraId || "-";
    if (key === "zoneNm") return row.zoneNm || row.zoneId || "-";
    if (key === "eventTypeCd") return eventTypeNames.get(row.eventTypeCd) || row.eventTypeCd || "-";
    if (key === "riskLvCd") return riskNames.get(row.riskLvCd) || row.riskLvCd || "-";
    if (key === "statusCd") return statusNames.get(row.statusCd) || row.statusCd || "-";
    return row[key] || "-";
  }

  return (
    <section className="work-panel equipment-events-page">
      <ContentTable>
        <SearchConditions onReset={() => changeFilters(initialFilters())}>
          <DateCondition label="발생기간" startDate={filters.fromDt} endDate={filters.toDt} period={filters.period} onStartDateChange={(value) => changeFilters({ fromDt: value, period: "" })} onEndDateChange={(value) => changeFilters({ toDt: value, period: "" })} onPeriodChange={(period) => changeFilters(periodRange(period, filters.toDt))} />
          <DropCondition label="공장" value={filters.factoryCd} placeholder={factoryError ? "공장 조회 실패" : "전체"} options={factories} onChange={(value) => changeFilters({ factoryCd: value, cameraId: "" })} />
          <DropCondition label="카메라" value={filters.cameraId} placeholder={cameraListError ? "카메라 조회 실패" : "전체"} options={cameraOptions} onChange={(value) => changeFilters({ cameraId: value })} />
          <DropCondition label="이벤트 유형" value={filters.eventTypeCd} placeholder={eventTypeError ? "유형 조회 실패" : "전체"} options={eventTypes} onChange={(value) => changeFilters({ eventTypeCd: value })} />
          <DropCondition label="처리 상태" value={filters.statusCd} placeholder={statusError ? "상태 조회 실패" : "전체"} options={statuses} onChange={(value) => changeFilters({ statusCd: value })} />
        </SearchConditions>
        <div className="equipment-events-list-panel">
          <DataTable columns={eventColumns} rows={eventRows} selectable={false} renderCell={renderEventCell} verticalScroll toolbarActions={<Button variant="weak" className="export-button" icon={DownloadIcon} disabled={!eventRows.length || eventLoading} onClick={() => exportEventRows(eventRows, eventTypeNames, riskNames, statusNames)}>엑셀 내보내기</Button>} stateRow={requestState(eventError, eventLoading, eventColumns.length, "AI CCTV 이벤트를")} emptyState={<TableEmptyState onAction={() => changeFilters(initialFilters())} />} />
        </div>
      </ContentTable>
    </section>
  );
}
