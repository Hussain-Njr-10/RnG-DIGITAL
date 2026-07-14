import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function JoinLink() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function checkToken() {
      // Token must be a valid UUID for this to work nicely without crashing PostgREST
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) {
        setError('Invalid invite link format.')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('invites')
        .select('*')
        .eq('id', token)
        .single()
      
      if (fetchError || !data) {
        setError('Invite link is invalid or has expired.')
      } else if (data.used) {
        setError('This invite link has already been used.')
      } else {
        setInvite(data)
      }
      setLoading(false)
    }
    
    checkToken()
  }, [token])

  const handleJoin = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password: password
    })

    if (authError) {
      setError(authError.message)
      setSubmitting(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      setError('Unknown error during sign up.')
      setSubmitting(false)
      return
    }

    // 2. Create the profiles row
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        role: invite.role,
        email: invite.email
      }])

    if (profileError) {
      setError('Account created, but failed to setup profile: ' + profileError.message)
      setSubmitting(false)
      return
    }

    // 3. Mark invite as used
    await supabase.from('invites').update({ used: true }).eq('id', token)

    // If there is a project_id linked to the invite, we would update the project's client_id here
    if (invite.project_id) {
      await supabase.from('projects').update({ client_id: userId }).eq('id', invite.project_id)
    }

    // 4. Redirect
    if (invite.role === 'staff') {
      navigate('/staff')
    } else {
      navigate('/client')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
        <p>Verifying invite link...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', fontFamily: 'var(--font-fraktion), monospace' }}>
        <div style={{ padding: '3rem', border: '1px solid var(--color-secondary)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', textTransform: 'uppercase', color: 'red' }}>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', fontFamily: 'var(--font-fraktion), monospace' }}>
      <form onSubmit={handleJoin} style={{ width: '100%', maxWidth: '400px', padding: '3rem', border: '1px solid var(--color-secondary)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', textTransform: 'uppercase', textAlign: 'center' }}>Welcome</h1>
        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '2rem' }}>You've been invited to join the portal. Set a password to continue.</p>
        
        <div style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
          <strong>Email:</strong> {invite?.email}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Password</label>
          <input 
            type="password" 
            required 
            minLength="6"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} 
          />
        </div>

        <button type="submit" disabled={submitting} style={{ width: '100%', padding: '1rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', textTransform: 'uppercase', fontFamily: 'inherit', fontWeight: 'bold' }}>
          {submitting ? 'Creating Account...' : 'Set Password & Join'}
        </button>
      </form>
    </div>
  )
}
