import { useEffect, useId, useRef, useState } from "react";
import { login } from "../services/authService";
import "../styles/login.css";

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" />
      <circle cx="12" cy="12" r="2.25" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 4 16 16M10.6 7.1A9.7 9.7 0 0 1 12 7c5.8 0 9 5 9 5a14.5 14.5 0 0 1-2.1 2.5M14.1 16.7A9.5 9.5 0 0 1 12 17c-5.8 0-9-5-9-5a14 14 0 0 1 3.1-3.5" />
    </svg>
  );
}

function HugreenLoginLogo() {
  return (
    <div className="login-brand" aria-label="hugreen 휴그린">
      <svg className="login-brand-mark" viewBox="0 0 64 54" aria-hidden="true">
        <path className="brand-mark-left" d="M4 4h17l7 46H12Z" />
        <path className="brand-mark-top" d="M23 4h17l3 17H26Z" />
        <path className="brand-mark-right" d="M43 4h16l1 46H50Z" />
        <path className="brand-mark-center" d="m22 25 23-4 4 22-23 5Z" />
      </svg>
      <span>hugreen</span>
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const userIdInput = useRef(null);
  const errorId = useId();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    userIdInput.current?.focus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedUserId = userId.trim();
    if (!normalizedUserId || !password) {
      setError("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = await login({ userId: normalizedUserId, password });
      onLogin(auth);
    } catch (loginError) {
      if (loginError.name !== "AbortError") setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-form-panel" aria-labelledby="login-title">
        <HugreenLoginLogo />

        <div className="login-card">
          <header className="login-form-header">
            <h1 id="login-title">로그인</h1>
            <p>계정 정보를 입력해 주세요.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="login-field">
              <span className="login-visually-hidden">아이디</span>
              <input
                ref={userIdInput}
                type="text"
                name="userId"
                value={userId}
                maxLength={20}
                autoComplete="username"
                inputMode="text"
                placeholder="아이디를 입력하세요"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => {
                  setUserId(event.target.value);
                  if (error) setError("");
                }}
              />
            </label>

            <label className="login-field">
              <span className="login-visually-hidden">비밀번호</span>
              <span className="login-password-control">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  maxLength={100}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </span>
            </label>

            <div className="login-error-slot" aria-live="polite">
              {error && <p id={errorId} className="login-error">{error}</p>}
            </div>

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><span className="login-spinner" />로그인 중</> : "로그인"}
            </button>
          </form>

          <p className="login-help">
            비밀번호를 잊으셨나요? <strong>관리자에게 문의해 주세요.</strong>
          </p>
        </div>
      </section>
      <footer className="login-page-footer">
        <strong>휴그린 주식회사</strong>
        <span>Copyright 2026. 블룸 주식회사 inc. all rights reserved</span>
      </footer>
    </main>
  );
}
