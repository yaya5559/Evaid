import { api } from "../../context/AuthContext";

export type AssignedAgents = {
    user_id: number
    first_name: string
    last_name: string
    email: string
    assigned_at: string
    assigned_by_first_name: string
    assigned_by_last_name: string
}

export type CaseDetails = {
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
    org_id: number
    org_name: string
    creator_id: number
    creator_first_name: string
    creator_last_name: string
    creator_email: string
    closed_first_name: string
    closed_last_name: string
    closed_email: string
}

export type CaseDetailResponse = {
    message: string
    case: CaseDetails
    assigned_agents: AssignedAgents[]
    notes: CaseNotes[]
    evidence: CaseEvidence[]
}

export type CaseEvidence = {
    file_id: string
    file_name: string
    file_extension: string
    content_type: string
    upload_date: string
    uploaded_by: string
    processing_status: string
}

export type CaseListItem = {
    case_id: number
    CaseNumber: string
    title: string
    description: string
    created_at: string
    org_id: string
    created_by_user_id: number
    status: string
    priority: string
    severity_level: string
    due_date: string
    closed_at: string
    resolution: string
    closed_by_user_id: number
};

export type CaseNotes = {
    note_id: number
    content: string
    created_at: string
    updated_at: string
    author_id: number
    author_first_name: string
    author_last_name: string
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

// Stub — connect to /cases/{case_id}/actors when backend is available
export const getActorsForCase = async (_caseId: string): Promise<Actor[]> => {
  return []
}

export const adminGetOrgCases = async (orgId: string) => {
    try {
        const res = await api.get(`/admin/cases/org/${orgId}`, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });
        const payload = res.data as
            | CaseListItem[]
            | { data?: CaseListItem; cases?: CaseListItem };

        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.cases)) return payload.cases;

        throw new Error("Case list response has an invalid format.");
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to load cases";
        throw new Error(msg);
    }
};

export type CreateCasePayload = {
    case_number: string
    title: string
    description: string
    org_id: number
    status: string
    priority: string
    severity_level: string
    due_date?: string
}

export type UpdateCasePayload = {
    title?: string
    description?: string
    status?: string
    priority?: string
    severity_level?: string
    due_date?: string
    resolution?: string
}

export type CloseCasePayload = {
    case_id: number
    status: string
    resolution: string
    closed_by_user_id: number
}

export const getCaseDetails = async (orgId: string, caseId: string) => {
    try {
        const res = await api.get(`/admin/cases/org/${orgId}/${caseId}`, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
        });
        const data = res.data
        if (data?.message === 'Error') {
            throw new Error(data.error ?? 'Backend error on case detail')
        }
        return data as CaseDetailResponse
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to load cases";
        throw new Error(msg);
    }
}

export const createCase = async (orgId: string, userId: number, data: CreateCasePayload) => {
    try {
        const res = await api.post(`/admin/cases/org/${orgId}/create_case`, data, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
            params: { user_id: userId },
        })
        return res.data
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to create case"
        throw new Error(msg)
    }
}

export const updateCase = async (orgId: string, caseId: string, data: UpdateCasePayload) => {
    try {
        const res = await api.patch(`/admin/cases/org/${orgId}/update/${caseId}`, data, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        })
        return res.data
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to update case"
        throw new Error(msg)
    }
}

export const closeCase = async (orgId: string, data: CloseCasePayload) => {
    try {
        const res = await api.patch(`/admin/cases/org/${orgId}/${data.case_id}/close`, data, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        })
        return res.data
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to close case"
        throw new Error(msg)
    }
}

export const deleteCase = async (orgId: string, caseId: string, userId: number) => {
    try {
        const res = await api.delete(`/admin/cases/org/${orgId}/${caseId}/delete`, {
            params: { user_id: userId },
            withCredentials: true,
        })
        return res.data
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to delete case"
        throw new Error(msg)
    }
}

export type OrgAgent = {
    user_id: number
    first_name: string
    last_name: string
    email: string
}

export const getOrgAgents = async (orgId: string): Promise<OrgAgent[]> => {
    try {
        const res = await api.get(`/admin/cases/org/${orgId}/agents`, {
            withCredentials: true,
        })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to load agents')
        return (data?.agents ?? []) as OrgAgent[]
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to load agents')
    }
}

export const assignAgent = async (orgId: string, caseId: string, userId: number, assignedBy: number) => {
    try {
        const res = await api.post(`/admin/cases/org/${orgId}/${caseId}/assign`, null, {
            params: { user_id: userId, assigned_by: assignedBy },
            withCredentials: true,
        })
        return res.data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to assign agent')
    }
}

// unassignAgent(selectedOrgId, selectedCaseId, agent.user_id)
// --- DELETE /org/assignments/case/{case_id}/agent/{user_id}
export const unassignAgent = async (_orgId: string, caseId: string, userId: number) => {
    try {
        const res = await api.delete(`/org/assignments/case/${caseId}/agent/${userId}`, {
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to unassign agent";
        throw new Error(msg);
    }
};

export const uploadEvidence = async (caseId: string, file: File, _userId: number) => {
    try {
        const itemRes = await api.post('/evidence/EvidenceItem', {
            case_id: caseId,
            title: file.name,
            description: '',
        })
        const evidenceItemId: string = itemRes.data.evidenceItem_id

        const formData = new FormData()
        formData.append('attachement', file)
        const attachRes = await api.post(`/evidence/${evidenceItemId}/attachments`, formData)
        return { ...(attachRes.data as { attachment_id: string; analysis_run_id: string }), evidenceItemId }
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Upload failed')
    }
}

export const confirmEvidence = async (fileId: string) => {
    try {
        const res = await api.post(`/evidence/confirm/${fileId}`, null, { withCredentials: true })
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Confirm failed')
    }
}

export const deleteEvidence = async (fileId: string) => {
    try {
        const res = await api.delete(`/admin/evidence/${fileId}`, { withCredentials: true })
        return res.data
    } catch (err: any) {
        throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Delete failed')
    }
}

export const updateNote = async (noteId: number, content: string) => {
    try {
        const res = await api.patch(`/admin/notes/${noteId}`, { content }, { withCredentials: true })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to update note')
        return data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to update note')
    }
}

export const deleteNote = async (noteId: number) => {
    try {
        const res = await api.delete(`/admin/notes/${noteId}`, { withCredentials: true })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to delete note')
        return data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to delete note')
    }
}

export const createNote = async (caseId: string, content: string, userId: number) => {
    try {
        const res = await api.post(`/admin/notes/case/${caseId}`, { content }, {
            params: { user_id: userId },
            withCredentials: true,
        })
        const data = res.data
        if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to create note')
        return data
    } catch (err: any) {
        throw new Error(err?.message ?? 'Unable to create note')
    }
}