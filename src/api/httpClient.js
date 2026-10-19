export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://saf-api.hugreen.bloom-ai.kr"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function requestApi(path, {
  method = "GET",
  token,
  query,
  body,
  signal,
  acceptedResultCodes = [0],
  networkMessage = "서버에 연결할 수 없습니다.",
  errorMessage = "요청을 처리하지 못했습니다.",
} = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(networkMessage, 0);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Empty responses are handled by the status check below.
  }

  if (!response.ok || !acceptedResultCodes.includes(payload?.resultCd)) {
    throw new ApiError(
      payload?.resultMsg || errorMessage,
      response.status,
      payload,
    );
  }

  return payload;
}
