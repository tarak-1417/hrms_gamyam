import { Outlet } from 'react-router-dom'
import {
  Sparkles,
  LayoutDashboard,
  UsersRound,
  GitBranch,
  ClipboardList,
  FileText,
  FolderOpen,
  User,
} from 'lucide-react'
import AdminDarkSidebar from '../components/hr/admin/AdminDarkSidebar'
import AdminDarkNavbar from '../components/hr/admin/AdminDarkNavbar'
import Toast from '../components/ui/Toast'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import useAppNavigation from '../hooks/useAppNavigation'
import useAdminTheme from '../hooks/useAdminTheme'

const navItems = [
  { to: '/manager', icon: Sparkles, label: 'AI Assistant', end: true },
  { to: '/manager/overview', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/manager/team', icon: UsersRound, label: 'My Team' },
  { to: '/manager/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/manager/leave', icon: ClipboardList, label: 'Leave' },
  { to: '/manager/payslips', icon: FileText, label: 'Payslips' },
  { to: '/manager/documents', icon: FolderOpen, label: 'My documents' },
  { to: '/manager/profile', icon: User, label: 'My profile' },
]

export default function ManagerLayout() {
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
        homePath="/manager"
        brandLabel="Manager Portal"
        assistTitle="Your Team Copilot"
        assistText="Ask about your team, leave approvals, payslips and reports in seconds."
      />

      <main className="hrx-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 text-sm">
        <AdminDarkNavbar
          onMenuClick={toggleNavigation}
          mobileNavOpen={nav.open}
          profilePath="/manager/profile"
          isDark={isDark}
          onToggleTheme={toggleTheme}
          searchPlaceholder="Search team, leave, pages…"
        />
        <Outlet />
      </main>

      <FloatingAiAssistant />
      <Toast />
    </div>
  )
}
