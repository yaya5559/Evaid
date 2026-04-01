import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav';
import '../../styles/Admin/AdminLayout.css';
import '../../styles/Admin/Dashboard.css';
import { useAuth } from '../../context/AuthContext'; 

type KpiCard = {
  label: string;
  value: string;
  delta: string;
  tone: 'up' | 'down' | 'neutral';
};

type OrganizationRow = {
  name: string;
  region: string;
  users: string;
  cases: string;
  health: 'Healthy' | 'Needs attention' | 'Critical';
};

type PipelineStage = {
  stage: string;
  total: number;
  ratio: number;
};

function Dashboard() {
  const { api } = useAuth();

  const [kpiCards, setKpiCards] = useState<KpiCard[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [orgResult, kpiResult, pipelineResult, activityResult] = await Promise.allSettled([
          api.get('/Organization'),
          api.get('/dashboard/kpis'),
          api.get('/dashboard/pipeline'),
          api.get('/dashboard/activity'),
        ]);
        if (orgResult.status === 'fulfilled') {
          const data = orgResult.value.data;
          const orgs = Array.isArray(data.organizations) ? data.organizations : [];
          const mapped = orgs.map((o: any) => ({
            name: o.name,
            region: o.email ?? '',
            users: 'N/A',
            cases: '0',
            health: 'Healthy',
          }));
          setOrganizations(mapped);
        } else {
          setOrganizations([]);
        }

        if (kpiResult.status === 'fulfilled') setKpiCards(kpiResult.value.data ?? []);
        else setKpiCards([]);

        if (pipelineResult.status === 'fulfilled') setPipeline(pipelineResult.value.data ?? []);
        else setPipeline([]);

        if (activityResult.status === 'fulfilled') setActivityLog(activityResult.value.data ?? []);
        else setActivityLog([]);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [api]);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className='admin-shell'>
      <aside className='admin-left'>
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
              <span className='admin-pill info'>{activityLog.length} events</span>
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
  );
}

export default Dashboard;