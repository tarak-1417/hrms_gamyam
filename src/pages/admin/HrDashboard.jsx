import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarHeart,
  ClipboardList,
  Clock,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { formatWelcomeDateParts, getFirstName, getTimeGreeting } from '../../utils/timeUtils'
import {
  DepartmentBars,
  LeaveDonut,
  LeaveLegend,
} from '../../components/hr/admin/AdminDashboardCharts'

/* ---------- helpers ---------- */
const STATUS_STYLES = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  'on-leave': 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  inactive: 'bg-slate-500/15 text-slate-300 border-slate-400/25',
}

function statusClass(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.inactive
}

function nextAnniversary(joinDate, now) {
  if (!joinDate) return null
  const join = new Date(joinDate)
  if (Number.isNaN(join.getTime())) return null
  const next = new Date(now.getFullYear(), join.getMonth(), join.getDate())
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    next.setFullYear(now.getFullYear() + 1)
  }
  const days = Math.round((next - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
  const years = next.getFullYear() - join.getFullYear()
  return { date: next, days, years }
}

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
            Here&apos;s the pulse of people operations across the organisation today.
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
function KpiCard({ label, value, sub, icon: Icon, glow, iconTint, trend, to }) {
  return (
    <Link
      to={to}
      className="hrx-card hrx-card-hover group relative block overflow-hidden p-5 sm:p-6"
    >
      <span className={`hrx-glow ${glow} -right-6 -top-8 h-28 w-28`} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`hrx-icon-tile h-12 w-12 ${iconTint}`}>
          <Icon className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.1} />
        </span>
        {trend ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/12 px-2 py-1 text-[11px] font-semibold text-emerald-300">
            <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
            {trend}
          </span>
        ) : null}
      </div>
      <p className="relative mt-5 text-sm font-medium text-white/55">{label}</p>
      <p className="relative mt-1 text-[2rem] font-bold leading-none tracking-tight text-white">
        {value}
      </p>
      <p className="relative mt-2.5 flex items-center gap-1 text-xs text-white/45">
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

