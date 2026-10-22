import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/atoms/Badge/Badge";
import Button from "../../components/atoms/Button/Button";
import TableEmptyState from "../../components/molecules/EmptyState/TableEmptyState";
import DateCondition from "../../components/molecules/SearchConditions/DateCondition";
import DropCondition from "../../components/molecules/SearchConditions/DropCondition";
import RadioCondition from "../../components/molecules/SearchConditions/RadioConditioin";
import Toast from "../../components/molecules/Toast/Toast";
import CrudModal from "../../components/organisms/CrudModal/CrudModal";
import DataTable from "../../components/organisms/DataTable/DataTable";
import SearchConditions from "../../components/organisms/SearchConditions/SearchConditions";
import ContentTable from "../../components/templates/ContentTable/ContentTable";
import useCameraList from "../../hooks/useCameraList";
import useCommonCodes from "../../hooks/useCommonCodes";
import useAlarmHistory from "../../hooks/useAlarmHistory";
import { saveAlarmRelease } from "../../services/alarmService";
import "./styles/field-alert-history.css";

const columns = [
  { key: "alarmNo", label: "경보번호", width: 132 },
  { key: "occurDt", label: "발생일시", width: 166 },
  { key: "eventNo", label: "원인 이벤트", width: 150 },
  { key: "targetNm", label: "대상 장치", width: 154 },
  { key: "equipCd", label: "설비", width: 115 },
  { key: "riskLvCd", label: "경보 유형", width: 104 },
  { key: "runResult", label: "작동 결과", width: 104 },
  { key: "senderType", label: "발송 주체", width: 114 },
  { key: "sendResult", label: "발송 결과", width: 104 },
  { key: "releaseStatus", label: "해제 상태", width: 104 },
];

function localDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function initialFilters() {
  const today = localDate(new Date());
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - 6);
  return { fromDt: localDate(start), toDt: today, period: "week", cameraId: "", equipCd: "", riskLvCd: "", releaseYn: "" };
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

function toDateTimeInput(value) {
  return value ? String(value).slice(0, 16) : "";
}

function toApiDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function nowForInput() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function releaseValues(row) {
  return { releaseDt: toDateTimeInput(row.releaseDt), releaseReason: row.releaseReason || "", memo: row.memo || "" };
}

