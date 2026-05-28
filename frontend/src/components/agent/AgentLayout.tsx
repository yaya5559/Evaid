import React from 'react'
import AgentNav from './AgentNav'
import '../../styles/Admin/AdminLayout.css'

type Props = {
    children: React.ReactNode
}

const AgentLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="admin-shell">
            <aside className="admin-left">
                <AgentNav />
            </aside>

            <main className="admin-main">
                {children}
            </main>
        </div>
    )
}

export default AgentLayout
