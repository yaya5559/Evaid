import { useEffect, useState, useMemo } from 'react'
<<<<<<< HEAD
import {
  agentGetCases, agentGetCaseDetail, agentUpdateCase, agentCreateCase,
  agentCreateNote, agentUpdateNote,
  agentUploadEvidence, agentConfirmEvidence, agentDeleteEvidence,
  type AgentCaseListItem, type AgentCaseDetailResponse,
=======
import { useNavigate } from 'react-router-dom'
import {
  agentGetCases, agentCreateCase, getActorsForCase,
  type AgentCaseListItem, type Actor,
>>>>>>> origin/main
} from '../../helpers/agent/Cases'
import { useAuth } from '../../context/AuthContext'
import AgentLayout from './AgentLayout'
import '../../styles/Admin/AdminLayout.css'

type CaseStatus = 'Solved' | 'Open' | 'Discarded' | 'Closed'

type CaseRecord = {
  id: string
  caseNumber?: string
  title: string
  createdAt: string
  status: CaseStatus
  severity: string | number
<<<<<<< HEAD
=======
  priority: string
>>>>>>> origin/main
  dueDate?: string
}

function normalizeStatus(status: string | undefined): CaseStatus {
<<<<<<< HEAD
  const s = status?.trim().toLowerCase()
  if (s === 'solved') return 'Solved'
  if (s === 'closed') return 'Closed'
  if (s === 'discarded') return 'Discarded'
  return 'Open'
}

const statusTone: Record<CaseStatus, string> = {
  Solved: 'good', Closed: 'good', Open: 'good', Discarded: 'critical',
}

const severityLabel: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

function formatDate(date: string | undefined | null) {
  if (!date) return '—'
  const d = new Date(date.slice(0, 10) + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
=======
    const s = status?.trim().toLowerCase()
    if (s === 'solved') return 'Solved'
    if (s === 'closed') return 'Closed'
    if (s === 'discarded') return 'Discarded'
    return 'Open'
}

const statusTone: Record<CaseStatus, string> = { Solved: 'good', Closed: 'good', Open: 'good', Discarded: 'critical' }
const severityLabel: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

function roleColor(role: string): string {
  if (role === 'Suspect') return 'critical'
  if (role === 'Person of Interest') return 'info'
  return 'neutral'
}

function formatDate(date: string | undefined | null) {
    if (!date) return '—'
    const d = new Date(date.slice(0, 10) + 'T00:00:00')
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
>>>>>>> origin/main
}

function toCaseRecord(item: AgentCaseListItem): CaseRecord {
  return {
    id: String(item.case_id),
    caseNumber: item.CaseNumber,
    title: item.title,
    createdAt: item.created_at,
    status: normalizeStatus(item.status),
    severity: item.severity_level,
<<<<<<< HEAD
=======
    priority: item.priority,
>>>>>>> origin/main
    dueDate: item.due_date || undefined,
  }
}

function AgentCases() {
  const { user } = useAuth()
<<<<<<< HEAD
=======
  const navigate = useNavigate()
>>>>>>> origin/main
  const agentId = Number((user as any)?.user_id ?? 0)
  const orgId = Number((user as any)?.org_id ?? 0)

  const [cases, setCases] = useState<CaseRecord[]>([])
<<<<<<< HEAD
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [caseDetail, setCaseDetail] = useState<AgentCaseDetailResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // create case
=======
  const [searchQuery, setSearchQuery] = useState('')

>>>>>>> origin/main
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCaseTitle, setNewCaseTitle] = useState('')
  const [newCaseDescription, setNewCaseDescription] = useState('')
  const [newCasePriority, setNewCasePriority] = useState('Medium')
  const [newCaseSeverity, setNewCaseSeverity] = useState('2')
  const [newCaseDueDate, setNewCaseDueDate] = useState('')

<<<<<<< HEAD
  // edit case
  const [showEditForm, setShowEditForm] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  // notes
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')

  // evidence
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [confirmDeleteEvidenceId, setConfirmDeleteEvidenceId] = useState<string | null>(null)

=======
>>>>>>> origin/main
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

<<<<<<< HEAD
  const loadCases = async () => {
    if (!agentId || !orgId) {
      setError('Session data missing. Please log out and log back in.')
      return
    }
    setLoading(true)
    setError(null)
=======
  const [actorsMap, setActorsMap] = useState<Record<string, Actor[]>>({})
  const [actorsLoading, setActorsLoading] = useState<Record<string, boolean>>({})
  const [expandedActors, setExpandedActors] = useState<Record<string, boolean>>({})

  const loadCases = async () => {
    if (!agentId || !orgId) { setError('Session data missing. Please log out and back in.'); return }
    setLoading(true); setError(null)
>>>>>>> origin/main
    try {
      const items = await agentGetCases(agentId, orgId)
      setCases(items.map(toCaseRecord))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
  const loadCaseDetail = async (caseId: string) => {
    setLoading(true)
    try {
      const res = await agentGetCaseDetail(caseId, agentId, orgId)
      setCaseDetail(res)
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
    setNewCaseSeverity('2')
    setNewCaseDueDate('')
=======
  const clearCreateForm = () => {
    setNewCaseTitle(''); setNewCaseDescription(''); setNewCasePriority('Medium'); setNewCaseSeverity('2'); setNewCaseDueDate('')
>>>>>>> origin/main
  }

  const handleCreateCase = async () => {
    if (!newCaseTitle.trim()) return
<<<<<<< HEAD
    setLoading(true)
    setError(null)
=======
    setLoading(true); setError(null)
>>>>>>> origin/main
    try {
      await agentCreateCase(agentId, orgId, {
        title: newCaseTitle,
        description: newCaseDescription || undefined,
        priority: newCasePriority,
        severity_level: newCaseSeverity,
        due_date: newCaseDueDate || undefined,
      })
<<<<<<< HEAD
      setSuccess('Case created successfully')
      clearCreateForm()
      setShowCreateForm(false)
=======
      setSuccess('Case created')
      clearCreateForm(); setShowCreateForm(false)
>>>>>>> origin/main
      void loadCases()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create case')
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
  const openEditForm = () => {
    if (!caseDetail) return
    setEditTitle(caseDetail.case.title)
    setEditDueDate(caseDetail.case.due_date ? caseDetail.case.due_date.slice(0, 10) : '')
    setShowEditForm((prev) => !prev)
  }

  const handleEditCase = async () => {
    setLoading(true)
    setError(null)
    try {
      await agentUpdateCase(selectedCaseId, agentId, orgId, {
        title: editTitle,
        due_date: editDueDate,
      })
      setSuccess('Case updated')
      setShowEditForm(false)
      void loadCaseDetail(selectedCaseId)
      void loadCases()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update case')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadEvidence = async () => {
    if (!evidenceFile) return
    setLoading(true)
    setError(null)
    try {
      const uploadRes = await agentUploadEvidence(selectedCaseId, evidenceFile, agentId)
      const fileId = uploadRes?.file_id ?? uploadRes?.FileId
      if (fileId) await agentConfirmEvidence(fileId)
      setSuccess('Evidence uploaded')
      setEvidenceFile(null)
      void loadCaseDetail(selectedCaseId)
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
      await agentDeleteEvidence(fileId, agentId)
      setSuccess('Evidence deleted')
      setConfirmDeleteEvidenceId(null)
      void loadCaseDetail(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete evidence')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return
    setLoading(true)
    setError(null)
    try {
      await agentCreateNote(selectedCaseId, agentId, newNoteContent)
      setSuccess('Note added')
      setNewNoteContent('')
      void loadCaseDetail(selectedCaseId)
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
      await agentUpdateNote(noteId, agentId, editNoteContent)
      setSuccess('Note updated')
      setEditingNoteId(null)
      setEditNoteContent('')
      void loadCaseDetail(selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadCases() }, [agentId, orgId])

  useEffect(() => {
    if (!selectedCaseId) return
    void loadCaseDetail(selectedCaseId)
  }, [selectedCaseId])

  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

=======
  const handleToggleActors = async (caseId: string) => {
    const nowExpanded = !expandedActors[caseId]
    setExpandedActors((prev) => ({ ...prev, [caseId]: nowExpanded }))
    if (nowExpanded && actorsMap[caseId] === undefined) {
      setActorsLoading((prev) => ({ ...prev, [caseId]: true }))
      try {
        const actors = await getActorsForCase(caseId)
        setActorsMap((prev) => ({ ...prev, [caseId]: actors }))
      } catch {
        setActorsMap((prev) => ({ ...prev, [caseId]: [] }))
      } finally {
        setActorsLoading((prev) => ({ ...prev, [caseId]: false }))
      }
    }
  }

>>>>>>> origin/main
  const filteredCases = useMemo(
    () => cases.filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.caseNumber ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [cases, searchQuery]
  )

<<<<<<< HEAD
  return (
    <AgentLayout>
      <div className='admin-page-header'>
        <h1>My Cases</h1>
      </div>

      {(error || success) && (
        <div className={`admin-banner ${error ? 'error' : 'success'}`}>
          {error ?? success}
        </div>
      )}

      <div className='orgdash-progress-layout'>
        {/* Case list */}
        <div className='orgdash-progress-panel'>
          <div className='admin-card' style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>Cases</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className='admin-pill neutral'>{cases.length} cases</span>
                <button
                  type='button'
                  className='admin-btn primary'
                  onClick={() => { setShowCreateForm((prev) => !prev); setSelectedCaseId(''); setCaseDetail(null) }}
                >
                  + New Case
                </button>
              </div>
            </div>
            <input
              className='edit-org-input'
              type='text'
              placeholder='Search cases...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Create case form */}
          {showCreateForm && (
            <div className='admin-card' style={{ marginBottom: '16px' }}>
              <h3>New Case</h3>
              <div className='edit-org-controls'>
                <label className='edit-org-control'>
                  <span>Title *</span>
                  <input className='edit-org-input' type='text' placeholder='Case title' value={newCaseTitle} onChange={(e) => setNewCaseTitle(e.target.value)} />
                </label>
                <label className='edit-org-control'>
                  <span>Description</span>
                  <textarea className='edit-org-input' rows={3} value={newCaseDescription} onChange={(e) => setNewCaseDescription(e.target.value)} />
                </label>
                <label className='edit-org-control'>
                  <span>Priority</span>
                  <select className='edit-org-input' value={newCasePriority} onChange={(e) => setNewCasePriority(e.target.value)}>
                    <option value='Low'>Low</option>
                    <option value='Medium'>Medium</option>
                    <option value='High'>High</option>
                    <option value='Critical'>Critical</option>
                  </select>
                </label>
                <label className='edit-org-control'>
                  <span>Severity</span>
                  <select className='edit-org-input' value={newCaseSeverity} onChange={(e) => setNewCaseSeverity(e.target.value)}>
                    <option value='1'>Low</option>
                    <option value='2'>Medium</option>
                    <option value='3'>High</option>
                    <option value='4'>Critical</option>
                  </select>
                </label>
                <label className='edit-org-control'>
                  <span>Due Date</span>
                  <input className='edit-org-input' type='date' value={newCaseDueDate} onChange={(e) => setNewCaseDueDate(e.target.value)} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type='button' className='admin-btn primary' onClick={() => void handleCreateCase()} disabled={loading || !newCaseTitle.trim()}>Create</button>
                <button type='button' className='admin-btn' onClick={() => { clearCreateForm(); setShowCreateForm(false) }}>Cancel</button>
              </div>
            </div>
          )}

          {loading && !caseDetail && <p style={{ opacity: 0.6 }}>Loading...</p>}
          {!loading && filteredCases.length === 0 && !showCreateForm && (
            <p style={{ opacity: 0.7 }}>No cases assigned to you.</p>
          )}

          <div className='orgdash-progress-list'>
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className={`orgdash-progress-row ${caseItem.id === selectedCaseId ? 'active' : ''}`}
                onClick={() => {
                  if (caseItem.id === selectedCaseId) {
                    setSelectedCaseId('')
                    setCaseDetail(null)
                  } else {
                    setSelectedCaseId(caseItem.id)
                    setShowCreateForm(false)
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className='orgdash-progress-main'>
                  <div className='orgdash-progress-title'>{caseItem.title}</div>
                  <div className='orgdash-progress-meta-row'>
                    <span className={`admin-pill ${statusTone[caseItem.status]}`}>{caseItem.status}</span>
                    {caseItem.dueDate && <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>Due {formatDate(caseItem.dueDate)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {caseDetail && (
          <div className='orgdash-progress-detail'>
            <div className='admin-card' style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ margin: 0 }}>{caseDetail.case.title}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`admin-pill ${statusTone[normalizeStatus(caseDetail.case.status)]}`}>
                    {caseDetail.case.status}
                  </span>
                  <button type='button' className='admin-btn' onClick={openEditForm}>Edit</button>
                </div>
              </div>
            </div>

            {/* Edit case form */}
            {showEditForm && (
              <div className='admin-card' style={{ marginBottom: '16px' }}>
                <h3>Edit Case</h3>
                <div className='edit-org-controls'>
                  <label className='edit-org-control'>
                    <span>Title</span>
                    <input className='edit-org-input' type='text' value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  </label>
                  <label className='edit-org-control'>
                    <span>Due Date</span>
                    <input className='edit-org-input' type='date' value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button type='button' className='admin-btn primary' onClick={() => void handleEditCase()} disabled={loading || !editTitle.trim()}>Save</button>
                  <button type='button' className='admin-btn' onClick={() => setShowEditForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Case meta */}
            <div className='orgdash-progress-meta'>
              <span>Case #: {caseDetail.case.CaseNumber}</span>
              <span>Severity: {severityLabel[Number(caseDetail.case.severity_level)] ?? caseDetail.case.severity_level}</span>
              <span>Priority: {caseDetail.case.priority}</span>
              <span>Opened: {formatDate(caseDetail.case.created_at)}</span>
              {caseDetail.case.due_date && <span>Due: {formatDate(caseDetail.case.due_date)}</span>}
            </div>

            {caseDetail.case.description && (
              <p style={{ marginTop: '12px' }}>{caseDetail.case.description}</p>
            )}

            {/* Evidence */}
            <h3 style={{ marginTop: '16px' }}>Evidence</h3>
            {caseDetail.evidence.length === 0 && <p style={{ opacity: 0.7 }}>No evidence uploaded.</p>}
            {caseDetail.evidence.map((ev) => (
              <div key={ev.file_id} className='orgdash-progress-row'>
                <div style={{ flex: 1 }}>
                  <span>{ev.file_name}</span>
                  <small style={{ display: 'block', opacity: 0.6 }}>{ev.file_extension} · {formatDate(ev.upload_date)}</small>
                </div>
                {confirmDeleteEvidenceId === ev.file_id ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type='button' className='admin-btn critical' onClick={() => void handleDeleteEvidence(ev.file_id)} disabled={loading}>Delete</button>
                    <button type='button' className='admin-btn' onClick={() => setConfirmDeleteEvidenceId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button type='button' className='admin-btn critical' onClick={() => setConfirmDeleteEvidenceId(ev.file_id)}>Delete</button>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
              <input
                type='file'
                onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                style={{ flex: 1, color: 'inherit' }}
              />
              <button type='button' className='admin-btn primary' onClick={() => void handleUploadEvidence()} disabled={loading || !evidenceFile}>
                Upload
              </button>
            </div>

            {/* Notes */}
            <h3 style={{ marginTop: '16px' }}>Notes</h3>
            {caseDetail.notes.length === 0 && <p style={{ opacity: 0.7 }}>No notes yet.</p>}
            {caseDetail.notes.map((note) => (
              <div key={note.note_id} className='orgdash-progress-row'>
                {editingNoteId === note.note_id ? (
                  <div style={{ width: '100%' }}>
                    <textarea
                      className='edit-org-input'
                      rows={3}
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button type='button' className='admin-btn primary' onClick={() => void handleEditNote(note.note_id)} disabled={loading || !editNoteContent.trim()}>Save</button>
                      <button type='button' className='admin-btn' onClick={() => { setEditingNoteId(null); setEditNoteContent('') }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0 }}>{note.content}</p>
                      <small style={{ opacity: 0.6 }}>{note.author_first_name} {note.author_last_name} · {formatDate(note.created_at)}</small>
                    </div>
                    {note.author_id === agentId && (
                      <button
                        type='button'
                        className='admin-btn'
                        style={{ marginLeft: '8px' }}
                        onClick={() => { setEditingNoteId(note.note_id); setEditNoteContent(note.content) }}
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Add note */}
            <div style={{ marginTop: '12px' }}>
              <textarea
                className='edit-org-input'
                rows={3}
                placeholder='Add a note...'
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <button
                type='button'
                className='admin-btn primary'
                style={{ marginTop: '8px' }}
                onClick={() => void handleAddNote()}
                disabled={loading || !newNoteContent.trim()}
              >
                Add Note
              </button>
            </div>
          </div>
        )}
      </div>
=======
  useEffect(() => { void loadCases() }, [agentId, orgId])

  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => { setSuccess(null); setError(null) }, 4000)
    return () => clearTimeout(t)
  }, [success, error])

  return (
    <AgentLayout>
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">Agent console</div>
          <h1 className="admin-title">My Cases</h1>
        </div>
      </header>

      {(error || success) && (
        <div className={`admin-banner ${error ? 'error' : 'success'}`}>{error ?? success}</div>
      )}

      <section className="admin-card">
        <div className="orgdash-card-head">
          <h2>Cases</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="admin-pill neutral">{cases.length} cases</span>
            <button type="button" className="admin-btn primary" onClick={() => setShowCreateForm((p) => !p)}>
              + New Case
            </button>
          </div>
        </div>

        <input
          className="edit-org-input"
          type="text"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '12px' }}
        />

        {showCreateForm && (
          <div className="admin-card" style={{ marginBottom: '16px' }}>
            <h3>New Case</h3>
            <div className="edit-org-controls">
              <label className="edit-org-control"><span>Title *</span><input className="edit-org-input" type="text" placeholder="Case title" value={newCaseTitle} onChange={(e) => setNewCaseTitle(e.target.value)} /></label>
              <label className="edit-org-control"><span>Description</span><textarea className="edit-org-input" rows={3} value={newCaseDescription} onChange={(e) => setNewCaseDescription(e.target.value)} /></label>
              <label className="edit-org-control"><span>Priority</span>
                <select className="edit-org-input" value={newCasePriority} onChange={(e) => setNewCasePriority(e.target.value)}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                </select>
              </label>
              <label className="edit-org-control"><span>Severity</span>
                <select className="edit-org-input" value={newCaseSeverity} onChange={(e) => setNewCaseSeverity(e.target.value)}>
                  <option value="1">Low</option><option value="2">Medium</option><option value="3">High</option><option value="4">Critical</option>
                </select>
              </label>
              <label className="edit-org-control"><span>Due Date</span><input className="edit-org-input" type="date" value={newCaseDueDate} onChange={(e) => setNewCaseDueDate(e.target.value)} /></label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="admin-btn primary" onClick={() => void handleCreateCase()} disabled={loading || !newCaseTitle.trim()}>Create</button>
              <button type="button" className="admin-btn" onClick={() => { clearCreateForm(); setShowCreateForm(false) }}>Cancel</button>
            </div>
          </div>
        )}

        {loading && <p style={{ opacity: 0.6 }}>Loading...</p>}
        {!loading && filteredCases.length === 0 && !showCreateForm && <p style={{ opacity: 0.7 }}>No cases assigned to you.</p>}

        <div className="orgdash-progress-list">
          {filteredCases.map((c) => (
            <div key={c.id} className="orgdash-progress-row">
              <div className="orgdash-progress-main" style={{ flex: 1 }}>
                <div className="orgdash-progress-title">
                  <strong>{c.title}</strong>
                  {c.caseNumber && <small>{c.caseNumber}</small>}
                </div>
                <div className="orgdash-progress-meta" style={{ marginTop: '4px' }}>
                  <span className={`admin-pill ${statusTone[c.status]}`}>{c.status}</span>
                  <span>Severity: {severityLabel[Number(c.severity)] ?? c.severity}</span>
                  <span>Priority: {c.priority}</span>
                  {c.dueDate && <span>Due: {formatDate(c.dueDate)}</span>}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                    onClick={() => void handleToggleActors(c.id)}
                  >
                    {expandedActors[c.id] ? 'Hide Actors' : 'Show Actors'}
                    {actorsMap[c.id] !== undefined && ` (${actorsMap[c.id].length})`}
                  </button>
                </div>

                {expandedActors[c.id] && (
                  <div style={{ marginTop: '8px' }}>
                    {actorsLoading[c.id] && <p style={{ opacity: 0.6, fontSize: '0.85rem', margin: 0 }}>Loading actors...</p>}
                    {!actorsLoading[c.id] && actorsMap[c.id]?.length === 0 && (
                      <p style={{ opacity: 0.6, fontSize: '0.85rem', margin: 0 }}>No actors linked to this case.</p>
                    )}
                    {!actorsLoading[c.id] && actorsMap[c.id]?.map((actor) => (
                      <div key={actor.id} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: '6px', padding: '8px 12px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{actor.primaryName}</strong>
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
                  </div>
                )}
              </div>
              <button
                type="button"
                className="admin-btn primary"
                style={{ marginLeft: '12px', flexShrink: 0, alignSelf: 'flex-start' }}
                onClick={() => navigate(`/AgentCase/${c.id}`)}
              >
                Work on Case
              </button>
            </div>
          ))}
        </div>
      </section>
>>>>>>> origin/main
    </AgentLayout>
  )
}

export default AgentCases
