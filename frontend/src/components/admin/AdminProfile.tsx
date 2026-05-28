import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext"
import "../../styles/Profile.css";

export default function Profile() {
    // Destructure the api client and user object straight out of your AuthContext
    const { user, api } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
        company: "",
    });

    const [securityData, setSecurityData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load user data when component mounts
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                role: user.role || "agent",
                company: user.company || "",
            });
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSecurityData({ ...securityData, [e.target.name]: e.target.value });
    };

    // ── PUSH USER IDENTITY PROFILE PARAMETERS TO FASTAPI ──
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsSubmitting(true);

        try {
            // Sending a PUT request to your FastAPI backend route
            const response = await api.put("/user/profile/update", {
                name: formData.name,
                company: formData.company
            });

            console.log("Profile Update Success:", response.data);
            setMessage({ type: "success", text: "Identity metadata synchronized successfully." });
        } catch (err: any) {
            console.error("Profile Update Error Details:", err);
            setMessage({
                type: "error",
                text: err.response?.data?.detail || "Failed to update identity data on backend."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── PUSH ACCOUNT PASSWORD ROTATION TO FASTAPI ──
    const handleSecuritySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (securityData.newPassword !== securityData.confirmPassword) {
            setMessage({ type: "error", text: "Target assignment keys do not match." });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.put("/user/profile/password", {
                current_password: securityData.currentPassword,
                new_password: securityData.newPassword,
            });

            console.log("Password Update Success:", response.data);
            setMessage({ type: "success", text: "Credential keys rotated successfully." });
            setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            console.error("Password Update Error Details:", err);
            setMessage({
                type: "error",
                text: err.response?.data?.detail || "Credential confirmation rejected by system."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">

                <div className="profile-header">
                    <h1>Account Settings</h1>
                    <p>Manage your systematic identity clearances, organization attributes, and core credentials.</p>
                </div>

                {message && (
                    <div className={`status-banner ${message.type === "success" ? "status-success" : "status-error"}`}>
                        {message.type === "success" ? "✅" : "⚠️"} {message.text}
                    </div>
                )}

                <div className="profile-grid">

                    {/* USER IDENTITY METADATA CONFIGURATION */}
                    <section className="profile-card">
                        <h3>Identity Metadata</h3>
                        <form onSubmit={handleProfileSubmit} className="profile-form">

                            <div className="form-field">
                                <label>Full Name / Identifier</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="disabled-input"
                                    title="Core email nodes cannot be modified online."
                                />
                                <span className="input-helper-text">Contact workspace administrators to switch system email routings.</span>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label>Assigned Clearance Role</label>
                                    <input
                                        type="text"
                                        value={formData.role.replace('_', ' ').toUpperCase()}
                                        disabled
                                        className="disabled-input"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Company/Agency Node</label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="profile-save-btn" disabled={isSubmitting}>
                                {isSubmitting ? "Synchronizing..." : "Save Identity Changes"}
                            </button>
                        </form>
                    </section>

                    {/* CREDENTIAL SECURITY ACCOUNT MANAGEMENT */}
                    <section className="profile-card">
                        <h3>Security &amp; Authorization</h3>
                        <form onSubmit={handleSecuritySubmit} className="profile-form">

                            <div className="form-field">
                                <label>Current Credentials / Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    placeholder="••••••••"
                                    value={securityData.currentPassword}
                                    onChange={handleSecurityChange}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    placeholder="Minimum 8 characters"
                                    value={securityData.newPassword}
                                    onChange={handleSecurityChange}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Re-type new password"
                                    value={securityData.confirmPassword}
                                    onChange={handleSecurityChange}
                                    required
                                />
                            </div>

                            <button type="submit" className="profile-save-btn secondary-btn" disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Rotate Credentials"}
                            </button>
                        </form>
                    </section>

                </div>
            </div>
        </div>
    );
}