import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAgentDashboard } from '../services/dashboard.ts';
import type { AgentDashboardData } from '../services/dashboard.ts';
import AgentLayout from './AgentLayout';
import { useNavigate } from 'react-router-dom';
import '../../styles/Admin/AdminLayout.css';

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const agentId = user?.user_id;
  const orgId = user?.org_id;

  useEffect(() => {
    if (!agentId || !orgId) return;

    const loadData = async () => {
      setLoading(true);

      try {
        const res = await getAgentDashboard(Number(agentId), Number(orgId));
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [agentId, orgId]);

  if (loading) {
    return (
        <AgentLayout>
          <div style={{ padding: '20px' }}>Loading dashboard...</div>
        </AgentLayout>
    );
  }

  if (error) {
    return (
        <AgentLayout>
          <div className="admin-banner error" style={{ margin: '20px' }}>
            Error: {error}
          </div>
        </AgentLayout>
    );
  }

  if (!data) {
    return (
        <AgentLayout>
          <div style={{ padding: '20px' }}>No data available</div>
        </AgentLayout>
    );
  }

  return (
      <AgentLayout>
        <div className="admin-page-header">
          <h1>Agent Dashboard</h1>
        </div>

        {/* KPI Cards */}
        <div className="dashboard-kpi-grid">
          <div className="dashboard-kpi admin-card">
            <div className="dashboard-kpi-label">Total Cases</div>
            <div className="dashboard-kpi-value">{data.total_cases}</div>
          </div>
          <div className="dashboard-kpi admin-card">
            <div className="dashboard-kpi-label">Open Cases</div>
            <div className="dashboard-kpi-value">{data.open_cases}</div>
          </div>
          <div className="dashboard-kpi admin-card">
            <div className="dashboard-kpi-label">Overdue</div>
            <div className="dashboard-kpi-value">{data.overdue_cases}</div>
          </div>
          <div className="dashboard-kpi admin-card">
            <div className="dashboard-kpi-label">Pending Evidence</div>
            <div className="dashboard-kpi-value">{data.pending_evidence}</div>
          </div>
        </div>

        {/* Recent Cases Section */}
        <div className="admin-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Recent Cases</h2>
            <button className="admin-btn primary" onClick={() => navigate('/AgentCases')}>
              View All
            </button>
          </div>
          <div className="orgdash-table-wrap">
            <table className="orgdash-table">
              <thead>
              <tr>
                <th>Case #</th>
                <th>Title</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
              </thead>
              <tbody>
              {data.recent_cases.map((c) => (
                  <tr key={c.case_id}>
                    <td>{c.CaseNumber}</td>
                    <td>{c.title}</td>
                    <td>
                    <span className={`admin-pill ${c.status === 'Open' ? 'good' : 'neutral'}`}>
                      {c.status}
                    </span>
                    </td>
                    <td>{c.due_date ? new Date(c.due_date).toLocaleDateString() : '—'}</td>
                    <td>
                    <span className={`admin-pill ${['High', 'Critical'].includes(c.priority) ? 'critical' : 'neutral'}`}>
                      {c.priority}
                    </span>
                    </td>
                    <td>
                      <button
                          className="admin-btn"
                          onClick={() => navigate(`/AgentCases?caseId=${c.case_id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-card" style={{ marginTop: '24px' }}>
          <h2>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button className="admin-btn primary" onClick={() => navigate('/AgentCases?create=true')}>
              Create Case
            </button>
            <button className="admin-btn" onClick={() => navigate('/Evidence_Upload')}>
              Upload Evidence
            </button>
          </div>
        </div>

        {/* Recent Notes Section */}
        {data.recent_notes.length > 0 && (
            <div className="admin-card" style={{ marginTop: '24px' }}>
              <h2>Recent Notes</h2>
              <div className="orgdash-progress-list" style={{ marginTop: '12px' }}>
                {data.recent_notes.map((note) => (
                    <div key={note.note_id} className="orgdash-progress-row">
                      <div style={{ padding: '8px 0' }}>
                        <strong>{note.case_title}</strong>
                        <p style={{ margin: '4px 0', fontSize: '0.95em' }}>{note.content}</p>
                        <small style={{ opacity: 0.7 }}>
                          {note.author} · {new Date(note.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}
      </AgentLayout>
  );
};

export default AgentDashboard;
