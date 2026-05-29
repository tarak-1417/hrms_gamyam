import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Headphones, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import BrandLogo from '../BrandLogo'
import useSidebarCollapsed from '../../hooks/useSidebarCollapsed'

function isNavActive(pathname, to, end) {
  if (end) {
    return pathname === to
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

function navLinkClass(isLight, isActive) {
  if (!isLight) {
    return `relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white shadow-md shadow-primary/20'
        : 'text-white/65 hover:bg-white/8 hover:text-white'
    }`
  }

  return `relative flex min-h-[44px] items-center gap-3 overflow-hidden rounded-2xl py-3 pl-[22px] pr-4 text-[15px] font-medium transition-colors sidebar-nav-link ${
    isActive ? 'sidebar-nav-link--active' : 'sidebar-nav-link--idle'
  }`
}

function defaultEndFor(to) {
  return to === '/admin' || to === '/employee' || to === '/manager'
}

function NavItem({ to, icon: Icon, label, end, isLight, onNavigate, indicatorMode, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) => navLinkClass(isLight, isActive)}
    >
      {({ isActive }) => (
        <>
          {isActive && isLight && indicatorMode && !collapsed && (
            <span
              className={`sidebar-nav-indicator sidebar-nav-indicator--${indicatorMode}`}
              aria-hidden
            />
          )}
          <Icon
            className={`sidebar-nav-icon relative z-[1] h-5 w-5 shrink-0`}
            strokeWidth={2.25}
          />
          <span className={`sidebar-nav-label relative z-[1] ${collapsed ? 'sr-only' : ''}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

function useSidebarIndicatorDirection(orderedRoutes, pathname) {
  const prevIndexRef = useRef(-1)
  const [direction, setDirection] = useState('initial')

  const activeIndex = useMemo(() => {
    return orderedRoutes.findIndex(({ to, end }) => isNavActive(pathname, to, end))
  }, [orderedRoutes, pathname])

  useEffect(() => {
    const previous = prevIndexRef.current

    if (activeIndex < 0) {
      return
    }

    if (previous < 0 || previous === activeIndex) {
      setDirection('initial')
    } else if (activeIndex > previous) {
      setDirection('forward')
    } else {
      setDirection('backward')
    }

    prevIndexRef.current = activeIndex
  }, [activeIndex])

  const getIndicatorMode = (itemIndex) => {
    if (itemIndex !== activeIndex) return null
    return direction
  }

  return { activeIndex, getIndicatorMode }
}

export default function Sidebar({
  navItems,
  navSections,
  bottomNavItems = [],
  mobileOpen,
  onClose,
  menuLabel = 'Main menu',
  variant = 'light',
  showSupportCard = false,
  showSidebarLogo = false,
  brandSubtitle,
  dockBelowHeader = false,
  collapsible = true,
  collapsed: collapsedControlled,
  onToggleCollapsed,
  showFooterCollapseToggle = true,
}) {
  const isLight = variant === 'light'
  const { pathname } = useLocation()
  const internalCollapse = useSidebarCollapsed()
  const collapsed = collapsedControlled ?? internalCollapse.collapsed
  const toggleCollapsed = onToggleCollapsed ?? internalCollapse.toggle
  const isDesktopCollapsed = collapsible && collapsed

  const resolvedNavItems = useMemo(() => {
    if (navItems?.length) return navItems
    return (navSections ?? []).flatMap((section) => section.items ?? []).filter(Boolean)
  }, [navItems, navSections])

  const resolvedNavSections = useMemo(() => {
    const sections = (navSections ?? []).filter((section) => (section.items ?? []).length > 0)
    if (sections.length > 0) return sections
    return null
  }, [navSections])

  const orderedRoutes = useMemo(
    () => [
      ...resolvedNavItems.map((item) => ({
        to: item.to,
        end: item.end ?? defaultEndFor(item.to),
      })),
      ...bottomNavItems.map((item) => ({
        to: item.to,
        end: item.end ?? false,
      })),
    ],
    [resolvedNavItems, bottomNavItems],
  )

  const { getIndicatorMode } = useSidebarIndicatorDirection(orderedRoutes, pathname)

  const handleNav = () => {
    onClose?.()
  }

  const dockedPosition = dockBelowHeader
    ? 'app-sidebar-docked fixed bottom-0 left-0 top-[var(--app-header-height)] z-50'
    : 'fixed inset-y-0 left-0 z-50 h-screen'

  const asideClass = isLight
    ? `sidebar-app ${dockedPosition} flex w-[min(280px,88vw)] shrink-0 flex-col overflow-hidden shadow-xl transition-[transform,width] duration-300 ease-out lg:static lg:z-auto lg:h-full lg:translate-x-0 lg:shadow-none ${
        isDesktopCollapsed ? 'sidebar-app--collapsed lg:w-[4.5rem]' : 'lg:w-[260px]'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`
    : `${dockedPosition} flex w-[min(280px,88vw)] shrink-0 flex-col overflow-hidden bg-brand-black text-white shadow-xl transition-[transform,width] duration-300 ease-out lg:static lg:z-auto lg:h-full lg:translate-x-0 ${
        isDesktopCollapsed ? 'sidebar-app--collapsed lg:w-[4.5rem]' : 'lg:w-[260px]'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`

  const showHeaderBar = showSidebarLogo

  return (
    <aside className={asideClass}>
      {showHeaderBar ? (
        <div
          className={`flex shrink-0 items-center justify-between gap-3 border-b px-4 py-1 ${
            isLight ? 'sidebar-app-header' : 'border-white/10'
          }`}
        >
          <BrandLogo
            className="h-8"
            tagline={brandSubtitle}
            taglineClassName={
              isLight ? 'text-xs font-semibold text-primary-dark' : 'text-xs text-white/50'
            }
          />
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-2 transition lg:hidden ${
              isLight
                ? 'text-[#6b7280] hover:bg-white/60 hover:text-foreground'
                : 'text-white/70 hover:bg-white/10'
            }`}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div
          className={`flex shrink-0 items-center justify-end border-b px-3 py-2 lg:hidden ${
            isLight ? 'sidebar-app-header' : 'border-white/10'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-2 transition ${
              isLight
                ? 'text-[#6b7280] hover:bg-white/60 hover:text-foreground'
                : 'text-white/70 hover:bg-white/10'
            }`}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${
            isDesktopCollapsed ? 'px-2' : 'px-4'
          } ${showHeaderBar ? 'py-5' : 'py-4 lg:pt-5'}`}
        >
          {menuLabel && !isDesktopCollapsed ? (
            <p className="sidebar-menu-label mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.18em]">
              {menuLabel}
            </p>
          ) : null}
          {resolvedNavSections ? (
            <div className="space-y-5">
              {resolvedNavSections.map((section, sectionIndex) => {
                const items = section.items ?? []
                const runningOffset = resolvedNavSections
                  .slice(0, sectionIndex)
                  .reduce((sum, prev) => sum + (prev.items?.length ?? 0), 0)

                return (
                  <div key={section.label ?? sectionIndex} className="space-y-2">
                    {!isDesktopCollapsed && section.label ? (
                      <p className="sidebar-menu-label px-1 text-[11px] font-bold uppercase tracking-[0.18em]">
                        {section.label}
                      </p>
                    ) : null}
                    <div className="space-y-1">
                      {items.map(({ to, icon, label, end: endProp }, index) => (
                        <NavItem
                          key={to}
                          to={to}
                          icon={icon}
                          label={label}
                          end={endProp ?? defaultEndFor(to)}
                          isLight={isLight}
                          onNavigate={handleNav}
                          indicatorMode={getIndicatorMode(runningOffset + index)}
                          collapsed={isDesktopCollapsed}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {resolvedNavItems.map(({ to, icon, label, end: endProp }, index) => (
                <NavItem
                  key={to}
                  to={to}
                  icon={icon}
                  label={label}
                  end={endProp ?? defaultEndFor(to)}
                  isLight={isLight}
                  onNavigate={handleNav}
                  indicatorMode={getIndicatorMode(index)}
                  collapsed={isDesktopCollapsed}
                />
              ))}
            </div>
          )}

          {bottomNavItems.length > 0 && (
            <div
              className={`mt-6 space-y-1 border-t pt-5 ${
                isLight ? 'border-primary/15' : 'border-white/10'
              }`}
            >
              {bottomNavItems.map(({ to, icon, label, end: endProp }, index) => (
                <NavItem
                  key={to}
                  to={to}
                  icon={icon}
                  label={label}
                  end={endProp}
                  isLight={isLight}
                  onNavigate={handleNav}
                  indicatorMode={getIndicatorMode(resolvedNavItems.length + index)}
                  collapsed={isDesktopCollapsed}
                />
              ))}
            </div>
          )}
        </div>

        {showSupportCard && isLight && !isDesktopCollapsed && (
          <div className="shrink-0 border-t border-primary/15 p-4">
            <div className="sidebar-support-card rounded-2xl px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-white text-primary">
                  <Headphones className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Need assistance?</p>
                  <p className="mt-0.5 text-xs leading-relaxed">
                    Our support team is available 24/7.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {collapsible && showFooterCollapseToggle && (
          <div
            className={`hidden shrink-0 border-t p-3 lg:block ${
              isLight ? 'border-primary/15' : 'border-white/10'
            }`}
          >
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isLight
                  ? 'text-neutral-600 hover:bg-white/80 hover:text-foreground'
                  : 'text-white/65 hover:bg-white/8 hover:text-white'
              } ${isDesktopCollapsed ? 'justify-center px-2' : ''}`}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5 shrink-0" strokeWidth={2.25} />
              ) : (
                <PanelLeftClose className="h-5 w-5 shrink-0" strokeWidth={2.25} />
              )}
              <span className={isDesktopCollapsed ? 'sr-only' : ''}>
                {collapsed ? 'Expand menu' : 'Collapse menu'}
              </span>
            </button>
          </div>
        )}
      </nav>
    </aside>
  )
}
