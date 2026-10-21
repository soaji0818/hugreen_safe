import { requestApi } from "./httpClient";

export function fetchFaults({
  token,
  fromDt,
  toDt,
  deviceId,
  deviceKind,
  faultTypeCd,
  statusCd,
  openYn,
  regType,
  focusYn,
  chargeMemberId,
  signal,
}) {
  return requestApi("/api/web/faults", {
    token,
    query: {
      fromDt,
      toDt,
      deviceId,
      deviceKind,
      faultTypeCd,
      statusCd,
      openYn,
      regType,
      focusYn,
      chargeMemberId,
      maxRows: 5000,
    },
    signal,
    networkMessage: "장애 목록 서버에 연결할 수 없습니다.",
    errorMessage: "장애 목록을 불러오지 못했습니다.",
  });
}

export function postFault({ token, data, signal }) {
  return requestApi("/api/web/faults", {
    method: "POST",
    token,
    body: data,
    signal,
    acceptedResultCodes: [0],
    networkMessage: "장애 등록 서버에 연결할 수 없습니다.",
    errorMessage: "장애를 등록하지 못했습니다.",
  });
}

export function putFaultProcess({ token, faultNo, data, signal }) {
  return requestApi(`/api/web/faults/${encodeURIComponent(faultNo)}`, {
    method: "PUT",
    token,
    body: data,
    signal,
    networkMessage: "장애 처리 서버에 연결할 수 없습니다.",
    errorMessage: "장애 처리 내용을 저장하지 못했습니다.",
  });
}
