import {
  fetchRawEventDailyCount,
  fetchRawEventDetail,
  fetchRawEventSnapshotFile,
  fetchRawEventSnapshots,
  fetchRawEvents,
  patchRawEventCheck,
  postRawEvent,
} from "../api/rawEventApi";

export async function getRawEvents(params) {
  const payload = await fetchRawEvents(params);
  return (payload?.data || []).map((event) => ({
    ...event,
    id: event.rawNo,
  }));
}

export async function getRawEventDailyCount(params) {
  const payload = await fetchRawEventDailyCount(params);
  return payload?.data || [];
}

export async function getRawEventDetail(params) {
  const payload = await fetchRawEventDetail(params);
  return payload?.data || null;
}

export async function getRawEventSnapshots(params) {
  const payload = await fetchRawEventSnapshots(params);
  return payload?.data || [];
}

export async function saveRawEventCheck(params) {
  await patchRawEventCheck(params);
}

export async function createRawEvent(params) {
  const payload = await postRawEvent(params);
  return payload?.data || null;
}

export async function getRawEventSnapshotFile(params) {
  return fetchRawEventSnapshotFile(params);
}
