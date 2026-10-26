import { requestApi } from "./httpClient";

export function fetchAiEvents({ token, fromDt, toDt, factoryCd, cameraId, eventTypeCd, statusCd, signal }) {
  return requestApi("/api/web/events", {
    token,
    query: { fromDt, toDt, factoryCd, cameraId, eventTypeCd, statusCd, sourceType: "AI", maxRows: 5000 },
    signal,
    networkMessage: "AI CCTV 이벤트 서버에 연결할 수 없습니다.",
    errorMessage: "AI CCTV 이벤트를 불러오지 못했습니다.",
  });
}

export function fetchAiEventDetail({ token, eventNo, signal }) {
  return requestApi(`/api/web/events/${encodeURIComponent(eventNo)}`, {
    token,
    signal,
    networkMessage: "AI CCTV 이벤트 상세 서버에 연결할 수 없습니다.",
    errorMessage: "AI CCTV 이벤트 상세를 불러오지 못했습니다.",
  });
}

