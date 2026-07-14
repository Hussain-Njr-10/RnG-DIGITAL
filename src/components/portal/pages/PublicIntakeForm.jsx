import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { notifyAllAdmins } from '@/lib/notifications'

export default function PublicIntakeForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    project_type: '',
    budget_range: '',
    requirements: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('inquiries')
      .insert([formData])

    if (insertError) {
      setError(insertError.message)
    } else {
      await notifyAllAdmins(`New project inquiry from ${formData.name}`, `/admin/clients`)
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', fontFamily: 'var(--font-fraktion), monospace' }}>
        <div style={{ width: '100%', maxWidth: '500px', padding: '3rem', border: '1px solid var(--color-secondary)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', textTransform: 'uppercase' }}>Thank You!</h1>
          <p style={{ opacity: 0.8, marginBottom: '2rem' }}>We have received your project details. Our team will review your inquiry and get back to you shortly.</p>
          <Link to="/" style={{ color: 'var(--color-secondary)', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 'bold', borderBottom: '1px solid var(--color-secondary)' }}>Back to Main Site</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', fontFamily: 'var(--font-fraktion), monospace', padding: '2rem 0' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '600px', padding: '3rem', border: '1px solid var(--color-secondary)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', textTransform: 'uppercase', textAlign: 'center' }}>Start a Project</h1>
        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '2rem' }}>Tell us about what you want to build.</p>
        
        {error && <div style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-secondary)', marginBottom: '2rem', padding: '1rem', fontWeight: 'bold' }}>{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Company (Optional)</label>
          <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Project Type</label>
            <select required value={formData.project_type} onChange={e => setFormData({...formData, project_type: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'var(--color-primary)', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }}>
              <option value="">Select...</option>
              <option value="website">Website Design / Dev</option>
              <option value="webapp">Web Application</option>
              <option value="ecommerce">E-Commerce</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Budget Range</label>
            <select required value={formData.budget_range} onChange={e => setFormData({...formData, budget_range: e.target.value})} style={{ width: '100%', padding: '1rem', background: 'var(--color-primary)', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }}>
              <option value="">Select...</option>
              <option value="<5k">Under $5k</option>
              <option value="5k-10k">$5k - $10k</option>
              <option value="10k-25k">$10k - $25k</option>
              <option value="25k+">$25k+</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Project Requirements</label>
          <textarea required value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} rows="5" style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', textTransform: 'uppercase', fontFamily: 'inherit', fontWeight: 'bold' }}>
          {loading ? 'Submitting...' : 'Submit Inquiry'}
        </button>
      </form>
    </div>
  )
}
