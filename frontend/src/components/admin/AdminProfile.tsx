import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminNav from "./Nav";
import OrgNav from "../organization/OrgNav";
import AgentNav from "../agent/AgentNav";
import "../../styles/Admin/AdminLayout.css";
import "../../styles/Profile.css";

function roleLabel(role: string) {
  if (role === "evaide_admin") return "Evaid Admin";
  if (role === "org_admin") return "Org Admin";
  if (role === "agent") return "Agent";
  return role;
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Profile() {
  const { user, api, logout } = useAuth();
  const navigate = useNavigate();
  const role = (user as any)?.role ?? "";

  const [formData, setFormData] = useState({ name: "", company: "", phone_number: "" });
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileName, setProfileName] = useState("");
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    api.get("/user/me")
      .then((res) => {
        if (!active) return;
        const d = res.data;
        setFormData({ name: d.name || "", company: d.company || "", phone_number: d.phone_number || "" });
        setProfileName(d.name || "");
        setLastLogin(d.last_login_at);
        setOrgName(d.company || "");
      })
      .catch((err) => {
        if (!active) return;
        console.error("Profile load error:", err.response?.data ?? err.message);
        setMessage({ type: "error", text: "Failed to load profile. Please refresh the page." });
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => { active = false; };
  }, []);

  const initials = (profileName || user?.email || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      await api.put("/user/profile/update", {
        name: formData.name,
        ...(role === "org_admin" ? { company: formData.company } : {}),
      });
      setMessage({ type: "success", text: "Profile updated successfully." });
      setProfileName(formData.name);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Failed to update profile." });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSubmitting(true);
    try {
      await api.put("/user/profile/password", {
        current_password: securityData.currentPassword,
        new_password: securityData.newPassword,
      });
      setMessage({ type: "success", text: "Password updated successfully." });
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Failed to update password." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setSigningOut(true);
    try {
      await api.delete("/user/sessions");
      await logout();
      navigate("/Login", { replace: true });
    } catch {
      setMessage({ type: "error", text: "Failed to sign out all sessions." });
      setSigningOut(false);
      setShowRevokeConfirm(false);
    }
  };

  const SideNav =
    role === "evaide_admin" ? AdminNav :
    role === "org_admin" ? OrgNav :
    AgentNav;

  return (
    <div className="admin-shell profile-shell">
      <aside className="admin-left">
        <SideNav />
      </aside>

      <main className="admin-main profile-main">

        {/* Header */}
        <div className="profile-page-header">
          <button className="profile-back-btn" onClick={() => navigate(-1)} title="Go back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="profile-page-header-text">
            <div className="profile-eyebrow">Account</div>
            <h1 className="profile-title">Profile Settings</h1>
            <p className="profile-subtitle">Manage your identity, credentials, and account preferences.</p>
          </div>
        </div>

        {/* Status banner */}
        {message && (
          <div className={`profile-status ${message.type}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {message.type === "success"
                ? <><polyline points="20 6 9 17 4 12" /></>
                : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
              }
            </svg>
            {message.text}
          </div>
        )}

        {/* Avatar card */}
        <div className="profile-avatar-card">
          <div className="profile-avatar-circle">{initials}</div>
          <div className="profile-avatar-info">
            <p className="profile-avatar-name">{profileName || "—"}</p>
            <div className="profile-avatar-meta">
              <span className="profile-role-pill">{roleLabel(role)}</span>
              <span className="profile-avatar-email">{user?.email}</span>
            </div>
          </div>
          {lastLogin && (
            <div className="profile-last-login">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Last login: {formatLastLogin(lastLogin)}
            </div>
          )}
        </div>

        <div className="profile-grid">

          {/* Identity card */}
          <section className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="profile-card-title">Identity</h2>
            </div>

            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <div className="profile-form-row">
                <div className="profile-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder={profileLoading ? "Loading…" : "Your name"}
                    disabled={profileLoading}
                    required
                  />
                </div>
                <div className="profile-field">
                  <label>Phone Number</label>
                  <input type="tel" value={profileLoading ? "" : formData.phone_number} placeholder={profileLoading ? "Loading…" : ""} disabled />
                  <span className="profile-field-hint">Contact an admin to change your phone number.</span>
                </div>
              </div>

              <div className="profile-form-row">
                <div className="profile-field">
                  <label>Email Address</label>
                  <input type="email" value={user?.email || ""} disabled />
                  <span className="profile-field-hint">Contact an admin to change your email.</span>
                </div>
                <div className="profile-field">
                  <label>Role</label>
                  <input type="text" value={roleLabel(role)} disabled />
                </div>
              </div>

              {role === "org_admin" && (
                <div className="profile-field">
                  <label>Organization / Agency</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Your organization name"
                  />
                </div>
              )}

              {role === "agent" && orgName && (
                <div className="profile-field">
                  <label>Organization</label>
                  <input type="text" value={orgName} disabled />
                  <span className="profile-field-hint">Assigned by your organization admin.</span>
                </div>
              )}

              <button type="submit" className="profile-save-btn primary" disabled={submitting || profileLoading}>
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </section>

          {/* Security card */}
          <section className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="profile-card-title">Security</h2>
            </div>

            <form className="profile-form" onSubmit={handlePasswordSubmit}>
              <div className="profile-field">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={securityData.currentPassword}
                  onChange={(e) => setSecurityData((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-field">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={securityData.newPassword}
                  onChange={(e) => setSecurityData((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={securityData.confirmPassword}
                  onChange={(e) => setSecurityData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="profile-save-btn secondary" disabled={submitting}>
                {submitting ? "Updating…" : "Update Password"}
              </button>
            </form>

            {/* Sign out all sessions */}
            <div className="profile-sessions-divider" />
            <div className="profile-sessions-section">
              <div className="profile-sessions-info">
                <p className="profile-sessions-title">Active Sessions</p>
                <p className="profile-sessions-desc">Sign out from all devices and browsers. You will be redirected to the login page.</p>
              </div>
              {!showRevokeConfirm ? (
                <button
                  type="button"
                  className="profile-save-btn danger"
                  onClick={() => setShowRevokeConfirm(true)}
                >
                  Sign Out Everywhere
                </button>
              ) : (
                <div className="profile-revoke-confirm">
                  <p>Are you sure? This will end all active sessions.</p>
                  <div className="profile-revoke-actions">
                    <button
                      type="button"
                      className="profile-save-btn danger"
                      onClick={handleRevokeAllSessions}
                      disabled={signingOut}
                    >
                      {signingOut ? "Signing out…" : "Yes, sign out all"}
                    </button>
                    <button
                      type="button"
                      className="profile-save-btn secondary"
                      onClick={() => setShowRevokeConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
