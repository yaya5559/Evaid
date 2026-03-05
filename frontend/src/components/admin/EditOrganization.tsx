import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
/*import { editOrganization, getOrganizations, type OrganizationListItem } from '../../helpers/api-communicators'*/
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/EditOrganization.css'
import Nav from './Nav'

type OrganizationStatus = 'active' | 'onboarding' | 'suspended'

type OrganizationRecord = {
  id: string
  name: string
  email: string
  phoneNumber: string
  region: string
  status: OrganizationStatus
  seatLimit: number
  primaryContact: string
  notes: string
  lastUpdated: string
  openCases: number
}

type OrganizationForm = {
  name: string
  email: string
  phoneNumber: string
  region: string
  status: OrganizationStatus
  seatLimit: string
  primaryContact: string
  notes: string
}

type FormErrors = Partial<Record<keyof OrganizationForm, string>>

const statusLabel: Record<OrganizationStatus, string> = {
  active: 'Active',
  onboarding: 'Onboarding',
  suspended: 'Suspended',
}

const mockOrganizations: OrganizationRecord[] = [
  {
    id: 'ORG-1001',
    name: 'Metro Intelligence Unit',
    email: 'ops@metrointel.gov',
    phoneNumber: '+1 555 010 1200',
    region: 'US / East',
    status: 'active',
    seatLimit: 750,
    primaryContact: 'Amira Patel',
    notes: 'Tier-1 priority. Strict access controls required.',
    lastUpdated: '2026-02-24T14:20:00Z',
    openCases: 1284,
  },
  {
    id: 'ORG-1002',
    name: 'Westport Cyber Office',
    email: 'admin@westportcyber.org',
    phoneNumber: '+1 555 010 2104',
    region: 'US / West',
    status: 'onboarding',
    seatLimit: 500,
    primaryContact: 'Liam Chen',
    notes: 'Pending legal review before full activation.',
    lastUpdated: '2026-02-21T09:48:00Z',
    openCases: 986,
  },
  {
    id: 'ORG-1003',
    name: 'Federal Evidence Bureau',
    email: 'secops@feb.gov',
    phoneNumber: '+1 555 010 3880',
    region: 'US / Central',
    status: 'suspended',
    seatLimit: 900,
    primaryContact: 'R. Johnson',
    notes: 'Suspended pending credential rotation and audit completion.',
    lastUpdated: '2026-02-23T18:05:00Z',
    openCases: 1907,
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
    name: organization.name,
    email: organization.email,
    phoneNumber: organization.phoneNumber,
    region: organization.region,
    status: organization.status,
    seatLimit: String(organization.seatLimit),
    primaryContact: organization.primaryContact,
    notes: organization.notes,
  }
}

function toRecord(apiItem: OrganizationListItem, index: number): OrganizationRecord {
  const id = String(apiItem.id ?? `ORG-DEMO-${index + 1}`)
  const name = apiItem.name?.trim() || `Organization ${index + 1}`
  const seatLimit = Number.isFinite(apiItem.seat_limit) ? Number(apiItem.seat_limit) : 250

  return {
    id,
    name,
    email: apiItem.email?.trim() || `admin+${index + 1}@evaide.local`,
    phoneNumber: apiItem.phone_number?.trim() || '+1 555 010 0000',
    region: apiItem.region?.trim() || 'Unassigned',
    status: normalizeStatus(apiItem.status),
    seatLimit: seatLimit > 0 ? seatLimit : 250,
    primaryContact: apiItem.primary_contact?.trim() || 'Unassigned contact',
    notes: apiItem.notes?.trim() || '',
    lastUpdated: apiItem.updated_at || new Date().toISOString(),
    openCases: Number(apiItem.open_cases ?? 0),
  }
}

function statusPillClass(status: OrganizationStatus): 'good' | 'warn' | 'critical' {
  if (status === 'active') return 'good'
  if (status === 'onboarding') return 'warn'
  return 'critical'
}

function validate(form: OrganizationForm): FormErrors {
  const errors: FormErrors = {}
  const seats = Number(form.seatLimit)

  if (!form.name.trim()) errors.name = 'Organization name is required.'
  if (!emailRegex.test(form.email)) errors.email = 'Enter a valid email address.'
  if (!phoneRegex.test(form.phoneNumber)) errors.phoneNumber = 'Enter a valid phone number.'
  if (!form.region.trim()) errors.region = 'Region is required.'
  if (!Number.isInteger(seats) || seats < 1) errors.seatLimit = 'Seat limit must be a positive whole number.'
  if (!form.primaryContact.trim()) errors.primaryContact = 'Primary contact is required.'
  if (form.notes.length > 600) errors.notes = 'Notes should stay under 600 characters.'

  return errors
}

