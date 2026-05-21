import { useNavigate } from 'react-router-dom'
import { Bell, HelpCircle, Menu, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import GlobalSearch from './GlobalSearch'
import TopBarHoverPanel from './TopBarHoverPanel'

function iconBtnClass(active = false) {
  return `relative rounded-full p-2 transition-colors ${
    active ? 'bg-primary-light text-primary' : 'text-neutral-500 hover:bg-neutral-100'
  }`
}

export default function HrTopBar({ onMenuClick, showHelpAndSettings = true }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { leaveRequests } = useHrms()
  const pending = leaveRequests.filter((l) => l.status === 'pending')
  const pendingCount = pending.length

  const settingsPath =
    user?.role === 'admin'
      ? '/admin/settings'
      : user?.role === 'superadmin'
        ? '/superadmin/billing'
        : '/manager'

  return (
    <header className="z-10 flex shrink-0 flex-col gap-2 border-b border-neutral-200 bg-white px-4 py-2 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6 sm:py-0">
      <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <GlobalSearch variant="hr" className="min-w-0 flex-1 sm:max-w-md" />
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1">
        <TopBarHoverPanel
          title={pendingCount > 0 ? 'Pending leave' : 'Notifications'}
          panelClassName="w-40"
          content={
            pendingCount > 0 ? (
              <ul className="space-y-0.5">
                {pending.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-md px-2 py-1.5 text-sm font-medium text-foreground"
                  >
                    {l.employeeName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-1 text-xs text-muted">No pending requests</p>
            )
          }
        >
          <button type="button" className={iconBtnClass()} aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </TopBarHoverPanel>

        {showHelpAndSettings && (
          <>
            <TopBarHoverPanel
              title="Help"
              panelClassName="w-56 max-w-[calc(100vw-2rem)]"
              content={
                <ul className="space-y-1.5 text-xs text-neutral-600">
                  <li>Search pages, people, and leave from the bar on the left.</li>
                  <li>Charts and reports update from the same demo dataset.</li>
                </ul>
              }
            >
              <button type="button" className={iconBtnClass()} aria-label="Help">
                <HelpCircle className="h-5 w-5" />
              </button>
            </TopBarHoverPanel>

            <TopBarHoverPanel
              title="Settings"
              panelClassName="w-52 max-w-[calc(100vw-2rem)]"
              content={
                <div className="space-y-2">
                  <p className="text-xs text-muted">
                    {user?.role === 'admin'
                      ? 'Company profile, policies, and integrations.'
                      : user?.role === 'superadmin'
                        ? 'Billing and tenant configuration.'
                        : 'Manager preferences and team defaults.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(settingsPath)}
                    className="w-full rounded-lg bg-primary-light px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    Open settings →
                  </button>
                </div>
              }
            >
              <button
                type="button"
                onClick={() => navigate(settingsPath)}
                className={iconBtnClass()}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </TopBarHoverPanel>
          </>
        )}
      </div>
    </header>
  )
}
