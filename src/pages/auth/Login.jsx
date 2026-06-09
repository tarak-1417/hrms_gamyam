import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Users, Calendar } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import BrandLogo from '../../components/BrandLogo'
import { getUsers } from '../../data/dataService'

const ROLE_LABELS = {
  admin: 'HR Admin',
  manager: 'Manager',
  employee: 'Employee',
  superadmin: 'Super Admin',
}

/** One quick-demo tile per portal role (avoids duplicate "HR Admin" labels) */
const DEMO_PORTAL_ROLES = ['superadmin', 'admin', 'manager', 'employee']

const DEMO_ACCOUNTS = DEMO_PORTAL_ROLES.map((role) => {
  const user = getUsers().find((u) => u.role === role && !u.blocked)
  if (!user) return null
  return {
    role: ROLE_LABELS[role] ?? role,
    email: user.email,
    password: user.password,
  }
}).filter(Boolean)

const FEATURES = [
  { icon: Users, label: 'Employee management' },
  { icon: Calendar, label: 'Attendance & leave' },
  // { icon: Wallet, label: 'Payroll & payslips' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const result = login(email, password)
    if (result.success) {
      const routes = { admin: '/admin', manager: '/manager', employee: '/employee', superadmin: '/superadmin' }
      navigate(routes[result.role] ?? '/')
    } else {
      setError(result.error)
    }
  }

  const fillDemo = (account) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-black lg:flex lg:w-[48%] lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-20">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10">
          <BrandLogo className="h-11" tagline="Human Resource Management System" />
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Gamyam HRMS
          </p>
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-5xl">
            Manage your workforce with confidence
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/65">
            One platform for admins and employees — attendance, leave, payroll, and more.
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-white/90">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-white/35">
          © 2026 Gamyam. All rights reserved.
        </p>
      </div>

      {/* Right — sign in */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <BrandLogo
              className="h-10"
              tagline="Sign in to continue"
              taglineClassName="text-sm text-muted"
            />
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 shadow-xl shadow-neutral-200/50 sm:p-10">
            <div className="mb-8 hidden lg:block">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
              <p className="mt-1.5 text-sm text-muted">Sign in to your admin or employee portal</p>
            </div>

            <div className="mb-8 lg:hidden">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
              <p className="mt-1.5 text-sm text-muted">Sign in to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-3 pl-11 pr-4 text-sm text-foreground transition placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-3 pl-11 pr-11 text-sm text-foreground transition placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark hover:shadow-primary/30 active:scale-[0.99]"
              >
                Sign in
              </button>
            </form>

            <div className="mt-8 border-t border-neutral-100 pt-8">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-muted">
                Quick demo access
              </p>
              <div className="mt-4 grid gap-3 grid-cols-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemo(account)}
                    className="group rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3.5 text-left transition hover:border-primary/40 hover:bg-primary-light hover:shadow-sm"
                  >
                    <span className="block text-sm font-semibold text-foreground group-hover:text-primary-dark">
                      {account.role}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{account.email}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-muted">
                Tap a role to fill credentials, then sign in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