function EditOrganization() {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrganizationStatus>('all')
  const [form, setForm] = useState<OrganizationForm | null>(null)
  const [originalForm, setOriginalForm] = useState<OrganizationForm | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
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
      setSelectedId((current) => (current && mapped.some((org) => org.id === current) ? current : mapped[0].id))
    } catch {
      setOrganizations(mockOrganizations)
      setUseDemoData(true)
      setNotice('Live edit endpoints are unavailable. You are currently using demo organization data.')
      setSelectedId((current) =>
        current && mockOrganizations.some((org) => org.id === current) ? current : mockOrganizations[0].id
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrganizations()
  }, [])

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedId) ?? null,
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
  }, [selectedOrganization])

  const filteredOrganizations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return organizations.filter((organization) => {
      const matchesStatus = statusFilter === 'all' || organization.status === statusFilter
      const matchesQuery =
        query.length === 0 ||
        `${organization.name} ${organization.email} ${organization.region} ${organization.primaryContact}`
          .toLowerCase()
          .includes(query)

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
      name: form.name.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      region: form.region.trim(),
      seatLimit: String(Number(form.seatLimit)),
      primaryContact: form.primaryContact.trim(),
      notes: form.notes.trim(),
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!useDemoData) {
        await editOrganization(selectedOrganization.id, {
          name: cleanedForm.name,
          email: cleanedForm.email,
          phone_number: cleanedForm.phoneNumber,
          region: cleanedForm.region,
          status: cleanedForm.status,
          seat_limit: Number(cleanedForm.seatLimit),
          primary_contact: cleanedForm.primaryContact,
          notes: cleanedForm.notes,
        })
      }

      setOrganizations((current) =>
        current.map((organization) =>
          organization.id === selectedOrganization.id
            ? {
                ...organization,
                name: cleanedForm.name,
                email: cleanedForm.email,
                phoneNumber: cleanedForm.phoneNumber,
                region: cleanedForm.region,
                status: cleanedForm.status,
                seatLimit: Number(cleanedForm.seatLimit),
                primaryContact: cleanedForm.primaryContact,
                notes: cleanedForm.notes,
                lastUpdated: new Date().toISOString(),
              }
            : organization
        )
      )

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
                    className={`edit-org-item ${organization.id === selectedId ? 'active' : ''}`}
                    key={organization.id}
                    onClick={() => setSelectedId(organization.id)}
                    type='button'
                  >
                    <div className='edit-org-item-main'>
                      <strong>{organization.name}</strong>
                      <small>{organization.region}</small>
                    </div>
                    <div className='edit-org-item-meta'>
                      <span>{organization.email}</span>
                      <span>{organization.primaryContact}</span>
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
                    <h2>{selectedOrganization.name}</h2>
                    <p>Edit identity, contact, status, and capacity settings.</p>
                  </div>
                  <span className={`admin-pill ${statusPillClass(form.status)}`}>{statusLabel[form.status]}</span>
                </div>

                <form className='edit-org-form' noValidate onSubmit={onSubmit}>
                  <div className='edit-org-grid'>
                    <div className='edit-org-field'>
                      <label htmlFor='name'>Organization Name</label>
                      <input id='name' name='name' onChange={onFieldChange} type='text' value={form.name} />
                      {fieldErrors.name && <span className='edit-org-field-error'>{fieldErrors.name}</span>}
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='email'>Contact Email</label>
                      <input id='email' name='email' onChange={onFieldChange} type='email' value={form.email} />
                      {fieldErrors.email && <span className='edit-org-field-error'>{fieldErrors.email}</span>}
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='phoneNumber'>Phone Number</label>
                      <input id='phoneNumber' name='phoneNumber' onChange={onFieldChange} type='text' value={form.phoneNumber} />
                      {fieldErrors.phoneNumber && <span className='edit-org-field-error'>{fieldErrors.phoneNumber}</span>}
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='primaryContact'>Primary Contact</label>
                      <input id='primaryContact' name='primaryContact' onChange={onFieldChange} type='text' value={form.primaryContact} />
                      {fieldErrors.primaryContact && <span className='edit-org-field-error'>{fieldErrors.primaryContact}</span>}
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='region'>Region</label>
                      <input id='region' name='region' onChange={onFieldChange} type='text' value={form.region} />
                      {fieldErrors.region && <span className='edit-org-field-error'>{fieldErrors.region}</span>}
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='status'>Status</label>
                      <select id='status' name='status' onChange={onFieldChange} value={form.status}>
                        <option value='active'>Active</option>
                        <option value='onboarding'>Onboarding</option>
                        <option value='suspended'>Suspended</option>
                      </select>
                    </div>

                    <div className='edit-org-field'>
                      <label htmlFor='seatLimit'>Seat Limit</label>
                      <input id='seatLimit' min={1} name='seatLimit' onChange={onFieldChange} type='number' value={form.seatLimit} />
                      {fieldErrors.seatLimit && <span className='edit-org-field-error'>{fieldErrors.seatLimit}</span>}
                    </div>

                    <div className='edit-org-field full'>
                      <label htmlFor='notes'>Internal Notes</label>
                      <textarea id='notes' name='notes' onChange={onFieldChange} rows={4} value={form.notes} />
                      {fieldErrors.notes && <span className='edit-org-field-error'>{fieldErrors.notes}</span>}
                    </div>
                  </div>

                  <div className='edit-org-meta-grid'>
                    <div className='edit-org-meta-card'>
                      <span>Organization ID</span>
                      <strong>{selectedOrganization.id}</strong>
                    </div>
                    <div className='edit-org-meta-card'>
                      <span>Open Cases</span>
                      <strong>{selectedOrganization.openCases}</strong>
                    </div>
                    <div className='edit-org-meta-card'>
                      <span>Last Updated</span>
                      <strong>{new Date(selectedOrganization.lastUpdated).toLocaleString()}</strong>
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
                  <button className='admin-btn edit-org-danger-btn' disabled title='Archive endpoint is not implemented yet.' type='button'>
                    Archive Organization
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
