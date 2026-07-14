import React from 'react'

export default function AdminDashboard() {
  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Dashboard</h1>
      <div style={{ padding: '2rem', border: '1px solid var(--color-secondary)' }}>
        <p style={{ opacity: 0.8, textTransform: 'uppercase' }}>Welcome to the admin portal. Only users with the 'admin' role can see this.</p>
      </div>
    </div>
  )
}
