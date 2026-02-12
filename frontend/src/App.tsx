import { Route, Routes } from 'react-router-dom'
import HomePage from './components/HomePage'
import Login from './components/Login'
import Dashboard from './components/admin/Dashboard'
import AddOrganization from './components/admin/AddOrganization'
import AuthGate from './components/AuthGate'

function App() {


  return (
    <Routes >
      <Route path='/' element = {<HomePage />}/>
      <Route path='/Login' element = {<Login /> }/>
      <Route element = {<AuthGate roles={["admin"]} />}>
        <Route path='/Dashboard' element = {<Dashboard/>}/>
        <Route path='/Add_Organization' element = {<AddOrganization/>}/>
      </Route>
    </Routes>
  )
}

export default App
