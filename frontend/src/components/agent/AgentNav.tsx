import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { NotificationBell } from '../shared/NotificationBell'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function AgentNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/Login', { replace: true })
  }

  const email = (user as any)?.email ?? ''
  const firstName = (user as any)?.first_name ?? 'Agent'
  const lastName = (user as any)?.last_name ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  const handleProfileClick = () => {
    navigate('/AgentProfile')
  }

  return (
    <>
      <div className='admin-brand'>
        <div className='admin-brand-mark' />
        <div style={{ flex: 1 }}>
          <div className='admin-brand-title'>Evaid</div>
          <div className='admin-brand-sub'>Agent console</div>
        </div>
        <NotificationBell />
      </div>

      <nav className='admin-nav'>
        <div className='admin-nav-section'>
          <div className='admin-nav-label'>Workspace</div>
          <NavLink className={navClassName} to='/AgentDashboard'>
            <span className='admin-nav-dot' />
            Dashboard
          </NavLink>
          <NavLink className={navClassName} to='/AgentCases'>
            <span className='admin-nav-dot' />
            My Cases
          </NavLink>
        </div>
      </nav>

      <button
        type='button'
        onClick={handleProfileClick}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderRadius: '8px',
          transition: 'background 0.2s',
          marginBottom: '8px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        className='admin-user-panel'
      >
        <div className='admin-user-avatar'>{initials || 'AG'}</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className='admin-user-name'>{firstName} {lastName}</div>
          <div className='admin-user-role'>{email}</div>
        </div>
      </button>

      <button className='admin-btn admin-btn-ghost org-nav-logout' onClick={() => void onLogout()} type='button'>
        Sign out
      </button>
    </>
  )
}

export default AgentNav
