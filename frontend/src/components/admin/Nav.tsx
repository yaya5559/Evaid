import { NavLink } from 'react-router-dom'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function Nav() {
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
          <NavLink className={navClassName} to='/Register_Agent'>
            <span className='admin-nav-dot' />
            Register Agent
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
    </>
  )
}

export default Nav
