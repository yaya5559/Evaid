import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { SignalProvider } from './context/SignalContext'
import { SignalToast } from './components/shared/SignalToast'
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
import AddAgent from './components/admin/AddAgents'
import Cases from './components/admin/Cases'
import AdminCaseDetail from './components/admin/CaseDetail'
import OrgCaseDetail from './components/organization/OrgCaseDetail'
import OrgAgents from './components/organization/OrgAgents'
import OrgStartCase from './components/organization/OrgStartCase'
import AgentCaseDetail from './components/agent/AgentCaseDetail'
import EvidenceUpload from './components/Evidence/EvidenceUpload'
import AgentCases from './components/agent/AgentCases'

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
  const { user, loading } = useAuth()
  if (loading || !user) return null
  return (
    <>
      <SignalToast />
      <SignalModal />
      <SignalPanel />
      <FloatingSignalButton />
    </>
  )
}

function App() {
  return (
    <SignalProvider>
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

      {/* Org Admin only */}
      <Route path="/Org_Dashboard" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgDashboard /></ProtectedRoute>} />
      <Route path="/OrgCaseProgress" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgCaseProgress /></ProtectedRoute>} />
      <Route path="/OrgCase/:caseId" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgCaseDetail /></ProtectedRoute>} />
      <Route path="/OrgAgents" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgAgents /></ProtectedRoute>} />
      <Route path="/OrgStartCase" element={<ProtectedRoute allowedRoles={['org_admin']}><OrgStartCase /></ProtectedRoute>} />

      {/* Agent only */}
      <Route path="/AgentCases" element={<ProtectedRoute allowedRoles={['agent']}><AgentCases /></ProtectedRoute>} />
      <Route path="/AgentCase/:caseId" element={<ProtectedRoute allowedRoles={['agent']}><AgentCaseDetail /></ProtectedRoute>} />

      {/* Any authenticated user */}
      <Route path="/Evidence_Upload" element={<ProtectedRoute allowedRoles={['evaide_admin', 'org_admin', 'agent']}><EvidenceUpload /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </SignalProvider>
  )
}

export default App