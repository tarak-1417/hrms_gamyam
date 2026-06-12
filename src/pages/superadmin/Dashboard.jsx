import { Link } from 'react-router-dom'
import {
  Users,
  Network,
  Shield,
  ArchiveRestore,
  ArrowUpRight,
} from 'lucide-react'
import PlatformGrowthChart from '../../components/charts/PlatformGrowthChart'
import ActivityFeed from '../../components/hr/ActivityFeed'
import { usePlatform } from '../../hooks/usePlatform'
import { SUPER_ADMIN_RESPONSIBILITIES } from '../../config/superAdminPermissions'

const quickLinks = [
  { to: '/superadmin/organization', icon: Network, label: 'Org setup', desc: 'Departments, branches, reporting', glow: 'hrx-glow-indigo', iconTint: 'text-indigo-300' },
  { to: '/superadmin/permissions', icon: Shield, label: 'Permissions', desc: 'Super Admin capabilities', glow: 'hrx-glow-violet', iconTint: 'text-violet-300' },
  { to: '/superadmin/trash', icon: ArchiveRestore, label: 'Recycle bin', desc: 'Restore deleted records', glow: 'hrx-glow-amber', iconTint: 'text-amber-300' },
  { to: '/superadmin/hr/employees', icon: Users, label: 'HR modules', desc: 'Full HRMS access', glow: 'hrx-glow-emerald', iconTint: 'text-emerald-300' },
]

/* ---------- panel wrapper ---------- */
function Panel({ title, subtitle, action, className = '', glow, children }) {
  return (
    <section className={`hrx-card relative overflow-hidden p-5 sm:p-6 ${className}`}>
      {glow ? <span className={`hrx-glow ${glow} -right-10 -top-12 h-36 w-36`} aria-hidden /> : null}
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-white/50">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="relative mt-5">{children}</div>
    </section>
  )
}

export default function SuperAdminDashboard() {
  const { organizations, users } = usePlatform()
  const orgList = organizations || []
  const userList = users || []
  const activeOrgs = orgList.filter((o) => o.status === 'active' || o.status === 'trial').length
  const adminUsers = userList.filter((u) => u.role === 'admin' && !u.blocked).length

  const heroStats = [
    { label: 'Organizations', value: activeOrgs },
    { label: 'HR admins', value: adminUsers },
    { label: 'Users', value: userList.length },
  ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <header className="hrx-card hrx-rise relative overflow-hidden p-6 sm:p-8">
        <span className="hrx-glow hrx-glow-indigo -left-10 -top-16 h-56 w-56 hrx-float" aria-hidden />
        <span className="hrx-glow hrx-glow-violet right-10 -top-20 h-48 w-48" aria-hidden />
        <span className="hrx-glow hrx-glow-cyan -bottom-24 right-1/3 h-52 w-52" aria-hidden />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-300/80">
              Platform control
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-[2.4rem]">
              Platform{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                overview
              </span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
              Super Admin controls the entire platform — organizations, users, subscriptions, and all
              HRMS modules.
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-3 sm:gap-4">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-bold tracking-tight text-white sm:text-[1.6rem]">{s.value}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/45">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map(({ to, icon: Icon, label, desc, glow, iconTint }) => (
          <Link
            key={to}
            to={to}
            className="hrx-card hrx-card-hover group relative flex h-full flex-col overflow-hidden p-5 sm:p-6"
          >
            <span className={`hrx-glow ${glow} -right-6 -top-8 h-28 w-28`} aria-hidden />
            <div className="relative flex items-start justify-between gap-3">
              <span className={`hrx-icon-tile h-12 w-12 ${iconTint}`}>
                <Icon className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.1} />
              </span>
              <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:text-white/70" />
            </div>
            <p className="relative mt-5 text-base font-semibold text-white">{label}</p>
            <p className="relative mt-1 text-xs text-white/45">{desc}</p>
          </Link>
        ))}
      </div>

      {/* responsibilities + chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Super Admin responsibilities"
          subtitle="Your platform scope"
          glow="hrx-glow-violet"
          className="lg:col-span-1"
          action={
            <Link
              to="/superadmin/permissions"
              className="shrink-0 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
            >
              View all
            </Link>
          }
        >
          <ul className="space-y-2.5 text-sm text-white/65">
            {SUPER_ADMIN_RESPONSIBILITIES.slice(0, 5).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-indigo-300">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Platform growth"
          subtitle="Companies & users over time"
          glow="hrx-glow-indigo"
          className="lg:col-span-2"
        >
          <div className="h-[280px] w-full">
            <PlatformGrowthChart />
          </div>
        </Panel>
      </div>

      {/* activity */}
      <Panel
        title="Recent activity"
        subtitle="Latest platform updates"
        glow="hrx-glow-cyan"
        action={
          <Link
            to="/superadmin/audit-logs"
            className="shrink-0 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
          >
            View all
          </Link>
        }
      >
        <ActivityFeed bare viewAllTo="/superadmin/audit-logs" />
      </Panel>
    </div>
  )
}
