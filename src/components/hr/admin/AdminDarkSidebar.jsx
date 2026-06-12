import { Link, NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, Sparkles, X } from 'lucide-react'

/**
 * Standalone dark glassmorphism sidebar for the HR Admin portal.
 * Full height (no top navbar) with its own brand header. Self-contained so
 * the shared light Sidebar (employee/manager portals) stays untouched.
 */
export default function AdminDarkSidebar({
  navItems = [],
  mobileOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapsed,
  homePath = '/admin',
  brandLabel = 'HR Admin',
  menuLabel = 'Main menu',
  assistTitle = 'People Ops Copilot',
  assistText = 'Ask the assistant about leave, payroll and headcount in seconds.',
}) {
  const asideClass = [
    'hrx-sidebar-bg fixed inset-y-0 left-0 z-50',
    'flex w-[min(280px,88vw)] shrink-0 flex-col overflow-hidden shadow-2xl shadow-black/40',
    'transition-[transform,width] duration-300 ease-out',
    'lg:static lg:z-auto lg:h-full lg:translate-x-0 lg:rounded-3xl lg:shadow-xl lg:shadow-black/30',
    collapsed ? 'lg:w-[4.75rem]' : 'lg:w-[264px]',
    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
  ].join(' ')

  return (
    <aside className={asideClass}>
      {/* brand header */}
      <div
        className={`flex shrink-0 items-center gap-3 border-b border-white/8 px-4 py-4 ${
          collapsed ? 'lg:justify-center lg:px-2' : ''
        }`}
      >
        <Link to={homePath} className="flex min-w-0 items-center gap-3" onClick={onClose}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold leading-none !text-white shadow-lg shadow-indigo-500/40">
            g
          </span>
          <span className={`min-w-0 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="block text-[1.05rem] font-normal lowercase tracking-tight text-white/45">
              gamyam
            </span>
            <span className="block bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-sm font-semibold text-transparent">
              {brandLabel}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="hrx-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-4 lg:pt-5">
        {!collapsed && (
          <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">
            {menuLabel}
          </p>
        )}

        <div className="space-y-1.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `hrx-nav-link ${isActive ? 'hrx-nav-link-active' : ''} ${
                  collapsed ? 'hrx-nav-link--collapsed' : ''
                }`
              }
            >
              <Icon
                className={`relative z-[1] shrink-0 ${collapsed ? 'h-6 w-6' : 'h-[1.15rem] w-[1.15rem]'}`}
                strokeWidth={2.1}
              />
              <span className={`relative z-[1] ${collapsed ? 'sr-only' : ''}`}>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* assist card */}
        {!collapsed && (
          <div className="mt-auto pt-6">
            <div className="hrx-card relative overflow-hidden rounded-2xl p-4">
              <span className="hrx-glow hrx-glow-violet -right-6 -top-8 h-24 w-24" aria-hidden />
              <div className="relative">
                <span className="hrx-icon-tile h-9 w-9 text-violet-200">
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{assistTitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{assistText}</p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* collapse toggle (desktop) */}
      <div className="hidden shrink-0 border-t border-white/5 p-3 lg:block">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/8 hover:text-white ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" strokeWidth={2.1} />
          ) : (
            <PanelLeftClose className="h-5 w-5 shrink-0" strokeWidth={2.1} />
          )}
          <span className={collapsed ? 'sr-only' : ''}>Collapse menu</span>
        </button>
      </div>
    </aside>
  )
}
