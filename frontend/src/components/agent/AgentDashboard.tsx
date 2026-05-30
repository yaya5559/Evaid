import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSignals } from '../../context/SignalContext'
import AgentLayout from './AgentLayout'
import {
  getDashboardSummary, getAgentStats, getAgentActivity, getAgentAssignments,
  type DashboardSummary, type AgentStats, type ActivityItem, type AssignmentItem,
} from '../../helpers/agent/Dashboard'
import {
  agentGetCases,
  type AgentCaseListItem,
} from '../../helpers/agent/Cases'
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/AgentDashboard.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

type CaseStatus = 'Solved' | 'Open' | 'Discarded' | 'Closed'

const PRIORITY_SCORE: Record<string, number> = {
  Critical: 4, High: 3, Medium: 2, Low: 1,
}
const SEVERITY_LABEL: Record<number, string> = { 1: 'Low', 2: 'Med', 3: 'High', 4: 'Critical' }

function normalizeStatus(s: string | undefined): CaseStatus {
  const v = s?.trim().toLowerCase()
  if (v === 'solved') return 'Solved'
  if (v === 'closed') return 'Closed'
  if (v === 'discarded') return 'Discarded'
  return 'Open'
}

function isOpen(c: AgentCaseListItem) {
  const s = normalizeStatus(c.status)
  return s === 'Open'
}

function isResolved(c: AgentCaseListItem) {
  const s = normalizeStatus(c.status)
  return s === 'Solved' || s === 'Closed'
}

function daysOpen(c: AgentCaseListItem): number {
  if (!c.created_at) return 0
  return Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86_400_000)
}

function daysUntilDue(c: AgentCaseListItem): number | null {
  if (!c.due_date) return null
  const due = new Date(c.due_date.slice(0, 10) + 'T00:00:00')
  return Math.ceil((due.getTime() - Date.now()) / 86_400_000)
}

function urgencyScore(c: AgentCaseListItem): number {
  let score = (PRIORITY_SCORE[c.priority] ?? 2) + (Number(c.severity_level) ?? 2)
  const dtd = daysUntilDue(c)
  if (dtd !== null) {
    if (dtd < 0) score += 10
    else if (dtd <= 7) score += 5
    else if (dtd <= 14) score += 2
  }
  return score
}

