import { Outlet } from 'react-router-dom'
import {
  Sparkles,
  LayoutDashboard,
  CalendarOff,
  GitBranch,
  FolderOpen,
  FileText,
  User,
} from 'lucide-react'
import AdminDarkSidebar from '../components/hr/admin/AdminDarkSidebar'
import AdminDarkNavbar from '../components/hr/admin/AdminDarkNavbar'
import Toast from '../components/ui/Toast'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import useAppNavigation from '../hooks/useAppNavigation'
import useAdminTheme from '../hooks/useAdminTheme'

const navItems = [
  { to: '/employee', icon: Sparkles, label: 'AI Assistant', end: true },
  { to: '/employee/overview', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/leave', icon: CalendarOff, label: 'Leave Management' },
  { to: '/employee/payslips', icon: FileText, label: 'Payslips' },
  { to: '/employee/reporting', icon: GitBranch, label: 'My Reporting' },
  { to: '/employee/documents', icon: FolderOpen, label: 'Documents' },
  { to: '/employee/profile', icon: User, label: 'Profile' },
]

export default function EmployeeLayout() {
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
        homePath="/employee"
        brandLabel="Employee Portal"
        assistTitle="Your HR Copilot"
        assistText="Ask about your leave balance, payslips and documents in seconds."
      />

      <main className="hrx-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 text-sm">
        <AdminDarkNavbar
          onMenuClick={toggleNavigation}
          mobileNavOpen={nav.open}
          profilePath="/employee/profile"
          isDark={isDark}
          onToggleTheme={toggleTheme}
          searchPlaceholder="Search leave, payslips, pages…"
          pendingCount={0}
        />
        <Outlet />
      </main>

      <FloatingAiAssistant />
      <Toast />
    </div>
  )
}
