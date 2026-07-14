import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { notifyUser, notifyAllAdmins } from '@/lib/notifications'

export default function StaffTaskDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    let messagesChannel;
    let filesChannel;

    async function fetchTaskData() {
      setLoading(true)
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*, projects(*)')
        .eq('id', id)
        .single()
        
      if (taskData) {
        setTask(taskData)
        await Promise.all([fetchMessages(taskData.project_id), fetchFiles(taskData.project_id)])
        
        messagesChannel = supabase.channel(`staff_msg_${taskData.project_id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `project_id=eq.${taskData.project_id}` }, () => fetchMessages(taskData.project_id))
          .subscribe()

        filesChannel = supabase.channel(`staff_file_${taskData.project_id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'files', filter: `project_id=eq.${taskData.project_id}` }, () => fetchFiles(taskData.project_id))
          .subscribe()
      }
      setLoading(false)
    }

    fetchTaskData()

    return () => {
      if (messagesChannel) supabase.removeChannel(messagesChannel)
      if (filesChannel) supabase.removeChannel(filesChannel)
    }
  }, [id])

  async function fetchMessages(projectId) {
    const { data } = await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  async function fetchFiles(projectId) {
    const { data } = await supabase.from('files').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    if (data) setFiles(data)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !task?.project_id) return
    
    await supabase.from('messages').insert([{ project_id: task.project_id, sender_id: user?.id, content: newMessage }])
    setNewMessage('')
  }
  
  const handleFileUpload = async () => {
    if (!task?.project_id) return
    const fileName = prompt("Enter a name for the mock file upload:")
    if (fileName) {
      await supabase.from('files').insert([{ project_id: task.project_id, name: fileName, url: '#' }])
      alert("Mock file uploaded successfully!")
    }
  }

  const handleStatusChange = async (newStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    setTask(prev => ({...prev, status: newStatus}))

    const link = `/admin/projects/${task.project_id}`
    await notifyAllAdmins(`Task '${task.title}' updated to ${newStatus}`, link)
    if (task.projects?.client_id) {
      await notifyUser(task.projects.client_id, `Task '${task.title}' updated to ${newStatus}`, `/client/projects/${task.project_id}`)
    }
  }

  if (loading) return <div style={{ opacity: 0.7 }}>Loading task details...</div>
  if (!task) return <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>Task not found or you don't have access.</div>

  const project = task.projects || {}

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link to="/staff" style={{ color: 'var(--color-secondary)', textDecoration: 'none', opacity: 0.7, fontSize: '0.8rem', textTransform: 'uppercase' }}>← Back to My Tasks</Link>
          <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem' }}>
            {task.title}
          </h1>
          <div style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.5rem' }}>Project: <strong style={{ textTransform: 'uppercase' }}>{project.title}</strong></div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Task Status:</span>
          <select 
            value={task.status || 'todo'} 
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ 
              background: 'var(--color-secondary)', 
              color: 'var(--color-primary)', 
              border: 'none', 
              padding: '0.75rem 1.5rem',
              fontFamily: 'inherit',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
        {/* Left Column: Task details & Files */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', paddingRight: '1rem' }}>
          
          <div style={{ border: '1px solid var(--color-secondary)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Task Details</h2>
            <p style={{ opacity: 0.8 }}><strong>Due Date:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None set'}</p>
            <p style={{ opacity: 0.8, marginTop: '1rem' }}><strong>Description:</strong> {task.description || 'No description provided.'}</p>
          </div>

          <div style={{ border: '1px solid var(--color-secondary)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>Project Files</h2>
              <button onClick={handleFileUpload} style={{ padding: '0.5rem 1rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.8rem' }}>Upload Deliverable</button>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.length === 0 && <li style={{ opacity: 0.5 }}>No files in this project yet.</li>}
              {files.map(file => (
                <li key={file.id} style={{ padding: '0.75rem 0', borderBottom: '1px dashed var(--color-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <a href={file.url || '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)' }}>{file.name || 'Unnamed File'}</a>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Download</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right Column: Project Messages */}
        <div style={{ flex: 1, border: '1px solid var(--color-secondary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-secondary)' }}>
            <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>Project Chat</h2>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Visible to client and all staff on this project</div>
          </div>
          
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 && <div style={{ opacity: 0.5 }}>No messages yet in this project.</div>}
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
                    {isMine ? 'You' : 'Someone'} - {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : 'Just now'}
                  </div>
                  <div>{msg.content}</div>
                </div>
              )
            })}
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
