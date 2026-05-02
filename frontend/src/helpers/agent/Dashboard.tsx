import { api } from '../../context/AuthContext'

export type CaseSummary = {
  case_id: number
  note_count: number
  evidence_count: number
  ev_pending: number
  ev_processing: number
  ev_processed: number
  ev_confirmed: number
  pending_signal_count: number
}

export type DashboardTotals = {
  total_evidence: number
  ev_pending: number
  ev_processing: number
  ev_processed: number
  ev_confirmed: number
  total_pending_signals: number
  empty_cases_count: number
}

export type DashboardSummary = {
  case_summaries: CaseSummary[]
  totals: DashboardTotals
}

export type AgentStats = {
  notes_week: number
  notes_month: number
  evidence_week: number
  evidence_month: number
  cases_closed_month: number
  cases_opened_month: number
}

export type ActivityItem = {
  activity_type: string
  record_id: number
  case_id: number
  case_title: string
  CaseNumber: string
  summary: string
  timestamp: string
  actor_name: string
  actor_id: number
}

export type AssignmentItem = {
  assignment_id: number
  case_id: number
  case_title: string
  CaseNumber: string
  case_status: string
  assigned_at: string
  assigned_by_name: string
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await api.get('/agent/dashboard/summary', { withCredentials: true })
  if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to load summary')
  return res.data as DashboardSummary
}

export const getAgentStats = async (): Promise<AgentStats> => {
  const res = await api.get('/agent/dashboard/stats', { withCredentials: true })
  if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to load stats')
  return res.data as AgentStats
}

export const getAgentActivity = async (): Promise<ActivityItem[]> => {
  const res = await api.get('/agent/dashboard/activity', { withCredentials: true })
  if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to load activity')
  return (res.data?.activity ?? []) as ActivityItem[]
}

export const getAgentAssignments = async (): Promise<AssignmentItem[]> => {
  const res = await api.get('/agent/dashboard/assignments', { withCredentials: true })
  if (res.data?.message === 'Error') throw new Error(res.data?.error ?? 'Failed to load assignments')
  return (res.data?.assignments ?? []) as AssignmentItem[]
}
