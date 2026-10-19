import { fetchZones } from "../api/zoneApi";

function splitEventTypeCodes(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(",").map((code) => code.trim()).filter(Boolean);
}

export async function getZones(params) {
  const payload = await fetchZones(params);
  return (payload?.data || []).map((zone) => ({
    ...zone,
    id: zone.zoneId,
    eventTypeCds: splitEventTypeCodes(zone.eventTypeCds),
  }));
}
