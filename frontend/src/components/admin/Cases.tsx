// Abenezer Abraham

import { useEffect, useState, useMemo } from 'react'
import { adminGetOrgCases, getCaseDetails, createCase, updateCase, closeCase, deleteCase, getOrgAgents, assignAgent, createNote, updateNote, deleteNote, uploadEvidence, confirmEvidence, deleteEvidence, type CaseListItem, type CaseDetailResponse, type OrgAgent } from '../../helpers/admin/Cases';
import { getOrganizations, type OrganizationListItem} from '../../helpers/admin/organizations';
import { useAuth } from '../../context/AuthContext';
import Nav from "./Nav";
import '../../styles/Admin/AdminLayout.css'

type Organization = {
  id: string
  name: string
}

type CaseStatus = 'Solved' | 'Open' | 'Discarded'

type CaseRecord = {
  id: string
  caseNumber?: string
  orgId: string
  title: string
  createdAt: string
  status: CaseStatus
  severity: string
  dueDate?: string
}

function normalizeStatus(status: string | undefined): CaseStatus {
  const normalized = status?.trim().toLowerCase()
  if (normalized === 'solved') return 'Solved'
  if (normalized === 'discarded') return 'Discarded'
  return 'Open'
}

const severityLabel: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }

const statusTone: Record<CaseStatus, string> = {
  Solved: 'good',
  Open: 'good',
  Discarded: 'critical',
}

