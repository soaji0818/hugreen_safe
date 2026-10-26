import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/atoms/Button/Button";
import CountedInput from "../../components/atoms/CountedInput/CountedInput";
import Loader from "../../components/atoms/Loader/Loader";
import { CameraIcon, CloseIcon, EyeIcon, PlusIcon } from "../../components/atoms/Icon/Icon";
import DropDownMenu from "../../components/atoms/Menu/DropDownMenu";
import ConfirmDialog from "../../components/molecules/ConfirmDialog/ConfirmDialog";
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
import useZoneList from "../../hooks/useZoneList";
import useNativeDialog from "../../hooks/useNativeDialog";
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
  { key: "confidence", label: "AI 신뢰도", width: 100 },
  { key: "snapCnt", label: "스냅샷", width: 88 },
  { key: "regType", label: "등록 구분", width: 90 },
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

function formatConfidence(value) {
  if (value == null || value === "") return "-";
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) return "-";
  return `${(confidence <= 1 ? confidence * 100 : confidence).toFixed(1)}%`;
}

function toApiDateTime(value) {
  if (!value) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function emptyCreateForm() {
  return { cameraId: "", zoneId: "", occurDt: nowForInput(), eventTypeCd: "", note: "" };
}

function SnapshotVideo({ url }) {
  const videoRef = useRef(null);
  const [playbackError, setPlaybackError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let player = null;

    import("mpegts.js").then(({ default: mpegts }) => {
      if (cancelled) return;
      if (!mpegts.isSupported()) {
        setPlaybackError("이 브라우저에서는 영상을 재생할 수 없습니다.");
        return;
      }
      player = mpegts.createPlayer({ type: "mpegts", isLive: false, url });
      player.on(mpegts.Events.ERROR, () => setPlaybackError("영상을 재생할 수 없습니다."));
      player.attachMediaElement(videoRef.current);
      player.load();
    }).catch(() => {
      if (!cancelled) setPlaybackError("영상 플레이어를 불러오지 못했습니다.");
    });

    return () => {
      cancelled = true;
      if (player) {
        player.pause();
        player.unload();
        player.detachMediaElement();
        player.destroy();
      }
    };
  }, [url]);

  return (
    <div className="raw-event-preview-video">
      <video ref={videoRef} controls controlsList="nodownload" playsInline aria-label="스냅샷 영상" />
      {playbackError && <p role="alert">{playbackError}</p>}
    </div>
  );
}

