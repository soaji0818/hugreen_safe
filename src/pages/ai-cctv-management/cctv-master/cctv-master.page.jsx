/* oxlint-disable react/only-export-components -- Page metadata and its dedicated component intentionally share this module. */
import { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../../components/organisms/DataTable/DataTable";
import ContentTable from "../../../components/templates/ContentTable/ContentTable";
import SearchConditions from "../../../components/organisms/SearchConditions/SearchConditions";
import DropCondition from "../../../components/molecules/SearchConditions/DropCondition";
import RadioCondition from "../../../components/molecules/SearchConditions/RadioConditioin";
import Badge from "../../../components/atoms/Badge/Badge";
import Button from "../../../components/atoms/Button/Button";
import ConfirmDialog from "../../../components/molecules/ConfirmDialog/ConfirmDialog";
import CrudModal from "../../../components/organisms/CrudModal/CrudModal";
import { FileIcon, PlusIcon, SearchIcon, TrashIcon } from "../../../components/atoms/Icon/Icon";
import DropDownMenu from "../../../components/atoms/Menu/DropDownMenu";
import Toast, { TOAST_MESSAGES } from "../../../components/molecules/Toast/Toast";
import useCameraList from "../../../hooks/useCameraList";
import useCommonCodes from "../../../hooks/useCommonCodes";
import useZoneList from "../../../hooks/useZoneList";
import { removeCamera, updateCamera } from "../../../services/cameraService";

const EMPTY_ROWS = [];
const columns = [
  "카메라ID",
  "카메라명",
  "공장",
  "설치 위치",
  "대상 설비",
  "모델",
  "IP 주소",
  "수신 유예시간(초)",
  "사용 여부",
];
const detailFields = [
  { label: "카메라ID", key: "cameraId", readOnly: true, required: true, maxLength: 20 },
  { label: "카메라명", key: "cameraNm", required: true, maxLength: 50 },
  { label: "공장", key: "factoryCd", type: "factory", required: true },
  { label: "설치 위치", key: "installLoc", maxLength: 100 },
  { label: "대상 설비", key: "equipCd", maxLength: 20 },
  { label: "모델", key: "modelNm", maxLength: 50 },
  { label: "IP 주소", key: "ipAddr", maxLength: 40 },
  { label: "수신 유예시간(초)", key: "recvGraceSec", type: "number", required: true },
  { label: "사용 여부", key: "useYn", type: "use", required: true },
];

function haveEditValuesChanged(values, baseline) {
  if (!values || !baseline) return false;
  return detailFields.some(({ key }) =>
    String(values[key] ?? "") !== String(baseline[key] ?? ""),
  );
}

export function CctvMasterPage({
  user,
  onUnauthorized,
  onUnsavedChange,
  detailPresentation = "modal",
}) {
  const [filters, setFilters] = useState({ factoryCd: "", focusYn: "", useYn: "", keyword: "" });
  const [localRows, setLocalRows] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDataReady, setDetailDataReady] = useState(true);
  const [createMode, setCreateMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState(null);
  const [editBaseline, setEditBaseline] = useState(null);
  const [savePending, setSavePending] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);
  const [deletePending, setDeletePending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [invalidField, setInvalidField] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [dialogGeometry, setDialogGeometry] = useState(null);
  const detailDialog = useRef(null);
  const dialogInteraction = useRef(null);
  const saveController = useRef(null);
  const detailCameraAfterRefetch = useRef("");
  const detailRequestsStarted = useRef(false);

  const { data: serverRows, loading, error, refetch } = useCameraList({
    enabled: true,
    token: user?.token,
    factoryCd: filters.factoryCd,
    focusYn: filters.focusYn,
    useYn: filters.useYn,
    onUnauthorized,
  });
  const { data: factoryCodes, loading: factoryLoading } = useCommonCodes({
    enabled: true,
    token: user?.token,
    codeDiv: "FACTORY",
    onUnauthorized,
  });

  useEffect(() => {
    // A fresh server response becomes the page-owned editable snapshot.
    // eslint-disable-next-line react/set-state-in-effect
    setLocalRows(serverRows);
    setSelectedIds([]);
    const detailCameraId = detailCameraAfterRefetch.current;
    const detailRow = detailCameraId
      ? serverRows.find((row) => (row.cameraId || row.id) === detailCameraId)
      : null;
    setSelectedId(detailRow?.id || serverRows[0]?.id || null);
    setCreateMode(false);
    setDetailOpen(Boolean(detailRow));
    setDetailDataReady(!detailRow);
    detailRequestsStarted.current = false;
    detailCameraAfterRefetch.current = "";
  }, [serverRows]);

  const rows = localRows || EMPTY_ROWS;
  const filteredRows = useMemo(() => rows.filter((row) => {
    if (!filters.keyword) return true;
    const keyword = filters.keyword.toLowerCase();
    return Object.values(row).some((value) =>
      String(value ?? "").toLowerCase().includes(keyword),
    );
  }), [rows, filters.keyword]);
  const selectedRow = rows.find((row) => row.id === selectedId) || null;
  const selectedCameraId = selectedRow?.cameraId || selectedRow?.id || "";
  const {
    data: zones,
    loading: zonesLoading,
    error: zonesError,
    refetch: refetchZones,
  } = useZoneList({
    enabled: detailOpen && !editMode && Boolean(selectedCameraId),
    token: user?.token,
    cameraId: selectedCameraId,
    onUnauthorized,
  });
  const {
    data: eventTypeCodes,
    loading: eventTypesLoading,
    error: eventTypesError,
  } = useCommonCodes({
    enabled: detailOpen && !editMode && Boolean(selectedCameraId),
    token: user?.token,
    codeDiv: "EVT_TYPE",
    onUnauthorized,
  });
  const eventTypeNameByCode = useMemo(
    () => new Map(eventTypeCodes.map((code) => [code.value, code.label])),
    [eventTypeCodes],
  );
  useEffect(() => {
    if (!detailOpen || editMode || !selectedCameraId) {
      detailRequestsStarted.current = false;
      setDetailDataReady(true);
      return;
    }
    if (zonesLoading || eventTypesLoading) {
      detailRequestsStarted.current = true;
      return;
    }
    if (detailRequestsStarted.current) setDetailDataReady(true);
  }, [detailOpen, editMode, selectedCameraId, zonesLoading, eventTypesLoading]);
  const hasUnsavedChanges = editMode
    && (savePending || haveEditValuesChanged(editValues, editBaseline));

  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
    return () => onUnsavedChange?.(false);
  }, [hasUnsavedChanges, onUnsavedChange]);

  useEffect(() => () => saveController.current?.abort(), []);

  const updateFilters = (changes) => {
    setFilters((current) => ({ ...current, ...changes }));
  };
  const resetFilters = () => {
    setFilters({ factoryCd: "", focusYn: "", useYn: "", keyword: "" });
  };
  const startDialogInteraction = (event, mode) => {
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
      mode,
      ...geometry,
    };
    setDialogGeometry(geometry);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };
  const moveDialogInteraction = (event) => {
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
  };
  const stopDialogInteraction = (event) => {
    if (dialogInteraction.current?.pointerId !== event.pointerId) return;
    dialogInteraction.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const toggleRow = (id) => {
    setSelectedId(id);
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };
  const toggleAllRows = (ids, checked) => {
    const visibleIds = new Set(ids);
    setSelectedIds((current) => checked
      ? [...new Set([...current, ...ids])]
      : current.filter((id) => !visibleIds.has(id)));
    if (!checked && visibleIds.has(selectedId)) setSelectedId(null);
  };
  const openDetail = (id) => {
    setDialogGeometry(null);
    setInvalidField("");
    setValidationMessage("");
    setEditBaseline(null);
    setSelectedId(id);
    setCreateMode(false);
    setEditMode(false);
    setEditValues(null);
    setDetailOpen(true);
    setDetailDataReady(false);
    detailRequestsStarted.current = false;
  };
  const openCreate = () => {
    const initialValues = {
      cameraId: "",
      cameraNm: "",
      factoryCd: filters.factoryCd || "",
      installLoc: "",
      equipCd: "",
      modelNm: "",
      ipAddr: "",
      recvGraceSec: 300,
      useYn: "Y",
    };
    setInvalidField("");
    setValidationMessage("");
    setDialogGeometry(null);
    setEditBaseline(initialValues);
    setCreateMode(true);
    setEditValues(initialValues);
    setEditMode(true);
    setDetailOpen(true);
    setDetailDataReady(true);
  };
  const discardAndCloseDetail = () => {
    saveController.current?.abort();
    saveController.current = null;
    setSavePending(false);
    setLeaveConfirmOpen(false);
    setCreateMode(false);
    setEditMode(false);
    setEditValues(null);
    setEditBaseline(null);
    setInvalidField("");
    setValidationMessage("");
    setDialogGeometry(null);
    setDetailOpen(false);
  };
  const closeDetail = () => {
    if (hasUnsavedChanges) {
      setLeaveConfirmOpen(true);
      return;
    }
    discardAndCloseDetail();
  };
  const startEditing = (event) => {
    event.preventDefault();
    if (!selectedRow) return;
    const initialValues = {
      cameraId: selectedRow.cameraId || selectedRow.id,
      cameraNm: selectedRow.cameraNm || "",
      factoryCd: selectedRow.factoryCd || "",
      installLoc: selectedRow.installLoc || "",
      equipCd: selectedRow.equipCd || "",
      modelNm: selectedRow.modelNm || "",
      ipAddr: selectedRow.ipAddr || "",
      recvGraceSec: selectedRow.recvGraceSec ?? 1,
      useYn: selectedRow.useYn || "Y",
    };
    setInvalidField("");
    setValidationMessage("");
    setEditBaseline(initialValues);
    setCreateMode(false);
    setEditValues(initialValues);
    setEditMode(true);
  };
  const updateEditValue = (key, value) => {
    setEditValues((current) => ({ ...current, [key]: value }));
  };
  const handleEditValueChange = (key, event) => {
    if (invalidField === key) {
      setInvalidField("");
      setValidationMessage("");
    }
    updateEditValue(key, event.target.value);
  };
  const saveChanges = async (event) => {
    event.preventDefault();
    if (!editValues || (!createMode && !selectedRow)) return;
    const form = event.currentTarget;

    const missingField = detailFields.find(({ key, required, readOnly }) =>
      required
      && (!readOnly || createMode)
      && String(editValues[key] ?? "").trim() === "",
    );
    if (missingField) {
      const missingControl = form.elements.namedItem(missingField.key);
      setInvalidField(missingField.key);
      setValidationMessage("* 표시는 필숫값입니다.");
      window.requestAnimationFrame(() => missingControl?.focus());
      return;
    }

    const cameraId = createMode
      ? editValues.cameraId.trim()
      : selectedRow.cameraId || selectedRow.id;
    if (!cameraId) return;
    const duplicateCameraId = createMode && rows.some((row) =>
      String(row.cameraId || row.id).trim().toLocaleUpperCase()
      === cameraId.toLocaleUpperCase(),
    );
    if (duplicateCameraId) {
      const cameraIdControl = form.elements.namedItem("cameraId");
      setInvalidField("cameraId");
      setValidationMessage("중복된 ID입니다.");
      window.requestAnimationFrame(() => cameraIdControl?.focus());
      return;
    }
    const wasCreating = createMode;

    const controller = new AbortController();
    saveController.current = controller;
    setSavePending(true);
    try {
      await updateCamera({
        token: user?.token,
        cameraId,
        signal: controller.signal,
        data: {
          cameraNm: editValues.cameraNm.trim(),
          factoryCd: editValues.factoryCd,
          installLoc: editValues.installLoc.trim() || null,
          equipCd: editValues.equipCd.trim() || null,
          modelNm: editValues.modelNm.trim() || null,
          ipAddr: editValues.ipAddr.trim() || null,
          recvGraceSec: Number(editValues.recvGraceSec),
          useYn: editValues.useYn,
        },
      });
      setCreateMode(false);
      setEditMode(false);
      setEditValues(null);
      setEditBaseline(null);
      setInvalidField("");
      setValidationMessage("");
      if (!wasCreating) detailCameraAfterRefetch.current = cameraId;
      if (wasCreating) setDialogGeometry(null);
      setDetailOpen(!wasCreating);
      setNotice({
        title: wasCreating ? TOAST_MESSAGES.save : TOAST_MESSAGES.update,
        description: wasCreating ? TOAST_MESSAGES.save : TOAST_MESSAGES.update,
      });
      refetch();
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }
      if (requestError.status === 401) {
        onUnauthorized?.();
      } else {
        const errorMessage = requestError.message || "카메라 정보를 다시 확인해 주세요.";
        const isDuplicateError = wasCreating && (
          requestError.status === 409
          || /중복|duplicate|already exists|이미.*(?:존재|사용)/i.test(errorMessage)
        );
        if (isDuplicateError) {
          const cameraIdControl = form.elements.namedItem("cameraId");
          setInvalidField("cameraId");
          setValidationMessage("중복된 ID입니다.");
          window.requestAnimationFrame(() => cameraIdControl?.focus());
        } else if (!errorMessage.includes("입력값을 확인하세요")) {
          setNotice({
            title: "저장하지 못했습니다.",
            description: errorMessage,
          });
        }
      }
    } finally {
      if (saveController.current === controller) {
        saveController.current = null;
        setSavePending(false);
      }
    }
  };
  const openDeleteConfirm = (targetIds) => {
    setDeleteTargetIds(targetIds);
    setDeleteOpen(true);
  };
  const deleteSelected = async () => {
    const targetIds = deleteTargetIds;
    if (targetIds.length === 0) return;

    setDeletePending(true);
    const results = await Promise.allSettled(
      targetIds.map((cameraId) => removeCamera({ token: user?.token, cameraId })),
    );
    const completed = results.filter((result) => result.status === "fulfilled");
    const failed = results.filter((result) => result.status === "rejected");
    const unauthorized = failed.some((result) => result.reason?.status === 401);

    setDeletePending(false);
    setDeleteOpen(false);
    setDeleteTargetIds([]);
    setDialogGeometry(null);
    setDetailOpen(false);
    setSelectedIds([]);
    setSelectedId(null);
    refetch();

    if (unauthorized) {
      onUnauthorized?.();
      return;
    }

    if (failed.length > 0) {
      setNotice({
        title: completed.length > 0 ? "일부 항목만 처리되었습니다." : "처리하지 못했습니다.",
        description: completed.length > 0
          ? `${completed.length}건은 처리되었으며 ${failed.length}건은 처리하지 못했습니다.`
          : failed[0].reason?.message || "카메라 삭제 중 문제가 발생했습니다.",
      });
      return;
    }

    if (targetIds.length === 1) {
      setNotice({
        title: TOAST_MESSAGES.delete,
        description: TOAST_MESSAGES.delete,
      });
      return;
    }

    setNotice({
      title: TOAST_MESSAGES.delete,
      description: TOAST_MESSAGES.delete,
    });
  };

  return (
    <section
      className={`work-panel screen-format-list-detail cctv-master-page${detailPresentation === "shrink-panel" && detailOpen ? " is-shrink-panel-open" : ""}`}
      aria-label="AI CCTV 기준정보 관리 업무 영역"
    >
      <ContentTable>
      <SearchConditions className="standard-filter-panel" onReset={resetFilters}>
        <SearchConditions.Row columns={3} className="cctv-master-filter-grid">
          <DropCondition
            label="공장"
            value={filters.factoryCd}
            disabled={factoryLoading}
            onChange={(factoryCd) => updateFilters({ factoryCd })}
            placeholder="전체"
            options={factoryCodes}
          />
          <RadioCondition
            label="집중감시구역 여부"
            name="cctv-focus"
            value={filters.focusYn}
            onChange={(focusYn) => updateFilters({ focusYn })}
            options={[{ label: "전체", value: "" }, { label: "집중감시", value: "Y" }, { label: "일반구역", value: "N" }]}
          />
          <RadioCondition
            label="사용 여부"
            name="cctv-use"
            value={filters.useYn}
            onChange={(useYn) => updateFilters({ useYn })}
            options={[{ label: "전체", value: "" }, { label: "사용", value: "Y" }, { label: "미사용", value: "N" }]}
          />
        </SearchConditions.Row>
      </SearchConditions>

      <div className={`cctv-master-content${detailPresentation === "shrink-panel" && detailOpen ? " has-shrink-panel" : ""}`}>
        <section className="table-panel screen-format-list-detail cctv-master-table" aria-label="조회 결과">
          <DataTable
          columns={columns}
          rows={filteredRows}
          totalCount={filteredRows.length}
          toolbarActions={(
            <>
              <Button variant="fill" className="danger-button cctv-toolbar-delete" icon={TrashIcon} disabled={selectedIds.length === 0} onClick={() => openDeleteConfirm(selectedIds)}>삭제</Button>
              <Button variant="fill" icon={PlusIcon} onClick={openCreate}>추가</Button>
            </>
          )}
          selectedId={selectedId}
          selectedIds={selectedIds}
          resizableColumns
          onRowClick={setSelectedId}
          onRowDoubleClick={openDetail}
          onToggleRow={toggleRow}
          onToggleAll={toggleAllRows}
          emptyState={loading ? <></> : undefined}
          renderCell={(row, column) => column === "사용 여부" ? (
            <Badge size="small" variant="weak" tone={row.useYn === "N" ? "gray" : "green"}>
              {row[column]}
            </Badge>
          ) : row[column]}
          stateRow={(error || (!loading && filteredRows.length === 0)) ? (
            <tr className="api-state-row">
              <td colSpan={columns.length + 1}>
                {error ? (
                  <div className="cctv-empty-state">
                    <span className="cctv-empty-icon" aria-hidden="true">
                      <FileIcon size={48} aria-hidden="true" />
                    </span>
                    <h3>화면을 불러오지 못했습니다.</h3>
                    <p>시스템에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주십시오.</p>
                    <Button
                      variant="fill"
                      onClick={() => {
                        resetFilters();
                        refetch();
                      }}
                    >
                      다시 시도하기
                    </Button>
                  </div>
                ) : (
                  <div className="cctv-empty-state">
                    <span className="cctv-empty-icon" aria-hidden="true">
                      <SearchIcon size={48} aria-hidden="true" />
                    </span>
                    <h3>검색 결과가 없습니다</h3>
                    <p>검색 조건을 변경하거나 초기화해 주세요.</p>
                    <Button variant="weak" onClick={resetFilters}>
                      조건 초기화
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ) : null}
          />
        </section>

        {(selectedRow || createMode) && (
          <CrudModal
          ref={detailDialog}
          open={detailPresentation === "modal" ? detailOpen && detailDataReady : detailOpen}
          presentation={detailPresentation}
          mode={createMode ? "create" : editMode ? "edit" : "detail"}
          titles={{
            create: "카메라 추가",
            edit: "카메라 정보 수정",
            detail: "카메라 상세 정보",
          }}
          formId="cctv-detail-form"
          className="cctv-detail-dialog"
          geometry={detailPresentation === "modal" ? dialogGeometry : undefined}
          saving={savePending}
          resizable={detailPresentation === "modal"}
          onClose={closeDetail}
          onSubmit={saveChanges}
          onEdit={startEditing}
          onDelete={() => openDeleteConfirm([selectedRow.id])}
          onInteractionStart={detailPresentation === "modal" ? startDialogInteraction : undefined}
          onInteractionMove={detailPresentation === "modal" ? moveDialogInteraction : undefined}
          onInteractionEnd={detailPresentation === "modal" ? stopDialogInteraction : undefined}
        >
            <dl className="cctv-detail-table">
              {detailFields.map((field) => (
                <div key={field.key}>
                  <dt>
                    {field.label}
                    {editMode && field.required && (
                      <span className="cctv-required-mark" aria-label="필수 입력">*</span>
                    )}
                  </dt>
                  <dd className={editMode
                    ? `is-editing${field.readOnly && !createMode ? " is-readonly" : ""}${invalidField === field.key ? " is-invalid" : ""}`
                    : field.key === "useYn" ? `status-${selectedRow.useYn === "N" ? "off" : "on"}` : undefined}
                  >
                    {!editMode || (field.readOnly && !createMode) ? (selectedRow?.[field.label] ?? "-") : field.type === "factory" ? (
                      <DropDownMenu
                        name={field.key}
                        aria-label={field.label}
                        aria-invalid={invalidField === field.key}
                        value={editValues?.[field.key] ?? ""}
                        required={field.required}
                        disabled={savePending}
                        onChange={(event) => handleEditValueChange(field.key, event)}
                      >
                        <option value="">공장을 선택하세요</option>
                        {factoryCodes.map((code) => <option key={code.value} value={code.value}>{code.label}</option>)}
                      </DropDownMenu>
                    ) : field.type === "use" ? (
                      <DropDownMenu
                        name={field.key}
                        aria-label={field.label}
                        aria-invalid={invalidField === field.key}
                        value={editValues?.[field.key] ?? "Y"}
                        required={field.required}
                        disabled={savePending}
                        onChange={(event) => handleEditValueChange(field.key, event)}
                      >
                        <option value="Y">사용</option>
                        <option value="N">미사용</option>
                      </DropDownMenu>
                    ) : (
                      <input
                        name={field.key}
                        aria-label={field.label}
                        aria-invalid={invalidField === field.key}
                        type={field.type === "number" ? "number" : "text"}
                        value={editValues?.[field.key] ?? ""}
                        required={field.required}
                        min={field.type === "number" ? 1 : undefined}
                        max={field.type === "number" ? 86400 : undefined}
                        maxLength={field.maxLength}
                        disabled={savePending}
                        onChange={(event) => handleEditValueChange(field.key, event)}
                      />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {invalidField && (
              <p className="cctv-required-message" role="alert">{validationMessage}</p>
            )}
            {!editMode && (
              <section className="cctv-zone-section" aria-labelledby="cctv-zone-title">
                <div className="cctv-zone-heading">
                  <h3 id="cctv-zone-title">감지구역</h3>
                  <span className="cctv-zone-count">
                    {!zonesLoading && !zonesError ? zones.length : (selectedRow.zoneCnt ?? 0)}개
                  </span>
                </div>
                <div id="cctv-zone-content">
                    {zonesLoading ? null : zonesError ? (
                      <div className="cctv-zone-state is-error">
                        <p>{zonesError}</p>
                        <Button type="button" variant="weak" onClick={refetchZones}>다시 불러오기</Button>
                      </div>
                    ) : zones.length === 0 ? (
                      <p className="cctv-zone-state">등록된 감지구역이 없습니다.</p>
                    ) : (
                      <ul className={`cctv-zone-list${zones.length >= 2 ? " is-scrollable" : ""}`}>
                        {zones.map((zone) => (
                          <li key={zone.zoneId} className={zone.useYn === "N" ? "is-inactive" : undefined}>
                            <div className="cctv-zone-summary">
                              <strong>{zone.zoneNm || zone.zoneId}</strong>
                              <Badge className="cctv-zone-status" size="small" variant="weak" tone={zone.useYn === "N" ? "gray" : "green"}>
                                {zone.useYn === "N" ? "미사용" : "사용"}
                              </Badge>
                            </div>
                            <div className="cctv-zone-events" aria-label={`${zone.zoneNm || zone.zoneId} 감지 이벤트 유형`}>
                              <span className="cctv-zone-events-label">감지 이벤트 유형</span>
                              {eventTypesLoading ? null : zone.eventTypeCds.length > 0 ? (
                                zone.eventTypeCds.map((code) => (
                                  <span className="cctv-zone-event-tag" key={code}>
                                    {eventTypeNameByCode.get(code) || code}
                                  </span>
                                ))
                              ) : (
                                <span className="cctv-zone-event-empty">설정 없음</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {eventTypesError && zones.length > 0 && (
                      <p className="cctv-zone-code-error">이벤트 유형 이름을 불러오지 못해 코드로 표시합니다.</p>
                    )}
                </div>
              </section>
            )}
          </CrudModal>
        )}
      </div>
      </ContentTable>

      <ConfirmDialog
        open={leaveConfirmOpen}
        title="저장되지 않은 내용이 있습니다."
        description="저장하지 않고 나가시겠습니까?"
        confirmLabel="나가기"
        onCancel={() => setLeaveConfirmOpen(false)}
        onConfirm={discardAndCloseDetail}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="삭제하시겠습니까?"
        description="이 작업은 되돌릴 수 없습니다."
        cancelDisabled={deletePending}
        confirmLabel={deletePending ? "처리 중..." : "삭제하기"}
        confirmVariant="fill"
        confirmClassName="danger-button"
        confirmDisabled={deletePending}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTargetIds([]);
        }}
        onConfirm={deleteSelected}
      />
      <Toast
        open={Boolean(notice)}
        message={notice?.description}
        onClose={() => setNotice(null)}
      />
    </section>
  );
}

export default {
  id: "MES-TD3-016",
  title: "AI CCTV 기준정보 관리",
  Component: CctvMasterPage,
  viewGroup: "cctv-master",
  viewLabel: "모달형",
  viewOrder: 1,
  config: {
    actions: { save: true, export: false, create: true, delete: true, createLabel: "추가" },
    filters: ["공장", "집중감시구역 여부", "사용 여부"],
    cols: [
      "카메라ID",
      "카메라명",
      "공장",
      "설치 위치",
      "대상 설비",
      "사용 여부",
    ],
    detail: "camera",
    detailPresentation: "modal",
  },
};
