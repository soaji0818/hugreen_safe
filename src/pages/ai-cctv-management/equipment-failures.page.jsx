/* oxlint-disable react/only-export-components -- Page metadata and its component intentionally share this module. */
import { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../components/organisms/DataTable/DataTable";
import SearchConditions from "../../components/organisms/SearchConditions/SearchConditions";
import DateCondition from "../../components/molecules/SearchConditions/DateCondition";
import RadioCondition from "../../components/molecules/SearchConditions/RadioConditioin";
import DropCondition from "../../components/molecules/SearchConditions/DropCondition";
import Badge from "../../components/atoms/Badge/Badge";
import Button from "../../components/atoms/Button/Button";
import ConfirmDialog from "../../components/molecules/ConfirmDialog/ConfirmDialog";
import CrudModal from "../../components/organisms/CrudModal/CrudModal";
import { PlusIcon, SearchIcon } from "../../components/atoms/Icon/Icon";
import Select from "../../components/atoms/Select/Select";
import Toast from "../../components/molecules/Toast/Toast";
import useCommonCodes from "../../hooks/useCommonCodes";
import useCameraList from "../../hooks/useCameraList";
import useDeviceList from "../../hooks/useDeviceList";
import useFaultList from "../../hooks/useFaultList";
import {
  createFault,
  updateFaultProcess,
} from "../../services/faultService";

const columns = [
  "장애번호",
  "발생일시",
  "장비",
  "위치",
  "장애 유형",
  "처리 상태",
  "담당자",
  "복구일시",
];

const datePresets = [
  ["당일", 0],
  ["일주일", 6],
  ["1개월", 29],
  ["3개월", 89],
  ["6개월", 179],
];
const fallbackStatuses = [
  { value: "NEW", label: "미확인" },
  { value: "CHECKED", label: "확인" },
  { value: "ACTING", label: "조치중" },
  { value: "DONE", label: "조치완료" },
  { value: "FALSE_POS", label: "오탐 종결" },
];

function formatDateTime(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

function toDateTimeInput(value) {
  if (!value) return "";
  return String(value).slice(0, 16);
}

function nowForInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

function defaultPeriod(days = 29) {
  const toDt = nowForInput().slice(0, 10);
  const fromDate = new Date(`${toDt}T00:00:00`);
  fromDate.setDate(fromDate.getDate() - days);
  const offset = fromDate.getTimezoneOffset() * 60_000;
  const fromDt = new Date(fromDate.getTime() - offset).toISOString().slice(0, 10);
  return { fromDt, toDt };
}

function toApiDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function codeMap(codes, fallback) {
  const source = codes.length ? codes : fallback;
  return new Map(source.map((code) => [code.value, code.label]));
}

function statusTone(statusCd) {
  if (["DONE", "FALSE_POS"].includes(statusCd)) return "gray";
  if (statusCd === "ACTING") return "amber";
  return "red";
}

function createFormValues() {
  return {
    occurDt: "",
    deviceKind: "AI CCTV",
    deviceId: "",
    locDesc: "",
    faultTypeCd: "",
    faultDesc: "",
  };
}

function updateFormValues(row) {
  return {
    statusCd: row.statusCd || "NEW",
    checkMemberId: row.checkMemberId || "",
    faultDesc: row.faultDesc || "",
    cause: row.cause || "",
    causeTypeCd: row.causeTypeCd || "",
    chargeMemberId: row.chargeMemberId || "",
    recoverAction: row.recoverAction || "",
    recoverDt: toDateTimeInput(row.recoverDt),
  };
}

function CameraIdSearch({ cameras, error, value, factoryCd, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = cameras.find((camera) => camera.cameraId === value);
  const options = cameras.filter((camera) => {
    if (factoryCd && camera.factoryCd !== factoryCd) return false;
    const searchText = `${camera.cameraId || ""} ${camera.cameraNm || ""} ${camera.equipCd || ""}`;
    return searchText.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <div
      className="event-camera-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <input
        required
        role="combobox"
        aria-label="카메라 ID 검색"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="event-camera-options"
        autoComplete="off"
        placeholder="카메라 ID 또는 이름 검색"
        value={open ? query : selected ? `${selected.cameraId} · ${selected.cameraNm || "카메라"}` : ""}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") setOpen(true);
        }}
      />
      {open && (
        <div id="event-camera-options" className="event-camera-options" role="listbox">
          {error ? (
            <p className="has-error">카메라 목록을 불러오지 못했습니다.</p>
          ) : options.length ? options.map((camera) => (
            <button
              key={camera.cameraId}
              type="button"
              role="option"
              aria-selected={value === camera.cameraId}
              onClick={() => {
                onChange(camera.cameraId);
                setQuery("");
                setOpen(false);
              }}
            >
              <strong>{camera.cameraId}</strong>
              <span>{camera.cameraNm || camera.equipCd || "카메라"}</span>
            </button>
          )) : (
            <p>{query ? "검색 결과가 없습니다." : "등록된 카메라가 없습니다."}</p>
          )}
        </div>
      )}
    </div>
  );
}

function EquipmentFailuresPage({ user, onUnauthorized, onUnsavedChange }) {
  const [filters, setFilters] = useState({
    ...defaultPeriod(),
    deviceType: "",
    deviceId: "",
    faultTypeCd: "",
    statusCd: "",
  });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [mode, setMode] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [formBaseline, setFormBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [dialogGeometry, setDialogGeometry] = useState(null);
  const detailDialog = useRef(null);
  const dialogInteraction = useRef(null);
  const saveController = useRef(null);

  const { data: faultTypes } = useCommonCodes({
    enabled: true,
    token: user?.token,
    codeDiv: "FAULT_TYPE",
    onUnauthorized,
  });
  const { data: cameras, error: cameraError } = useCameraList({
    enabled: Boolean(user?.token),
    token: user?.token,
    onUnauthorized,
  });
  const { data: statuses } = useCommonCodes({
    enabled: true,
    token: user?.token,
    codeDiv: "EVT_STATUS",
    onUnauthorized,
  });
  const { data: causeTypes } = useCommonCodes({
    enabled: true,
    token: user?.token,
    codeDiv: "CAUSE_TYPE",
    onUnauthorized,
  });
  const {
    data: rows,
    loading,
    error,
    refetch,
  } = useFaultList({
    token: user?.token,
    fromDt: filters.fromDt,
    toDt: filters.toDt,
    deviceId: filters.deviceId,
    deviceKind: filters.deviceType,
    faultTypeCd: filters.faultTypeCd,
    statusCd: filters.statusCd,
    onUnauthorized,
  });
  const { data: devices, error: deviceError } = useDeviceList({
    enabled: Boolean(user?.token),
    token: user?.token,
    onUnauthorized,
  });

  useEffect(() => () => saveController.current?.abort(), []);

  const faultTypeName = useMemo(
    () => codeMap(faultTypes, []),
    [faultTypes],
  );
  const statusName = useMemo(
    () => codeMap(statuses, fallbackStatuses),
    [statuses],
  );
  const faultTypeOptions = faultTypes;
  const statusOptions = statuses.length ? statuses : fallbackStatuses;
  const selectedRow = selectedDetail
    || rows.find((row) => row.id === selectedId)
    || null;
  const sensorOptions = useMemo(
    () => devices
      .filter((device) => device.useYn !== "N" && device.deviceId)
      .map((device) => ({
        value: device.deviceId,
        label: device.deviceNm ? `${device.deviceId} · ${device.deviceNm}` : device.deviceId,
      })),
    [devices],
  );
  const registrationDeviceOptions = useMemo(() => {
    if (formValues?.deviceKind === "AI CCTV") {
      return cameras.map((camera) => ({
        value: camera.cameraId,
        label: camera.cameraNm ? `${camera.cameraId} · ${camera.cameraNm}` : camera.cameraId,
      }));
    }
    if (formValues?.deviceKind === "PLC") {
      return [...new Set(devices.map((device) => device.plcId).filter(Boolean))]
        .map((plcId) => ({ value: plcId, label: plcId }));
    }
    return sensorOptions;
  }, [cameras, devices, formValues?.deviceKind, sensorOptions]);
  const deviceOptions = filters.deviceType === "AI CCTV"
    ? cameras.map((camera) => ({
      value: camera.cameraId,
      label: camera.cameraNm ? `${camera.cameraId} · ${camera.cameraNm}` : camera.cameraId,
    }))
    : filters.deviceType === "PLC"
      ? [...new Set(devices.map((device) => device.plcId).filter(Boolean))].map((plcId) => ({ value: plcId, label: plcId }))
      : filters.deviceType === "센서" ? sensorOptions : [];
  const visibleRows = rows;
  const editable = mode === "create" || mode === "edit";
  const dirty = editable
    && JSON.stringify(formValues) !== JSON.stringify(formBaseline);

  useEffect(() => {
    onUnsavedChange?.(dirty || saving);
    return () => onUnsavedChange?.(false);
  }, [dirty, saving, onUnsavedChange]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const resetFilters = () => {
    setFilters({
      ...defaultPeriod(),
      deviceType: "",
      deviceId: "",
      faultTypeCd: "",
      statusCd: "",
    });
  };
  const selectPeriod = (days) => {
    const toDt = filters.toDt || nowForInput().slice(0, 10);
    const fromDate = new Date(`${toDt}T00:00:00`);
    fromDate.setDate(fromDate.getDate() - days);
    const offset = fromDate.getTimezoneOffset() * 60_000;
    const fromDt = new Date(fromDate.getTime() - offset).toISOString().slice(0, 10);
    setFilters((current) => ({ ...current, fromDt, toDt }));
  };
  const isSelectedPeriod = (days) => {
    if (!filters.fromDt || !filters.toDt) return false;
    const fromDate = new Date(`${filters.fromDt}T00:00:00`);
    const toDate = new Date(`${filters.toDt}T00:00:00`);
    return Math.round((toDate - fromDate) / 86_400_000) === days;
  };
  const updateForm = (key, value) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };
  const startDialogInteraction = (event, interactionMode) => {
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
  const openCreate = () => {
    setDialogGeometry(null);
    const values = createFormValues();
    setFormValues(values);
    setFormBaseline(values);
    setMode("create");
  };
  const openDetail = (rowId) => {
    const row = rows.find((item) => item.id === rowId);
    if (!row) return;
    setDialogGeometry(null);
    setSelectedId(rowId);
    setSelectedDetail(row);
    setFormValues(null);
    setFormBaseline(null);
    setMode("detail");
  };
  const openEdit = () => {
    if (!selectedRow) return;
    setNotice("");
    const values = updateFormValues(selectedRow);
    setFormValues(values);
    setFormBaseline(values);
    setMode("edit");
  };
  const finishClose = () => {
    setMode(null);
    setDialogGeometry(null);
    setSelectedDetail(null);
    setFormValues(null);
    setFormBaseline(null);
    setCloseConfirmOpen(false);
  };
  const requestClose = () => {
    if (dirty) setCloseConfirmOpen(true);
    else finishClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || !formValues || !["create", "edit"].includes(mode)) return;
    if (mode === "create" && (!formValues.deviceId || !formValues.faultTypeCd)) {
      setNotice("장비 ID와 장애 유형을 입력해 주세요.");
      return;
    }
    if (mode === "edit" && !formValues.statusCd) {
      setNotice("처리 상태를 선택해 주세요.");
      return;
    }

    saveController.current?.abort();
    const controller = new AbortController();
    saveController.current = controller;
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await createFault({
          token: user.token,
          signal: controller.signal,
          data: {
            occurDt: toApiDateTime(formValues.occurDt),
            deviceId: formValues.deviceId,
            deviceKind: formValues.deviceKind || null,
            locDesc: formValues.locDesc || null,
            faultTypeCd: formValues.faultTypeCd,
            faultDesc: formValues.faultDesc || null,
          },
        });
        if (created?.faultNo) setSelectedId(created.faultNo);
        setNotice("장애를 등록했습니다.");
      } else if (mode === "edit" && selectedRow) {
        await updateFaultProcess({
          token: user.token,
          faultNo: selectedRow.faultNo || selectedRow.eventNo,
          signal: controller.signal,
          data: {
            statusCd: formValues.statusCd,
            faultDesc: formValues.faultDesc || null,
            checkMemberId: formValues.checkMemberId || null,
            cause: formValues.cause || null,
            causeTypeCd: formValues.causeTypeCd || null,
            chargeMemberId: formValues.chargeMemberId || null,
            recoverAction: formValues.recoverAction || null,
            recoverDt: toApiDateTime(formValues.recoverDt),
          },
        });
        setNotice("장애 처리 내용을 저장했습니다.");
      }
      finishClose();
      refetch();
    } catch (requestError) {
      if (requestError.name === "AbortError") return;
      if (requestError.status === 401) onUnauthorized?.();
      else setNotice(requestError.message);
    } finally {
      if (!controller.signal.aborted) setSaving(false);
    }
  };

  const renderCell = (row, column) => {
    const values = {
      장애번호: row.faultNo,
      발생일시: formatDateTime(row.occurDt),
      장비: row.deviceNm || row.deviceId,
      위치: row.locDesc || "-",
      담당자: row.chargeMemberId || "-",
      복구일시: formatDateTime(row.recoverDt),
    };
    if (column === "장애 유형") {
      return <Badge tone="red">{faultTypeName.get(row.faultTypeCd) || row.faultTypeCd || "-"}</Badge>;
    }
    if (column === "처리 상태") {
      return (
        <Badge tone={statusTone(row.statusCd)}>
          {statusName.get(row.statusCd) || row.statusCd || "-"}
        </Badge>
      );
    }
    return values[column] ?? "-";
  };

  const currentRow = selectedRow;

  return (
    <section className="work-panel failure-management-page">
      <SearchConditions className="standard-filter-panel failure-filter-panel" onReset={resetFilters}>
        <SearchConditions.Row columns={1} className="failure-filter-grid">
          <DateCondition
            label="기간"
            startDate={filters.fromDt}
            endDate={filters.toDt}
            period={datePresets.find(([, days]) => isSelectedPeriod(days))?.[1]?.toString() || ""}
            periods={datePresets.map(([label, days]) => ({ label, value: String(days) }))}
            onStartDateChange={(fromDt) => updateFilter("fromDt", fromDt)}
            onEndDateChange={(toDt) => updateFilter("toDt", toDt)}
            onPeriodChange={(days) => selectPeriod(Number(days))}
            className="access-date-field"
          />
        </SearchConditions.Row>
        <SearchConditions.Row columns={1} className="failure-filter-grid">
          <RadioCondition
            label="장애유형"
            name="failure-fault-type"
            value={filters.faultTypeCd}
            onChange={(faultTypeCd) => updateFilter("faultTypeCd", faultTypeCd)}
            options={[{ value: "", label: "전체" }, ...faultTypeOptions]}
            className="failure-event-type-field"
          />
        </SearchConditions.Row>
        <SearchConditions.Row columns={3} className="failure-filter-grid">
          <RadioCondition
            label="장비구분"
            name="failure-device-type"
            value={filters.deviceType}
            onChange={(deviceType) => setFilters((current) => ({ ...current, deviceType, deviceId: "" }))}
            options={[{ value: "", label: "전체" }, { value: "AI CCTV", label: "AI CCTV" }, { value: "센서", label: "센서" }, { value: "PLC", label: "PLC" }]}
            className="failure-device-type-field"
          />
          <DropCondition
            label="장비 ID"
            value={filters.deviceId}
            onChange={(deviceId) => updateFilter("deviceId", deviceId)}
            placeholder={filters.deviceType && filters.deviceType !== "AI CCTV" && deviceError ? "장비 목록 조회 실패" : "전체"}
            options={deviceOptions}
          />
          <DropCondition
            label="처리상태"
            value={filters.statusCd}
            onChange={(statusCd) => updateFilter("statusCd", statusCd)}
            placeholder="전체"
            options={statusOptions}
          />
        </SearchConditions.Row>
      </SearchConditions>

      <div className="list-actions" aria-label="장애 목록 작업">
        <span className="table-result-count" role="status">총 {visibleRows.length}건</span>
        <Button variant="fill" icon={PlusIcon} onClick={openCreate}>추가</Button>
      </div>

      <div className="table-panel screen-format-list-detail failure-table-panel">
        <DataTable
          columns={columns}
          rows={visibleRows}
          selectable={false}
          selectedId={selectedId}
          onRowClick={openDetail}
          renderCell={renderCell}
          resizableColumns
          stateRow={error ? (
            <tr className="api-state-row">
              <td colSpan={columns.length}>
                <div className="failure-error-state">
                  <span>{error}</span>
                  <Button size="small" variant="weak" onClick={refetch}>다시 시도</Button>
                </div>
              </td>
            </tr>
          ) : undefined}
          emptyState={loading ? <></> : (
            <div className="empty failure-empty-state">
              <SearchIcon size={48} aria-hidden="true" />
              <h3>검색 결과가 없습니다</h3>
              <p>검색 조건을 변경하거나 초기화해 주세요.</p>
              <Button variant="weak" onClick={resetFilters}>조건 초기화</Button>
            </div>
          )}
        />
      </div>

      <CrudModal
        ref={detailDialog}
        open={Boolean(mode)}
        mode={mode || "detail"}
        titles={{ create: "장애 수동 등록", edit: "장애 처리", detail: "장애 상세" }}
        formId="equipment-failure-form"
        className={`failure-detail-dialog cctv-detail-dialog screen-format-list-detail${mode === "create" ? "" : " is-record-view"}`}
        geometry={dialogGeometry}
        resizable
        saving={saving}
        saveLabel={mode === "create" ? "등록" : "저장"}
        savingLabel="저장 중..."
        onClose={requestClose}
        onSubmit={handleSubmit}
        onEdit={mode === "detail" ? openEdit : undefined}
        onCancelEdit={mode === "edit" ? () => setMode("detail") : requestClose}
        onInteractionStart={startDialogInteraction}
        onInteractionMove={moveDialogInteraction}
        onInteractionEnd={stopDialogInteraction}
      >
        {mode === "create" && formValues ? (
          <section className="field-section failure-detail-section">
            <dl className="cctv-detail-table failure-detail-table">
              <div>
                <dt>발생일시</dt>
                <dd className="is-editing">
                  <input type="datetime-local" value={formValues.occurDt} onChange={(event) => updateForm("occurDt", event.target.value)} />
                </dd>
              </div>
              <div>
                <dt>장비구분</dt>
                <dd className="is-editing">
                  <Select value={formValues.deviceKind} onChange={(event) => setFormValues((current) => ({ ...current, deviceKind: event.target.value, deviceId: "" }))}>
                    <option value="AI CCTV">AI CCTV</option>
                    <option value="센서">센서</option>
                    <option value="PLC">PLC</option>
                  </Select>
                </dd>
              </div>
              <div>
                <dt>장비 ID</dt>
                <dd className="is-editing">
                  {formValues.deviceKind === "AI CCTV" ? (
                    <CameraIdSearch
                      cameras={cameras}
                      error={cameraError}
                      value={formValues.deviceId}
                      onChange={(deviceId) => updateForm("deviceId", deviceId)}
                    />
                  ) : (
                    <Select required value={formValues.deviceId} onChange={(event) => updateForm("deviceId", event.target.value)}>
                      <option value="">장비를 선택하세요</option>
                      {registrationDeviceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Select>
                  )}
                  {formValues.deviceKind === "AI CCTV" && cameraError ? <small className="has-error">카메라 목록을 불러오지 못했습니다.</small> : null}
                  {formValues.deviceKind !== "AI CCTV" && deviceError ? <small className="has-error">장비 목록을 불러오지 못했습니다.</small> : null}
                </dd>
              </div>
              <div>
                <dt>장애 유형</dt>
                <dd className="is-editing">
                  <Select required value={formValues.faultTypeCd} onChange={(event) => updateForm("faultTypeCd", event.target.value)}>
                    <option value="">선택</option>
                    {faultTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </dd>
              </div>
              <div>
                <dt>위치</dt>
                <dd className="is-editing">
                  <input maxLength={100} value={formValues.locDesc} onChange={(event) => updateForm("locDesc", event.target.value)} />
                </dd>
              </div>
              <div>
                <dt>장애 내용</dt>
                <dd className="is-editing">
                  <textarea rows={3} maxLength={500} value={formValues.faultDesc} onChange={(event) => updateForm("faultDesc", event.target.value)} />
                </dd>
              </div>
            </dl>
          </section>
        ) : currentRow ? (
          <div className="failure-record-grid">
            <section className="field-section failure-detail-section">
              <h3>발생 정보</h3>
              <dl className="cctv-detail-table failure-detail-table">
                <div><dt>장애번호</dt><dd>{currentRow.faultNo || "-"}</dd></div>
                <div><dt>발생일시</dt><dd>{formatDateTime(currentRow.occurDt)}</dd></div>
                <div><dt>등록 구분</dt><dd>{currentRow.regType === "MANUAL" ? "수동" : "자동"}</dd></div>
                <div><dt>장비구분</dt><dd>{currentRow.deviceKind || "-"}</dd></div>
                <div><dt>장비 ID</dt><dd>{currentRow.deviceId || "-"}</dd></div>
                <div><dt>위치</dt><dd>{currentRow.locDesc || "-"}</dd></div>
                <div><dt>장애 유형</dt><dd>{faultTypeName.get(currentRow.faultTypeCd) || currentRow.faultTypeCd || "-"}</dd></div>
                <div><dt>장애 내용</dt><dd className="is-multiline">{currentRow.faultDesc || "-"}</dd></div>
              </dl>
            </section>
            <section className="field-section failure-detail-section">
              <h3>처리 정보</h3>
              <dl className="cctv-detail-table failure-detail-table">
                <div>
                  <dt>처리 상태</dt>
                  {mode === "edit" ? (
                    <dd className="is-editing">
                      <Select value={formValues.statusCd} onChange={(event) => updateForm("statusCd", event.target.value)}>
                        {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </Select>
                    </dd>
                  ) : <dd>{statusName.get(currentRow.statusCd) || currentRow.statusCd || "-"}</dd>}
                </div>
                <div>
                  <dt>확인자</dt>
                  {mode === "edit" ? (
                    <dd className="is-editing"><input maxLength={7} value={formValues.checkMemberId} placeholder="사번" onChange={(event) => updateForm("checkMemberId", event.target.value)} /></dd>
                  ) : <dd>{currentRow.checkMemberId || "-"}</dd>}
                </div>
                <div>
                  <dt>원인 구분</dt>
                  {mode === "edit" ? (
                    <dd className="is-editing"><Select value={formValues.causeTypeCd} onChange={(event) => updateForm("causeTypeCd", event.target.value)}><option value="">선택</option>{causeTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></dd>
                  ) : <dd>{causeTypes.find((option) => option.value === currentRow.causeTypeCd)?.label || currentRow.causeTypeCd || "-"}</dd>}
                </div>
                <div>
                  <dt>원인</dt>
                  {mode === "edit" ? (
                    <dd className="is-editing"><textarea maxLength={500} value={formValues.cause} onChange={(event) => updateForm("cause", event.target.value)} /></dd>
                  ) : <dd className="is-multiline">{currentRow.cause || "-"}</dd>}
                </div>
                <div>
                  <dt>담당자</dt>
                  {mode === "edit" ? (
                    <dd className="is-editing">
                      <input maxLength={7} value={formValues.chargeMemberId} placeholder="사번" onChange={(event) => updateForm("chargeMemberId", event.target.value)} />
                    </dd>
                  ) : <dd>{currentRow.chargeMemberId || "-"}</dd>}
                </div>
                <div>
                  <dt>복구일시</dt>
                  {mode === "edit" ? (
                    <dd className="is-editing">
                      <input type="datetime-local" value={formValues.recoverDt} onChange={(event) => updateForm("recoverDt", event.target.value)} />
                    </dd>
                  ) : <dd>{formatDateTime(currentRow.recoverDt)}</dd>}
                </div>
                <div>
                  <dt>복구 조치 내용</dt>
                  {mode === "edit" ? (
                    <dd className="is-editing"><textarea maxLength={1000} value={formValues.recoverAction} onChange={(event) => updateForm("recoverAction", event.target.value)} /></dd>
                  ) : <dd className="is-multiline">{currentRow.recoverAction || "-"}</dd>}
                </div>
              </dl>
            </section>
          </div>
        ) : null}
      </CrudModal>

      <ConfirmDialog
        open={closeConfirmOpen}
        title="작성 중인 내용이 있습니다."
        description="저장하지 않고 닫으시겠습니까?"
        cancelLabel="계속 작성"
        confirmLabel="닫기"
        onCancel={() => setCloseConfirmOpen(false)}
        onConfirm={finishClose}
      />
      <Toast open={Boolean(notice)} message={notice} onClose={() => setNotice("")} />
    </section>
  );
}

export default {
  id: "MES-TD3-022",
  title: "장비 이벤트 장애관리",
  Component: EquipmentFailuresPage,
  config: {},
};
