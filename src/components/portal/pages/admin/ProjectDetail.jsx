import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { notifyUser } from '@/lib/notifications'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const [newMessage, setNewMessage] = useState('')
  const [newTask, setNewTask] = useState('')
  const [assignedStaff, setAssignedStaff] = useState('')
  const [staffList, setStaffList] = useState([])

  useEffect(() => {
    fetchProjectData()

    // Subscriptions for real-time updates
    const tasksChannel = supabase.channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${id}` }, () => fetchTasks())
      .subscribe()
      
    const messagesChannel = supabase.channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `project_id=eq.${id}` }, () => fetchMessages())
      .subscribe()

    const filesChannel = supabase.channel('files_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files', filter: `project_id=eq.${id}` }, () => fetchFiles())
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(filesChannel)
    }
  }, [id])

  async function fetchProjectData() {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').eq('id', id).single()
    if (data) setProject(data)
    await Promise.all([fetchTasks(), fetchMessages(), fetchFiles(), fetchStaff()])
    setLoading(false)
  }

  async function fetchStaff() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'staff')
    if (data) setStaffList(data)
  }

  async function fetchTasks() {
    const { data, error } = await supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  async function fetchMessages() {
    const { data, error } = await supabase.from('messages').select('*').eq('project_id', id).order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  async function fetchFiles() {
    const { data, error } = await supabase.from('files').select('*').eq('project_id', id).order('created_at', { ascending: false })
    if (data) setFiles(data)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    
    // Assume auth user is sender
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('messages').insert([{ project_id: id, sender_id: user?.id, content: newMessage }])
    setNewMessage('')
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    
    const { data } = await supabase.from('tasks').insert([{ project_id: id, title: newTask, status: 'pending', assigned_staff: assignedStaff || null }]).select().single()
    
    if (data && assignedStaff) {
      await notifyUser(assignedStaff, `You have been assigned a new task: '${data.title}'`, `/staff/tasks/${data.id}`)
    }
    
    setNewTask('')
    setAssignedStaff('')
  }

  if (loading) return <div style={{ opacity: 0.7 }}>Loading project...</div>
  if (!project) return <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>Project not found</div>

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/admin/projects" style={{ color: 'var(--color-secondary)', textDecoration: 'none', opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase' }}>← Back to Projects</Link>
        <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem' }}>
          {project.title || `Project ${project.id.substring(0,8)}`}
        </h1>
        <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Status: {project.status}</div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Left Column: Tasks & Files */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', paddingRight: '1rem' }}>
          
          {/* Tasks Section */}
          <div style={{ border: '1px solid var(--color-secondary)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Tasks</h2>
            
            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="New task..." style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
              <select value={assignedStaff} onChange={e => setAssignedStaff(e.target.value)} style={{ padding: '0.75rem', background: 'var(--color-primary)', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }}>
                <option value="">Unassigned</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.email}</option>)}
              </select>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'inherit' }}>Add</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tasks.length === 0 && <li style={{ opacity: 0.5 }}>No tasks yet.</li>}
              {tasks.map(task => (
                <li key={task.id} style={{ padding: '1rem', borderBottom: '1px solid var(--color-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{task.title}</span>
                  <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>{task.status}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Files Section */}
          <div style={{ border: '1px solid var(--color-secondary)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Files</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.length === 0 && <li style={{ opacity: 0.5 }}>No files yet.</li>}
              {files.map(file => (
                <li key={file.id} style={{ padding: '0.5rem 0', borderBottom: '1px dashed var(--color-secondary)' }}>
                  <a href={file.url || '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)' }}>{file.name || 'Unnamed File'}</a>
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
            {messages.length === 0 && <div style={{ opacity: 0.5 }}>No messages yet. Start the conversation!</div>}
            {messages.map(msg => (
              <div key={msg.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderLeft: '2px solid var(--color-secondary)' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.25rem' }}>
                  {msg.sender_id?.substring(0,8) || 'Unknown User'} - {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : 'Just now'}
                </div>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-secondary)' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem' }}>
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-secondary)', color: 'var(--color-secondary)', outline: 'none', fontFamily: 'inherit' }} />
              <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'inherit' }}>Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
