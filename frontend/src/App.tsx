import './App.css'
import { Route, Routes } from 'react-router-dom'
import HomePage from './components/HomePage'
import Login from './components/Login'
import Dashboard from './components/admin/Dashboard'
import AddOrganization from './components/admin/AddOrganization'
//import EditOrganization from './components/admin/EditOrganization'
import OrgDashboard from './components/organization/OrgDashboard'
import AuthGate from './components/AuthGate'
import EvidenceUpload from './components/Evidence/EvidenceUpload' // Import the new component

function App() {
    return (
        <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/Login' element={<Login />} />

            {/* Admin ONLY Routes */}
            <Route element={<AuthGate roles={["evaide_admin"]} />}>
                <Route path='/Dashboard' element={<Dashboard />} />
                <Route path='/Add_Organization' element={<AddOrganization />} />
                {/* <Route path='/Edit_Organization' element={<EditOrganization />} /> */}
            </Route>

            {/* Routes for Everyone (Admin, Org Admin, and Agents) */}
            <Route element={<AuthGate roles={["evaide_admin", "org_admin", "agent"]} />}>
                <Route path='/Org_Dashboard' element={<OrgDashboard />} />
                <Route path='/Evidence_Upload/:caseId' element={<EvidenceUpload />} />
            </Route>
        </Routes>
    )
}

export default App
