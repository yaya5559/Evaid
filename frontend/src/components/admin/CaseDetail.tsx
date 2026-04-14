// Abenezer Abraham

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCaseDetails, updateCase, closeCase, deleteCase,
  getOrgAgents, assignAgent,
  createNote, updateNote, deleteNote,
  uploadEvidence, confirmEvidence, deleteEvidence,
  getActorsForCase,
  type CaseDetailResponse, type OrgAgent, type Actor,
} from '../../helpers/admin/Cases'
import { useAuth } from '../../context/AuthContext'
import { useSignals } from '../../context/SignalContext'
import Nav from './Nav'
import { PendingSignalsSection } from '../shared/PendingSignalsSection'
import '../../styles/Admin/AdminLayout.css'

type CaseStatus = 'Solved' | 'Open' | 'Discarded'

function normalizeStatus(s: string | undefined): CaseStatus {
  const v = s?.trim().toLowerCase()
  if (v === 'solved') return 'Solved'
  if (v === 'discarded') return 'Discarded'
  return 'Open'
}

const statusTone: Record<CaseStatus, string> = { Solved: 'good', Open: 'good', Discarded: 'critical' }
const severityLabel: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

function roleColor(role: string): string {
  if (role === 'Suspect') return 'critical'
  if (role === 'Person of Interest') return 'info'
  return 'neutral'
}

