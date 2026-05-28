import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import OrgLayout from './OrgLayout'
import { orgCreateCase } from '../../helpers/org/Cases'
import '../../styles/Admin/AdminLayout.css'

const severityMap: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 }

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--admin-muted-2)',
  marginBottom: '6px',
}

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
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button type="button" className="admin-btn" onClick={() => navigate('/OrgCaseProgress')}>
            ← Back
          </button>
          <div>
            <div className="admin-eyebrow">New Investigation</div>
            <h1 className="admin-title" style={{ fontSize: '1.6rem' }}>Start a Case</h1>
          </div>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <div className="admin-card" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Title */}
          <div>
            <label style={fieldLabel}>
              Case Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="edit-org-input"
              type="text"
              placeholder="Enter a clear, descriptive title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.95rem' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={fieldLabel}>Description</label>
            <textarea
              className="edit-org-input"
              rows={4}
              placeholder="Describe the case background, context, or initial findings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontSize: '0.9rem' }}
            />
          </div>

          {/* Priority + Severity side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={fieldLabel}>Priority</label>
              <select
                className="edit-org-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Severity</label>
              <select
                className="edit-org-input"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label style={fieldLabel}>
              Due Date <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              className="edit-org-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--admin-border)', margin: '0 -32px', paddingTop: '0' }} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="admin-btn primary"
              onClick={() => void handleSubmit()}
              disabled={loading || !title.trim()}
              style={{ padding: '11px 28px', fontSize: '0.9rem' }}
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

        </div>
      </div>
    </OrgLayout>
  )
}

export default OrgStartCase
