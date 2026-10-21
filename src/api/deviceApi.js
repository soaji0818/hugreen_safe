import { requestApi } from "./httpClient";

export function fetchDevices({ token, signal }) {
  return requestApi("/api/web/devices", {
    token,
    signal,
    networkMessage: "장비 목록 서버에 연결할 수 없습니다.",
    errorMessage: "장비 목록을 불러오지 못했습니다.",
  });
}
