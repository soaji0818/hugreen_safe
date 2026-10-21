import {
  fetchFaults,
  postFault,
  putFaultProcess,
} from "../api/faultApi";

export async function getFaults(params) {
  const payload = await fetchFaults(params);
  return (payload?.data || []).map((fault) => {
    const faultNo = fault.faultNo ?? fault.eventNo;
    return { ...fault, faultNo, eventNo: faultNo, id: faultNo };
  });
}

export async function createFault(params) {
  const payload = await postFault(params);
  if (!payload?.data) return null;
  const faultNo = payload.data.faultNo ?? payload.data.eventNo;
  return { ...payload.data, faultNo, eventNo: faultNo, id: faultNo };
}

export async function updateFaultProcess(params) {
  const payload = await putFaultProcess(params);
  return payload?.data || null;
}
