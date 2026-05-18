import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAIWarning } from '../../context/AIWarningContext'
import { NotificationBell } from '../shared/NotificationBell'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function AdminNav() {
  const { logout } = useAuth()
  const { openWarning } = useAIWarning()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/Login', { replace: true })
  }

  return (
    <>
      <div className='admin-brand'>
        <div className='admin-brand-mark' />
        <div style={{ flex: 1 }}>
          <div className='admin-brand-title'>Evaide</div>
          <div className='admin-brand-sub'>Admin console</div>
        </div>
        <NotificationBell />
      </div>

      <nav className='admin-nav'>
        <div className='admin-nav-section'>
          <div className='admin-nav-label'>Command</div>
          <NavLink className={navClassName} to='/Dashboard'>
            <span className='admin-nav-dot' />
            Dashboard
          </NavLink>
          <NavLink className={navClassName} to='/Add_Organization'>
            <span className='admin-nav-dot' />
            Add Organization
          </NavLink>
          <NavLink className={navClassName} to='/Register_Agent'>
            <span className='admin-nav-dot' />
            Add Agent
          </NavLink>
          <NavLink className={navClassName} to='/Edit_Organization'>
            <span className='admin-nav-dot' />
            Edit Organization
          </NavLink>
          <NavLink className={navClassName} to='/Cases'>
            <span className='admin-nav-dot' />
            View Organization Cases
          </NavLink>
        </div>
      </nav>

      <div className='admin-user-panel'>
        <div className='admin-user-avatar'>SA</div>
        <div>
          <div className='admin-user-name'>Security Admin</div>
          <div className='admin-user-role'>Organization control</div>
        </div>
      </div>

      <button
        type='button'
        onClick={openWarning}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '7px',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#f59e0b',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '8px',
          letterSpacing: '0.01em',
        }}
      >
        <span style={{ fontSize: '14px' }}>⚠️</span>
        AI Use Policy
      </button>
      <button className='admin-btn admin-btn-ghost org-nav-logout' onClick={() => void onLogout()} type='button'>
      Sign out
      </button>
    </>
  )
}

export default AdminNav