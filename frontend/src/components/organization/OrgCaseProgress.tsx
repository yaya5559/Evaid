// Abenezer Abraham

import { useEffect, useState, useMemo } from 'react'
import {
  orgGetCases, orgGetCaseDetail, orgCreateCase, orgUpdateCase, orgCloseCase, orgDeleteCase,
  orgGetAgents, orgAssignAgent, orgCreateNote, orgUpdateNote, orgDeleteNote,
  orgUploadEvidence, orgConfirmEvidence, orgDeleteEvidence,
  type OrgCaseListItem, type OrgCaseDetailResponse, type OrgAgent,
} from '../../helpers/org/Cases'
import { useAuth } from '../../context/AuthContext'
import OrgLayout from './OrgLayout'
import '../../styles/Admin/AdminLayout.css'

type CaseStatus = 'Solved' | 'Open' | 'Discarded' | 'Closed'

type CaseRecord = {
  id: string
  caseNumber?: string
  title: string
  createdAt: string
  status: CaseStatus
  severity: string
  dueDate?: string
}

function normalizeStatus(status: string | undefined): CaseStatus {
  const s = status?.trim().toLowerCase()
  if (s === 'solved') return 'Solved'
  if (s === 'closed') return 'Closed'
  if (s === 'discarded') return 'Discarded'
  return 'Open'
}

const severityLabel: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const statusTone: Record<CaseStatus, string> = {
  Solved: 'good',
  Closed: 'good',
  Open: 'good',
  Discarded: 'critical',
}

