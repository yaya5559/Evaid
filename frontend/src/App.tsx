import { Route, Routes } from 'react-router-dom'
import HomePage from './components/HomePage'
import Login from './components/Login'
import Dashboard from './components/admin/Dashboard'
import AddOrganization from './components/admin/AddOrganization'
import EditOrganization from './components/admin/EditOrganization'
import OrgDashboard from './components/organization/OrgDashboard'

function App() {


  return (
    <Routes >
      <Route path='/' element = {<HomePage />}/>
      <Route path='/Login' element = {<Login /> }/>
      {/* <Route element = {<AuthGate roles={["admin"]} />}> */}
        <Route path='/Dashboard' element = {<Dashboard/>}/>
        <Route path='/Add_Organization' element = {<AddOrganization/>}/>
        <Route path='/Edit_Organization' element = {<EditOrganization/>}/>
        <Route path='/Org_Dashboard' element = {<OrgDashboard/>}/>
      {/* </Route> */}
    </Routes>
  )
}

export default App
