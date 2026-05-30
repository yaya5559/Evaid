// src/pages/Login.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";
import "../styles/TermsOfService.css";
import { useAuth } from "../context/AuthContext";

type FormState = { email: string; password: string; remember: boolean };

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // minimal, server validates truth

const EFFECTIVE_DATE = "May 28, 2026";
const LAST_UPDATED = "May 28, 2026";

const SECTIONS = [
  { n: '01', title: 'Acceptance of Terms', body: 'These Terms constitute a legally binding agreement between you and Evaid governing your access to and use of the evidence analysis and case management platform. By creating an account or logging in, you represent that you have the authority to bind yourself and your organization to these Terms.' },
  { n: '02', title: 'Description of Service', body: 'Evaid is an AI-assisted evidence analysis platform for authorized investigative organizations, providing secure evidence management, automated signal extraction, AI-generated insights, case tracking, and role-based access control.' },
  { n: '03', title: 'Eligibility and Authorized Use', body: 'Access is restricted to authorized users within registered investigative organizations who have been granted an account by an administrator and whose use is in furtherance of lawful investigative activities.' },
  { n: '04', title: 'User Accounts and Responsibilities', body: 'Your credentials are personal and non-transferable. You are solely responsible for all activities under your account and must notify your administrator immediately upon any suspected unauthorized access.' },
  { n: '05', title: 'Acceptable Use Policy', body: 'You agree not to upload evidence outside lawful purposes, circumvent security controls, share credentials, introduce malicious code, reverse engineer the platform, or violate any applicable law.' },
  { n: '06', title: 'Evidence and Case Data', body: 'You retain ownership of all content you upload. You are solely responsible for ensuring you have legal authority to upload and process each piece of evidence, and that handling complies with applicable chain-of-custody and privacy requirements.' },
  { n: '07', title: 'AI-Generated Content Disclaimer', body: 'AI-generated insights are analytical aids only and do not constitute legal conclusions or admissible evidence. All AI outputs must be independently verified by a qualified human investigator before being relied upon for any decision.', warning: 'AI analysis is a decision-support tool. Human review and professional judgment are required before any operational, prosecutorial, or enforcement action.' },
  { n: '08', title: 'Data Privacy and Security', body: 'Evaid implements reasonable security measures including password hashing, JWT authentication, and role-based access controls. No system is completely secure — you transmit data at your own risk.' },
  { n: '09', title: 'Confidentiality', body: 'All users agree to treat case information, evidence data, and AI-generated insights as strictly confidential. This obligation survives termination of your access.' },
  { n: '10', title: 'Intellectual Property', body: 'The Evaid platform, software, design, and trademarks are the exclusive intellectual property of Evaid. These Terms do not transfer any intellectual property rights to you.' },
  { n: '11', title: 'Disclaimer of Warranties', body: 'The Service is provided "as is" without warranty of any kind. Evaid expressly disclaims all warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.' },
  { n: '12', title: 'Limitation of Liability', body: 'Evaid shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Total aggregate liability shall not exceed the amount paid by your organization in the preceding twelve months.' },
  { n: '13', title: 'Termination', body: 'We may suspend or terminate your access at any time for violation of these Terms. Upon termination, your right to access the Service ceases immediately.' },
  { n: '14', title: 'Governing Law and Disputes', body: 'These Terms are governed by applicable law. Disputes shall first be subject to good-faith negotiation, then binding arbitration if unresolved.' },
  { n: '15', title: 'Changes to These Terms', body: 'We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.' },
]

function TermsContent() {
  return (
    <div className="tos-container">
      <header className="tos-header">
        <div className="tos-badge">Legal</div>
        <h1 className="tos-title">Terms of Service</h1>
        <p className="tos-meta">
          Effective: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last updated: {LAST_UPDATED}
        </p>
      </header>

      <div className="tos-intro">
        Please read these Terms of Service carefully before using the Evaid
        platform. By accessing or using Evaid, you confirm that you have read,
        understood, and agree to be bound by these terms.
      </div>

      {SECTIONS.map((s, i) => (
        <div key={s.n}>
          <section className="tos-section">
            <p className="tos-section-number">Section {s.n}</p>
            <h2 className="tos-section-title">{s.title}</h2>
            <p>{s.body}</p>
            {s.warning && (
              <div className="tos-warning">
                <p>{s.warning}</p>
              </div>
            )}
          </section>
          {i < SECTIONS.length - 1 && <hr className="tos-divider" />}
        </div>
      ))}

      <div className="tos-contact">
        <h3>Questions about these Terms?</h3>
        <p>
          Contact the Evaid platform administrator or your organization's
          designated administrator.
        </p>
      </div>
    </div>
  )
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    remember: true,
  });
  const [showPwd, setShowPwd] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
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
    if (!loading && user) {
      if (user.role === "evaide_admin") {
        navigate("/Dashboard");
      } else if (user.role === "org_admin") {
        navigate("/Org_Dashboard");
      } else if (user.role === "agent") {
        navigate("/AgentDashboard");
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
          <Link to="/" className="backLink" aria-label="Back to homepage">
            ← Home
          </Link>
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
                {showPwd ? <EyeIcone /> : <EyeOffIcon/>}
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
          <p className="fine">
            By continuing you agree to our{" "}
            <button type="button" className="link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }} onClick={() => setShowTerms(true)}>
              Terms of Service
            </button>.
          </p>
        </footer>
      </section>

      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowTerms(false)}>
          <div style={{ background: '#0b111e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0', flexShrink: 0 }}>
              <button type="button" className="btn" style={{ width: 'auto', padding: '8px 20px' }} onClick={() => setShowTerms(false)}>✕ Close</button>
            </div>
            <TermsContent />
          </div>
        </div>
      )}
    </main>
  );
}

function EyeIcone() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000000"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>

  )
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#666"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default Login;
