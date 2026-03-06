// Abenezer Abraham

import { useState } from 'react'
import Nav from "./Nav";
import '../../styles/Admin/AdminLayout.css'

type Organization = {
  id: string
  name: string
  region: string
}

type CaseRecord = {
  id: string
  title: string
  organizationId: string
  assignedAgent: string
  evidenceCount: number
  status: 'Solved' | 'Pending' | 'Discarded'
  progress: number
  openedOn: string
}

const organizations: Organization[] = [
  { id: 'ORG-1001', name: 'Metro Intelligence Unit', region: 'US / East' },
  { id: 'ORG-1002', name: 'Westport Cyber Office', region: 'US / West' },
  { id: 'ORG-1003', name: 'Federal Evidence Bureau', region: 'US / Central' },
]

const caseRecords: CaseRecord[] = [
  {
    id: 'CASE-2041',
    title: 'Financial Fraud Cluster',
    organizationId: 'ORG-1001',
    assignedAgent: 'M. Carter',
    evidenceCount: 48,
    status: 'Pending',
    progress: 72,
    openedOn: '2025-11-08',
  },
  {
    id: 'CASE-1983',
    title: 'Data Exfiltration Attempt',
    organizationId: 'ORG-1001',
    assignedAgent: 'R. Nasser',
    evidenceCount: 61,
    status: 'Solved',
    progress: 100,
    openedOn: '2025-09-14',
  },
  {
    id: 'CASE-2105',
    title: 'Evidence Tampering Alert',
    organizationId: 'ORG-1002',
    assignedAgent: 'A. Jensen',
    evidenceCount: 29,
    status: 'Pending',
    progress: 45,
    openedOn: '2026-01-17',
  },
  {
    id: 'CASE-2144',
    title: 'Dark Web Transaction Ring',
    organizationId: 'ORG-1003',
    assignedAgent: 'S. Alvarez',
    evidenceCount: 103,
    status: 'Pending',
    progress: 60,
    openedOn: '2026-02-03',
  },
]

const statusTone = {
  Solved: 'good',
  Pending: 'warn',
  Discarded: 'critical',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function OrgCaseProgress() {
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0].id)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId)

  const filteredOrganizations = organizations.filter((org) => {
    const query = searchQuery.toLowerCase()
    return (
      org.name.toLowerCase().includes(query) ||
      org.region.toLowerCase().includes(query)
    )
  })

  const selectedCases = caseRecords.filter(
    (c) => c.organizationId === selectedOrgId
  )

  return (
    <div className="admin-shell">
      <aside className="admin-left">
        <Nav />
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <div className="admin-eyebrow">Organization console</div>
            <h1 className="admin-title">Case Progress</h1>
            <p className="admin-subtext">
              Monitor case activity across connected organizations.
            </p>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '650px 1fr',
            gap: '24px',
          }}
        >
          {/* left card - organizations */}
          <aside className="admin-card">
            <div className="edit-org-panel-head">
              <h2>Organizations</h2>
              <span className="admin-pill info">
                {organizations.length} total
              </span>
            </div>

            {/* search */}
            <div className="edit-org-controls">
              <label className="edit-org-control">
                <span>Search</span>
                <input
                  className="edit-org-input"
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
            </div>

            {/* organizations list */}
            <div className="edit-org-list">
              {filteredOrganizations.map((org) => (
                <button
                  key={org.id}
                  className={`edit-org-item ${
                    org.id === selectedOrgId ? 'active' : ''
                  }`}
                  onClick={() => setSelectedOrgId(org.id)}
                  type="button"
                >
                  <div className="edit-org-item-main">
                    <strong>{org.name}</strong>
                    <small>{org.region}</small>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* right card cases */}
          <section className="admin-card">
            <div className="orgdash-card-head">
              <h2>{selectedOrg?.name} Cases</h2>
              <span className="admin-pill neutral">
                {selectedCases.length} cases
              </span>
            </div>

            {selectedCases.length === 0 && (
              <p style={{ opacity: 0.7 }}>No cases available.</p>
            )}

            <div className="orgdash-progress-list">
              {selectedCases.map((caseItem) => (
                <div key={caseItem.id} className="orgdash-progress-row">
                  <div className="orgdash-progress-main">
                    <div className="orgdash-progress-title">
                      <strong>{caseItem.title}</strong>
                      <small>{caseItem.id}</small>
                    </div>

                    <span
                      className={`admin-pill ${statusTone[caseItem.status]}`}
                    >
                      {caseItem.status}
                    </span>
                  </div>

                  <div className="orgdash-progress-meta">
                    <span>{caseItem.progress}% complete</span>
                    <span>{caseItem.evidenceCount} evidence items</span>
                    <span>Opened: {formatDate(caseItem.openedOn)}</span>
                  </div>

                  <div className="orgdash-track">
                    <span
                      className="orgdash-fill"
                      style={{ width: `${caseItem.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

export default OrgCaseProgress