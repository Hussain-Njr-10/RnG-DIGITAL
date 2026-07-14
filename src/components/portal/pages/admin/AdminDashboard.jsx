import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Briefcase, Clock, FileText } from 'lucide-react'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    upcomingDeadlines: 0,
    totalClients: 0,
    totalStaff: 0,
    pendingInvoices: 5 // Mocked for now
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Fetch active projects (not completed)
        const { count: activeProjectsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'completed')

        // Fetch upcoming deadlines (within 7 days)
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        const { count: upcomingDeadlinesCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .lte('deadline', nextWeek.toISOString())
          .gt('deadline', new Date().toISOString())
          .neq('status', 'completed')

        // Fetch clients
        const { count: clientsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'client')

        // Fetch staff
        const { count: staffCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'staff')

        setMetrics({
          activeProjects: activeProjectsCount || 0,
          upcomingDeadlines: upcomingDeadlinesCount || 0,
          totalClients: clientsCount || 0,
          totalStaff: staffCount || 0,
          pendingInvoices: 5 // Mocked
        })
      } catch (error) {
        console.error("Error fetching metrics", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) return <div style={{ opacity: 0.7 }}>Loading dashboard...</div>

  const StatCard = ({ title, value, icon: Icon }) => (
    <div style={{ padding: '2rem', border: '1px solid var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{value}</p>
      </div>
      <Icon size={48} style={{ opacity: 0.2 }} />
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--font-fraktion), monospace' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        <StatCard title="Active Projects" value={metrics.activeProjects} icon={Briefcase} />
        <StatCard title="Upcoming Deadlines" value={metrics.upcomingDeadlines} icon={Clock} />
        <StatCard title="Pending Invoices" value={metrics.pendingInvoices} icon={FileText} />
        <StatCard title="Total Clients" value={metrics.totalClients} icon={Users} />
        <StatCard title="Total Staff" value={metrics.totalStaff} icon={Users} />
      </div>
    </div>
  )
}
