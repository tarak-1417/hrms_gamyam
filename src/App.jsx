import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/auth/Login'

import AdminHrLayout from './layouts/AdminHrLayout'
import ManagerLayout from './layouts/ManagerLayout'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import EmployeeLayout from './layouts/EmployeeLayout'

import HrDashboard from './pages/admin/HrDashboard'
import Employees from './pages/admin/Employees'
import Departments from './pages/shared/Departments'
import Payroll from './pages/admin/Payroll'
import Settings from './pages/admin/Settings'
import Recruitment from './pages/admin/Recruitment'
import ManagerReports from './pages/manager/Reports'

import ManagerDashboard from './pages/manager/Dashboard'
import ManagerTeam from './pages/manager/Team'
import HrAttendance from './pages/shared/HrAttendance'
import HrLeave from './pages/shared/HrLeave'
import DocumentTemplates from './pages/shared/DocumentTemplates'
import AuditLogs from './pages/shared/AuditLogs'
import ReportingTree from './pages/shared/ReportingTree'

import SuperAdminDashboard from './pages/superadmin/Dashboard'
import Companies from './pages/superadmin/Companies'
import Subscriptions from './pages/superadmin/Subscriptions'
import Monitoring from './pages/superadmin/Monitoring'
import SuperAdminAnalytics from './pages/superadmin/Analytics'
import Billing from './pages/superadmin/Billing'
import Organization from './pages/superadmin/Organization'
import PlatformUsers from './pages/superadmin/PlatformUsers'
import GlobalSettings from './pages/superadmin/GlobalSettings'
import SuperAdminPermissions from './pages/superadmin/Permissions'
import DeletedRecordsRecovery from './pages/superadmin/DeletedRecordsRecovery'

import EmployeeDashboard from './pages/employee/Dashboard'
import Profile from './pages/employee/Profile'
import EmployeeLeave from './pages/employee/Leave'
import Payslips from './pages/employee/Payslips'
import Documents from './pages/employee/Documents'
import AiAssistant from './pages/employee/AiAssistant'

const HOME = {
  admin: '/admin',
  manager: '/manager',
  employee: '/employee',
  superadmin: '/superadmin',
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={HOME[user.role] ?? '/login'} replace />
}

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/manager"
            element={
              <ProtectedRoute role="manager">
                <ManagerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagerDashboard />} />
            <Route path="team" element={<ManagerTeam />} />
            <Route path="departments" element={<Departments />} />
            <Route path="attendance" element={<HrAttendance />} />
            <Route path="leave" element={<HrLeave />} />
            <Route path="reporting" element={<ReportingTree />} />
            <Route path="reports" element={<ManagerReports />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminHrLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HrDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="departments" element={<Departments />} />
            <Route path="attendance" element={<HrAttendance />} />
            <Route path="leave" element={<HrLeave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="reports" element={<ManagerReports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="documents" element={<DocumentTemplates />} />
            <Route path="reporting" element={<ReportingTree />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          <Route
            path="/superadmin"
            element={
              <ProtectedRoute role="superadmin">
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="organization" element={<Organization />} />
            <Route path="reporting" element={<ReportingTree />} />
            <Route path="companies" element={<Companies />} />
            <Route path="users" element={<PlatformUsers />} />
            <Route path="permissions" element={<SuperAdminPermissions />} />
            <Route path="settings" element={<GlobalSettings />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="analytics" element={<SuperAdminAnalytics />} />
            <Route path="billing" element={<Billing />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="trash" element={<DeletedRecordsRecovery />} />
            <Route path="documents" element={<DocumentTemplates />} />
            <Route path="hr">
              <Route index element={<HrDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="reporting" element={<ReportingTree />} />
              <Route path="attendance" element={<HrAttendance />} />
              <Route path="leave" element={<HrLeave />} />
              <Route path="payroll" element={<Payroll />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="reports" element={<ManagerReports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
          </Route>

          <Route
            path="/employee"
            element={
              <ProtectedRoute role="employee">
                <EmployeeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="leave" element={<EmployeeLeave />} />
            <Route path="reporting" element={<ReportingTree />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="documents" element={<Documents />} />
            <Route path="ai" element={<AiAssistant />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
  )
}
