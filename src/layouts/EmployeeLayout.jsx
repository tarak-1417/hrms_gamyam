import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarOff,
  GitBranch,
  FolderOpen,
  FileText,
  Receipt,
  User,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import Toast from '../components/ui/Toast'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import useAppNavigation from '../hooks/useAppNavigation'

const navItems = [
  { to: '/employee', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/employee/leave', icon: CalendarOff, label: 'Leave Management' },
  { to: '/employee/reimbursements', icon: Receipt, label: 'Reimbursement' },
  { to: '/employee/payslips', icon: FileText, label: 'Payslips' },
  { to: '/employee/reporting', icon: GitBranch, label: 'My Reporting' },
  { to: '/employee/documents', icon: FolderOpen, label: 'Documents' },
]

export default function EmployeeLayout() {
  const { mobileNav: nav, sidebar, toggleNavigation } = useAppNavigation()

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden bg-surface">
      <Header
        variant="toolbar"
        onMenuClick={toggleNavigation}
        sidebarCollapsed={sidebar.collapsed}
        mobileNavOpen={nav.open}
        profilePath="/employee/profile"
        portalLabel="Employee Portal"
        toolbarHomePath="/employee"
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {nav.open && (
          <button
            type="button"
            className="app-shell-overlay fixed inset-x-0 bottom-0 z-40 bg-black/50 lg:hidden"
            onClick={nav.close}
            aria-label="Close menu"
          />
        )}
        <Sidebar
          variant="light"
          menuLabel="Main menu"
          navItems={navItems}
          bottomNavItems={[{ to: '/employee/profile', icon: User, label: 'Profile' }]}
          showSupportCard
          mobileOpen={nav.open}
          onClose={nav.close}
          dockBelowHeader
          collapsed={sidebar.collapsed}
          onToggleCollapsed={sidebar.toggle}
          showFooterCollapseToggle={false}
        />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 text-sm sm:p-5">
          <Outlet />
        </main>
      </div>

      <FloatingAiAssistant />
      <Toast />
    </div>
  )
}
