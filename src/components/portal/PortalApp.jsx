import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './ProtectedRoute'

import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import DashboardLayout from './layouts/DashboardLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClientsList from './pages/admin/ClientsList'
import ProjectsKanban from './pages/admin/ProjectsKanban'
import ProjectDetail from './pages/admin/ProjectDetail'
import StaffList from './pages/admin/StaffList'
import ClientDashboard from './pages/ClientDashboard'
import StaffDashboard from './pages/StaffDashboard'

export default function PortalApp() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/portal">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/set-password" element={<SetPassword />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/admin">
              <Route 
                index 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="clients" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ClientsList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="projects" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ProjectsKanban />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="projects/:id" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ProjectDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="staff" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <StaffList />
                  </ProtectedRoute>
                } 
              />
            </Route>
            <Route 
              path="/client" 
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff" 
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
