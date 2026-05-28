import { useEffect, useState } from 'react'
import Nav from './Nav'
import { api } from '../../context/AuthContext'
import '../../styles/Admin/AdminLayout.css'
import { GraphFAB } from '../shared/GraphDrawer'

type Agent = {
  user_id: number
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  org_id: number
  organization_name: string
}

function ViewAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/users/agents')
        const data = res.data
        if (data?.message === 'Error') throw new Error(data?.error ?? 'Backend error')
        setAgents(Array.isArray(data?.agents) ? data.agents : [])
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load agents')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase()
    return (
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.organization_name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="admin-shell">
      <aside className="admin-left"><Nav /></aside>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <div className="admin-eyebrow">Admin console</div>
            <h1 className="admin-title">All Agents</h1>
          </div>
          <span className="admin-pill neutral" style={{ alignSelf: 'center' }}>
            {agents.length} total
          </span>
        </header>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <section className="admin-card">
          <div style={{ marginBottom: '16px' }}>
            <input
              className="edit-org-input"
              type="text"
              placeholder="Search by name, email, or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {loading && <p style={{ opacity: 0.6 }}>Loading agents...</p>}

          {!loading && filtered.length === 0 && (
            <p style={{ opacity: 0.6 }}>{search ? 'No agents match your search.' : 'No agents found.'}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((agent) => (
              <div key={agent.user_id} className="orgdash-progress-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                  <div
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      background: 'linear-gradient(145deg, #67e8f9, #22c55e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: '#06202d',
                    }}
                  >
                    {agent.first_name[0]}{agent.last_name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {agent.first_name} {agent.last_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>{agent.email}</span>
                      {agent.phone_number && <span>{agent.phone_number}</span>}
                    </div>
                  </div>
                  <span className="admin-pill neutral" style={{ fontSize: '0.72rem', flexShrink: 0 }}>
                    {agent.organization_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default ViewAgents
