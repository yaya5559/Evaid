import { api } from '../../context/AuthContext'

export type OrgCaseListItem = {
    case_id: number
    CaseNumber: string
    title: string
    description: string
    status: string
    priority: string
    severity_level: string
    due_date: string
    created_at: string
    closed_at: string
    created_by_first_name: string
    created_by_last_name: string
    created_by_email: string
    evidence_count: number
}

export type OrgCaseDetails = {
    case_id: number
    CaseNumber: string
    title: string
    description: string
    status: string
    priority: string
    severity_level: string
    due_date: string
    created_at: string
    closed_at: string
    resolution: string
    creator_id: number
    creator_first_name: string
    creator_last_name: string
    creator_email: string
}

export type OrgAssignedAgent = {
    user_id: number
    first_name: string
    last_name: string
    email: string
    assigned_at: string
    assigned_by_first_name: string
    assigned_by_last_name: string
}

export type SearchResult =
  | { result_type: 'signal'; signal_type: string; raw_value: string; confidence: number; case_id: number; case_title: string; case_status: string }
  | { result_type: 'actor'; actor_id: string; actor_name: string; role: string; case_id: number | null }
  | { result_type: 'case'; case_id: number; case_number: string; case_title: string; case_status: string }

export type AssignedAgent = OrgAssignedAgent

export type OrgCaseNote = {
    note_id: number
    content: string
    created_at: string
    updated_at: string
    author_id: number
    author_first_name: string
    author_last_name: string
}

export type OrgCaseEvidence = {
    file_id: string
    file_name: string
    upload_date: string
    uploaded_by: string
    processing_status: string
    agent_context?: string | null
    summary?: string | null
}

export type OrgCaseDetailResponse = {
    message: string
    case: OrgCaseDetails
    assigned_agents: OrgAssignedAgent[]
    notes: OrgCaseNote[]
    evidence: OrgCaseEvidence[]
}

export type OrgAgent = {
    user_id: number
    first_name: string
    last_name: string
    email: string
}

export type ActorNote = {
  note_id: number
  content: string
  created_at: string
}

export type Actor = {
  id: string
  primaryName: string
  aliases: string[]
  notes: ActorNote[]
  role: 'Suspect' | 'Person of Interest' | 'Witness' | 'Victim'
  confidenceScore: number | null
  source: 'AI' | 'User'
  createdAt: string
  evidenceCount: number
  casesCount: number
}

export const getActorsForCase = async (_caseId: string): Promise<Actor[]> => {
  try {
    const res = await api.get(`/actors/case/${_caseId}`)
    return Array.isArray(res.data) ? res.data : []
  } catch {
    return []
  }
}

export type ConfirmedSignal = {
  id: string
  signal_type: string
  raw_value: string
  normalized_value: string
  confidence: number
  source_locator: string
  evidence_id: string
}

export const getConfirmedSignals = async (caseId: string): Promise<ConfirmedSignal[]> => {
  const res = await api.get(`/evidence/confirmedSignals/${caseId}`, { withCredentials: true })
  return (res.data ?? []) as ConfirmedSignal[]
}

export type OrgCreateCasePayload = {
    case_number?: string
    title: string
    description: string
    org_id: number
    created_by_user_id: number
    status: string
    priority: string
    severity_level: string
    due_date?: string
}

export const orgGetCases = async (_orgId: string): Promise<OrgCaseListItem[]> => {
    try {
        const res = await api.get('/org/cases/', { withCredentials: true })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to load cases')
        return (data?.cases ?? []) as OrgCaseListItem[]
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to load cases')
    }
}

export const orgGetCaseDetail = async (caseId: string, _orgId: string): Promise<OrgCaseDetailResponse> => {
    try {
        const res = await api.get(`/org/cases/${caseId}`, { withCredentials: true })
        const data = res.data
        if (!data?.case) throw new Error(data?.message ?? 'Case not found')
        return data as OrgCaseDetailResponse
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to load case details')
    }
}

export const orgCreateCase = async (_orgId: string, _userId: number, data: OrgCreateCasePayload) => {
    try {
        const res = await api.post('/org/cases/', data, { withCredentials: true })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to create case')
        return res.data
    } catch (err: any) {
        const detail = err?.response?.data?.detail
        const msg = Array.isArray(detail)
            ? detail.map((d: any) => `${d.loc?.slice(-1)?.[0] ?? 'field'}: ${d.msg}`).join(', ')
            : detail ?? err?.message ?? 'Unable to create case'
        throw new Error(msg)
    }
}

export const orgUpdateCase = async (caseId: string, _orgId: string, fields: { description?: string; priority?: string; severity_level?: string; due_date?: string }) => {
    try {
        const res = await api.patch(`/org/cases/${caseId}`, null, {
            params: { ...fields },
            withCredentials: true,
        })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to update case')
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to update case')
    }
}

