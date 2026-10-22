import { useCallback, useEffect, useState } from "react";
import { getAlarmHistory } from "../services/alarmService";

export default function useAlarmHistory({ token, fromDt, toDt, cameraId, equipCd, riskLvCd, releaseYn, onUnauthorized }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const refetch = useCallback(() => setRequestVersion((value) => value + 1), []);

  useEffect(() => {
    if (!token || !fromDt || !toDt) return undefined;
    const controller = new AbortController();
    // Query changes start a new request and clear the previous request state.
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError("");
    getAlarmHistory({ token, fromDt, toDt, cameraId, equipCd, riskLvCd, releaseYn, signal: controller.signal })
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
  }, [token, fromDt, toDt, cameraId, equipCd, riskLvCd, releaseYn, onUnauthorized, requestVersion]);

  return { data, loading, error, refetch };
}