export default function FieldAlertHistoryPage({ user, onUnauthorized, onUnsavedChange }) {
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const { data: rows, loading, error, refetch } = useAlarmHistory({
    token: user?.token,
    fromDt: filters.fromDt,
    toDt: filters.toDt,
    cameraId: filters.cameraId,
    equipCd: filters.equipCd,
    riskLvCd: filters.riskLvCd,
    releaseYn: filters.releaseYn,
    onUnauthorized,
  });
  const { data: cameras, error: cameraError } = useCameraList({ enabled: Boolean(user?.token), token: user?.token, onUnauthorized });
  const { data: riskLevels, error: riskError } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "RISK_LV", onUnauthorized });

  const riskNames = useMemo(() => new Map(riskLevels.map((item) => [item.value, item.label])), [riskLevels]);
  const cameraOptions = useMemo(() => cameras.filter((camera) => camera.cameraId).map((camera) => ({
    value: camera.cameraId,
    label: camera.cameraNm || camera.cameraId,
  })), [cameras]);
  // The Swagger API has no EquipmentM list endpoint. Only offer equipment codes
  // actually returned by the current alarm query until the master API is available.
  const equipmentOptions = useMemo(() => [...new Set([...rows.map((row) => row.equipCd), filters.equipCd]
    .filter(Boolean))].sort().map((equipCd) => ({ value: equipCd, label: equipCd })), [rows, filters.equipCd]);
  const dirty = mode === "edit" && JSON.stringify(form) !== JSON.stringify(baseline);

  useEffect(() => {
    onUnsavedChange?.(dirty || saving);
    return () => onUnsavedChange?.(false);
  }, [dirty, saving, onUnsavedChange]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, ...(key === "fromDt" || key === "toDt" ? { period: "" } : {}) }));
  }

  function openDetail(id) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    setSelected(row);
    setMode("detail");
    setForm(null);
    setBaseline(null);
  }

  function openEdit() {
    if (!selected) return;
    const values = releaseValues(selected);
    setForm(values);
    setBaseline(values);
    setMode("edit");
  }

  function closeDetail() {
    if (saving) return;
    if (dirty && !window.confirm("저장하지 않은 내용이 있습니다. 닫으시겠습니까?")) return;
    setMode(null);
    setSelected(null);
    setForm(null);
    setBaseline(null);
  }

  async function submitRelease(event) {
    event.preventDefault();
    if (!selected || !form || saving) return;
    setSaving(true);
    try {
      await saveAlarmRelease({
        token: user?.token,
        alarmNo: selected.alarmNo,
        data: {
          releaseDt: toApiDateTime(form.releaseDt),
          releaseReason: form.releaseReason.trim() || null,
          memo: form.memo.trim() || null,
        },
      });
      setMode(null);
      setSelected(null);
      setForm(null);
      setBaseline(null);
      setNotice("경보 해제 정보를 저장했습니다.");
      refetch();
    } catch (requestError) {
      if (requestError.status === 401) onUnauthorized?.();
      else setNotice(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function renderCell(row, key) {
    if (key === "occurDt") return formatDateTime(row.occurDt);
    if (key === "riskLvCd") return riskNames.get(row.riskLvCd) || row.riskLvCd || "-";
    if (key === "releaseStatus") return <Badge tone={row.releaseDt ? "green" : "amber"}>{row.releaseDt ? "해제" : "미해제"}</Badge>;
    if (key === "runResult" || key === "sendResult") {
      if (!row[key]) return "-";
      return <Badge tone={row[key] === "성공" ? "green" : "red"}>{row[key]}</Badge>;
    }
    return row[key] || "-";
  }

  return (
    <section className="work-panel field-alert-history-page">
      <ContentTable>
        <SearchConditions onReset={() => setFilters(initialFilters())}>
          <DateCondition label="발생기간" startDate={filters.fromDt} endDate={filters.toDt} period={filters.period} onStartDateChange={(value) => updateFilter("fromDt", value)} onEndDateChange={(value) => updateFilter("toDt", value)} onPeriodChange={(period) => setFilters((current) => ({ ...current, ...periodRange(period, current.toDt) }))} />
          <DropCondition label="카메라" value={filters.cameraId} placeholder={cameraError ? "카메라 조회 실패" : "전체"} options={cameraOptions} onChange={(value) => setFilters((current) => ({ ...current, cameraId: value, equipCd: "" }))} />
          <DropCondition label="설비" value={filters.equipCd} placeholder="전체" options={equipmentOptions} onChange={(value) => updateFilter("equipCd", value)} />
          <DropCondition label="경보 유형" value={filters.riskLvCd} placeholder={riskError ? "유형 조회 실패" : "전체"} options={riskLevels} onChange={(value) => updateFilter("riskLvCd", value)} />
          <RadioCondition label="해제 상태" name="alarm-release-filter" value={filters.releaseYn} options={[{ value: "", label: "전체" }, { value: "N", label: "미해제" }, { value: "Y", label: "해제" }]} onChange={(value) => updateFilter("releaseYn", value)} />
        </SearchConditions>
        <div className="table-panel field-alert-table-panel">
          <DataTable
            columns={columns}
            rows={rows}
            totalCount={rows.length}
            selectable={false}
            selectedId={selected?.id}
            onRowClick={openDetail}
            onRowDoubleClick={openDetail}
            renderCell={renderCell}
            resizableColumns
            verticalScroll
            loading={loading}
            loadingLabel="경보 이력 불러오는 중"
            stateRow={error ? <tr className="api-state-row"><td colSpan={columns.length}><span className="field-alert-error">{error}<Button size="small" variant="weak" onClick={refetch}>다시 시도</Button></span></td></tr> : undefined}
            emptyState={!loading && !error ? <TableEmptyState onAction={() => setFilters(initialFilters())} /> : <></>}
          />
        </div>
      </ContentTable>

      <CrudModal open={Boolean(mode)} mode={mode || "detail"} titles={{ detail: "경보 이력 상세", edit: "경보 해제 정보 수정" }} formId="field-alert-release-form" className="field-alert-dialog cctv-detail-dialog" saving={saving} onClose={closeDetail} onSubmit={submitRelease} onEdit={mode === "detail" ? openEdit : undefined}>
        {selected && <div className="field-alert-detail-content">
          <section className="field-alert-detail-section"><h3>경보 정보</h3><dl className="cctv-detail-table field-alert-detail-table">
            <div><dt>경보번호</dt><dd>{selected.alarmNo || "-"}</dd></div>
            <div><dt>발생일시</dt><dd>{formatDateTime(selected.occurDt)}</dd></div>
            <div><dt>원인 이벤트</dt><dd>{selected.eventNo || "-"}</dd></div>
            <div><dt>대상 장치</dt><dd>{selected.targetNm || "-"}</dd></div>
            <div><dt>카메라 ID</dt><dd>{selected.cameraId || "-"}</dd></div>
            <div><dt>설비</dt><dd>{selected.equipCd || "-"}</dd></div>
            <div><dt>경보 유형</dt><dd>{riskNames.get(selected.riskLvCd) || selected.riskLvCd || "-"}</dd></div>
            <div><dt>작동 결과</dt><dd>{selected.runResult || "-"}</dd></div>
            <div><dt>발송 주체</dt><dd>{selected.senderType || "-"}</dd></div>
            <div><dt>발송 결과</dt><dd>{selected.sendResult || "-"}</dd></div>
            <div><dt>발송번호</dt><dd>{selected.sendNo ?? "-"}</dd></div>
            <div><dt>응답시간</dt><dd>{selected.respSec == null ? "-" : `${selected.respSec}초`}</dd></div>
          </dl></section>
          <section className="field-alert-detail-section"><h3>해제 이력</h3><dl className="cctv-detail-table field-alert-detail-table">
            <div><dt>해제 일시</dt>{mode === "edit" ? <dd className="is-editing field-alert-date-input"><input type="datetime-local" value={form.releaseDt} onChange={(event) => setForm((current) => ({ ...current, releaseDt: event.target.value }))} /><Button variant="weak" size="small" onClick={() => setForm((current) => ({ ...current, releaseDt: nowForInput() }))}>현재 시각</Button></dd> : <dd>{formatDateTime(selected.releaseDt)}</dd>}</div>
            <div><dt>해제자</dt><dd>{selected.releaseMemberId || "-"}</dd></div>
            <div className="is-wide"><dt>해제 사유</dt>{mode === "edit" ? <dd className="is-editing"><input maxLength={200} value={form.releaseReason} onChange={(event) => setForm((current) => ({ ...current, releaseReason: event.target.value }))} /></dd> : <dd>{selected.releaseReason || "-"}</dd>}</div>
            <div className="is-wide is-tall"><dt>비고</dt>{mode === "edit" ? <dd className="is-editing"><textarea maxLength={500} value={form.memo} onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} /></dd> : <dd className="is-multiline">{selected.memo || "-"}</dd>}</div>
          </dl>{mode === "edit" && selected.releaseDt && <Button className="field-alert-clear-release" variant="text" size="small" onClick={() => setForm((current) => ({ ...current, releaseDt: "", releaseReason: "" }))}>해제 취소</Button>}</section>
        </div>}
      </CrudModal>
      <Toast open={Boolean(notice)} message={notice} onClose={() => setNotice("")} />
    </section>
  );
}
