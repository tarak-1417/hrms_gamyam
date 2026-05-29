import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import GlobalSearch from './GlobalSearch'
import HeaderProfileMenu from './HeaderProfileMenu'

function ToolbarBrand({ portalLabel, homePath = '/employee' }) {
  return (
    <Link
      to={homePath}
      className="app-toolbar-brand group flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold leading-none text-white shadow-sm shadow-primary/25"
        aria-hidden
      >
        g
      </span>
      <span className="hidden leading-tight sm:block">
        <span className="block text-[1.05rem] font-normal lowercase tracking-tight text-neutral-400">
          gamyam
        </span>
        <span className="mt-0.5 block text-sm font-semibold text-primary">{portalLabel}</span>
      </span>
    </Link>
  )
}

export default function Header({
  title,
  description,
  onMenuClick,
  sidebarCollapsed = false,
  mobileNavOpen = false,
  variant = 'toolbar',
  profilePath = '/employee/profile',
  portalLabel = 'Employee Portal',
  toolbarHomePath = '/employee',
  showToolbarBrand = true,
}) {
  const { user } = useAuth()
  const { leaveRequests, reimbursementRequests, getEmployeeById } = useHrms()

  const notificationCount = useMemo(() => {
    if (!user?.employeeId) return 0
    const pendingLeave = leaveRequests.filter(
      (leave) => leave.employeeId === user.employeeId && leave.status === 'pending',
    ).length
    const pendingReimbursements = reimbursementRequests.filter(
      (request) => request.employeeId === user.employeeId && request.status === 'pending',
    ).length
    return pendingLeave + pendingReimbursements
  }, [user?.employeeId, leaveRequests, reimbursementRequests])

  if (variant === 'toolbar') {
    return (
      <header className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="flex min-h-[4.25rem] items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6 lg:min-h-[4.5rem]">
          <button
            type="button"
            onClick={onMenuClick}
            className={`shrink-0 rounded-lg p-2 transition-colors hover:bg-neutral-100 ${
              mobileNavOpen
                ? 'max-lg:bg-primary/10 max-lg:text-primary'
                : 'max-lg:text-neutral-700'
            } ${
              !sidebarCollapsed
                ? 'lg:bg-primary/10 lg:text-primary lg:hover:bg-primary/15'
                : 'lg:text-neutral-700'
            }`}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen || !sidebarCollapsed}
          >
            <Menu className="h-5 w-5" strokeWidth={2.25} />
          </button>

          {showToolbarBrand ? (
            <>
              <ToolbarBrand portalLabel={portalLabel} homePath={toolbarHomePath} />
              <span className="hidden h-10 w-px shrink-0 bg-neutral-200 lg:block" aria-hidden />
            </>
          ) : null}

          <div className="min-w-0 flex-1" aria-hidden />

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <GlobalSearch
              variant="employee"
              placeholder="Search employees, documents, or leaves..."
              className="min-w-0 w-[11.5rem] shrink sm:w-[13.5rem] lg:w-[15rem]"
              inputClassName="app-toolbar-search w-full rounded-full py-2.5 pl-10 pr-4 text-sm transition focus:outline-none"
              dropdownAlign="right"
            />

            <button
              type="button"
              className="relative shrink-0 rounded-full p-2.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              aria-label={
                notificationCount > 0
                  ? `Notifications, ${notificationCount} pending`
                  : 'Notifications'
              }
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
              {notificationCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            <HeaderProfileMenu profilePath={profilePath} />
          </div>
        </div>
      </header>
    )
  }

  const employee = user?.employeeId ? getEmployeeById(user.employeeId) : null

  return (
    <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <button
            type="button"
            onClick={onMenuClick}
            className="mt-0.5 shrink-0 rounded-lg border border-border p-2 text-foreground hover:bg-primary-light lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-foreground sm:text-lg">{title}</h2>
            {description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted sm:line-clamp-none">{description}</p>
            )}
            {employee?.role && (
              <p className="mt-1 text-xs text-muted lg:hidden">{employee.role}</p>
            )}
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
          <GlobalSearch variant="employee" className="min-w-0 flex-1 sm:max-w-xs" />
          <button
            type="button"
            className="relative shrink-0 rounded-lg border border-border p-2 text-foreground hover:bg-primary-light"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>
          <HeaderProfileMenu profilePath={profilePath} />
        </div>
      </div>
    </header>
  )
}
