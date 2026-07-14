import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientsList() {
  const [clients, setClients] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', company: '', inquiry_id: null })

  useEffect(() => {
    fetchClients()
    fetchInquiries()
  }, [])

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
    
    if (!error && data) {
      setClients(data)
    }
    setLoading(false)
  }

  async function fetchInquiries() {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setInquiries(data)
    }
  }

  // Placeholder function
  const sendInviteEmail = async (email, inviteId) => {
    console.log(`Sending invite email to ${email}. Link: /portal/join/${inviteId}`)
    // This will be wired up later
  }

  const handleAddClient = async (e) => {
    e.preventDefault()
    
    let projectId = null

    if (newClient.inquiry_id) {
      const inquiry = inquiries.find(i => i.id === newClient.inquiry_id)
      if (inquiry) {
         const { data: projData, error: projErr } = await supabase.from('projects').insert([{
           title: `${inquiry.company || inquiry.name} - ${inquiry.project_type}`,
           status: 'pending',
           description: inquiry.requirements
           // client_id is null until they join
         }]).select().single()
         
         if (projData) projectId = projData.id
      }
    }

    // Create an invite record
    const { data, error } = await supabase
      .from('invites')
      .insert([{ 
        email: newClient.email, 
        role: 'client',
        project_id: projectId
      }])
      .select()
      .single()

    if (error) {
      console.error("Error creating invite:", error)
      alert("Failed to create invite: " + error.message)
      return
    }

    if (data) {
      await sendInviteEmail(newClient.email, data.id)
      
      if (newClient.inquiry_id) {
         await supabase.from('inquiries').delete().eq('id', newClient.inquiry_id)
         fetchInquiries()
      }

      alert(`Invite link generated: /portal/join/${data.id}\n\n(In production, this would be emailed)`)
      setShowModal(false)
      setNewClient({ name: '', email: '', company: '', inquiry_id: null })
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clients</h1>
        <button 
          onClick={() => { setNewClient({ name: '', email: '', company: '', inquiry_id: null }); setShowModal(true) }}
          style={{ padding: '0.75rem 1.5rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'inherit' }}
        >
          Add Client
        </button>
      </div>

      {inquiries.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem', color: 'orange' }}>Pending Inquiries</h2>
          <div style={{ border: '1px solid orange', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid orange' }}>
                  <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Project Type</th>
                  <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Budget</th>
                  <th style={{ padding: '1rem', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map(inq => (
                  <tr key={inq.id} style={{ borderBottom: '1px solid orange' }}>
                    <td style={{ padding: '1rem' }}>{inq.name} {inq.company && `(${inq.company})`}</td>
                    <td style={{ padding: '1rem' }}>{inq.email}</td>
                    <td style={{ padding: '1rem', textTransform: 'uppercase' }}>{inq.project_type}</td>
                    <td style={{ padding: '1rem' }}>{inq.budget_range}</td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => { setNewClient({ name: inq.name, email: inq.email, company: inq.company || '', inquiry_id: inq.id }); setShowModal(true) }}
                        style={{ padding: '0.5rem 1rem', background: 'orange', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.8rem' }}
                      >
                        Approve & Invite
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <tr><td colSpan="3" style={{ padding: '1rem', opacity: 0.7 }}>Loading clients...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '1rem', opacity: 0.7 }}>No clients found.</td></tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} style={{ borderBottom: '1px solid var(--color-secondary)' }}>
                  <td style={{ padding: '1rem' }}>{client.id}</td>
                  <td style={{ padding: '1rem' }}>{client.role}</td>
                  <td style={{ padding: '1rem' }}>{client.updated_at ? new Date(client.updated_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-primary)', padding: '2rem', border: '1px solid var(--color-secondary)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Add New Client</h2>
            
            <form onSubmit={handleAddClient}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Name</label>
                <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Email</label>
                <input required type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Company</label>
                <input required type="text" value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'inherit' }}>Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
