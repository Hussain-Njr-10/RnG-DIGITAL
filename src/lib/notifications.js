import { supabase } from './supabase'

export const notifyUser = async (userId, message, link) => {
  if (!userId) return;
  await supabase.from('notifications').insert([{ user_id: userId, message, link }])
}

export const notifyAllAdmins = async (message, link) => {
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
  if (admins) {
    const notifications = admins.map(admin => ({ user_id: admin.id, message, link }))
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
    }
  }
}

export const notifyProjectStaff = async (projectId, message, link) => {
  const { data: tasks } = await supabase.from('tasks').select('assigned_staff').eq('project_id', projectId)
  if (tasks) {
    const staffIds = [...new Set(tasks.map(t => t.assigned_staff).filter(Boolean))]
    const notifications = staffIds.map(id => ({ user_id: id, message, link }))
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
    }
  }
}
