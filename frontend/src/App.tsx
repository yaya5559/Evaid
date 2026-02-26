import './App.css'
import { Route, Routes } from 'react-router-dom'
import HomePage from './components/HomePage'
import Login from './components/Login'
import Dashboard from './components/admin/Dashboard'
import AddOrganization from './components/admin/AddOrganization'

function App() {


  return (
    <Routes>
      <Route path='/' element = {<HomePage />}/>
      <Route path='/Login' element = {<Login /> }/>
      <Route path='/Dashboard' element = {<Dashboard/>}/>
      <Route path='/Add_Organization' element = {<AddOrganization/>}/>
    </Routes>
  )
}

export default App
