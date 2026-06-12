import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useHrms } from '../../../hooks/useHrms'
import GlobalSearch from '../../layout/GlobalSearch'

function initials(name) {
  if (!name) return 'HR'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function ProfileMenu({ profilePath }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { getEmployeeById } = useHrms()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const employee = user?.employeeId ? getEmployeeById(user.employeeId) : null
  const displayName = user?.name || 'HR Admin'
  const roleLabel = employee?.role || user?.role || 'HR Admin'

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 py-1 pl-1 pr-1 transition hover:bg-white/10 sm:pr-2.5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold !text-white shadow-lg shadow-indigo-500/30">
          {initials(displayName)}
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-sm font-semibold leading-tight text-white">{displayName}</span>
          <span className="block max-w-[10rem] truncate text-xs text-white/50">{roleLabel}</span>
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 shrink-0 text-white/40 transition md:block ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="hrx-pop absolute right-0 top-[calc(100%+0.6rem)] z-50 w-64 overflow-hidden rounded-2xl py-2"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="font-semibold text-white">{displayName}</p>
            <p className="mt-0.5 truncate text-sm text-white/50">{user?.email}</p>
          </div>
          {profilePath && (
            <div className="border-b border-white/10 py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  navigate(profilePath)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
              >
                <User className="h-[18px] w-[18px] text-white/45" strokeWidth={2} />
                My Profile
              </button>
              <Link
                to={profilePath}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
              >
                <Settings className="h-[18px] w-[18px] text-white/45" strokeWidth={2} />
                Account Settings
              </Link>
            </div>
          )}
          <div className="pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Floating, always-visible controls (search + notifications + profile).
 * Sticks to the top of the scrollable content on every admin page — there
 * is no full-width navbar; the brand lives in the standalone sidebar.
 */
export default function AdminDarkNavbar({
  onMenuClick,
  mobileNavOpen = false,
  profilePath = null,
  isDark = true,
  onToggleTheme,
  searchPlaceholder = 'Search employees, leave, pages…',
  pendingCount = null,
}) {
  const { adminStats } = useHrms()
  const pending = pendingCount ?? adminStats?.pendingApprovals ?? 0

  return (
    <div className="hrx-ui mb-6 flex items-center gap-2 sm:gap-3">
      {/* mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        className={`shrink-0 rounded-xl border p-2 transition lg:hidden ${
          mobileNavOpen
            ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200'
            : 'border-white/10 bg-white/8 text-white/70 hover:bg-white/12'
        }`}
        aria-label="Toggle navigation menu"
        aria-expanded={mobileNavOpen}
      >
        <Menu className="h-5 w-5" strokeWidth={2.1} />
      </button>

      <div className="min-w-0 flex-1" aria-hidden />

      <GlobalSearch
        variant="hr"
        placeholder={searchPlaceholder}
        className="min-w-0 w-[10.5rem] shrink sm:w-[14rem] lg:w-[17rem]"
        inputClassName="hrx-input w-full rounded-full py-2.5 pl-10 pr-4 text-sm"
        dropdownAlign="right"
      />

      <button
        type="button"
        onClick={onToggleTheme}
        className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
      </button>

      <button
        type="button"
        className="relative shrink-0 rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label={pending > 0 ? `Notifications, ${pending} pending` : 'Notifications'}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {pending > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 px-1 text-[10px] font-bold !text-white ring-2 ring-white/70">
            {pending > 9 ? '9+' : pending}
          </span>
        )}
      </button>

      <ProfileMenu profilePath={profilePath} />
    </div>
  )
}
