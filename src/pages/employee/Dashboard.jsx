import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarOff,
  FileText,
  ChevronRight,
  Receipt,
  Clock,
  CalendarDays,
  ArrowUpRight,
  GitBranch,
  TrendingUp,
} from 'lucide-react'
import { normalizePayrollRecord } from '../../store/hrmsHelpers'
import LeaveBalanceCard from '../../components/employee/LeaveBalanceCard'
import { buildLeaveBalanceCardItems } from '../../utils/leaveBalance'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { buildEmployeeLeaveSummary } from '../../utils/leaveBalance'
import { getHolidayTypeMeta } from '../../utils/holidayTypes'
import { buildEmployeeRecentActivities } from '../../utils/employeeRecentActivity'
import {
  formatLeaveDateRange,
  formatWelcomeDateParts,
  getFirstName,
  getTimeGreeting,
  todayDate,
} from '../../utils/timeUtils'

function getUpcomingHolidays(holidays = []) {
  const today = todayDate()
  return [...holidays]
    .filter((holiday) => holiday.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function formatHolidayDateTile(iso) {
  if (!iso) return { day: '--', month: '---', weekday: '' }
  const date = new Date(`${iso}T12:00:00`)
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
    weekday: date.toLocaleDateString('en-IN', { weekday: 'long' }),
  }
}

function formatHolidaySubtitle(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDaysUntilHoliday(iso) {
  if (!iso) return null
  const today = todayDate()
  const start = new Date(`${today}T12:00:00`)
  const end = new Date(`${iso}T12:00:00`)
  const diff = Math.round((end - start) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `In ${diff} days`
}

const DASHBOARD_HOLIDAY_PREVIEW = 5

function DashboardWelcome({ greeting, firstName, employee, role, department, manager = null }) {
  const { weekday, dateLine } = formatWelcomeDateParts()
  const employeeCode = employee?.id ?? '—'
  const managerName = manager?.name ?? null

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
            Here&apos;s what&apos;s happening with your HR profile today.
            {managerName ? (
              <>
                {' '}
                Your reporting manager is{' '}
                <span className="font-semibold text-foreground">{managerName}</span>.
              </>
            ) : null}
          </p>

          {department ? (
            <span className="mt-4 inline-flex rounded-full border border-primary/20 bg-white/90 px-3 py-1 text-xs font-semibold text-primary-dark">
              {department}
            </span>
          ) : null}
        </div>

        {(role || managerName || employeeCode !== '—') && (
          <div className="hidden shrink-0 items-stretch gap-6 sm:flex">
            {role ? (
              <div className="min-w-[7rem] border-r border-neutral-200/90 pr-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Role</p>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{role}</p>
              </div>
            ) : null}
            {managerName ? (
              <div className="min-w-[7rem] border-r border-neutral-200/90 pr-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Manager</p>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{managerName}</p>
              </div>
            ) : null}
            <div className="min-w-[5.5rem]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Employee ID</p>
              <p className="mt-1.5 text-sm font-bold tracking-wide text-foreground">{employeeCode}</p>
            </div>
          </div>
        )}
      </div>

      {(role || managerName || employeeCode !== '—') && (
        <div className="relative flex flex-wrap gap-6 border-t border-neutral-200/80 bg-white/70 px-6 py-3.5 sm:hidden">
          {role ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Role</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{role}</p>
            </div>
          ) : null}
          {managerName ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Manager</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{managerName}</p>
            </div>
          ) : null}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Employee ID</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">{employeeCode}</p>
          </div>
        </div>
      )}
    </header>
  )
}

