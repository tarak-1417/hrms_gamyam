import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/ui/PageLoader'
import Login from './pages/auth/Login'

import AdminHrLayout from './layouts/AdminHrLayout'
import ManagerLayout from './layouts/ManagerLayout'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import EmployeeLayout from './layouts/EmployeeLayout'

const HrDashboard = lazy(() => import('./pages/admin/HrDashboard'))
const Employees = lazy(() => import('./pages/admin/Employees'))
const Assistant = lazy(() => import('./pages/admin/Assistant'))
const Departments = lazy(() => import('./pages/shared/Departments'))
const Recruitment = lazy(() => import('./pages/admin/Recruitment'))
const ManagerReports = lazy(() => import('./pages/manager/Reports'))

const ManagerDashboard = lazy(() => import('./pages/manager/Dashboard'))
const ManagerTeam = lazy(() => import('./pages/manager/Team'))
const ManagerLeave = lazy(() => import('./pages/manager/Leave'))
const HrLeave = lazy(() => import('./pages/shared/HrLeave'))
const DocumentTemplates = lazy(() => import('./pages/shared/DocumentTemplates'))
const AuditLogs = lazy(() => import('./pages/shared/AuditLogs'))
const ReportingTree = lazy(() => import('./pages/shared/ReportingTree'))
const Payslips = lazy(() => import('./pages/employee/Payslips'))

const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'))
const Companies = lazy(() => import('./pages/superadmin/Companies'))
const Subscriptions = lazy(() => import('./pages/superadmin/Subscriptions'))
const Monitoring = lazy(() => import('./pages/superadmin/Monitoring'))
const SuperAdminAnalytics = lazy(() => import('./pages/superadmin/Analytics'))
const Billing = lazy(() => import('./pages/superadmin/Billing'))
const Organization = lazy(() => import('./pages/superadmin/Organization'))
const PlatformUsers = lazy(() => import('./pages/superadmin/PlatformUsers'))
const SuperAdminPermissions = lazy(() => import('./pages/superadmin/Permissions'))
const DeletedRecordsRecovery = lazy(() => import('./pages/superadmin/DeletedRecordsRecovery'))

const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard'))
const Profile = lazy(() => import('./pages/employee/Profile'))
const EmployeeLeave = lazy(() => import('./pages/employee/Leave'))
const Documents = lazy(() => import('./pages/employee/Documents'))
const AiAssistant = lazy(() => import('./pages/employee/AiAssistant'))

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
      <Suspense fallback={<PageLoader />}>
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
            <Route index element={<Assistant />} />
            <Route path="overview" element={<ManagerDashboard />} />
            <Route path="team" element={<ManagerTeam />} />
            <Route path="departments" element={<Departments />} />
            <Route path="leave" element={<ManagerLeave defaultTab="approvals" />} />
            <Route path="profile" element={<Profile />} />
            <Route path="my-leave" element={<ManagerLeave defaultTab="apply" />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="documents" element={<Documents />} />
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
            <Route index element={<Assistant />} />
            <Route path="overview" element={<HrDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="departments" element={<Departments />} />
            <Route path="leave" element={<HrLeave />} />
            <Route path="profile" element={<Profile />} />
            <Route path="my-leave" element={<EmployeeLeave />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="my-documents" element={<Documents />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="reports" element={<ManagerReports />} />
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
            <Route index element={<Assistant />} />
            <Route path="overview" element={<SuperAdminDashboard />} />
            <Route path="organization" element={<Organization />} />
            <Route path="reporting" element={<ReportingTree />} />
            <Route path="companies" element={<Companies />} />
            <Route path="users" element={<PlatformUsers />} />
            <Route path="permissions" element={<SuperAdminPermissions />} />
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
              <Route path="leave" element={<HrLeave />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="reports" element={<ManagerReports />} />
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
            <Route index element={<AiAssistant />} />
            <Route path="overview" element={<EmployeeDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="leave" element={<EmployeeLeave />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="reporting" element={<ReportingTree />} />
            <Route path="documents" element={<Documents />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
