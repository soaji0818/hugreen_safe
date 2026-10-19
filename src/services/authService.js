import { postLogin } from "../api/authApi";

const AUTH_STORAGE_KEY = "hugreen.auth";

function readJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getStoredAuth() {
  const auth = readJson(sessionStorage.getItem(AUTH_STORAGE_KEY));
  if (!auth?.token || !auth?.expiresAt) return null;
  if (new Date(auth.expiresAt).getTime() <= Date.now()) {
    clearAuth();
    return null;
  }
  return auth;
}

export function saveAuth(auth) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  localStorage.removeItem("hugreen.savedUserId");
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function login({ userId, password, signal }) {
  try {
    const payload = await postLogin({ userId, password }, { signal });
    if (!payload?.data?.token) {
      throw new Error(payload?.resultMsg || "로그인 응답을 확인할 수 없습니다.");
    }
    return payload.data;
  } catch (error) {
    if (error.status === 401) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
    throw error;
  }
}
