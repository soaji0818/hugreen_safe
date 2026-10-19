import { fetchCommonCodes } from "../api/commonCodeApi";

export async function getCommonCodes(params) {
  const payload = await fetchCommonCodes(params);
  return (payload?.data || []).map((code) => ({
    value: code.comCode,
    label: code.codeNm || code.comCode,
  }));
}