function formatDate(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s.slice(0, 10) + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function relativeTime(s: string | null | undefined): string {
  if (!s) return '—'
  const diff = Date.now() - new Date(s).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function thisMonthResolved(cases: AgentCaseListItem[]): number {
  const cutoff = new Date()
  cutoff.setDate(1); cutoff.setHours(0, 0, 0, 0)
  return cases.filter(c => isResolved(c) && c.created_at && new Date(c.created_at) >= cutoff).length
}

// Group AI-linked cases by the source case they branch from
function buildAIClusters(cases: AgentCaseListItem[]) {
  const map = new Map<string, { sourceTitle: string; cases: AgentCaseListItem[] }>()
  for (const c of cases) {
    if (!c.ai_linked || !c.linked_from_case_id) continue
    const key = String(c.linked_from_case_id)
    if (!map.has(key)) {
      map.set(key, { sourceTitle: c.linked_from_title ?? `Case #${key}`, cases: [] })
    }
    map.get(key)!.cases.push(c)
  }
  return Array.from(map.entries()).map(([sourceId, v]) => ({ sourceId, ...v }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, tone = 'neutral',
}: { label: string; value: number | string; tone?: 'good' | 'warn' | 'danger' | 'neutral' }) {
  return (
    <div className="agentdash-kpi">
      <span className="agentdash-kpi__label">{label}</span>
      <span className={`agentdash-kpi__value agentdash-kpi__value--${tone}`}>{value}</span>
    </div>
  )
}

function PipelineBar({
  label, count, total, variant,
}: { label: string; count: number; total: number; variant: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="agentdash-pipeline-row">
      <span className="agentdash-pipeline-label">{label}</span>
      <div className="agentdash-pipeline-track">
        <div
          className={`agentdash-pipeline-fill agentdash-pipeline-fill--${variant}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="agentdash-pipeline-count">{count}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function AgentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { signals, fetchSignalsForCase } = useSignals()

  const agentId = Number((user as any)?.user_id ?? 0)
  const orgId   = Number((user as any)?.org_id   ?? 0)

  const [cases,       setCases]       = useState<AgentCaseListItem[]>([])
  const [summary,     setSummary]     = useState<DashboardSummary | null>(null)
  const [stats,       setStats]       = useState<AgentStats | null>(null)
  const [activity,    setActivity]    = useState<ActivityItem[]>([])
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!agentId || !orgId) return
    setLoading(true)
    Promise.allSettled([
      agentGetCases(agentId, orgId).then(setCases),
      getDashboardSummary().then(setSummary),
      getAgentStats().then(setStats),
      getAgentActivity().then(setActivity),
      getAgentAssignments().then(setAssignments),
    ]).then((results) => {
      const failed = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
      if (failed) setError(failed.reason?.message ?? 'Some data failed to load')
    }).finally(() => setLoading(false))
  }, [agentId, orgId])

  // Fetch signals for all case IDs once cases are loaded
  useEffect(() => {
    cases.forEach(c => void fetchSignalsForCase(String(c.case_id)))
  }, [cases])

  // ── Derived values ────────────────────────────────────────────

  const openCases = useMemo(() => cases.filter(isOpen), [cases])

  const overdueCases = useMemo(
    () => openCases.filter(c => { const d = daysUntilDue(c); return d !== null && d < 0 }),
    [openCases],
  )

  const dueSoonCases = useMemo(
    () => openCases.filter(c => { const d = daysUntilDue(c); return d !== null && d >= 0 && d <= 7 }),
    [openCases],
  )

  const noDueDateCases = useMemo(
    () => openCases.filter(c => !c.due_date),
    [openCases],
  )

  const agingCases = useMemo(
    () => openCases.filter(c => daysOpen(c) >= 30),
    [openCases],
  )

  const solvedThisMonth = useMemo(() => thisMonthResolved(cases), [cases])

  const priorityQueue = useMemo(
    () => [...openCases].sort((a, b) => urgencyScore(b) - urgencyScore(a)).slice(0, 6),
    [openCases],
  )

  const aiClusters = useMemo(() => buildAIClusters(cases), [cases])

  const pendingSignals = useMemo(
    () => signals.filter(s => s.status === 'pending'),
    [signals],
  )

  // Combine empty + aging for case health section
  const emptyCases = useMemo(() => {
    if (!summary) return []
    const emptyIds = new Set(
      summary.case_summaries
        .filter(cs => cs.note_count === 0 && cs.evidence_count === 0)
        .map(cs => cs.case_id),
    )
    return openCases.filter(c => emptyIds.has(c.case_id))
  }, [summary, openCases])

  const totalEvidence = summary?.totals.total_evidence ?? 0

  // ── Render ────────────────────────────────────────────────────

  return (
    <AgentLayout>
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Agent console</div>
          <h1 className="admin-title">Dashboard</h1>
        </div>
      </header>

      {error && (
        <div className="admin-banner error" style={{ marginBottom: '14px' }}>{error}</div>
      )}

      {loading && (
        <p style={{ opacity: 0.6, padding: '8px 0' }}>Loading dashboard…</p>
      )}

      {/* ── KPI strip ── */}
      <div className="agentdash-kpi-strip">
        <KpiCard label="Open cases"      value={openCases.length}  tone="neutral" />
        <KpiCard label="Overdue"         value={overdueCases.length}  tone={overdueCases.length > 0 ? 'danger' : 'neutral'} />
        <KpiCard label="Due this week"   value={dueSoonCases.length}  tone={dueSoonCases.length > 0 ? 'warn' : 'neutral'} />
        <KpiCard label="Solved / closed (30d)" value={solvedThisMonth} tone={solvedThisMonth > 0 ? 'good' : 'neutral'} />
        <KpiCard label="No due date"     value={noDueDateCases.length} tone={noDueDateCases.length > 0 ? 'warn' : 'neutral'} />
        <KpiCard label="Aging (30+ days)" value={agingCases.length} tone={agingCases.length > 0 ? 'warn' : 'neutral'} />
      </div>

      {/* ── Priority queue + Stats ── */}
      <div className="agentdash-grid">
        <div className="admin-card">
          <div className="agentdash-card-head">
            <h2>Priority Queue</h2>
            <span className="admin-pill neutral">{openCases.length} open</span>
          </div>
          {priorityQueue.length === 0 && (
            <p className="agentdash-empty">No open cases.</p>
          )}
          <div className="agentdash-queue">
            {priorityQueue.map(c => {
              const dtd = daysUntilDue(c)
              const overdue = dtd !== null && dtd < 0
              return (
                <div
                  key={c.case_id}
                  className="agentdash-queue-row"
                  onClick={() => navigate(`/AgentCase/${c.case_id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/AgentCase/${c.case_id}`)}
                >
                  <div className="agentdash-queue-score">{urgencyScore(c)}</div>
                  <div className="agentdash-queue-info">
                    <div className="agentdash-queue-title">{c.title}</div>
                    <div className="agentdash-queue-meta">
                      <span className={`admin-pill ${c.priority === 'Critical' ? 'critical' : c.priority === 'High' ? 'warn' : 'neutral'}`}>
                        {c.priority}
                      </span>
                      <span>Sev {SEVERITY_LABEL[Number(c.severity_level)] ?? c.severity_level}</span>
                      {dtd !== null && (
                        <span style={{ color: overdue ? '#ef4444' : dtd <= 7 ? '#f59e0b' : 'inherit' }}>
                          {overdue ? `${Math.abs(dtd)}d overdue` : `Due in ${dtd}d`}
                        </span>
                      )}
                      {!c.due_date && <span style={{ opacity: 0.6 }}>No due date</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="admin-card">
          <div className="agentdash-card-head">
            <h2>My Output</h2>
            <span className="admin-pill info">Last 30 days</span>
          </div>
          {!stats ? (
            <p className="agentdash-empty">Loading…</p>
          ) : (
            <div className="agentdash-stats-grid">
              <div className="agentdash-stat">
                <span className="agentdash-stat__label">Notes written</span>
                <div className="agentdash-stat__pair">
                  <span className="agentdash-stat__week">{stats.notes_week}</span>
                  <span className="agentdash-stat__month">{stats.notes_month} this month</span>
                </div>
              </div>
              <div className="agentdash-stat">
                <span className="agentdash-stat__label">Evidence uploaded</span>
                <div className="agentdash-stat__pair">
                  <span className="agentdash-stat__week">{stats.evidence_week}</span>
                  <span className="agentdash-stat__month">{stats.evidence_month} this month</span>
                </div>
              </div>
              <div className="agentdash-stat">
                <span className="agentdash-stat__label">Cases closed</span>
                <div className="agentdash-stat__pair">
                  <span className="agentdash-stat__week">{stats.cases_closed_month}</span>
                  <span className="agentdash-stat__month">this month</span>
                </div>
              </div>
              <div className="agentdash-stat">
                <span className="agentdash-stat__label">Cases opened</span>
                <div className="agentdash-stat__pair">
                  <span className="agentdash-stat__week">{stats.cases_opened_month}</span>
                  <span className="agentdash-stat__month">this month</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── AI-linked clusters + Pending signals ── */}
      <div className="agentdash-grid--equal agentdash-grid" style={{ marginBottom: '14px' }}>
        <div className="admin-card">
          <div className="agentdash-card-head">
            <h2>AI-Linked Case Clusters</h2>
            <span className="admin-pill info">{cases.filter(c => c.ai_linked).length} linked</span>
          </div>
          {aiClusters.length === 0 ? (
            <p className="agentdash-empty">No AI-linked cases detected yet.</p>
          ) : (
            aiClusters.map(cluster => (
              <div key={cluster.sourceId} className="agentdash-cluster">
                <div className="agentdash-cluster-head">
                  Linked from: {cluster.sourceTitle}
                </div>
                <div className="agentdash-cluster-cases">
                  {cluster.cases.map(c => (
                    <div key={c.case_id} className="agentdash-cluster-case">
                      <span className="admin-pill info" style={{ fontSize: '10px' }}>AI</span>
                      <Link to={`/AgentCase/${c.case_id}`}>{c.title}</Link>
                      <span style={{ opacity: 0.6 }}>· {c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="admin-card">
          <div className="agentdash-card-head">
            <h2>Pending Signals</h2>
            <span className={`admin-pill ${pendingSignals.length > 0 ? 'warn' : 'neutral'}`}>
              {pendingSignals.length} pending
            </span>
          </div>
          {pendingSignals.length === 0 ? (
            <p className="agentdash-empty">No signals awaiting review.</p>
          ) : (
            <div className="agentdash-signal-list">
              {pendingSignals.slice(0, 6).map(s => (
                <div key={s.id} className="agentdash-signal-row">
                  <span className="agentdash-signal-type">{s.signal_type}</span>
                  <span className="agentdash-signal-value">{s.raw_value}</span>
                  <span className="agentdash-signal-meta">
                    {s.case_title && <span style={{ opacity: 0.7 }}>{s.case_title} · </span>}
                    Confidence {Math.round(s.confidence * 100)}%
                    {s.triage_reason ? ` · ${s.triage_reason}` : ''}
                  </span>
                </div>
              ))}
              {pendingSignals.length > 6 && (
                <p style={{ fontSize: '12px', color: 'var(--admin-muted-2)', margin: 0 }}>
                  +{pendingSignals.length - 6} more — open a case to review all signals
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Evidence pipeline + Case health ── */}
      <div className="agentdash-grid--equal agentdash-grid" style={{ marginBottom: '14px' }}>
        <div className="admin-card">
          <div className="agentdash-card-head">
            <h2>Evidence Pipeline</h2>
            <span className="admin-pill neutral">{totalEvidence} files</span>
          </div>
          {!summary ? (
            <p className="agentdash-empty">Loading…</p>
          ) : totalEvidence === 0 ? (
            <p className="agentdash-empty">No evidence uploaded yet.</p>
          ) : (
            <div className="agentdash-pipeline">
              <PipelineBar label="Pending"    count={summary.totals.ev_pending}    total={totalEvidence} variant="pending" />
              <PipelineBar label="Processing" count={summary.totals.ev_processing} total={totalEvidence} variant="processing" />
              <PipelineBar label="Processed"  count={summary.totals.ev_processed}  total={totalEvidence} variant="processed" />
              <PipelineBar label="Confirmed"  count={summary.totals.ev_confirmed}  total={totalEvidence} variant="confirmed" />
            </div>
          )}
        </div>

        <div className="admin-card">
          <div className="agentdash-card-head">
            <h2>Cases Needing Attention</h2>
          </div>
          {emptyCases.length === 0 && agingCases.length === 0 ? (
            <p className="agentdash-empty">All cases have notes or evidence.</p>
          ) : (
            <div className="agentdash-health-list">
              {emptyCases.slice(0, 4).map(c => (
                <Link key={`e-${c.case_id}`} to={`/AgentCase/${c.case_id}`} className="agentdash-health-row">
                  <div>
                    <div className="agentdash-health-title">{c.title}</div>
                    <div className="agentdash-health-sub">No notes · No evidence</div>
                  </div>
                  <span className="admin-pill warn">Empty</span>
                </Link>
              ))}
              {agingCases
                .filter(c => !emptyCases.find(e => e.case_id === c.case_id))
                .slice(0, 3)
                .map(c => (
                  <Link key={`a-${c.case_id}`} to={`/AgentCase/${c.case_id}`} className="agentdash-health-row">
                    <div>
                      <div className="agentdash-health-title">{c.title}</div>
                      <div className="agentdash-health-sub">{daysOpen(c)} days open</div>
                    </div>
                    <span className="admin-pill warn">Aging</span>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity timeline + Assignments ── */}
      <div className="agentdash-grid">
        <div className="admin-card">
          <div className="agentdash-card-head">
            <h2>Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="agentdash-empty">No recent activity.</p>
          ) : (
            <div className="agentdash-activity">
              {activity.slice(0, 15).map((item, i) => (
                <div key={`${item.activity_type}-${item.record_id}-${i}`} className="agentdash-activity-item">
                  <div className={`agentdash-activity-dot${item.activity_type !== 'note' ? ' agentdash-activity-dot--audit' : ''}`} />
                  <div className="agentdash-activity-body">
                    <div className="agentdash-activity-text">
                      {item.activity_type === 'note' ? (
                        <>
                          <strong>{item.actor_name}</strong> noted on{' '}
                          <Link to={`/AgentCase/${item.case_id}`} style={{ color: 'var(--admin-accent)', textDecoration: 'none' }}>
                            {item.case_title}
                          </Link>
                          {item.summary ? `: "${item.summary}"` : ''}
                        </>
                      ) : (
                        <>
                          <strong>{item.actor_name ?? 'System'}</strong>{' '}
                          {item.activity_type} on{' '}
                          <Link to={`/AgentCase/${item.case_id}`} style={{ color: 'var(--admin-accent)', textDecoration: 'none' }}>
                            {item.case_title}
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="agentdash-activity-meta">{item.CaseNumber}</div>
                  </div>
                  <span className="agentdash-activity-time">{relativeTime(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card">
          <div className="agentdash-card-head">
            <h2>Recent Assignments</h2>
          </div>
          {assignments.length === 0 ? (
            <p className="agentdash-empty">No recent assignments.</p>
          ) : (
            <div className="agentdash-assignment-list">
              {assignments.map(a => (
                <div key={a.assignment_id} className="agentdash-assignment-row">
                  <div className="agentdash-assignment-info">
                    <div className="agentdash-assignment-title">
                      <Link to={`/AgentCase/${a.case_id}`} style={{ color: 'var(--admin-text)', textDecoration: 'none' }}>
                        {a.case_title}
                      </Link>
                    </div>
                    <div className="agentdash-assignment-meta">
                      {a.CaseNumber} · Assigned by {a.assigned_by_name} · {formatDate(a.assigned_at)}
                    </div>
                  </div>
                  <span className={`admin-pill ${a.case_status === 'Discarded' ? 'critical' : 'good'}`}>
                    {a.case_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  )
}

export default AgentDashboard
