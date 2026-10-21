import { useCallback, useEffect, useState } from "react";
import { getFaults } from "../services/faultService";

export default function useFaultList({
  enabled = true,
  token,
  fromDt = "",
  toDt = "",
  deviceId = "",
  deviceKind = "",
  faultTypeCd = "",
  statusCd = "",
  openYn = "",
  regType = "",
  focusYn = "",
  chargeMemberId = "",
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
    // Reset request state whenever a server-side filter changes.
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError("");
    getFaults({
      token,
      fromDt,
      toDt,
      deviceId,
      deviceKind,
      faultTypeCd,
      statusCd,
      openYn,
      regType,
      focusYn,
      chargeMemberId,
      signal: controller.signal,
    })
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
  }, [
    token,
    enabled,
    fromDt,
    toDt,
    deviceId,
    deviceKind,
    faultTypeCd,
    statusCd,
    openYn,
    regType,
    focusYn,
    chargeMemberId,
    onUnauthorized,
    requestVersion,
  ]);

  return { data, loading, error, refetch };
}
