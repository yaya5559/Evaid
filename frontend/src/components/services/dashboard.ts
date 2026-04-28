import { api } from '../../context/AuthContext.tsx';

export type AgentDashboardData = {
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  discarded_cases: number;
  overdue_cases: number;
  pending_evidence: number;
  recent_cases: Array<{
    case_id: number;
    CaseNumber: string;
    title: string;
    status: string;
    due_date: string | null;
    priority: string;
  }>;
  recent_notes: Array<{
    note_id: number;
    case_title: string;
    content: string;
    created_at: string;
    author: string;
  }>;
};

export const getAgentDashboard = async (agentId: number, orgId: number): Promise<AgentDashboardData> => {
  // 1. Make the live call to your FastAPI backend
  const res = await api.get<AgentDashboardData>('/agent/dashboard', {
    params: {
      agent_id: agentId,
      org_id: orgId
    },
    withCredentials: true,
  });

  // 2. Return the real data from the server
  return res.data;
};
