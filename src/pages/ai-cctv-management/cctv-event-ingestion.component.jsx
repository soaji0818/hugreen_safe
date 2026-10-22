import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../../components/atoms/Badge/Badge";
import Button from "../../components/atoms/Button/Button";
import Loader from "../../components/atoms/Loader/Loader";
import { CameraIcon, EyeIcon, PlusIcon } from "../../components/atoms/Icon/Icon";
import DropDownMenu from "../../components/atoms/Menu/DropDownMenu";
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
import useRawEventList from "../../hooks/useRawEventList";
import {
  createRawEvent,
  getRawEventDetail,
  getRawEventSnapshotFile,
  getRawEventSnapshots,
  saveRawEventCheck,
} from "../../services/rawEventService";
import "./styles/cctv-event-ingestion.css";

const columns = [
  { key: "rawNo", label: "수신번호", width: 92 },
  { key: "occurDt", label: "발생일시", width: 160 },
  { key: "cameraNm", label: "카메라명", width: 96 },
  { key: "zone", label: "구역", width: 100 },
  { key: "eventTypeCd", label: "이벤트 유형", width: 126 },
  { key: "releaseDt", label: "해제일시", width: 160 },
  { key: "snapCnt", label: "스냅샷", width: 88 },
  { key: "checkStatus", label: "확인 상태", width: 100 },
];

const statusOptions = [
  { value: "미확인", label: "미확인" },
  { value: "확인", label: "확인" },
  { value: "조치중", label: "조치중" },
  { value: "조치완료", label: "조치완료" },
  { value: "오탐 종결", label: "오탐 종결" },
];

function localDateValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function initialPeriod() {
  const today = localDateValue(new Date());
  return { fromDt: today, toDt: today, period: "today" };
}

