import { useState, useCallback, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAIWarning } from '../../context/AIWarningContext'
import { NotificationBell } from '../shared/NotificationBell'
import { searchEvidence, type SearchResult } from '../../helpers/org/Cases'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function OrgNav() {
  const { user, logout } = useAuth()
  const { openWarning } = useAIWarning()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setSearchResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchEvidence(q)
      setSearchResults(results)
      setSearching(false)
    }, 400)
  }, [])

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
          <div className='admin-brand-title'>Evaide</div>
          <div className='admin-brand-sub'>Organization console</div>
        </div>
        <NotificationBell />
      </div>

      <div style={{ padding: '0 12px 12px', position: 'relative' }}>
        <input
          className="edit-org-input"
          placeholder="Search evidence..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.82rem' }}
        />
        {(searching || searchResults.length > 0) && (
          <div style={{
            position: 'absolute', top: '100%', left: 12, right: 12,
            background: 'var(--admin-card-bg, #1a1a2e)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            {searching && <div style={{ padding: '10px 12px', opacity: 0.6, fontSize: '0.82rem' }}>Searching...</div>}
            {!searching && searchResults.length === 0 && (
              <div style={{ padding: '10px 12px', opacity: 0.6, fontSize: '0.82rem' }}>No results found.</div>
            )}
            {!searching && searchResults.map((r, i) => (
              <div
                key={i}
                onClick={() => { navigate(`/OrgCase/${r.case_id}`); setSearchQuery(''); setSearchResults([]) }}
                style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{r.raw_value}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{r.signal_type.replace(/_/g, ' ')} · {r.case_title}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className='admin-nav'>
        <div className='admin-nav-section'>
          <div className='admin-nav-label'>My Work</div>
          <NavLink className={navClassName} to='/OrgCaseProgress'>
            <span className='admin-nav-dot' />
            My Cases
          </NavLink>
          <NavLink className={navClassName} to='/OrgStartCase'>
            <span className='admin-nav-dot' />
            Start Case
          </NavLink>
        </div>
        <div className='admin-nav-section'>
          <div className='admin-nav-label'>Organization</div>
          <NavLink className={navClassName} to='/Org_Dashboard'>
            <span className='admin-nav-dot' />
            Overview
          </NavLink>
          <NavLink className={navClassName} to='/OrgAgents'>
            <span className='admin-nav-dot' />
            View Agents
          </NavLink>
          <NavLink className={navClassName} to='/OrgRegisterAgent'>
            <span className='admin-nav-dot' />
            Register Agent
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
