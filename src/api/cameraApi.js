import { requestApi } from "./httpClient";

export function fetchCameras({ token, factoryCd, focusYn, useYn, signal }) {
  return requestApi("/api/web/cameras", {
    token,
    query: { factoryCd, focusYn, useYn },
    signal,
    networkMessage: "카메라 목록 서버에 연결할 수 없습니다.",
    errorMessage: "카메라 목록을 불러오지 못했습니다.",
  });
}

export function deleteCamera({ token, cameraId, signal }) {
  return requestApi(`/api/web/cameras/${encodeURIComponent(cameraId)}`, {
    method: "DELETE",
    token,
    signal,
    acceptedResultCodes: [0, 1],
    networkMessage: "카메라 삭제 서버에 연결할 수 없습니다.",
    errorMessage: "카메라를 삭제하지 못했습니다.",
  });
}

export function saveCamera({ token, cameraId, data, signal }) {
  return requestApi(`/api/web/cameras/${encodeURIComponent(cameraId)}`, {
    method: "PUT",
    token,
    body: data,
    signal,
    networkMessage: "카메라 저장 서버에 연결할 수 없습니다.",
    errorMessage: "카메라 정보를 저장하지 못했습니다.",
  });
}
