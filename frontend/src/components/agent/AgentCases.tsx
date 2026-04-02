import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  agentGetCases, agentCreateCase, getActorsForCase,
  type AgentCaseListItem, type Actor,
} from '../../helpers/agent/Cases'
import { useAuth } from '../../context/AuthContext'
import AgentLayout from './AgentLayout'
import '../../styles/Admin/AdminLayout.css'

type CaseStatus = 'Solved' | 'Open' | 'Discarded' | 'Closed'

type CaseRecord = {
  id: string
  caseNumber?: string
  title: string
  createdAt: string
  status: CaseStatus
  severity: string | number
  priority: string
  dueDate?: string
}

function normalizeStatus(status: string | undefined): CaseStatus {
  const s = status?.trim().toLowerCase()
  if (s === 'solved') return 'Solved'
  if (s === 'closed') return 'Closed'
  if (s === 'discarded') return 'Discarded'
  return 'Open'
}

const statusTone: Record<CaseStatus, string> = { Solved: 'good', Closed: 'good', Open: 'good', Discarded: 'critical' }
const severityLabel: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

function roleColor(role: string): string {
  if (role === 'Suspect') return 'critical'
  if (role === 'Person of Interest') return 'info'
  return 'neutral'
}

function formatDate(date: string | undefined | null) {
  if (!date) return '—'
  const d = new Date(date.slice(0, 10) + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function toCaseRecord(item: AgentCaseListItem): CaseRecord {
  return {
    id: String(item.case_id),
    caseNumber: item.CaseNumber,
    title: item.title,
    createdAt: item.created_at,
    status: normalizeStatus(item.status),
    severity: item.severity_level,
    priority: item.priority,
    dueDate: item.due_date || undefined,
  }
}

function AgentCases() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const agentId = Number((user as any)?.user_id ?? 0)
  const orgId = Number((user as any)?.org_id ?? 0)

  const [cases, setCases] = useState<CaseRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCaseTitle, setNewCaseTitle] = useState('')
  const [newCaseDescription, setNewCaseDescription] = useState('')
  const [newCasePriority, setNewCasePriority] = useState('Medium')
  const [newCaseSeverity, setNewCaseSeverity] = useState('2')
  const [newCaseDueDate, setNewCaseDueDate] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [actorsMap, setActorsMap] = useState<Record<string, Actor[]>>({})
  const [actorsLoading, setActorsLoading] = useState<Record<string, boolean>>({})
  const [expandedActors, setExpandedActors] = useState<Record<string, boolean>>({})

  const loadCases = async () => {
    if (!agentId || !orgId) { setError('Session data missing. Please log out and back in.'); return }
    setLoading(true); setError(null)
    try {
      const items = await agentGetCases(agentId, orgId)
      setCases(items.map(toCaseRecord))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

  const clearCreateForm = () => {
    setNewCaseTitle(''); setNewCaseDescription(''); setNewCasePriority('Medium'); setNewCaseSeverity('2'); setNewCaseDueDate('')
  }

  const handleCreateCase = async () => {
    if (!newCaseTitle.trim()) return
    setLoading(true); setError(null)
    try {
      await agentCreateCase(agentId, orgId, {
        title: newCaseTitle,
        description: newCaseDescription || undefined,
        priority: newCasePriority,
        severity_level: newCaseSeverity,
        due_date: newCaseDueDate || undefined,
      })
      setSuccess('Case created')
      clearCreateForm(); setShowCreateForm(false)
      void loadCases()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create case')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActors = async (caseId: string) => {
    const nowExpanded = !expandedActors[caseId]
    setExpandedActors((prev) => ({ ...prev, [caseId]: nowExpanded }))
    if (nowExpanded && actorsMap[caseId] === undefined) {
      setActorsLoading((prev) => ({ ...prev, [caseId]: true }))
      try {
        const actors = await getActorsForCase(caseId)
        setActorsMap((prev) => ({ ...prev, [caseId]: actors }))
      } catch {
        setActorsMap((prev) => ({ ...prev, [caseId]: [] }))
      } finally {
        setActorsLoading((prev) => ({ ...prev, [caseId]: false }))
      }
    }
  }

  const filteredCases = useMemo(
    () => cases.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.caseNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [cases, searchQuery]
  )

  useEffect(() => { void loadCases() }, [agentId, orgId])

  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

  return (
    <AgentLayout>
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Agent console</div>
          <h1 className="admin-title">My Cases</h1>
        </div>
      </header>

      {(error || success) && (
        <div className={`admin-banner ${error ? 'error' : 'success'}`}>{error ?? success}</div>
      )}

      <section className="admin-card">
        <div className="orgdash-card-head">
          <h2>Cases</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="admin-pill neutral">{cases.length} cases</span>
            <button type="button" className="admin-btn primary" onClick={() => setShowCreateForm((p) => !p)}>
              + New Case
            </button>
          </div>
        </div>

        <input
          className="edit-org-input"
          type="text"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '12px' }}
        />

        {showCreateForm && (
          <div className="admin-card" style={{ marginBottom: '16px' }}>
            <h3>New Case</h3>
            <div className="edit-org-controls">
              <label className="edit-org-control"><span>Title *</span><input className="edit-org-input" type="text" placeholder="Case title" value={newCaseTitle} onChange={(e) => setNewCaseTitle(e.target.value)} /></label>
              <label className="edit-org-control"><span>Description</span><textarea className="edit-org-input" rows={3} value={newCaseDescription} onChange={(e) => setNewCaseDescription(e.target.value)} /></label>
              <label className="edit-org-control"><span>Priority</span>
                <select className="edit-org-input" value={newCasePriority} onChange={(e) => setNewCasePriority(e.target.value)}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                </select>
              </label>
              <label className="edit-org-control"><span>Severity</span>
                <select className="edit-org-input" value={newCaseSeverity} onChange={(e) => setNewCaseSeverity(e.target.value)}>
                  <option value="1">Low</option><option value="2">Medium</option><option value="3">High</option><option value="4">Critical</option>
                </select>
              </label>
              <label className="edit-org-control"><span>Due Date</span><input className="edit-org-input" type="date" value={newCaseDueDate} onChange={(e) => setNewCaseDueDate(e.target.value)} /></label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="admin-btn primary" onClick={() => void handleCreateCase()} disabled={loading || !newCaseTitle.trim()}>Create</button>
              <button type="button" className="admin-btn" onClick={() => { clearCreateForm(); setShowCreateForm(false) }}>Cancel</button>
            </div>
          </div>
        )}

        {loading && <p style={{ opacity: 0.6 }}>Loading...</p>}
        {!loading && filteredCases.length === 0 && !showCreateForm && <p style={{ opacity: 0.7 }}>No cases assigned to you.</p>}

        <div className="orgdash-progress-list">
          {filteredCases.map((c) => (
            <div key={c.id} className="orgdash-progress-row">
              <div className="orgdash-progress-main" style={{ flex: 1 }}>
                <div className="orgdash-progress-title">
                  <strong>{c.title}</strong>
                  {c.caseNumber && <small>{c.caseNumber}</small>}
                </div>
                <div className="orgdash-progress-meta" style={{ marginTop: '4px' }}>
                  <span className={`admin-pill ${statusTone[c.status]}`}>{c.status}</span>
                  <span>Severity: {severityLabel[Number(c.severity)] ?? c.severity}</span>
                  <span>Priority: {c.priority}</span>
                  {c.dueDate && <span>Due: {formatDate(c.dueDate)}</span>}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                    onClick={() => void handleToggleActors(c.id)}
                  >
                    {expandedActors[c.id] ? 'Hide Actors' : 'Show Actors'}
                    {actorsMap[c.id] !== undefined && ` (${actorsMap[c.id].length})`}
                  </button>
                </div>

                {expandedActors[c.id] && (
                  <div style={{ marginTop: '8px' }}>
                    {actorsLoading[c.id] && <p style={{ opacity: 0.6, fontSize: '0.85rem', margin: 0 }}>Loading actors...</p>}
                    {!actorsLoading[c.id] && actorsMap[c.id]?.length === 0 && (
                      <p style={{ opacity: 0.6, fontSize: '0.85rem', margin: 0 }}>No actors linked to this case.</p>
                    )}
                    {!actorsLoading[c.id] && actorsMap[c.id]?.map((actor) => (
                      <div key={actor.id} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: '6px', padding: '8px 12px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{actor.primaryName}</strong>
                          <span className={`admin-pill ${roleColor(actor.role)}`}>{actor.role}</span>
                          <span className={`admin-pill ${actor.source === 'AI' ? 'info' : 'neutral'}`}>{actor.source}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', opacity: 0.75, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          <span>Aliases: {actor.aliases.length > 0 ? actor.aliases.join(', ') : '—'}</span>
                          {actor.confidenceScore !== null && <span>Confidence: {Math.round(actor.confidenceScore * 100)}%</span>}
                          <span>Added: {formatDate(actor.createdAt)}</span>
                          <span>{actor.evidenceCount} evidence · {actor.casesCount} cases</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="admin-btn primary"
                style={{ marginLeft: '12px', flexShrink: 0, alignSelf: 'flex-start' }}
                onClick={() => navigate(`/AgentCase/${c.id}`)}
              >
                Work on Case
              </button>
            </div>
          ))}
        </div>
      </section>
    </AgentLayout>
  )
}

export default AgentCases
