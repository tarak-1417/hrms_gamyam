import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, ClipboardList, Briefcase, User, CalendarOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import ActivityFeed from '../../components/hr/ActivityFeed'
import ChartCard from '../../components/charts/ChartCard'
import DepartmentChart from '../../components/charts/DepartmentChart'
import { formatWelcomeDateParts, getFirstName, getTimeGreeting } from '../../utils/timeUtils'

function ManagerDashboardWelcome({ greeting, firstName, roleLabel, employeeCode }) {
  const { weekday, dateLine } = formatWelcomeDateParts()

  return (
    <header className="dashboard-welcome-hero relative overflow-hidden rounded-3xl border border-primary/12 shadow-sm shadow-primary/5">
      <div className="dashboard-welcome-dots pointer-events-none absolute inset-0 opacity-35" aria-hidden />
      <div className="dashboard-welcome-shine pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-dark">
            {weekday} · {dateLine}
          </p>
          <h1 className="mt-4 text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-[2rem]">
            {greeting},{' '}
            <span className="text-primary">{firstName}</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-600 sm:text-base">
            Here&apos;s your team overview and what needs your attention today.
          </p>
          <span className="mt-4 inline-flex rounded-full border border-primary/20 bg-white/90 px-3 py-1 text-xs font-semibold text-primary-dark">
            Manager Dashboard
          </span>
        </div>

        <div className="hidden shrink-0 items-stretch gap-6 sm:flex">
          <div
            className={`${employeeCode && employeeCode !== '—' ? 'border-r border-neutral-200/90 pr-6' : ''} min-w-[7rem]`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Role</p>
            <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{roleLabel}</p>
          </div>
          {employeeCode && employeeCode !== '—' ? (
            <div className="min-w-[5.5rem]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Employee ID</p>
              <p className="mt-1.5 text-sm font-bold tracking-wide text-foreground">{employeeCode}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative flex flex-wrap gap-6 border-t border-neutral-200/80 bg-white/70 px-6 py-3.5 sm:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Role</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{roleLabel}</p>
        </div>
        {employeeCode && employeeCode !== '—' ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Employee ID</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">{employeeCode}</p>
          </div>
        ) : null}
      </div>
    </header>
  )
}

function QuickAccessCard({ to, title, value, footer, icon: Icon, tone = 'accent' }) {
  return (
    <Link
      to={to}
      className="dashboard-quick-card group flex min-h-[170px] flex-col rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:min-h-[185px] sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-[3.25rem] sm:w-[3.25rem] ${
            tone === 'dark' ? 'bg-neutral-900 text-white' : 'bg-primary-light text-primary'
          }`}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <span className="text-neutral-300 transition group-hover:text-primary" aria-hidden>
          ↗
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-neutral-500 sm:text-base">{title}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>

      {footer ? (
        <p className="mt-auto pt-5 text-xs text-neutral-500 sm:text-sm">
          <span>{footer}</span>
        </p>
      ) : null}
    </Link>
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

  const quickAccess = useMemo(
    () => [
      {
        to: '/manager/leave',
        title: 'Pending approvals',
        value: String(managerKpis.pendingApprovals ?? 0),
        footer: 'Team leave requests',
        icon: ClipboardList,
      },
      {
        to: '/manager/team',
        title: 'Team size',
        value: String(managerKpis.teamSize ?? 0),
        footer: 'Direct reports',
        icon: Users,
      },
      {
        to: '/manager/reports',
        title: 'Open positions',
        value: String(managerKpis.openPositions ?? 0),
        footer: 'Active job postings',
        icon: Briefcase,
      },
      {
        to: '/manager/team',
        title: 'Team attendance',
        value: `${managerKpis.avgAttendance ?? 0}%`,
        footer: 'Present today',
        icon: Users,
      },
    ],
    [managerKpis],
  )

  return (
    <div className="space-y-10 pb-8">
      <ManagerDashboardWelcome
        greeting={getTimeGreeting()}
        firstName={firstName}
        roleLabel={roleLabel}
        employeeCode={employeeCode}
      />

      <section className="pt-2">
        <p className="dashboard-section-eyebrow text-[11px] uppercase">Quick access</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Everything in one tap
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {quickAccess.map((card) => (
            <QuickAccessCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="min-w-0">
          <ChartCard
            title="Department headcount"
            subtitle="Live employee data"
            compact
            chartAtBottom
            className="h-full w-full"
          >
            <DepartmentChart />
          </ChartCard>
        </div>
        <div className="min-w-0">
          <ActivityFeed
            className="h-full w-full"
            viewAllTo="/manager/leave"
            subtitle="Latest updates from your team"
          />
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">My workspace</h2>
          <p className="mt-1 text-sm text-muted">Personal tools for your own account</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/manager/profile"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light/30 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary-light/50"
          >
            <User className="h-4 w-4 text-primary" />
            My profile
          </Link>
          <Link
            to="/manager/my-leave"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-neutral-50"
          >
            <CalendarOff className="h-4 w-4 text-primary" />
            Apply leave
          </Link>
        </div>
      </section>
    </div>
  )
}