function formatDate(date: string | undefined | null) {
  if (!date) return '—'
  const d = new Date(date.slice(0, 10) + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function toCaseRecord(item: OrgCaseListItem): CaseRecord {
  return {
    id: String(item.case_id),
    caseNumber: item.CaseNumber,
    title: item.title,
    createdAt: item.created_at,
    status: normalizeStatus(item.status),
    severity: item.severity_level,
    dueDate: item.due_date || undefined,
  }
}

function OrgCaseProgress() {
  const { user } = useAuth()
  const orgId = String((user as any)?.org_id ?? '')

  const [cases, setCases] = useState<CaseRecord[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [caseDetail, setCaseDetail] = useState<OrgCaseDetailResponse | null>(null)
  const [caseSearchQuery, setCaseSearchQuery] = useState('')

  // create form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCaseTitle, setNewCaseTitle] = useState('')
  const [newCaseDescription, setNewCaseDescription] = useState('')
  const [newCasePriority, setNewCasePriority] = useState('Medium')
  const [newCaseSeverity, setNewCaseSeverity] = useState('Medium')
  const [newCaseDueDate, setNewCaseDueDate] = useState('')

  // close/resolve form state
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [closeResolution, setCloseResolution] = useState('')

  // edit case state
  const [showEditForm, setShowEditForm] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('')
  const [editSeverity, setEditSeverity] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  // delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // add/edit note state
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<number | null>(null)

  // assign agent state
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [orgAgents, setOrgAgents] = useState<OrgAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)

  // evidence state
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [confirmDeleteEvidenceId, setConfirmDeleteEvidenceId] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadCases = async () => {
    if (!orgId) {
      setError('Organization ID not found in session. Please log out and log back in.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const items = await orgGetCases(orgId)
      setCases(items.map(toCaseRecord))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

  const loadCaseDetails = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await orgGetCaseDetail(caseId, orgId)
      setCaseDetail(response)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load case details')
    } finally {
      setLoading(false)
    }
  }

  const clearCreateForm = () => {
    setNewCaseTitle('')
    setNewCaseDescription('')
    setNewCasePriority('Medium')
    setNewCaseSeverity('Medium')
    setNewCaseDueDate('')
  }

  const handleCreateCase = async () => {
    if (!newCaseTitle.trim()) return
    setLoading(true)
    setError(null)
    const severityMap: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 }
    try {
      await orgCreateCase(orgId, Number((user as any)?.user_id ?? 0), {
        title: newCaseTitle,
        description: newCaseDescription,
        org_id: Number(orgId),
        created_by_user_id: Number((user as any)?.user_id ?? 0),
        status: 'Open',
        priority: newCasePriority,
        severity_level: String(severityMap[newCaseSeverity] ?? 2),
        due_date: newCaseDueDate || undefined,
      })
      setSuccess('Case created successfully')
      clearCreateForm()
      setShowCreateForm(false)
      void loadCases()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create case')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    if (!caseDetail) return
    setLoading(true)
    setError(null)
    try {
      await orgCloseCase(selectedCaseId, orgId, Number((user as any)?.user_id ?? 0), closeResolution)
      setSuccess('Case closed successfully')
      setShowCloseForm(false)
      setCloseResolution('')
      void loadCases()
      void loadCaseDetails(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to close case')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      await orgDeleteCase(selectedCaseId, orgId)
      setSuccess('Case deleted')
      setShowDeleteConfirm(false)
      setSelectedCaseId('')
      setCaseDetail(null)
      void loadCases()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete case')
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = () => {
    if (!caseDetail) return
    setEditDescription(caseDetail.case.description ?? '')
    setEditPriority(caseDetail.case.priority ?? 'Medium')
    setEditSeverity(String(caseDetail.case.severity_level ?? '2'))
    setEditDueDate(caseDetail.case.due_date ? caseDetail.case.due_date.slice(0, 10) : '')
    setShowEditForm((prev) => !prev)
    setShowCloseForm(false)
    setShowCloseConfirm(false)
    setShowDeleteConfirm(false)
    setShowAssignForm(false)
  }

  const handleEditCase = async () => {
    if (!caseDetail) return
    setLoading(true)
    setError(null)
    try {
      await orgUpdateCase(selectedCaseId, orgId, {
        description: editDescription,
        priority: editPriority,
        severity_level: editSeverity,
        due_date: editDueDate,
      })
      setSuccess('Case updated')
      setShowEditForm(false)
      void loadCaseDetails(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update case')
    } finally {
      setLoading(false)
    }
  }

  const openAssignForm = async () => {
    setShowAssignForm((prev) => !prev)
    setShowCloseForm(false)
    setShowCloseConfirm(false)
    setShowDeleteConfirm(false)
    setShowEditForm(false)
    if (orgAgents.length === 0) {
      try {
        const agents = await orgGetAgents(orgId)
        setOrgAgents(agents)
      } catch {
        setError('Failed to load agents')
      }
    }
  }

  const handleAssign = async () => {
    if (!selectedAgentId || !caseDetail) return
    setLoading(true)
    setError(null)
    try {
      await orgAssignAgent(selectedCaseId, selectedAgentId, Number((user as any)?.user_id ?? 0), orgId)
      setSuccess('Agent assigned successfully')
      setShowAssignForm(false)
      setSelectedAgentId(null)
      void loadCaseDetails(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to assign agent')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !caseDetail) return
    setLoading(true)
    setError(null)
    try {
      await orgCreateNote(selectedCaseId, orgId, Number((user as any)?.user_id ?? 0), newNoteContent)
      setSuccess('Note added')
      setNewNoteContent('')
      void loadCaseDetails(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add note')
    } finally {
      setLoading(false)
    }
  }

  const handleEditNote = async (noteId: number) => {
    if (!editNoteContent.trim()) return
    setLoading(true)
    setError(null)
    try {
      await orgUpdateNote(noteId, orgId, editNoteContent)
      setSuccess('Note updated')
      setEditingNoteId(null)
      setEditNoteContent('')
      void loadCaseDetails(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    setLoading(true)
    setError(null)
    try {
      await orgDeleteNote(noteId, orgId)
      setSuccess('Note deleted')
      setConfirmDeleteNoteId(null)
      void loadCaseDetails(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete note')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadEvidence = async () => {
    if (!evidenceFile || !caseDetail) return
    setLoading(true)
    setError(null)
    try {
      const result = await orgUploadEvidence(selectedCaseId, evidenceFile, Number((user as any)?.user_id ?? 0))
      await orgConfirmEvidence(result.file_id)
      setSuccess('Evidence uploaded successfully')
      setEvidenceFile(null)
      void loadCaseDetails(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to upload evidence')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvidence = async (fileId: string) => {
    setLoading(true)
    setError(null)
    try {
      await orgDeleteEvidence(fileId, orgId)
      setSuccess('Evidence deleted')
      setConfirmDeleteEvidenceId(null)
      void loadCaseDetails(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete evidence')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCases()
  }, [orgId])

  useEffect(() => {
    if (!selectedCaseId) return
    void loadCaseDetails(selectedCaseId)
  }, [selectedCaseId])

  const filteredCases = useMemo(
    () => cases.filter((c) =>
      c.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      (c.caseNumber ?? '').toLowerCase().includes(caseSearchQuery.toLowerCase())
    ),
    [cases, caseSearchQuery]
  )

  return (
    <OrgLayout>
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Organization console</div>
          <h1 className="admin-title">Case Progress</h1>
          <p className="admin-subtext">Manage and monitor your organization's cases.</p>
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

      {/* cases card */}
      <section className="admin-card">
        <div className="orgdash-card-head">
          <h2>Cases</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="admin-pill neutral">{cases.length} cases</span>
            <button
              type="button"
              className="admin-btn primary"
              onClick={() => { setShowCreateForm((prev) => !prev); setSelectedCaseId(''); setCaseDetail(null) }}
            >
              + New Case
            </button>
          </div>
        </div>

        {/* search */}
        <div className="edit-org-controls">
          <label className="edit-org-control">
            <span>Search</span>
            <input
              className="edit-org-input"
              type="text"
              placeholder="Search cases..."
              value={caseSearchQuery}
              onChange={(e) => setCaseSearchQuery(e.target.value)}
            />
          </label>
        </div>

        {/* create form */}
        {showCreateForm && (
          <div className="admin-card" style={{ marginBottom: '16px' }}>
            <h3>New Case</h3>
            <div className="edit-org-controls">
              <label className="edit-org-control">
                <span>Title</span>
                <input className="edit-org-input" type="text" placeholder="Case title" value={newCaseTitle} onChange={(e) => setNewCaseTitle(e.target.value)} />
              </label>
              <label className="edit-org-control">
                <span>Description</span>
                <input className="edit-org-input" type="text" placeholder="Case description" value={newCaseDescription} onChange={(e) => setNewCaseDescription(e.target.value)} />
              </label>
              <label className="edit-org-control">
                <span>Priority</span>
                <select className="edit-org-input" value={newCasePriority} onChange={(e) => setNewCasePriority(e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
              <label className="edit-org-control">
                <span>Severity</span>
                <select className="edit-org-input" value={newCaseSeverity} onChange={(e) => setNewCaseSeverity(e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </label>
              <label className="edit-org-control">
                <span>Due Date</span>
                <input className="edit-org-input" type="date" value={newCaseDueDate} onChange={(e) => setNewCaseDueDate(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="admin-btn primary" onClick={() => void handleCreateCase()} disabled={loading || !newCaseTitle.trim()}>Create</button>
              <button type="button" className="admin-btn" onClick={() => { clearCreateForm(); setShowCreateForm(false) }}>Cancel</button>
            </div>
          </div>
        )}

        {cases.length === 0 && !loading && (
          <p style={{ opacity: 0.7 }}>No cases available.</p>
        )}

        <div className="orgdash-progress-list">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className={`orgdash-progress-row ${caseItem.id === selectedCaseId ? 'active' : ''}`}
              onClick={() => { if (caseItem.id === selectedCaseId) { setSelectedCaseId(''); setCaseDetail(null) } else { setSelectedCaseId(caseItem.id) } }}
              style={{ cursor: 'pointer' }}
            >
              <div className="orgdash-progress-main">
                <div className="orgdash-progress-title">
                  <strong>{caseItem.title}</strong>
                  <small>{caseItem.caseNumber ?? caseItem.id}</small>
                </div>
                <span className={`admin-pill ${statusTone[caseItem.status]}`}>{caseItem.status}</span>
              </div>
              <div className="orgdash-progress-meta">
                <span>Severity: {caseItem.severity}</span>
                <span>Opened: {formatDate(caseItem.createdAt)}</span>
                {caseItem.dueDate && <span>Due: {formatDate(caseItem.dueDate)}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* case detail panel */}
      {caseDetail && (
        <section className="admin-card" style={{ marginTop: '24px' }}>
          <div className="orgdash-card-head">
            <h2>{caseDetail.case.title}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`admin-pill ${statusTone[normalizeStatus(caseDetail.case.status)]}`}>
                {caseDetail.case.status}
              </span>
              <button type="button" className="admin-btn primary" onClick={() => {
                setShowCloseConfirm((prev) => !prev)
                setShowCloseForm(false)
                setShowDeleteConfirm(false)
                setShowAssignForm(false)
                setShowEditForm(false)
              }}>
                Resolve
              </button>
              <button type="button" className="admin-btn" onClick={() => void openAssignForm()}>
                Assign Agent
              </button>
              <button type="button" className="admin-btn" onClick={() => openEditForm()}>
                Edit
              </button>
              <button type="button" className="admin-btn critical" onClick={() => {
                setShowDeleteConfirm((prev) => !prev)
                setShowCloseForm(false)
                setShowCloseConfirm(false)
                setShowAssignForm(false)
                setShowEditForm(false)
              }}>
                Delete
              </button>
            </div>
          </div>

          {/* edit case form */}
          {showEditForm && (
            <div className="admin-card" style={{ marginBottom: '16px' }}>
              <h3>Edit Case</h3>
              <div className="edit-org-controls">
                <label className="edit-org-control">
                  <span>Description</span>
                  <textarea className="edit-org-input" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                </label>
                <label className="edit-org-control">
                  <span>Priority</span>
                  <select className="edit-org-input" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </label>
                <label className="edit-org-control">
                  <span>Severity</span>
                  <select className="edit-org-input" value={editSeverity} onChange={(e) => setEditSeverity(e.target.value)}>
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                    <option value="4">Critical</option>
                  </select>
                </label>
                <label className="edit-org-control">
                  <span>Due Date</span>
                  <input className="edit-org-input" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn primary" onClick={() => void handleEditCase()} disabled={loading}>Save</button>
                <button type="button" className="admin-btn" onClick={() => setShowEditForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* assign agent form */}
          {showAssignForm && (
            <div className="admin-card" style={{ marginBottom: '16px' }}>
              <h3>Assign Agent</h3>
              {orgAgents.length === 0 ? (
                <p style={{ opacity: 0.7 }}>No agents found in this organization.</p>
              ) : (
                <div className="edit-org-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {orgAgents.map((agent) => (
                    <button
                      key={agent.user_id}
                      type="button"
                      className={`edit-org-item ${selectedAgentId === agent.user_id ? 'active' : ''}`}
                      onClick={() => setSelectedAgentId(agent.user_id)}
                    >
                      <strong>{agent.first_name} {agent.last_name}</strong>
                      <small style={{ marginLeft: '8px', opacity: 0.7 }}>{agent.email}</small>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn primary" onClick={() => void handleAssign()} disabled={loading || !selectedAgentId}>Assign</button>
                <button type="button" className="admin-btn" onClick={() => { setShowAssignForm(false); setSelectedAgentId(null) }}>Cancel</button>
              </div>
            </div>
          )}

          {/* close/resolve confirmation */}
          {showCloseConfirm && (
            <div className="admin-card" style={{ marginBottom: '16px' }}>
              <p>Are you sure you want to resolve <strong>{caseDetail.case.title}</strong>?</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn primary" onClick={() => { setShowCloseConfirm(false); setShowCloseForm(true) }} disabled={loading}>Yes, Resolve</button>
                <button type="button" className="admin-btn" onClick={() => setShowCloseConfirm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* close/resolve form */}
          {showCloseForm && (
            <div className="admin-card" style={{ marginBottom: '16px' }}>
              <h3>Resolve Case</h3>
              <div className="edit-org-controls">
                <label className="edit-org-control">
                  <span>Resolution notes</span>
                  <input className="edit-org-input" type="text" placeholder="Describe how the case was resolved..." value={closeResolution} onChange={(e) => setCloseResolution(e.target.value)} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn primary" onClick={() => void handleClose()} disabled={loading || !closeResolution.trim()}>Confirm Resolve</button>
                <button type="button" className="admin-btn" onClick={() => setShowCloseForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* delete confirmation */}
          {showDeleteConfirm && (
            <div className="admin-card" style={{ marginBottom: '16px' }}>
              <p>Are you sure you want to delete <strong>{caseDetail.case.title}</strong>? This cannot be undone.</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="admin-btn critical" onClick={() => void handleDelete()} disabled={loading}>Delete</button>
                <button type="button" className="admin-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="orgdash-progress-meta">
            <span>Case #: {caseDetail.case.CaseNumber}</span>
            <span>Severity: {severityLabel[Number(caseDetail.case.severity_level)] ?? caseDetail.case.severity_level}</span>
            <span>Priority: {caseDetail.case.priority}</span>
            <span>Opened: {formatDate(caseDetail.case.created_at)}</span>
            {caseDetail.case.due_date && <span>Due: {formatDate(caseDetail.case.due_date)}</span>}
            <span>Created by: {caseDetail.case.creator_first_name} {caseDetail.case.creator_last_name}</span>
          </div>

          <p style={{ marginTop: '12px' }}>{caseDetail.case.description}</p>

          {/* assigned agents */}
          <h3 style={{ marginTop: '16px' }}>Assigned Agents</h3>
          {caseDetail.assigned_agents.length === 0 && <p style={{ opacity: 0.7 }}>No agents assigned.</p>}
          {caseDetail.assigned_agents.map((agent) => (
            <div key={agent.user_id} className="orgdash-progress-row">
              <strong>{agent.first_name} {agent.last_name}</strong>
              <small>{agent.email}</small>
            </div>
          ))}

          {/* notes */}
          <h3 style={{ marginTop: '16px' }}>Notes</h3>
          {caseDetail.notes.length === 0 && <p style={{ opacity: 0.7 }}>No notes yet.</p>}
          {caseDetail.notes.map((note) => (
            <div key={note.note_id} className="orgdash-progress-row">
              {editingNoteId === note.note_id ? (
                <div style={{ width: '100%' }}>
                  <textarea className="edit-org-input" rows={3} value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" className="admin-btn primary" onClick={() => void handleEditNote(note.note_id)} disabled={loading || !editNoteContent.trim()}>Save</button>
                    <button type="button" className="admin-btn" onClick={() => setEditingNoteId(null)}>Cancel</button>
                  </div>
                </div>
              ) : confirmDeleteNoteId === note.note_id ? (
                <div style={{ width: '100%' }}>
                  <p style={{ margin: '0 0 8px' }}>{note.content}</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Delete this note?</span>
                    <button type="button" className="admin-btn critical" onClick={() => void handleDeleteNote(note.note_id)} disabled={loading}>Yes, Delete</button>
                    <button type="button" className="admin-btn" onClick={() => setConfirmDeleteNoteId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0 }}>{note.content}</p>
                    <small style={{ opacity: 0.6 }}>{note.author_first_name} {note.author_last_name} · {formatDate(note.created_at)}</small>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                    <button type="button" className="admin-btn" onClick={() => { setEditingNoteId(note.note_id); setEditNoteContent(note.content); setConfirmDeleteNoteId(null) }} disabled={loading}>Edit</button>
                    <button type="button" className="admin-btn critical" onClick={() => { setConfirmDeleteNoteId(note.note_id); setEditingNoteId(null) }} disabled={loading}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
          <div style={{ marginTop: '12px' }}>
            <textarea className="edit-org-input" placeholder="Add a note..." value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box' }} />
            <button type="button" className="admin-btn primary" style={{ marginTop: '8px' }} onClick={() => void handleAddNote()} disabled={loading || !newNoteContent.trim()}>Add Note</button>
          </div>

          {/* evidence */}
          <h3 style={{ marginTop: '16px' }}>Evidence</h3>
          {caseDetail.evidence.length === 0 && <p style={{ opacity: 0.7 }}>No evidence uploaded.</p>}
          {caseDetail.evidence.map((item) => (
            <div key={item.file_id} className="orgdash-progress-row">
              <div className="orgdash-progress-meta" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span>{item.file_name}</span>
                  <span style={{ opacity: 0.6 }}>{item.processing_status}</span>
                  <span>{formatDate(item.upload_date)}</span>
                </div>
                <button type="button" className="admin-btn critical" style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                  onClick={() => setConfirmDeleteEvidenceId(item.file_id)} disabled={loading}>
                  Delete
                </button>
              </div>
              {confirmDeleteEvidenceId === item.file_id && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem' }}>Delete this evidence?</span>
                  <button type="button" className="admin-btn critical" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => void handleDeleteEvidence(item.file_id)} disabled={loading}>Yes, Delete</button>
                  <button type="button" className="admin-btn" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setConfirmDeleteEvidenceId(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
            <label htmlFor="org-evidence-upload" className="edit-org-input" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span style={{ opacity: evidenceFile ? 1 : 0.5 }}>
                {evidenceFile ? evidenceFile.name : 'Choose file to upload...'}
              </span>
              <input id="org-evidence-upload" type="file" accept="image/*,.pdf,.txt,.csv,.json" style={{ display: 'none' }}
                onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)} />
            </label>
            <button type="button" className="admin-btn primary" onClick={() => void handleUploadEvidence()} disabled={loading || !evidenceFile}>Upload</button>
          </div>
        </section>
      )}
    </OrgLayout>
  )
}

export default OrgCaseProgress