function formatPayslipTitle(month) {
  if (!month) return 'No payslip yet'
  const parsed = new Date(`${month} 01`)
  if (Number.isNaN(parsed.getTime())) return month
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatInr(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  return `₹${value.toLocaleString('en-IN')}`
}

function StatQuickCard({
  to,
  title,
  value,
  footer,
  icon: Icon,
  iconVariant = 'accent',
  progressPercent,
  footerTrend = false,
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-[190px] flex-col rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:min-h-[200px] sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        {iconVariant === 'accent' ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary sm:h-[3.25rem] sm:w-[3.25rem]">
            <Icon className="h-6 w-6" strokeWidth={2} />
          </span>
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-[3.25rem] sm:w-[3.25rem]">
            <Icon className="h-7 w-7 text-foreground" strokeWidth={1.75} />
          </span>
        )}
        <ArrowUpRight className="h-5 w-5 shrink-0 text-neutral-400 opacity-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100 sm:h-6 sm:w-6" />
      </div>

      <p className="mt-5 text-sm font-medium text-neutral-500 sm:text-base">{title}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>

      {progressPercent != null && (
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-primary-light">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {footer ? (
        <p className="mt-auto flex items-center gap-1.5 pt-5 text-xs text-neutral-500 sm:text-sm">
          {footerTrend ? <TrendingUp className="h-4 w-4 text-primary" strokeWidth={2.5} /> : null}
          <span>{footer}</span>
        </p>
      ) : null}
    </Link>
  )
}

function DashboardPanelHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      <p className="dashboard-section-eyebrow text-[11px] uppercase">{eyebrow}</p>
      <h3
        className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {title}
      </h3>
      {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
    </div>
  )
}

function DashboardTextLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
    >
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  )
}

function UpcomingHolidayHero({ holiday }) {
  const tile = formatHolidayDateTile(holiday.date)
  const typeMeta = getHolidayTypeMeta(holiday.type)
  const countdown = getDaysUntilHoliday(holiday.date)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-light/60 via-white to-white p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-primary/10"
          >
            <span className="text-3xl font-semibold leading-none">{tile.day}</span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary/80">
              {tile.month}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">Next up</p>
            <h3
              className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl"
            >
              {holiday.name}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">{formatHolidaySubtitle(holiday.date)}</p>
            <span
              className={`mt-3 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${typeMeta.chipClass}`}
            >
              {typeMeta.label}
            </span>
          </div>
        </div>
        {countdown && (
          <p
            className="shrink-0 text-lg font-semibold text-primary sm:text-right sm:text-xl"
          >
            {countdown}
          </p>
        )}
      </div>
    </div>
  )
}

function UpcomingHolidayRow({ holiday }) {
  const tile = formatHolidayDateTile(holiday.date)
  const typeMeta = getHolidayTypeMeta(holiday.type)

  return (
    <li>
      <div className="group flex items-center gap-4 rounded-2xl border border-transparent px-1 py-3 transition-colors hover:border-neutral-200/80 hover:bg-neutral-50/80 sm:gap-5 sm:px-3 sm:py-4">
        <div
          className="flex w-14 shrink-0 flex-col items-center text-center sm:w-16"
        >
          <span className="text-2xl font-semibold leading-none text-foreground">{tile.day}</span>
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
            {tile.month}
          </span>
        </div>
        <div className="min-w-0 flex-1 border-l border-neutral-100 pl-4 sm:pl-5">
          <p className="truncate font-semibold text-foreground">{holiday.name}</p>
          <p className="mt-0.5 truncate text-sm text-neutral-600">{tile.weekday}</p>
        </div>
        <span
          className={`hidden shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:inline-flex ${typeMeta.chipClass}`}
        >
          {typeMeta.label}
        </span>
      </div>
    </li>
  )
}

const DASHBOARD_ACTIVITY_TIMELINE = 5

