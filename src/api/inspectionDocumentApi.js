import { requestApi } from "./httpClient";

const documentPath = (docCd) => `/api/web/check-docs/${encodeURIComponent(docCd)}`;
const sectionPath = (docCd, secNo) => `${documentPath(docCd)}/sections/${encodeURIComponent(secNo)}`;
const itemPath = (docCd, secNo, itemNo) => `${documentPath(docCd)}/items/${encodeURIComponent(secNo)}/${encodeURIComponent(itemNo)}`;

export function fetchCheckDocuments({ token, useYn, equipCd, signal }) {
  return requestApi("/api/web/check-docs", {
    token, query: { useYn, equipCd }, signal, errorMessage: "점검 문서 목록을 불러오지 못했습니다.",
  });
}

export function fetchCheckSections({ token, docCd, signal }) {
  return requestApi(`${documentPath(docCd)}/sections`, {
    token, signal, errorMessage: "점검 목차를 불러오지 못했습니다.",
  });
}

export function fetchCheckItems({ token, docCd, secNo, useYn, signal }) {
  return requestApi(`${documentPath(docCd)}/items`, {
    token, query: { secNo, useYn }, signal, errorMessage: "점검 항목을 불러오지 못했습니다.",
  });
}

export function saveCheckDocument({ token, docCd, data }) {
  return requestApi(documentPath(docCd), {
    method: "PUT", token, body: data, errorMessage: "점검 문서를 저장하지 못했습니다.",
  });
}

export function deleteCheckDocument({ token, docCd }) {
  return requestApi(documentPath(docCd), {
    method: "DELETE", token, acceptedResultCodes: [0, 1], errorMessage: "점검 문서를 삭제하지 못했습니다.",
  });
}

export function saveCheckSection({ token, docCd, secNo, data }) {
  return requestApi(sectionPath(docCd, secNo), {
    method: "PUT", token, body: data, errorMessage: "점검 목차를 저장하지 못했습니다.",
  });
}

export function deleteCheckSection({ token, docCd, secNo }) {
  return requestApi(sectionPath(docCd, secNo), {
    method: "DELETE", token, errorMessage: "점검 목차를 삭제하지 못했습니다.",
  });
}

export function saveCheckItem({ token, docCd, secNo, itemNo, data }) {
  return requestApi(itemPath(docCd, secNo, itemNo), {
    method: "PUT", token, body: data, errorMessage: "점검 항목을 저장하지 못했습니다.",
  });
}

export function deleteCheckItem({ token, docCd, secNo, itemNo }) {
  return requestApi(itemPath(docCd, secNo, itemNo), {
    method: "DELETE", token, acceptedResultCodes: [0, 1], errorMessage: "점검 항목을 삭제하지 못했습니다.",
  });
}
