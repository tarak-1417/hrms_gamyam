import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function HeaderProfileMenu({ profilePath = '/employee/profile' }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { getEmployeeById, recordPortalLogout } = useHrms()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const employee = user?.employeeId ? getEmployeeById(user.employeeId) : null
  const displayName = user?.name || 'User'
  const roleLabel = employee?.role || user?.role || 'Employee'

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    if (user?.role === 'employee' && user.employeeId) {
      recordPortalLogout(user.employeeId)
    }
    logout()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1 transition hover:bg-neutral-50 sm:gap-3 sm:pr-2"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="hidden text-right md:block">
          <p className="text-sm font-bold leading-tight text-foreground">{displayName}</p>
          <p className="max-w-[11rem] truncate text-xs text-neutral-500">{roleLabel}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm shadow-primary/20">
          {getInitials(displayName)}
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 shrink-0 text-neutral-400 transition md:block ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-2 shadow-xl shadow-neutral-200/80"
        >
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="mt-0.5 truncate text-sm text-muted">{user?.email}</p>
          </div>

          {profilePath ? (
            <div className="border-b border-neutral-100 py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  navigate(profilePath)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-neutral-50"
              >
                <User className="h-[18px] w-[18px] text-neutral-500" strokeWidth={2} />
                My Profile
              </button>
              <Link
                to={profilePath}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-neutral-50"
              >
                <Settings className="h-[18px] w-[18px] text-neutral-500" strokeWidth={2} />
                Account Settings
              </Link>
            </div>
          ) : null}

          <div className="pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
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
