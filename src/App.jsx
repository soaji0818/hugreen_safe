import { useEffect, useState } from "react";
import AppShell from "./app/AppShell";
import { eventRows } from "./data/demoRows";
import LoginPage from "./features/auth/LoginPage";
import { clearAuth, getStoredAuth, saveAuth } from "./services/authService";
import { groups, pages } from "./pages";
import "./styles/application.css";

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth);

  useEffect(() => {
    if (!auth?.expiresAt) return undefined;

    const remainingTime = new Date(auth.expiresAt).getTime() - Date.now();
    const timeout = window.setTimeout(() => {
      clearAuth();
      setAuth(null);
    }, Math.max(0, remainingTime));

    return () => window.clearTimeout(timeout);
  }, [auth]);

  function handleLogin(nextAuth) {
    saveAuth(nextAuth);
    setAuth(nextAuth);
  }

  function handleLogout() {
    clearAuth();
    setAuth(null);
  }

  if (!auth) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppShell
      groups={groups}
      pages={pages}
      initialRows={eventRows}
      user={auth}
      onLogout={handleLogout}
    />
  );
}
