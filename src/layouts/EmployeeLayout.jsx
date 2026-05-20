import { Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarOff,
  GitBranch,
  FileText,
  ClipboardList,
  FolderOpen,
  TrendingUp,
  MessageSquare,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import Toast from '../components/ui/Toast'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import useMobileNav from '../hooks/useMobileNav'

const navItems = [
  { to: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/leave', icon: CalendarOff, label: 'Leave' },
  { to: '/employee/reporting', icon: GitBranch, label: 'My reporting' },
  { to: '/employee/payslips', icon: FileText, label: 'Payslips' },
  { to: '/employee/tasks', icon: ClipboardList, label: 'Tasks' },
  { to: '/employee/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/employee/performance', icon: TrendingUp, label: 'Performance' },
  { to: '/employee/communication', icon: MessageSquare, label: 'Messages' },
]

const pageTitles = {
  '/employee': { title: 'My Dashboard', description: 'Welcome back!' },
  '/employee/profile': { title: 'My Profile', description: 'Personal information' },
  '/employee/leave': { title: 'Leave & Holidays', description: 'Balances, holidays, and leave requests' },
  '/employee/reporting': { title: 'My reporting', description: 'Your manager and reporting chain' },
  '/employee/payslips': { title: 'Payslips', description: 'View salary statements' },
  '/employee/tasks': { title: 'Tasks', description: 'Your assigned tasks' },
  '/employee/documents': { title: 'Documents', description: 'HR documents & files' },
  '/employee/performance': { title: 'Performance', description: 'Reviews & ratings' },
  '/employee/communication': { title: 'Messages', description: 'Internal communication' },
}

export default function EmployeeLayout() {
  const { pathname } = useLocation()
  const meta = pageTitles[pathname] ?? pageTitles['/employee']
  const nav = useMobileNav()

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {nav.open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={nav.close}
          aria-label="Close menu"
        />
      )}
      <Sidebar
        brand={{ title: 'Gamyam HRMS', subtitle: 'Employee Portal' }}
        navItems={navItems}
        profilePath="/employee/profile"
        mobileOpen={nav.open}
        onClose={nav.close}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          title={meta.title}
          description={meta.description}
          onMenuClick={nav.toggle}
        />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 text-sm sm:p-5">
          <Outlet />
        </main>
      </div>
      <FloatingAiAssistant />
      <Toast />
    </div>
  )
}
