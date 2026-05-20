import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  agentGetCaseDetail, agentUpdateCase,
  agentCreateNote, agentUpdateNote, agentDeleteNote,
  agentUploadEvidence, agentDeleteEvidence,
  getActorsForCase,
  type AgentCaseDetailResponse, type Actor,
} from '../../helpers/agent/Cases'
import { useAuth } from '../../context/AuthContext'
import { useSignals } from '../../context/SignalContext'
import AgentLayout from './AgentLayout'
import { PendingSignalsSection } from '../shared/PendingSignalsSection'
import Graph from '../organization/graph'
import '../../styles/Admin/AdminLayout.css'
import { getCaseCorrelation, getConfirmedSignals, type CaseCorrelation, type ConfirmedSignal } from '../../helpers/org/Cases'

type CaseStatus = 'Solved' | 'Open' | 'Discarded' | 'Closed'

function normalizeStatus(s: string | undefined): CaseStatus {
  const v = s?.trim().toLowerCase()
  if (v === 'solved') return 'Solved'
  if (v === 'closed') return 'Closed'
  if (v === 'discarded') return 'Discarded'
  return 'Open'
}

const statusTone: Record<CaseStatus, string> = { Solved: 'good', Closed: 'good', Open: 'good', Discarded: 'critical' }
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

