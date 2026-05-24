import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { agentGetOrgCases, type AgentCaseListItem } from '../../helpers/agent/Cases'
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

function AgentOrgCases() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const orgId = Number((user as any)?.org_id ?? 0)

  const [cases, setCases] = useState<CaseRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOrgCases = async () => {
    if (!orgId) { setError('Organization ID missing. Please log out and back in.'); return }
    setLoading(true); setError(null)
    try {
      const items = await agentGetOrgCases(orgId)
      setCases(items.map(toCaseRecord))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load org cases')
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = useMemo(
    () => cases.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.caseNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [cases, searchQuery]
  )

  useEffect(() => { void loadOrgCases() }, [orgId])

  return (
    <AgentLayout>
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Agent console</div>
          <h1 className="admin-title">Org Cases</h1>
          <p style={{ opacity: 0.65, fontSize: '0.9rem', marginTop: '4px' }}>
            Read-only view of all cases in your organization.
          </p>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <section className="admin-card">
        <div className="orgdash-card-head">
          <h2>All Cases</h2>
          <span className="admin-pill neutral">{cases.length} cases</span>
        </div>

        <input
          className="edit-org-input"
          type="text"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '12px' }}
        />

        {loading && <p style={{ opacity: 0.6 }}>Loading...</p>}
        {!loading && filteredCases.length === 0 && (
          <p style={{ opacity: 0.7 }}>No cases found in your organization.</p>
        )}

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
                  <span style={{ opacity: 0.6 }}>Opened: {formatDate(c.createdAt)}</span>
                </div>
              </div>
              <button
                type="button"
                className="admin-btn"
                style={{ marginLeft: '12px', flexShrink: 0, alignSelf: 'flex-start' }}
                onClick={() => navigate(`/AgentCase/${c.id}`)}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </section>
    </AgentLayout>
  )
}

export default AgentOrgCases