import { useMemo, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import OrgNav from './OrgNav'
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/OrgDashboard.css'


type CaseStatus = 'Solved' | 'Pending' | 'Discarded'

type CaseRecord = {
  id: string
  title: string
  assignedAgent: string
  evidenceCount: number
  status: CaseStatus
  progress: number
  openedOn: string
  lastUpdate: string
}

const statusTone: Record<CaseStatus, 'good' | 'warn' | 'critical'> = {
  Solved: 'good',
  Pending: 'warn',
  Discarded: 'critical',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function OrgDashboard() {
  const { user, api } = useAuth()
  const [orgSummary, setOrgSummary] = useState<any>(null)
  const [caseRecords, setCaseRecords] = useState<CaseRecord[]>([])
  const [loading, setLoading] = useState(true)

  const organizationName = user?.company?.trim() || 'Metro Intelligence Unit'
  const organizationEmail = user?.email?.trim() || 'ops@metrointel.gov'

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
    if (!orgSummary?.created_at) return { created: new Date(), diffDays: 0, diffMonths: 0 }
    
    const created = new Date(orgSummary.created_at)
    const today = new Date()
    const diffMs = Math.max(0, today.getTime() - created.getTime())
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    return { created, diffDays, diffMonths }
  }, [orgSummary?.created_at])

  const metrics = useMemo(() => {
    return caseRecords.reduce(
      (summary, caseItem) => {
        summary.totalEvidence += caseItem.evidenceCount
        if (caseItem.status === 'Solved') summary.solved += 1
        if (caseItem.status === 'Pending') summary.pending += 1
        if (caseItem.status === 'Discarded') summary.discarded += 1
        return summary
      },
      { solved: 0, pending: 0, discarded: 0, totalEvidence: 0 }
    )
  }, [caseRecords])

  if (loading) return <div>Loading dashboard...</div>

  return (
    <div className='admin-shell'>
      <aside className='admin-left'>
        <OrgNav />
      </aside>

      <main className='admin-main'>
        <header className='admin-header'>
          <div>
            <div className='admin-eyebrow'>Organization workspace</div>
            <h1 className='admin-title'>Organization Dashboard</h1>
            <p className='admin-subtext'>
              Live visibility into team capacity, case outcomes, evidence volume, and current investigation progress.
            </p>
          </div>
        </header>

        <section className='orgdash-summary-grid'>
          <article className='admin-card orgdash-org-card'>
            <div className='orgdash-card-head'>
              <h2>{organizationName}</h2>
              <span className='admin-pill info'>Client organization</span>
            </div>
            <div className='orgdash-org-email'>{organizationEmail}</div>
            <div className='orgdash-org-meta'>
              <div>
                <span>Account created</span>
                <strong>{accountAge.created.toLocaleDateString()}</strong>
              </div>
              <div>
                <span>Since</span>
                <strong>
                  {accountAge.diffMonths} months ({accountAge.diffDays} days)
                </strong>
              </div>
            </div>
          </article>

          <article className='admin-card orgdash-kpi-panel'>
            <div className='orgdash-kpi-grid'>
              <div className='orgdash-kpi'>
                <span>Employees</span>
                <strong>{orgSummary?.total_employees || 0}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Agents</span>
                <strong>{orgSummary?.total_agents || 0}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Solved Cases</span>
                <strong>{metrics.solved}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Pending Cases</span>
                <strong>{metrics.pending}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Discarded / Later</span>
                <strong>{metrics.discarded}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Evidence In Cases</span>
                <strong>{metrics.totalEvidence}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className='orgdash-main-grid'>
          <article className='admin-card orgdash-progress-card' id='org-case-progress'>
            <div className='orgdash-card-head'>
              <h2>Case Progress</h2>
              <span className='admin-pill neutral'>Active tracking</span>
            </div>
            <div className='orgdash-progress-list'>
              {caseRecords.map((caseItem) => (
                <div className='orgdash-progress-row' key={caseItem.id}>
                  <div className='orgdash-progress-main'>
                    <div className='orgdash-progress-title'>
                      <strong>{caseItem.title}</strong>
                      <small>{caseItem.id}</small>
                    </div>
                    <span className={`admin-pill ${statusTone[caseItem.status]}`}>{caseItem.status}</span>
                  </div>
                  <div className='orgdash-progress-meta'>
                    <span>{caseItem.progress}% complete</span>
                    <span>{caseItem.evidenceCount} evidence items</span>
                  </div>
                  <div className='orgdash-track'>
                    <span className='orgdash-fill' style={{ width: `${caseItem.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className='admin-card orgdash-insight-card' id='org-workload'>
            <div className='orgdash-card-head'>
              <h2>Case Workload Insights</h2>
              <span className='admin-pill info'>Today</span>
            </div>
            <div className='orgdash-insight-list'>
              <div>
                <span>Active agents on cases</span>
                <strong>37 agents</strong>
              </div>
              <div>
                <span>Average case completion</span>
                <strong>61%</strong>
              </div>
              <div>
                <span>Evidence reviewed this week</span>
                <strong>184 items</strong>
              </div>
              <div>
                <span>Pending review queue</span>
                <strong>13 cases</strong>
              </div>
            </div>
          </article>
        </section>

        <section className='admin-card orgdash-table-card' id='org-case-register'>
          <div className='orgdash-card-head'>
            <h2>Case Register</h2>
            <span className='admin-pill neutral'>{caseRecords.length} tracked cases</span>
          </div>
          <div className='orgdash-table-wrap'>
            <table className='orgdash-table'>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Assigned Agent</th>
                  <th>Evidence</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Opened</th>
                  <th>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {caseRecords.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td>
                      <div className='orgdash-case-cell'>
                        <strong>{caseItem.title}</strong>
                        <small>{caseItem.id}</small>
                      </div>
                    </td>
                    <td>{caseItem.assignedAgent}</td>
                    <td>{caseItem.evidenceCount}</td>
                    <td>
                      <span className={`admin-pill ${statusTone[caseItem.status]}`}>{caseItem.status}</span>
                    </td>
                    <td>{caseItem.progress}%</td>
                    <td>{formatDate(caseItem.openedOn)}</td>
                    <td>{formatDate(caseItem.lastUpdate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default OrgDashboard
