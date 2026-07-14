import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function StaffList() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaff()
  }, [])

  async function fetchStaff() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
    
    if (!error && data) {
      setStaff(data)
    }
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Directory</h1>
      </div>

      <div style={{ border: '1px solid var(--color-secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-secondary)' }}>
              <th style={{ padding: '1rem', textTransform: 'uppercase' }}>ID</th>
              <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" style={{ padding: '1rem', opacity: 0.7 }}>Loading staff...</td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '1rem', opacity: 0.7 }}>No staff members found.</td></tr>
            ) : (
              staff.map(member => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--color-secondary)' }}>
                  <td style={{ padding: '1rem' }}>{member.id}</td>
                  <td style={{ padding: '1rem' }}>{member.role}</td>
                  <td style={{ padding: '1rem' }}>{member.updated_at ? new Date(member.updated_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
