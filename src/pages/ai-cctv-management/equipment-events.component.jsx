import { useEffect, useMemo, useState } from "react";
import { fetchAiEventDetail, fetchAiEvents } from "../../api/eventApi";
import Badge from "../../components/atoms/Badge/Badge";
import Button from "../../components/atoms/Button/Button";
import { DownloadIcon } from "../../components/atoms/Icon/Icon";
import DataTable from "../../components/organisms/DataTable/DataTable";
import SearchConditions from "../../components/organisms/SearchConditions/SearchConditions";
import ContentTable from "../../components/templates/ContentTable/ContentTable";
import DateCondition from "../../components/molecules/SearchConditions/DateCondition";
import DropCondition from "../../components/molecules/SearchConditions/DropCondition";
import TableEmptyState from "../../components/molecules/EmptyState/TableEmptyState";
import CrudModal from "../../components/organisms/CrudModal/CrudModal";
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

function formatConfidence(value) {
  if (value == null) return "-";
  const confidence = Number(value);
  return Number.isFinite(confidence)
    ? `${(confidence <= 1 ? confidence * 100 : confidence).toFixed(1)}%`
    : "-";
}

function riskTone(value) {
  const risk = String(value).toUpperCase();
  if (/DANGER|CRITICAL|HIGH|위험|심각/.test(risk)) return "red";
  if (/WARNING|CAUTION|MEDIUM|경고|주의|경계/.test(risk)) return "amber";
  if (/SAFE|NORMAL|LOW|안전|정상|낮음/.test(risk)) return "green";
  return "gray";
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
  const [selectedRow, setSelectedRow] = useState(null);
  const [highlightedRowId, setHighlightedRowId] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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
  function renderRisk(riskCd) {
    if (!riskCd) return "-";
    const label = riskNames.get(riskCd) || riskCd;
    return <Badge tone={riskTone(`${riskCd} ${label}`)}>{label}</Badge>;
  }
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

  useEffect(() => {
    if (!selectedRow?.eventNo) return undefined;
    const controller = new AbortController();
    fetchAiEventDetail({ token: user?.token, eventNo: selectedRow.eventNo, signal: controller.signal })
      .then((payload) => {
        if (!payload?.data) throw new Error("이벤트 상세 정보가 없습니다.");
        setEventDetail(payload.data);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        if (error.status === 401) onUnauthorized?.();
        else setDetailError(error.message);
      })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selectedRow?.eventNo, user?.token, onUnauthorized]);

  function openDetail(id) {
    const row = eventRows.find((item) => item.id === id);
    if (!row?.eventNo) return;
    setHighlightedRowId(id);
    setSelectedRow(row);
    setEventDetail(null);
    setDetailError("");
    setDetailLoading(true);
  }

  function closeDetail() {
    setSelectedRow(null);
    setEventDetail(null);
    setDetailError("");
  }

  function changeFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function renderEventCell(row, key) {
    if (key === "occurDt") return formatDateTime(row.occurDt);
    if (key === "cameraNm") return row.cameraNm || row.cameraId || "-";
    if (key === "zoneNm") return row.zoneNm || row.zoneId || "-";
    if (key === "eventTypeCd") return eventTypeNames.get(row.eventTypeCd) || row.eventTypeCd || "-";
    if (key === "riskLvCd") return renderRisk(row.riskLvCd);
    if (key === "statusCd") return statusNames.get(row.statusCd) || row.statusCd || "-";
    return row[key] || "-";
  }

  const detail = eventDetail || selectedRow;
  const factoryNames = new Map(factories.map((item) => [item.value, item.label]));
  const detailStatus = detail && (statusNames.get(detail.statusCd) || detail.statusCd || "-");

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
          <DataTable columns={eventColumns} rows={eventRows} selectable={false} selectedId={highlightedRowId} onRowClick={setHighlightedRowId} onRowDoubleClick={openDetail} renderCell={renderEventCell} verticalScroll loading={eventLoading} loadingLabel="AI CCTV 이벤트 불러오는 중" toolbarActions={<Button variant="weak" className="export-button" icon={DownloadIcon} disabled={!eventRows.length || eventLoading} onClick={() => exportEventRows(eventRows, eventTypeNames, riskNames, statusNames)}>엑셀 내보내기</Button>} stateRow={eventError ? <tr className="api-state-row"><td colSpan={eventColumns.length}>{eventError}</td></tr> : undefined} emptyState={<TableEmptyState onAction={() => changeFilters(initialFilters())} />} />
        </div>
      </ContentTable>
      <CrudModal open={Boolean(selectedRow)} mode="detail" titles={{ detail: "안전 이벤트 상세" }} formId="equipment-event-detail-form" className="equipment-event-dialog cctv-detail-dialog" onClose={closeDetail}>
        {detailLoading && <p className="equipment-event-detail-state">이벤트 상세 불러오는 중...</p>}
        {detailError && <p className="equipment-event-detail-error" role="alert">{detailError} 목록에서 확인할 수 있는 정보를 표시합니다.</p>}
        {detail && <div className="equipment-event-detail-content">
          <section className="equipment-event-section"><h3>이벤트 개요</h3>
            <dl className="equipment-event-pair-table">
              <div><dt>이벤트 ID</dt><dd>{detail.eventNo || "-"}</dd><dt>이벤트 유형</dt><dd>{eventTypeNames.get(detail.eventTypeCd) || detail.eventTypeCd || "-"}</dd></div>
              <div><dt>발생일시</dt><dd>{formatDateTime(detail.occurDt)}</dd><dt>위험 단계</dt><dd>{renderRisk(detail.riskLvCd)}</dd></div>
              <div><dt>AI 신뢰도</dt><dd>{formatConfidence(detail.confidence)}</dd><dt>집중감시</dt><dd>{detail.focusYn === "Y" ? "예" : detail.focusYn === "N" ? "아니요" : "-"}</dd></div>
              <div><dt>발생원</dt><dd>{detail.sourceType || "-"}</dd><dt>등록 구분</dt><dd>{detail.regType === "MANUAL" ? "수동" : detail.regType === "AUTO" ? "자동" : detail.regType || "-"}</dd></div>
              <div><dt>원천 이벤트</dt><dd>{detail.rawNo || "-"}</dd><dt>수집일시</dt><dd>{formatDateTime(detail.collectDt)}</dd></div>
            </dl>
          </section>
          <section className="equipment-event-section"><h3>발생 위치·장비</h3>
            <dl className="equipment-event-pair-table">
              <div><dt>공장</dt><dd>{factoryNames.get(detail.factoryCd) || detail.factoryCd || "-"}</dd><dt>카메라</dt><dd>{detail.cameraNm || "-"}</dd></div>
              <div><dt>감지구역</dt><dd>{detail.zoneNm || "-"}</dd><dt>위치</dt><dd>{detail.locDesc || "-"}</dd></div>
              <div><dt>설비</dt><dd>{detail.equipCd || "-"}</dd><dt>장치</dt><dd>{detail.deviceNm || "-"}</dd></div>
            </dl>
          </section>
          <section className="equipment-event-section"><h3>처리 정보</h3>
            <dl className="equipment-event-pair-table">
              <div><dt>처리 상태</dt><dd>{detailStatus}</dd><dt>완료일시</dt><dd>{formatDateTime(detail.doneDt)}</dd></div>
              <div><dt>확인자</dt><dd>{detail.checkMemberId || "-"}</dd><dt>확인일시</dt><dd>{formatDateTime(detail.checkDt)}</dd></div>
              <div><dt>담당자</dt><dd>{detail.chargeMemberId || "-"}</dd><dt>조치 내용</dt><dd>{detail.actionDesc || "-"}</dd></div>
            </dl>
          </section>
        </div>}
      </CrudModal>
    </section>
  );
}
