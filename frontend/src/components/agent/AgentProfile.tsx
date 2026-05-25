import { useEffect, useState } from 'react'
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

function AgentProfile() {
  const { user, api } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<AgentProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = (user as any)?.user_id ?? ''

  useEffect(() => {
    if (!userId) return
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/agent/profile/${userId}`)
        if (res.data?.message === 'Error') {
          setError(res.data?.error ?? 'Failed to load profile')
        } else {
          setProfile(res.data)
        }
      } catch (err: any) {
        const detail = err?.response?.data?.detail
        const message = detail ?? err?.message ?? 'Failed to load profile'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    void loadProfile()
  }, [userId, api])

  const firstName = profile?.first_name ?? ''
  const lastName = profile?.last_name ?? ''
  const email = profile?.email ?? ''
  const phoneNumber = profile?.phone_number ?? ''
  const profilePicture = profile?.profile_picture ?? ''

  const initials = email.slice(0, 2).toUpperCase()

  return (
    <AgentLayout>
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="button" className="admin-btn" onClick={() => navigate('/AgentCases')}>
            ← Back
          </button>
          <div>
            <div className="admin-eyebrow">Account</div>
            <h1 className="admin-title">My Profile</h1>
          </div>
        </div>
        <div className="admin-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => navigate('/AgentEditProfile')}
          >
            Edit Profile
          </button>
        </div>
      </header>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading profile...
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {!loading && !error && profile && (
      <section className="admin-card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: profilePicture ? 'transparent' : 'linear-gradient(145deg, #67e8f9, #22c55e)',
              color: '#06202d',
              fontSize: '32px',
              fontWeight: '700',
            }}
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#f8fafc' }}>
              {firstName} {lastName}
            </h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
              Agent ID: {userId}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              First Name
            </label>
            <p style={{ margin: 0, fontSize: '16px', color: '#e2e8f0' }}>
              {firstName || '—'}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Last Name
            </label>
            <p style={{ margin: 0, fontSize: '16px', color: '#e2e8f0' }}>
              {lastName || '—'}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Email
            </label>
            <p style={{ margin: 0, fontSize: '16px', color: '#e2e8f0' }}>
              {email || '—'}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Phone Number
            </label>
            <p style={{ margin: 0, fontSize: '16px', color: '#e2e8f0' }}>
              {phoneNumber || '—'}
            </p>
          </div>
        </div>
      </section>
      )}
    </AgentLayout>
  )
}

export default AgentProfile
