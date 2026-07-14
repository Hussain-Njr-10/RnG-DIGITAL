import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function ClientProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  async function fetchProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setProjects(data)
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Projects</h1>
      
      {loading ? (
        <div style={{ opacity: 0.7 }}>Loading your projects...</div>
      ) : projects.length === 0 ? (
        <div style={{ padding: '2rem', border: '1px solid var(--color-secondary)' }}>
          <p style={{ opacity: 0.8 }}>You don't have any projects assigned to you yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {projects.map(project => (
            <div key={project.id} style={{ border: '1px solid var(--color-secondary)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{project.title || `Project ${project.id.substring(0,8)}`}</h3>
              <p style={{ opacity: 0.7, marginBottom: '1.5rem', flex: 1 }}>Status: {project.status}</p>
              
              <Link 
                to={`/client/projects/${project.id}`} 
                style={{ 
                  display: 'inline-block', 
                  padding: '0.75rem 1.5rem', 
                  background: 'var(--color-secondary)', 
                  color: 'var(--color-primary)', 
                  textDecoration: 'none', 
                  textTransform: 'uppercase', 
                  fontWeight: 'bold', 
                  textAlign: 'center' 
                }}
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
