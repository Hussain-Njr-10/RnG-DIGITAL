import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function StaffTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchTasks()
  }, [user])

  async function fetchTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(title)')
      .eq('assigned_staff', user.id)
      .order('due_date', { ascending: true })
    
    if (data) setTasks(data)
    setLoading(false)
  }

  const handleStatusChange = async (taskId, newStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    fetchTasks()
  }

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo' || !t.status),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    done: tasks.filter(t => t.status === 'done')
  }

  const renderTaskCard = (task) => (
    <div key={task.id} style={{ border: '1px solid var(--color-secondary)', padding: '1rem', marginBottom: '1rem', backgroundColor: 'var(--color-primary)' }}>
      <h4 style={{ margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>{task.title}</h4>
      <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', opacity: 0.7 }}>Project: {task.projects?.title || 'Unknown'}</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
        <span style={{ opacity: task.due_date ? 1 : 0.5 }}>
          Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
        </span>
        <select 
          value={task.status || 'todo'} 
          onChange={(e) => handleStatusChange(task.id, e.target.value)}
          style={{ 
            background: 'var(--color-primary)', 
            color: 'var(--color-secondary)', 
            border: '1px solid var(--color-secondary)', 
            padding: '0.25rem',
            fontFamily: 'inherit',
            textTransform: 'uppercase'
          }}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <Link to={`/staff/tasks/${task.id}`} style={{ color: 'var(--color-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 'bold' }}>View Details →</Link>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Tasks</h1>
      
      {loading ? (
        <div style={{ opacity: 0.7 }}>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div style={{ padding: '2rem', border: '1px solid var(--color-secondary)' }}>
          <p style={{ opacity: 0.8 }}>You don't have any tasks assigned to you right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
          
          {/* Timeline View */}
          <div style={{ flex: '0 0 250px', borderRight: '1px dashed var(--color-secondary)', paddingRight: '1rem', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Upcoming</h2>
            {tasks.filter(t => t.status !== 'done').map(task => (
              <div key={task.id} style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{task.title}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{task.projects?.title}</div>
              </div>
            ))}
          </div>

          {/* Kanban Board */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ textTransform: 'uppercase', borderBottom: '1px solid var(--color-secondary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>To Do</h3>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>{groupedTasks.todo.map(renderTaskCard)}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ textTransform: 'uppercase', borderBottom: '1px solid var(--color-secondary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>In Progress</h3>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>{groupedTasks.in_progress.map(renderTaskCard)}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ textTransform: 'uppercase', borderBottom: '1px solid var(--color-secondary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Review</h3>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>{groupedTasks.review.map(renderTaskCard)}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ textTransform: 'uppercase', borderBottom: '1px solid var(--color-secondary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Done</h3>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>{groupedTasks.done.map(renderTaskCard)}</div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}
