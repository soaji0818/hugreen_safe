import { requestApi } from "./httpClient";

export function fetchCommonCodes({ token, codeDiv, signal }) {
  return requestApi("/api/web/codes", {
    token,
    query: { codeDiv },
    signal,
    networkMessage: "공통코드 서버에 연결할 수 없습니다.",
    errorMessage: "공통코드를 불러오지 못했습니다.",
  });
}
