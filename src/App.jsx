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
import Roles from './pages/admin/Roles'
import ManagerReports from './pages/manager/Reports'

import ManagerDashboard from './pages/manager/Dashboard'
import ManagerTeam from './pages/manager/Team'
import HrAttendance from './pages/shared/HrAttendance'
import HrLeave from './pages/shared/HrLeave'
import DocumentTemplates from './pages/shared/DocumentTemplates'

import SuperAdminDashboard from './pages/superadmin/Dashboard'
import Companies from './pages/superadmin/Companies'
import Subscriptions from './pages/superadmin/Subscriptions'
import Monitoring from './pages/superadmin/Monitoring'
import SuperAdminAnalytics from './pages/superadmin/Analytics'
import Billing from './pages/superadmin/Billing'

import EmployeeDashboard from './pages/employee/Dashboard'
import Profile from './pages/employee/Profile'
import EmployeeAttendance from './pages/employee/Attendance'
import EmployeeLeave from './pages/employee/Leave'
import Payslips from './pages/employee/Payslips'
import EmployeeTasks from './pages/employee/Tasks'
import Documents from './pages/employee/Documents'
import Performance from './pages/employee/Performance'
import Communication from './pages/employee/Communication'
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
            <Route path="roles" element={<Roles />} />
            <Route path="settings" element={<Settings />} />
            <Route path="documents" element={<DocumentTemplates />} />
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
            <Route path="companies" element={<Companies />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="analytics" element={<SuperAdminAnalytics />} />
            <Route path="billing" element={<Billing />} />
            <Route path="documents" element={<DocumentTemplates />} />
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
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leave" element={<EmployeeLeave />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="documents" element={<Documents />} />
            <Route path="performance" element={<Performance />} />
            <Route path="communication" element={<Communication />} />
            <Route path="ai" element={<AiAssistant />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
  )
}
