import React, { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout() {
  const { role, user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    const channel = supabase.channel(`notifications_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setNotifications(data)
  }

  const markAsRead = async (id, link) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setShowNotifications(false)
    if (link) navigate(link)
  }

  const unreadCount = notifications.filter(n => !n.read).length

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
              <Link to="/admin/clients" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>Clients</Link>
              <Link to="/admin/projects" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>Projects</Link>
              <Link to="/admin/staff" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>Staff</Link>
              <Link to="/admin/settings" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.7 }}>Settings</Link>
            </>
          )}
          {role === 'client' && (
            <>
              <Link to="/client" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>My Projects</Link>
              <Link to="/client/invoices" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>Invoices</Link>
              <Link to="/client/settings" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.7 }}>Settings</Link>
            </>
          )}
          {role === 'staff' && (
            <>
              <Link to="/staff" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase' }}>My Tasks</Link>
              <Link to="/staff/settings" style={{ color: 'var(--color-secondary)', textDecoration: 'none', textTransform: 'uppercase', opacity: 0.7 }}>Settings</Link>
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

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Topbar with Notifications */}
        <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--color-secondary)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: 'red', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: '40px', width: '300px', background: 'var(--color-primary)', border: '1px solid var(--color-secondary)', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Notifications</div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1rem', opacity: 0.7 }}>No notifications.</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id, n.link)}
                      style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid var(--color-secondary)', 
                        cursor: 'pointer',
                        background: n.read ? 'transparent' : 'rgba(255,255,255,0.05)',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
