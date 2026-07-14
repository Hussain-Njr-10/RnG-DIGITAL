import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from 'react-router-dom'

const COLUMNS = [
  { id: 'pending', title: 'Pending' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'completed', title: 'Completed' }
]

function DroppableColumn({ id, title, count, children }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const style = {
    flex: '1 0 300px',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--color-secondary)',
    padding: '1rem',
    backgroundColor: isOver ? 'rgba(255,255,255,0.05)' : 'transparent',
    transition: 'background-color 0.2s ease'
  }
  
  return (
    <div ref={setNodeRef} style={style}>
      <h3 style={{ textTransform: 'uppercase', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-secondary)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <span style={{ opacity: 0.5 }}>{count}</span>
      </h3>
      <div style={{ flex: 1, minHeight: '150px' }}>
        {children}
      </div>
    </div>
  )
}

function SortableItem({ id, project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    padding: '1rem', 
    border: '1px solid var(--color-secondary)', 
    marginBottom: '1rem', 
    backgroundColor: 'var(--color-primary)', 
    cursor: 'grab',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 1
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <h4 style={{ marginBottom: '0.5rem', textTransform: 'uppercase' }}>
        <Link to={`/admin/projects/${project.id}`} style={{ color: 'var(--color-secondary)', textDecoration: 'none' }} onPointerDown={e => e.stopPropagation()}>
          {project.title || `Project ${project.id.substring(0, 8)}`}
        </Link>
      </h4>
      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Client ID: {project.client_id?.substring(0, 8) || 'Unassigned'}</div>
    </div>
  )
}

export default function ProjectsKanban() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
    
    // Subscribe to realtime changes
    const channel = supabase.channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
        fetchProjects() // Refresh on any change
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchProjects() {
    const { data, error } = await supabase.from('projects').select('*')
    if (data) setProjects(data)
    setLoading(false)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id
    
    let newStatus = COLUMNS.find(c => c.id === overId)?.id
    
    // If dropped over an item instead of the column dropzone
    if (!newStatus) {
      const overProject = projects.find(p => p.id === overId)
      if (overProject) newStatus = overProject.status
    }
    
    if (!newStatus) return

    const activeProject = projects.find(p => p.id === activeId)
    if (activeProject && activeProject.status !== newStatus) {
      // Optimistic update
      setProjects(projects.map(p => p.id === activeId ? { ...p, status: newStatus } : p))
      
      // DB update
      await supabase.from('projects').update({ status: newStatus }).eq('id', activeId)
    }
  }

  const handleNewProject = async () => {
    const title = prompt("Enter project title:")
    if (!title) return
    const { error } = await supabase.from('projects').insert([{ title, status: 'pending' }])
    if (error) alert("Error creating project: " + error.message)
  }

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexShrink: 0 }}>
        <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects</h1>
        <button 
          onClick={handleNewProject}
          style={{ padding: '0.75rem 1.5rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'inherit' }}
        >
          New Project
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', paddingBottom: '1rem' }}>
          {COLUMNS.map(col => {
            const colProjects = projects.filter(p => p.status === col.id || (!p.status && col.id === 'pending'))
            
            return (
              <DroppableColumn key={col.id} id={col.id} title={col.title} count={colProjects.length}>
                <SortableContext id={col.id} items={colProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {colProjects.map(project => (
                    <SortableItem key={project.id} id={project.id} project={project} />
                  ))}
                </SortableContext>
              </DroppableColumn>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
