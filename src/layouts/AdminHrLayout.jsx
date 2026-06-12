import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  UsersRound,
  FileText,
  Network,
  CalendarCheck,
  Sparkles,
} from 'lucide-react'
import AdminDarkSidebar from '../components/hr/admin/AdminDarkSidebar'
import AdminDarkNavbar from '../components/hr/admin/AdminDarkNavbar'
import Toast from '../components/ui/Toast'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import useAppNavigation from '../hooks/useAppNavigation'
import useAdminTheme from '../hooks/useAdminTheme'

const navItems = [
  { to: '/admin', icon: Sparkles, label: 'AI Assistant', end: true },
  { to: '/admin/overview', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/employees', icon: UsersRound, label: 'Employees' },
  { to: '/admin/reporting', icon: Network, label: 'Reporting tree' },
  { to: '/admin/leave', icon: CalendarCheck, label: 'Leave approvals' },
  { to: '/admin/documents', icon: FileText, label: 'HR documents' },
]

export default function AdminHrLayout() {
  const { mobileNav: nav, sidebar, toggleNavigation } = useAppNavigation()
  const { isDark, toggle: toggleTheme } = useAdminTheme()

  return (
    <div
      className={`${
        isDark ? 'hr-admin-dark' : 'hr-admin-light'
      } app-shell hrx-shell-bg relative flex h-screen gap-4 overflow-hidden p-3 sm:gap-6 sm:p-4`}
    >
      {nav.open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={nav.close}
          aria-label="Close menu"
        />
      )}

      <AdminDarkSidebar
        navItems={navItems}
        mobileOpen={nav.open}
        onClose={nav.close}
        collapsed={sidebar.collapsed}
        onToggleCollapsed={sidebar.toggle}
        homePath="/admin"
      />

      <main className="hrx-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 text-sm">
        <AdminDarkNavbar
          onMenuClick={toggleNavigation}
          mobileNavOpen={nav.open}
          profilePath={null}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <Outlet />
      </main>

      <FloatingAiAssistant />
      <Toast />
    </div>
  )
}
