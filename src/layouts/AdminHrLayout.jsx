import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileStack,
  GitBranch,
  ClipboardList,
  Receipt,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import Toast from '../components/ui/Toast'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import useAppNavigation from '../hooks/useAppNavigation'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/admin/leave', icon: ClipboardList, label: 'Leave approvals' },
  { to: '/admin/reimbursements', icon: Receipt, label: 'Reimbursements' },
  { to: '/admin/documents', icon: FileStack, label: 'HR documents' },
]

export default function AdminHrLayout() {
  const { mobileNav: nav, sidebar, toggleNavigation } = useAppNavigation()

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden bg-surface">
      <Header
        variant="toolbar"
        onMenuClick={toggleNavigation}
        sidebarCollapsed={sidebar.collapsed}
        mobileNavOpen={nav.open}
        profilePath={null}
        portalLabel="HR Admin"
        toolbarHomePath="/admin"
        searchVariant="hr"
        searchPlaceholder="Search employees, leave, pages…"
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
