import { fetchAlarms, putAlarmRelease } from "../api/alarmApi";

export async function getAlarmHistory(params) {
  const payload = await fetchAlarms(params);
  return (payload?.data || []).map((alarm) => ({ ...alarm, id: alarm.alarmNo }));
}

export async function saveAlarmRelease(params) {
  await putAlarmRelease(params);
}
