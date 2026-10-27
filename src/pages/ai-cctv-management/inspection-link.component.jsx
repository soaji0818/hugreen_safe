import { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../../components/atoms/Badge/Badge";
import Loader from "../../components/atoms/Loader/Loader";
import ConfirmDialog from "../../components/molecules/ConfirmDialog/ConfirmDialog";
import DataTable from "../../components/organisms/DataTable/DataTable";
import CrudModal from "../../components/organisms/CrudModal/CrudModal";
import SearchConditions from "../../components/organisms/SearchConditions/SearchConditions";
import ContentTable from "../../components/templates/ContentTable/ContentTable";
import DateCondition from "../../components/molecules/SearchConditions/DateCondition";
import DropCondition from "../../components/molecules/SearchConditions/DropCondition";
import TableEmptyState from "../../components/molecules/EmptyState/TableEmptyState";
import Toast from "../../components/molecules/Toast/Toast";
import useCameraList from "../../hooks/useCameraList";
import useCommonCodes from "../../hooks/useCommonCodes";
import {
  addInspectionAction,
  createInspectionCheck,
  fetchInspectionCandidates,
  fetchInspectionCheck,
  fetchInspectionDocuments,
  fetchInspectionEvents,
  fetchInspectionItems,
  fetchInspectionResults,
  fetchInspectionActions,
  updateInspectionCheck,
  updateInspectionResults,
  updateInspectionAction,
} from "../../api/inspectionLinkApi";
import { buildInspectionEventPrefill } from "./inspection-link-prefill";
import "./styles/inspection-link.css";

const columns = [
  { key: "eventNo", label: "이벤트 ID" },
  { key: "occurDt", label: "발생일시" },
  { key: "cameraNm", label: "카메라명" },
  { key: "equipCd", label: "설비" },
  { key: "eventTypeCd", label: "이벤트 유형" },
  { key: "riskLvCd", label: "위험 단계" },
  { key: "linkedYn", label: "점검 등록 여부" },
  { key: "chkNo", label: "점검번호" },
];

function localDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function initialFilters() {
  const today = localDate(new Date());
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - 6);
  return { fromDt: localDate(start), toDt: today, period: "week", factoryCd: "", cameraId: "", eventTypeCd: "" };
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

function itemKey(item) {
  return `${item.secNo}|${item.itemNo}`;
}

export default function InspectionLinkPage({ user, onUnauthorized, onUnsavedChange }) {
  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionSeq, setActionSeq] = useState(null);
  const [form, setForm] = useState(null);
  const [resultValues, setResultValues] = useState({});
  const [prefilledKeys, setPrefilledKeys] = useState([]);
  const [approval, setApproval] = useState(null);
  const [actions, setActions] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [dialogGeometry, setDialogGeometry] = useState(null);
  const detailDialog = useRef(null);
  const dialogInteraction = useRef(null);

  const { data: factories, error: factoryError } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "FACTORY", onUnauthorized });
  const { data: eventTypes, error: typeError } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "EVT_TYPE", onUnauthorized });
  const { data: riskLevels } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "RISK_LV", onUnauthorized });
  const { data: approvalStatuses } = useCommonCodes({ enabled: Boolean(user?.token), token: user?.token, codeDiv: "APPR_STATUS", onUnauthorized });
  const { data: cameras, error: cameraError } = useCameraList({ enabled: Boolean(user?.token), token: user?.token, factoryCd: filters.factoryCd, onUnauthorized });

  const cameraOptions = useMemo(() => cameras.filter((camera) => camera.cameraId).map((camera) => ({ value: camera.cameraId, label: camera.cameraNm || camera.cameraId })), [cameras]);
  const typeNames = useMemo(() => new Map(eventTypes.map((item) => [item.value, item.label])), [eventTypes]);
  const riskNames = useMemo(() => new Map(riskLevels.map((item) => [item.value, item.label])), [riskLevels]);
  const factoryNames = useMemo(() => new Map(factories.map((item) => [item.value, item.label])), [factories]);
  const approvalNames = useMemo(() => new Map(approvalStatuses.map((item) => [item.value, item.label])), [approvalStatuses]);

  useEffect(() => {
    onUnsavedChange?.(dirty || saving);
    return () => onUnsavedChange?.(false);
  }, [dirty, saving, onUnsavedChange]);

  useEffect(() => {
    if (!user?.token || !filters.fromDt || !filters.toDt) return undefined;
    const controller = new AbortController();
    // Query changes clear the previous result before requesting the new one.
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError("");
    setRows([]);
    Promise.all([
      fetchInspectionEvents({ token: user.token, fromDt: filters.fromDt, toDt: filters.toDt, factoryCd: filters.factoryCd, cameraId: filters.cameraId, eventTypeCd: filters.eventTypeCd, signal: controller.signal }),
      fetchInspectionCandidates({ token: user.token, fromDt: filters.fromDt, toDt: filters.toDt, factoryCd: filters.factoryCd, eventTypeCd: filters.eventTypeCd, signal: controller.signal }),
    ]).then(([events, candidates]) => {
      const candidatesByNo = new Map((candidates.data || []).map((candidate) => [candidate.eventNo, candidate]));
      setRows((events.data || []).map((event, index) => ({
        ...event,
        ...(candidatesByNo.has(event.eventNo) ? {
          linkedYn: candidatesByNo.get(event.eventNo).linkedYn,
          chkNo: candidatesByNo.get(event.eventNo).chkNo,
          actionDesc: candidatesByNo.get(event.eventNo).actionDesc,
        } : {}),
        id: event.eventNo || `event-${index}`,
      })));
    }).catch((requestError) => {
      if (requestError.name === "AbortError") return;
      if (requestError.status === 401) onUnauthorized?.();
      else setError(requestError.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user?.token, filters.fromDt, filters.toDt, filters.factoryCd, filters.cameraId, filters.eventTypeCd, onUnauthorized, requestVersion]);

  useEffect(() => {
    if (!selected || selected.chkNo || !user?.token) return undefined;
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect
    setDocuments([]);
    setDocumentsLoading(true);
    setDocumentError("");
    fetchInspectionDocuments({ token: user.token, equipCd: selected.equipCd, signal: controller.signal })
      .then((payload) => {
        const available = payload.data || [];
        setDocuments(available);
        if (available.length === 1) {
          setForm((current) => current && !current.docCd ? { ...current, docCd: available[0].docCd } : current);
        }
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        if (requestError.status === 401) onUnauthorized?.();
        else setDocumentError(requestError.message);
      })
      .finally(() => { if (!controller.signal.aborted) setDocumentsLoading(false); });
    return () => controller.abort();
  }, [selected, user?.token, onUnauthorized]);

  useEffect(() => {
    if (!form?.docCd || selected?.chkNo || !user?.token) return undefined;
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect
    setItems([]);
    setResultValues({});
    setPrefilledKeys([]);
    setItemsLoading(true);
    setItemsError("");
    fetchInspectionItems({ token: user.token, docCd: form.docCd, signal: controller.signal })
      .then((payload) => {
        const nextItems = (payload.data || []).sort((a, b) => Number(a.secSortNo) - Number(b.secSortNo) || Number(a.sortNo) - Number(b.sortNo));
        const values = buildInspectionEventPrefill(nextItems, selected, {
          eventTypeName: selected.eventTypeName,
          riskName: selected.riskName,
          factoryName: selected.factoryName,
        });
        setItems(nextItems);
        setResultValues(values);
        setPrefilledKeys(Object.keys(values));
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        if (requestError.status === 401) onUnauthorized?.();
        else setItemsError(requestError.message);
      })
      .finally(() => { if (!controller.signal.aborted) setItemsLoading(false); });
    return () => controller.abort();
  }, [form?.docCd, selected, user?.token, onUnauthorized]);

  useEffect(() => {
    if (!selected?.chkNo || !user?.token) return undefined;
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect
    setDetailLoading(true);
    setFormError("");
    Promise.all([
      fetchInspectionCheck({ token: user.token, chkNo: selected.chkNo, signal: controller.signal }),
      fetchInspectionResults({ token: user.token, chkNo: selected.chkNo, signal: controller.signal }),
      fetchInspectionActions({ token: user.token, chkNo: selected.chkNo, signal: controller.signal }),
    ]).then(([check, results, actions]) => {
      const detail = check.data;
      const resultRows = results.data || [];
      const firstAction = actions.data?.[0];
      setForm({
        chkDt: detail.chkDt ? `${detail.chkDt.slice(0, 4)}-${detail.chkDt.slice(4, 6)}-${detail.chkDt.slice(6, 8)}` : "",
        docCd: detail.docCd || "",
        docNm: detail.docNm || detail.docCd || "",
        chkMemberId: detail.chkMemberId || "",
        actionDesc: firstAction?.actionDesc || "",
      });
      setItems(resultRows);
      setResultValues(Object.fromEntries(resultRows.map((item) => [itemKey(item), item.result || ""])));
      setPrefilledKeys([]);
      setApproval(detail);
      setActions(actions.data || []);
      setActionSeq(firstAction?.actSeq ?? null);
      setDirty(false);
    }).catch((requestError) => {
      if (requestError.name === "AbortError") return;
      if (requestError.status === 401) onUnauthorized?.();
      else setFormError(requestError.message);
    }).finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selected, user?.token, onUnauthorized]);

  function changeFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
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

  function openCreate(id) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    if (row.linkedYn === "Y" && !row.chkNo) {
      setNotice("연결된 점검번호가 없어 일지를 열 수 없습니다.");
      return;
    }
    setDialogGeometry(null);
    setSelected({
      ...row,
      eventTypeName: typeNames.get(row.eventTypeCd),
      riskName: riskNames.get(row.riskLvCd),
      factoryName: factoryNames.get(row.factoryCd),
    });
    if (row.chkNo) {
      setForm(null);
    } else {
      // The date is captured when the user opens the form, not during render.
      // eslint-disable-next-line react/purity
      setForm({ chkDt: localDate(new Date()), docCd: "", chkMemberId: user?.userId || "", actionDesc: row.actionDesc || "" });
    }
    setDocuments([]);
    setDocumentsLoading(!row.chkNo);
    setDocumentError("");
    setItems([]);
    setItemsLoading(false);
    setItemsError("");
    setResultValues({});
    setPrefilledKeys([]);
    setApproval(null);
    setActions([]);
    setActionSeq(null);
    setFormError("");
    setDirty(false);
  }

  function finishClose() {
    setLeaveConfirmOpen(false);
    setSelected(null);
    setForm(null);
    setDirty(false);
    setPrefilledKeys([]);
    setApproval(null);
    setActions([]);
  }

  function closeCreate() {
    if (saving) return;
    if (dirty) setLeaveConfirmOpen(true);
    else finishClose();
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setFormError("");
  }

  async function submitCheck(event) {
    event.preventDefault();
    if (!selected || !form || saving) return;
    if (!form.docCd || !form.chkDt || !form.chkMemberId.trim()) {
      setFormError("점검 문서, 점검일, 점검자를 입력해 주세요.");
      return;
    }
    if (detailLoading || itemsLoading || itemsError || !items.length) {
      setFormError("점검 항목을 확인한 뒤 등록해 주세요.");
      return;
    }
    const results = items.map((item) => ({
      secNo: item.secNo,
      itemNo: item.itemNo,
      result: resultValues[itemKey(item)]?.trim() || null,
      ...(selected.chkNo ? { photoPath: item.photoPath ?? null } : {}),
    }));
    if (!results.some((item) => item.result && !prefilledKeys.includes(itemKey(item)))) {
      setFormError("자동 입력 항목 외에 점검 결과를 한 항목 이상 확인·입력해 주세요.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (selected.chkNo) {
        await updateInspectionCheck({ token: user.token, chkNo: selected.chkNo, data: { chkDt: form.chkDt.replaceAll("-", ""), equipCd: selected.equipCd || null, chkMemberId: form.chkMemberId.trim() } });
        await updateInspectionResults({ token: user.token, chkNo: selected.chkNo, data: { results } });
        if (form.actionDesc.trim()) {
          const actionData = { actionDesc: form.actionDesc.trim(), actMemberId: form.chkMemberId.trim(), actDt: form.chkDt.replaceAll("-", "") };
          if (actionSeq != null) await updateInspectionAction({ token: user.token, chkNo: selected.chkNo, actSeq: actionSeq, data: actionData });
          else await addInspectionAction({ token: user.token, chkNo: selected.chkNo, data: actionData });
        }
        setSelected(null);
        setForm(null);
        setDirty(false);
        setRequestVersion((value) => value + 1);
        setNotice(`점검일지 ${selected.chkNo} 수정이 완료됐습니다.`);
        return;
      }
      const payload = await createInspectionCheck({
        token: user.token,
        data: { chkDt: form.chkDt.replaceAll("-", ""), docCd: form.docCd, equipCd: selected.equipCd || null, chkMemberId: form.chkMemberId.trim(), results, eventNos: [selected.eventNo] },
      });
      const chkNo = payload.data?.chkNo;
      let actionError = "";
      if (form.actionDesc.trim() && chkNo) {
        try {
          await addInspectionAction({ token: user.token, chkNo, data: { actionDesc: form.actionDesc.trim(), actMemberId: form.chkMemberId.trim(), actDt: form.chkDt.replaceAll("-", "") } });
        } catch (requestError) {
          actionError = requestError.message;
          if (requestError.status === 401) onUnauthorized?.();
        }
      }
      setSelected(null);
      setForm(null);
      setDirty(false);
      setRequestVersion((value) => value + 1);
      setNotice(actionError ? `점검일지 ${chkNo || ""} 등록 완료. 조치 사항 저장 실패: ${actionError}` : `점검일지 ${chkNo || ""} 등록 및 이벤트 연결을 완료했습니다.`);
    } catch (requestError) {
      if (requestError.status === 401) onUnauthorized?.();
      else setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function renderCell(row, key) {
    if (key === "eventNo") return <button type="button" className="inspection-link-event-button" onClick={(event) => { event.stopPropagation(); openCreate(row.id); }}>{row.eventNo}</button>;
    if (key === "occurDt") return formatDateTime(row.occurDt);
    if (key === "cameraNm") return row.cameraNm || row.cameraId || "-";
    if (key === "eventTypeCd") return typeNames.get(row.eventTypeCd) || row.eventTypeCd || "-";
    if (key === "riskLvCd") return riskNames.get(row.riskLvCd) || row.riskLvCd || "-";
    if (key === "linkedYn") return row.linkedYn ? <Badge tone={row.linkedYn === "Y" ? "green" : "gray"}>{row.linkedYn === "Y" ? "등록" : "미등록"}</Badge> : "-";
    return row[key] || "-";
  }

  return (
    <section className="work-panel inspection-link-page">
      <ContentTable>
        <SearchConditions onReset={() => setFilters(initialFilters())}>
          <DateCondition label="발생기간" startDate={filters.fromDt} endDate={filters.toDt} period={filters.period} onStartDateChange={(value) => changeFilters({ fromDt: value, period: "" })} onEndDateChange={(value) => changeFilters({ toDt: value, period: "" })} onPeriodChange={(period) => changeFilters(periodRange(period, filters.toDt))} />
          <DropCondition label="공장" value={filters.factoryCd} placeholder={factoryError ? "공장 조회 실패" : "전체"} options={factories} onChange={(value) => changeFilters({ factoryCd: value, cameraId: "" })} />
          <DropCondition label="카메라" value={filters.cameraId} placeholder={cameraError ? "카메라 조회 실패" : "전체"} options={cameraOptions} onChange={(value) => changeFilters({ cameraId: value })} />
          <DropCondition label="이벤트 유형" value={filters.eventTypeCd} placeholder={typeError ? "유형 조회 실패" : "전체"} options={eventTypes} onChange={(value) => changeFilters({ eventTypeCd: value })} />
        </SearchConditions>
        <div className="inspection-link-results">
          <DataTable columns={columns} rows={rows} selectable={false} onRowClick={openCreate} renderCell={renderCell} verticalScroll loading={loading} loadingLabel="연결할 이벤트 불러오는 중" stateRow={error ? <tr className="api-state-row"><td colSpan={columns.length}>{error}</td></tr> : undefined} emptyState={<TableEmptyState onAction={() => setFilters(initialFilters())} />} />
        </div>
      </ContentTable>

      <CrudModal ref={detailDialog} open={Boolean(selected)} mode="create" titles={{ create: selected?.chkNo ? "안전점검일지 수정" : "안전점검일지 등록" }} formId="inspection-link-form" className="inspection-link-dialog cctv-detail-dialog" geometry={dialogGeometry} resizable saving={saving} saveLabel={selected?.chkNo ? "수정" : "저장"} savingLabel={selected?.chkNo ? "수정 중..." : "저장 중..."} onClose={closeCreate} onSubmit={submitCheck} onInteractionStart={startDialogInteraction} onInteractionMove={moveDialogInteraction} onInteractionEnd={stopDialogInteraction}>
        {selected && detailLoading && <div className="inspection-link-loading"><Loader label="점검일지 불러오는 중" /></div>}
        {selected && !detailLoading && !form && formError && <p className="inspection-link-error inspection-link-loading" role="alert">{formError}</p>}
        {selected && form && <div className="inspection-link-form-content">
          <section className="inspection-link-context" aria-label="선택한 이벤트">
            <h3>선택한 AI CCTV 이벤트</h3>
            <dl>
              <div><dt>이벤트 ID</dt><dd>{selected.eventNo}</dd></div>
              <div><dt>발생일시</dt><dd>{formatDateTime(selected.occurDt)}</dd></div>
              <div><dt>카메라</dt><dd>{selected.cameraNm || selected.cameraId || "-"}</dd></div>
              <div><dt>감지구역</dt><dd>{selected.zoneNm || selected.zoneId || "-"}</dd></div>
              <div><dt>설비</dt><dd>{selected.equipCd || "-"}</dd></div>
              <div><dt>위치</dt><dd>{selected.locDesc || selected.zoneNm || selected.zoneId || "-"}</dd></div>
              <div><dt>이벤트 유형</dt><dd>{typeNames.get(selected.eventTypeCd) || selected.eventTypeCd || "-"}</dd></div>
              <div><dt>위험 단계</dt><dd>{riskNames.get(selected.riskLvCd) || selected.riskLvCd || "-"}</dd></div>
            </dl>
          </section>

          {selected.chkNo && approval && <section className="inspection-link-form-section inspection-link-approval">
            <h3>승인 상태</h3>
            <dl>
              <div><dt>상태</dt><dd>{approvalNames.get(approval.apprStatusCd) || approval.apprStatusCd || "-"}</dd></div>
              <div><dt>승인자</dt><dd>{approval.apprMemberId || "-"}</dd></div>
              <div><dt>승인일시</dt><dd>{formatDateTime(approval.apprDt)}</dd></div>
              {approval.rejectReason && <div><dt>반려 사유</dt><dd>{approval.rejectReason}</dd></div>}
            </dl>
          </section>}

          <section className="inspection-link-form-section">
            <h3>점검일지 정보</h3>
            <div className="inspection-link-fields">
              <label>점검 문서
                <select required disabled={Boolean(selected.chkNo)} value={form.docCd} onChange={(event) => updateForm("docCd", event.target.value)}>
                  <option value="">문서를 선택해 주세요</option>
                  {selected.chkNo && form.docCd && <option value={form.docCd}>{form.docNm}</option>}
                  {documents.map((doc) => <option key={doc.docCd} value={doc.docCd}>{doc.docNm || doc.docCd}</option>)}
                </select>
              </label>
              <label>점검일
                <input type="date" required value={form.chkDt} onChange={(event) => updateForm("chkDt", event.target.value)} />
              </label>
              <label>점검자 사번
                <input required maxLength={7} value={form.chkMemberId} onChange={(event) => updateForm("chkMemberId", event.target.value)} />
              </label>
            </div>
            {documentError && <p className="inspection-link-error">{documentError}</p>}
            {!selected.chkNo && documentsLoading && <div className="inspection-link-loading"><Loader size={24} label="점검 문서 불러오는 중" /></div>}
            {!selected.chkNo && !documentsLoading && !documentError && !documents.length && <p className="inspection-link-help">사용 가능한 점검 문서가 없습니다. 점검 문서·목차 관리에서 문서를 등록해 주세요.</p>}
          </section>

          <section className="inspection-link-form-section">
            <h3>항목별 점검 결과</h3>
            <p className="inspection-link-help">이벤트 정보와 이름이 일치하는 텍스트 항목은 자동 입력됩니다. 각 항목의 결과를 확인해 주세요.</p>
            {itemsLoading && <div className="inspection-link-loading"><Loader size={24} label="점검 항목 불러오는 중" /></div>}
            {itemsError && <p className="inspection-link-error">{itemsError}</p>}
            {!itemsLoading && form.docCd && !itemsError && !items.length && <p className="inspection-link-help">사용 가능한 점검 항목이 없습니다.</p>}
            {items.length > 0 && <div className="inspection-link-items">
              {items.map((item) => <label key={itemKey(item)}>
                <span><strong>{item.secNm ? `${item.secNm} / ` : ""}{item.itemNm}{prefilledKeys.includes(itemKey(item)) && <em className="inspection-link-prefilled">이벤트 자동 입력</em>}</strong>{item.criteria && <small>기준: {item.criteria}</small>}</span>
                <input maxLength={200} value={resultValues[itemKey(item)] || ""} onChange={(event) => { setResultValues((current) => ({ ...current, [itemKey(item)]: event.target.value })); setPrefilledKeys((current) => current.filter((key) => key !== itemKey(item))); setDirty(true); setFormError(""); }} placeholder="점검 결과 입력" />
              </label>)}
            </div>}
          </section>

          <section className="inspection-link-form-section">
            <h3>조치 사항</h3>
            <textarea maxLength={1000} value={form.actionDesc} onChange={(event) => updateForm("actionDesc", event.target.value)} placeholder="필요한 조치 내용을 입력해 주세요." />
            {selected.chkNo && actionSeq != null && <p className="inspection-link-help">기존 조치 사항은 내용을 입력해 수정할 수 있습니다. 빈칸은 기존 내용을 유지합니다.</p>}
            {actions.length > 0 && <div className="inspection-link-action-history">
              <h4>등록된 조치</h4>
              <ul>{actions.map((action) => <li key={action.actSeq}><span>{action.actDt || "날짜 없음"} · {action.actMemberId || "담당자 없음"}</span><p>{action.actionDesc || "-"}</p></li>)}</ul>
            </div>}
          </section>
          {formError && <p className="inspection-link-error" role="alert">{formError}</p>}
        </div>}
      </CrudModal>
      <ConfirmDialog
        open={leaveConfirmOpen}
        title="저장되지 않은 내용이 있습니다."
        description="저장하지 않고 나가시겠습니까?"
        confirmLabel="나가기"
        onCancel={() => setLeaveConfirmOpen(false)}
        onConfirm={finishClose}
      />
      <Toast open={Boolean(notice)} message={notice} onClose={() => setNotice("")} />
    </section>
  );
}
