import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If roles are specified and user's role doesn't match
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect them to their appropriate dashboard based on their role
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />
      case 'client':
        return <Navigate to="/client" replace />
      case 'staff':
        return <Navigate to="/staff" replace />
      default:
        // If role is unknown, maybe send back to login
        return <Navigate to="/login" replace />
    }
  }

  return children
}
