import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Lock, CheckCircle } from 'lucide-react'
import api from '../services/api'

function ResetPassword() {
  const { uid, token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Basic validation of token format
    if (uid && token) {
      setValid(true)
    }
    setValidating(false)
  }, [uid, token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!password) {
      toast.error('Password is required')
      return
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    setLoading(true)
    try {
      await api.post('/accounts/password-reset-confirm/', {
        uid,
        token,
        password,
      })
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'linear-gradient(135deg, #5E5CE6, #FF375F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 32px rgba(94,92,230,0.5)',
              fontSize: 32, fontWeight: 900, color: '#fff',
            }}>P</div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
              Validating...
            </h1>
          </div>
        </div>
      </div>
    )
  }

  if (!valid) {
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
              background: 'linear-gradient(135deg, #FF375F, #FF6B6B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 32px rgba(255,55,95,0.5)',
              fontSize: 32, fontWeight: 900, color: '#fff',
            }}>!</div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
              Invalid Reset Link
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: '0.95rem' }}>
              This password reset link is invalid or has expired
            </p>
          </div>

          <div className="glass-card-static" style={{ padding: '36px 32px' }}>
            <button
              onClick={() => navigate('/forgot-password')}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px',
                fontSize: '1rem', borderRadius: 14 }}
            >
              Request New Reset Link
            </button>
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
            Reset Password
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: '0.95rem' }}>
            Enter your new password below
          </p>
        </div>

        <div className="glass-card-static" style={{ padding: '36px 32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.06em',
                textTransform: 'uppercase' }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.06em',
                textTransform: 'uppercase' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm new password"
                required
              />
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
                  Resetting...
                </>
              ) : 'Reset Password'}
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

export default ResetPassword
