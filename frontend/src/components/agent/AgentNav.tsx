import { useState, useCallback, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAIWarning } from '../../context/AIWarningContext'
import { NotificationBell } from '../shared/NotificationBell'
import { searchEvidence, type SearchResult } from '../../helpers/org/Cases'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-item${isActive ? ' active' : ''}`

function AgentNav() {
  const { user, logout } = useAuth()
  const { openWarning } = useAIWarning()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/Login', { replace: true })
  }

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

  const email = (user as any)?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <>
      <div className='admin-brand'>
        <div className='admin-brand-mark' />
        <div style={{ flex: 1 }}>
          <div className='admin-brand-title'>Evaide</div>
          <div className='admin-brand-sub'>Agent console</div>
        </div>
        <NotificationBell />
      </div>

      <div style={{ padding: '0 0 4px', position: 'relative' }}>
        <input
          className="edit-org-input"
          placeholder="Search evidence, actors, cases..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.82rem' }}
        />
        {(searching || searchResults.length > 0) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'var(--admin-card-bg, #1a1a2e)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', zIndex: 100, maxHeight: '360px', overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            {searching && <div style={{ padding: '10px 12px', opacity: 0.6, fontSize: '0.82rem' }}>Searching...</div>}
            {!searching && searchResults.length === 0 && (
              <div style={{ padding: '10px 12px', opacity: 0.6, fontSize: '0.82rem' }}>No results found.</div>
            )}
            {!searching && searchResults.length > 0 && (() => {
              const signals = searchResults.filter((r): r is Extract<SearchResult, { result_type: 'signal' }> => r.result_type === 'signal')
              const actors  = searchResults.filter((r): r is Extract<SearchResult, { result_type: 'actor' }> => r.result_type === 'actor')
              const cases   = searchResults.filter((r): r is Extract<SearchResult, { result_type: 'case' }> => r.result_type === 'case')
              const clear = () => { setSearchQuery(''); setSearchResults([]) }
              const label = (text: string) => (
                <div key={text} style={{ padding: '6px 12px 2px', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.45 }}>{text}</div>
              )
              const row = (key: string, top: string, bottom: string, onClick: () => void) => (
                <div key={key} onClick={onClick}
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{top}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{bottom}</div>
                </div>
              )
              return [
                ...(signals.length > 0 ? [label('Signals'), ...signals.map((r, i) =>
                  row(`s${i}`, r.raw_value, `${r.signal_type.replace(/_/g, ' ')} · ${r.case_title}`,
                    () => { navigate(`/AgentCase/${r.case_id}`); clear() })
                )] : []),
                ...(actors.length > 0 ? [label('Actors'), ...actors.map((r, i) =>
                  row(`a${i}`, r.actor_name, r.role,
                    () => { if (r.case_id) navigate(`/AgentCase/${r.case_id}`); clear() })
                )] : []),
                ...(cases.length > 0 ? [label('Cases'), ...cases.map((r, i) =>
                  row(`c${i}`, r.case_title, `Case #${r.case_number} · ${r.case_status}`,
                    () => { navigate(`/AgentCase/${r.case_id}`); clear() })
                )] : []),
              ]
            })()}
          </div>
        )}
      </div>

      <nav className='admin-nav'>
        <div className='admin-nav-section'>
          <div className='admin-nav-label'>Workspace</div>

          <NavLink className={navClassName} to='/AgentDashboard'>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </NavLink>

          <NavLink className={navClassName} to='/AgentCases'>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            My Cases
          </NavLink>

          <NavLink className={navClassName} to='/AgentOrgCases'>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Org Cases
          </NavLink>
        </div>
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className='admin-user-panel'>
          <div className='admin-user-avatar'>{initials || 'AG'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className='admin-user-name'>Agent</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className='admin-user-role' style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
              <button type='button' className='admin-user-logout-btn' onClick={() => navigate('/Profile')} title='Profile'>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
              <button type='button' className='admin-user-logout-btn' onClick={() => void onLogout()} title='Sign out'>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button type='button' className='admin-nav-policy-link' onClick={openWarning}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          AI Use Policy
        </button>

        <Link to='/terms' className='admin-nav-policy-link'>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Terms of Service
        </Link>
      </div>
    </>
  )
}

export default AgentNav
