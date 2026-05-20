import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import BrandLogo from '../BrandLogo'

export default function Sidebar({ brand, navItems, mobileOpen, onClose, profilePath }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { recordPortalLogout } = useHrms()

  const handleLogout = () => {
    if (user?.role === 'employee' && user.employeeId) {
      recordPortalLogout(user.employeeId)
    }
    logout()
  }

  const handleNav = () => {
    onClose?.()
  }

  const openProfile = () => {
    if (profilePath) {
      navigate(profilePath)
      onClose?.()
    }
  }

  const userCardClass =
    'mb-3 flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10'

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[min(280px,88vw)] shrink-0 flex-col overflow-hidden bg-brand-black text-white shadow-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-[260px] lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="relative shrink-0 border-b border-white/10 px-5 py-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-5 rounded-lg p-2 text-white/70 transition hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <BrandLogo className="h-9" />
        <p className="mt-3 rounded-md bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
          {brand.subtitle}
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/employee'}
            onClick={handleNav}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-white/65 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        {profilePath ? (
          <button
            type="button"
            onClick={openProfile}
            className={`${userCardClass} text-left transition hover:bg-white/10 hover:ring-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            aria-label="Open my profile"
          >
            <UserAvatar name={user?.name} />
            <UserDetails name={user?.name} email={user?.email} />
          </button>
        ) : (
          <div className={userCardClass}>
            <UserAvatar name={user?.name} />
            <UserDetails name={user?.name} email={user?.email} />
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-white/70 transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

function UserAvatar({ name }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
      {name?.charAt(0) ?? 'U'}
    </div>
  )
}

function UserDetails({ name, email }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-white">{name}</p>
      <p className="truncate text-xs text-white/45">{email}</p>
    </div>
  )
}
