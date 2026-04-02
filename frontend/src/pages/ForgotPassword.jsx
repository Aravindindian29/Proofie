import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, XCircle } from 'lucide-react'
import api from '../services/api'

const FieldError = ({ msg }) => msg ? (
  <p style={{
    display: 'block',
    marginTop: 5, fontSize: '0.78rem', fontWeight: 600,
    color: '#FF375F', letterSpacing: '0.01em',
  }}>
    {msg}
  </p>
) : null

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [focusedFields, setFocusedFields] = useState({})
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!email.trim()) {
      e.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      e.email = 'Please enter a valid email address (e.g., user@domain.com)'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setLoading(true)
    try {
      await api.post('/accounts/password-reset/', { email })
      setSubmitted(true)
      toast.success('Reset link sent to your email!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
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
              Check Your Email
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: '0.95rem' }}>
              We've sent a password reset link to your email
            </p>
          </div>

          <div className="glass-card-static" style={{ padding: '36px 32px' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 20, textAlign: 'center',
            }}>
              <Mail size={48} color="rgba(255,255,255,0.7)" />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                Click the link in your email to reset your password.<br />
                If you don't see it, check your spam folder.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px',
                  fontSize: '1rem', borderRadius: 14 }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
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
            Forgot Password?
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: '0.95rem' }}>
            No worries, we'll send you reset instructions
          </p>
        </div>

        <div className="glass-card-static" style={{ padding: '36px 32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.06em',
                textTransform: 'uppercase' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({...p, email: ''})) }}
                  onFocus={() => setFocusedFields(p => ({...p, email: true}))}
                  onBlur={() => setFocusedFields(p => ({...p, email: false}))}
                  className="input-field"
                  placeholder="Enter your email"
                  required
                  style={{
                    ...errors.email ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {},
                    ...(email.trim() && !focusedFields.email ? { paddingRight: '40px' } : {}),
                    ...(email.trim() && !/\S+@\S+\.\S+/.test(email) && !focusedFields.email && !errors.email ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {})
                  }}
                />
                {email.trim() && !focusedFields.email && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: /\S+@\S+\.\S+/.test(email) ? '#30D158' : '#FF375F',
                  }}>
                    {/\S+@\S+\.\S+/.test(email) ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </div>
                )}
              </div>
              <FieldError msg={errors.email} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 8,
                fontSize: '1rem', borderRadius: 14 }}
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Sending...
                </>
              ) : 'Send Reset Link'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#0A84FF', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
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

export default ForgotPassword
