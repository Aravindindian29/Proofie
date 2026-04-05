import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { XCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { usePreventDuplicateToast } from '../hooks/usePreventDuplicateToast'

const FieldError = ({ msg }) => msg ? (
  <p style={{
    display: 'block',
    marginTop: 5, fontSize: '0.78rem', fontWeight: 600,
    color: '#FF375F', letterSpacing: '0.01em',
  }}>
    {msg}
  </p>
) : null

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [focusedFields, setFocusedFields] = useState({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const { showToast } = usePreventDuplicateToast()

  
  const clearErr = (field) => setErrors(p => ({ ...p, [field]: '' }))

  const validate = () => {
    const e = {}
    if (!username.trim()) e.username = 'Please enter your username'
    else if (!/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(username)) e.username = 'Enter a valid username'
    if (!password) e.password = 'Please enter your password'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (loading || hasSubmitted) return
    
    if (!validate()) return
    
    setHasSubmitted(true)
    setLoading(true)
    
    try {
      await login(username, password)
      showToast('success', 'Login successful!')
      navigate('/dashboard')
    } catch (error) {
      // Use consistent toast ID to prevent duplicates
      toast.error('Unable to log in. Please check your credentials\nAnd verify your email if you haven\'t already.', {
        id: 'login-error',
        duration: 5000,
        position: 'top-center',
      })
    } finally {
      setLoading(false)
      setHasSubmitted(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
    }}>
      {/* Floating orbs */}
      <div style={{
        position: 'fixed', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,132,255,0.25) 0%, transparent 70%)',
        top: '-100px', left: '-100px', pointerEvents: 'none',
        animation: 'float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(94,92,230,0.2) 0%, transparent 70%)',
        bottom: '-80px', right: '-80px', pointerEvents: 'none',
        animation: 'float 8s ease-in-out infinite reverse',
      }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: 'linear-gradient(135deg, #5E5CE6, #FF375F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(94,92,230,0.5)',
            fontSize: 32, fontWeight: 900, color: '#fff',
          }}>P</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
            Proofie
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: '0.95rem' }}>
            Creative Proofing &amp; Collaboration
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-card-static" style={{ padding: '36px 32px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 24, color: '#fff', textAlign: 'center' }}>
            Sign in
          </h2>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.06em',
                textTransform: 'uppercase' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { 
                    setUsername(e.target.value); 
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
                    if (!username.trim()) {
                      setErrors(p => ({...p, username: 'Please enter your username'}));
                    } else if (!/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(username)) {
                      setErrors(p => ({...p, username: 'Enter a valid username'}));
                    } else {
                      setErrors(p => ({...p, username: ''}));
                    }
                  }}
                  className="input-field"
                  placeholder="Enter your username"
                  style={{
                    ...errors.username ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                    ...(username.trim() && !errors.username && !focusedFields.username ? { borderColor: 'rgba(48,209,88,0.6)', boxShadow: '0 0 0 3px rgba(48,209,88,0.15)' } : {}),
                    ...(username.trim() || errors.username ? { paddingRight: '40px' } : {})
                  }}
                />
                {username.trim() && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: errors.username || !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(username) ? '#FF375F' : '#30D158',
                  }}>
                    {errors.username || !/^[a-zA-Z]+[a-zA-Z0-9]*$/.test(username) ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </div>
                )}
                {errors.username && !username.trim() && (
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.06em',
                textTransform: 'uppercase' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({...p, password: ''})) }}
                  onFocus={() => setFocusedFields(p => ({...p, password: true}))}
                  onBlur={() => setFocusedFields(p => ({...p, password: false}))}
                  className="input-field"
                  placeholder="Enter your password"
                  style={{
                    ...errors.password ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                    ...(password && !errors.password && !focusedFields.password ? { paddingRight: '40px' } : {})
                  }}
                />
                {password && !errors.password && !focusedFields.password && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#30D158',
                  }}>
                    <CheckCircle size={18} />
                  </div>
                )}
              </div>
              <FieldError msg={errors.password} />
            </div>

            <button
              type="submit"
              disabled={loading || hasSubmitted}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 8,
                fontSize: '1rem', borderRadius: 14 }}
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Signing in...
                </>
              ) : hasSubmitted ? (
                'Processing...'
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ color: '#0A84FF', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
              Forgot Password?
            </Link>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#0A84FF', fontWeight: 600, textDecoration: 'none' }}>
              Register here
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default Login
