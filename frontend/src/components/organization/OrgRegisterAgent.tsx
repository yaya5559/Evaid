import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import OrgLayout from './OrgLayout'
import '../../styles/Admin/AdminLayout.css'
import '../../styles/Admin/AddAgent.css'

type AgentForm = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
}

type FormErrors = Partial<Record<keyof AgentForm, string>>

const initialForm: AgentForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
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
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

function OrgRegisterAgent() {
  const { api } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<AgentForm>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [formMessageType, setFormMessageType] = useState<'success' | 'error'>('success')

  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setFormMessage('')
  }

  const onReset = () => {
    setForm(initialForm)
    setErrors({})
    setFormMessage('')
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setSaving(true)
    setFormMessage('')
    try {
      await api.post('/org/agents/register', {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone_number: form.phoneNumber.trim(),
        password: form.password,
      })
      setFormMessageType('success')
      setFormMessage('Agent successfully registered.')
      setForm(initialForm)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setFormMessageType('error')
      setFormMessage(Array.isArray(detail) ? detail.map((d: any) => d?.msg).join(', ') : detail ?? err?.message ?? 'Unable to register agent.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <OrgLayout>
      <header className='admin-header'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button type='button' className='admin-btn' onClick={() => navigate('/OrgAgents')}>
            ← Back
          </button>
          <div>
            <div className='admin-eyebrow'>Organization console</div>
            <h1 className='admin-title'>Register Agent</h1>
            <p className='admin-subtext'>Add a new agent to your organization.</p>
          </div>
        </div>
      </header>

      <section className='agent-layout'>
        <form className='admin-card agent-form-card' onSubmit={onSubmit} noValidate>
          <div className='agent-section-title'>Agent Details</div>
          <div className='agent-grid'>
            <Field label='First Name' name='firstName' value={form.firstName} placeholder='Mark' error={errors.firstName} onChange={onFieldChange} />
            <Field label='Last Name' name='lastName' value={form.lastName} placeholder='Wayne' error={errors.lastName} onChange={onFieldChange} />
            <Field label='Email' name='email' value={form.email} placeholder='agent@example.com' error={errors.email} onChange={onFieldChange} />
            <Field label='Phone Number' name='phoneNumber' value={form.phoneNumber} placeholder='+1 222 333 4444' error={errors.phoneNumber} onChange={onFieldChange} />
            <Field label='Password' name='password' type='password' value={form.password} placeholder='At least 8 characters' error={errors.password} onChange={onFieldChange} />
            <Field label='Confirm Password' name='confirmPassword' type='password' value={form.confirmPassword} placeholder='Re-enter password' error={errors.confirmPassword} onChange={onFieldChange} />
          </div>

          {formMessage && <p className={`agent-status ${formMessageType}`}>{formMessage}</p>}

          <div className='agent-actions'>
            <button className='admin-btn admin-btn-primary' disabled={saving} type='submit'>
              {saving ? 'Registering...' : 'Register Agent'}
            </button>
            <button className='admin-btn admin-btn-ghost' onClick={onReset} type='button'>
              Reset Form
            </button>
          </div>
        </form>

        <aside className='admin-card agent-preview-card'>
          <div className='agent-section-title'>Preview</div>
          <div className='agent-preview-list'>
            <div><span>First Name</span><strong>{form.firstName.trim() || 'Not set'}</strong></div>
            <div><span>Last Name</span><strong>{form.lastName.trim() || 'Not set'}</strong></div>
            <div><span>Email</span><strong>{form.email.trim() || 'Not set'}</strong></div>
            <div><span>Phone Number</span><strong>{form.phoneNumber.trim() || 'Not set'}</strong></div>
          </div>
          <div className='agent-note'>
            The agent will be added to your organization and can log in immediately after registration.
          </div>
        </aside>
      </section>
    </OrgLayout>
  )
}

type FieldProps = {
  label: string
  name: keyof AgentForm
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  error?: string
}

function Field({ label, name, value, onChange, placeholder, type = 'text', error }: FieldProps) {
  return (
    <div className='agent-field'>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} />
      {error && <span className='agent-field-error'>{error}</span>}
    </div>
  )
}

export default OrgRegisterAgent
