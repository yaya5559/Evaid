import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Nav from './Nav';
import '../../styles/Admin/AdminLayout.css';
import '../../styles/Admin/Dashboard.css';
import { useAuth } from '../../context/AuthContext';
import {
  disableOrganization,
  enableOrganization,
  deleteOrganization,
} from '../../helpers/admin/organizations';

type KpiCard = {
  label: string;
  value: string;
  delta: string;
  tone: 'up' | 'down' | 'neutral';
};

type OrganizationRow = {
  org_id: number;
  name: string;
  region: string;
  users: number;
  cases: number;
  agents: number;
  evidence: number;
  storageBytes: number;
  isActive: boolean;
  health: 'Healthy' | 'Needs attention' | 'Critical';
};

type ConfirmAction = {
  type: 'disable' | 'enable' | 'delete';
  org: OrganizationRow;
};

type PipelineStage = {
  stage: string;
  total: number;
  ratio: number;
};

type LastLoginEntry = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  org_name: string;
  last_login_at: string;
};

type ActivityEntry = {
  event_type:
    | 'note_added' | 'note_edited'
    | 'case_opened' | 'case_closed'
    | 'agent_assigned'
    | 'user_registered' | 'user_deactivated'
    | 'org_created' | 'org_archived'
    | 'evidence_uploaded' | 'evidence_added' | 'evidence_linked'
    | 'analysis_completed'
    | 'ai_suggestion' | 'ai_suggestion_reviewed'
    | 'signal_triaged'
    | 'entity_cluster';
  label: string;
  actor: string;
  org_name: string;
  timestamp: string;
};

function activityPill(eventType: ActivityEntry['event_type']): string {
  if (eventType === 'case_opened') return 'up';
  if (eventType === 'case_closed') return 'neutral';
  if (eventType === 'note_added') return 'info';
  if (eventType === 'note_edited') return 'info';
  if (eventType === 'agent_assigned') return 'info';
  if (eventType === 'user_registered') return 'neutral';
  if (eventType === 'org_created') return 'up';
  if (eventType === 'org_archived') return 'neutral';
  if (eventType === 'evidence_uploaded') return 'info';
  if (eventType === 'evidence_added') return 'info';
  if (eventType === 'analysis_completed') return 'neutral';
  if (eventType === 'ai_suggestion') return 'critical';
  if (eventType === 'ai_suggestion_reviewed') return 'info';
  if (eventType === 'signal_triaged') return 'info';
  if (eventType === 'user_deactivated') return 'neutral';
  if (eventType === 'evidence_linked') return 'info';
  if (eventType === 'entity_cluster') return 'critical';
  return 'neutral';
}

function activityTag(eventType: ActivityEntry['event_type']): string {
  if (eventType === 'case_opened') return 'Case opened';
  if (eventType === 'case_closed') return 'Case closed';
  if (eventType === 'note_added') return 'Note';
  if (eventType === 'note_edited') return 'Note edited';
  if (eventType === 'agent_assigned') return 'Assigned';
  if (eventType === 'user_registered') return 'New user';
  if (eventType === 'user_deactivated') return 'Deactivated';
  if (eventType === 'org_created') return 'Org created';
  if (eventType === 'org_archived') return 'Org archived';
  if (eventType === 'evidence_uploaded') return 'Evidence';
  if (eventType === 'evidence_added') return 'Evidence';
  if (eventType === 'evidence_linked') return 'Evidence linked';
  if (eventType === 'analysis_completed') return 'Analysis';
  if (eventType === 'ai_suggestion') return 'AI';
  if (eventType === 'ai_suggestion_reviewed') return 'AI reviewed';
  if (eventType === 'signal_triaged') return 'Signal';
  if (eventType === 'entity_cluster') return 'Entity cluster';
  return eventType;
}

