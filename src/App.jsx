import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "./app/AppShell";
import { eventRows } from "./data/demoRows";
import LoginPage from "./pages/LoginPage";
import { clearAuth, getStoredAuth, saveAuth } from "./services/authService";
import { groups, pages } from "./pages";
import "./styles/application.css";
import "./pages/ai-cctv-management/styles/cctv-shared.css";
import "./pages/ai-cctv-management/styles/cctv-master.css";
import "./pages/ai-cctv-management/styles/cctv-monitoring.css";
import "./pages/ai-cctv-management/styles/equipment-failures.css";

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth?.expiresAt) return undefined;

    const remainingTime = new Date(auth.expiresAt).getTime() - Date.now();
    const timeout = window.setTimeout(() => {
      clearAuth();
      setAuth(null);
      navigate("/", { replace: true });
    }, Math.max(0, remainingTime));

    return () => window.clearTimeout(timeout);
  }, [auth, navigate]);

  function handleLogin(nextAuth) {
    saveAuth(nextAuth);
    setAuth(nextAuth);
  }

  function handleLogout() {
    clearAuth();
    setAuth(null);
    navigate("/", { replace: true });
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
