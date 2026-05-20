import { useState, useEffect } from 'react'
import { getProfile, updateProfile, changePassword } from '../../helpers/profile'
import type { ProfileData, PasswordChangeData } from '../../helpers/profile'
import '../../styles/Admin/AdminLayout.css'

const Profile = () => {
    const [profile,  setProfile]  = useState<ProfileData>({})
    const [formData, setFormData] = useState<ProfileData>({
        first_name: '',
        last_name:  '',
        email:      '',
        phone:      '',
    })
    const [passwordData, setPasswordData] = useState<PasswordChangeData>({
        current_password: '',
        new_password:     '',
        confirm_password: '',
    })

    const [editMode, setEditMode] = useState(false)
    const [loading,  setLoading]  = useState(false)
    const [error,    setError]    = useState<string | null>(null)
    const [success,  setSuccess]  = useState<string | null>(null)

    // ── Load profile from backend on mount ───────────────────────
    useEffect(() => {
        let cancelled = false
        setLoading(true)
        getProfile()
            .then(data => {
                if (cancelled) return
                setProfile(data)
                setFormData({
                    first_name: data.first_name ?? '',
                    last_name:  data.last_name  ?? '',
                    email:      data.email      ?? '',
                    phone:      data.phone      ?? '',
                })
            })
            .catch(() => {
                if (!cancelled) setError('Failed to load profile.')
            })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    // ── Handlers ──────────────────────────────────────────────────

    const handleCancel = () => {
        setEditMode(false)
        setError(null)
        setSuccess(null)
        setFormData({
            first_name: profile.first_name ?? '',
            last_name:  profile.last_name  ?? '',
            email:      profile.email      ?? '',
            phone:      profile.phone      ?? '',
        })
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            await updateProfile(formData)
            const updated = await getProfile()
            setProfile(updated)
            setEditMode(false)
            setSuccess('Profile updated successfully.')
        } catch {
            setError('Failed to update profile.')
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.new_password !== passwordData.confirm_password) {
            setError('New passwords do not match.')
            return
        }
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            await changePassword(passwordData)
            setSuccess('Password changed successfully.')
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
        } catch {
            setError('Failed to change password. Check your current password and try again.')
        } finally {
            setLoading(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────

    return (
        <div style={{ padding: '24px' }}>
            <div className="admin-eyebrow">Account</div>
            <h1 className="admin-title" style={{ marginBottom: '20px' }}>Profile Settings</h1>

            {loading && <p style={{ opacity: 0.6 }}>Loading…</p>}

            <div className="admin-card" style={{ maxWidth: '620px' }}>

                {(error || success) && (
                    <div className={`admin-banner ${error ? 'error' : 'success'}`} style={{ marginBottom: '16px' }}>
                        {error ?? success}
                    </div>
                )}

                {/* ── Personal Information ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Personal Information</h2>
                    {!editMode && (
                        <button className="admin-btn" onClick={() => { setEditMode(true); setError(null); setSuccess(null) }}>
                            Edit
                        </button>
                    )}
                </div>

                {!editMode ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                        {[
                            { label: 'First Name',    value: profile.first_name },
                            { label: 'Last Name',     value: profile.last_name  },
                            { label: 'Email',         value: profile.email      },
                            { label: 'Phone',         value: profile.phone      },
                            { label: 'Role',          value: profile.role       },
                            { label: 'Organization',  value: profile.org_name   },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted-2, #6b7280)', marginBottom: '3px' }}>
                                    {label}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--admin-text, #f1f5f9)' }}>
                                    {value || '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={handleProfileUpdate}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {([
                                { field: 'first_name' as const, label: 'First Name', type: 'text'  },
                                { field: 'last_name'  as const, label: 'Last Name',  type: 'text'  },
                                { field: 'email'      as const, label: 'Email',      type: 'email' },
                                { field: 'phone'      as const, label: 'Phone',      type: 'tel'   },
                            ]).map(({ field, label, type }) => (
                                <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted-2, #6b7280)' }}>
                    {label}
                  </span>
                                    <input
                                        className="edit-org-input"
                                        type={type}
                                        value={formData[field] ?? ''}
                                        onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                                    />
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button type="submit" className="admin-btn primary" disabled={loading}>Save</button>
                            <button type="button" className="admin-btn" onClick={handleCancel}>Cancel</button>
                        </div>
                    </form>
                )}

                {/* ── Change Password ── */}
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--admin-border, #2a3045)' }}>
                    <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600 }}>Change Password</h2>
                    <form onSubmit={handlePasswordChange}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {([
                                { field: 'current_password' as const, label: 'Current Password'     },
                                { field: 'new_password'     as const, label: 'New Password'         },
                                { field: 'confirm_password' as const, label: 'Confirm New Password' },
                            ]).map(({ field, label }) => (
                                <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted-2, #6b7280)' }}>
                    {label}
                  </span>
                                    <input
                                        className="edit-org-input"
                                        type="password"
                                        value={passwordData[field]}
                                        onChange={e => setPasswordData({ ...passwordData, [field]: e.target.value })}
                                        required
                                    />
                                </label>
                            ))}
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <button type="submit" className="admin-btn primary" disabled={loading}>
                                Change Password
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    )
}

export default Profile