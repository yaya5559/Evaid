import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function OrgNav() {
  const { user, logout } = useAuth()
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
        <div>
          <div className='admin-brand-title'>Evaid</div>
          <div className='admin-brand-sub'>Organization console</div>
        </div>
      </div>

      <nav className='admin-nav'>
        <div className='admin-nav-section'>
          <div className='admin-nav-label'>Workspace</div>
          <NavLink className={navClassName} to='/Org_Dashboard'>
            <span className='admin-nav-dot' />
            Overview
          </NavLink>
          <NavLink className={navClassName} to='/Evidence_Upload'>
            <span className='admin-nav-dot' />
            Upload Evidence
          </NavLink>
          <NavLink className={navClassName} to='/OrgCaseProgress'>
            <span className='admin-nav-dot' />
            Case Progress
          </NavLink>
          <a className='admin-nav-item' href='#org-workload'>
            <span className='admin-nav-dot' />
            Workload
          </a>
          <a className='admin-nav-item' href='#org-case-register'>
            <span className='admin-nav-dot' />
            Case Register
          </a>
        </div>
      </nav>

      <div className='admin-user-panel'>
        <div className='admin-user-avatar'>{initials || 'OR'}</div>
        <div>
          <div className='admin-user-name'>{user?.company || 'Organization Team'}</div>
          <div className='admin-user-role'>{user?.email || 'organization@evaide.local'}</div>
        </div>
      </div>

      <button className='admin-btn admin-btn-ghost org-nav-logout' onClick={() => void onLogout()} type='button'>
        Sign out
      </button>
    </>
  )
}

export default OrgNav
