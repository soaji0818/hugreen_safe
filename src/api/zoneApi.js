import { requestApi } from "./httpClient";

export function fetchZones({ token, cameraId, focusYn, useYn, signal }) {
  return requestApi("/api/web/zones", {
    token,
    query: { cameraId, focusYn, useYn },
    signal,
    networkMessage: "감지구역 서버에 연결할 수 없습니다.",
    errorMessage: "감지구역을 불러오지 못했습니다.",
  });
}
