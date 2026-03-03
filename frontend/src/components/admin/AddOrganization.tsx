import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from './Nav'
import { addOrganization } from '../../helpers/api-communicators'
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/AddOrganization.css'

type OrganizationForm = {
  companyName: string
  companyEmail: string
  companyPhoneNumber: string
  ownerFirstName: string
  ownerLastName: string
  ownerEmail: string
  ownerPhoneNumber: string
  password: string
  confirmPassword: string
  description: string
}

type FormErrors = Partial<Record<keyof OrganizationForm, string>>

const initialForm: OrganizationForm = {
  companyName: '',
  companyEmail: '',
  companyPhoneNumber: '',
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhoneNumber: '',
  password: '',
  confirmPassword: '',
  description: '',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[+]?[\d()\s-]{7,20}$/

function validate(values: OrganizationForm): FormErrors {
  const errors: FormErrors = {}

  if (!values.companyName.trim()) errors.companyName = 'Company name is required.'
  if (!emailRegex.test(values.companyEmail)) errors.companyEmail = 'Enter a valid email address.'
  if (!phoneRegex.test(values.companyPhoneNumber)) errors.companyPhoneNumber = 'Enter a valid phone number.'
  if (!values.ownerFirstName.trim()) errors.companyName = 'Company name is required.'
  if (!values.ownerLastName.trim()) errors.companyName = 'Company name is required.'
  if (!emailRegex.test(values.ownerEmail)) errors.ownerEmail = 'Enter a valid email address.'
  if (!phoneRegex.test(values.ownerPhoneNumber)) errors.ownerPhoneNumber = 'Enter a valid phone number.'
  if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

function AddOrganization() {
  const navigate = useNavigate()
  const [form, setForm] = useState<OrganizationForm>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [formMessageType, setFormMessageType] = useState<'success' | 'error'>('success')

  const onFieldChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    const fieldName = name as keyof OrganizationForm
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
      await addOrganization({
        company_name: form.companyName.trim(),
        company_email: form.companyEmail.trim(),
        company_phone_number: form.companyPhoneNumber.trim(),
        owner_first_name: form.ownerFirstName.trim(),
        owner_last_name: form.ownerLastName.trim(),
        owner_email: form.ownerEmail.trim(),
        owner_phone_number: form.ownerPhoneNumber.trim(),
        password: form.password,
      })

      setFormMessageType('success')
      setFormMessage('Organization created successfully.')
      setForm(initialForm)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create organization.'
      setFormMessageType('error')
      setFormMessage(message)
    } finally {
      setSaving(false)
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
            <div className='admin-eyebrow'>Organization onboarding</div>
            <h1 className='admin-title'>Add Organization</h1>
            <p className='admin-subtext'>
              Create an organization profile and assign the first secure admin account.
            </p>
          </div>
          <div className='admin-actions'>
            <button className='admin-btn admin-btn-ghost' onClick={() => navigate('/Dashboard')} type='button'>
              Back to Dashboard
            </button>
          </div>
        </header>

        <section className='org-layout'>
          <form className='admin-card org-form-card' onSubmit={onSubmit} noValidate>
            <div className='org-section-title'>Organization Details</div>
            <div className='org-grid'>
              <Field
                label='Organization name'
                name='companyName'
                value={form.companyName}
                placeholder='Metro Intelligence Unit'
                error={errors.companyName}
                onChange={onFieldChange}
              />
              <Field
                label='Organization email'
                name='companyEmail'
                value={form.companyEmail}
                placeholder='admin@agency.gov'
                error={errors.companyEmail}
                onChange={onFieldChange}
              />
               <Field
                label='Organization Phone Number'
                name='companyPhoneNumber'
                value={form.companyPhoneNumber}
                placeholder='+1 555 010 2200'
                error={errors.companyPhoneNumber}
                onChange={onFieldChange}
              />
              <Field
                label='Owner First Name'
                name='ownerFirstName'
                value={form.ownerFirstName}
                placeholder='Amina'
                error={errors.ownerFirstName}
                onChange={onFieldChange}
              />
              <Field
                label='Owner last name'
                name='ownerLastName'
                value={form.ownerLastName}
                placeholder='Patel'
                error={errors.ownerLastName}
                onChange={onFieldChange}
              />
               <Field
                label='Owner email'
                name='ownerEmail'
                value={form.ownerEmail}
                placeholder='admin@agency.gov'
                error={errors.ownerEmail}
                onChange={onFieldChange}
              />
              <Field
                label='Owner Phone number'
                name='ownerPhoneNumber'
                value={form.ownerPhoneNumber}
                placeholder='+1 555 010 2200'
                error={errors.ownerPhoneNumber}
                onChange={onFieldChange}
              />
              <Field
                label='Temporary password'
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
              <Field
                label='Organization notes (optional)'
                name='description'
                value={form.description}
                placeholder='Special handling, legal constraints, or onboarding notes.'
                error={errors.description}
                onChange={onFieldChange}
                multiline
                full
              />
            </div>

            {formMessage && <p className={`org-status ${formMessageType}`}>{formMessage}</p>}

            <div className='org-actions'>
              <button className='admin-btn admin-btn-primary' disabled={saving} type='submit'>
                {saving ? 'Creating...' : 'Create Organization'}
              </button>
              <button className='admin-btn admin-btn-ghost' onClick={onReset} type='button'>
                Reset Form
              </button>
            </div>
          </form>

          <aside className='admin-card org-preview-card'>
            <div className='org-section-title'>Preview</div>
            <div className='org-preview-list'>
              <div>
                <span>Organization</span>
                <strong>{form.companyName.trim() || 'Not set'}</strong>
              </div>
              <div>
                <span>Primary admin</span>
                <strong>
                  {form.ownerFirstName || form.ownerLastName ? `${form.ownerFirstName} ${form.ownerLastName}`.trim() : 'Not set'}
                </strong>
              </div>
              <div>
                <span>Organization Email</span>
                <strong>{form.companyEmail.trim() || 'Not set'}</strong>
              </div>
              <div>
                <span>Organization Phone Number</span>
                <strong>{form.companyPhoneNumber.trim() || 'Not set'}</strong>
              </div>
            </div>
            <div className='org-note'>
              After creation, the organization appears on the dashboard board and can be monitored for onboarding
              status.
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

type FieldProps = {
  label: string
  name: keyof OrganizationForm
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
    <div className={`org-field ${full ? 'full' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {multiline ? (
        <textarea id={name} name={name} onChange={onChange} placeholder={placeholder} rows={4} value={value} />
      ) : (
        <input id={name} name={name} onChange={onChange} placeholder={placeholder} type={type} value={value} />
      )}
      {error && <span className='org-field-error'>{error}</span>}
    </div>
  )
}

export default AddOrganization
