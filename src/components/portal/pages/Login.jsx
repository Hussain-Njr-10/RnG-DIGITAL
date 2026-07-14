import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, role, loading: authLoading } = useAuth()

  // If already logged in, redirect based on role
  React.useEffect(() => {
    if (user && role) {
      if (role === 'admin') navigate('/admin')
      else if (role === 'client') navigate('/client')
      else if (role === 'staff') navigate('/staff')
    } else if (user && role === null && !authLoading && loading) {
      setError("No role found. Please ensure your profile is created and you have the correct role assigned.")
      setLoading(false)
      // Optionally sign out the user if they have no role
      supabase.auth.signOut()
    }
  }, [user, role, authLoading, navigate, loading])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Success will be handled by the AuthContext which updates the user state, 
    // triggering the useEffect above to redirect.
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', fontFamily: 'var(--font-fraktion), monospace' }}>
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid var(--color-secondary)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textTransform: 'uppercase', textAlign: 'center' }}>Portal Login</h1>
        
        {error && <div style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-secondary)', marginBottom: '1rem', padding: '1rem', fontWeight: 'bold' }}>{error}</div>}
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }}
            required
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '1rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', fontFamily: 'inherit', fontWeight: 'bold' }}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
