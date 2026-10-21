import { fetchDevices } from "../api/deviceApi";

export async function getDevices(params) {
  const payload = await fetchDevices(params);
  return (payload?.data || []).map((device) => ({
    ...device,
    id: device.deviceId,
  }));
}