function rangeFor(period, anchor) {
  const days = { today: 0, week: 6, month: 29, threeMonths: 89, sixMonths: 179 };
  const end = new Date(`${anchor || localDateValue(new Date())}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - (days[period] ?? 6));
  return { fromDt: localDateValue(start), toDt: localDateValue(end), period };
}

function nowForInput() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function formatDateTime(value) {
  return value ? String(value).replace("T", " ").slice(0, 19) : "-";
}

function toApiDateTime(value) {
  if (!value) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function statusTone(value) {
  if (["조치완료", "오탐 종결"].includes(value)) return "green";
  if (["확인", "조치중"].includes(value)) return "amber";
  return "red";
}

function emptyCreateForm() {
  return { cameraId: "", zoneId: "", occurDt: nowForInput(), eventTypeCd: "", note: "" };
}

export default function CctvEventIngestionPage({ user, onUnauthorized, onUnsavedChange }) {
  const initialFilters = useMemo(() => initialPeriod(), []);
  const [filters, setFilters] = useState({ ...initialFilters, eventTypeCd: "", cameraId: "", regType: "" });
  const [mode, setMode] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const requestController = useRef(null);

  const { data: cameras, error: cameraError } = useCameraList({ enabled: Boolean(user?.token), token: user?.token, useYn: "Y", onUnauthorized });
  const { data: commonEventTypes, error: eventTypeError } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "EVT_TYPE", onUnauthorized });
  const eventTypes = useMemo(() => commonEventTypes.filter((item) => !item.cdRule1 || item.cdRule1 === "AI"), [commonEventTypes]);
  const eventTypeNames = useMemo(() => new Map(eventTypes.map((item) => [item.value, item.label])), [eventTypes]);
  const { data: rows, loading, error, refetch } = useRawEventList({
    token: user?.token,
    fromDt: filters.fromDt,
    toDt: filters.toDt,
    cameraId: filters.cameraId,
    eventTypeCd: filters.eventTypeCd,
    regType: filters.regType,
    onUnauthorized,
  });

  const dirty = Boolean(mode && form && baseline && JSON.stringify(form) !== JSON.stringify(baseline));
  useEffect(() => onUnsavedChange?.(dirty), [dirty, onUnsavedChange]);
  useEffect(() => () => {
    requestController.current?.abort();
    onUnsavedChange?.(false);
  }, [onUnsavedChange]);

  const cameraOptions = useMemo(() => cameras.map((camera) => ({
    value: camera.cameraId,
    label: camera.cameraNm || camera.cameraId,
  })), [cameras]);
  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, ...(key === "fromDt" || key === "toDt" ? { period: "" } : {}) }));
  }

  function resetFilters() {
    const next = { ...initialPeriod(), eventTypeCd: "", cameraId: "", regType: "" };
    setFilters(next);
  }

  async function openDetail(rawNo) {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setSelectedId(rawNo);
    setMode("detail");
    setDetail(null);
    setSnapshots([]);
    setDetailError("");
    setDetailLoading(true);
    try {
      const [nextDetail, nextSnapshots] = await Promise.all([
        getRawEventDetail({ token: user?.token, rawNo, signal: controller.signal }),
        getRawEventSnapshots({ token: user?.token, rawNo, signal: controller.signal }),
      ]);
      setDetail(nextDetail);
      setSnapshots(nextSnapshots);
      const values = { checkStatus: nextDetail?.checkStatus || "미확인", memo: nextDetail?.memo || "" };
      setForm(values);
      setBaseline(values);
    } catch (requestError) {
      if (requestError.name === "AbortError") return;
      if (requestError.status === 401) onUnauthorized?.();
      else setDetailError(requestError.message);
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }

  function openCreate() {
    const values = emptyCreateForm();
    setSelectedId(null);
    setDetail(null);
    setSnapshots([]);
    setMode("create");
    setForm(values);
    setBaseline(values);
  }

  function closeModal(force = false) {
    if (!force && dirty && !window.confirm("저장하지 않은 내용이 있습니다. 닫으시겠습니까?")) return;
    requestController.current?.abort();
    setMode(null);
    setDetail(null);
    setForm(null);
    setBaseline(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form) return;
    if (mode === "create" && (!form.cameraId || !form.occurDt || !form.eventTypeCd)) {
      setNotice("카메라, 발생일시, 이벤트 유형을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        await createRawEvent({
          token: user?.token,
          data: { sourceType: "AI", cameraId: form.cameraId, zoneId: form.zoneId || null, occurDt: toApiDateTime(form.occurDt), eventTypeCd: form.eventTypeCd, note: form.note || null },
        });
        setNotice("원천 이벤트가 등록되었습니다.");
      } else {
        await saveRawEventCheck({ token: user?.token, rawNo: detail.rawNo, data: { checkStatus: form.checkStatus || null, memo: form.memo || null } });
        setDetail((current) => ({ ...current, ...form }));
        setBaseline(form);
        setMode("detail");
        setNotice("확인 상태와 비고가 저장되었습니다.");
      }
      refetch();
      if (mode === "create") closeModal(true);
    } catch (requestError) {
      if (requestError.status === 401) onUnauthorized?.();
      else setNotice(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function openSnapshot(snapshot) {
    const preview = window.open("about:blank", "_blank");
    if (preview) preview.opener = null;
    try {
      const blob = await getRawEventSnapshotFile({ token: user?.token, rawNo: snapshot.rawNo, snapSeq: snapshot.snapSeq });
      const url = URL.createObjectURL(blob);
      if (preview) preview.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (requestError) {
      preview?.close();
      if (requestError.status === 401) onUnauthorized?.();
      else setNotice(requestError.message);
    }
  }

  function renderCell(row, key) {
    if (key === "occurDt" || key === "releaseDt") return formatDateTime(row[key]);
    if (key === "zone") return row.zoneId || "-";
    if (key === "eventTypeCd") return eventTypeNames.get(row.eventTypeCd) || row.eventTypeCd || "-";
    if (key === "snapCnt") return row.snapCnt ? `${row.snapCnt}개` : "-";
    if (key === "checkStatus") {
      const value = row.checkStatus || "미확인";
      return <Badge tone={statusTone(value)}>{value}</Badge>;
    }
    return row[key] ?? "-";
  }

  return (
    <section className="cctv-event-ingestion-page">
      <ContentTable>
        <SearchConditions onReset={resetFilters}>
          <DateCondition label="수신기간" startDate={filters.fromDt} endDate={filters.toDt} period={filters.period} onStartDateChange={(value) => updateFilter("fromDt", value)} onEndDateChange={(value) => updateFilter("toDt", value)} onPeriodChange={(period) => setFilters((current) => ({ ...current, ...rangeFor(period, current.toDt) }))} />
          <DropCondition label="이벤트 유형" value={filters.eventTypeCd} placeholder={eventTypeError ? "유형 조회 실패" : "전체"} options={eventTypes} onChange={(value) => updateFilter("eventTypeCd", value)} />
          <DropCondition label="카메라" value={filters.cameraId} placeholder={cameraError ? "카메라 조회 실패" : "전체"} options={cameraOptions} onChange={(value) => updateFilter("cameraId", value)} />
          <RadioCondition label="등록 구분" name="raw-event-reg-type" value={filters.regType} options={[{ value: "", label: "전체" }, { value: "AUTO", label: "자동" }, { value: "MANUAL", label: "수동" }]} onChange={(value) => updateFilter("regType", value)} />
        </SearchConditions>

        <div className="table-panel raw-event-table-panel">
          <DataTable
            columns={columns}
            rows={rows}
            totalCount={rows.length}
            selectable={false}
            selectedId={selectedId}
            onRowClick={openDetail}
            onRowDoubleClick={openDetail}
            renderCell={renderCell}
            resizableColumns
            verticalScroll
            virtualizeRows
            loading={loading}
            loadingLabel="원천 이벤트 불러오는 중"
            toolbarActions={<Button icon={PlusIcon} onClick={openCreate}>추가</Button>}
            stateRow={error ? <tr className="api-state-row"><td colSpan={columns.length}><span className="raw-event-error">{error}<Button size="small" variant="weak" onClick={refetch}>다시 시도</Button></span></td></tr> : undefined}
            emptyState={!loading && !error ? <TableEmptyState onAction={resetFilters} /> : <></>}
          />
        </div>
      </ContentTable>

      <CrudModal open={Boolean(mode)} mode={mode || "detail"} titles={{ create: "원천 이벤트 수동 입력", edit: "수신 확인 정보 수정", detail: "원천 이벤트 상세" }} formId="raw-event-form" className="raw-event-dialog cctv-detail-dialog" saving={saving} saveLabel={mode === "create" ? "등록" : "저장"} onClose={closeModal} onSubmit={handleSubmit} onEdit={mode === "detail" && detail ? () => setMode("edit") : undefined} onCancelEdit={mode === "edit" ? () => { setForm(baseline); setMode("detail"); } : closeModal}>
        {mode === "create" && form ? (
          <section className="raw-event-form-section">
            <p className="raw-event-form-guide">외부 장비에서 수신하지 못한 AI CCTV 이벤트만 수동으로 입력합니다.</p>
            <dl className="cctv-detail-table raw-event-detail-table">
              <div><dt>발생원</dt><dd>AI CCTV</dd></div>
              <div><dt>카메라</dt><dd className="is-editing"><DropDownMenu required value={form.cameraId} onChange={(event) => setForm((current) => ({ ...current, cameraId: event.target.value }))}><option value="">선택</option>{cameraOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</DropDownMenu></dd></div>
              <div><dt>감지구역 ID</dt><dd className="is-editing"><input maxLength={20} value={form.zoneId} placeholder="선택 입력" onChange={(event) => setForm((current) => ({ ...current, zoneId: event.target.value }))} /></dd></div>
              <div><dt>발생일시</dt><dd className="is-editing"><input required type="datetime-local" value={form.occurDt} onChange={(event) => setForm((current) => ({ ...current, occurDt: event.target.value }))} /></dd></div>
              <div><dt>이벤트 유형</dt><dd className="is-editing"><DropDownMenu required value={form.eventTypeCd} onChange={(event) => setForm((current) => ({ ...current, eventTypeCd: event.target.value }))}><option value="">선택</option>{eventTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</DropDownMenu></dd></div>
              <div className="is-tall"><dt>입력 사유</dt><dd className="is-editing"><textarea maxLength={500} value={form.note} placeholder="수동 입력 사유를 입력하세요." onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></dd></div>
            </dl>
          </section>
        ) : detailLoading ? <div className="raw-event-detail-state"><Loader label="이벤트 상세 불러오는 중" /></div> : detailError ? <div className="raw-event-detail-state is-error">{detailError}</div> : detail ? (
          <div className="raw-event-detail-content">
            <section className="raw-event-form-section"><h3>수신 정보</h3><dl className="cctv-detail-table raw-event-detail-table">
              <div><dt>수신번호</dt><dd>{detail.rawNo}</dd></div><div><dt>수신일시</dt><dd>{formatDateTime(detail.recvDt)}</dd></div><div><dt>발생일시</dt><dd>{formatDateTime(detail.occurDt)}</dd></div><div><dt>외부 이벤트ID</dt><dd>{detail.extEventId || "-"}</dd></div><div><dt>카메라</dt><dd>{[detail.cameraId, detail.cameraNm].filter(Boolean).join(" · ") || "-"}</dd></div><div><dt>감지구역</dt><dd>{[detail.zoneId, detail.zoneNm].filter(Boolean).join(" · ") || "-"}</dd></div><div><dt>이벤트 유형</dt><dd>{eventTypeNames.get(detail.eventTypeCd) || detail.eventTypeCd || "-"}</dd></div><div><dt>AI 신뢰도</dt><dd>{detail.confidence == null ? "-" : `${(detail.confidence <= 1 ? detail.confidence * 100 : detail.confidence).toFixed(1)}%`}</dd></div><div><dt>등록 구분</dt><dd>{detail.regType === "MANUAL" ? "수동" : "자동"}</dd></div><div><dt>안전 이벤트</dt><dd>{detail.eventNo || "미등록"}</dd></div>
            </dl></section>
            <section className="raw-event-form-section"><h3>수신 확인</h3><dl className="cctv-detail-table raw-event-detail-table">
              <div><dt>확인 상태</dt>{mode === "edit" ? <dd className="is-editing"><DropDownMenu value={form.checkStatus} onChange={(event) => setForm((current) => ({ ...current, checkStatus: event.target.value }))}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</DropDownMenu></dd> : <dd><Badge tone={statusTone(detail.checkStatus || "미확인")}>{detail.checkStatus || "미확인"}</Badge></dd>}</div>
              <div className="is-tall"><dt>비고</dt>{mode === "edit" ? <dd className="is-editing"><textarea maxLength={500} value={form.memo} onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} /></dd> : <dd className="is-multiline">{detail.memo || "-"}</dd>}</div>
            </dl></section>
            <section className="raw-event-form-section"><h3>스냅샷 <span>{snapshots.length}개</span></h3>{snapshots.length ? <div className="raw-event-snapshot-list">{snapshots.map((snapshot) => <button key={snapshot.snapSeq} type="button" onClick={() => openSnapshot(snapshot)}><span className="snapshot-icon"><CameraIcon size={16} /></span><span><strong>{snapshot.snapType || `스냅샷 ${snapshot.snapSeq}`}</strong><small>{formatDateTime(snapshot.snapDt)} · {snapshot.fileKind || "file"}</small></span><EyeIcon size={16} /></button>)}</div> : <p className="raw-event-no-snapshot">첨부된 스냅샷이 없습니다.</p>}</section>
            <details className="raw-event-payload"><summary>원본 payload 보기</summary><pre>{detail.payload || "원본 payload가 없습니다."}</pre></details>
          </div>
        ) : null}
      </CrudModal>
      <Toast open={Boolean(notice)} message={notice} onClose={() => setNotice("")} />
    </section>
  );
}
