import { API_BASE_URL, ApiError, requestApi } from "./httpClient";

export function fetchRawEvents({ token, fromDt, toDt, cameraId, eventTypeCd, regType, signal }) {
  return requestApi("/api/web/raw-events", {
    token,
    query: {
      fromDt,
      toDt,
      dateBy: "RECV",
      sourceType: "AI",
      cameraId,
      eventTypeCd,
      regType,
      maxRows: 5000,
    },
    signal,
    networkMessage: "원천 이벤트 서버에 연결할 수 없습니다.",
    errorMessage: "원천 이벤트 목록을 불러오지 못했습니다.",
  });
}

export function fetchRawEventDailyCount({ token, fromDt, toDt, cameraId, signal }) {
  return requestApi("/api/web/raw-events/daily-count", {
    token,
    query: { fromDt, toDt, sourceType: "AI", cameraId },
    signal,
    networkMessage: "일별 수신 건수 서버에 연결할 수 없습니다.",
    errorMessage: "일별 수신 건수를 불러오지 못했습니다.",
  });
}

export function fetchRawEventDetail({ token, rawNo, signal }) {
  return requestApi(`/api/web/raw-events/${encodeURIComponent(rawNo)}`, {
    token,
    signal,
    networkMessage: "원천 이벤트 상세 서버에 연결할 수 없습니다.",
    errorMessage: "원천 이벤트 상세를 불러오지 못했습니다.",
  });
}

export function fetchRawEventSnapshots({ token, rawNo, signal }) {
  return requestApi(`/api/web/raw-events/${encodeURIComponent(rawNo)}/snapshots`, {
    token,
    signal,
    networkMessage: "스냅샷 서버에 연결할 수 없습니다.",
    errorMessage: "스냅샷 목록을 불러오지 못했습니다.",
  });
}

export function patchRawEventCheck({ token, rawNo, data, signal }) {
  return requestApi(`/api/web/raw-events/${encodeURIComponent(rawNo)}/check`, {
    method: "PATCH",
    token,
    body: data,
    signal,
    networkMessage: "확인 정보 저장 서버에 연결할 수 없습니다.",
    errorMessage: "확인 상태와 비고를 저장하지 못했습니다.",
  });
}

export function postRawEvent({ token, data, signal }) {
  return requestApi("/api/web/raw-events", {
    method: "POST",
    token,
    body: data,
    signal,
    networkMessage: "원천 이벤트 등록 서버에 연결할 수 없습니다.",
    errorMessage: "원천 이벤트를 등록하지 못했습니다.",
  });
}

export async function fetchRawEventSnapshotFile({ token, rawNo, snapSeq, signal }) {
  const response = await fetch(
    `${API_BASE_URL}/api/web/raw-events/${encodeURIComponent(rawNo)}/snapshots/${encodeURIComponent(snapSeq)}/file`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal,
    },
  );

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // Binary endpoints can return an empty error body.
    }
    throw new ApiError(payload?.resultMsg || "스냅샷 파일을 열지 못했습니다.", response.status, payload);
  }

  return response.blob();
}
