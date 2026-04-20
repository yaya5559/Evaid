// Abenezer Abraham

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  orgGetCases, orgCreateCase, getActorsForCase,
  type OrgCaseListItem, type Actor,
} from '../../helpers/org/Cases'
import { useAuth } from '../../context/AuthContext'
import OrgLayout from './OrgLayout'
import '../../styles/Admin/AdminLayout.css'

type CaseStatus = 'Solved' | 'Open' | 'Discarded' | 'Closed'

type CaseRecord = {
  id: string
  caseNumber?: string
  title: string
  description: string
  createdAt: string
  status: CaseStatus
  severity: string
  priority: string
  dueDate?: string
  evidenceCount: number
}

function normalizeStatus(status: string | undefined): CaseStatus {
    const s = status?.trim().toLowerCase()
    if (s === 'solved') return 'Solved'
    if (s === 'closed') return 'Closed'
    if (s === 'discarded') return 'Discarded'
    return 'Open'
}

const statusTone: Record<CaseStatus, string> = { Solved: 'good', Closed: 'good', Open: 'good', Discarded: 'critical' }

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

function toCaseRecord(item: OrgCaseListItem): CaseRecord {
  return {
    id: String(item.case_id),
    caseNumber: item.CaseNumber,
    title: item.title,
    description: item.description ?? '',
    createdAt: item.created_at,
    status: normalizeStatus(item.status),
    severity: item.severity_level,
    priority: item.priority,
    dueDate: item.due_date || undefined,
    evidenceCount: item.evidence_count ?? 0,
  }
}

function OrgCaseProgress() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const orgId = String((user as any)?.org_id ?? '')

  const [cases, setCases] = useState<CaseRecord[]>([])
  const [caseSearchQuery, setCaseSearchQuery] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCaseTitle, setNewCaseTitle] = useState('')
  const [newCaseDescription, setNewCaseDescription] = useState('')
  const [newCasePriority, setNewCasePriority] = useState('Medium')
  const [newCaseSeverity, setNewCaseSeverity] = useState('Medium')
  const [newCaseDueDate, setNewCaseDueDate] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [actorsMap, setActorsMap] = useState<Record<string, Actor[]>>({})
  const [actorsLoading, setActorsLoading] = useState<Record<string, boolean>>({})
  const [expandedActors, setExpandedActors] = useState<Record<string, boolean>>({})

  const loadCases = async () => {
    if (!orgId) { setError('Organization ID not found. Please log out and back in.'); return }
    setLoading(true); setError(null)
    try {
      const items = await orgGetCases(orgId)
      setCases(items.map(toCaseRecord))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

  const clearCreateForm = () => {
    setNewCaseTitle(''); setNewCaseDescription(''); setNewCasePriority('Medium'); setNewCaseSeverity('Medium'); setNewCaseDueDate('')
  }

  const handleCreateCase = async () => {
    if (!newCaseTitle.trim()) return
    setLoading(true); setError(null)
    const severityMap: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 }
    try {
      await orgCreateCase(orgId, Number((user as any)?.user_id ?? 0), {
        title: newCaseTitle,
        description: newCaseDescription,
        org_id: Number(orgId),
        created_by_user_id: Number((user as any)?.user_id ?? 0),
        status: 'Open',
        priority: newCasePriority,
        severity_level: String(severityMap[newCaseSeverity] ?? 2),
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
      c.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      (c.caseNumber ?? '').toLowerCase().includes(caseSearchQuery.toLowerCase())
    ),
    [cases, caseSearchQuery]
  )

  useEffect(() => { void loadCases() }, [orgId])

  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

  return (
    <OrgLayout>
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Organization console</div>
          <h1 className="admin-title">Case Progress</h1>
          <p className="admin-subtext">Manage and monitor your organization's cases.</p>
        </div>
      </header>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>}

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

        <div className="edit-org-controls">
          <label className="edit-org-control">
            <span>Search</span>
            <input className="edit-org-input" type="text" placeholder="Search cases..." value={caseSearchQuery} onChange={(e) => setCaseSearchQuery(e.target.value)} />
          </label>
        </div>

        {showCreateForm && (
          <div className="admin-card" style={{ marginBottom: '16px' }}>
            <h3>New Case</h3>
            <div className="edit-org-controls">
              <label className="edit-org-control"><span>Title</span><input className="edit-org-input" type="text" placeholder="Case title" value={newCaseTitle} onChange={(e) => setNewCaseTitle(e.target.value)} /></label>
              <label className="edit-org-control"><span>Description</span><input className="edit-org-input" type="text" placeholder="Case description" value={newCaseDescription} onChange={(e) => setNewCaseDescription(e.target.value)} /></label>
              <label className="edit-org-control"><span>Priority</span>
                <select className="edit-org-input" value={newCasePriority} onChange={(e) => setNewCasePriority(e.target.value)}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </label>
              <label className="edit-org-control"><span>Severity</span>
                <select className="edit-org-input" value={newCaseSeverity} onChange={(e) => setNewCaseSeverity(e.target.value)}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
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
        {!loading && cases.length === 0 && <p style={{ opacity: 0.7 }}>No cases available.</p>}

        <div className="orgdash-progress-list">
          {filteredCases.map((c) => (
            <div key={c.id} className="orgdash-progress-row">
              <div className="orgdash-progress-main" style={{ flex: 1 }}>
                <div className="orgdash-progress-title">
                  <strong>{c.title}</strong>
                  <small>{c.caseNumber ?? c.id}</small>
                </div>
                {c.description && <p style={{ margin: '4px 0', opacity: 0.8, fontSize: '0.9rem' }}>{c.description}</p>}
                <div className="orgdash-progress-meta" style={{ marginTop: '4px' }}>
                  <span className={`admin-pill ${statusTone[c.status]}`}>{c.status}</span>
                  <span>Severity: {c.severity},</span>
                  <span>Priority: {c.priority},</span>
                  <span>{c.evidenceCount} evidence.</span>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                    onClick={() => void handleToggleActors(c.id)}
                  >
                    {}
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
                onClick={() => navigate(`/OrgCase/${c.id}`)}
              >
                Work on Case
              </button>
            </div>
          ))}
        </div>
      </section>
    </OrgLayout>
  )
}

export default OrgCaseProgress
