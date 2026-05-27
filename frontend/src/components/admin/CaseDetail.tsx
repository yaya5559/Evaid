// Abenezer Abraham

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCaseDetails, updateCase, closeCase, deleteCase,
  getOrgAgents, assignAgent,
  createNote, updateNote, deleteNote,
  uploadEvidence, deleteEvidence,
  getActorsForCase,
  type CaseDetailResponse, type OrgAgent, type Actor,
} from '../../helpers/admin/Cases'
import { useAuth } from '../../context/AuthContext'
import { useSignals } from '../../context/SignalContext'
import Nav from './Nav'
import { PendingSignalsSection } from '../shared/PendingSignalsSection'
import { EvidenceSection, EvidenceUploadSection } from '../shared/EvidenceSection'
import { GraphFAB } from '../shared/GraphDrawer'
import '../../styles/Admin/AdminLayout.css'
import { getCaseCorrelation, getConfirmedSignals, type CaseCorrelation, type ConfirmedSignal } from '../../helpers/org/Cases'

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
  const { fetchSignalsForCase, lastTriagedAt } = useSignals()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<CaseDetailResponse | null>(null)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateDescription, setUpdateDescription] = useState('')
  const [updatePriority, setUpdatePriority] = useState('')
  const [updateSeverity, setUpdateSeverity] = useState('')
  const [updateDueDate, setUpdateDueDate] = useState('')
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [closeResolution, setCloseResolution] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [orgAgents, setOrgAgents] = useState<OrgAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<number | null>(null)
  const [actors, setActors] = useState<Actor[]>([])
  const [actorsLoading, setActorsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notesCollapsed, setNotesCollapsed] = useState(true)
  const [correlations, setCorrelations] = useState<CaseCorrelation[]>([])
  const [correlationsCollapsed, setCorrelationsCollapsed] = useState(true)
  const [confirmedSignals, setConfirmedSignals] = useState<ConfirmedSignal[]>([])
  const [confirmedCollapsed, setConfirmedCollapsed] = useState(true)

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

  const handleUploadEvidence = async (file: File, _agentContext: string) => {
    await uploadEvidence(caseId, file, Number((user as any)?.user_id ?? 0))
    setSuccess('Evidence uploaded')
    void loadDetail()
  }

  const handleDeleteEvidence = async (fileId: string) => {
    await deleteEvidence(fileId)
    setSuccess('Evidence deleted')
    void loadDetail()
  }

  useEffect(() => { void loadDetail() }, [orgId, caseId])
  useEffect(() => { if (caseId) void fetchSignalsForCase(caseId) }, [caseId])
  useEffect(() => {
    if (!caseId) return
    getCaseCorrelation(caseId).then(setCorrelations).catch(() => setCorrelations([]))
    getConfirmedSignals(caseId).then(setConfirmedSignals).catch(() => setConfirmedSignals([]))
  }, [caseId, lastTriagedAt])
  useEffect(() => {
    if (!caseId) return
    setActorsLoading(true)
    getActorsForCase(caseId).then(setActors).catch(() => setActors([])).finally(() => setActorsLoading(false))
  }, [caseId])
  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

  return (
    <div className="admin-shell">
      <aside className="admin-left"><Nav /></aside>
      <GraphFAB graphPath={`/Cases/${orgId}/${caseId}/graph`} />
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
                  setShowUpdateForm(false); setShowCloseForm(false); setShowDeleteConfirm(false); setShowAssignForm(false)
                }}>Resolve</button>
                <button type="button" className="admin-btn" onClick={() => void openAssignForm()}>Assign Agent</button>
                <button type="button" className="admin-btn critical" onClick={() => {
                  setShowDeleteConfirm((p) => !p)
                  setShowUpdateForm(false); setShowCloseForm(false); setShowCloseConfirm(false); setShowAssignForm(false)
                }}>Delete</button>
              </div>

              {showUpdateForm && (
                <div className="admin-card" style={{ marginTop: '16px' }}>
                  <h3>Edit Case</h3>
                  <div className="edit-org-controls">
                    <label className="edit-org-control"><span>Title</span><input className="edit-org-input" type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} /></label>
                    <label className="edit-org-control"><span>Description</span><textarea className="edit-org-input" rows={3} value={updateDescription} onChange={(e) => setUpdateDescription(e.target.value)} /></label>
                    <label className="edit-org-control"><span>Priority</span>
                      <select className="edit-org-input" value={updatePriority} onChange={(e) => setUpdatePriority(e.target.value)}>
                        <option value="">—</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                      </select>
                    </label>
                    <label className="edit-org-control"><span>Severity</span>
                      <select className="edit-org-input" value={updateSeverity} onChange={(e) => setUpdateSeverity(e.target.value)}>
                        <option value="">—</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
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

              {showAssignForm && (
                <div className="admin-card" style={{ marginTop: '16px' }}>
                  <h3>Assign Agent</h3>
                  {orgAgents.length === 0 ? <p style={{ opacity: 0.7 }}>No agents found.</p> : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
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

            <EvidenceUploadSection onUpload={handleUploadEvidence} />

            <EvidenceSection
              evidence={detail.evidence}
              loading={loading}
              onDelete={handleDeleteEvidence}
              previewRoute="/admin/evidence/preview"
            />

            <section className="admin-card" style={{ marginBottom: '16px', borderLeft: '3px solid #fa0000' }}>
              <h2
                onClick={() => setNotesCollapsed(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
              >
                Notes
                <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{detail.notes.length}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: notesCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </h2>
              {notesCollapsed && (
                <>
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
                </>
              )}
            </section>

            <PendingSignalsSection />

            <section className="admin-card" style={{ marginBottom: '16px', borderLeft: '3px solid #16a34a' }}>
              <h2
                onClick={() => setConfirmedCollapsed(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
              >
                Confirmed Signals
                <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{confirmedSignals.length}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: confirmedCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </h2>
              {!confirmedCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {confirmedSignals.map((s) => (
                    <div key={s.id} className="orgdash-progress-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{s.signal_type.replace(/_/g, ' ')}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{s.raw_value}</span>
                        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '0.85rem', color: s.confidence >= 0.75 ? '#16a34a' : s.confidence >= 0.5 ? '#d97706' : '#dc2626' }}>
                          {Math.round(s.confidence * 100)}%
                        </span>
                      </div>
                      {s.normalized_value && s.normalized_value !== s.raw_value && (
                        <small style={{ opacity: 0.6 }}>Normalized: {s.normalized_value}</small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="admin-card" style={{ marginBottom: '16px', borderLeft: '3px solid #7c3aed' }}>
              <h2
                onClick={() => setCorrelationsCollapsed(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
              >
                Related Cases
                <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{correlations.length} correlation{correlations.length !== 1 ? 's' : ''}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: correlationsCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </h2>
              {!correlationsCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {correlations.map((c, i) => (
                    <div key={i} className="orgdash-progress-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{c.related_case_title}</strong>
                        <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{c.related_case_status}</span>
                        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '0.85rem', color: c.confidence >= 0.75 ? '#16a34a' : c.confidence >= 0.5 ? '#d97706' : '#dc2626' }}>
                          {Math.round(c.confidence * 100)}%
                        </span>
                      </div>
                      <small style={{ opacity: 0.65 }}>
                        Shared: <span style={{ fontFamily: 'monospace' }}>{c.signal_type.replace(/_/g, ' ')} — {c.shared_value}</span>
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default AdminCaseDetail
