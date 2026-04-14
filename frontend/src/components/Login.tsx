// src/pages/Login.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { useAuth } from "../context/AuthContext";

type FormState = { email: string; password: string; remember: boolean };

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // minimal, server validates truth

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    remember: true,
  });
  const [showPwd, setShowPwd] = useState(false); // show password
  const [capsOn, setCapsOn] = useState(false);
  const [errorTop, setErrorTop] = useState(""); // server/global failure
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  ); // field-level validation
  const { login, user, loading } = useAuth();

  // Validate small rules (why: prevent avoidable roundtrips)
  const validate = (state: FormState) => {
    const next: typeof errors = {};
    if (!emailRegex.test(state.email)) next.email = "Enter a valid email.";
    if (state.password.length < 1)
      next.password = "Use at least 8 characters.";
    return next;
  };

  const isValid = useMemo(() => {
    const v = validate(form);
    return !v.email && !v.password;
  }, [form]);

  const onChange =
    (name: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        name === "remember"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((p) => ({ ...p, [name]: value as any }));
      if (errors[name as "email" | "password"]) {
        const copy = { ...errors };
        delete copy[name as "email" | "password"];
        setErrors(copy);
      }
    };

  const onKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(e.getModifierState("CapsLock"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorTop("");
    const v = validate(form);
    if (v.email || v.password) {
      setErrors(v);
      return;
    }

    try {
      await login(form.email, form.password);
    } catch {
      setErrorTop("Invalid email or password. Try again.");
    }
  };

  useEffect(() => {
    console.log(loading)
    if (!loading && user) {
      if (user.role === "evaide_admin") {
        navigate("/Dashboard");
      } else if (user.role === "org_admin") {
        navigate("/Org_Dashboard");
      } else if (user.role === "agent") {
        navigate("/AgentCases");
      } else {
        navigate("/")
      }
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    // Reduce initial frustration: pre-focus email
    const el = document.getElementById("email");
    el?.focus();
  }, []);

  return (
    <main className="login" aria-labelledby="login-title">
      <section className="card" role="region" aria-labelledby="login-title">
        <header className="header">
          <h1 id="login-title" className="title">
            Welcome back
          </h1>
          <p className="subtitle">Sign in to continue</p>
        </header>

        {errorTop && (
          <p className="error-top" role="alert" aria-live="assertive">
            {errorTop}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@agency.gov"
              value={form.email}
              onChange={onChange("email")}
              onKeyUp={onKeyEvent}
              onKeyDown={onKeyEvent}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-err" : undefined}
              spellCheck={false}
            />
            {errors.email && (
              <small id="email-err" className="error">
                {errors.email}
              </small>
            )}
          </div>

          <div className="field">
            <div className="labelRow">
              <label htmlFor="password">Password</label>
              {capsOn && <span className="hint">Caps Lock is on</span>}
            </div>
            <div className="pwdWrap">
              <input
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="********"
                value={form.password}
                onChange={onChange("password")}
                onKeyUp={onKeyEvent}
                onKeyDown={onKeyEvent}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "pwd-err" : undefined}
              />
              <button
                type="button"
                className="iconBtn"
                aria-label={showPwd ? "Hide password" : "Show password"}
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <small id="pwd-err" className="error">
                {errors.password}
              </small>
            )}
          </div>

          <div className="row between">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={onChange("remember")}
              />
              <span>Remember me</span>
            </label>
            <Link to="#" className="link">
              Forgot password?
            </Link>
          </div>

          <button className="btn" type="submit" disabled={!isValid || loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <footer className="footer" aria-label="Help">
          <p className="fine">By continuing you agree to our Terms & Privacy.</p>
        </footer>
      </section>
    </main>
  );
}

export default Login;