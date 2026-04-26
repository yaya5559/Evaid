import { api } from '../../context/AuthContext'

export type AgentCaseListItem = {
    case_id: number
    CaseNumber: string
    title: string
    status: string
    priority: string
    severity_level: string | number
    due_date: string | null
    created_at: string
    ai_linked: 0 | 1
    linked_from_case_id: number | null
    linked_from_title: string | null
    evidence_count?: number
}

export type AgentNote = {
    note_id: number
    content: string
    created_at: string
    updated_at: string | null
    author_id: number
    author_first_name: string
    author_last_name: string
}

export type AgentEvidence = {
    file_id: string
    file_name: string
    file_extension: string
    content_type: string
    upload_date: string
    uploaded_by: number
    processing_status: string
}

export type AgentCaseDetail = {
    case_id: number
    CaseNumber: string
    title: string
    description: string | null
    status: string
    priority: string
    severity_level: string | number
    due_date: string | null
    created_at: string
    closed_at: string | null
    resolution: string | null
    creator_id: number
    creator_first_name: string
    creator_last_name: string
}

export type AgentCaseDetailResponse = {
    case: AgentCaseDetail
    notes: AgentNote[]
    evidence: AgentEvidence[]
}

// Stub — connect to /cases/{case_id}/actors when backend is available
export const getActorsForCase = async (_caseId: string): Promise<Actor[]> => {
  return []
}

export type Actor = {
  id: string
  primaryName: string
  aliases: string[]
  role: 'Suspect' | 'Person of Interest' | 'Witness' | 'Victim'
  confidenceScore: number | null
  source: 'AI' | 'User'
  createdAt: string
  evidenceCount: number
  casesCount: number
}


export const agentGetCases = async (agentId: number, orgId: number): Promise<AgentCaseListItem[]> => {
    try {
        const res = await api.get('/agent/cases/', {
            params: { agent_id: agentId, org_id: orgId },
            withCredentials: true,
        })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to load cases')
        return (res.data?.cases ?? []) as AgentCaseListItem[]
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to load cases')
    }
}

export const agentGetCaseDetail = async (caseId: string, agentId: number, orgId: number): Promise<AgentCaseDetailResponse> => {
    try {
        const res = await api.get(`/agent/cases/${caseId}`, {
            params: { agent_id: agentId, org_id: orgId },
            withCredentials: true,
        })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to load case')
        if (!res.data?.case) throw new Error(res.data?.message ?? 'Case not found')
        return res.data as AgentCaseDetailResponse
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to load case details')
    }
}

export const agentUpdateCase = async (caseId: string, agentId: number, orgId: number, fields: { title?: string; due_date?: string }) => {
    try {
        const res = await api.patch(`/agent/cases/${caseId}`, null, {
            params: { agent_id: agentId, org_id: orgId, ...fields },
            withCredentials: true,
        })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to update case')
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to update case')
    }
}

export const agentCreateNote = async (caseId: string, agentId: number, content: string) => {
    try {
        const res = await api.post(`/agent/notes/case/${caseId}`, { content }, {
            params: { agent_id: agentId },
            withCredentials: true,
        })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to create note')
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to create note')
    }
}

export const agentUpdateNote = async (noteId: number, agentId: number, content: string) => {
    try {
        const res = await api.patch(`/agent/notes/${noteId}`, { content }, {
            params: { agent_id: agentId },
            withCredentials: true,
        })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to update note')
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to update note')
    }
}

export type AgentCreateCasePayload = {
    title: string
    description?: string
    priority?: string
    severity_level?: string
    due_date?: string
}

export const agentCreateCase = async (agentId: number, orgId: number, data: AgentCreateCasePayload) => {
    try {
        const res = await api.post('/agent/cases/', data, {
            params: { agent_id: agentId, org_id: orgId },
            withCredentials: true,
        })
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

export const agentUploadEvidence = async (caseId: string, file: File, _agentId: number, note?:string) => {
    try {
        const itemRes = await api.post('/evidence/EvidenceItem', {
            case_id: caseId,
            title: file.name,
            description: note ?? '',
        })
        const evidenceItemId: string = itemRes.data.evidenceItem_id

        const formData = new FormData()
        formData.append('attachement', file)
        const attachRes = await api.post(`/evidence/${evidenceItemId}/attachments`, formData)
        return { ...(attachRes.data as { attachment_id: string; analysis_run_id: string }), evidenceItemId }
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to upload evidence')
    }
}

export const agentConfirmEvidence = async (fileId: string) => {
    try {
        const res = await api.post(`/evidence/confirm/${fileId}`, null, { withCredentials: true })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Confirm failed')
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to confirm evidence')
    }
}

export const agentDeleteEvidence = async (fileId: string, agentId: number) => {
    try {
        const res = await api.delete(`/agent/evidence/${fileId}`, {
            params: { agent_id: agentId },
            withCredentials: true,
        })
        if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Delete failed')
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to delete evidence')
    }
}
