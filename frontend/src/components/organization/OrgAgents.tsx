import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import OrgLayout from './OrgLayout'
import '../../styles/Admin/AdminLayout.css'

type Agent = {
  user_id: number
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  is_enabled?: boolean
}

function formatName(a: Agent) {
  return `${a.first_name} ${a.last_name}`.trim()
}

function OrgAgents() {
  const { api, user } = useAuth()
  const orgId = (user as any)?.org_id
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const loadAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/org/cases/agents/')
      const data = res.data
      if (data?.message === 'Error') throw new Error(data?.error ?? 'Backend error')
      const list: Agent[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.agents)
        ? data.agents
        : []
      setAgents(list)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(Array.isArray(detail) ? detail.map((d: any) => d?.msg).join(', ') : detail ?? err?.message ?? 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const toggleAgent = async (agent: Agent) => {
    setTogglingId(agent.user_id)
    setError(null)
    try {
      const action = agent.is_enabled !== false ? 'disable' : 'enable'
      await api.patch(`/org/agents/${action}/${agent.user_id}`, null, { params: { org_id: orgId } })
      setSuccess(`${formatName(agent)} ${agent.is_enabled ? 'disabled' : 'enabled'}`)
      setAgents((prev) =>
        prev.map((a) =>
          a.user_id === agent.user_id ? { ...a, is_enabled: agent.is_enabled === false } : a
        )
      )
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d?.msg ?? String(d)).join(', ')
        : detail ?? err?.message ?? 'Failed to update agent'
      setError(msg)
    } finally {
      setTogglingId(null)
    }
  }

  useEffect(() => { void loadAgents() }, [])

  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase()
    return (
      formatName(a).toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    )
  })

  return (
    <OrgLayout>
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Organization console</div>
          <h1 className="admin-title">Agents</h1>
          <p className="admin-subtext">Manage agents in your organization.</p>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {success}
        </div>
      )}

      <section className="admin-card">
        <div className="orgdash-card-head">
          <h2>All Agents</h2>
          <span className="admin-pill neutral">{agents.length} total</span>
        </div>

        <div className="edit-org-controls" style={{ marginBottom: '16px' }}>
          <label className="edit-org-control">
            <span>Search</span>
            <input
              className="edit-org-input"
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        {loading && <p style={{ opacity: 0.6 }}>Loading agents...</p>}

        {!loading && filtered.length === 0 && (
          <p style={{ opacity: 0.7 }}>
            {search ? 'No agents match your search.' : 'No agents found in your organization.'}
          </p>
        )}

        <div className="orgdash-progress-list">
          {filtered.map((agent) => (
            <div key={agent.user_id} className="orgdash-progress-row">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <strong>{formatName(agent)}</strong>
                  <span className={`admin-pill ${agent.is_enabled !== false ? 'good' : 'critical'}`}>
                    {agent.is_enabled !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="orgdash-progress-meta">
                  <span>{agent.email}</span>
                  {agent.phone_number && <span>{agent.phone_number}</span>}
                </div>
              </div>
              <button
                type="button"
                className={`admin-btn ${agent.is_enabled !== false ? 'critical' : 'primary'}`}
                style={{ flexShrink: 0 }}
                disabled={togglingId === agent.user_id}
                onClick={() => void toggleAgent(agent)}
              >
                {togglingId === agent.user_id
                  ? '...'
                  : agent.is_enabled !== false
                  ? 'Disable'
                  : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </OrgLayout>
  )
}

export default OrgAgents
