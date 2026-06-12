import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, ClipboardList, Briefcase, User, CalendarOff, UserCheck, ArrowUpRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import ActivityFeed from '../../components/hr/ActivityFeed'
import DepartmentChart from '../../components/charts/DepartmentChart'
import { formatWelcomeDateParts, getFirstName, getTimeGreeting } from '../../utils/timeUtils'

/* ---------- header ---------- */
function WelcomeHero({ greeting, firstName, roleLabel, employeeCode, stats }) {
  const { weekday, dateLine } = formatWelcomeDateParts()
  return (
    <header className="hrx-card hrx-rise relative overflow-hidden p-6 sm:p-8">
      <span className="hrx-glow hrx-glow-indigo -left-10 -top-16 h-56 w-56 hrx-float" aria-hidden />
      <span className="hrx-glow hrx-glow-violet right-10 -top-20 h-48 w-48" aria-hidden />
      <span className="hrx-glow hrx-glow-cyan -bottom-24 right-1/3 h-52 w-52" aria-hidden />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-300/80">
            {weekday} · {dateLine}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-[2.4rem]">
            {greeting},{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
            Here&apos;s your team overview and what needs your attention today.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(16,185,129,0.7)]" />
              {roleLabel}
            </span>
            {employeeCode && employeeCode !== '—' ? (
              <span className="inline-flex rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/70">
                ID · {employeeCode}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-3 sm:gap-4">
          {stats.map((s) => (
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
  )
}

/* ---------- KPI card ---------- */
function KpiCard({ to, label, value, sub, icon: Icon, glow, iconTint, progressPercent }) {
  return (
    <Link
      to={to}
      className="hrx-card hrx-card-hover group relative flex h-full min-h-[210px] flex-col overflow-hidden p-5 sm:p-6"
    >
      <span className={`hrx-glow ${glow} -right-6 -top-8 h-28 w-28`} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`hrx-icon-tile h-12 w-12 ${iconTint}`}>
          <Icon className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.1} />
        </span>
      </div>
      <p className="relative mt-5 text-sm font-medium text-white/55">{label}</p>
      <p className="relative mt-1 truncate text-[2rem] font-bold leading-none tracking-tight text-white">
        {value}
      </p>

      <div
        className={`relative mt-4 h-2 overflow-hidden rounded-full ${
          progressPercent != null ? 'bg-white/10' : ''
        }`}
        aria-hidden={progressPercent == null}
      >
        {progressPercent != null ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        ) : null}
      </div>

      <p className="relative mt-auto flex items-center gap-1 pt-4 text-xs text-white/45">
        {sub}
        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
      </p>
    </Link>
  )
}

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

export default function ManagerDashboard() {
  const { user } = useAuth()
  const { managerKpis, employees = [] } = useHrms()
  const currentEmployee =
    user?.employeeId ? employees.find((e) => e.id === user.employeeId) ?? null : null
  const firstName = getFirstName(user?.name || currentEmployee?.name || 'Manager')
  const roleLabel = currentEmployee?.role || (user?.role ? user.role.toUpperCase() : 'Manager')
  const employeeCode = currentEmployee?.id || user?.employeeId || '—'

  const heroStats = [
    { label: 'Team size', value: managerKpis.teamSize ?? 0 },
    { label: 'Pending', value: managerKpis.pendingApprovals ?? 0 },
    { label: 'Open roles', value: managerKpis.openPositions ?? 0 },
  ]

  const kpis = useMemo(
    () => [
      {
        to: '/manager/leave',
        icon: ClipboardList,
        label: 'Pending approvals',
        value: String(managerKpis.pendingApprovals ?? 0),
        sub: 'Team leave requests',
        glow: 'hrx-glow-amber',
        iconTint: 'text-amber-300',
      },
      {
        to: '/manager/team',
        icon: Users,
        label: 'Team size',
        value: String(managerKpis.teamSize ?? 0),
        sub: 'Direct reports',
        glow: 'hrx-glow-indigo',
        iconTint: 'text-indigo-300',
      },
      {
        to: '/manager/reports',
        icon: Briefcase,
        label: 'Open positions',
        value: String(managerKpis.openPositions ?? 0),
        sub: 'Active job postings',
        glow: 'hrx-glow-violet',
        iconTint: 'text-violet-300',
      },
      {
        to: '/manager/team',
        icon: UserCheck,
        label: 'Team attendance',
        value: `${managerKpis.avgAttendance ?? 0}%`,
        sub: 'Present today',
        glow: 'hrx-glow-emerald',
        iconTint: 'text-emerald-300',
        progressPercent: Math.min(100, Math.max(0, Number(managerKpis.avgAttendance ?? 0))),
      },
    ],
    [managerKpis],
  )

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <WelcomeHero
        greeting={getTimeGreeting()}
        firstName={firstName}
        roleLabel={roleLabel}
        employeeCode={employeeCode}
        stats={heroStats}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={k.label} className="hrx-rise" style={{ animationDelay: `${i * 60}ms` }}>
            <KpiCard {...k} />
          </div>
        ))}
      </div>

      {/* Department headcount + team activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Panel
          title="Department headcount"
          subtitle="Live employee distribution"
          glow="hrx-glow-indigo"
          className="h-full"
        >
          <div className="h-[280px] w-full">
            <DepartmentChart />
          </div>
        </Panel>

        <Panel
          title="Team activity"
          subtitle="Latest updates from your team"
          glow="hrx-glow-cyan"
          className="h-full"
          action={
            <Link
              to="/manager/leave"
              className="shrink-0 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
            >
              View all
            </Link>
          }
        >
          <ActivityFeed bare viewAllTo="/manager/leave" subtitle="Latest updates from your team" />
        </Panel>
      </div>

      {/* My workspace */}
      <Panel title="My workspace" subtitle="Personal tools for your own account" glow="hrx-glow-violet">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/manager/profile"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <User className="h-4 w-4 text-indigo-300" />
            My profile
          </Link>
          <Link
            to="/manager/my-leave"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400"
          >
            <CalendarOff className="h-4 w-4" />
            Apply leave
          </Link>
        </div>
      </Panel>
    </div>
  )
}
