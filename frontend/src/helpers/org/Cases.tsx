import type { UUID } from 'crypto'
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
  file_extension: string
  content_type: string
  upload_date: string
  uploaded_by: string
  processing_status: string
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

export const orgGetCases = async (orgId: string): Promise<OrgCaseListItem[]> => {
  try {
    const res = await api.get('/org/cases/', {
      params: { org_id: orgId },
      withCredentials: true,
    })
    const data = res.data
    if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to load cases')
    return (data?.cases ?? []) as OrgCaseListItem[]
  } catch (err: any) {
    throw new Error(err?.message ?? 'Unable to load cases')
  }
}

export const orgGetCaseDetail = async (caseId: string, orgId: string): Promise<OrgCaseDetailResponse> => {
  try {
    const res = await api.get(`/org/cases/${caseId}`, {
      params: { org_id: orgId },
      withCredentials: true,
    })
    const data = res.data
    if (!data?.case) throw new Error(data?.message ?? 'Case not found')
    return data as OrgCaseDetailResponse
  } catch (err: any) {
    throw new Error(err?.message ?? 'Unable to load case details')
  }
}

export const orgCreateCase = async (orgId: string, _userId: number, data: OrgCreateCasePayload) => {
  try {
    const res = await api.post('/org/cases/', data, {
      params: { org_id: Number(orgId) },
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

export const orgUpdateCase = async (caseId: string, orgId: string, fields: { description?: string; priority?: string; severity_level?: string; due_date?: string }) => {
  try {
    const res = await api.patch(`/org/cases/${caseId}`, null, {
      params: { org_id: orgId, ...fields },
      withCredentials: true,
    })
    if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to update case')
    return res.data
  } catch (err: any) {
    throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to update case')
  }
}

export const orgCloseCase = async (caseId: string, orgId: string, closedByUserId: number, resolution: string) => {
  try {
    const res = await api.patch(`/org/cases/close/${caseId}`, null, {
      params: { org_id: orgId, closed_by_user_id: closedByUserId, resolution },
      withCredentials: true,
    })
    return res.data
  } catch (err: any) {
    throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to close case')
  }
}

export const orgDeleteCase = async (caseId: string, orgId: string) => {
  try {
    const res = await api.delete(`/org/cases/${caseId}`, {
      params: { org_id: orgId },
      withCredentials: true,
    })
    return res.data
  } catch (err: any) {
    throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Unable to delete case')
  }
}

export const orgGetAgents = async (orgId: string): Promise<OrgAgent[]> => {
  try {
    const res = await api.get('/org/agents/', {
      params: { org_id: orgId },
      withCredentials: true,
    })
    const data = res.data
    if (data?.message === 'Error') throw new Error(data.error ?? 'Failed to load agents')
    return (data?.agents ?? []) as OrgAgent[]
  } catch (err: any) {
    throw new Error(err?.message ?? 'Unable to load agents')
  }
}

export const orgAssignAgent = async (caseId: string, userId: number, assignedBy: number, orgId: string) => {
  try {
    const res = await api.post(`/org/assignments/case/${caseId}`, null, {
      params: { user_id: userId, assigned_by: assignedBy, org_id: orgId },
      withCredentials: true,
    })
    return res.data
  } catch (err: any) {
    throw new Error(err?.message ?? 'Unable to assign agent')
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
export const orgCreateEvidenceItem = async (case_id: UUID, title: string, description: string) => {
  try{
    const formData = new FormData()

  }catch(err:any){

  }
}


export const orgUploadEvidence = async (caseId: string, file: File, userId: number) => {
  try {
    const formData = new FormData()
    formData.append('case_id', caseId)
    formData.append('file', file)
    formData.append('user_id', String(userId))
    const res = await api.post('/evidence/upload', formData, { withCredentials: true })
    return res.data as { file_id: string; filename: string; metadata: any; message: string }
  } catch (err: any) {
    throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Upload failed')
  }
}

export const orgConfirmEvidence = async (fileId: string) => {
  try {
    const res = await api.post(`/evidence/confirm/${fileId}`, null, { withCredentials: true })
    return res.data
  } catch (err: any) {
    throw new Error(err?.response?.data?.detail ?? err?.message ?? 'Confirm failed')
  }
}
