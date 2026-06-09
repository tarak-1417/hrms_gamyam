import { Outlet } from 'react-router-dom'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import Toast from '../components/ui/Toast'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import useAppNavigation from '../hooks/useAppNavigation'

export default function HrLayout({
  navItems,
  navSections,
  portalLabel,
  profilePath,
  toolbarHomePath,
  searchVariant = 'hr',
  searchPlaceholder = 'Search employees, leave, pages…',
}) {
  const { mobileNav: nav, sidebar, toggleNavigation } = useAppNavigation()
  const combinedNavItems =
    navItems ??
    (navSections ?? [])
      .flatMap((section) => section.items ?? [])
      .filter(Boolean)

  const homePath =
    toolbarHomePath ??
    (combinedNavItems?.[0]?.to
      ? combinedNavItems[0].to
      : '/manager')

  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden bg-surface">
      <Header
        variant="toolbar"
        onMenuClick={toggleNavigation}
        sidebarCollapsed={sidebar.collapsed}
        mobileNavOpen={nav.open}
        profilePath={profilePath}
        portalLabel={portalLabel}
        toolbarHomePath={homePath}
        searchVariant={searchVariant}
        searchPlaceholder={searchPlaceholder}
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
          navSections={navSections}
          mobileOpen={nav.open}
          onClose={nav.close}
          dockBelowHeader
          collapsed={sidebar.collapsed}
          onToggleCollapsed={sidebar.toggle}
          showFooterCollapseToggle={false}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 text-sm sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>

      <FloatingAiAssistant />
      <Toast />
    </div>
  )
}
