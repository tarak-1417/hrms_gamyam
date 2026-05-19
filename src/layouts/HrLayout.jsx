import { Outlet } from 'react-router-dom'
import HrSidebar from '../components/layout/HrSidebar'
import HrTopBar from '../components/layout/HrTopBar'
import FloatingAiAssistant from '../components/ai/FloatingAiAssistant'
import Toast from '../components/ui/Toast'
import useMobileNav from '../hooks/useMobileNav'

export default function HrLayout({ navItems, portalLabel }) {
  const nav = useMobileNav()

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      {nav.open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={nav.close}
          aria-label="Close menu"
        />
      )}
      <HrSidebar
        navItems={navItems}
        portalLabel={portalLabel}
        mobileOpen={nav.open}
        onClose={nav.close}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <HrTopBar onMenuClick={nav.toggle} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 text-sm sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
      <FloatingAiAssistant />
      <Toast />
    </div>
  )
}
