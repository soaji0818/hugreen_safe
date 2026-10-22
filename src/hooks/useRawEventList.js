import { useCallback, useEffect, useState } from "react";
import { getRawEvents } from "../services/rawEventService";

export default function useRawEventList({
  token,
  fromDt,
  toDt,
  cameraId = "",
  eventTypeCd = "",
  regType = "",
  onUnauthorized,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const refetch = useCallback(() => setRequestVersion((value) => value + 1), []);

  useEffect(() => {
    if (!token || !fromDt || !toDt) return undefined;
    const controller = new AbortController();
    // Request lifecycle state intentionally resets when the server query changes.
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError("");

    getRawEvents({ token, fromDt, toDt, cameraId, eventTypeCd, regType, signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        if (requestError.status === 401) onUnauthorized?.();
        else {
        setData([]);
          setError(requestError.message || "원천 이벤트 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [token, fromDt, toDt, cameraId, eventTypeCd, regType, onUnauthorized, requestVersion]);

  return { data, loading, error, refetch };
}