export const orgCloseCase = async (caseId: string, _orgId: string, _closedByUserId: number, resolution: string) => {
    try {
        const res = await api.patch(`/org/cases/close/${caseId}`, null, {
            params: { resolution },
            withCredentials: true,
        })
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to close case')
    }
}

export const orgDeleteCase = async (caseId: string, _orgId: string) => {
    try {
        const res = await api.delete(`/org/cases/${caseId}`, { withCredentials: true })
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to delete case')
    }
}

export const orgGetAgents = async (_orgId: string): Promise<OrgAgent[]> => {
    try {
        const res = await api.get('/org/cases/agents/', { withCredentials: true })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to load agents')
        return (data?.agents ?? []) as OrgAgent[]
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to load agents')
    }
}

export const orgAssignAgent = async (caseId: string, userId: number, assignedBy: number, _orgId: string) => {
    try {
        const res = await api.post(`/org/assignments/case/${caseId}`, null, {
            params: { user_id: userId, assigned_by: assignedBy },
            withCredentials: true,
        })
        return res.data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to assign agent')
    }
}

export const orgUnassignAgent = async (caseId: string, userId: number, _orgId: string) => {
    try {
        const res = await api.delete(`/org/assignments/case/${caseId}/agent/${userId}`, { withCredentials: true })
        return res.data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to unassign agent')
    }
}

export const orgCreateNote = async (caseId: string, orgId: string, userId: number, content: string) => {
    try {
        const res = await api.post(`/org/notes/case/${caseId}`, { content }, {
            params: { org_id: orgId, created_by_user_id: userId },
            withCredentials: true,
        })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to create note')
        return data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to create note')
    }
}

export const orgUpdateNote = async (noteId: number, orgId: string, content: string) => {
    try {
        const res = await api.patch(`/org/notes/${noteId}`, { content }, {
            params: { org_id: orgId },
            withCredentials: true,
        })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to update note')
        return data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to update note')
    }
}

export const orgDeleteNote = async (noteId: number, orgId: string) => {
    try {
        const res = await api.delete(`/org/notes/${noteId}`, {
            params: { org_id: orgId },
            withCredentials: true,
        })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to delete note')
        return data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to delete note')
    }
}

export const orgDeleteEvidence = async (fileId: string, orgId: string) => {
    try {
        const res = await api.delete(`/org/evidence/${fileId}`, {
            params: { org_id: orgId },
            withCredentials: true,
        })
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to delete evidence')
    }
}

export const orgCreateEvidenceItem = async (_case_id: string, _title: string, _description: string) => {
    try {
        // placeholder - implement when backend endpoint is ready
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to create evidence item')
    }
}

export const orgUploadEvidence = async (caseId: string, file: File, _userId: number, note?: string) => {
    try {
        // Step 1 — create the EvidenceItem record
        const itemRes = await api.post('/evidence/EvidenceItem', {
            case_id: caseId,
            title: file.name,
            description: file.name.replace(/\.[^/.]+$/, ''),
            agent_context: note ?? null,
        })
        const evidenceItemId: string = itemRes.data.evidenceItem_id

        // Step 2 — upload the file as an attachment
        const formData = new FormData()
        formData.append('attachement', file)
        const attachRes = await api.post(`/evidence/${evidenceItemId}/attachments`, formData, { withCredentials: true })

        return { ...attachRes.data, file_id: evidenceItemId }
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Upload failed')
    }
}



export type CaseCorrelation = {
    related_case_id: string,
    related_case_title: string
    related_case_status: string
    signal_type: string
    shared_value: string
    confidence: number
    created_at: string
    related_org_id?: string | null
}

export const getCaseCorrelation = async (caseId: string): Promise<CaseCorrelation[]> => {
    try {
        const res = await api.get(`/evidence/correlations/${caseId}`)
        return Array.isArray(res.data) ? res.data : []
    } catch {
        return []
    }
}

export const revokeConfirmedSignal = async (signalId: string): Promise<void> => {
    await api.delete(`/evidence/signals/${signalId}`)
}

export const createActor = async (caseId: string, name: string, role: string): Promise<Actor> => {
  const res = await api.post(`/actors/case/${caseId}`, { name, role })
  return res.data
}

export const addActorAlias = async (actorId: string, alias: string): Promise<void> => {
  await api.post(`/actors/${actorId}/aliases`, { alias })
}

export const addActorNote = async (actorId: string, content: string): Promise<{ note_id: number; content: string }> => {
  const res = await api.post(`/actors/${actorId}/notes`, { content })
  return res.data
}

export const searchEvidence = async (q: string): Promise<SearchResult[]> => {
    if (q.trim().length < 2) return []
    try {
        const res = await api.get(`/evidence/search`, { params: { q } })
        return Array.isArray(res.data) ? res.data : []
    } catch {
        return []
    }
}