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
    const initials = email.slice(0, 2).toUpperCase()

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
                    <NavLink className={navClassName} to='/AgentOrgCases'>
                        <span className='admin-nav-dot' />
                        Org Cases
                    </NavLink>
                </div>
            </nav>

            <div className='admin-user-panel'>
                <div className='admin-user-avatar'>{initials || 'AG'}</div>
                <div>
                    <div className='admin-user-name'>Agent</div>
                    <div className='admin-user-role'>{email}</div>
                </div>
            </div>

            <button className='admin-btn admin-btn-ghost org-nav-logout' onClick={() => void onLogout()} type='button'>
                Sign out
            </button>
        </>
    )
}

export default AgentNav
