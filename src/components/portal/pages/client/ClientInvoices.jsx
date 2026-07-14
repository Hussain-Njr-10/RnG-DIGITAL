import React from 'react'

export default function ClientInvoices() {
  // Mock data as requested
  const mockInvoices = [
    { id: 'INV-001', title: 'Website Design Initial Deposit', amount: '$2,500.00', status: 'Paid', date: '2026-07-01' },
    { id: 'INV-002', title: 'Development Milestone 1', amount: '$3,000.00', status: 'Pending', date: '2026-07-15' }
  ]

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoices</h1>
      
      <div style={{ padding: '1rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-secondary)' }}>
        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Note: Real payment data integration will be added later.</p>
      </div>

      <div style={{ border: '1px solid var(--color-secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-secondary)' }}>
              <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Invoice</th>
              <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Amount</th>
              <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockInvoices.map(invoice => (
              <tr key={invoice.id} style={{ borderBottom: '1px solid var(--color-secondary)' }}>
                <td style={{ padding: '1rem' }}>{invoice.id}</td>
                <td style={{ padding: '1rem' }}>{invoice.title}</td>
                <td style={{ padding: '1rem' }}>{invoice.date}</td>
                <td style={{ padding: '1rem' }}>{invoice.amount}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    border: '1px solid var(--color-secondary)',
                    backgroundColor: invoice.status === 'Paid' ? 'var(--color-secondary)' : 'transparent',
                    color: invoice.status === 'Paid' ? 'var(--color-primary)' : 'var(--color-secondary)'
                  }}>
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
