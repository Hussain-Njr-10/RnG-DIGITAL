import React from 'react'

export default function ClientDashboard() {
  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Dashboard</h1>
      <div style={{ padding: '2rem', border: '1px solid var(--color-secondary)' }}>
        <p style={{ opacity: 0.8, textTransform: 'uppercase' }}>Welcome to the client portal. Only users with the 'client' role can see this.</p>
      </div>
    </div>
  )
}
