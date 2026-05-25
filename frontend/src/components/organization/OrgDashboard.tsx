import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import OrgNav from './OrgNav'
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/OrgDashboard.css'

type CaseStatus = 'Solved' | 'Open' | 'Closed' | 'Discarded'

type CaseRecord = {
  id: string
  caseNumber: string
  title: string
  status: CaseStatus
  priority: string
  severity: string
  openedOn: string
  dueDate?: string
}

const statusTone: Record<CaseStatus, string> = {
  Solved: 'good',
  Open: 'good',
  Closed: 'good',
  Discarded: 'critical',
}

function formatDate(value: string | undefined | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function normalizeStatus(s: string | undefined): CaseStatus {
  const v = s?.trim().toLowerCase()
  if (v === 'solved') return 'Solved'
  if (v === 'closed') return 'Closed'
  if (v === 'discarded') return 'Discarded'
  return 'Open'
}

function OrgDashboard() {
  const { user, api } = useAuth()
  const [orgSummary, setOrgSummary] = useState<any>(null)
  const [caseRecords, setCaseRecords] = useState<CaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setError(null)
      try {
        const [summaryRes, casesRes] = await Promise.allSettled([
          api.get('/org/dashboard/summary'),
          api.get('/org/cases/'),
        ])

        if (summaryRes.status === 'fulfilled') {
          const summaryData = summaryRes.value.data
          if (summaryData?.message === 'Error') {
            setError(`Summary error: ${summaryData.error ?? 'Unknown error'}`)
          } else if (summaryData?.message === 'Success') {
            setOrgSummary(summaryData.organization ?? null)
          } else {
            setOrgSummary(summaryData?.organization ?? null)
          }
        } else {
          const errDetail = (summaryRes as PromiseRejectedResult).reason?.response?.data?.detail
          setError(`Failed to load summary: ${Array.isArray(errDetail) ? errDetail.map((d: any) => d?.msg).join(', ') : errDetail ?? (summaryRes as PromiseRejectedResult).reason?.message ?? 'Unknown error'}`)
        }

        if (casesRes.status === 'fulfilled') {
          const cases = casesRes.value.data.cases ?? []
          setCaseRecords(
            cases.map((c: any) => ({
              id: String(c.case_id ?? c.id ?? ''),
              caseNumber: c.CaseNumber ?? '—',
              title: c.title ?? 'Untitled',
              status: normalizeStatus(c.status),
              priority: c.priority ?? '—',
              severity: c.severity_level ?? '—',
              openedOn: c.created_at ?? '',
              dueDate: c.due_date ?? null,
            }))
          )
        }
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    void fetchDashboardData()
  }, [api, user])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, casesRes] = await Promise.allSettled([
          api.get('/org/dashboard/summary'),
          api.get('/org/cases')
        ])

        if (summaryRes.status === 'fulfilled') {
          setOrgSummary(summaryRes.value.data.organization)
        }

        if (casesRes.status === 'fulfilled') {
          const cases = casesRes.value.data.cases || []
          const mappedCases = cases.map((c: any) => ({
            id: c.id || c.CaseNumber,
            title: c.title,
            assignedAgent: c.assignedAgent || 'Unassigned',
            evidenceCount: c.evidenceCount || 0,
            status: c.status === 'Closed' ? 'Solved' : c.status === 'Open' ? 'Pending' : 'Discarded',
            progress: c.progress || 0,
            openedOn: c.openedOn || c.created_at,
            lastUpdate: c.lastUpdate || c.created_at
          }))
          setCaseRecords(mappedCases)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.org_id) {
      fetchDashboardData()
    }
  }, [api, user?.org_id])

  const accountAge = useMemo(() => {
    if (!orgSummary?.created_at) return null
    const created = new Date(orgSummary.created_at)
    if (isNaN(created.getTime())) return null
    const today = new Date()
    const diffMs = Math.max(0, today.getTime() - created.getTime())
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    return { created, diffDays, diffMonths }
  }, [orgSummary?.created_at])

  const metrics = useMemo(() => {
    return caseRecords.reduce(
      (acc, c) => {
        if (c.status === 'Solved' || c.status === 'Closed') acc.solved += 1
        else if (c.status === 'Discarded') acc.discarded += 1
        else acc.open += 1
        return acc
      },
      { open: 0, solved: 0, discarded: 0 }
    )
  }, [caseRecords])

  if (loading) return (
    <div className='admin-shell'>
      <aside className='admin-left'><OrgNav /></aside>
      <main className='admin-main'>
        <p style={{ opacity: 0.6, padding: '32px' }}>Loading dashboard...</p>
      </main>
    </div>
  )

  return (
    <div className='admin-shell'>
      <aside className='admin-left'>
        <OrgNav />
      </aside>

      <main className='admin-main'>
        <header className='admin-header'>
          <div>
            <div className='admin-eyebrow'>Organization workspace</div>
            <h1 className='admin-title'>Overview</h1>
          </div>
        </header>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Org info + KPIs */}
        <section className='orgdash-summary-grid'>
          <article className='admin-card orgdash-org-card'>
            <div className='orgdash-card-head'>
              <h2>{orgSummary?.name ?? user?.company ?? '—'}</h2>
              <span className='admin-pill info'>Organization</span>
            </div>
            <div className='orgdash-org-email'>{orgSummary?.email ?? user?.email ?? '—'}</div>
            {accountAge && (
              <div className='orgdash-org-meta'>
                <div>
                  <span>Account created</span>
                  <strong>{accountAge.created.toLocaleDateString()}</strong>
                </div>
                <div>
                  <span>Active for</span>
                  <strong>{accountAge.diffMonths} months ({accountAge.diffDays} days)</strong>
                </div>
              </div>
            )}
          </article>

          <article className='admin-card orgdash-kpi-panel'>
            <div className='orgdash-kpi-grid'>
              <div className='orgdash-kpi'>
                <span>Employees</span>
                <strong>{orgSummary?.total_employees ?? '—'}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Agents</span>
                <strong>{orgSummary?.total_agents ?? '—'}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Open Cases</span>
                <strong>{metrics.open}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Solved Cases</span>
                <strong>{metrics.solved}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Discarded</span>
                <strong>{metrics.discarded}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Total Cases</span>
                <strong>{caseRecords.length}</strong>
              </div>
            </div>
          </article>
        </section>

        {/* Case register */}
        <section className='admin-card orgdash-table-card'>
          <div className='orgdash-card-head'>
            <h2>Case Register</h2>
            <span className='admin-pill neutral'>{caseRecords.length} cases</span>
          </div>

          {caseRecords.length === 0 ? (
            <p style={{ opacity: 0.7 }}>No cases found.</p>
          ) : (
            <div className='orgdash-table-wrap'>
              <table className='orgdash-table'>
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Severity</th>
                    <th>Opened</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {caseRecords.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/OrgCase/${c.id}`} className='orgdash-case-link'>
                          <div className='orgdash-case-cell'>
                            <strong>{c.title}</strong>
                            <small>{c.caseNumber}</small>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <span className={`admin-pill ${statusTone[c.status]}`}>{c.status}</span>
                      </td>
                      <td>{c.priority}</td>
                      <td>{c.severity}</td>
                      <td>{formatDate(c.openedOn)}</td>
                      <td>{formatDate(c.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default OrgDashboard
