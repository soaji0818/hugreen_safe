import { useCallback, useEffect, useState } from "react";
import { getZones } from "../services/zoneService";

export default function useZoneList({ enabled, token, cameraId, onUnauthorized }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const refetch = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !token || !cameraId) return undefined;

    const controller = new AbortController();
    // Request lifecycle state intentionally resets when the selected camera changes.
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError("");
    getZones({ token, cameraId, signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        if (requestError.status === 401) onUnauthorized?.();
        else {
          setData([]);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, token, cameraId, onUnauthorized, requestVersion]);

  return { data, loading, error, refetch };
}
