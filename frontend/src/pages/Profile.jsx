import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { User, Mail, Building2, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

function Profile() {
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState({
    bio: '',
    phone: '',
    company: '',
    job_title: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#FF375F'
      case 'manager':
        return '#FF9F0A'
      case 'approver':
        return '#30D158'
      case 'lite_user':
        return '#0A84FF'
      default:
        return '#8E8E93'
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      console.log('Profile: Fetching fresh user data from API...')
      
      // Always fetch fresh user data from API to ensure we have the latest info
      const userResponse = await api.get('/accounts/users/me/')
      console.log('Profile: Fresh user data received:', userResponse.data)
      
      if (userResponse.data) {
        // Set the user state with fresh data
        setUser(userResponse.data)
        
        // Update the profile data with the fresh user information
        const profileData = {
          bio: userResponse.data.profile?.bio || '',
          phone: userResponse.data.profile?.phone || '',
          company: userResponse.data.profile?.company || '',
          job_title: userResponse.data.profile?.job_title || '',
        }
        setProfileData(profileData)
        
        // Log the user details that will be displayed
        console.log('Profile: User details to display:', {
          username: userResponse.data.username,
          email: userResponse.data.email,
          firstName: userResponse.data.first_name,
          lastName: userResponse.data.last_name,
          fullName: `${userResponse.data.first_name} ${userResponse.data.last_name}`.trim() || userResponse.data.username
        })
      }
    } catch (error) {
      console.error('Profile: Error fetching profile:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/accounts/users/update_profile/', profileData)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const lbl = (text) => (
    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
      color: 'rgba(255,255,255,0.42)', marginBottom: 8,
      letterSpacing: '0.06em', textTransform: 'uppercase' }}>{text}</label>
  )

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '36px 40px'
    }}>
      <CrushLoader text="Loading profile..." />
    </div>
  )

  return (
    <div style={{ padding: '36px 40px' }}>
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Account</p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Left: edit form */}
        <div className="glass-card-static" style={{ padding: '32px' }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32,
            paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 900, color: '#fff',
              boxShadow: '0 8px 28px rgba(10,132,255,0.45)',
              flexShrink: 0,
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#fff' }}>
                {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </p>
              <span style={{
                padding: '2px 4px',
                background: 'transparent',
                borderRadius: '2px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#fff',
                textTransform: 'uppercase',
                display: 'inline-block',
                border: '2px solid rgba(255,255,255,0.6)',
                lineHeight: '1.1',
                minWidth: 'auto'
              }}>
                {(user?.profile?.role || 'lite_user').replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Read-only fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            {[{icon: User, label: 'Username', value: user?.username, color: '#0A84FF'},
              {icon: Mail, label: 'Email',    value: user?.email,    color: '#5E5CE6'}].map(({icon: Icon, label, value, color}) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                background: `${color}12`, border: `1px solid ${color}28`, borderRadius: 14,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10,
                  background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Editable form */}
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              {lbl('Bio')}
              <textarea value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="input-field" rows="3" placeholder="Tell us about yourself..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {lbl('Phone')}
                <input type="tel" value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="input-field" placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                {lbl('Job Title')}
                <input type="text" value={profileData.job_title}
                  onChange={(e) => setProfileData({ ...profileData, job_title: e.target.value })}
                  className="input-field" placeholder="Creative Director" />
              </div>
            </div>
            <div>
              {lbl('Company')}
              <input type="text" value={profileData.company}
                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                className="input-field" placeholder="Your company name" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary"
              style={{ alignSelf: 'flex-start', borderRadius: 14, padding: '12px 28px' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Right: summary card */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: 20 }}>Profile Summary</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[{icon: User,      label: 'Full Name',  value: (user?.first_name || user?.last_name) ? `${user.first_name} ${user.last_name}`.trim() : 'Not set', color: '#0A84FF'},
              {icon: Briefcase, label: 'Job Title',  value: profileData.job_title || 'Not set', color: '#30D158'},
              {icon: Building2, label: 'Company',    value: profileData.company   || 'Not set', color: '#5E5CE6'},
              {icon: Mail,      label: 'Email',      value: user?.email           || 'Not set', color: '#FF9F0A'},
            ].map(({icon: Icon, label, value, color}) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontWeight: 600, color: value === 'Not set' ? 'rgba(255,255,255,0.25)' : '#fff',
                    fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
