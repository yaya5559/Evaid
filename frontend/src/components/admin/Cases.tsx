// Abenezer Abraham

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminGetOrgCases, createCase, getActorsForCase,
  type CaseListItem, type Actor,
} from '../../helpers/admin/Cases'
import { getOrganizations, type OrganizationListItem } from '../../helpers/admin/organizations'
import { useAuth } from '../../context/AuthContext'
import Nav from './Nav'
import '../../styles/Admin/AdminLayout.css'

type Organization = { id: string; name: string }

type CaseStatus = 'Solved' | 'Open' | 'Discarded'

type CaseRecord = {
  id: string
  caseNumber?: string
  orgId: string
  title: string
  description: string
  createdAt: string
  status: CaseStatus
  severity: string
  priority: string
  dueDate?: string
}

function normalizeStatus(status: string | undefined): CaseStatus {
  const s = status?.trim().toLowerCase()
  if (s === 'solved') return 'Solved'
  if (s === 'discarded') return 'Discarded'
  return 'Open'
}

const statusTone: Record<CaseStatus, string> = { Solved: 'good', Open: 'good', Discarded: 'critical' }

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

function toRecordOrganizations(item: OrganizationListItem): Organization {
  return { id: String(item.org_id), name: (item.companyName ?? item.name ?? '').trim() }
}

function toCaseRecord(item: CaseListItem): CaseRecord {
  return {
    id: String(item.case_id),
    caseNumber: item.CaseNumber,
    orgId: String(item.org_id),
    title: item.title,
    description: item.description ?? '',
    createdAt: item.created_at,
    status: normalizeStatus(item.status),
    severity: item.severity_level,
    priority: item.priority ?? '',
    dueDate: item.due_date || undefined,
  }
}

function AdminCases() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [orgSearchQuery, setOrgSearchQuery] = useState('')

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

  const loadOrganizations = async () => {
    setLoading(true); setError(null)
    try {
      const res = await getOrganizations()
      const mapped = res.map(toRecordOrganizations)
      if (mapped.length === 0) throw new Error('No organizations returned.')
      setOrganizations(mapped)
      setSelectedOrgId((cur) => (cur && mapped.some((o) => o.id === cur) ? cur : mapped[0].id))
    } catch {
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const loadCases = async (orgId: string) => {
    setLoading(true); setError(null)
    try {
      const res = await adminGetOrgCases(orgId)
      setCases(res.map(toCaseRecord))
    } catch {
      setError('Failed to load cases')
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
    try {
      await createCase(selectedOrgId, Number((user as any)?.user_id ?? 0), {
        case_number: `CASE-${Date.now()}`,
        title: newCaseTitle,
        description: newCaseDescription,
        org_id: Number(selectedOrgId),
        status: 'Open',
        priority: newCasePriority,
        severity_level: newCaseSeverity,
        due_date: newCaseDueDate || undefined,
      })
      setSuccess('Case created')
      clearCreateForm(); setShowCreateForm(false)
      void loadCases(selectedOrgId)
    } catch {
      setError('Failed to create case')
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

  const selectedOrg = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  )

  const selectedCases = useMemo(
    () => cases.filter((c) => c.orgId === selectedOrgId),
    [cases, selectedOrgId]
  )

  const filteredOrganizations = useMemo(
    () => organizations
      .filter((o) => o.name.toLowerCase().includes(orgSearchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [organizations, orgSearchQuery]
  )

  const filteredCases = useMemo(
    () => selectedCases.filter((c) =>
      c.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      (c.caseNumber ?? '').toLowerCase().includes(caseSearchQuery.toLowerCase())
    ),
    [selectedCases, caseSearchQuery]
  )

  useEffect(() => { void loadOrganizations() }, [])

  useEffect(() => {
    setShowCreateForm(false)
    if (!selectedOrg) { setCases([]); return }
    void loadCases(selectedOrg.id)
  }, [selectedOrg])

  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

  return (
    <div className="admin-shell">
      <aside className="admin-left"><Nav /></aside>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <div className="admin-eyebrow">Organization console</div>
            <h1 className="admin-title">Case Progress</h1>
            <p className="admin-subtext">Monitor case activity across connected organizations.</p>
          </div>
        </header>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
        {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Organizations list */}
          <aside className="admin-card">
            <div className="edit-org-panel-head">
              <h2>Organizations</h2>
              <span className="admin-pill info">{organizations.length} total</span>
            </div>
            <div className="edit-org-controls">
              <label className="edit-org-control">
                <span>Search</span>
                <input className="edit-org-input" type="text" placeholder="Search organizations..." value={orgSearchQuery} onChange={(e) => setOrgSearchQuery(e.target.value)} />
              </label>
            </div>
            <div className="edit-org-list">
              {filteredOrganizations.map((org) => (
                <button key={org.id} type="button"
                  className={`edit-org-item ${org.id === selectedOrgId ? 'active' : ''}`}
                  onClick={() => setSelectedOrgId(org.id)}>
                  <div className="edit-org-item-main"><strong>{org.name}</strong></div>
                </button>
              ))}
            </div>
          </aside>

          {/* Cases list */}
          <section className="admin-card">
            <div className="orgdash-card-head">
              <h2>{selectedOrg?.name ?? 'Select an organization'}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="admin-pill neutral">{selectedCases.length} cases</span>
                <button type="button" className="admin-btn primary"
                  onClick={() => setShowCreateForm((p) => !p)}
                  disabled={!selectedOrg}>
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
            {!loading && selectedCases.length === 0 && <p style={{ opacity: 0.7 }}>No cases available.</p>}

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
                      <span>Severity: {c.severity}</span>
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
                    onClick={() => navigate(`/Cases/${selectedOrgId}/${c.id}`)}
                  >
                    Work on Case
                  </button>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

export default AdminCases
