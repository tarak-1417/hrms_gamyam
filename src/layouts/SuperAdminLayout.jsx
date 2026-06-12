import { Outlet } from 'react-router-dom'
import {
  Sparkles,
  LayoutDashboard,
  Building2,
  FileStack,
  Network,
  GitBranch,
  Users,
  UserCog,
  CalendarOff,
} from 'lucide-react'
import AdminDarkSidebar from '../components/hr/admin/AdminDarkSidebar'
import AdminDarkNavbar from '../components/hr/admin/AdminDarkNavbar'
import Toast from '../components/ui/Toast'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import useAppNavigation from '../hooks/useAppNavigation'
import useAdminTheme from '../hooks/useAdminTheme'

const navItems = [
  { to: '/superadmin', icon: Sparkles, label: 'AI Assistant', end: true },
  { to: '/superadmin/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/superadmin/organization', icon: Network, label: 'Org setup' },
  { to: '/superadmin/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/superadmin/companies', icon: Building2, label: 'Organizations' },
  { to: '/superadmin/users', icon: UserCog, label: 'Users & access' },
  { to: '/superadmin/documents', icon: FileStack, label: 'Documents' },
  { to: '/superadmin/hr', icon: LayoutDashboard, label: 'HR dashboard', end: true },
  { to: '/superadmin/hr/employees', icon: Users, label: 'HR employees' },
  { to: '/superadmin/hr/leave', icon: CalendarOff, label: 'HR leave' },
]

export default function SuperAdminLayout() {
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
        homePath="/superadmin"
        brandLabel="Super Admin"
        assistTitle="Platform Copilot"
        assistText="Ask about organizations, users, subscriptions and platform stats in seconds."
      />

      <main className="hrx-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 text-sm">
        <AdminDarkNavbar
          onMenuClick={toggleNavigation}
          mobileNavOpen={nav.open}
          profilePath={null}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          searchPlaceholder="Search orgs, users, pages…"
          pendingCount={0}
        />
        <Outlet />
      </main>

      <FloatingAiAssistant />
      <Toast />
    </div>
  )
}
