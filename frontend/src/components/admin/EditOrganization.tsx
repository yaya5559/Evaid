import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { disableOrganization, editOrganization, getOrganizations, type OrganizationListItem } from '../../helpers/admin/organizations'
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/EditOrganization.css'
import Nav from './Nav'

type OrganizationStatus = 'active' | 'onboarding' | 'suspended'

type OrganizationRecord = {
  org_id: number;
  companyName: string;
  companyEmail: string;
  companyPhoneNumber: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhoneNumber: string;
  status: OrganizationStatus;
  description: string;
  lastUpdated: string;
};

// type OrganizationForm = {
//   name: string
//   email: string
//   phoneNumber: string
//   status: OrganizationStatus
//   primaryContact: string
//   notes: string
// }

type OrganizationForm = {
  org_id: number;
  companyName: string;
  companyEmail: string;
  companyPhoneNumber: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhoneNumber: string;
  status: OrganizationStatus;
  description: string;
};

type FormErrors = Partial<Record<keyof OrganizationForm, string>>

const statusLabel: Record<OrganizationStatus, string> = {
  active: 'Active',
  onboarding: 'Onboarding',
  suspended: 'Suspended',
}

const demoOrganizations: OrganizationRecord[] = [
  {
    org_id: 9001,
    companyName: 'Metro Intelligence Unit',
    companyEmail: 'ops@metrointel.gov',
    companyPhoneNumber: '+1 555 010 1200',
    ownerFirstName: 'Amira',
    ownerLastName: 'Patel',
    ownerEmail: 'amira.patel@metrointel.gov',
    ownerPhoneNumber: '+1 555 010 1201',
    status: 'active',
    description: 'Tier-1 priority. Strict access controls required.',
    lastUpdated: '2026-02-24T14:20:00Z',
  },
  {
    org_id: 9002,
    companyName: 'Westport Cyber Office',
    companyEmail: 'admin@westportcyber.org',
    companyPhoneNumber: '+1 555 010 2104',
    ownerFirstName: 'Liam',
    ownerLastName: 'Chen',
    ownerEmail: 'liam.chen@westportcyber.org',
    ownerPhoneNumber: '+1 555 010 2105',
    status: 'onboarding',
    description: 'Pending legal review before full activation.',
    lastUpdated: '2026-02-21T09:48:00Z',
  },
  {
    org_id: 9003,
    companyName: 'Federal Evidence Bureau',
    companyEmail: 'secops@feb.gov',
    companyPhoneNumber: '+1 555 010 3880',
    ownerFirstName: 'R.',
    ownerLastName: 'Johnson',
    ownerEmail: 'r.johnson@feb.gov',
    ownerPhoneNumber: '+1 555 010 3881',
    status: 'suspended',
    description: 'Suspended pending credential rotation and audit completion.',
    lastUpdated: '2026-02-23T18:05:00Z',
  },
]

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[+]?[\d()\s-]{7,20}$/

function normalizeStatus(status: string | undefined): OrganizationStatus {
  const normalized = status?.trim().toLowerCase()
  if (normalized === 'onboarding') return 'onboarding'
  if (normalized === 'suspended') return 'suspended'
  return 'active'
}

function toForm(organization: OrganizationRecord): OrganizationForm {
  return {
    org_id: organization.org_id,
    companyName: organization.companyName,
    companyEmail: organization.companyEmail,
    companyPhoneNumber: organization.companyPhoneNumber,
    ownerFirstName: organization.ownerFirstName,
    ownerLastName: organization.ownerLastName,
    ownerEmail: organization.ownerEmail,
    ownerPhoneNumber: organization.ownerPhoneNumber,
    status: organization.status,
    description: organization.description,
  };
}

function toRecord(apiItem: OrganizationListItem): OrganizationRecord {
  const org_id = Number(apiItem.org_id)
  if (!Number.isFinite(org_id) || org_id <= 0) {
    throw new Error('Organization list response included an invalid organization id.')
  }

  const companyName = (apiItem.companyName ?? apiItem.company_name ?? apiItem.name ?? '').trim()
  const companyEmail = (apiItem.companyEmail ?? apiItem.company_email ?? '').trim()
  if (!companyName || !companyEmail) {
    throw new Error(`Organization ${org_id} is missing required profile fields.`)
  }

  return {
    org_id,
    companyName,
    companyEmail,
    companyPhoneNumber: (apiItem.companyPhoneNumber ?? apiItem.company_phone_number ?? '').trim(),
    ownerFirstName: (apiItem.ownerFirstName ?? apiItem.owner_first_name ?? '').trim(),
    ownerLastName: (apiItem.ownerLastName ?? apiItem.owner_last_name ?? '').trim(),
    ownerEmail: (apiItem.ownerEmail ?? apiItem.owner_email ?? '').trim(),
    ownerPhoneNumber: (apiItem.ownerPhoneNumber ?? apiItem.owner_phone_number ?? '').trim(),
    description: apiItem.description?.trim() || "",
    status: normalizeStatus(apiItem.status),
    lastUpdated: apiItem.updatedAt ?? apiItem.updated_at ?? "",
  };
}

