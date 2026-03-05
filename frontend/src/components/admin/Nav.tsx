import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function Nav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const initials = (user?.name || user?.email || 'Security Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const onLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/Login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <div className='admin-brand'>
        <div className='admin-brand-mark' />
        <div>
          <div className='admin-brand-title'>Evaid</div>
          <div className='admin-brand-sub'>Admin console</div>
        </div>
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
          <NavLink className={navClassName} to='/Edit_Organization'>
            <span className='admin-nav-dot' />
            Edit Organization
          </NavLink>
        </div>
      </nav>

      <div className='admin-user-panel'>
        <div className='admin-user-avatar'>{initials || 'SA'}</div>
        <div className='admin-user-meta'>
          <div className='admin-user-name'>{user?.name || 'Security Admin'}</div>
          <div className='admin-user-role'>{user?.email || 'admin@evaide.local'}</div>
        </div>
        <button
          className='admin-btn admin-btn-ghost admin-logout-btn'
          disabled={loggingOut}
          onClick={() => void onLogout()}
          type='button'
        >
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </>
  )
}

export default Nav
