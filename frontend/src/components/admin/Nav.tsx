import React from 'react'
import '../../styles/Admin/Dashboard.css'

type labelProps = {
    label:string,
}

function Nav(label: labelProps) {

  return (
    <div>
        <div className='brand'>
          <div className='brand-mark'></div>
          <div>
            <div className='brand-title'>Evaid</div>
            <div className='brand-sub'>Admin console</div>
          </div>
        </div>

        <nav className='nav'>
          <div className='nav-section'>
            <div className='nav-label'>Core</div>
            <a className={"nav-item "+(label.label=='Dashboard'?'active':"")} href='#'>
              <span className='nav-dot'></span>
              Overview
            </a>
            <a className={"nav-item "+(label.label=='AddOrganizatio'?'active':"")} href='#'>
              <span className='nav-dot'></span>
              Analytics
            </a>
            <a className='nav-item' href='#'>
              <span className='nav-dot'></span>
              Organization Summary
            </a>
          </div>

          <div className='nav-section'>
            <div className='nav-label'>Operations</div>
            <a className={"nav-item "+(label.label=='AddOrganization'?'active':"")} href='#'>
              <span className='nav-dot'></span>
              Add Organization
            </a>
            <a className='nav-item' href='#'>
              <span className='nav-dot'></span>
              Delete Organization
            </a>
            <a className='nav-item' href='#'>
              <span className='nav-dot'></span>
              Edit Organization
            </a>
          </div>
        </nav>

        <div className='left-footer'>
          <div className='user'>
            <div className='avatar'>IN</div>
            <div>
              <div className='user-name'>Investigator</div>
              <div className='user-role'>Super admin</div>
            </div>
          </div>
        </div>
      
    </div>
  )
}

export default Nav
