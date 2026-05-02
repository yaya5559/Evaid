import { ChangeEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AgentLayout from './AgentLayout'
import '../../styles/Admin/AdminLayout.css'

type AgentProfileData = {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  profile_picture?: string
  user_id: number
}

function AgentEditProfile() {
  const { user, api } = useAuth()
  const navigate = useNavigate()
  const userId = (user as any)?.user_id ?? ''

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [previewPicture, setPreviewPicture] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    const loadProfile = async () => {
      setInitialLoading(true)
      setError(null)
      try {
        const res = await api.get(`/agent/profile/${userId}`)
        const data: AgentProfileData = res.data
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setPhoneNumber(data.phone_number)
        setProfilePicture(data.profile_picture ?? null)
        setPreviewPicture(data.profile_picture ?? null)
      } catch (err: any) {
        const detail = err?.response?.data?.detail
        const message = detail ?? err?.message ?? 'Failed to load profile'
        setError(message)
      } finally {
        setInitialLoading(false)
      }
    }
    void loadProfile()
  }, [userId, api])

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await api.patch(`/agent/profile/${userId}`, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        profile_picture: profilePicture,
      })
      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        navigate('/AgentProfile')
      }, 1500)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((d: any) => d?.msg ?? String(d)).join(', ')
        : detail ?? err?.message ?? 'Failed to update profile'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/AgentProfile')
  }

  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

  const email = (user as any)?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  const handlePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPreviewPicture(result)
      setProfilePicture(result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <AgentLayout>
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="button" className="admin-btn" onClick={handleCancel} disabled={initialLoading || saving}>
            ← Back
          </button>
          <div>
            <div className="admin-eyebrow">Account</div>
            <h1 className="admin-title">Edit Profile</h1>
          </div>
        </div>
      </header>

      {initialLoading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading profile...
        </div>
      )}

      {error && !initialLoading && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {success && !initialLoading && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {success}
        </div>
      )}

      {!initialLoading && (
      <section className="admin-card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(145deg, #67e8f9, #22c55e)',
              color: '#06202d',
              fontSize: '32px',
              fontWeight: '700',
            }}
          >
            {initials}
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
              {firstName} {lastName}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {email}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '18px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {previewPicture ? (
              <img
                src={previewPicture}
                alt="Profile preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>No photo</span>
            )}
          </div>
          <label className="edit-org-control" style={{ margin: 0 }}>
            <span>Profile picture</span>
            <input
              className="edit-org-input"
              type="file"
              accept="image/*"
              onChange={handlePictureChange}
              disabled={saving}
            />
          </label>
        </div>

        <div className="edit-org-controls">
          <label className="edit-org-control">
            <span>First Name *</span>
            <input
              className="edit-org-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
              placeholder="Enter first name"
              required
            />
          </label>

          <label className="edit-org-control">
            <span>Last Name *</span>
            <input
              className="edit-org-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
              placeholder="Enter last name"
              required
            />
          </label>

          <label className="edit-org-control">
            <span>Phone Number</span>
            <input
              className="edit-org-input"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={saving}
              placeholder="Enter phone number"
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </section>
      )}
    </AgentLayout>
  )
}

export default AgentEditProfile
