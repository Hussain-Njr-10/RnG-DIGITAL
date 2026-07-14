import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyAllAdmins, notifyProjectStaff } from '@/lib/notifications'

export default function ClientProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetchProjectData()

    // Subscriptions
    const messagesChannel = supabase.channel('client_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `project_id=eq.${id}` }, () => fetchMessages())
      .subscribe()

    const filesChannel = supabase.channel('client_files_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files', filter: `project_id=eq.${id}` }, () => fetchFiles())
      .subscribe()
      
    const projectChannel = supabase.channel('client_project_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${id}` }, (payload) => {
        setProject(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(filesChannel)
      supabase.removeChannel(projectChannel)
    }
  }, [id])

  async function fetchProjectData() {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').eq('id', id).single()
    if (data) setProject(data)
    await Promise.all([fetchMessages(), fetchFiles()])
    setLoading(false)
  }

  async function fetchMessages() {
    const { data } = await supabase.from('messages').select('*').eq('project_id', id).order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  async function fetchFiles() {
    const { data } = await supabase.from('files').select('*').eq('project_id', id).order('created_at', { ascending: false })
    if (data) setFiles(data)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    
    await supabase.from('messages').insert([{ project_id: id, sender_id: user?.id, content: newMessage }])
    setNewMessage('')
  }
  
  const handleFileUpload = async () => {
    const fileName = prompt("Enter a name for the mock file upload:")
    if (fileName) {
      await supabase.from('files').insert([{ project_id: id, name: fileName, url: '#' }])
      
      const msg = `Client uploaded file '${fileName}' for project '${project.title}'`
      await notifyAllAdmins(msg, `/admin/projects/${id}`)
      await notifyProjectStaff(id, msg, `/staff`)

      alert("Mock file uploaded successfully!")
    }
  }
  
  const handleApprove = async (status) => {
    await supabase.from('projects').update({ status }).eq('id', id)
    setProject(prev => ({...prev, status}))
    
    const msg = `Client updated project '${project.title}' status to ${status}`
    await notifyAllAdmins(msg, `/admin/projects/${id}`)
    await notifyProjectStaff(id, msg, `/staff`)
  }

  if (loading) return <div style={{ opacity: 0.7 }}>Loading project...</div>
  if (!project) return <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>Project not found or you don't have access.</div>

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link to="/client" style={{ color: 'var(--color-secondary)', textDecoration: 'none', opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase' }}>← Back to Projects</Link>
          <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem' }}>
            {project.title || `Project ${project.id.substring(0,8)}`}
          </h1>
          <div style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.5rem' }}>Current Status: <strong style={{ textTransform: 'uppercase' }}>{project.status}</strong></div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => handleApprove('revision_requested')} style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold' }}>Request Changes</button>
          <button onClick={() => handleApprove('approved')} style={{ padding: '0.75rem 1.5rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold' }}>Approve Project</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Left Column: Files & Timeline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', paddingRight: '1rem' }}>
          
          <div style={{ border: '1px solid var(--color-secondary)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>Files & Deliverables</h2>
              <button onClick={handleFileUpload} style={{ padding: '0.5rem 1rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.8rem' }}>Upload File</button>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.length === 0 && <li style={{ opacity: 0.5 }}>No files shared yet.</li>}
              {files.map(file => (
                <li key={file.id} style={{ padding: '0.75rem 0', borderBottom: '1px dashed var(--color-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <a href={file.url || '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)' }}>{file.name || 'Unnamed File'}</a>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Download</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right Column: Messages */}
        <div style={{ flex: 1, border: '1px solid var(--color-secondary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-secondary)' }}>
            <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>Messages</h2>
          </div>
          
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 && <div style={{ opacity: 0.5 }}>No messages yet. Say hello!</div>}
            {messages.map(msg => {
              const isMine = msg.sender_id === user?.id
              return (
                <div key={msg.id} style={{ 
                  padding: '1rem', 
                  background: isMine ? 'rgba(255,255,255,0.1)' : 'transparent', 
                  border: isMine ? 'none' : '1px solid var(--color-secondary)',
                  marginLeft: isMine ? '20%' : '0',
                  marginRight: isMine ? '0' : '20%'
                }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.25rem' }}>
                    {isMine ? 'You' : 'Agency'} - {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : 'Just now'}
                  </div>
                  <div>{msg.content}</div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-secondary)' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem' }}>
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message to the agency..." style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
              <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'inherit' }}>Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