function formatDate(date: string | undefined | null) {
  if (!date) return '—'
  const d = new Date(date.slice(0, 10) + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function toRecordOrganizations(item: OrganizationListItem): Organization {
  const id = String(item.id)
  const name = item.name.trim()

  return {
    id,
    name,
  }
}

function toCaseRecord(item: CaseListItem): CaseRecord {
  return {
    id: String(item.case_id),
    caseNumber: item.CaseNumber,
    orgId: String(item.org_id),
    title: item.title,
    createdAt: item.created_at,
    status: normalizeStatus(item.status),
    severity: item.severity_level,
    dueDate: item.due_date || undefined,
  }
}


function OrgCaseProgress() {
  const { user } = useAuth()

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [searchQuery, setSearchOrgQuery] = useState('')

  const [cases, setCases] = useState<CaseRecord[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [caseDetail, setCaseDetail] = useState<CaseDetailResponse | null>(null)
  const [caseStatusFilter, setCaseStatusFilter] = useState<'all' | CaseStatus>('all')
  const [caseForm, setCaseForm] = useState<CaseListItem | null>(null)
  const [caseSearchQuery, setCaseSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCaseTitle, setNewCaseTitle] = useState('')
  const [newCaseDescription, setNewCaseDescription] = useState('')
  const [newCasePriority, setNewCasePriority] = useState('Medium')
  const [newCaseSeverity, setNewCaseSeverity] = useState('Medium')
  const [newCaseDueDate, setNewCaseDueDate] = useState('')

  // update form state
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateDescription, setUpdateDescription] = useState('')
  const [updatePriority, setUpdatePriority] = useState('')
  const [updateSeverity, setUpdateSeverity] = useState('')
  const [updateDueDate, setUpdateDueDate] = useState('')

  // close/resolve form state
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [closeResolution, setCloseResolution] = useState('')

  // delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // add note state
  const [newNoteContent, setNewNoteContent] = useState('')

  // edit note state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteContent, setEditNoteContent] = useState('')

  // delete note confirmation state
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<number | null>(null)

  // close case confirmation state
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  // evidence upload state
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [confirmDeleteEvidenceId, setConfirmDeleteEvidenceId] = useState<string | null>(null)

  // assign agent state
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [orgAgents, setOrgAgents] = useState<OrgAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)


  const loadOrganization = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getOrganizations()
      const mapped = response.map(toRecordOrganizations)
      
      if (mapped.length === 0) throw new Error('No organizations were returned from the API.')

      setOrganizations(mapped)
      setSelectedOrgId((current) => (current && mapped.some((org) => org.id === current) ? current : mapped[0].id))
    } catch {
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const loadCases = async (orgId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminGetOrgCases(orgId)
      const mapped = response.map(toCaseRecord)
      setCases(mapped)
    } catch {
      setError('Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

  const loadCaseDetails = async (orgId: string, caseId: string) => {
    setLoading(true)
    try {
      const response = await getCaseDetails(orgId, caseId)
      if (!response.case) {
        setError(response.message ?? 'Case not found')
        return
      }
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
    try {
      await createCase(selectedOrgId, Number((user as any)?.user_id ?? 0), {
        case_number: `CASE-${Date.now()}`,
        title: newCaseTitle,
        description: newCaseDescription,
        org_id: Number(selectedOrgId),
        status: 'Open',
        priority: newCasePriority,
        severity_level: newCaseSeverity,
        due_date: newCaseDueDate || undefined,
      })
      setSuccess('Case created successfully')
      clearCreateForm()
      setShowCreateForm(false)
      void loadCases(selectedOrgId)
    } catch {
      setError('Failed to create case')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!caseDetail) return
    setLoading(true)
    setError(null)
    try {
      const severityMap: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 }
      await updateCase(selectedOrgId, selectedCaseId, {
        title: updateTitle || undefined,
        description: updateDescription || undefined,
        priority: updatePriority || undefined,
        severity_level: updateSeverity ? String(severityMap[updateSeverity] ?? updateSeverity) : undefined,
        due_date: updateDueDate || undefined,
      })
      setSuccess('Case updated successfully')
      setShowUpdateForm(false)
      void loadCaseDetails(selectedOrgId, selectedCaseId)
    } catch {
      setError('Failed to update case')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    if (!caseDetail) return
    setLoading(true)
    setError(null)
    try {
      await closeCase(selectedOrgId, {
        case_id: caseDetail.case.case_id,
        status: 'Solved',
        resolution: closeResolution,
        closed_by_user_id: Number((user as any)?.user_id ?? 0),
      })
      setSuccess('Case closed successfully')
      setShowCloseForm(false)
      void loadCases(selectedOrgId)
      void loadCaseDetails(selectedOrgId, selectedCaseId)
    } catch {
      setError('Failed to close case')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      await deleteCase(selectedOrgId, selectedCaseId, Number((user as any)?.user_id ?? 0))
      setSuccess('Case deleted')
      setShowDeleteConfirm(false)
      setSelectedCaseId('')
      setCaseDetail(null)
      void loadCases(selectedOrgId)
    } catch {
      setError('Failed to delete case')
    } finally {
      setLoading(false)
    }
  }

  const openAssignForm = async () => {
    setShowAssignForm((prev) => !prev)
    setShowUpdateForm(false)
    setShowCloseForm(false)
    setShowDeleteConfirm(false)
    if (orgAgents.length === 0) {
      try {
        const agents = await getOrgAgents(selectedOrgId)
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
      await assignAgent(selectedOrgId, selectedCaseId, selectedAgentId, Number((user as any)?.user_id ?? 0))
      setSuccess('Agent assigned successfully')
      setShowAssignForm(false)
      setSelectedAgentId(null)
      void loadCaseDetails(selectedOrgId, selectedCaseId)
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
      await createNote(selectedCaseId, newNoteContent, Number((user as any)?.user_id ?? 0))
      setSuccess('Note added')
      setNewNoteContent('')
      void loadCaseDetails(selectedOrgId, selectedCaseId)
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
      await updateNote(noteId, editNoteContent)
      setSuccess('Note updated')
      setEditingNoteId(null)
      setEditNoteContent('')
      void loadCaseDetails(selectedOrgId, selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadEvidence = async () => {
    if (!evidenceFile || !caseDetail) return
    setLoading(true)
    setError(null)
    try {
      const result = await uploadEvidence(selectedCaseId, evidenceFile, Number((user as any)?.user_id ?? 0))
      await confirmEvidence(result.file_id)
      setSuccess('Evidence uploaded successfully')
      setEvidenceFile(null)
      void loadCaseDetails(selectedOrgId, selectedCaseId)
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
      await deleteEvidence(fileId)
      setSuccess('Evidence deleted')
      setConfirmDeleteEvidenceId(null)
      void loadCaseDetails(selectedOrgId, selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete evidence')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    setLoading(true)
    setError(null)
    try {
      await deleteNote(noteId)
      setSuccess('Note deleted')
      setConfirmDeleteNoteId(null)
      void loadCaseDetails(selectedOrgId, selectedCaseId)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete note')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrganization()
  }, [])

  const selectedOrg = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  )

  useEffect(() => {
    setShowCreateForm(false)
    setSelectedCaseId('')
    setCaseDetail(null)
    if (!selectedOrg) {
        setCases([])
        return
    }
    void loadCases(selectedOrg.id)
  }, [selectedOrg])

  const filteredOrganizations = organizations.filter((org) => {
    const query = searchQuery.toLowerCase()
    return (
      org.name.toLowerCase().includes(query)
    )
  }).sort((a, b) => a.name.localeCompare(b.name))

const selectedCases = useMemo(
  () => cases.filter((c) => c.orgId === selectedOrgId),
  [cases, selectedOrgId]
)

const selectedCase = useMemo(
  () => cases.find((selectedCase) => selectedCase.id === selectedCaseId),
  [cases, selectedCaseId]
)

const filteredCases = useMemo(
  () => selectedCases.filter((c) =>
    c.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
    (c.caseNumber ?? '').toLowerCase().includes(caseSearchQuery.toLowerCase())
  ),
  [selectedCases, caseSearchQuery]
)
useEffect(() => {
  if (!selectedCase) return
  void loadCaseDetails(selectedOrgId, selectedCaseId)
}, [cases, selectedCaseId])

  return (
    <div className="admin-shell">
      <aside className="admin-left">
        <Nav />
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <div className="admin-eyebrow">Organization console</div>
            <h1 className="admin-title">Case Progress</h1>
            <p className="admin-subtext">
              Monitor case activity across connected organizations.
            </p>
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

        <div>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '650px 1fr',
            gap: '24px',
          }}
        >
          {/* left card - organizations */}
          <aside className="admin-card">
            <div className="edit-org-panel-head">
              <h2>Organizations</h2>
              <span className="admin-pill info">
                {organizations.length} total
              </span>
            </div>

            {/* search */}
            <div className="edit-org-controls">
              <label className="edit-org-control">
                <span>Search</span>
                <input
                  className="edit-org-input"
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchOrgQuery(e.target.value)}
                />
              </label>
            </div>

            {/* organizations list */}
            <div className="edit-org-list">
              {filteredOrganizations.map((org) => (
                <button
                  key={org.id}
                  className={`edit-org-item ${
                    org.id === selectedOrgId ? 'active' : ''
                  }`}
                  onClick={() => setSelectedOrgId(org.id)}
                  type="button"
                >
                  <div className="edit-org-item-main">
                    <strong>{org.name}</strong>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* right card cases */}
          <section className="admin-card">
            <div className="orgdash-card-head">
              <h2>{selectedOrg?.name} Cases</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="admin-pill neutral">
                  {selectedCases.length} cases
                </span>
                <button
                  type="button"
                  className="admin-btn primary"
                  onClick={() => { setShowCreateForm((prev) => !prev); setSelectedCaseId(''); setCaseDetail(null) }}
                  disabled={!selectedOrg}
                >
                  + New Case
                </button>
              </div>
            </div>

            {/* case search */}
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

            {/* create case form */}
            {showCreateForm && (
              <div className="admin-card" style={{ marginBottom: '16px' }}>
                <h3>New Case</h3>
                <div className="edit-org-controls">
                  <label className="edit-org-control">
                    <span>Title</span>
                    <input
                      className="edit-org-input"
                      type="text"
                      placeholder="Case title"
                      value={newCaseTitle}
                      onChange={(e) => setNewCaseTitle(e.target.value)}
                    />
                  </label>
                  <label className="edit-org-control">
                    <span>Description</span>
                    <input
                      className="edit-org-input"
                      type="text"
                      placeholder="Case description"
                      value={newCaseDescription}
                      onChange={(e) => setNewCaseDescription(e.target.value)}
                    />
                  </label>
                  <label className="edit-org-control">
                    <span>Priority</span>
                    <select
                      className="edit-org-input"
                      value={newCasePriority}
                      onChange={(e) => setNewCasePriority(e.target.value)}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </label>
                  <label className="edit-org-control">
                    <span>Severity</span>
                    <select
                      className="edit-org-input"
                      value={newCaseSeverity}
                      onChange={(e) => setNewCaseSeverity(e.target.value)}
                    >
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
                      value={newCaseDueDate}
                      onChange={(e) => setNewCaseDueDate(e.target.value)}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="admin-btn primary"
                    onClick={() => void handleCreateCase()}
                    disabled={loading || !newCaseTitle.trim()}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => { clearCreateForm(); setShowCreateForm(false) }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedCases.length === 0 && (
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

                    <span
                      className={`admin-pill ${statusTone[caseItem.status]}`}
                    >
                      {caseItem.status}
                    </span>
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
                  <button type="button" className="admin-btn" onClick={() => {
                    setUpdateTitle(caseDetail.case.title)
                    setUpdateDescription(caseDetail.case.description)
                    setUpdatePriority(caseDetail.case.priority ?? '')
                    setUpdateSeverity(severityLabel[Number(caseDetail.case.severity_level)] ?? '')
                    setUpdateDueDate((caseDetail.case.due_date ?? '').slice(0, 10))
                    setShowUpdateForm((prev) => !prev)
                    setShowCloseForm(false)
                    setShowDeleteConfirm(false)
                    setShowAssignForm(false)
                  }}>
                    Edit
                  </button>
                  <button type="button" className="admin-btn primary" onClick={() => {
                    setShowCloseConfirm((prev) => !prev)
                    setShowCloseForm(false)
                    setShowUpdateForm(false)
                    setShowDeleteConfirm(false)
                    setShowAssignForm(false)
                  }}>
                    Resolve
                  </button>
                  <button type="button" className="admin-btn" onClick={() => void openAssignForm()}>
                    Assign Agent
                  </button>
                  <button type="button" className="admin-btn critical" onClick={() => {
                    setShowDeleteConfirm((prev) => !prev)
                    setShowUpdateForm(false)
                    setShowCloseForm(false)
                    setShowAssignForm(false)
                  }}>
                    Delete
                  </button>
                </div>
              </div>

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
                    <button
                      type="button"
                      className="admin-btn primary"
                      onClick={() => void handleAssign()}
                      disabled={loading || !selectedAgentId}
                    >
                      Assign
                    </button>
                    <button type="button" className="admin-btn" onClick={() => { setShowAssignForm(false); setSelectedAgentId(null) }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* update form */}
              {showUpdateForm && (
                <div className="admin-card" style={{ marginBottom: '16px' }}>
                  <h3>Edit Case</h3>
                  <div className="edit-org-controls">
                    <label className="edit-org-control">
                      <span>Title</span>
                      <input className="edit-org-input" type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} />
                    </label>
                    <label className="edit-org-control">
                      <span>Description</span>
                      <input className="edit-org-input" type="text" value={updateDescription} onChange={(e) => setUpdateDescription(e.target.value)} />
                    </label>
                    <label className="edit-org-control">
                      <span>Priority</span>
                      <select className="edit-org-input" value={updatePriority} onChange={(e) => setUpdatePriority(e.target.value)}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </label>
                    <label className="edit-org-control">
                      <span>Severity</span>
                      <select className="edit-org-input" value={updateSeverity} onChange={(e) => setUpdateSeverity(e.target.value)}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </label>
                    <label className="edit-org-control">
                      <span>Due Date</span>
                      <input className="edit-org-input" type="date" value={updateDueDate} onChange={(e) => setUpdateDueDate(e.target.value)} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" className="admin-btn primary" onClick={() => void handleUpdate()} disabled={loading}>Save</button>
                    <button type="button" className="admin-btn" onClick={() => setShowUpdateForm(false)}>Cancel</button>
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
                <span>Severity: {caseDetail.case.severity_level}</span>
                <span>Priority: {caseDetail.case.priority}</span>
                <span>Opened: {formatDate(caseDetail.case.created_at)}</span>
                {caseDetail.case.due_date && <span>Due: {formatDate(caseDetail.case.due_date)}</span>}
                <span>Created by: {caseDetail.case.creator_first_name} {caseDetail.case.creator_last_name}</span>
              </div>

              <p style={{ marginTop: '12px' }}>{caseDetail.case.description}</p>

              {/* assigned agents */}
              <h3 style={{ marginTop: '16px' }}>Assigned Agents</h3>
              {caseDetail.assigned_agents.length === 0 && (
                <p style={{ opacity: 0.7 }}>No agents assigned.</p>
              )}
              {caseDetail.assigned_agents.map((agent) => (
                <div key={agent.user_id} className="orgdash-progress-row">
                  <strong>{agent.first_name} {agent.last_name}</strong>
                  <small>{agent.email}</small>
                </div>
              ))}

              {/* notes */}
              <h3 style={{ marginTop: '16px' }}>Notes</h3>
              {caseDetail.notes.length === 0 && (
                <p style={{ opacity: 0.7 }}>No notes yet.</p>
              )}
              {caseDetail.notes.map((note) => (
                <div key={note.note_id} className="orgdash-progress-row">
                  <div className="orgdash-progress-meta" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span>{note.author_first_name} {note.author_last_name}</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="admin-btn"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        onClick={() => {
                          setEditingNoteId(note.note_id)
                          setEditNoteContent(note.content)
                          setConfirmDeleteNoteId(null)
                        }}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn critical"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        onClick={() => { setConfirmDeleteNoteId(note.note_id); setEditingNoteId(null) }}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {confirmDeleteNoteId === note.note_id ? (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem' }}>Delete this note?</span>
                      <button type="button" className="admin-btn critical" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => void handleDeleteNote(note.note_id)} disabled={loading}>Yes, Delete</button>
                      <button type="button" className="admin-btn" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setConfirmDeleteNoteId(null)}>Cancel</button>
                    </div>
                  ) : editingNoteId === note.note_id ? (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea
                        className="edit-org-input"
                        value={editNoteContent}
                        onChange={(e) => setEditNoteContent(e.target.value)}
                        rows={2}
                        style={{ flex: 1, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button type="button" className="admin-btn primary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => void handleEditNote(note.note_id)} disabled={loading || !editNoteContent.trim()}>Save</button>
                        <button type="button" className="admin-btn" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setEditingNoteId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p>{note.content}</p>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'flex-start' }}>
                <textarea
                  className="edit-org-input"
                  placeholder="Add a note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={2}
                  style={{ flex: 1, resize: 'vertical' }}
                />
                <button
                  type="button"
                  className="admin-btn primary"
                  onClick={() => void handleAddNote()}
                  disabled={loading || !newNoteContent.trim()}
                >
                  Add Note
                </button>
              </div>

              {/* evidence */}
              <h3 style={{ marginTop: '16px' }}>Evidence</h3>
              {caseDetail.evidence.length === 0 && (
                <p style={{ opacity: 0.7 }}>No evidence uploaded.</p>
              )}
              {caseDetail.evidence.map((item) => (
                <div key={item.file_name} className="orgdash-progress-row">
                  <div className="orgdash-progress-meta" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span>{item.file_name}</span>
                      <span style={{ opacity: 0.6 }}>{item.processing_status}</span>
                      <span>{formatDate(item.upload_date)}</span>
                    </div>
                    <button
                      type="button"
                      className="admin-btn critical"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => setConfirmDeleteEvidenceId(item.file_id)}
                      disabled={loading}
                    >
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
                <label htmlFor="evidence-upload" className="edit-org-input" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <span style={{ opacity: evidenceFile ? 1 : 0.5 }}>
                    {evidenceFile ? evidenceFile.name : 'Choose file to upload...'}
                  </span>
                  <input
                    id="evidence-upload"
                    type="file"
                    accept="image/*,.pdf,.txt,.csv,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  className="admin-btn primary"
                  onClick={() => void handleUploadEvidence()}
                  disabled={loading || !evidenceFile}
                >
                  Upload
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default OrgCaseProgress