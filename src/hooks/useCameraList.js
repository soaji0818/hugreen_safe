import { useCallback, useEffect, useState } from "react";
import { getCameras } from "../services/cameraService";

export default function useCameraList({
  enabled,
  token,
  factoryCd = "",
  focusYn = "",
  useYn = "",
  onUnauthorized,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const refetch = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !token) return undefined;
    const controller = new AbortController();

    // Request lifecycle state intentionally resets when the query changes.
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError("");
    getCameras({ token, factoryCd, focusYn, useYn, signal: controller.signal })
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
  }, [enabled, token, factoryCd, focusYn, useYn, onUnauthorized, requestVersion]);

  return { data, loading, error, refetch };
}