/* ============================ page ============================ */
export default function HrDashboard() {
  const { user } = useAuth()
  const { adminStats, employees = [], leaveRequests = [], departmentChartData = [] } = useHrms()

  const currentEmployee = user?.employeeId
    ? employees.find((e) => e.id === user.employeeId) ?? null
    : null
  const firstName = getFirstName(user?.name || currentEmployee?.name || 'HR')
  const roleLabel = currentEmployee?.role || (user?.role ? user.role.toUpperCase() : 'HR Admin')
  const employeeCode = currentEmployee?.id || user?.employeeId || '—'

  const total = adminStats.totalEmployees || 0
  const presentPct = total ? Math.round((adminStats.presentToday / total) * 100) : 0

  const heroStats = [
    { label: 'Departments', value: departmentChartData.length || 0 },
    { label: 'Open roles', value: adminStats.openRoles ?? 0 },
    { label: 'On leave', value: adminStats.onLeave ?? 0 },
  ]

  const kpis = [
    {
      label: 'Total employees',
      value: total,
      sub: `${adminStats.newHires ?? 0} new hires this year`,
      icon: Users,
      glow: 'hrx-glow-indigo',
      iconTint: 'text-indigo-300',
      trend: adminStats.newHires ? `+${adminStats.newHires}` : null,
      to: '/admin/employees',
    },
    {
      label: 'Present today',
      value: adminStats.presentToday ?? 0,
      sub: `${presentPct}% of workforce checked in`,
      icon: UserCheck,
      glow: 'hrx-glow-emerald',
      iconTint: 'text-emerald-300',
      trend: presentPct ? `${presentPct}%` : null,
      to: '/admin/employees',
    },
    {
      label: 'On leave today',
      value: adminStats.onLeave ?? 0,
      sub: 'Currently away from work',
      icon: CalendarHeart,
      glow: 'hrx-glow-violet',
      iconTint: 'text-violet-300',
      to: '/admin/leave',
    },
    {
      label: 'Pending leave approvals',
      value: adminStats.pendingLeaves ?? 0,
      sub: 'Leave requests waiting for review',
      icon: ClipboardList,
      glow: 'hrx-glow-amber',
      iconTint: 'text-amber-300',
      to: '/admin/leave',
    },
  ]

  const now = new Date()
  const anniversaries = useMemo(
    () =>
      employees
        .map((e) => ({ employee: e, ann: nextAnniversary(e.joinDate, now) }))
        .filter((x) => x.ann)
        .sort((a, b) => a.ann.days - b.ann.days)
        .slice(0, 4),
    [employees], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending').slice(0, 4)
  const directory = employees.slice(0, 6)

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

      {/* Department headcount + leave distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Department headcount"
          subtitle="Live employee distribution"
          glow="hrx-glow-indigo"
          className="lg:col-span-2"
        >
          <div className="h-[260px] w-full">
            <DepartmentBars />
          </div>
        </Panel>

        <Panel title="Leave distribution" subtitle="By leave type" glow="hrx-glow-violet">
          <div className="flex items-center gap-4">
            <div className="relative h-[150px] w-[150px] shrink-0">
              <LeaveDonut />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {adminStats.pendingLeaves ?? 0}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-white/45">pending</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <LeaveLegend />
            </div>
          </div>
        </Panel>
      </div>

      {/* Directory table + side widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Employee directory"
          subtitle="Recently active team members"
          className="lg:col-span-2"
          action={
            <Link
              to="/admin/employees"
              className="shrink-0 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
            >
              View all
            </Link>
          }
        >
          <div className="hrx-scroll -mx-1 overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-white/40">
                  <th className="px-1 pb-3 font-semibold">Employee</th>
                  <th className="px-1 pb-3 font-semibold">Department</th>
                  <th className="px-1 pb-3 font-semibold">Role</th>
                  <th className="px-1 pb-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {directory.map((e) => (
                  <tr key={e.id} className="border-t border-white/6">
                    <td className="px-1 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/80 to-violet-500/80 text-xs font-bold !text-white">
                          {e.avatar || e.name?.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{e.name}</p>
                          <p className="truncate text-xs text-white/40">{e.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-1 py-3 text-white/65">{e.department}</td>
                    <td className="px-1 py-3 text-white/65">{e.role}</td>
                    <td className="px-1 py-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClass(
                          e.status,
                        )}`}
                      >
                        {(e.status || 'active').replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          {/* anniversaries */}
          <Panel title="Upcoming anniversaries" subtitle="Work milestones ahead" glow="hrx-glow-violet">
            <ul className="space-y-3">
              {anniversaries.length === 0 ? (
                <li className="text-sm text-white/45">No upcoming milestones</li>
              ) : (
                anniversaries.map(({ employee: e, ann }) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="hrx-icon-tile h-10 w-10 text-violet-200">
                      <CalendarHeart className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{e.name}</p>
                      <p className="text-xs text-white/45">
                        {ann.years} yr{ann.years === 1 ? '' : 's'} ·{' '}
                        {ann.days === 0 ? 'Today' : `in ${ann.days} day${ann.days === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-violet-300">
                      {ann.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Panel>

          {/* pending leave summary */}
          <Panel
            title="Leave requests"
            subtitle={`${adminStats.pendingLeaves ?? 0} awaiting review`}
            glow="hrx-glow-amber"
            action={
              <Link
                to="/admin/leave"
                className="shrink-0 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
              >
                Review
              </Link>
            }
          >
            <ul className="space-y-3">
              {pendingLeaves.length === 0 ? (
                <li className="text-sm text-white/45">No pending requests 🎉</li>
              ) : (
                pendingLeaves.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-3 py-2.5"
                  >
                    <span className="hrx-icon-tile h-9 w-9 text-amber-200">
                      <Clock className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{l.employeeName}</p>
                      <p className="truncate text-xs text-white/45">{l.type}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                      {l.days}d
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
