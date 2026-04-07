import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import EmailVerification from './pages/EmailVerification'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Folders from './pages/Folders'
import ProjectDetail from './pages/ProjectDetail'
import AssetDetail from './pages/AssetDetail'
import FileViewer from './pages/FileViewer'
import ProofReviewer from './pages/ProofReviewer'
import Workflows from './pages/Workflows'
import WorkflowTemplateBuilder from './pages/WorkflowTemplateBuilder'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Users from './pages/Users'

function AppContent() {
  const { token, checkAuth, startPermissionPolling, stopPermissionPolling, refreshUserData } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Clear all toasts when route changes
  useEffect(() => {
    toast.dismiss()
  }, [location.pathname])

  // Start/stop polling based on authentication
  useEffect(() => {
    if (token) {
      startPermissionPolling()
    } else {
      stopPermissionPolling()
    }
    
    return () => stopPermissionPolling()
  }, [token, startPermissionPolling, stopPermissionPolling])

  // Handle tab visibility - check permissions when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        // Tab became visible, refresh permissions immediately
        refreshUserData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [token, refreshUserData])

  return (
    <>
      <Toaster 
        position="top-center"
        limit={3}
        reverseOrder={true}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#333',
            fontSize: '0.95rem',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minWidth: '300px',
            maxWidth: '500px',
            textAlign: 'center',
          },
          success: {
            iconTheme: {
              primary: '#00D4AA',
              secondary: '#fff',
            },
            style: {
              background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.95), rgba(0, 184, 148, 0.95))',
              color: '#fff',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 212, 170, 0.25)',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF375F',
              secondary: '#fff',
            },
            style: {
              background: 'linear-gradient(135deg, rgba(255, 55, 95, 0.95), rgba(255, 71, 87, 0.95))',
              color: '#fff',
              border: '1px solid rgba(255, 55, 95, 0.3)',
              boxShadow: '0 8px 32px rgba(255, 55, 95, 0.25)',
            },
          },
          loading: {
            iconTheme: {
              primary: '#0A84FF',
              secondary: '#fff',
            },
            style: {
              background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.95), rgba(94, 92, 230, 0.95))',
              color: '#fff',
              border: '1px solid rgba(10, 132, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(10, 132, 255, 0.25)',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />
        
        {token ? (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/proof/:token" element={<Dashboard />} />
            <Route path="/proofs" element={<Projects />} />
            <Route path="/proofs/proof/:token" element={<Projects />} />
            <Route path="/folders" element={<Folders />} />
            <Route path="/folders/proof/:token" element={<Folders />} />
            <Route path="/proofs/:id" element={<ProjectDetail />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/files/:id" element={<FileViewer />} />
            <Route path="/proof-review/:proof_id" element={<ProofReviewer />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/workflows/templates" element={<WorkflowTemplateBuilder />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/users" element={<Users />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
