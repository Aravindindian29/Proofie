import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react'

function EmailVerification() {
  const [status, setStatus] = useState('loading') // loading, success, error, expired
  const [message, setMessage] = useState('')
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await api.get(`/accounts/verify-email/${token}/`)
      setMessage(response.data.message)
      setStatus('success')
      toast.success('Email verified successfully!')
    } catch (error) {
      if (error.response?.data?.error) {
        const errorMsg = error.response.data.error
        setMessage(errorMsg)
        
        if (errorMsg.includes('expired')) {
          setStatus('expired')
        } else {
          setStatus('error')
        }
      } else {
        setMessage('Invalid verification link')
        setStatus('error')
      }
      toast.error('Email verification failed')
    }
  }

  const handleLoginRedirect = () => {
    navigate('/login')
  }

  const handleResendEmail = () => {
    // TODO: Implement resend verification email
    toast.info('Resend feature coming soon')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center'
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          background: status === 'success' 
            ? 'linear-gradient(135deg, #00D4AA, #00B894)'
            : status === 'expired'
            ? 'linear-gradient(135deg, #FF9F0A, #F39C12)'
            : status === 'error'
            ? 'linear-gradient(135deg, #FF375F, #E74C3C)'
            : 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
          boxShadow: status === 'success'
            ? '0 8px 32px rgba(0, 212, 170, 0.3)'
            : status === 'expired'
            ? '0 8px 32px rgba(255, 159, 10, 0.3)'
            : status === 'error'
            ? '0 8px 32px rgba(255, 55, 95, 0.3)'
            : '0 8px 32px rgba(10, 132, 255, 0.3)',
        }}>
          {status === 'loading' && <Clock size={40} color="#fff" />}
          {status === 'success' && <CheckCircle size={40} color="#fff" />}
          {status === 'expired' && <Clock size={40} color="#fff" />}
          {status === 'error' && <XCircle size={40} color="#fff" />}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '800',
          color: '#333',
          marginBottom: '16px',
          letterSpacing: '-0.02em'
        }}>
          {status === 'loading' && 'Verifying...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'expired' && 'Link Expired'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p style={{
          fontSize: '1rem',
          color: '#666',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          {message}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {status === 'success' && (
            <button
              onClick={handleLoginRedirect}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #00D4AA, #00B894)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 212, 170, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(0, 212, 170, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 16px rgba(0, 212, 170, 0.3)'
              }}
            >
              Continue to Login
            </button>
          )}

          {status === 'expired' && (
            <button
              onClick={handleResendEmail}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #FF9F0A, #F39C12)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(255, 159, 10, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(255, 159, 10, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 16px rgba(255, 159, 10, 0.3)'
              }}
            >
              Resend Verification Email
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={handleLoginRedirect}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #6C5CE7, #5E5CE6)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(108, 92, 231, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(108, 92, 231, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 16px rgba(108, 92, 231, 0.3)'
              }}
            >
              Back to Login
            </button>
          )}
        </div>

        {/* Help Text */}
        {status !== 'loading' && (
          <div style={{
            marginTop: '32px',
            padding: '16px',
            background: 'rgba(0, 132, 255, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 132, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Mail size={16} color="#0A84FF" />
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0A84FF' }}>
                Need Help?
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
              If you're having trouble verifying your email, please contact support or check your spam folder.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailVerification
