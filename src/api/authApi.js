import { requestApi } from "./httpClient";

export function postLogin(credentials, { signal } = {}) {
  return requestApi("/api/web/auth/login", {
    method: "POST",
    body: credentials,
    signal,
    networkMessage: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.",
    errorMessage: "로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  });
}
