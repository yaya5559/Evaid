import { api } from '../context/AuthContext';

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
  // TODO: replace with real endpoint when available
  // For now, using a mock response
  return mockDashboardData(agentId, orgId);

//placeholder code!
  // When backend is ready, uncomment this:
  // const res = await api.get('/agent/dashboard', {
  //   params: { agent_id: agentId, org_id: orgId },
  //   withCredentials: true,
  // });
  // return res.data;
};

// Temporary mock function need to be replace with real data later
function mockDashboardData(agentId: number, orgId: number): AgentDashboardData {
  return {
    total_cases: 12,
    open_cases: 8,
    closed_cases: 3,
    discarded_cases: 1,
    overdue_cases: 2,
    pending_evidence: 5,
    recent_cases: [
      {
        case_id: 101,
        CaseNumber: 'C-1234',
        title: 'Suspicious transaction',
        status: 'Open',
        due_date: '2026-04-10',
        priority: 'High',
      },
      {
        case_id: 102,
        CaseNumber: 'C-1235',
        title: 'Data breach investigation',
        status: 'Open',
        due_date: '2026-03-28',
        priority: 'Critical',
      },
      {
        case_id: 103,
        CaseNumber: 'C-1236',
        title: 'Fraud alert',
        status: 'Closed',
        due_date: null,
        priority: 'Medium',
      },
    ],
    recent_notes: [
      {
        note_id: 1,
        case_title: 'Suspicious transaction',
        content: 'Received new evidence from bank.',
        created_at: '2026-03-29T09:00:00Z',
        author: 'John Doe',
      },
      {
        note_id: 2,
        case_title: 'Data breach investigation',
        content: 'Contacted IT department.',
        created_at: '2026-03-28T14:30:00Z',
        author: 'Jane Smith',
      },
    ],
  };
}
