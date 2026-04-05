import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { XCircle, CheckCircle } from 'lucide-react'
import api from '../services/api'
import { toastManager } from '../utils/toastManager'

const FieldError = ({ msg }) => msg ? (
  <p style={{
    display: 'block',
    marginTop: 5, fontSize: '0.78rem', fontWeight: 600,
    color: '#FF375F', letterSpacing: '0.01em',
  }}>
    {msg}
  </p>
) : null

const Label = ({ children }) => (
  <label style={{
    display: 'block', fontSize: '0.78rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.45)', marginBottom: 7,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  }}>{children}</label>
)

function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [focusedFields, setFocusedFields] = useState({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const navigate = useNavigate()
  
  const clearErr = (field) => setErrors(p => ({ ...p, [field]: '' }))

  const validate = () => {
    const e = {}
    if (!formData.first_name.trim()) e.first_name = 'Please enter your firstname'
    else if (!/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.first_name)) e.first_name = 'Enter a valid first name'
    
    if (!formData.last_name.trim()) e.last_name = 'Please enter your lastname'
    else if (!/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.last_name)) e.last_name = 'Enter a valid last name'
    
    if (!formData.username.trim()) e.username = 'Please enter your username'
    else if (!/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.username)) e.username = 'Enter a valid username'
    
    if (!formData.email.trim()) e.email = 'Please enter your email'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Please enter a valid email address'
    if (!formData.password) e.password = 'Please enter your password'
    else if (formData.password.length < 12) e.password = 'Password must be at least 12 characters'
    if (!formData.password_confirm) e.password_confirm = 'Please confirm your password'
    else if (formData.password_confirm !== formData.password) e.password_confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (loading || hasSubmitted) return
    
    if (!validate()) return
    if (formData.password !== formData.password_confirm) {
      setErrors(p => ({ ...p, password_confirm: 'Passwords do not match' }))
      return
    }
    
    setHasSubmitted(true)
    setLoading(true)
    
    try {
      await api.post('/accounts/users/register/', formData)
      toastManager.success('Registration successful!\nPlease check your email for verification link.')
      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error) {
      console.log('Registration error:', error.response?.data)
      
      // Always show "Registration failed" message
      toastManager.error('Registration failed', 'registration-error')
      
      // Set field errors if they exist
      const errors = error.response?.data
      if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
        const fieldErrors = {}
        Object.keys(errors).forEach(field => {
          const fieldError = errors[field]
          fieldErrors[field] = Array.isArray(fieldError) ? fieldError[0] : fieldError
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
      setHasSubmitted(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div className="fade-up" style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, #5E5CE6, #FF375F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 28px rgba(94,92,230,0.5)',
            fontSize: 28, fontWeight: 900, color: '#fff',
          }}>P</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
            Create Account
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 6, fontSize: '0.9rem' }}>
            Join Proofie today
          </p>
        </div>

        <div className="glass-card-static" style={{ padding: '32px 28px' }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>First Name</Label>
                <div style={{ position: 'relative' }}>
                  <input name="first_name" type="text" value={formData.first_name}
                    onChange={e => { 
                      handleChange(e); 
                      clearErr('first_name');
                      // Real-time validation for special characters
                      if (e.target.value && !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(e.target.value)) {
                        setErrors(p => ({...p, first_name: 'Enter a valid first name'}));
                      }
                    }} 
                    onFocus={() => setFocusedFields(p => ({...p, first_name: true}))}
                    onBlur={() => {
                      setFocusedFields(p => ({...p, first_name: false}));
                      // Validate on blur
                      if (!formData.first_name.trim()) {
                        setErrors(p => ({...p, first_name: 'Please enter your firstname'}));
                      } else if (!/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.first_name)) {
                        setErrors(p => ({...p, first_name: 'Enter a valid first name'}));
                      } else {
                        setErrors(p => ({...p, first_name: ''}));
                      }
                    }}
                    className="input-field" placeholder="John"
                    style={{
                      ...errors.first_name ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                      ...(formData.first_name.trim() && !errors.first_name && !focusedFields.first_name ? { borderColor: 'rgba(48,209,88,0.6)', boxShadow: '0 0 0 3px rgba(48,209,88,0.15)' } : {}),
                      ...(formData.first_name.trim() || errors.first_name ? { paddingRight: '40px' } : {})
                    }} />
                  {formData.first_name.trim() && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: errors.first_name || !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.first_name) ? '#FF375F' : '#30D158',
                  }}>
                    {errors.first_name || !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.first_name) ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </div>
                )}
                {errors.first_name && !formData.first_name.trim() && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#FF375F',
                  }}>
                    <XCircle size={18} />
                  </div>
                )}
                </div>
                <FieldError msg={errors.first_name} />
              </div>
              <div>
                <Label>Last Name</Label>
                <div style={{ position: 'relative' }}>
                  <input name="last_name" type="text" value={formData.last_name}
                    onChange={e => { 
                      handleChange(e); 
                      clearErr('last_name');
                      // Real-time validation for special characters
                      if (e.target.value && !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(e.target.value)) {
                        setErrors(p => ({...p, last_name: 'Enter a valid last name'}));
                      }
                    }} 
                    onFocus={() => setFocusedFields(p => ({...p, last_name: true}))}
                    onBlur={() => {
                      setFocusedFields(p => ({...p, last_name: false}));
                      // Validate on blur
                      if (!formData.last_name.trim()) {
                        setErrors(p => ({...p, last_name: 'Please enter your lastname'}));
                      } else if (!/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.last_name)) {
                        setErrors(p => ({...p, last_name: 'Enter a valid last name'}));
                      } else {
                        setErrors(p => ({...p, last_name: ''}));
                      }
                    }}
                    className="input-field" placeholder="Doe"
                    style={{
                      ...errors.last_name ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                      ...(formData.last_name.trim() && !errors.last_name && !focusedFields.last_name ? { borderColor: 'rgba(48,209,88,0.6)', boxShadow: '0 0 0 3px rgba(48,209,88,0.15)' } : {}),
                      ...(formData.last_name.trim() || errors.last_name ? { paddingRight: '40px' } : {})
                    }} />
                  {formData.last_name.trim() && (
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: errors.last_name || !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.last_name) ? '#FF375F' : '#30D158',
                    }}>
                      {errors.last_name || !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.last_name) ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </div>
                  )}
                  {errors.last_name && !formData.last_name.trim() && (
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#FF375F',
                    }}>
                      <XCircle size={18} />
                    </div>
                  )}
                </div>
                <FieldError msg={errors.last_name} />
              </div>
            </div>
            <div>
              <Label>Username</Label>
              <div style={{ position: 'relative' }}>
                <input name="username" type="text" value={formData.username}
                  onChange={e => { 
                    handleChange(e); 
                    clearErr('username');
                    // Real-time validation for special characters
                    if (e.target.value && !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(e.target.value)) {
                      setErrors(p => ({...p, username: 'Enter a valid username'}));
                    }
                  }} 
                  onFocus={() => setFocusedFields(p => ({...p, username: true}))}
                  onBlur={() => {
                      setFocusedFields(p => ({...p, username: false}));
                      // Validate on blur
                      if (!formData.username.trim()) {
                        setErrors(p => ({...p, username: 'Please enter your username'}));
                      } else if (!/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.username)) {
                        setErrors(p => ({...p, username: 'Enter a valid username'}));
                      } else {
                        setErrors(p => ({...p, username: ''}));
                      }
                    }}
                  className="input-field" placeholder="johndoe"
                  style={{
                    ...errors.username ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                    ...(formData.username.trim() && !errors.username && !focusedFields.username ? { borderColor: 'rgba(48,209,88,0.6)', boxShadow: '0 0 0 3px rgba(48,209,88,0.15)' } : {}),
                    ...(formData.username.trim() || errors.username ? { paddingRight: '40px' } : {})
                  }} />
                {formData.username.trim() && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: errors.username || !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.username) ? '#FF375F' : '#30D158',
                  }}>
                    {errors.username || !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(formData.username) ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </div>
                )}
                {errors.username && !formData.username.trim() && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#FF375F',
                  }}>
                    <XCircle size={18} />
                  </div>
                )}
              </div>
              <FieldError msg={errors.username} />
            </div>
            <div>
              <Label>Email</Label>
              <div style={{ position: 'relative' }}>
                <input name="email" type="email" value={formData.email}
                  onChange={e => { handleChange(e); clearErr('email') }} 
                  onFocus={() => setFocusedFields(p => ({...p, email: true}))}
                  onBlur={() => {
                      setFocusedFields(p => ({...p, email: false}));
                      // Validate on blur
                      if (!formData.email.trim()) {
                        setErrors(p => ({...p, email: 'Please enter your email'}));
                      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                        setErrors(p => ({...p, email: 'Please enter a valid email address'}));
                      } else {
                        setErrors(p => ({...p, email: ''}));
                      }
                    }}
                  className="input-field" placeholder="john@example.com"
                  style={{
                    ...errors.email ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                    ...(formData.email.trim() && !errors.email && !focusedFields.email ? { borderColor: 'rgba(48,209,88,0.6)', boxShadow: '0 0 0 3px rgba(48,209,88,0.15)' } : {}),
                    ...(formData.email.trim() || errors.email ? { paddingRight: '40px' } : {})
                  }} />
                {formData.email.trim() && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: errors.email || !/\S+@\S+\.\S+/.test(formData.email) ? '#FF375F' : '#30D158',
                  }}>
                    {errors.email || !/\S+@\S+\.\S+/.test(formData.email) ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </div>
                )}
                {errors.email && !formData.email.trim() && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#FF375F',
                  }}>
                    <XCircle size={18} />
                  </div>
                )}
              </div>
              <FieldError msg={errors.email} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>Password</Label>
                <div style={{ position: 'relative' }}>
                  <input name="password" type="password" value={formData.password}
                    onChange={e => { handleChange(e); clearErr('password') }} 
                    onFocus={() => setFocusedFields(p => ({...p, password: true}))}
                    onBlur={() => {
                      setFocusedFields(p => ({...p, password: false}));
                      // Validate on blur
                      if (!formData.password) {
                        setErrors(p => ({...p, password: 'Please enter your password'}));
                      } else if (formData.password.length < 12) {
                        setErrors(p => ({...p, password: 'Password must be at least 12 characters'}));
                      } else {
                        setErrors(p => ({...p, password: ''}));
                      }
                    }}
                    className="input-field" placeholder="••••••••"
                    style={{
                    ...errors.password ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                    ...(formData.password.length >= 12 && !errors.password && !focusedFields.password ? { borderColor: 'rgba(48,209,88,0.6)', boxShadow: '0 0 0 3px rgba(48,209,88,0.15)' } : {}),
                    ...((formData.password.length >= 12 || errors.password) && !focusedFields.password ? { paddingRight: '40px' } : {})
                  }} />
                  {!focusedFields.password && (formData.password.length >= 12 || errors.password) && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: errors.password ? '#FF375F' : '#30D158',
                  }}>
                    {errors.password ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </div>
                )}
                </div>
                <FieldError msg={errors.password} />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <div style={{ position: 'relative' }}>
                  <input name="password_confirm" type="password" value={formData.password_confirm}
                    onChange={e => { handleChange(e); clearErr('password_confirm') }} 
                    onFocus={() => setFocusedFields(p => ({...p, password_confirm: true}))}
                    onBlur={() => {
                      setFocusedFields(p => ({...p, password_confirm: false}));
                      // Validate on blur
                      if (!formData.password_confirm) {
                        setErrors(p => ({...p, password_confirm: 'Please confirm your password'}));
                      } else if (formData.password_confirm !== formData.password) {
                        setErrors(p => ({...p, password_confirm: 'Passwords do not match'}));
                      } else {
                        setErrors(p => ({...p, password_confirm: ''}));
                      }
                    }}
                    className="input-field" placeholder="••••••••"
                    style={{
                    ...errors.password_confirm ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                    ...(formData.password_confirm && formData.password_confirm === formData.password && !errors.password_confirm && !focusedFields.password_confirm ? { borderColor: 'rgba(48,209,88,0.6)', boxShadow: '0 0 0 3px rgba(48,209,88,0.15)' } : {}),
                    ...((formData.password_confirm || errors.password_confirm) && !focusedFields.password_confirm ? { paddingRight: '40px' } : {})
                  }} />
                  {!focusedFields.password_confirm && (formData.password_confirm || errors.password_confirm) && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: errors.password_confirm ? '#FF375F' : '#30D158',
                  }}>
                    {errors.password_confirm ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </div>
                )}
                </div>
                <FieldError msg={errors.password_confirm} />
              </div>
            </div>
            <button
              type="submit" disabled={loading || hasSubmitted} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 6,
                fontSize: '0.95rem', borderRadius: 14,
                background: 'linear-gradient(135deg, #5E5CE6, #0A84FF)' }}
            >
              {loading ? 'Creating account...' : hasSubmitted ? 'Processing...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20,
            color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0A84FF', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
