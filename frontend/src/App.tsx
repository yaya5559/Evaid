import './App.css'
import { Route, Routes } from 'react-router-dom'
import HomePage from './components/HomePage'
import Login from './components/Login'

import AddOrganization from './components/admin/AddOrganization'
import EditOrganization from './components/admin/EditOrganization'
import OrgDashboard from './components/organization/OrgDashboard'
import OrgCaseProgress from './components/organization/OrgCaseProgress'
import AddAgent from './components/admin/AddAgents'
import Cases from './components/admin/Cases'
import EvidenceUpload from './components/Evidence/EvidenceUpload';
import AuthGate from './components/AuthGate'


function App() {


  return (
    <Routes>

      <Route path="/" element={<HomePage />} />
      <Route path="/Login" element={<Login />} />
      <Route element={<AuthGate roles={["evaide_admin"]} />}>
        <Route path='/Add_Organization' element = {<AddOrganization/>}/>
        <Route path='/Edit_Organization' element = {<EditOrganization/>}/>
        <Route path='/Org_Dashboard' element={<OrgDashboard />} />
        <Route path='/Evidence_Upload' element={<EvidenceUpload />} />
        <Route path='/OrgCaseProgress' element={<OrgCaseProgress/>} />
        <Route path='/Register_Agent' element = {<AddAgent/>}/>
        <Route path='/Cases' element = {<Cases/>} />
      </Route>

    </Routes>
  );
}
export default App
