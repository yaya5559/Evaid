import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { NotificationBell } from '../shared/NotificationBell'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function AdminNav() {
  const { logout } = useAuth()
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
          <div className='admin-brand-title'>Evaid</div>
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

      <button className='admin-btn admin-btn-ghost org-nav-logout' onClick={() => void onLogout()} type='button'>
      Sign out
      </button>
    </>
  )
}

export default AdminNav