function rolePill(role: string): string {
  const r = role.toUpperCase();
  if (r === 'EVAIDE_ADMIN') return 'critical';
  if (r === 'ORG_ADMIN') return 'info';
  return 'neutral';
}

function roleLabel(role: string): string {
  const r = role.toUpperCase();
  if (r === 'EVAIDE_ADMIN') return 'Evaide Admin';
  if (r === 'ORG_ADMIN') return 'Org Owner';
  if (r === 'AGENT') return 'Agent';
  return role;
}

function formatDateTime(raw: string | undefined | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatBytes(b: number | undefined | null): string {
  const n = Number(b ?? 0);
  if (!n) return '—';
  if (n >= 1_073_741_824) return `${(n / 1_073_741_824).toFixed(1)} GB`;
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1_024) return `${(n / 1_024).toFixed(1)} KB`;
  return `${n} B`;
}

function computeHealth(agents: number, cases: number): OrganizationRow['health'] {
  if (agents === 0) return 'Critical';
  if (cases === 0) return 'Needs attention';
  return 'Healthy';
}

function Dashboard() {
  const { api } = useAuth();

  const [kpiCards, setKpiCards] = useState<KpiCard[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [lastLogins, setLastLogins] = useState<LastLoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState<'All' | OrganizationRow['health']>('All');
  const [orgExpanded, setOrgExpanded] = useState(false);
  const [showStatusHelp, setShowStatusHelp] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [orgResult, kpiResult, pipelineResult, activityResult, lastLoginsResult] =
          await Promise.allSettled([
            api.get('/Organization'),
            api.get('/dashboard/kpis'),
            api.get('/dashboard/pipeline'),
            api.get('/dashboard/activity'),
            api.get('/dashboard/last-logins'),
          ]);

        if (orgResult.status === 'fulfilled') {
          const data = orgResult.value.data;
          const orgs = Array.isArray(data.organizations) ? data.organizations : [];
          const mapped: OrganizationRow[] = orgs.map((o: any) => {
            const agents = Number(o.agent_count || 0);
            const cases = Number(o.case_count || 0);
            return {
              org_id: Number(o.org_id),
              name: o.companyName,
              region: o.companyEmail ?? '',
              users: Number(o.user_count || 0),
              cases,
              agents,
              evidence: Number(o.evidence_count || 0),
              storageBytes: Number(o.storage_bytes || 0),
              isActive: o.status !== 'suspended',
              health: computeHealth(agents, cases),
            };
          });
          setOrganizations(mapped);
        } else {
          setOrganizations([]);
        }

        if (kpiResult.status === 'fulfilled' && Array.isArray(kpiResult.value.data)) {
          setKpiCards(kpiResult.value.data);
        } else {
          setKpiCards([]);
        }

        if (pipelineResult.status === 'fulfilled' && Array.isArray(pipelineResult.value.data)) {
          setPipeline(pipelineResult.value.data);
        } else {
          setPipeline([]);
        }

        if (activityResult.status === 'fulfilled' && Array.isArray(activityResult.value.data)) {
          setActivityLog(activityResult.value.data);
        } else {
          setActivityLog([]);
        }

        if (lastLoginsResult.status === 'fulfilled' && Array.isArray(lastLoginsResult.value.data)) {
          setLastLogins(lastLoginsResult.value.data);
        } else {
          setLastLogins([]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [api]);

  const reloadOrgs = async () => {
    const res = await api.get('/Organization');
    const data = res.data;
    const orgs = Array.isArray(data.organizations) ? data.organizations : [];
    setOrganizations(
      orgs.map((o: any) => {
        const agents = Number(o.agent_count || 0);
        const cases = Number(o.case_count || 0);
        return {
          org_id: Number(o.org_id),
          name: o.companyName,
          region: o.companyEmail ?? '',
          users: Number(o.user_count || 0),
          cases,
          agents,
          evidence: Number(o.evidence_count || 0),
          isActive: o.status !== 'suspended',
          health: computeHealth(agents, cases),
        };
      })
    );
  };

  const handleConfirmedAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (confirmAction.type === 'disable') {
        await disableOrganization(confirmAction.org.name);
      } else if (confirmAction.type === 'enable') {
        await enableOrganization(confirmAction.org.name);
      } else {
        await deleteOrganization(confirmAction.org.name);
      }
      setConfirmAction(null);
      await reloadOrgs();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrgs = useMemo(() => {
    const q = orgSearch.toLowerCase();
    return organizations.filter(
      (o) =>
        (orgStatusFilter === 'All' || o.health === orgStatusFilter) &&
        (q === '' || o.name.toLowerCase().includes(q) || o.region.toLowerCase().includes(q))
    );
  }, [organizations, orgSearch, orgStatusFilter]);

  const visibleOrgs = orgExpanded ? filteredOrgs : filteredOrgs.slice(0, 5);

  return (
    <div className='admin-shell'>
      <aside className='admin-left'>
        <Nav />
      </aside>

      <main className='admin-main'>
        <header className='admin-header'>
          <div>
            <div className='admin-eyebrow'>Organization command center</div>
            <h1 className='admin-title'>Admin Console</h1>
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

        {/* KPI Cards */}
        <section className='dashboard-kpi-grid' aria-label='Key performance indicators'>
          <article className='admin-card dashboard-kpi'>
            <div className='dashboard-kpi-label'>Organizations</div>
            <div className='dashboard-kpi-value'>{loading ? '—' : organizations.length}</div>
            <div className='dashboard-kpi-delta neutral'>Current</div>
          </article>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <article className='admin-card dashboard-kpi' key={i}>
                  <div className='dashboard-kpi-label' style={{ opacity: 0.4 }}>Loading</div>
                  <div className='dashboard-kpi-value' style={{ opacity: 0.2 }}>—</div>
                </article>
              ))
            : kpiCards.map((card) => (
                <article className='admin-card dashboard-kpi' key={card.label}>
                  <div className='dashboard-kpi-label'>{card.label}</div>
                  <div className='dashboard-kpi-value'>{card.value}</div>
                  {card.delta && (
                    <div className={`dashboard-kpi-delta ${card.tone}`}>{card.delta}</div>
                  )}
                </article>
              ))}
        </section>

        {/* Health Board + Pipeline */}
        <section className='dashboard-grid'>
          <article className='admin-card dashboard-org-card'>
            <div className='dashboard-card-header'>
              <h2>Organization Health Board</h2>
              <span className='admin-pill info'>Live sync</span>
            </div>

            {/* Search + filter row */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type='text'
                placeholder='Search organizations...'
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className='edit-org-input'
                style={{ flex: '1', minWidth: '160px', maxWidth: '280px' }}
              />
              <select
                value={orgStatusFilter}
                onChange={(e) => setOrgStatusFilter(e.target.value as typeof orgStatusFilter)}
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--admin-border)',
                  padding: '10px 16px',
                  fontWeight: 600,
                  color: '#000000',
                  background: 'rgb(77, 101, 125)',
                  cursor: 'pointer',
                  colorScheme: 'dark',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  outline: 'none',
                }}
              >
                <option value='All'>All Statuses</option>
                <option value='Healthy'>Healthy</option>
                <option value='Needs attention'>Needs Attention</option>
                <option value='Critical'>Critical</option>
              </select>

              {/* Status legend tooltip */}
              <div style={{ position: 'relative' }}>
                <button
                  type='button'
                  onClick={() => setShowStatusHelp((p) => !p)}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    border: '1px solid var(--admin-border-soft)',
                    background: 'var(--admin-panel-soft)',
                    cursor: 'pointer', fontSize: '13px', lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--admin-muted)',
                  }}
                  aria-label='Status legend'
                >
                  ?
                </button>
                {showStatusHelp && (
                  <div
                    style={{
                      position: 'absolute', top: '30px', right: 0, zIndex: 10,
                      background: '#0e1822', border: '1px solid var(--admin-border-soft)',
                      borderRadius: '10px', padding: '14px 16px', width: '260px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', fontSize: '13px',
                    }}
                  >
                    <div style={{ marginBottom: '8px', fontWeight: 600 }}>Status Meanings</div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div>
                        <span className='admin-pill good' style={{ marginRight: '8px' }}>Healthy</span>
                        Has registered agents and at least one open case.
                      </div>
                      <div>
                        <span className='admin-pill warn' style={{ marginRight: '8px' }}>Needs Attention</span>
                        Has agents but no cases have been created yet.
                      </div>
                      <div>
                        <span className='admin-pill critical' style={{ marginRight: '8px' }}>Critical</span>
                        No agents registered — only the organization owner exists.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='dashboard-org-head' style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
              <span>Organization</span>
              <span>Users</span>
              <span>Agents</span>
              <span>Cases</span>
              <span>Evidence</span>
              <span>Storage</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            <div className='dashboard-org-body'>
              {loading && (
                <p style={{ opacity: 0.4, fontSize: '0.9rem', padding: '4px 12px' }}>Loading organizations...</p>
              )}
              {!loading && visibleOrgs.length === 0 && (
                <p style={{ opacity: 0.6, fontSize: '0.9rem', padding: '4px 12px' }}>No organizations match.</p>
              )}
              {visibleOrgs.map((organization) => (
                <div
                  className='dashboard-org-row'
                  key={organization.name}
                  style={{
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                    opacity: organization.isActive ? 1 : 0.6,
                  }}
                >
                  <div className='dashboard-org-name'>
                    <strong>{organization.name}</strong>
                    <small>{organization.region}</small>
                  </div>
                  <span>{organization.users}</span>
                  <span>{organization.agents}</span>
                  <span>{organization.cases}</span>
                  <span>{organization.evidence}</span>
                  <span>{formatBytes(organization.storageBytes)}</span>
                  <span
                    className={`admin-pill ${
                      !organization.isActive
                        ? 'neutral'
                        : organization.health === 'Healthy'
                        ? 'good'
                        : organization.health === 'Needs attention'
                        ? 'warn'
                        : 'critical'
                    }`}
                  >
                    {!organization.isActive ? 'Suspended' : organization.health}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {organization.isActive ? (
                      <button
                        type='button'
                        className='admin-btn'
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => setConfirmAction({ type: 'disable', org: organization })}
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type='button'
                        className='admin-btn'
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => setConfirmAction({ type: 'enable', org: organization })}
                      >
                        Enable
                      </button>
                    )}
                    <button
                      type='button'
                      className='admin-btn'
                      style={{
                        fontSize: '0.75rem', padding: '4px 10px',
                        borderColor: 'rgba(239,68,68,0.5)', color: '#f87171',
                      }}
                      onClick={() => setConfirmAction({ type: 'delete', org: organization })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredOrgs.length > 5 && (
              <button
                type='button'
                className='admin-btn admin-btn-ghost'
                onClick={() => setOrgExpanded((p) => !p)}
                style={{ width: '100%' }}
              >
                {orgExpanded
                  ? `Show less`
                  : `Show all ${filteredOrgs.length} organizations`}
              </button>
            )}
          </article>

          <article className='admin-card dashboard-pipeline-card'>
            <div className='dashboard-card-header'>
              <h2>Organization Setup Progress</h2>
              <span className='admin-pill neutral'>{organizations.length} orgs total</span>
            </div>
            <div className='dashboard-pipeline-list'>
              {loading && (
                <p style={{ opacity: 0.4, fontSize: '0.9rem' }}>Loading pipeline...</p>
              )}
              {!loading && pipeline.map((stage) => (
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
              Add new organization
            </Link>
          </article>

          <article className='admin-card dashboard-activity-card'>
            <div className='dashboard-card-header'>
              <h2>Recent Activity</h2>
              <span className='admin-pill info'>{activityLog.length} events</span>
            </div>
            <ul className='dashboard-activity-list'>
              {loading
                ? <li style={{ opacity: 0.4 }}>Loading activity...</li>
                : activityLog.length === 0
                ? <li style={{ opacity: 0.5 }}>No recent activity.</li>
                : activityLog.map((item, i) => (
                  <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`admin-pill ${activityPill(item.event_type)}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                        {activityTag(item.event_type)}
                      </span>
                      <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.6, paddingLeft: '2px' }}>
                      {item.actor} &middot; {item.org_name} &middot; {formatDateTime(item.timestamp)}
                    </div>
                  </li>
                ))}
            </ul>
          </article>
        </section>

        {/* Last Logins Card */}
        <section style={{ marginTop: '24px' }}>
          <article className='admin-card'>
            <div className='dashboard-card-header'>
              <h2>Recent Logins</h2>
              <span className='admin-pill info'>{lastLogins.length} users</span>
            </div>
            {loading ? (
              <p style={{ opacity: 0.4, padding: '8px 0' }}>Loading login data...</p>
            ) : lastLogins.length === 0 ? (
              <p style={{ opacity: 0.6, padding: '8px 0' }}>No login data available yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Role</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Organization</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastLogins.map((entry) => (
                      <tr
                        key={entry.user_id}
                        style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                      >
                        <td style={{ padding: '8px 12px' }}>
                          {entry.first_name} {entry.last_name}
                        </td>
                        <td style={{ padding: '8px 12px', opacity: 0.75 }}>{entry.email}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={`admin-pill ${rolePill(entry.role)}`}>
                            {roleLabel(entry.role)}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>{entry.org_name}</td>
                        <td style={{ padding: '8px 12px', opacity: 0.8 }}>
                          {formatDateTime(entry.last_login_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </main>

      {/* Confirmation modal */}
      {confirmAction && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => { if (!actionLoading) setConfirmAction(null); }}
        >
          <div
            style={{
              background: '#0e1822', border: '1px solid var(--admin-border)',
              borderRadius: '16px', padding: '28px 32px', maxWidth: '420px', width: '90%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
              {confirmAction.type === 'delete'
                ? 'Delete Organization'
                : confirmAction.type === 'disable'
                ? 'Disable Organization'
                : 'Enable Organization'}
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--admin-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {confirmAction.type === 'delete' ? (
                <>
                  Are you sure you want to <strong style={{ color: '#f87171' }}>permanently delete</strong>{' '}
                  <strong>{confirmAction.org.name}</strong>? This will remove all associated users and cannot be undone.
                </>
              ) : confirmAction.type === 'disable' ? (
                <>
                  Are you sure you want to <strong>disable</strong>{' '}
                  <strong>{confirmAction.org.name}</strong>? The organization and its users will be suspended.
                </>
              ) : (
                <>
                  Are you sure you want to <strong>re-enable</strong>{' '}
                  <strong>{confirmAction.org.name}</strong>? The organization will be restored to active status.
                </>
              )}
            </p>
            {actionError && (
              <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>{actionError}</p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type='button'
                className='admin-btn'
                onClick={() => { setConfirmAction(null); setActionError(null); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type='button'
                className='admin-btn'
                style={
                  confirmAction.type === 'delete'
                    ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)', color: '#f87171' }
                    : confirmAction.type === 'disable'
                    ? { background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.5)', color: '#fbbf24' }
                    : { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.5)', color: '#4ade80' }
                }
                onClick={() => void handleConfirmedAction()}
                disabled={actionLoading}
              >
                {actionLoading
                  ? 'Processing...'
                  : confirmAction.type === 'delete'
                  ? 'Yes, delete'
                  : confirmAction.type === 'disable'
                  ? 'Yes, disable'
                  : 'Yes, enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
