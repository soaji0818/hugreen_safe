import { useMemo } from "react";
import Badge from "../components/atoms/Badge/Badge";
import Button from "../components/atoms/Button/Button";
import { ResetIcon } from "../components/atoms/Icon/Icon";
import useCameraList from "../hooks/useCameraList";
import "./home-dashboard.css";

const statusMeta = {
  fault: { label: "장애", tone: "red", order: 0 },
  warning: { label: "주의", tone: "amber", order: 1 },
  unknown: { label: "미확인", tone: "gray", order: 2 },
  normal: { label: "정상", tone: "green", order: 3 },
};

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

function isFault(value) {
  return ["FAULT", "ERROR", "DOWN", "DISCONNECTED", "장애", "오류", "끊김", "비정상"].includes(normalize(value));
}

function isWarning(value) {
  return ["WARN", "WARNING", "CAUTION", "주의", "경고"].includes(normalize(value));
}

function isNormal(value) {
  return ["NORMAL", "OK", "CONNECTED", "정상"].includes(normalize(value));
}

function cameraHealth(status) {
  if (!status) return "unknown";
  if (Number(status.openFaultCnt) > 0 || [status.connStatus, status.recvStatus, status.aiStatus, status.statusCd].some(isFault)) return "fault";
  if ([status.connStatus, status.recvStatus, status.aiStatus, status.statusCd].some(isWarning)) return "warning";
  if ([status.connStatus, status.recvStatus, status.aiStatus, status.statusCd].some(isNormal)) return "normal";
  return "unknown";
}

function formatDateTime(value) {
  return value ? String(value).replace("T", " ").slice(0, 19) : "-";
}

function statusText(value) {
  const text = normalize(value);
  if (!text) return "-";
  if (isFault(text)) return "장애";
  if (isWarning(text)) return "주의";
  if (isNormal(text)) return "정상";
  return value;
}

