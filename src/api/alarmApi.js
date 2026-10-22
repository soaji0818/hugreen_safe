import { requestApi } from "./httpClient";

export function fetchAlarms({ token, fromDt, toDt, cameraId, equipCd, riskLvCd, releaseYn, signal }) {
  return requestApi("/api/web/alarms", {
    token,
    query: { fromDt, toDt, cameraId, equipCd, riskLvCd, releaseYn, maxRows: 5000 },
    signal,
    networkMessage: "경보 이력 서버에 연결할 수 없습니다.",
    errorMessage: "경보 이력을 불러오지 못했습니다.",
  });
}

export function putAlarmRelease({ token, alarmNo, data, signal }) {
  return requestApi(`/api/web/alarms/${encodeURIComponent(alarmNo)}/release`, {
    method: "PUT",
    token,
    body: data,
    signal,
    networkMessage: "경보 해제 서버에 연결할 수 없습니다.",
    errorMessage: "경보 해제 정보를 저장하지 못했습니다.",
  });
}