function statusPillClass(status: OrganizationStatus): 'good' | 'warn' | 'critical' {
  if (status === 'active') return 'good'
  if (status === 'onboarding') return 'warn'
  return 'critical'
}

function validate(form: OrganizationForm): FormErrors {
  const errors: FormErrors = {}

    if (!form.companyName.trim())
      errors.companyName = "Company name is required.";
    if (!emailRegex.test(form.companyEmail))
      errors.companyEmail = "Enter a valid email address.";
    if (!phoneRegex.test(form.companyPhoneNumber))
      errors.companyPhoneNumber = "Enter a valid phone number.";
    if (form.ownerEmail.trim() && !emailRegex.test(form.ownerEmail))
      errors.ownerEmail = "Enter a valid email address.";
    if (form.ownerPhoneNumber.trim() && !phoneRegex.test(form.ownerPhoneNumber))
      errors.ownerPhoneNumber = "Enter a valid phone number.";
    if (form.description.length > 600)
      errors.description = "Notes should stay under 600 characters.";

    return errors
}

function EditOrganization() {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrganizationStatus>('all')
  const [form, setForm] = useState<OrganizationForm | null>(null)
  const [originalForm, setOriginalForm] = useState<OrganizationForm | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [useDemoData, setUseDemoData] = useState(false)

  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadOrganizations = async () => {
    setLoading(true)
    setNotice(null)
    setError(null)

    try {
      const response = await getOrganizations()
      const mapped = response.map(toRecord)

      if (mapped.length === 0) throw new Error('No organizations were returned from the API.')

      setOrganizations(mapped)
      setUseDemoData(false)
      setSelectedId((current) => (current && mapped.some((org) => org.org_id === current) ? current : mapped[0].org_id))
    } catch {
      setOrganizations(demoOrganizations)
      setUseDemoData(true)
      setNotice('Live edit endpoints are unavailable. You are currently using demo organization data.')
      setSelectedId((current) =>
        current && demoOrganizations.some((org) => org.org_id === current) ? current : demoOrganizations[0].org_id
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrganizations()
  }, [])

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.org_id === selectedId) ?? null,
    [organizations, selectedId]
  )

  useEffect(() => {
    if (!selectedOrganization) {
      setForm(null)
      setOriginalForm(null)
      return
    }

    const nextForm = toForm(selectedOrganization)
    setForm(nextForm)
    setOriginalForm(nextForm)
    setFieldErrors({})
    setError(null)
    setSuccess(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const filteredOrganizations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return organizations.filter((organization) => {
      const matchesStatus = statusFilter === 'all' || organization.status === statusFilter
      const matchesQuery =
        query.length === 0 ||
        `${organization.companyName} ${organization.companyEmail} ${organization.ownerFirstName} ${organization.ownerLastName} ${organization.ownerEmail} ${organization.ownerPhoneNumber}`
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesQuery
    })
  }, [organizations, searchQuery, statusFilter])

  const statusCounts = useMemo(
    () =>
      organizations.reduce(
        (totals, organization) => {
          totals[organization.status] += 1
          return totals
        },
        { active: 0, onboarding: 0, suspended: 0 } satisfies Record<OrganizationStatus, number>
      ),
    [organizations]
  )

  const hasChanges = useMemo(() => {
    if (!form || !originalForm) return false
    return JSON.stringify(form) !== JSON.stringify(originalForm)
  }, [form, originalForm])

  const onFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    const key = name as keyof OrganizationForm

    setForm((current) => (current ? { ...current, [key]: value } : current))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
    setSuccess(null)
  }

  const onDiscardChanges = () => {
    if (!originalForm) return
    setForm(originalForm)
    setFieldErrors({})
    setSuccess(null)
    setError(null)
  }

  const onSave = async () => {
    if (!form || !selectedOrganization) return

    const nextErrors = validate(form)
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    const cleanedForm: OrganizationForm = {
      ...form,
      companyName: form.companyName.trim(),
      companyEmail: form.companyEmail.trim(),
      companyPhoneNumber: form.companyPhoneNumber.trim(),
      ownerFirstName: form.ownerFirstName.trim(),
      ownerLastName: form.ownerLastName.trim(),
      ownerEmail: form.ownerEmail.trim(),
      ownerPhoneNumber: form.ownerPhoneNumber.trim(),
      description: form.description.trim(),
    };

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!useDemoData) {
        await editOrganization(String(selectedOrganization.org_id), {
          org_id: selectedOrganization.org_id,
          companyName: cleanedForm.companyName,
          companyEmail: cleanedForm.companyEmail,
          companyPhoneNumber: cleanedForm.companyPhoneNumber,
          ownerFirstName: cleanedForm.ownerFirstName,
          ownerLastName: cleanedForm.ownerLastName,
          ownerEmail: cleanedForm.ownerEmail,
          ownerPhoneNumber: cleanedForm.ownerPhoneNumber,
          description: cleanedForm.description,
          status:cleanedForm.status
        })
      }

      setOrganizations((current) =>
        current.map((organization) =>
              organization.org_id === selectedOrganization.org_id
            ? {
                ...organization,
                companyName: cleanedForm.companyName,
                companyEmail: cleanedForm.companyEmail,
                companyPhoneNumber: cleanedForm.companyPhoneNumber,
                ownerFirstName: cleanedForm.ownerFirstName,
                ownerLastName: cleanedForm.ownerLastName,
                ownerEmail: cleanedForm.ownerEmail,
                ownerPhoneNumber: cleanedForm.ownerPhoneNumber,
                status: cleanedForm.status,
                description: cleanedForm.description,
                lastUpdated: new Date().toISOString(),
              }
            : organization,
        ),
      );

      setForm(cleanedForm)
      setOriginalForm(cleanedForm)
      setSuccess('Organization details were saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organization updates.')
    } finally {
      setSaving(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSave()
  }

  const onArchive = async () => {
    if (!selectedOrganization) return
    if (!window.confirm(`Archive "${selectedOrganization.companyName}"? This will disable all user access.`)) return

    setArchiving(true)
    setError(null)
    setSuccess(null)

    try {
      await disableOrganization(selectedOrganization.companyName)
      setOrganizations((current) =>
        current.map((org) =>
          org.org_id === selectedOrganization.org_id ? { ...org, status: 'suspended' } : org
        )
      )
      setForm((current) => (current ? { ...current, status: 'suspended' } : current))
      setOriginalForm((current) => (current ? { ...current, status: 'suspended' } : current))
      setSuccess('Organization has been archived and access has been disabled.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive organization.')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className='admin-shell'>
      <aside className='admin-left'>
        <Nav />
      </aside>

      <main className='admin-main'>
        <header className='admin-header'>
          <div>
            <div className='admin-eyebrow'>Organization command center</div>
            <h1 className='admin-title'>Edit Organization</h1>
            <p className='admin-subtext'>
              Search and update organization profile, access status, and account settings with confidence.
            </p>
          </div>
          <div className='admin-actions'>
            <button className='admin-btn admin-btn-ghost' disabled={loading || saving} onClick={() => void loadOrganizations()} type='button'>
              {loading ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>
        </header>

        {notice && (
          <div className='edit-org-alert info' role='status'>
            {notice}
          </div>
        )}

        <section className='edit-org-layout'>
          <aside className='admin-card edit-org-list-panel'>
            <div className='edit-org-panel-head'>
              <h2>Organizations</h2>
              <span className='admin-pill info'>{organizations.length} total</span>
            </div>

            <div className='edit-org-controls'>
              <label className='edit-org-control'>
                <span>Search</span>
                <input
                  className='edit-org-input'
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='Search by name, email, region...'
                  type='text'
                  value={searchQuery}
                />
              </label>
              <label className='edit-org-control'>
                <span>Status</span>
                <select className='edit-org-select' onChange={(event) => setStatusFilter(event.target.value as 'all' | OrganizationStatus)} value={statusFilter}>
                  <option value='all'>All statuses</option>
                  <option value='active'>Active</option>
                  <option value='onboarding'>Onboarding</option>
                  <option value='suspended'>Suspended</option>
                </select>
              </label>
            </div>

            <div className='edit-org-stat-chips'>
              <span>Active {statusCounts.active}</span>
              <span>Onboarding {statusCounts.onboarding}</span>
              <span>Suspended {statusCounts.suspended}</span>
            </div>

            <div className='edit-org-list'>
              {loading && <p className='edit-org-helper'>Loading organizations...</p>}
              {!loading && filteredOrganizations.length === 0 && (
                <p className='edit-org-helper'>No organizations match your filter.</p>
              )}
              {!loading &&
                filteredOrganizations.map((organization) => (
                  <button
                    className={`edit-org-item ${organization.org_id === selectedId ? 'active' : ''}`}
                    key={organization.org_id}
                    onClick={() => setSelectedId(organization.org_id)}
                    type='button'
                  >
                    <div className='edit-org-item-main'>
                      <strong>{organization.companyName}</strong>
                    </div>
                    <div className='edit-org-item-meta'>
                      <span>{organization.companyEmail}</span>
                      <span>{organization.companyPhoneNumber}</span>
                    </div>
                    <span className={`admin-pill ${statusPillClass(organization.status)}`}>
                      {statusLabel[organization.status]}
                    </span>
                  </button>
                ))}
            </div>
          </aside>

          <section className='admin-card edit-org-editor-panel'>
            {!form || !selectedOrganization ? (
              <div className='edit-org-empty'>
                <h2>Select an organization</h2>
                <p>Choose an organization from the left panel to edit details.</p>
              </div>
            ) : (
              <>
                <div className='edit-org-panel-head'>
                  <div>
                    <h2>{selectedOrganization.companyName}</h2>
                    <p>Edit identity, contact, status, and capacity settings.</p>
                  </div>
                  <span className={`admin-pill ${statusPillClass(form.status)}`}>{statusLabel[form.status]}</span>
                </div>

                <form className='edit-org-form' noValidate onSubmit={onSubmit}>
                  <div className='edit-org-grid'>
                    <div className='edit-org-field'>
                      <label htmlFor='companyName'>Organization Name</label>
                      <input id='companyName' name='companyName' onChange={onFieldChange} type='text' value={form.companyName} />
                      {fieldErrors.companyName && <span className='edit-org-field-error'>{fieldErrors.companyName}</span>}
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='companyEmail'>Contact Email</label>
                      <input id='companyEmail' name='companyEmail' onChange={onFieldChange} type='email' value={form.companyEmail} />
                      {fieldErrors.companyEmail && <span className='edit-org-field-error'>{fieldErrors.companyEmail}</span>}
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='companyPhoneNumber'>Phone Number</label>
                      <input id='companyPhoneNumber' name='companyPhoneNumber' onChange={onFieldChange} type='text' value={form.companyPhoneNumber} />
                      {fieldErrors.companyPhoneNumber && <span className='edit-org-field-error'>{fieldErrors.companyPhoneNumber}</span>}
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='ownerPhoneNumber'>Primary Contact</label>
                      <input id='ownerPhoneNumber' name='ownerPhoneNumber' onChange={onFieldChange} type='text' value={form.ownerPhoneNumber} />
                      {fieldErrors.ownerPhoneNumber && <span className='edit-org-field-error'>{fieldErrors.ownerPhoneNumber}</span>}
                    </div>

                    

                    <div className='edit-org-field'>
                      <label htmlFor='status'>Status</label>
                      <select id='status' name='status' onChange={onFieldChange} value={form.status}>
                        <option value='active'>Active</option>
                        <option value='onboarding'>Onboarding</option>
                        <option value='suspended'>Suspended</option>
                      </select>
                    </div>

                    <div className='edit-org-field full'>
                      <label htmlFor='description'>Internal Notes</label>
                      <textarea id='description' name='description' onChange={onFieldChange} rows={4} value={form.description} />
                      {fieldErrors.description && <span className='edit-org-field-error'>{fieldErrors.description}</span>}
                    </div>
                  </div>

                  <div className='edit-org-meta-grid'>
                    <div className='edit-org-meta-card'>
                      <span>Organization ID</span>
                      <strong>{selectedOrganization.org_id}</strong>
                    </div>
                    <div className='edit-org-meta-card'>
                      <span>Current Status</span>
                      <strong>{statusLabel[selectedOrganization.status]}</strong>
                    </div>
                    <div className='edit-org-meta-card'>
                      <span>Last Updated</span>
                      <strong>{selectedOrganization.lastUpdated ? new Date(selectedOrganization.lastUpdated).toLocaleString() : 'Not available'}</strong>
                    </div>
                  </div>

                  {error && (
                    <div className='edit-org-alert error' role='alert'>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className='edit-org-alert success' role='status'>
                      {success}
                    </div>
                  )}

                  <div className='edit-org-actions'>
                    <button className='admin-btn admin-btn-ghost' disabled={!hasChanges || saving} onClick={onDiscardChanges} type='button'>
                      Discard Changes
                    </button>
                    <button className='admin-btn admin-btn-primary' disabled={!hasChanges || saving} type='submit'>
                      {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                </form>

                <div className='edit-org-danger-zone'>
                  <div>
                    <h3>Danger Zone</h3>
                    <p>Archiving disables user access and removes the organization from active operations.</p>
                  </div>
                  <button
                    className='admin-btn edit-org-danger-btn'
                    disabled={archiving || saving || useDemoData || selectedOrganization.status === 'suspended'}
                    onClick={() => void onArchive()}
                    type='button'
                  >
                    {archiving ? 'Archiving...' : 'Archive Organization'}
                  </button>
                </div>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

export default EditOrganization
