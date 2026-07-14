import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function SetPassword() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if there is a recovery/invite session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Ready to update password
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage("Password updated successfully! Redirecting...")
      setTimeout(() => navigate('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', fontFamily: 'var(--font-fraktion), monospace' }}>
      <form onSubmit={handleUpdatePassword} style={{ width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid var(--color-secondary)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', textTransform: 'uppercase', textAlign: 'center' }}>Set Your Password</h1>
        
        {error && <div style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-secondary)', marginBottom: '1rem', padding: '1rem', fontWeight: 'bold' }}>{error}</div>}
        {message && <div style={{ color: 'var(--color-primary)', backgroundColor: '#4ade80', marginBottom: '1rem', padding: '1rem', fontWeight: 'bold' }}>{message}</div>}

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>New Password</label>
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
          {loading ? 'Updating...' : 'Set Password'}
        </button>
      </form>
    </div>
  )
}
