import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAIWarning } from '../../context/AIWarningContext'
import { NotificationBell } from '../shared/NotificationBell'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function OrgNav() {
  const { user, logout } = useAuth()
  const { openWarning } = useAIWarning()
  const navigate = useNavigate()

  const initials = (user?.company || user?.name || 'Org')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const onLogout = async () => {
    await logout()
    navigate('/Login', { replace: true })
  }

  return (
    <>
      <div className='admin-brand'>
        <div className='admin-brand-mark' />
        <div style={{ flex: 1 }}>
          <div className='admin-brand-title'>Evaid</div>
          <div className='admin-brand-sub'>Organization console</div>
        </div>
        <NotificationBell />
      </div>

      <nav className='admin-nav'>
        <div className='admin-nav-section'>
          <div className='admin-nav-label'>Workspace</div>
          <NavLink className={navClassName} to='/Org_Dashboard'>
            <span className='admin-nav-dot' />
            Overview
          </NavLink>
          <NavLink className={navClassName} to='/OrgCaseProgress'>
            <span className='admin-nav-dot' />
            View Cases
          </NavLink>
          <NavLink className={navClassName} to='/OrgAgents'>
            <span className='admin-nav-dot' />
            View Agents
          </NavLink>
          <NavLink className={navClassName} to='/OrgRegisterAgent'>
            <span className='admin-nav-dot' />
            Register Agent
          </NavLink>
          <NavLink className={navClassName} to='/OrgStartCase'>
            <span className='admin-nav-dot' />
            Start Case
          </NavLink>
        </div>
      </nav>

      <div className='admin-user-panel'>
        <div className='admin-user-avatar'>{initials || 'OR'}</div>
        <div>
          <div className='admin-user-name'>{user?.company || 'Organization Team'}</div>
          <div className='admin-user-role'>{user?.email || 'organization@evaide.local'}</div>
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

export default OrgNav
