/* oxlint-disable react/only-export-components -- Page metadata and its dedicated component intentionally share this module. */
import { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../components/data-table/DataTable";
import Pagination from "../../components/data-table/Pagination";
import SearchFilterPanel from "../../components/filters/SearchFilterPanel";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Icon from "../../components/ui/Icon";
import RadioOption from "../../components/ui/RadioOption";
import Toast from "../../components/ui/Toast";
import useCameraList from "../../hooks/useCameraList";
import useCommonCodes from "../../hooks/useCommonCodes";
import useZoneList from "../../hooks/useZoneList";
import { removeCamera, updateCamera } from "../../services/cameraService";

const PAGE_SIZE = 10;
const EMPTY_ROWS = [];
const columns = ["카메라ID", "카메라명", "공장", "설치 위치", "대상 설비", "사용 여부"];
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

function CctvMasterPage({ user, onUnauthorized, onUnsavedChange }) {
  const [filters, setFilters] = useState({ factoryCd: "", focusYn: "", useYn: "", keyword: "" });
  const [localRows, setLocalRows] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [zonesExpanded, setZonesExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState(null);
  const [editBaseline, setEditBaseline] = useState(null);
  const [savePending, setSavePending] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);
  const [deletePending, setDeletePending] = useState(false);
  const [notice, setNotice] = useState(null);
  const detailDialog = useRef(null);
  const saveController = useRef(null);

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
    setSelectedId(serverRows[0]?.id || null);
    setCreateMode(false);
    setDetailOpen(false);
    setPage(1);
  }, [serverRows]);

  const rows = localRows || EMPTY_ROWS;
  const filteredRows = useMemo(() => rows.filter((row) => {
    if (!filters.keyword) return true;
    const keyword = filters.keyword.toLowerCase();
    return Object.values(row).some((value) =>
      String(value ?? "").toLowerCase().includes(keyword),
    );
  }), [rows, filters.keyword]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedRow = rows.find((row) => row.id === selectedId) || null;
  const selectedCameraId = selectedRow?.cameraId || selectedRow?.id || "";
  const {
    data: zones,
    loading: zonesLoading,
    error: zonesError,
    refetch: refetchZones,
  } = useZoneList({
    enabled: detailOpen && zonesExpanded,
    token: user?.token,
    cameraId: selectedCameraId,
    onUnauthorized,
  });
  const {
    data: eventTypeCodes,
    loading: eventTypesLoading,
    error: eventTypesError,
  } = useCommonCodes({
    enabled: detailOpen && zonesExpanded,
    token: user?.token,
    codeDiv: "EVT_TYPE",
    onUnauthorized,
  });
  const eventTypeNameByCode = useMemo(
    () => new Map(eventTypeCodes.map((code) => [code.value, code.label])),
    [eventTypeCodes],
  );
  const hasUnsavedChanges = editMode
    && (savePending || haveEditValuesChanged(editValues, editBaseline));

  useEffect(() => {
    const dialog = detailDialog.current;
    if (!dialog) return;

    const canShowDetail = createMode || Boolean(selectedRow);
    if (detailOpen && canShowDetail && !dialog.open) dialog.showModal();
    if ((!detailOpen || !canShowDetail) && dialog.open) dialog.close();
  }, [createMode, detailOpen, selectedRow]);

  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
    return () => onUnsavedChange?.(false);
  }, [hasUnsavedChanges, onUnsavedChange]);

  useEffect(() => () => saveController.current?.abort(), []);

  const updateFilters = (changes) => {
    setFilters((current) => ({ ...current, ...changes }));
    setPage(1);
  };
  const resetFilters = () => {
    setFilters({ factoryCd: "", focusYn: "", useYn: "", keyword: "" });
    setPage(1);
  };
  const toggleRow = (id) => {
    setSelectedId(id);
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };
  const openDetail = (id) => {
    setEditBaseline(null);
    setSelectedId(id);
    setCreateMode(false);
    setZonesExpanded(false);
    setEditMode(false);
    setEditValues(null);
    setDetailOpen(true);
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
    setEditBaseline(initialValues);
    setCreateMode(true);
    setZonesExpanded(false);
    setEditValues(initialValues);
    setEditMode(true);
    setDetailOpen(true);
  };
  const discardAndCloseDetail = () => {
    saveController.current?.abort();
    saveController.current = null;
    setSavePending(false);
    setLeaveConfirmOpen(false);
    setCreateMode(false);
    setZonesExpanded(false);
    setEditMode(false);
    setEditValues(null);
    setEditBaseline(null);
    setDetailOpen(false);
  };
  const closeDetail = () => {
    if (hasUnsavedChanges) {
      setLeaveConfirmOpen(true);
      return;
    }
    discardAndCloseDetail();
  };
  const startEditing = () => {
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
    setEditBaseline(initialValues);
    setCreateMode(false);
    setZonesExpanded(false);
    setEditValues(initialValues);
    setEditMode(true);
  };
  const updateEditValue = (key, value) => {
    setEditValues((current) => ({ ...current, [key]: value }));
  };
  const saveChanges = async (event) => {
    event.preventDefault();
    if (!editValues || (!createMode && !selectedRow)) return;

    const cameraId = createMode
      ? editValues.cameraId.trim()
      : selectedRow.cameraId || selectedRow.id;
    if (!cameraId) return;
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
      setDetailOpen(false);
      setNotice({
        title: "저장이 완료되었습니다.",
        description: wasCreating ? "카메라가 추가되었습니다." : "수정 내용이 저장되었습니다.",
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
        if (!errorMessage.includes("입력값을 확인하세요")) {
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
    const deactivatedCount = completed.filter((result) => result.value.deactivated).length;
    const deletedCount = completed.length - deactivatedCount;
    const unauthorized = failed.some((result) => result.reason?.status === 401);

    setDeletePending(false);
    setDeleteOpen(false);
    setDeleteTargetIds([]);
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
        title: "처리가 완료되었습니다.",
        description: deactivatedCount === 1
          ? "이벤트 이력이 있어 삭제하지 않고 미사용으로 변경했습니다."
          : "작업이 완료되었습니다.",
      });
      return;
    }

    setNotice({
      title: "처리가 완료되었습니다.",
      description: deactivatedCount > 0
        ? `${deletedCount}건을 삭제하고 ${deactivatedCount}건은 미사용으로 변경했습니다.`
        : `${deletedCount}건을 삭제했습니다.`,
    });
  };

  return (
    <section className="work-panel screen-format-list-detail" aria-label="AI CCTV 기준정보 관리 업무 영역">
      <SearchFilterPanel
        className="standard-filter-panel"
        ariaLabel="AI CCTV 기준정보 관리 조회 조건"
        keyword={filters.keyword}
        onKeywordChange={(keyword) => updateFilters({ keyword })}
        onReset={resetFilters}
      >
        <div className="filter-grid standard-filter-grid cctv-master-filter-grid" data-count="3" style={{ "--filter-columns": 3 }}>
          <label>
            <span>공장</span>
            <span className="factory-radio-options" role="radiogroup" aria-label="공장">
              {factoryLoading ? <span className="factory-codes-message">공장 코드를 불러오는 중입니다.</span> : (
                [{ value: "", label: "전체" }, ...factoryCodes].map((code) => (
                  <RadioOption
                    className="factory-radio-option"
                    key={code.value || "all"}
                    name="cctv-factory"
                    value={code.value}
                    checked={filters.factoryCd === code.value}
                    onChange={() => updateFilters({ factoryCd: code.value })}
                  >
                    {code.label}
                  </RadioOption>
                ))
              )}
            </span>
          </label>
          <label>
            <span>집중감시구역 여부</span>
            <span className="radio-options" role="radiogroup" aria-label="집중감시구역 여부">
              {[{ label: "전체", value: "" }, { label: "집중감시", value: "Y" }, { label: "일반구역", value: "N" }].map((option) => (
                <RadioOption
                  key={option.value || "all"}
                  name="cctv-focus"
                  value={option.value}
                  checked={filters.focusYn === option.value}
                  onChange={() => updateFilters({ focusYn: option.value })}
                >
                  {option.label}
                </RadioOption>
              ))}
            </span>
          </label>
          <label>
            <span>사용 여부</span>
            <span className="radio-options" role="radiogroup" aria-label="사용 여부">
              {[{ label: "전체", value: "" }, { label: "사용", value: "Y" }, { label: "미사용", value: "N" }].map((option) => (
                <RadioOption
                  key={option.label}
                  name="cctv-use"
                  value={option.value}
                  checked={filters.useYn === option.value}
                  onChange={() => updateFilters({ useYn: option.value })}
                >
                  {option.label}
                </RadioOption>
              ))}
            </span>
          </label>
        </div>
      </SearchFilterPanel>

      <div className="list-actions" aria-label="목록 작업">
        {selectedIds.length > 0 && (
          <Button variant="danger-button" icon="trash" onClick={() => openDeleteConfirm(selectedIds)}>삭제</Button>
        )}
        {selectedIds.length === 0 && <Button variant="primary" icon="plus" onClick={openCreate}>추가</Button>}
      </div>

      <section className="table-panel screen-format-list-detail cctv-master-table" aria-label="조회 결과">
        <DataTable
          columns={columns}
          rows={visibleRows}
          selectedId={selectedId}
          selectedIds={selectedIds}
          resizableColumns
          onRowClick={setSelectedId}
          onRowDoubleClick={openDetail}
          onToggleRow={toggleRow}
          renderCell={(row, column) => column === "사용 여부" ? (
            <span className={`cctv-status-badge ${row.useYn === "N" ? "is-off" : "is-on"}`}>
              {row[column]}
            </span>
          ) : row[column]}
          stateRow={(loading || error || visibleRows.length === 0) ? (
            <tr className="api-state-row">
              <td colSpan={columns.length + 1}>
                {loading ? "카메라 목록을 불러오는 중입니다." : error ? (
                  <div className="cctv-empty-state">
                    <span className="cctv-empty-icon" aria-hidden="true">
                      <Icon name="file" size={48} />
                    </span>
                    <h3>화면을 불러오지 못했습니다.</h3>
                    <p>시스템에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주십시오.</p>
                    <Button
                      variant="primary"
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
                      <Icon name="search" size={48} />
                    </span>
                    <h3>검색 결과가 없습니다</h3>
                    <p>검색 조건을 변경하거나 초기화해 주세요.</p>
                    <Button variant="secondary" onClick={resetFilters}>
                      조건 초기화
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ) : null}
        />
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </section>

      {(selectedRow || createMode) && (
        <dialog
          className="detail-dialog cctv-detail-dialog"
          ref={detailDialog}
          onCancel={(event) => {
            event.preventDefault();
            closeDetail();
          }}
          onClick={(event) => {
            if (event.target === detailDialog.current) closeDetail();
          }}
          aria-labelledby="cctv-detail-title"
        >
          <div className="detail-header">
            <div className="cctv-detail-heading">
              <h2 id="cctv-detail-title">
                {createMode ? "카메라 추가" : editMode ? "카메라 정보 수정" : "카메라 상세 정보"}
              </h2>
            </div>
            <button type="button" className="cctv-detail-close" aria-label="상세 정보 닫기" onClick={closeDetail}>
              <Icon name="close" size={20} />
            </button>
          </div>
          <form
            id="cctv-detail-form"
            className="detail-body"
            noValidate={!createMode}
            onSubmit={saveChanges}
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
                    ? `is-editing${field.readOnly && !createMode ? " is-readonly" : ""}`
                    : field.key === "useYn" ? `status-${selectedRow.useYn === "N" ? "off" : "on"}` : undefined}
                  >
                    {!editMode || (field.readOnly && !createMode) ? (selectedRow?.[field.label] ?? "-") : field.type === "factory" ? (
                      <select
                        aria-label={field.label}
                        value={editValues?.[field.key] ?? ""}
                        required={field.required}
                        disabled={savePending}
                        onChange={(event) => updateEditValue(field.key, event.target.value)}
                      >
                        <option value="">공장을 선택하세요</option>
                        {factoryCodes.map((code) => <option key={code.value} value={code.value}>{code.label}</option>)}
                      </select>
                    ) : field.type === "use" ? (
                      <select
                        aria-label={field.label}
                        value={editValues?.[field.key] ?? "Y"}
                        required={field.required}
                        disabled={savePending}
                        onChange={(event) => updateEditValue(field.key, event.target.value)}
                      >
                        <option value="Y">사용</option>
                        <option value="N">미사용</option>
                      </select>
                    ) : (
                      <input
                        aria-label={field.label}
                        type={field.type === "number" ? "number" : "text"}
                        value={editValues?.[field.key] ?? ""}
                        required={field.required}
                        min={field.type === "number" ? 1 : undefined}
                        max={field.type === "number" ? 86400 : undefined}
                        maxLength={field.maxLength}
                        disabled={savePending}
                        onChange={(event) => updateEditValue(field.key, event.target.value)}
                      />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {!editMode && (
              <section className="cctv-zone-section" aria-labelledby="cctv-zone-title">
                <div className="cctv-zone-heading">
                  <h3 id="cctv-zone-title">감지구역</h3>
                  <div className="cctv-zone-heading-actions">
                    <span>{zonesExpanded && !zonesLoading && !zonesError ? zones.length : (selectedRow.zoneCnt ?? 0)}개</span>
                    <button
                      type="button"
                      className="cctv-zone-toggle"
                      aria-expanded={zonesExpanded}
                      aria-controls="cctv-zone-content"
                      onClick={() => setZonesExpanded((expanded) => !expanded)}
                    >
                      {zonesExpanded ? "접기" : "더보기"}
                    </button>
                  </div>
                </div>
                {zonesExpanded && (
                  <div id="cctv-zone-content">
                    {zonesLoading ? (
                      <p className="cctv-zone-state">감지구역을 불러오는 중입니다.</p>
                    ) : zonesError ? (
                      <div className="cctv-zone-state is-error">
                        <p>{zonesError}</p>
                        <Button type="button" variant="secondary" onClick={refetchZones}>다시 불러오기</Button>
                      </div>
                    ) : zones.length === 0 ? (
                      <p className="cctv-zone-state">등록된 감지구역이 없습니다.</p>
                    ) : (
                      <ul className="cctv-zone-list">
                        {zones.map((zone) => (
                          <li key={zone.zoneId} className={zone.useYn === "N" ? "is-inactive" : undefined}>
                            <div className="cctv-zone-summary">
                              <strong>{zone.zoneNm || zone.zoneId}</strong>
                              {zone.useYn === "N" && <span className="cctv-zone-status">미사용</span>}
                            </div>
                            <div className="cctv-zone-events" aria-label={`${zone.zoneNm || zone.zoneId} 감지 이벤트 유형`}>
                              <span className="cctv-zone-events-label">감지 이벤트 유형</span>
                              {eventTypesLoading ? (
                                <span className="cctv-zone-event-empty">불러오는 중</span>
                              ) : zone.eventTypeCds.length > 0 ? (
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
                )}
              </section>
            )}
          </form>
          <div className="detail-footer">
            {!editMode ? (
              <Button variant="danger-button" onClick={() => openDeleteConfirm([selectedRow.id])}>
                삭제
              </Button>
            ) : <span />}
            <div>
              <Button
                variant="primary"
                type={editMode ? "submit" : "button"}
                form={editMode ? "cctv-detail-form" : undefined}
                disabled={savePending}
                onClick={editMode ? undefined : startEditing}
              >
                {savePending ? "저장 중..." : editMode ? "저장" : "수정"}
              </Button>
            </div>
          </div>
        </dialog>
      )}

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
        confirmVariant="danger-button"
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