function formatDate(d: string | undefined | null) {
  if (!d) return '—'
  const dt = new Date(d.slice(0, 10) + 'T00:00:00')
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function AdminCaseDetail() {
  const { orgId = '', caseId = '' } = useParams<{ orgId: string; caseId: string }>()
  const { user } = useAuth()
  const { fetchSignalsForCase } = useSignals()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<CaseDetailResponse | null>(null)

  // update form
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateDescription, setUpdateDescription] = useState('')
  const [updatePriority, setUpdatePriority] = useState('')
  const [updateSeverity, setUpdateSeverity] = useState('')
  const [updateDueDate, setUpdateDueDate] = useState('')

  // resolve
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [closeResolution, setCloseResolution] = useState('')

  // delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // assign agent
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [orgAgents, setOrgAgents] = useState<OrgAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)

  // notes
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<number | null>(null)

  // evidence
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [confirmDeleteEvidenceId, setConfirmDeleteEvidenceId] = useState<string | null>(null)

  const [actors, setActors] = useState<Actor[]>([])
  const [actorsLoading, setActorsLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadDetail = async () => {
    setLoading(true)
    try {
      const res = await getCaseDetails(orgId, caseId)
      if (!res.case) { setError(res.message ?? 'Case not found'); return }
      setDetail(res)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load case')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!detail) return
    setLoading(true); setError(null)
    try {
      const sm: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 }
      await updateCase(orgId, caseId, {
        title: updateTitle || undefined,
        description: updateDescription || undefined,
        priority: updatePriority || undefined,
        severity_level: updateSeverity ? String(sm[updateSeverity] ?? updateSeverity) : undefined,
        due_date: updateDueDate || undefined,
      })
      setSuccess('Case updated'); setShowUpdateForm(false); void loadDetail()
    } catch { setError('Failed to update case') } finally { setLoading(false) }
  }

  const handleClose = async () => {
    if (!detail) return
    setLoading(true); setError(null)
    try {
      await closeCase(orgId, {
        case_id: detail.case.case_id, status: 'Solved',
        resolution: closeResolution,
        closed_by_user_id: Number((user as any)?.user_id ?? 0),
      })
      setSuccess('Case resolved'); setShowCloseForm(false); void loadDetail()
    } catch { setError('Failed to resolve case') } finally { setLoading(false) }
  }

  const handleDelete = async () => {
    setLoading(true); setError(null)
    try {
      await deleteCase(orgId, caseId, Number((user as any)?.user_id ?? 0))
      navigate('/Cases', { replace: true })
    } catch { setError('Failed to delete case') } finally { setLoading(false) }
  }

  const openAssignForm = async () => {
    setShowAssignForm((p) => !p)
    setShowUpdateForm(false); setShowCloseForm(false); setShowDeleteConfirm(false)
    if (orgAgents.length === 0) {
      try { setOrgAgents(await getOrgAgents(orgId)) } catch { setError('Failed to load agents') }
    }
  }

  const handleAssign = async () => {
    if (!selectedAgentId || !detail) return
    setLoading(true); setError(null)
    try {
      await assignAgent(orgId, caseId, selectedAgentId, Number((user as any)?.user_id ?? 0))
      setSuccess('Agent assigned'); setShowAssignForm(false); setSelectedAgentId(null); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to assign agent') } finally { setLoading(false) }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !detail) return
    setLoading(true); setError(null)
    try {
      await createNote(caseId, newNoteContent, Number((user as any)?.user_id ?? 0))
      setSuccess('Note added'); setNewNoteContent(''); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to add note') } finally { setLoading(false) }
  }

  const handleEditNote = async (noteId: number) => {
    if (!editNoteContent.trim()) return
    setLoading(true); setError(null)
    try {
      await updateNote(noteId, editNoteContent)
      setSuccess('Note updated'); setEditingNoteId(null); setEditNoteContent(''); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to update note') } finally { setLoading(false) }
  }

  const handleDeleteNote = async (noteId: number) => {
    setLoading(true); setError(null)
    try {
      await deleteNote(noteId)
      setSuccess('Note deleted'); setConfirmDeleteNoteId(null); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to delete note') } finally { setLoading(false) }
  }

  const handleUploadEvidence = async () => {
    if (!evidenceFile || !detail) return
    setLoading(true); setError(null)
    try {
      await uploadEvidence(caseId, evidenceFile, Number((user as any)?.user_id ?? 0))
      setSuccess('Evidence uploaded'); setEvidenceFile(null); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to upload evidence') } finally { setLoading(false) }
  }

  const handleDeleteEvidence = async (fileId: string) => {
    setLoading(true); setError(null)
    try {
      await deleteEvidence(fileId)
      setSuccess('Evidence deleted'); setConfirmDeleteEvidenceId(null); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to delete evidence') } finally { setLoading(false) }
  }

  useEffect(() => { void loadDetail() }, [orgId, caseId])
  useEffect(() => { if (caseId) void fetchSignalsForCase(caseId) }, [caseId])

  useEffect(() => {
    if (!caseId) return
    setActorsLoading(true)
    getActorsForCase(caseId)
      .then(setActors)
      .catch(() => setActors([]))
      .finally(() => setActorsLoading(false))
  }, [caseId])

  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

  return (
    <div className="admin-shell">
      <aside className="admin-left"><Nav /></aside>
      <main className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="button" className="admin-btn" onClick={() => navigate('/Cases')}>← Back</button>
            <div>
              <div className="admin-eyebrow">Case Detail</div>
              <h1 className="admin-title">{detail?.case.title ?? 'Loading...'}</h1>
            </div>
          </div>
        </header>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
        {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>}

        {loading && !detail && <p style={{ opacity: 0.6 }}>Loading...</p>}

        {detail && (
          <>
            {/* Actions */}
            <section className="admin-card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`admin-pill ${statusTone[normalizeStatus(detail.case.status)]}`}>{detail.case.status}</span>
                <button type="button" className="admin-btn" onClick={() => {
                  setUpdateTitle(detail.case.title)
                  setUpdateDescription(detail.case.description)
                  setUpdatePriority(detail.case.priority ?? '')
                  setUpdateSeverity(severityLabel[Number(detail.case.severity_level)] ?? '')
                  setUpdateDueDate((detail.case.due_date ?? '').slice(0, 10))
                  setShowUpdateForm((p) => !p)
                  setShowCloseForm(false); setShowDeleteConfirm(false); setShowAssignForm(false); setShowCloseConfirm(false)
                }}>Edit</button>
                <button type="button" className="admin-btn primary" onClick={() => {
                  setShowCloseConfirm((p) => !p)
                  setShowCloseForm(false); setShowUpdateForm(false); setShowDeleteConfirm(false); setShowAssignForm(false)
                }}>Resolve</button>
                <button type="button" className="admin-btn" onClick={() => void openAssignForm()}>Assign Agent</button>
                <button type="button" className="admin-btn critical" onClick={() => {
                  setShowDeleteConfirm((p) => !p)
                  setShowUpdateForm(false); setShowCloseForm(false); setShowAssignForm(false); setShowCloseConfirm(false)
                }}>Delete</button>
              </div>

              {showAssignForm && (
                <div className="admin-card" style={{ marginTop: '16px' }}>
                  <h3>Assign Agent</h3>
                  {orgAgents.length === 0 ? <p style={{ opacity: 0.7 }}>No agents found.</p> : (
                    <div className="edit-org-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {orgAgents.map((a) => (
                        <button key={a.user_id} type="button" className={`edit-org-item ${selectedAgentId === a.user_id ? 'active' : ''}`} onClick={() => setSelectedAgentId(a.user_id)}>
                          <strong>{a.first_name} {a.last_name}</strong>
                          <small style={{ marginLeft: '8px', opacity: 0.7 }}>{a.email}</small>
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

              {showUpdateForm && (
                <div className="admin-card" style={{ marginTop: '16px' }}>
                  <h3>Edit Case</h3>
                  <div className="edit-org-controls">
                    <label className="edit-org-control"><span>Title</span><input className="edit-org-input" type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} /></label>
                    <label className="edit-org-control"><span>Description</span><input className="edit-org-input" type="text" value={updateDescription} onChange={(e) => setUpdateDescription(e.target.value)} /></label>
                    <label className="edit-org-control"><span>Priority</span>
                      <select className="edit-org-input" value={updatePriority} onChange={(e) => setUpdatePriority(e.target.value)}>
                        <option>Low</option><option>Medium</option><option>High</option>
                      </select>
                    </label>
                    <label className="edit-org-control"><span>Severity</span>
                      <select className="edit-org-input" value={updateSeverity} onChange={(e) => setUpdateSeverity(e.target.value)}>
                        <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                      </select>
                    </label>
                    <label className="edit-org-control"><span>Due Date</span><input className="edit-org-input" type="date" value={updateDueDate} onChange={(e) => setUpdateDueDate(e.target.value)} /></label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" className="admin-btn primary" onClick={() => void handleUpdate()} disabled={loading}>Save</button>
                    <button type="button" className="admin-btn" onClick={() => setShowUpdateForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {showCloseConfirm && (
                <div className="admin-card" style={{ marginTop: '16px' }}>
                  <p>Resolve <strong>{detail.case.title}</strong>?</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" className="admin-btn primary" onClick={() => { setShowCloseConfirm(false); setShowCloseForm(true) }} disabled={loading}>Yes, Resolve</button>
                    <button type="button" className="admin-btn" onClick={() => setShowCloseConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {showCloseForm && (
                <div className="admin-card" style={{ marginTop: '16px' }}>
                  <h3>Resolve Case</h3>
                  <div className="edit-org-controls">
                    <label className="edit-org-control"><span>Resolution notes</span>
                      <input className="edit-org-input" type="text" placeholder="Describe the resolution..." value={closeResolution} onChange={(e) => setCloseResolution(e.target.value)} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" className="admin-btn primary" onClick={() => void handleClose()} disabled={loading || !closeResolution.trim()}>Confirm Resolve</button>
                    <button type="button" className="admin-btn" onClick={() => setShowCloseForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {showDeleteConfirm && (
                <div className="admin-card" style={{ marginTop: '16px' }}>
                  <p>Delete <strong>{detail.case.title}</strong>? This cannot be undone.</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" className="admin-btn critical" onClick={() => void handleDelete()} disabled={loading}>Delete</button>
                    <button type="button" className="admin-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </section>

            {/* Case Info */}
            <section className="admin-card" style={{ marginBottom: '16px' }}>
              <h2>Case Info</h2>
              <div className="orgdash-progress-meta">
                <span>Case #: {detail.case.CaseNumber}</span>
                <span>Severity: {detail.case.severity_level}</span>
                <span>Priority: {detail.case.priority}</span>
                <span>Opened: {formatDate(detail.case.created_at)}</span>
                {detail.case.due_date && <span>Due: {formatDate(detail.case.due_date)}</span>}
                <span>Created by: {detail.case.creator_first_name} {detail.case.creator_last_name}</span>
              </div>
              {detail.case.description && <p style={{ marginTop: '12px' }}>{detail.case.description}</p>}
            </section>

            {/* Actors */}
            <section className="admin-card" style={{ marginBottom: '16px' }}>
              <h2>Actors ({actors.length})</h2>
              {actorsLoading && <p style={{ opacity: 0.6 }}>Loading actors...</p>}
              {!actorsLoading && actors.length === 0 && <p style={{ opacity: 0.7 }}>No actors linked to this case.</p>}
              {!actorsLoading && actors.map((actor) => (
                <div key={actor.id} className="orgdash-progress-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{actor.primaryName}</strong>
                    <span className={`admin-pill ${roleColor(actor.role)}`}>{actor.role}</span>
                    <span className={`admin-pill ${actor.source === 'AI' ? 'info' : 'neutral'}`}>{actor.source}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.75, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    <span>Aliases: {actor.aliases.length > 0 ? actor.aliases.join(', ') : '—'}</span>
                    {actor.confidenceScore !== null && <span>Confidence: {Math.round(actor.confidenceScore * 100)}%</span>}
                    <span>Added: {formatDate(actor.createdAt)}</span>
                    <span>{actor.evidenceCount} evidence · {actor.casesCount} cases</span>
                  </div>
                </div>
              ))}
            </section>

            {/* Active Agents */}
            <section className="admin-card" style={{ marginBottom: '16px' }}>
              <h2>Active Agents ({detail.assigned_agents.length})</h2>
              {detail.assigned_agents.length === 0 && <p style={{ opacity: 0.7 }}>No agents assigned.</p>}
              {detail.assigned_agents.map((a) => (
                <div key={a.user_id} className="orgdash-progress-row">
                  <strong>{a.first_name} {a.last_name}</strong>
                  <small style={{ opacity: 0.7 }}>{a.email}</small>
                </div>
              ))}
            </section>

            {/* Notes */}
            <section className="admin-card" style={{ marginBottom: '16px' }}>
              <h2>Notes</h2>
              {detail.notes.length === 0 && <p style={{ opacity: 0.7 }}>No notes yet.</p>}
              {detail.notes.map((note) => (
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
            </section>

            <PendingSignalsSection />

            {/* Evidence */}
            <section className="admin-card">
              <h2>Evidence</h2>
              {detail.evidence.length === 0 && <p style={{ opacity: 0.7 }}>No evidence uploaded.</p>}
              {detail.evidence.map((item) => (
                <div key={item.file_id} className="orgdash-progress-row">
                  <div className="orgdash-progress-meta" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span>{item.file_name}</span>
                      <span style={{ opacity: 0.6 }}>{item.processing_status}</span>
                      <span>{formatDate(item.upload_date)}</span>
                    </div>
                    <button type="button" className="admin-btn critical" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setConfirmDeleteEvidenceId(item.file_id)} disabled={loading}>Delete</button>
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
                <label htmlFor="admin-evidence-upload" className="edit-org-input" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <span style={{ opacity: evidenceFile ? 1 : 0.5 }}>{evidenceFile ? evidenceFile.name : 'Choose file to upload...'}</span>
                  <input id="admin-evidence-upload" type="file" accept="image/*,.pdf,.txt,.csv,.json" style={{ display: 'none' }} onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)} />
                </label>
                <button type="button" className="admin-btn primary" onClick={() => void handleUploadEvidence()} disabled={loading || !evidenceFile}>Upload</button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default AdminCaseDetail
