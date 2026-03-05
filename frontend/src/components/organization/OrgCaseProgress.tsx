// Abenezer Abraham
import React from 'react'
import OrgLayout from './OrgLayout'

export type CaseRecord = {
  id: string
  title: string
  assignedAgent: string
  evidenceCount: number
  status: 'Solved' | 'Pending' | 'Discarded'
  progress: number
  openedOn: string
  lastUpdate: string
}

const caseRecords: CaseRecord[] = [
  {
    id: 'CASE-2041',
    title: 'Financial Fraud Cluster',
    assignedAgent: 'M. Carter',
    evidenceCount: 48,
    status: 'Pending',
    progress: 72,
    openedOn: '2025-11-08',
    lastUpdate: '2026-02-25',
  },
  {
    id: 'CASE-1983',
    title: 'Data Exfiltration Attempt',
    assignedAgent: 'R. Nasser',
    evidenceCount: 61,
    status: 'Solved',
    progress: 100,
    openedOn: '2025-09-14',
    lastUpdate: '2026-02-14',
  },
  {
    id: 'CASE-2105',
    title: 'Evidence Tampering Alert',
    assignedAgent: 'A. Jensen',
    evidenceCount: 29,
    status: 'Pending',
    progress: 45,
    openedOn: '2026-01-17',
    lastUpdate: '2026-02-24',
  },
  {
    id: 'CASE-1958',
    title: 'Synthetic Identity Ring',
    assignedAgent: 'F. Hassan',
    evidenceCount: 54,
    status: 'Discarded',
    progress: 28,
    openedOn: '2025-08-09',
    lastUpdate: '2025-12-22',
  },
  {
    id: 'CASE-2130',
    title: 'Unauthorized Access Chain',
    assignedAgent: 'L. Duarte',
    evidenceCount: 37,
    status: 'Pending',
    progress: 63,
    openedOn: '2026-02-03',
    lastUpdate: '2026-02-26',
  },
]

const statusTone = {
  Solved: 'good',
  Pending: 'warn',
  Discarded: 'critical',
} as const

// helper to format the date
function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

const OrgCaseProgress: React.FC = () => {
  const organizationName = 'Metro Intelligence Unit'

  return (
    <OrgLayout>
      <section className='orgdash-main-grid'>
        {/* Organization Card */}
        <article className='admin-card orgdash-org-card'>
          <div className='orgdash-card-head'>
            <h2>{organizationName}</h2>
            <span className='admin-pill info'>Organization</span>
          </div>

          {/* Cases List */}
          <div className='orgdash-progress-list'>
            {caseRecords.map((caseItem) => (
              <div className='orgdash-progress-row' key={caseItem.id}>
                <div className='orgdash-progress-main'>
                  <div className='orgdash-progress-title'>
                    <strong>{caseItem.title}</strong>
                    <small>{caseItem.id}</small>
                  </div>
                  <span className={`admin-pill ${statusTone[caseItem.status]}`}>
                    {caseItem.status}
                  </span>
                </div>

                <div className='orgdash-progress-meta'>
                  <span>{caseItem.progress}% complete</span>
                  <span>{caseItem.evidenceCount} evidence items</span>
                  <span>Created on: {formatDate(caseItem.openedOn)}</span>
                </div>

                <div className='orgdash-track'>
                  <span
                    className='orgdash-fill'
                    style={{ width: `${caseItem.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </OrgLayout>
  )
}

export default OrgCaseProgress