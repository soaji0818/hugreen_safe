import { requestApi } from "./httpClient";

export function fetchInspectionEvents({ token, fromDt, toDt, factoryCd, cameraId, eventTypeCd, signal }) {
  return requestApi("/api/web/events", {
    token,
    query: { fromDt, toDt, factoryCd, cameraId, eventTypeCd, sourceType: "AI", maxRows: 5000 },
    signal,
    errorMessage: "AI CCTV 이벤트를 불러오지 못했습니다.",
  });
}

export function fetchInspectionCandidates({ token, fromDt, toDt, factoryCd, eventTypeCd, signal }) {
  return requestApi("/api/web/check-links/events", {
    token,
    query: { fromDt, toDt, factoryCd, eventTypeCd, maxRows: 5000 },
    signal,
    errorMessage: "안전점검 연계 상태를 불러오지 못했습니다.",
  });
}

export function fetchInspectionDocuments({ token, equipCd, signal }) {
  return requestApi("/api/web/check-docs", {
    token,
    query: { useYn: "Y", equipCd },
    signal,
    errorMessage: "안전점검 문서를 불러오지 못했습니다.",
  });
}

export function fetchInspectionItems({ token, docCd, signal }) {
  return requestApi(`/api/web/check-docs/${encodeURIComponent(docCd)}/items`, {
    token,
    query: { useYn: "Y" },
    signal,
    errorMessage: "점검 항목을 불러오지 못했습니다.",
  });
}

export function createInspectionCheck({ token, data }) {
  return requestApi("/api/web/checks", {
    method: "POST",
    token,
    body: data,
    errorMessage: "안전점검일지를 등록하지 못했습니다.",
  });
}

export function addInspectionAction({ token, chkNo, data }) {
  return requestApi(`/api/web/checks/${encodeURIComponent(chkNo)}/actions`, {
    method: "PUT",
    token,
    body: data,
    errorMessage: "점검일지의 조치 사항을 저장하지 못했습니다.",
  });
}

export function fetchInspectionCheck({ token, chkNo, signal }) {
  return requestApi(`/api/web/checks/${encodeURIComponent(chkNo)}`, {
    token, signal, errorMessage: "안전점검일지를 불러오지 못했습니다.",
  });
}

export function fetchInspectionResults({ token, chkNo, signal }) {
  return requestApi(`/api/web/checks/${encodeURIComponent(chkNo)}/results`, {
    token, signal, errorMessage: "점검 결과를 불러오지 못했습니다.",
  });
}

export function fetchInspectionActions({ token, chkNo, signal }) {
  return requestApi(`/api/web/checks/${encodeURIComponent(chkNo)}/actions`, {
    token, signal, errorMessage: "조치 사항을 불러오지 못했습니다.",
  });
}

export function updateInspectionCheck({ token, chkNo, data }) {
  return requestApi(`/api/web/checks/${encodeURIComponent(chkNo)}`, {
    method: "PUT", token, body: data, errorMessage: "안전점검일지를 수정하지 못했습니다.",
  });
}

export function updateInspectionResults({ token, chkNo, data }) {
  return requestApi(`/api/web/checks/${encodeURIComponent(chkNo)}/results`, {
    method: "PUT", token, body: data, errorMessage: "점검 결과를 수정하지 못했습니다.",
  });
}

export function updateInspectionAction({ token, chkNo, actSeq, data }) {
  return requestApi(`/api/web/checks/${encodeURIComponent(chkNo)}/actions/${encodeURIComponent(actSeq)}`, {
    method: "PUT", token, body: data, errorMessage: "조치 사항을 수정하지 못했습니다.",
  });
}