export default function HomeDashboard({ user, onUnauthorized, onNavigate }) {
  const {
    data: cameras,
    loading: camerasLoading,
    loaded: camerasLoaded,
    error: camerasError,
    refetch: refetchCameras,
  } = useCameraList({ enabled: true, token: user?.token, onUnauthorized });
  const {
    data: statuses,
    loading: statusesLoading,
    loaded: statusesLoaded,
    error: statusesError,
    refetch: refetchStatuses,
  } = useCameraList({ enabled: true, token: user?.token, statusOnly: true, onUnauthorized });

  const loading = camerasLoading || statusesLoading;
  const error = camerasError || statusesError;
  const cameraRows = useMemo(() => {
    const byId = new Map(statuses.map((status) => [status.cameraId || status.id, status]));
    return cameras
      .filter((camera) => camera.useYn !== "N")
      .map((camera) => {
        const status = byId.get(camera.cameraId || camera.id);
        return { ...camera, currentStatus: status, health: cameraHealth(status) };
      })
      .sort((left, right) => statusMeta[left.health].order - statusMeta[right.health].order
        || String(left.cameraNm || left.cameraId).localeCompare(String(right.cameraNm || right.cameraId), "ko"));
  }, [cameras, statuses]);
  const counts = cameraRows.reduce((result, camera) => {
    result[camera.health] += 1;
    return result;
  }, { normal: 0, warning: 0, fault: 0, unknown: 0 });
  const attentionCount = counts.fault + counts.warning;
  const hasData = camerasLoaded && statusesLoaded && !loading && !error;
  const refresh = () => {
    refetchCameras();
    refetchStatuses();
  };

  return (
    <section className="home-dashboard" aria-label="AI CCTV 장비 운영 현황">
      <div className="home-dashboard__heading">
        <div>
          <h2>AI CCTV 장비 현황</h2>
          <p>연결과 수신 상태를 확인하고, 조치가 필요한 장비를 먼저 살펴보세요.</p>
        </div>
        <Button type="button" variant="weak" size="small" icon={ResetIcon} disabled={loading} onClick={refresh}>새로고침</Button>
      </div>

      {error && (
        <div className="home-dashboard__error" role="alert">
          <span>{error} 장비 상태를 확인하려면 다시 불러오세요.</span>
          <Button type="button" variant="weak" size="small" onClick={refresh}>다시 불러오기</Button>
        </div>
      )}

      <div className="home-dashboard__summary" aria-label="운영 장비 상태 요약">
        <div className="home-dashboard__summary-main">
          <span>운영 카메라</span>
          <strong>{hasData ? cameraRows.length : "-"}</strong>
          <small>등록 {hasData ? cameras.length : "-"}대 중 사용 중</small>
        </div>
        <div className="home-dashboard__summary-statuses">
          {["normal", "warning", "fault", "unknown"].map((key) => (
            <div key={key} className={`home-dashboard__summary-item is-${key}`}>
              <span className="home-dashboard__status-dot" aria-hidden="true" />
              <span>{statusMeta[key].label}</span>
              <strong>{hasData ? counts[key] : "-"}</strong>
            </div>
          ))}
          <div className="home-dashboard__status-bar" aria-hidden="true">
            {hasData && cameraRows.length > 0 && ["normal", "warning", "fault", "unknown"].map((key) => (
              <span key={key} className={`is-${key}`} style={{ width: `${counts[key] / cameraRows.length * 100}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="home-dashboard__section-heading">
        <div>
          <h3>장비별 상태</h3>
          <p>{hasData ? attentionCount > 0 ? `확인이 필요한 장비 ${attentionCount}대가 먼저 표시됩니다.` : "현재 확인이 필요한 장비가 없습니다." : "장비 상태를 불러오는 중입니다."}</p>
        </div>
        <button type="button" className="home-dashboard__link" onClick={() => onNavigate("MES-TD3-017")}>상태 모니터링 보기 <span aria-hidden="true">›</span></button>
      </div>

      <div className="home-dashboard__table-wrap">
        <table className="home-dashboard__table">
          <thead>
            <tr><th>카메라</th><th>설치 위치</th><th>전체 상태</th><th>연결</th><th>수신</th><th>AI 감지</th><th>장애 상태</th><th>최종 수신</th></tr>
          </thead>
          <tbody>
            {hasData && cameraRows.slice(0, 8).map((camera) => (
              <tr key={camera.cameraId || camera.id} className={`is-${camera.health}`}>
                <td><strong>{camera.cameraNm || camera.cameraId}</strong><small>{camera.cameraId}</small></td>
                <td>{[camera.factoryCd, camera.installLoc].filter(Boolean).join(" · ") || "-"}</td>
                <td><Badge tone={statusMeta[camera.health].tone}>{statusMeta[camera.health].label}</Badge></td>
                <td>{statusText(camera.currentStatus?.connStatus)}</td>
                <td>{statusText(camera.currentStatus?.recvStatus)}</td>
                <td>{statusText(camera.currentStatus?.aiStatus)}</td>
                <td>{statusText(camera.currentStatus?.statusCd)}</td>
                <td>{formatDateTime(camera.currentStatus?.lastRecvDt)}</td>
              </tr>
            ))}
            {hasData && cameraRows.length === 0 && <tr><td colSpan={8} className="home-dashboard__empty">운영 중인 카메라가 없습니다.</td></tr>}
            {!hasData && <tr><td colSpan={8} className="home-dashboard__empty">{error ? "상태를 불러오지 못했습니다." : "장비 상태를 불러오는 중입니다."}</td></tr>}
          </tbody>
        </table>
      </div>
      {hasData && cameraRows.length > 8 && <p className="home-dashboard__more">전체 {cameraRows.length}대 중 8대 표시 · 나머지는 상태 모니터링에서 확인할 수 있습니다.</p>}
    </section>
  );
}