export default function CctvEventIngestionPage({ user, onUnauthorized, onUnsavedChange }) {
  const initialFilters = useMemo(() => initialPeriod(), []);
  const [filters, setFilters] = useState({ ...initialFilters, eventTypeCd: "", cameraId: "", regType: "" });
  const [mode, setMode] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotError, setSnapshotError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [form, setForm] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [snapshotPreview, setSnapshotPreview] = useState(null);
  const [dialogGeometry, setDialogGeometry] = useState(null);
  const requestController = useRef(null);
  const snapshotController = useRef(null);
  const snapshotDialog = useRef(null);
  const detailDialog = useRef(null);
  const dialogInteraction = useRef(null);

  useNativeDialog(snapshotDialog, Boolean(snapshotPreview));
  useEffect(() => () => {
    if (snapshotPreview?.url) URL.revokeObjectURL(snapshotPreview.url);
  }, [snapshotPreview?.url]);
  useEffect(() => () => snapshotController.current?.abort(), []);

  const { data: cameras, error: cameraError } = useCameraList({ enabled: Boolean(user?.token), token: user?.token, useYn: "Y", onUnauthorized });
  const { data: commonEventTypes, error: eventTypeError } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "EVT_TYPE", onUnauthorized });
  const { data: zones, loading: zonesLoading, error: zonesError } = useZoneList({
    enabled: mode === "create" && Boolean(user?.token && form?.cameraId),
    token: user?.token,
    cameraId: form?.cameraId || "",
    onUnauthorized,
  });
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
  const zoneOptions = useMemo(() => zones
    .filter((zone) => zone.cameraId === form?.cameraId && zone.zoneId && zone.useYn !== "N")
    .map((zone) => ({ value: zone.zoneId, label: zone.zoneNm || zone.zoneId })), [zones, form?.cameraId]);
  const zoneDisabled = !form?.cameraId || zonesLoading || Boolean(zonesError) || !zoneOptions.length;
  const zonePlaceholder = !form?.cameraId ? "카메라를 선택하세요"
    : zonesLoading ? "감지구역 불러오는 중"
      : zonesError ? "감지구역 조회 실패"
        : zoneOptions.length ? "선택 안 함" : "등록된 감지구역 없음";
  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, ...(key === "fromDt" || key === "toDt" ? { period: "" } : {}) }));
  }

  function resetFilters() {
    const next = { ...initialPeriod(), eventTypeCd: "", cameraId: "", regType: "" };
    setFilters(next);
  }

  function startDialogInteraction(event, interactionMode) {
    if (event.button !== 0) return;
    const dialog = detailDialog.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const scale = rect.width / dialog.offsetWidth || 1;
    const geometry = {
      left: rect.left / scale,
      top: rect.top / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    };
    dialogInteraction.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scale,
      mode: interactionMode,
      ...geometry,
    };
    setDialogGeometry(geometry);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function moveDialogInteraction(event) {
    const interaction = dialogInteraction.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    const dx = (event.clientX - interaction.startX) / interaction.scale;
    const dy = (event.clientY - interaction.startY) / interaction.scale;
    const viewportWidth = window.innerWidth / interaction.scale;
    const viewportHeight = window.innerHeight / interaction.scale;
    const minWidth = Math.min(360, viewportWidth - 16);
    const minHeight = Math.min(280, viewportHeight - 16);
    let { left, top, width, height } = interaction;

    if (interaction.mode === "drag") {
      left = Math.min(Math.max(0, interaction.left + dx), Math.max(0, viewportWidth - width));
      top = Math.min(Math.max(0, interaction.top + dy), Math.max(0, viewportHeight - height));
    } else {
      if (interaction.mode.includes("e")) {
        width = Math.min(Math.max(minWidth, interaction.width + dx), viewportWidth - interaction.left);
      }
      if (interaction.mode.includes("s")) {
        height = Math.min(Math.max(minHeight, interaction.height + dy), viewportHeight - interaction.top);
      }
      if (interaction.mode.includes("w")) {
        const right = interaction.left + interaction.width;
        left = Math.min(Math.max(0, interaction.left + dx), right - minWidth);
        width = right - left;
      }
      if (interaction.mode.includes("n")) {
        const bottom = interaction.top + interaction.height;
        top = Math.min(Math.max(0, interaction.top + dy), bottom - minHeight);
        height = bottom - top;
      }
    }

    setDialogGeometry({
      left: Math.round(left),
      top: Math.round(top),
      width: Math.round(width),
      height: Math.round(height),
    });
  }

  function stopDialogInteraction(event) {
    if (dialogInteraction.current?.pointerId !== event.pointerId) return;
    dialogInteraction.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function openRecord(rawNo) {
    setDialogGeometry(null);
    detailDialog.current?.style.removeProperty("--raw-event-payload-max-height");
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setSelectedId(rawNo);
    setMode("detail");
    setDetail(null);
    setSnapshots([]);
    setSnapshotError("");
    setForm(null);
    setBaseline(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const [nextDetail, nextSnapshots] = await Promise.all([
        getRawEventDetail({ token: user?.token, rawNo, signal: controller.signal }),
        getRawEventSnapshots({ token: user?.token, rawNo, signal: controller.signal }).catch((snapshotRequestError) => {
          if (snapshotRequestError.name === "AbortError") throw snapshotRequestError;
          if (snapshotRequestError.status === 401) onUnauthorized?.();
          else setSnapshotError(snapshotRequestError.message);
          return [];
        }),
      ]);
      setDetail(nextDetail);
      setSnapshots(nextSnapshots);
      const values = { checkStatus: nextDetail?.checkStatus || "", memo: nextDetail?.memo || "" };
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

  function openDetail(rawNo) {
    openRecord(rawNo);
  }

  function openCreate() {
    setDialogGeometry(null);
    detailDialog.current?.style.removeProperty("--raw-event-payload-max-height");
    const values = emptyCreateForm();
    setSelectedId(null);
    setDetail(null);
    setSnapshots([]);
    setSnapshotError("");
    setMode("create");
    setForm(values);
    setBaseline(values);
  }

  function finishClose() {
    requestController.current?.abort();
    snapshotController.current?.abort();
    setSnapshotPreview(null);
    setDialogGeometry(null);
    detailDialog.current?.style.removeProperty("--raw-event-payload-max-height");
    setCloseConfirmOpen(false);
    setMode(null);
    setDetail(null);
    setForm(null);
    setBaseline(null);
  }

  function requestClose() {
    if (dirty) setCloseConfirmOpen(true);
    else finishClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form) return;
    if (mode === "create" && (!form.cameraId || !form.occurDt || !form.eventTypeCd)) {
      setNotice("카메라, 발생일시, 이벤트 유형을 입력해 주세요.");
      return;
    }
    if (mode === "create" && form.zoneId && !zoneOptions.some((zone) => zone.value === form.zoneId)) {
      setNotice("선택한 카메라에 등록된 감지구역을 선택해 주세요.");
      return;
    }
    if (mode === "edit" && form.checkStatus.length > 10) {
      setNotice("확인 상태는 10자 이하로 입력해 주세요.");
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
        setNotice("확인 상태와 비고가 저장되었습니다.");
      }
      refetch();
      finishClose();
    } catch (requestError) {
      if (requestError.status === 401) onUnauthorized?.();
      else setNotice(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function closeSnapshot() {
    snapshotController.current?.abort();
    setSnapshotPreview(null);
  }

  async function openSnapshot(snapshot) {
    snapshotController.current?.abort();
    const controller = new AbortController();
    snapshotController.current = controller;
    const title = snapshot.snapType || `스냅샷 ${snapshot.snapSeq}`;
    setSnapshotPreview({ title, loading: true, isVideo: snapshot.fileKind === "video", url: null });
    try {
      const blob = await getRawEventSnapshotFile({ token: user?.token, rawNo: snapshot.rawNo, snapSeq: snapshot.snapSeq, signal: controller.signal });
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      setSnapshotPreview({ title, loading: false, isVideo: snapshot.fileKind === "video", url });
    } catch (requestError) {
      if (requestError.name === "AbortError") return;
      setSnapshotPreview(null);
      if (requestError.status === 401) onUnauthorized?.();
      else setNotice(requestError.message);
    }
  }

  function renderCell(row, key) {
    if (key === "occurDt") return formatDateTime(row[key]);
    if (key === "zone") return row.zoneId || "-";
    if (key === "eventTypeCd") return eventTypeNames.get(row.eventTypeCd) || row.eventTypeCd || "-";
    if (key === "confidence") return formatConfidence(row.confidence);
    if (key === "snapCnt") return row.snapCnt ? `${row.snapCnt}개` : "-";
    if (key === "regType") return { AUTO: "자동", MANUAL: "수동" }[row.regType] || row.regType || "-";
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
            onRowClick={setSelectedId}
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

      <CrudModal
        ref={detailDialog}
        open={Boolean(mode)}
        mode={mode || "detail"}
        titles={{ create: "원천 이벤트 수동 입력", edit: "비고 수정", detail: "원천 이벤트 상세" }}
        formId="raw-event-form"
        className={`raw-event-dialog cctv-detail-dialog${mode !== "create" ? " raw-event-dialog--detail" : ""}${mode === "edit" ? " raw-event-dialog--editing" : ""}`}
        geometry={dialogGeometry}
        resizable
        saving={saving}
        saveLabel={mode === "edit" ? "수정" : "저장"}
        savingLabel={mode === "edit" ? "수정 중..." : "저장 중..."}
        onClose={requestClose}
        onSubmit={handleSubmit}
        onEdit={mode === "detail" && detail && form ? () => setMode("edit") : undefined}
        onCancelEdit={requestClose}
        onInteractionStart={startDialogInteraction}
        onInteractionMove={moveDialogInteraction}
        onInteractionEnd={stopDialogInteraction}
      >
        {mode === "create" && form ? (
          <section className="raw-event-form-section">
            <dl className="cctv-detail-table raw-event-detail-table">
              <div><dt>발생원</dt><dd>AI CCTV</dd></div>
              <div><dt>카메라</dt><dd className="is-editing"><DropDownMenu required value={form.cameraId} onChange={(event) => setForm((current) => ({ ...current, cameraId: event.target.value, zoneId: "" }))}><option value="">선택</option>{cameraOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</DropDownMenu></dd></div>
              <div><dt>감지구역</dt><dd className={`is-editing${zoneDisabled ? " is-disabled" : ""}`}><DropDownMenu value={form.zoneId} disabled={zoneDisabled} onChange={(event) => setForm((current) => ({ ...current, zoneId: event.target.value }))}><option value="">{zonePlaceholder}</option>{zoneOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</DropDownMenu></dd></div>
              <div><dt>발생일시</dt><dd className="is-editing"><input required type="datetime-local" value={form.occurDt} onChange={(event) => setForm((current) => ({ ...current, occurDt: event.target.value }))} /></dd></div>
              <div><dt>이벤트 유형</dt><dd className="is-editing"><DropDownMenu required value={form.eventTypeCd} onChange={(event) => setForm((current) => ({ ...current, eventTypeCd: event.target.value }))}><option value="">선택</option>{eventTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</DropDownMenu></dd></div>
              <div className="is-tall"><dt>입력 사유</dt><dd className="is-editing"><textarea maxLength={500} value={form.note} placeholder="수동 입력 사유를 입력하세요." onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></dd></div>
            </dl>
          </section>
        ) : detailLoading ? <div className="raw-event-detail-state"><Loader label="이벤트 상세 불러오는 중" /></div> : detailError ? <div className="raw-event-detail-state is-error">{detailError}</div> : detail ? (
          <div className="raw-event-detail-content">
            <section className="raw-event-form-section"><h3>수신 정보</h3><dl className="cctv-detail-table raw-event-detail-table">
              <div><dt>수신번호</dt><dd>{detail.rawNo || "-"}</dd></div>
              <div><dt>수신일시</dt><dd>{formatDateTime(detail.recvDt)}</dd></div>
              <div><dt>발생일시</dt><dd>{formatDateTime(detail.occurDt)}</dd></div>
              <div><dt>외부 이벤트ID</dt><dd className="is-long-value">{detail.extEventId || "-"}</dd></div>
              <div className="is-paired"><dt>카메라</dt><dd>{detail.cameraNm || "-"}</dd><dt>감지구역</dt><dd>{detail.zoneNm || "-"}</dd></div>
              <div className="is-paired"><dt>이벤트 유형</dt><dd>{eventTypeNames.get(detail.eventTypeCd) || detail.eventTypeCd || "-"}</dd><dt>AI 신뢰도</dt><dd>{formatConfidence(detail.confidence)}</dd></div>
              <div className="is-paired"><dt>등록 구분</dt><dd>{detail.regType === "MANUAL" ? "수동" : "자동"}</dd><dt>안전 이벤트</dt><dd>{detail.eventNo || "미등록"}</dd></div>
            </dl></section>
            <section className="raw-event-form-section"><h3>확인 정보</h3><dl className="cctv-detail-table raw-event-detail-table">
              <div><dt>확인 상태</dt>{mode === "edit" && form ? <dd className="is-editing"><CountedInput maxLength={10} value={form.checkStatus} onChange={(event) => setForm((current) => ({ ...current, checkStatus: event.target.value }))} aria-label="확인 상태" /></dd> : <dd>{detail.checkStatus || "-"}</dd>}</div>
              <div className="is-tall"><dt>비고</dt>{mode === "edit" && form ? <dd className="is-editing"><textarea maxLength={500} value={form.memo} onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} /></dd> : <dd className="is-multiline">{detail.memo || "-"}</dd>}</div>
            </dl></section>
            <section className="raw-event-form-section"><h3>스냅샷 <span>{snapshots.length}개</span></h3>{snapshotError ? <p className="raw-event-no-snapshot" role="alert">스냅샷을 불러오지 못했습니다. {snapshotError}</p> : snapshots.length ? <div className="raw-event-snapshot-list">{snapshots.map((snapshot) => <button key={snapshot.snapSeq} type="button" onClick={() => openSnapshot(snapshot)}><span className="snapshot-icon"><CameraIcon size={16} /></span><span><strong>{snapshot.snapType || `스냅샷 ${snapshot.snapSeq}`}</strong><small>{formatDateTime(snapshot.snapDt)} · {snapshot.fileKind || "file"}</small></span><EyeIcon size={16} /></button>)}</div> : <p className="raw-event-no-snapshot">첨부된 스냅샷이 없습니다.</p>}</section>
            <details className="raw-event-payload" onToggle={(event) => {
              if (event.currentTarget.open) event.currentTarget.querySelector("pre")?.scrollIntoView({ block: "nearest" });
              else detailDialog.current?.style.removeProperty("--raw-event-payload-max-height");
            }}><summary onClick={(event) => {
              if (event.currentTarget.parentElement.open || dialogGeometry) return;
              const dialog = detailDialog.current;
              if (dialog) dialog.style.setProperty("--raw-event-payload-max-height", `${dialog.offsetHeight}px`);
            }}>원본 payload 보기</summary><pre>{detail.payload || "원본 payload가 없습니다."}</pre></details>
          </div>
        ) : null}
      </CrudModal>
      <dialog
        ref={snapshotDialog}
        className="raw-event-preview-dialog"
        aria-label={snapshotPreview?.title || "스냅샷 미리보기"}
        onCancel={(event) => { event.preventDefault(); closeSnapshot(); }}
        onClick={(event) => { if (event.target === snapshotDialog.current) closeSnapshot(); }}
      >
        <div className="raw-event-preview-header">
          <strong>{snapshotPreview?.title}</strong>
          <button type="button" aria-label="미리보기 닫기" onClick={closeSnapshot}><CloseIcon size={20} aria-hidden="true" /></button>
        </div>
        <div className="raw-event-preview-body">
          {snapshotPreview?.loading ? <Loader label="스냅샷 불러오는 중" /> : snapshotPreview?.isVideo ? (
            <SnapshotVideo url={snapshotPreview.url} />
          ) : snapshotPreview?.url ? <img src={snapshotPreview.url} alt={snapshotPreview.title} /> : null}
        </div>
      </dialog>
      <ConfirmDialog
        open={closeConfirmOpen}
        title="저장되지 않은 내용이 있습니다."
        description="저장하지 않고 나가시겠습니까?"
        cancelLabel="취소"
        confirmLabel="나가기"
        onCancel={() => setCloseConfirmOpen(false)}
        onConfirm={finishClose}
      />
      <Toast open={Boolean(notice)} message={notice} onClose={() => setNotice("")} />
    </section>
  );
}