function activityStatusLabel(status) {
  if (!status) return null
  if (status === 'rejected') return 'Declined'
  if (status === 'available') return 'Available'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function RecentActivityTimelineCard({ item, isLatest = false }) {
  const showStatus = Boolean(item.status)

  const card = (
    <div
      className={`rounded-2xl px-4 py-3.5 transition-shadow ${
        isLatest
          ? 'border-2 border-primary/45 bg-primary-light/40 shadow-md shadow-primary/10 ring-1 ring-primary/15'
          : item.status === 'pending'
            ? 'border border-amber-200/90 bg-amber-50/50 shadow-sm hover:shadow-md'
            : 'border border-neutral-200/90 bg-white shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">{item.title}</p>
        {isLatest ? (
          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Latest
          </span>
        ) : showStatus ? (
          <Badge status={item.status}>{activityStatusLabel(item.status)}</Badge>
        ) : null}
      </div>
      {item.description ? (
        <p className="mt-1.5 text-xs font-medium leading-relaxed text-neutral-700">{item.description}</p>
      ) : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <p className="text-[11px] text-neutral-500">{item.time}</p>
        {isLatest && showStatus ? (
          <Badge status={item.status}>{activityStatusLabel(item.status)}</Badge>
        ) : null}
      </div>
    </div>
  )

  if (item.link) {
    return (
      <Link to={item.link} className="block">
        {card}
      </Link>
    )
  }

  return card
}

function RecentActivityTimeline({ items }) {
  const timelineItems = items.slice(0, DASHBOARD_ACTIVITY_TIMELINE)

  return (
    <div className="relative mx-1 py-2">
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 top-6 w-px -translate-x-1/2 bg-neutral-200"
        aria-hidden
      />

      <ol className="space-y-7">
        {timelineItems.map((item, index) => {
          const onRight = index % 2 === 0
          const isLatest = index === 0
          const isPending = item.status === 'pending'

          return (
            <li key={item.id} className="relative min-h-[4.5rem]">
              <span
                className={`absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full border-2 ${
                  isLatest
                    ? 'h-4 w-4 border-primary bg-primary shadow-[0_0_0_4px_rgba(245,130,32,0.2)]'
                    : isPending
                      ? 'h-3.5 w-3.5 border-amber-400 bg-amber-100'
                      : 'h-3.5 w-3.5 border-neutral-300 bg-white'
                }`}
                aria-hidden
              />
              <div
                className={`absolute top-0 w-[calc(50%-1.25rem)] max-w-[260px] ${
                  onRight ? 'right-0 text-left' : 'left-0 text-left'
                }`}
              >
                <RecentActivityTimelineCard item={item} isLatest={isLatest} />
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const {
    employees = [],
    holidays = [],
    leaveRequests,
    reimbursementRequests = [],
    payrollRecords = [],
    activityFeed = [],
    employeeStats,
    leaveBalancesByEmployee = {},
    optionalHolidayClaims = [],
    leavePolicy = {},
    getEmployeeById,
    getEmployeeDetails,
  } = useHrms()

  const resolvedEmployeeId = useMemo(() => {
    if (user?.employeeId) return user.employeeId
    if (user?.email) {
      return (
        employees.find((employee) => employee.email?.toLowerCase() === user.email.toLowerCase())?.id ??
        null
      )
    }
    return null
  }, [user?.employeeId, user?.email, employees])

  const currentEmployee = useMemo(() => {
    if (resolvedEmployeeId) return getEmployeeById(resolvedEmployeeId) ?? null
    return null
  }, [resolvedEmployeeId, getEmployeeById])

  const upcomingHolidays = useMemo(() => getUpcomingHolidays(holidays), [holidays])
  const previewHolidays = useMemo(
    () => upcomingHolidays.slice(0, DASHBOARD_HOLIDAY_PREVIEW),
    [upcomingHolidays],
  )
  const nextHoliday = previewHolidays[0] ?? null
  const followingHolidays = previewHolidays.slice(1)
  const moreHolidayCount = Math.max(0, upcomingHolidays.length - DASHBOARD_HOLIDAY_PREVIEW)
  const myLeaves = leaveRequests.filter((l) => l.employeeId === resolvedEmployeeId)
  const leaveSummary = buildEmployeeLeaveSummary({
    employee: currentEmployee,
    employeeId: resolvedEmployeeId,
    leaveRequests,
    leaveBalancesByEmployee,
    fallbackBalance: employeeStats?.leaveBalance,
    optionalHolidayClaims,
    leavePolicy,
  })
  const balance = leaveSummary.remaining
  const leaveBalanceCards = useMemo(
    () => buildLeaveBalanceCardItems(leaveSummary),
    [leaveSummary],
  )
  const totalLeave = balance.casual + balance.sick + balance.earned
  const recentLeaves = [...myLeaves].slice(0, 4)
  const displayName = currentEmployee?.name || user?.name || 'there'
  const firstName = getFirstName(displayName)

  const myReimbursements = useMemo(
    () => reimbursementRequests.filter((request) => request.employeeId === resolvedEmployeeId),
    [reimbursementRequests, resolvedEmployeeId],
  )
  const pendingReimbursements = myReimbursements.filter((request) => request.status === 'pending').length
  const pendingReimbursementTotal = useMemo(
    () =>
      myReimbursements
        .filter((request) => request.status === 'pending')
        .reduce((sum, request) => sum + (Number(request.amount) || 0), 0),
    [myReimbursements],
  )
  const leaveProgressPercent = useMemo(() => {
    const annualPool = 45
    return Math.min(100, Math.max(0, Math.round((totalLeave / annualPool) * 100)))
  }, [totalLeave])

  const latestPayslip = useMemo(() => {
    const records = payrollRecords
      .filter((record) => record.employeeId === resolvedEmployeeId)
      .map((record) => normalizePayrollRecord(record, currentEmployee))
      .filter(Boolean)
      .sort((a, b) => String(b.month).localeCompare(String(a.month)))
    return records[0] ?? null
  }, [payrollRecords, resolvedEmployeeId, currentEmployee])

  const recentActivities = useMemo(
    () =>
      buildEmployeeRecentActivities({
        employeeId: resolvedEmployeeId,
        leaveRequests,
        reimbursementRequests,
        payrollRecords: payrollRecords
          .filter((record) => record.employeeId === resolvedEmployeeId)
          .map((record) => normalizePayrollRecord(record, currentEmployee))
          .filter(Boolean),
        activityFeed,
        limit: 8,
      }),
    [
      resolvedEmployeeId,
      leaveRequests,
      reimbursementRequests,
      payrollRecords,
      activityFeed,
      currentEmployee,
    ],
  )

  const manager = useMemo(() => {
    if (!resolvedEmployeeId) return null
    return getEmployeeDetails(resolvedEmployeeId)?.manager ?? null
  }, [resolvedEmployeeId, getEmployeeDetails, currentEmployee?.managerId])

  const statCards = useMemo(
    () => [
      {
        to: '/employee/leave',
        icon: CalendarOff,
        title: 'Leave balance',
        value: `${totalLeave} day${totalLeave === 1 ? '' : 's'}`,
        footer: 'Apply or check balance',
        iconVariant: 'accent',
        progressPercent: leaveProgressPercent,
        footerTrend: false,
      },
      {
        to: '/employee/reimbursements',
        icon: Receipt,
        title: 'Pending claims',
        value: pendingReimbursementTotal > 0 ? formatInr(pendingReimbursementTotal) : '₹0',
        footer:
          pendingReimbursements > 0
            ? `${pendingReimbursements} active request${pendingReimbursements === 1 ? '' : 's'}`
            : 'No claims in review',
        iconVariant: 'outline',
      },
      {
        to: '/employee/payslips',
        icon: FileText,
        title: 'Latest payslip',
        value: latestPayslip ? formatPayslipTitle(latestPayslip.month) : '—',
        footer: latestPayslip?.net
          ? `Net pay: ${formatInr(latestPayslip.net)}`
          : 'Download or share',
        iconVariant: 'accent',
      },
      {
        to: '/employee/reporting',
        icon: GitBranch,
        title: 'Reporting manager',
        value: manager?.name ?? 'Not assigned',
        footer: manager ? `${manager.role} · View org chart` : 'Set up in My Reporting',
        iconVariant: 'outline',
      },
    ],
    [
      totalLeave,
      leaveProgressPercent,
      pendingReimbursements,
      pendingReimbursementTotal,
      latestPayslip,
      manager,
    ],
  )

  return (
    <div className="space-y-12 pb-8">
      <DashboardWelcome
        greeting={getTimeGreeting()}
        firstName={firstName}
        employee={currentEmployee}
        role={currentEmployee?.role}
        department={currentEmployee?.department}
        manager={manager}
      />

      <section className="pt-2">
        <p className="dashboard-section-eyebrow text-[11px] uppercase">Quick access</p>
        <h2
          className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Everything in one tap
        </h2>
        

        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatQuickCard
              key={card.title}
              to={card.to}
              title={card.title}
              value={card.value}
              footer={card.footer}
              icon={card.icon}
              iconVariant={card.iconVariant}
              progressPercent={card.progressPercent}
              footerTrend={card.footerTrend}
            />
          ))}
        </div>
      </section>

      <section className="pt-2">
        <p className="dashboard-section-eyebrow text-[11px] uppercase">Time off</p>
        <h2
          className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Leave & requests
        </h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-5 lg:gap-8">
          <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-7 lg:col-span-3">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <DashboardPanelHeading
                eyebrow="Available"
                title="Leave balance"
                subtitle="Days remaining by type"
              />
              <DashboardTextLink to="/employee/leave">Apply leave</DashboardTextLink>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {leaveBalanceCards.map((card) => (
                <LeaveBalanceCard
                  key={card.key}
                  shortLabel={card.shortLabel}
                  remaining={card.remaining}
                  total={card.total}
                  used={card.used}
                  unit={card.unit}
                />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-7 lg:col-span-2">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <DashboardPanelHeading eyebrow="Activity" title="My requests" subtitle="Recent leave history" />
              {myLeaves.length > 0 && <DashboardTextLink to="/employee/leave">View all</DashboardTextLink>}
            </div>

            {recentLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <CalendarOff className="h-6 w-6" />
                </span>
                <p
                  className="mt-4 text-lg font-semibold text-foreground"
                >
                  No requests yet
                </p>
                <p className="mt-1 max-w-[220px] text-sm text-neutral-600">Apply for leave when you need time off.</p>
                <Link
                  to="/employee/leave"
                  className="mt-6 inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark"
                >
                  Apply for leave
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentLeaves.map((leave) => (
                  <li key={leave.id}>
                    <Link
                      to="/employee/leave"
                      className="group flex items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-colors hover:border-primary/20 hover:bg-neutral-50/50 sm:p-5"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <Clock className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{leave.type}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                          {formatLeaveDateRange(leave)}
                        </p>
                      </div>
                      <Badge status={leave.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>

      <section className="pt-2">
        <p className="dashboard-section-eyebrow text-[11px] uppercase">Overview</p>
        <h2
          className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Activity & calendar
        </h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          <section className="flex h-full flex-col rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <Clock className="h-5 w-5 text-neutral-600" />
                </span>
                <h3 className="text-lg font-bold tracking-tight text-foreground">Recent Activity</h3>
              </div>
              {recentActivities.length > 0 && (
                <Link
                  to="/employee/leave"
                  className="shrink-0 text-sm font-semibold text-primary hover:text-primary-dark"
                >
                  View all
                </Link>
              )}
            </div>

            {recentActivities.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-12 text-center">
                <Clock className="h-10 w-10 text-neutral-300" />
                <p className="mt-3 text-sm font-medium text-foreground">No recent activity</p>
                <p className="mt-1 text-sm text-neutral-600">Leave, reimbursements, and updates will show here.</p>
              </div>
            ) : (
              <RecentActivityTimeline items={recentActivities} />
            )}
          </section>

          <section className="flex h-full flex-col rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <DashboardPanelHeading
                eyebrow="Calendar"
                title="Upcoming holidays"
                subtitle={
                  upcomingHolidays.length
                    ? `${upcomingHolidays.length} on your calendar · showing next ${Math.min(DASHBOARD_HOLIDAY_PREVIEW, upcomingHolidays.length)}`
                    : 'Company holiday calendar'
                }
              />
              {upcomingHolidays.length > 0 && (
                <DashboardTextLink to="/employee/leave">Full calendar</DashboardTextLink>
              )}
            </div>

            {upcomingHolidays.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <CalendarDays className="h-6 w-6" />
                </span>
                <p
                  className="mt-4 text-lg font-semibold text-foreground"
                >
                  No upcoming holidays
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {nextHoliday && <UpcomingHolidayHero holiday={nextHoliday} />}

                {followingHolidays.length > 0 && (
                  <ul className="divide-y divide-neutral-100">
                    {followingHolidays.map((holiday) => (
                      <UpcomingHolidayRow key={holiday.id} holiday={holiday} />
                    ))}
                  </ul>
                )}

                {moreHolidayCount > 0 && (
                  <Link
                    to="/employee/leave"
                    className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-4 text-sm font-semibold text-primary transition-colors hover:border-primary/30 hover:bg-primary-light/30"
                  >
                    View {moreHolidayCount} more holiday{moreHolidayCount === 1 ? '' : 's'}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}
