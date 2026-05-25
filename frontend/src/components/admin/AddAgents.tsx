import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from './Nav'
import { addAgent } from '../../helpers/admin/AddAgent'
import { getOrganizations,type OrganizationListItem } from '../../helpers/admin/organizations'
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/AddAgent.css'

type AgentForm = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  organizationID: number
  password: string
  confirmPassword: string
}

type FormErrors = Partial<Record<keyof AgentForm, string>>

const initialForm: AgentForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  organizationID: 0,
  password: '',
  confirmPassword: '',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[+]?[\d()\s-]{7,20}$/

function validate(values: AgentForm): FormErrors {
  const errors: FormErrors = {}

  if (!values.firstName.trim()) errors.firstName = 'First name is required.'
  if (!values.lastName.trim()) errors.lastName = 'Last name is required.'
  if (!emailRegex.test(values.email)) errors.email = 'Enter a valid email address.'
  if (!phoneRegex.test(values.phoneNumber)) errors.phoneNumber = 'Enter a valid phone number.'
  if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

function AddAgent() {
  const navigate = useNavigate()
  const [form, setForm] = useState<AgentForm>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [formMessageType, setFormMessageType] = useState<'success' | 'error'>('success')
  const [orgs, setOrgs] = useState<OrganizationListItem[]>([])

  const onFieldChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    const fieldName = name as keyof AgentForm
    setForm((prev) => ({ ...prev, [fieldName]: value }))
    setErrors((prev) => ({ ...prev, [fieldName]: undefined }))
    setFormMessage('')
  }

  const onReset = () => {
    setForm(initialForm)
    setErrors({})
    setFormMessage('')
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    setFormMessage('')

    try {
      await addAgent({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone_number: form.phoneNumber.trim(),
        password: form.password,
        org_id: form.organizationID,
      })

      setFormMessageType('success')
      setFormMessage('Agent successfully registered.')
      setForm(initialForm)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register agent.'
      setFormMessageType('error')
      setFormMessage(message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await getOrganizations()
        setOrgs(data)
      } catch {
      }
    })()
  }, [])

  return (
    <div className='admin-shell'>
      <aside className='admin-left'>
        <Nav />
      </aside>

      <main className='admin-main'>
        <header className='admin-header'>
          <div>
            <div className='admin-eyebrow'>Agent registration</div>
            <h1 className='admin-title'>Register Agent</h1>
            <p className='admin-subtext'>
              Add an agent to an organization.
            </p>
          </div>
          <div className='admin-actions'>
            <button className='admin-btn admin-btn-ghost' onClick={() => navigate('/Dashboard')} type='button'>
              Back to Dashboard
            </button>
          </div>
        </header>

        <section className='agent-layout'>
          <form className='admin-card agent-form-card' onSubmit={onSubmit} noValidate>
            <div className='agent-section-title'>Agent Details</div>
            <div className='agent-grid'>
              <Field
                label='First Name'
                name='firstName'
                value={form.firstName}
                placeholder='Mark'
                error={errors.firstName}
                onChange={onFieldChange}
              />
              <Field
                label='Last Name'
                name='lastName'
                value={form.lastName}
                placeholder='Wayne'
                error={errors.lastName}
                onChange={onFieldChange}
              />
               <Field
                label='Agent Email'
                name='email'
                value={form.email}
                placeholder='Agent@agceny.com'
                error={errors.email}
                onChange={onFieldChange}
              />
              <Field
                label='Agent Phone Number'
                name='phoneNumber'
                value={form.phoneNumber}
                placeholder='+1 222 333 4444'
                error={errors.phoneNumber}
                onChange={onFieldChange}
              />
              <div className='agent-field'>
                <label htmlFor='organizationID'>Organization</label>
                <select
                  id='organizationID'
                  name='organizationID'
                  value={form.organizationID}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, organizationID: Number(e.target.value) }))
                    setFormMessage('')
                  }}
                >
                  <option value={0} disabled>Select an organization</option>
                  {orgs.map((org) => (
                    <option key={org.org_id} value={org.org_id}>{org.companyName}</option>
                  ))}
                </select>
              </div>

              <Field
                label='Password'
                type='password'
                name='password'
                value={form.password}
                placeholder='At least 8 characters'
                error={errors.password}
                onChange={onFieldChange}
              />
              <Field
                label='Confirm password'
                type='password'
                name='confirmPassword'
                value={form.confirmPassword}
                placeholder='Re-enter password'
                error={errors.confirmPassword}
                onChange={onFieldChange}
              />
            </div>

            {formMessage && <p className={`agent-status ${formMessageType}`}>{formMessage}</p>}

            <div className='agent-actions'>
              <button className='admin-btn admin-btn-primary' disabled={saving} type='submit'>
                {saving ? 'Registering...' : 'Registering Agent'}
              </button>
              <button className='admin-btn admin-btn-ghost' onClick={onReset} type='button'>
                Reset Form
              </button>
            </div>
          </form>

          <aside className='admin-card agent-preview-card'>
            <div className='agent-section-title'>Preview</div>
            <div className='agent-preview-list'>
              <div>
                <span>First Name</span>
                <strong>{form.firstName.trim() || 'Not set'}</strong>
              </div>
              <div>
                <span>Last Name</span>
                  <strong>{form.lastName.trim() || 'Not set'}</strong>
              </div>
              <div>
                <span>Agent Email</span>
                <strong>{form.email.trim() || 'Not set'}</strong>
              </div>
              <div>
                <span>Agent Phone Number</span>
                <strong>{form.phoneNumber.trim() || 'Not set'}</strong>
              </div>
            </div>
            <div className='agent-note'>
              After registration, Agent should be able to login and begin creating cases and uploading evidence.
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

type FieldProps = {
  label: string
  name: keyof AgentForm
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  type?: string
  error?: string
  multiline?: boolean
  full?: boolean
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  multiline = false,
  full = false,
}: FieldProps) {
  return (
    <div className={`agent-field ${full ? 'full' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {multiline ? (
        <textarea id={name} name={name} onChange={onChange} placeholder={placeholder} rows={4} value={value} />
      ) : (
        <input id={name} name={name} onChange={onChange} placeholder={placeholder} type={type} value={value} />
      )}
      {error && <span className='agent-field-error'>{error}</span>}
    </div>
  )
}

export default AddAgent
