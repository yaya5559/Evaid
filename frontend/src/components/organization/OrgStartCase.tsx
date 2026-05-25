import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import OrgLayout from './OrgLayout'
import { orgCreateCase } from '../../helpers/org/Cases'
import '../../styles/Admin/AdminLayout.css'

const severityMap: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 }

function OrgStartCase() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const orgId = String((user as any)?.org_id ?? '')
  const userId = Number((user as any)?.user_id ?? 0)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [severity, setSeverity] = useState('Medium')
  const [dueDate, setDueDate] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      await orgCreateCase(orgId, userId, {
        title,
        description,
        org_id: Number(orgId),
        created_by_user_id: userId,
        status: 'Open',
        priority,
        severity_level: String(severityMap[severity] ?? 2),
        due_date: dueDate || undefined,
      })
      navigate('/OrgCaseProgress')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create case')
      setLoading(false)
    }
  }

  return (
    <OrgLayout>
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="button" className="admin-btn" onClick={() => navigate('/OrgCaseProgress')}>
            ← Back
          </button>
          <div>
            <div className="admin-eyebrow">Organization console</div>
            <h1 className="admin-title">Start a New Case</h1>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <section className="admin-card" style={{ maxWidth: '640px' }}>
        <div className="edit-org-controls">

          <label className="edit-org-control">
            <span>Case Title <span style={{ color: '#dc2626' }}>*</span></span>
            <input
              className="edit-org-input"
              type="text"
              placeholder="Enter a clear, descriptive title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="edit-org-control">
            <span>Description</span>
            <textarea
              className="edit-org-input"
              rows={4}
              placeholder="Describe the case background, context, or initial findings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="edit-org-control">
            <span>Priority</span>
            <select className="edit-org-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </label>

          <label className="edit-org-control">
            <span>Severity</span>
            <select className="edit-org-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </label>

          <label className="edit-org-control">
            <span>Due Date</span>
            <input
              className="edit-org-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button
            type="button"
            className="admin-btn primary"
            onClick={() => void handleSubmit()}
            disabled={loading || !title.trim()}
          >
            {loading ? 'Starting...' : 'Start Case'}
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={() => navigate('/OrgCaseProgress')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </section>
    </OrgLayout>
  )
}

export default OrgStartCase
