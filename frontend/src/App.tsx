import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { SignalProvider } from './context/SignalContext'
import { AIWarningProvider } from './context/AIWarningContext'
import { SignalModal } from './components/shared/SignalModal'
import { SignalPanel } from './components/shared/SignalPanel'
import { FloatingSignalButton } from './components/shared/FloatingSignalButton'
import HomePage from './components/HomePage'
import Login from './components/Login'
import Dashboard from './components/admin/Dashboard'
import AddOrganization from './components/admin/AddOrganization'
import EditOrganization from './components/admin/EditOrganization'
import OrgDashboard from './components/organization/OrgDashboard'
import OrgCaseProgress from './components/organization/OrgCaseProgress'
import OrgAgents from './components/organization/OrgAgents'
import OrgRegisterAgent from './components/organization/OrgRegisterAgent'
import OrgStartCase from './components/organization/OrgStartCase'
import OrgCaseGraph from './components/organization/OrgCaseGraph'
import AddAgent from './components/admin/AddAgents'
import Cases from './components/admin/Cases'
import AdminCaseDetail from './components/admin/CaseDetail'
import AdminCaseGraph from './components/admin/AdminCaseGraph'
import OrgCaseDetail from './components/organization/OrgCaseDetail'
import AgentCaseDetail from './components/agent/AgentCaseDetail'
import AgentCaseGraph from './components/agent/AgentCaseGraph'
import AgentDashboard from './components/agent/AgentDashboard'
import AgentCases from './components/agent/AgentCases'
import AgentOrgCases from './components/agent/AgentOrgCases'
import EvidenceUpload from './components/Evidence/EvidenceUpload'

type ProtectedRouteProps = {
  allowedRoles: string[]
  children: React.ReactNode
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/Login" replace />
  const role = (user as any).role as string
  if (!allowedRoles.includes(role)) {
    if (role === 'evaide_admin') return <Navigate to="/Dashboard" replace />
    if (role === 'org_admin') return <Navigate to="/Org_Dashboard" replace />
    if (role === 'agent') return <Navigate to="/AgentCases" replace />
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function AuthenticatedSignals() {
  return (
    <>
      <SignalModal />
      <SignalPanel />
      <FloatingSignalButton />
    </>
  )
}

function App() {
  return (
    <SignalProvider>
      <AIWarningProvider>
        <AuthenticatedSignals />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Login" element={<Login />} />

          {/* Evaide Admin only */}
          <Route path="/Dashboard" element={<ProtectedRoute allowedRoles={['evaide_admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/Add_Organization" element={<ProtectedRoute allowedRoles={['evaide_admin']}><AddOrganization /></ProtectedRoute>} />
          <Route path="/Edit_Organization" element={<ProtectedRoute allowedRoles={['evaide_admin']}><EditOrganization /></ProtectedRoute>} />
          <Route path="/Register_Agent" element={<ProtectedRoute allowedRoles={['evaide_admin']}><AddAgent /></ProtectedRoute>} />
          <Route path="/Cases" element={<ProtectedRoute allowedRoles={['evaide_admin']}><Cases /></ProtectedRoute>} />
          <Route path="/Cases/:orgId/:caseId" element={<ProtectedRoute allowedRoles={['evaide_admin']}><AdminCaseDetail /></ProtectedRoute>} />
          <Route path="/Cases/:orgId/:caseId/graph" element={<ProtectedRoute allowedRoles={['evaide_admin']}><AdminCaseGraph /></ProtectedRoute>} />

          {/* Org Admin only */}
          <Route path="/Org_Dashboard" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgDashboard /></ProtectedRoute>} />
          <Route path="/OrgCaseProgress" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgCaseProgress /></ProtectedRoute>} />
          <Route path="/OrgCase/:caseId" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgCaseDetail /></ProtectedRoute>} />
          <Route path="/OrgCase/:caseId/graph" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgCaseGraph /></ProtectedRoute>} />
          <Route path="/OrgAgents" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgAgents /></ProtectedRoute>} />
          <Route path="/OrgRegisterAgent" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgRegisterAgent /></ProtectedRoute>} />
          <Route path="/OrgStartCase" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgStartCase /></ProtectedRoute>} />

          {/* Agent only */}
          <Route path="/AgentDashboard" element={<ProtectedRoute allowedRoles={['agent']}><AgentDashboard /></ProtectedRoute>} />
          <Route path="/AgentCases" element={<ProtectedRoute allowedRoles={['agent']}><AgentCases /></ProtectedRoute>} />
          <Route path="/AgentCase/:caseId" element={<ProtectedRoute allowedRoles={['agent']}><AgentCaseDetail /></ProtectedRoute>} />
          <Route path="/AgentCase/:caseId/graph" element={<ProtectedRoute allowedRoles={['agent']}><AgentCaseGraph /></ProtectedRoute>} />
          <Route path="/AgentOrgCases" element={<ProtectedRoute allowedRoles={['agent']}><AgentOrgCases /></ProtectedRoute>} />

      {/* Any authenticated user */}
      <Route path="/Evidence_Upload" element={<ProtectedRoute allowedRoles={['evaide_admin', 'org_admin', 'agent']}><EvidenceUpload /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      </AIWarningProvider>
    </SignalProvider>
  )
}

export default App
