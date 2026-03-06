// Abenezer Abraham
import React from 'react'
import OrgNav from './OrgNav'
import '../../styles/Admin/AdminLayout.css'

type OrgLayoutProps = {
  children: React.ReactNode
}

const OrgLayout: React.FC<OrgLayoutProps> = ({ children }) => {
  return (
    <div className='admin-shell'>
      <aside className='admin-left'>
        <OrgNav /> 
      </aside>
      <main className='admin-main'>
        {children} 
      </main>
    </div>
  )
}

export default OrgLayout