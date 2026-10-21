import { useEffect, useState } from "react";
import { getDevices } from "../services/deviceService";

export default function useDeviceList({ enabled, token, onUnauthorized }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !token) return undefined;
    const controller = new AbortController();
    getDevices({ token, signal: controller.signal })
      .then((devices) => {
        setData(devices);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name === "AbortError") return;
        if (requestError.status === 401) onUnauthorized?.();
        else {
          setData([]);
          setError(requestError.message);
        }
      });

    return () => controller.abort();
  }, [enabled, token, onUnauthorized]);

  return { data, error };
}
