/* oxlint-disable react/only-export-components -- Page metadata and its dedicated component intentionally share this module. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../components/organisms/DataTable/DataTable";
import ContentTable from "../../components/templates/ContentTable/ContentTable";
import SearchConditions from "../../components/organisms/SearchConditions/SearchConditions";
import DropCondition from "../../components/molecules/SearchConditions/DropCondition";
import Badge from "../../components/atoms/Badge/Badge";
import Button from "../../components/atoms/Button/Button";
import CrudModal from "../../components/organisms/CrudModal/CrudModal";
import { ResetIcon } from "../../components/atoms/Icon/Icon";
import useCameraList from "../../hooks/useCameraList";
import useCommonCodes from "../../hooks/useCommonCodes";
import useZoneList from "../../hooks/useZoneList";

const columns = [
  "카메라ID",
  "카메라명",
  "공장",
  "설치 위치",
  "대상 설비",
  "연결상태",
  "수신상태",
  "AI 감지상태",
  "장애상태",
  "최종 수신시각",
];

const detailFields = [
  ["카메라ID", "cameraId"],
  ["카메라명", "cameraNm"],
  ["공장", "factoryCd"],
  ["설치 위치", "installLoc"],
  ["대상 설비", "equipCd"],
  ["모델", "modelNm"],
  ["IP 주소", "ipAddr"],
  ["수신 유예시간(초)", "recvGraceSec"],
  ["사용 여부", "useYn"],
];

function statusLabel(value) {
  if (value === "Y") return "사용";
  if (value === "N") return "미사용";
  return value || "-";
}

function cameraCellValue(row, column) {
  const values = {
    연결상태: row.connStatus,
    수신상태: row.recvStatus,
    "AI 감지상태": row.aiStatus,
    장애상태: row.statusCd,
    "최종 수신시각": row.lastRecvDt,
  };
  return values[column] ?? row[column] ?? "-";
}

function formatDateTime(value) {
  if (!value || value === "-") return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

function deviceStatusTone(value) {
  const normalized = String(value || "").toUpperCase();
  if (["NORMAL", "정상"].includes(normalized)) return "green";
  if (["WARN", "주의"].includes(normalized)) return "amber";
  if (["FAULT", "장애"].includes(normalized)) return "red";
  return "gray";
}

function connectionStatusTone(value) {
  return value === "정상" ? "green" : "gray";
}

function CctvMonitoringPage({ user, onUnauthorized }) {
  const [factoryCd, setFactoryCd] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dialogGeometry, setDialogGeometry] = useState(null);
  const detailDialog = useRef(null);
  const dialogInteraction = useRef(null);

  const {
    data: cameraRows,
    loading: camerasLoading,
    error: camerasError,
    refetch: refetchCameras,
  } = useCameraList({
    enabled: true,
    token: user?.token,
    factoryCd,
    onUnauthorized,
  });
  const {
    data: statusRows,
    loading: statusesLoading,
    error: statusesError,
    refetch: refetchStatuses,
  } = useCameraList({
    enabled: true,
    token: user?.token,
    factoryCd,
    statusOnly: true,
    onUnauthorized,
  });
  const rows = useMemo(() => {
    const statusByCameraId = new Map(
      statusRows.map((row) => [row.cameraId || row.id, row]),
    );
    return cameraRows.map((camera) => {
      const cameraStatus = statusByCameraId.get(camera.cameraId || camera.id);
      return {
        ...camera,
        connStatus: cameraStatus?.connStatus ?? null,
        recvStatus: cameraStatus?.recvStatus ?? null,
        aiStatus: cameraStatus?.aiStatus ?? null,
        statusCd: cameraStatus?.statusCd ?? null,
        lastRecvDt: cameraStatus?.lastRecvDt ?? null,
        openFaultCnt: cameraStatus?.openFaultCnt ?? 0,
      };
    });
  }, [cameraRows, statusRows]);
  const loading = camerasLoading || statusesLoading;
  const error = camerasError || statusesError;
  const refetch = useCallback(() => {
    refetchCameras();
    refetchStatuses();
  }, [refetchCameras, refetchStatuses]);
  const { data: factoryCodes, loading: factoryLoading } = useCommonCodes({
    enabled: true,
    token: user?.token,
    codeDiv: "FACTORY",
    onUnauthorized,
  });
  const { data: deviceStatusCodes } = useCommonCodes({
    enabled: true,
    token: user?.token,
    codeDiv: "DEV_STATUS",
    onUnauthorized,
  });
  const deviceStatusNameByCode = useMemo(
    () => new Map(deviceStatusCodes.map((code) => [code.value, code.label])),
    [deviceStatusCodes],
  );

  const selectedRow = rows.find((row) => row.id === selectedId) || null;
  const selectedCameraId = selectedRow?.cameraId || selectedRow?.id || "";
  const {
    data: zones,
    loading: zonesLoading,
    error: zonesError,
    refetch: refetchZones,
  } = useZoneList({
    enabled: detailOpen && Boolean(selectedCameraId),
    token: user?.token,
    cameraId: selectedCameraId,
    onUnauthorized,
  });
  const {
    data: eventTypeCodes,
    loading: eventTypesLoading,
    error: eventTypesError,
  } = useCommonCodes({
    enabled: detailOpen && Boolean(selectedCameraId),
    token: user?.token,
    codeDiv: "EVT_TYPE",
    onUnauthorized,
  });
  const eventTypeNameByCode = useMemo(
    () => new Map(eventTypeCodes.map((code) => [code.value, code.label])),
    [eventTypeCodes],
  );

  useEffect(() => {
    const intervalId = window.setInterval(refetch, 30000);
    return () => window.clearInterval(intervalId);
  }, [refetch]);

  const resetFilters = () => {
    setFactoryCd("");
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
  const openDetail = (id) => {
    setDialogGeometry(null);
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <section className="work-panel screen-format-list cctv-monitoring-page" aria-label="AI CCTV 상태 모니터링 업무 영역">
      <ContentTable>
      <SearchConditions className="standard-filter-panel" onReset={resetFilters}>
        <SearchConditions.Row columns={1} className="cctv-monitoring-filter-grid">
          <DropCondition
            label="공장"
            value={factoryCd}
            disabled={factoryLoading}
            onChange={setFactoryCd}
            placeholder="전체"
            options={factoryCodes}
          />
        </SearchConditions.Row>
      </SearchConditions>

      <section className="table-panel screen-format-list cctv-monitoring-result-table" aria-label="조회 결과">
        <DataTable
          columns={columns}
          rows={rows}
          totalCount={rows.length}
          toolbarActions={(
            <Button
              type="button"
              variant="text"
              size="small"
              className="cctv-monitoring-refresh"
              icon={ResetIcon}
              iconSize={15}
              disabled={loading}
              onClick={refetch}
            >
              새로고침
            </Button>
          )}
          selectable={false}
          selectedId={selectedId}
          verticalScroll
          loading={loading}
          loadingLabel="카메라 상태 불러오는 중"
          className="cctv-monitoring-table"
          onRowClick={setSelectedId}
          onRowDoubleClick={openDetail}
          onEmptyReset={resetFilters}
          emptyState={loading ? <></> : undefined}
          renderCell={(row, column) => {
            const value = cameraCellValue(row, column);
            if (column === "연결상태") {
              return (
                <Badge size="small" variant="weak" tone={connectionStatusTone(value)}>
                  {value}
                </Badge>
              );
            }
            if (["수신상태", "AI 감지상태", "장애상태"].includes(column)) {
              const label = deviceStatusNameByCode.get(value) || value;
              return (
                <Badge size="small" variant="weak" tone={deviceStatusTone(value)}>
                  {label}
                </Badge>
              );
            }
            if (column === "최종 수신시각") return formatDateTime(value);
            return value;
          }}
          stateRow={error ? (
            <tr className="api-state-row">
              <td colSpan={columns.length}>
                <div className="cctv-empty-state">
                  <h3>화면을 불러오지 못했습니다.</h3>
                  <p>{error}</p>
                  <Button variant="fill" onClick={refetch}>다시 시도하기</Button>
                </div>
              </td>
            </tr>
          ) : undefined}
        />
      </section>
      </ContentTable>

      {selectedRow && (
        <CrudModal
          ref={detailDialog}
          open={detailOpen}
          mode="detail"
          titles={{ detail: "카메라 상세 정보" }}
          formId="monitoring-camera-detail-form"
          className="cctv-detail-dialog"
          geometry={dialogGeometry}
          resizable
          onClose={() => setDetailOpen(false)}
          onInteractionStart={startDialogInteraction}
          onInteractionMove={moveDialogInteraction}
          onInteractionEnd={stopDialogInteraction}
        >
          <dl className="cctv-detail-table">
            {detailFields.map(([label, key]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd className={key === "useYn" ? `status-${selectedRow.useYn === "N" ? "off" : "on"}` : undefined}>
                  {key === "useYn" ? statusLabel(selectedRow[key]) : (selectedRow[key] ?? "-")}
                </dd>
              </div>
            ))}
          </dl>

          <section className="cctv-zone-section" aria-labelledby="monitoring-cctv-zone-title">
            <div className="cctv-zone-heading">
              <h3 id="monitoring-cctv-zone-title">감지구역</h3>
              <span className="cctv-zone-count">
                {!zonesLoading && !zonesError ? zones.length : (selectedRow.zoneCnt ?? 0)}개
              </span>
            </div>
            <div>
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
        </CrudModal>
      )}
    </section>
  );
}

export default {
  id: "MES-TD3-017",
  title: "AI CCTV 상태 모니터링",
  Component: CctvMonitoringPage,
  config: {
    filters: ["공장"],
    cols: columns,
    detail: "camera",
    detailPresentation: "modal",
  },
};