function AgentCaseDetail() {
  const { caseId = '' } = useParams<{ caseId: string }>()
  const { user } = useAuth()
  const { fetchSignalsForCase } = useSignals()
  const navigate = useNavigate()
  const agentId = Number((user as any)?.user_id ?? 0)
  const orgId = Number((user as any)?.org_id ?? 0)

  const [detail, setDetail] = useState<AgentCaseDetailResponse | null>(null)

  // edit case
  const [showEditForm, setShowEditForm] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  // notes
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')
  const [notesCollapsed, setNotesCollapsed] = useState(true)
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<number | null>(null)

  // evidence
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [uploadNote, setUploadNote] = useState('')
  const [confirmDeleteEvidenceId, setConfirmDeleteEvidenceId] = useState<string | null>(null)
  const [showUploadConfirm, setShowUploadConfirm] = useState(false)

  const [actors, setActors] = useState<Actor[]>([])
  const [actorsLoading, setActorsLoading] = useState(false)

  const [showGraph, setShowGraph] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [correlations, setCorrelations] = useState<CaseCorrelation[]>([])
  const [correlationsCollapsed, setCorrelationsCollapsed] = useState(true)

  const [confirmedSignals, setConfirmedSignals] = useState<ConfirmedSignal[]>([])
  const [confirmedCollapsed, setConfirmedCollapsed] = useState(true)

  useEffect(() => {
    if (!caseId) return
    getCaseCorrelation(caseId).then(setCorrelations).catch(() => setCorrelations([]))
    getConfirmedSignals(caseId).then(setConfirmedSignals).catch(() => setConfirmedSignals([]))
  }, [caseId])

  const loadDetail = async () => {
    setLoading(true)
    try {
      const res = await agentGetCaseDetail(caseId, agentId, orgId)
      setDetail(res)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load case')
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = () => {
    if (!detail) return
    setEditTitle(detail.case.title)
    setEditDueDate(detail.case.due_date ? detail.case.due_date.slice(0, 10) : '')
    setShowEditForm((p) => !p)
  }

  const handleEditCase = async () => {
    setLoading(true); setError(null)
    try {
      await agentUpdateCase(caseId, agentId, orgId, { title: editTitle, due_date: editDueDate })
      setSuccess('Case updated'); setShowEditForm(false); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to update case') } finally { setLoading(false) }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return
    setLoading(true); setError(null)
    try {
      await agentCreateNote(caseId, agentId, newNoteContent)
      setSuccess('Note added'); setNewNoteContent(''); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to add note') } finally { setLoading(false) }
  }

  const handleEditNote = async (noteId: number) => {
    if (!editNoteContent.trim()) return
    setLoading(true); setError(null)
    try {
      await agentUpdateNote(noteId, agentId, editNoteContent)
      setSuccess('Note updated'); setEditingNoteId(null); setEditNoteContent(''); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to update note') } finally { setLoading(false) }
  }

  const handleDeleteNote = async (noteId: number) => {
    setLoading(true); setError(null)
    try {
      await agentDeleteNote(noteId, agentId)
      setSuccess('Note deleted'); setConfirmDeleteNoteId(null); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to delete note') } finally { setLoading(false) }
  }

  const handleUploadEvidence = async () => {
    if (!evidenceFile) return
    setLoading(true); setError(null)
    try {
      await agentUploadEvidence(caseId, evidenceFile, agentId, uploadNote ||undefined)
      setSuccess('Evidence uploaded'); setEvidenceFile(null); setUploadNote('');void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to upload evidence') } finally { setLoading(false) }
  }

  const handleDeleteEvidence = async (fileId: string) => {
    setLoading(true); setError(null)
    try {
      await agentDeleteEvidence(fileId, agentId)
      setSuccess('Evidence deleted'); setConfirmDeleteEvidenceId(null); void loadDetail()
    } catch (err: any) { setError(err?.message ?? 'Failed to delete evidence') } finally { setLoading(false) }
  }

  useEffect(() => { void loadDetail() }, [caseId, agentId, orgId])
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
    <AgentLayout>
      {showGraph && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 18, 36, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '90vw', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0 }}>Signal Graph</h2>
              <button className="admin-btn" onClick={() => setShowGraph(false)}>Close</button>
            </div>
            <div style={{ flex: 1 }}>
              <Graph case_id={caseId} />
            </div>
          </div>
        </div>
      )}
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type="button" className="admin-btn" onClick={() => navigate('/AgentCases')}>← Back</button>
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
              <button type="button" className="admin-btn" onClick={openEditForm}>Edit</button>
              <button type="button" className="admin-btn" onClick={() => setShowGraph(true)}>Signal Graph</button>
            </div>

            {showEditForm && (
              <div className="admin-card" style={{ marginTop: '16px' }}>
                <h3>Edit Case</h3>
                <div className="edit-org-controls">
                  <label className="edit-org-control"><span>Title</span>
                    <input className="edit-org-input" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  </label>
                  <label className="edit-org-control"><span>Due Date</span>
                    <input className="edit-org-input" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button type="button" className="admin-btn primary" onClick={() => void handleEditCase()} disabled={loading || !editTitle.trim()}>Save</button>
                  <button type="button" className="admin-btn" onClick={() => setShowEditForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </section>

          {/* Case Info */}
          <section className="admin-card" style={{ marginBottom: '16px' }}>
            <h2>Case Info</h2>
            <div className="orgdash-progress-meta">
              <span>Case #: {detail.case.CaseNumber}</span>
              <span>Severity: {severityLabel[Number(detail.case.severity_level)] ?? detail.case.severity_level}</span>
              <span>Priority: {detail.case.priority}</span>
              <span>Opened: {formatDate(detail.case.created_at)}</span>
              {detail.case.due_date && <span>Due: {formatDate(detail.case.due_date)}</span>}
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

          {/* Evidence */}
          <section className="admin-card" style={{ marginBottom: '16px' }}>
            <h2>Evidence</h2>
            {detail.evidence.length === 0 && <p style={{ opacity: 0.7 }}>No evidence uploaded.</p>}
            {detail.evidence.map((ev) => (
              <div key={ev.file_id} className="orgdash-progress-row">
                <div style={{ flex: 1 }}>
                  <span>{ev.file_name}</span>
                  <small style={{ display: 'block', opacity: 0.6 }}>{ev.file_extension} · {formatDate(ev.upload_date)}</small>
                </div>
                {confirmDeleteEvidenceId === ev.file_id ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="admin-btn critical" onClick={() => void handleDeleteEvidence(ev.file_id)} disabled={loading}>Delete</button>
                    <button type="button" className="admin-btn" onClick={() => setConfirmDeleteEvidenceId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" className="admin-btn critical" onClick={() => setConfirmDeleteEvidenceId(ev.file_id)}>Delete</button>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
              <label htmlFor="agent-case-evidence-upload" className="edit-org-input" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <span style={{ opacity: evidenceFile ? 1 : 0.5 }}>{evidenceFile ? evidenceFile.name : 'Choose file to upload...'}</span>
                <input id="agent-case-evidence-upload" type="file" style={{ display: 'none' }} onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)} />
              </label>
              <button type="button" className="admin-btn primary" onClick={() => setShowUploadConfirm(true)} disabled={loading || !evidenceFile}>Upload</button>
            </div>
            {showUploadConfirm && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 18, 36, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#010b3d', borderRadius: '14px', padding: '28px', minWidth: '340px', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0, 2, 5, 0.22)', borderTop: '3px solid #2f4161' }}>
                  {loading ? (
                    <>
                      <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 650, color: '#f1f1f1' }}>Uploading...</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cad0df', fontSize: '14px' }}>
                        <div style={{ width: '20px', height: '20px', border: '2px solid #2f4161', borderTop: '2px solid #5b8dee', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Uploading...
                      </div>
                    </>
                  ) : success ? (
                    <>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>✓</div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 650, color: '#4ade80' }}>Upload Successful</h3>
                      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#616b79' }}>{success}</p>
                      <button className="admin-btn primary" onClick={() => { setShowUploadConfirm(false); setSuccess(null) }}>Done</button>
                    </>
                  ) : error ? (
                    <>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>✗</div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 650, color: '#f87171' }}>Upload Failed</h3>
                      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#616b79' }}>{error}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="admin-btn primary" onClick={() => { setError(null); void handleUploadEvidence() }}>Retry</button>
                        <button className="admin-btn" onClick={() => { setShowUploadConfirm(false); setError(null); setEvidenceFile(null) }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 650, color: '#f1f1f1' }}>Confirm Upload</h3>
                      <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#616b79' }}>
                        Upload <strong style={{ color: '#cad0df' }}>{evidenceFile?.name}</strong>?
                      </p>
                      <textarea
                        className="edit-org-input"
                        rows={3}
                        placeholder="Add context for the AI (optional)..."
                        value={uploadNote}
                        onChange={(e) => setUploadNote(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', marginBottom: '16px', fontSize: '13px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="admin-btn primary" onClick={() => { void handleUploadEvidence() }}>Confirm</button>
                        <button className="admin-btn" onClick={() => { setShowUploadConfirm(false); setEvidenceFile(null); setUploadNote('') }}>Cancel</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
          
          {/* Notes */}
          <section className="admin-card" style={{ marginBottom: '16px', borderLeft: '3px solid #fa0000' }}>
            <h2
              onClick={() => setNotesCollapsed(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
            >
              <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{detail.notes.length} Notes</span>
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
                          <button type="button" className="admin-btn" onClick={() => { setEditingNoteId(null); setEditNoteContent('') }}>Cancel</button>
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
                        {note.author_id === agentId && (
                          <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                            <button type="button" className="admin-btn" onClick={() => { setEditingNoteId(note.note_id); setEditNoteContent(note.content); setConfirmDeleteNoteId(null) }} disabled={loading}>Edit</button>
                            <button type="button" className="admin-btn critical" onClick={() => { setConfirmDeleteNoteId(note.note_id); setEditingNoteId(null) }} disabled={loading}>Delete</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div style={{ marginTop: '12px' }}>
                  <textarea className="edit-org-input" placeholder="Add a note..." value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box' }} />
                  <button type="button" className="admin-btn primary" style={{ marginTop: '8px' }} onClick={() => void handleAddNote()} disabled={loading || !newNoteContent.trim()}>Save New Note</button>
                </div>
              </>
            )}
          </section>

          <PendingSignalsSection />

          {/* Confirmed Signals */}
          {(
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
          )}

          {/* Related Cases */}
          {(
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
          )}
        </>
      )}
    </AgentLayout>
  )
}

export default AgentCaseDetail
