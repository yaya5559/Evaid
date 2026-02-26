import { useMemo } from 'react'
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

const createdOn = '2024-03-12'
const totalAgents = 142
const totalEmployees = 188

const caseRecords: CaseRecord[] = [
  {
    id: 'CASE-2041',
    title: 'Financial Fraud Cluster',
    assignedAgent: 'M. Carter',
    evidenceCount: 48,
    status: 'Pending',
    progress: 72,
    openedOn: '2025-11-08',
    lastUpdate: '2026-02-25',
  },
  {
    id: 'CASE-1983',
    title: 'Data Exfiltration Attempt',
    assignedAgent: 'R. Nasser',
    evidenceCount: 61,
    status: 'Solved',
    progress: 100,
    openedOn: '2025-09-14',
    lastUpdate: '2026-02-14',
  },
  {
    id: 'CASE-2105',
    title: 'Evidence Tampering Alert',
    assignedAgent: 'A. Jensen',
    evidenceCount: 29,
    status: 'Pending',
    progress: 45,
    openedOn: '2026-01-17',
    lastUpdate: '2026-02-24',
  },
  {
    id: 'CASE-1958',
    title: 'Synthetic Identity Ring',
    assignedAgent: 'F. Hassan',
    evidenceCount: 54,
    status: 'Discarded',
    progress: 28,
    openedOn: '2025-08-09',
    lastUpdate: '2025-12-22',
  },
  {
    id: 'CASE-2130',
    title: 'Unauthorized Access Chain',
    assignedAgent: 'L. Duarte',
    evidenceCount: 37,
    status: 'Pending',
    progress: 63,
    openedOn: '2026-02-03',
    lastUpdate: '2026-02-26',
  },
]

const statusTone: Record<CaseStatus, 'good' | 'warn' | 'critical'> = {
  Solved: 'good',
  Pending: 'warn',
  Discarded: 'critical',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function OrgDashboard() {
  const { user } = useAuth()
  const organizationName = user?.company?.trim() || 'Metro Intelligence Unit'
  const organizationEmail = user?.email?.trim() || 'ops@metrointel.gov'

  const accountAge = useMemo(() => {
    const created = new Date(createdOn)
    const today = new Date()
    const diffMs = Math.max(0, today.getTime() - created.getTime())
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    return { created, diffDays, diffMonths }
  }, [])

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
  }, [])

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
                <strong>{totalEmployees}</strong>
              </div>
              <div className='orgdash-kpi'>
                <span>Agents</span>
                <strong>{totalAgents}</strong>
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
