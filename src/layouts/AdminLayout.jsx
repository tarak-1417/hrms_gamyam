import { Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarOff,
  Wallet,
  Settings,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/departments', icon: Building2, label: 'Departments' },
  { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/admin/leave', icon: CalendarOff, label: 'Leave Management' },
  { to: '/admin/payroll', icon: Wallet, label: 'Payroll' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

const pageTitles = {
  '/admin': { title: 'Dashboard', description: 'Overview of your organization' },
  '/admin/employees': { title: 'Employees', description: 'Manage employee records' },
  '/admin/departments': { title: 'Departments', description: 'Organizational structure' },
  '/admin/attendance': { title: 'Attendance', description: "Today's attendance overview" },
  '/admin/leave': { title: 'Leave Management', description: 'Review and approve leave requests' },
  '/admin/payroll': { title: 'Payroll', description: 'Salary and compensation' },
  '/admin/settings': { title: 'Settings', description: 'System configuration' },
}

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        brand={{ title: 'Gamyam HRMS', subtitle: 'Admin Panel' }}
        navItems={navItems}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderWrapper titles={pageTitles} />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function HeaderWrapper({ titles }) {
  const { pathname } = useLocation()
  const meta = titles[pathname] ?? titles['/admin']
  return <Header title={meta.title} description={meta.description} />
}
