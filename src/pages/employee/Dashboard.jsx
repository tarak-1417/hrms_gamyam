import { Link } from 'react-router-dom'
import {
  CalendarOff,
  FileText,
  User,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Clock,
  Receipt,
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import {
  formatDisplayDate,
  formatLeaveDateRange,
  getTimeGreeting,
  todayDate,
} from '../../utils/timeUtils'

function QuickAction({ to, icon: Icon, label, desc }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-lg"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition-transform group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-xs text-white/75">{desc}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function KpiCard({ icon: Icon, label, value, hint, accent = 'from-primary/10 to-primary-light' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-80`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs font-medium text-primary">{hint}</p>}
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  )
}

function LeaveTypeTile({ label, days, max = 15, color }) {
  const pct = Math.min(100, Math.round((days / max) * 100))
  return (
    <div className="rounded-2xl border border-neutral-100 bg-gradient-to-b from-white to-neutral-50/80 p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-3xl font-bold tabular-nums text-foreground">{days}</p>
          <p className="mt-0.5 text-sm font-medium text-muted">{label}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${color}`}>
          days
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-muted">{pct}% of typical allowance</p>
    </div>
  )
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const { leaveRequests, employeeStats } = useHrms()
  const myLeaves = leaveRequests.filter((l) => l.employeeId === user?.employeeId)
  const stats = employeeStats
  const balance = stats?.leaveBalance ?? { casual: 0, sick: 0, earned: 0 }
  const totalLeave = balance.casual + balance.sick + balance.earned
  const pendingCount = myLeaves.filter((l) => l.status === 'pending').length
  const recentLeaves = [...myLeaves].slice(0, 4)
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark p-6 text-white shadow-lg shadow-primary/25 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-black/10" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold ring-2 ring-white/30 backdrop-blur-sm">
              {initials || 'E'}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-white/85">
                <Sparkles className="h-4 w-4" />
                {getTimeGreeting()}
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">{user?.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDisplayDate(todayDate())}
                </span>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                    {pendingCount} leave pending
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:max-w-xl lg:grid-cols-2">
            <QuickAction to="/employee/leave" icon={CalendarOff} label="Apply leave" desc="Request time off" />
            <QuickAction to="/employee/profile" icon={User} label="My profile" desc="Personal details" />
            <QuickAction to="/employee/reimbursements" icon={Receipt} label="Reimbursements" desc="Submit expenses" />
            <QuickAction to="/employee/payslips" icon={FileText} label="Payslips" desc="Salary slips" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          icon={CalendarOff}
          label="Total leave balance"
          value={totalLeave}
          hint="CL + SL + EL combined"
          accent="from-orange-100 to-primary-light"
        />
        <KpiCard
          icon={FileText}
          label="Leave requests"
          value={myLeaves.length}
          hint={`${pendingCount} awaiting approval`}
          accent="from-neutral-100 to-primary-light"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground">Leave balance breakdown</h2>
              <p className="text-xs text-muted">Available days by leave type</p>
            </div>
            <Link
              to="/employee/leave"
              className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-muted"
            >
              Apply leave
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <LeaveTypeTile label="Casual leave" days={balance.casual} color="bg-blue-50 text-blue-700" />
            <LeaveTypeTile label="Sick leave" days={balance.sick} color="bg-rose-50 text-rose-700" />
            <LeaveTypeTile label="Earned leave" days={balance.earned} color="bg-emerald-50 text-emerald-700" />
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">My leave requests</h2>
              <p className="text-xs text-muted">Recent activity</p>
            </div>
            {myLeaves.length > 0 && (
              <Link to="/employee/leave" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            )}
          </div>

          {recentLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 py-10 text-center">
              <CalendarOff className="h-10 w-10 text-neutral-300" />
              <p className="mt-3 text-sm font-medium text-foreground">No leave requests yet</p>
              <p className="mt-1 max-w-[200px] text-xs text-muted">
                Plan time off and submit a request in one click.
              </p>
              <Link
                to="/employee/leave"
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
              >
                Apply for leave
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentLeaves.map((leave) => (
                <li
                  key={leave.id}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-3 transition-colors hover:border-primary/20 hover:bg-primary-light/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Clock className="h-4 w-4 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{leave.type}</p>
                    <p className="text-xs text-muted">{formatLeaveDateRange(leave)}</p>
                  </div>
                  <Badge status={leave.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
