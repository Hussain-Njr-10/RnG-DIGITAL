import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout() {
  const { role, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', fontFamily: 'var(--font-fraktion), monospace' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', borderRight: '1px solid var(--color-secondary)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RnG Portal</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {role === 'admin' && (
            <>
              <Link to="/admin" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>Dashboard</Link>
              <Link to="/admin/settings" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.7 }}>Settings</Link>
            </>
          )}
          {role === 'client' && (
            <>
              <Link to="/client" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>Dashboard</Link>
              <Link to="/client/reports" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.7 }}>Reports</Link>
            </>
          )}
          {role === 'staff' && (
            <>
              <Link to="/staff" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>Dashboard</Link>
              <Link to="/staff/tasks" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.7 }}>My Tasks</Link>
            </>
          )}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, wordBreak: 'break-all' }}>
            Logged in as:<br/>{user?.email}
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '1rem', 
              background: 'transparent', 
              color: 'var(--color-secondary)', 
              border: '1px solid var(--color-secondary)', 
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontFamily: 'inherit'
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
