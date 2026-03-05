import { Link } from 'react-router-dom'
import Nav from './Nav'
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/Dashboard.css'

type KpiCard = {
  label: string
  value: string
  delta: string
  tone: 'up' | 'down' | 'neutral'
}

type OrganizationRow = {
  name: string
  region: string
  users: string
  cases: string
  health: 'Healthy' | 'Needs attention' | 'Critical'
}

type PipelineStage = {
  stage: string
  total: number
  ratio: number
}

const kpiCards: KpiCard[] = [
  { label: 'Active organizations', value: '148', delta: '+12 this month', tone: 'up' },
  { label: 'Pending onboarding', value: '09', delta: '3 blocked by verification', tone: 'neutral' },
  { label: 'Seats in use', value: '3,842', delta: '+6.8% from last week', tone: 'up' },
  { label: 'Compliance risk', value: '2.3%', delta: '-0.7% in 14 days', tone: 'down' },
]

const organizations: OrganizationRow[] = [
  { name: 'Metro Intelligence Unit', region: 'US / East', users: '620 / 750', cases: '1,284', health: 'Healthy' },
  { name: 'Westport Cyber Office', region: 'US / West', users: '438 / 500', cases: '986', health: 'Needs attention' },
  { name: 'Northline Fraud Division', region: 'Canada', users: '211 / 250', cases: '604', health: 'Healthy' },
  { name: 'Federal Evidence Bureau', region: 'US / Central', users: '794 / 900', cases: '1,907', health: 'Critical' },
]

const pipeline: PipelineStage[] = [
  { stage: 'Verification', total: 6, ratio: 72 },
  { stage: 'Legal review', total: 4, ratio: 52 },
  { stage: 'Admin invite', total: 3, ratio: 40 },
  { stage: 'Security setup', total: 2, ratio: 25 },
]

const activityLog = [
  'Northline Fraud Division seat limit increased to 250',
  'Metro Intelligence Unit rotated admin credentials',
  'Federal Evidence Bureau failed nightly export policy',
  'Westport Cyber Office completed SSO validation',
]

function Dashboard() {
  return (
    <div className ='admin-shell'>
      <aside className ='admin-left'>
        <Nav />
      </aside>

      <main className='admin-main'>
        <header className='admin-header'>
          <div>
            <div className='admin-eyebrow'>Organization command center</div>
            <h1 className='admin-title'>Operations Dashboard</h1>
            <p className='admin-subtext'>
              Monitor organization health, onboarding progress, and platform readiness from one place.
            </p>
          </div>
          <div className='admin-actions'>
            <Link className='admin-btn admin-btn-primary' to='/Add_Organization'>
              Add Organization
            </Link>
            
          </div>
        </header>

        <section className='dashboard-kpi-grid' aria-label='Key performance indicators'>
          {kpiCards.map((card) => (
            <article className='admin-card dashboard-kpi' key={card.label}>
              <div className='dashboard-kpi-label'>{card.label}</div>
              <div className='dashboard-kpi-value'>{card.value}</div>
              <div className={`dashboard-kpi-delta ${card.tone}`}>{card.delta}</div>
            </article>
          ))}
        </section>

        <section className='dashboard-grid'>
          <article className='admin-card dashboard-org-card'>
            <div className='dashboard-card-header'>
              <h2>Organization Health Board</h2>
              <span className='admin-pill info'>Live sync</span>
            </div>
            <div className='dashboard-org-head'>
              <span>Organization</span>
              <span>Users</span>
              <span>Cases</span>
              <span>Status</span>
            </div>
            <div className='dashboard-org-body'>
              {organizations.map((organization) => (
                <div className='dashboard-org-row' key={organization.name}>
                  <div className='dashboard-org-name'>
                    <strong>{organization.name}</strong>
                    <small>{organization.region}</small>
                  </div>
                  <span>{organization.users}</span>
                  <span>{organization.cases}</span>
                  <span
                    className={`admin-pill ${
                      organization.health === 'Healthy'
                        ? 'good'
                        : organization.health === 'Needs attention'
                          ? 'warn'
                          : 'critical'
                    }`}
                  >
                    {organization.health}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className='admin-card dashboard-pipeline-card'>
            <div className='dashboard-card-header'>
              <h2>Onboarding Pipeline</h2>
              <span className='admin-pill neutral'>14 day view</span>
            </div>
            <div className='dashboard-pipeline-list'>
              {pipeline.map((stage) => (
                <div className='dashboard-pipeline-item' key={stage.stage}>
                  <div className='dashboard-pipeline-meta'>
                    <span>{stage.stage}</span>
                    <span>{stage.total}</span>
                  </div>
                  <div className='dashboard-progress-track'>
                    <span className='dashboard-progress-fill' style={{ width: `${stage.ratio}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link className='admin-btn admin-btn-ghost dashboard-inline-action' to='/Add_Organization'>
              Start new onboarding
            </Link>
          </article>

          <article className='admin-card dashboard-activity-card'>
            <div className='dashboard-card-header'>
              <h2>Recent Activity</h2>
              <span className='admin-pill info'>4 events</span>
            </div>
            <ul className='dashboard-activity-list'>
              {activityLog.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
