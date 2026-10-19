import { useEffect, useState } from "react";
import { getCommonCodes } from "../services/commonCodeService";

export default function useCommonCodes({ enabled, token, codeDiv, onUnauthorized }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !token || !codeDiv) return undefined;
    const controller = new AbortController();

    // Request lifecycle state intentionally resets when the code group changes.
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError("");
    getCommonCodes({ token, codeDiv, signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        if (requestError.status === 401) onUnauthorized?.();
        else setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [enabled, token, codeDiv, onUnauthorized]);

  return { data, loading, error };
}
