import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarOff,
  FileText,
  ChevronRight,
  FolderOpen,
  Clock,
  CalendarDays,
  ArrowUpRight,
  GitBranch,
} from 'lucide-react'
import { normalizePayrollRecord } from '../../store/hrmsHelpers'
import { buildLeaveBalanceCardItems } from '../../utils/leaveBalance'
import { buildEmployeePortalDocuments } from '../../utils/employeePortalDocuments'
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

/* ---------- status pills (dark) ---------- */
const STATUS_STYLES = {
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  available: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-400/25',
}

function statusPillClass(status) {
  return STATUS_STYLES[status] || 'bg-slate-500/15 text-slate-300 border-slate-400/25'
}

function StatusPill({ status, label }) {
  if (!status) return null
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusPillClass(
        status,
      )}`}
    >
      {label ?? status}
    </span>
  )
}

/* ---------- helpers ---------- */
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

function activityStatusLabel(status) {
  if (!status) return null
  if (status === 'rejected') return 'Declined'
  if (status === 'available') return 'Available'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const DASHBOARD_HOLIDAY_PREVIEW = 5
const DASHBOARD_ACTIVITY_TIMELINE = 5

/* ---------- header ---------- */
function WelcomeHero({ greeting, firstName, role, department, employeeCode, stats }) {
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
            Here&apos;s your personal workspace — track leave, payslips and documents at a glance.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {role ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(16,185,129,0.7)]" />
                {role}
              </span>
            ) : null}
            {department ? (
              <span className="inline-flex rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70">
                {department}
              </span>
            ) : null}
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

function PanelLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-300 transition-colors hover:text-indigo-200"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  )
}

/* ---------- leave balance tile ---------- */
function LeaveBalanceTile({ shortLabel, remaining, total, used, unit = 'days' }) {
  const safeTotal = Math.max(0, Number(total) || 0)
  const safeUsed = Math.max(0, Number(used) || 0)
  const safeRemaining = Math.max(0, Number(remaining) || 0)
  const usedForBar = safeTotal > 0 ? Math.min(safeUsed, safeTotal) : 0
  const usedPct = safeTotal > 0 ? Math.min(100, Math.round((usedForBar / safeTotal) * 100)) : 0
  const usedLabel =
    unit === 'holidays'
      ? safeUsed === 1
        ? 'holiday used'
        : 'holidays used'
      : safeUsed === 1
        ? 'day used'
        : 'days used'

  return (
    <div className="flex min-h-[148px] flex-col rounded-2xl border border-white/8 bg-white/4 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{shortLabel}</p>
        <CalendarDays className="h-4 w-4 shrink-0 text-white/40" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[2rem] font-semibold leading-none tabular-nums text-white sm:text-[2.125rem]">
          {safeRemaining}
        </span>
        <span className="text-lg font-normal tabular-nums text-white/40 sm:text-xl">/ {safeTotal}</span>
      </div>
      <p className="mt-2 text-sm text-white/50">
        {safeUsed} {usedLabel}
      </p>
      <div className="mt-auto pt-4">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-[width] duration-500"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/* ---------- holidays ---------- */
function UpcomingHolidayHero({ holiday }) {
  const tile = formatHolidayDateTile(holiday.date)
  const typeMeta = getHolidayTypeMeta(holiday.type)
  const countdown = getDaysUntilHoliday(holiday.date)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <span className="hrx-glow hrx-glow-cyan -right-8 -top-10 h-32 w-32" aria-hidden />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white">
            <span className="text-3xl font-semibold leading-none">{tile.day}</span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/55">
              {tile.month}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Next up</p>
            <h3 className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-[1.7rem]">
              {holiday.name}
            </h3>
            <p className="mt-2 text-sm text-white/55">{formatHolidaySubtitle(holiday.date)}</p>
            <span className="mt-3 inline-flex rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">
              {typeMeta.label}
            </span>
          </div>
        </div>
        {countdown ? (
          <p className="shrink-0 text-lg font-semibold text-cyan-300 sm:text-right sm:text-xl">
            {countdown}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function UpcomingHolidayRow({ holiday }) {
  const tile = formatHolidayDateTile(holiday.date)
  const typeMeta = getHolidayTypeMeta(holiday.type)

  return (
    <li className="flex items-center gap-4 rounded-2xl px-1 py-3 transition-colors hover:bg-white/4 sm:gap-5 sm:px-3">
      <div className="flex w-14 shrink-0 flex-col items-center text-center sm:w-16">
        <span className="text-2xl font-semibold leading-none text-white">{tile.day}</span>
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-white/45">
          {tile.month}
        </span>
      </div>
      <div className="min-w-0 flex-1 border-l border-white/8 pl-4 sm:pl-5">
        <p className="truncate font-semibold text-white">{holiday.name}</p>
        <p className="mt-0.5 truncate text-sm text-white/45">{tile.weekday}</p>
      </div>
      <span className="hidden shrink-0 rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60 sm:inline-flex">
        {typeMeta.label}
      </span>
    </li>
  )
}

/* ---------- recent activity ---------- */
function RecentActivityTimeline({ items }) {
  const timelineItems = items.slice(0, DASHBOARD_ACTIVITY_TIMELINE)

  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-white/10">
      {timelineItems.map((item, index) => {
        const isLatest = index === 0
        const showStatus = Boolean(item.status)
        const node = (
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 transition-colors hover:border-white/15 hover:bg-white/6">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white">{item.title}</p>
              {isLatest ? (
                <span className="shrink-0 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-200">
                  Latest
                </span>
              ) : showStatus ? (
                <StatusPill status={item.status} label={activityStatusLabel(item.status)} />
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-1.5 text-xs leading-relaxed text-white/55">{item.description}</p>
            ) : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-[11px] text-white/40">{item.time}</p>
              {isLatest && showStatus ? (
                <StatusPill status={item.status} label={activityStatusLabel(item.status)} />
              ) : null}
            </div>
          </div>
        )

        return (
          <li key={item.id} className="relative pl-7">
            <span
              className={`absolute left-0 top-3.5 z-10 rounded-full border-2 ${
                isLatest
                  ? 'h-4 w-4 border-indigo-400 bg-indigo-400 shadow-[0_0_0_4px_rgba(79,70,229,0.25)]'
                  : item.status === 'pending'
                    ? 'h-3.5 w-3.5 border-amber-400 bg-amber-500/30'
                    : 'h-3.5 w-3.5 border-white/30 bg-white/10'
              }`}
              aria-hidden
            />
            {item.link ? (
              <Link to={item.link} className="block">
                {node}
              </Link>
            ) : (
              node
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ============================ page ============================ */
export default function EmployeeDashboard() {
  const { user } = useAuth()
  const {
    employees = [],
    holidays = [],
    leaveRequests,
    payrollRecords = [],
    activityFeed = [],
    employeeStats,
    leaveBalancesByEmployee = {},
    optionalHolidayClaims = [],
    leavePolicy = {},
    employeeDocuments = [],
    generatedDocuments = [],
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
  const leaveBalanceCards = useMemo(() => buildLeaveBalanceCardItems(leaveSummary), [leaveSummary])
  const totalLeave = balance.casual + balance.sick + balance.earned
  const recentLeaves = [...myLeaves].slice(0, 4)
  const displayName = currentEmployee?.name || user?.name || 'there'
  const firstName = getFirstName(displayName)

  const myDocuments = useMemo(
    () =>
      buildEmployeePortalDocuments({
        employeeId: resolvedEmployeeId,
        employeeDocuments,
        generatedDocuments,
      }),
    [resolvedEmployeeId, employeeDocuments, generatedDocuments],
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
        reimbursementRequests: [],
        payrollRecords: payrollRecords
          .filter((record) => record.employeeId === resolvedEmployeeId)
          .map((record) => normalizePayrollRecord(record, currentEmployee))
          .filter(Boolean),
        activityFeed,
        limit: 8,
      }),
    [resolvedEmployeeId, leaveRequests, payrollRecords, activityFeed, currentEmployee],
  )

  const manager = useMemo(() => {
    if (!resolvedEmployeeId) return null
    return getEmployeeDetails(resolvedEmployeeId)?.manager ?? null
  }, [resolvedEmployeeId, getEmployeeDetails, currentEmployee?.managerId])

  const heroStats = [
    { label: 'Leave days', value: totalLeave },
    { label: 'Documents', value: myDocuments.length },
    { label: 'Holidays ahead', value: upcomingHolidays.length },
  ]

  const kpis = [
    {
      to: '/employee/leave',
      icon: CalendarOff,
      label: 'Leave balance',
      value: `${totalLeave} day${totalLeave === 1 ? '' : 's'}`,
      sub: 'Apply or check balance',
      glow: 'hrx-glow-indigo',
      iconTint: 'text-indigo-300',
      progressPercent: leaveProgressPercent,
    },
    {
      to: '/employee/payslips',
      icon: FileText,
      label: 'Latest payslip',
      value: latestPayslip ? formatPayslipTitle(latestPayslip.month) : '—',
      sub: latestPayslip?.net ? `Net pay: ${formatInr(latestPayslip.net)}` : 'Download or share',
      glow: 'hrx-glow-emerald',
      iconTint: 'text-emerald-300',
    },
    {
      to: '/employee/documents',
      icon: FolderOpen,
      label: 'Documents',
      value: `${myDocuments.length} file${myDocuments.length === 1 ? '' : 's'}`,
      sub: 'Letters, contracts & more',
      glow: 'hrx-glow-amber',
      iconTint: 'text-amber-300',
    },
    {
      to: '/employee/reporting',
      icon: GitBranch,
      label: 'Reporting manager',
      value: manager?.name ?? 'Not assigned',
      sub: manager ? `${manager.role} · View org chart` : 'Set up in My Reporting',
      glow: 'hrx-glow-violet',
      iconTint: 'text-violet-300',
    },
  ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <WelcomeHero
        greeting={getTimeGreeting()}
        firstName={firstName}
        role={currentEmployee?.role}
        department={currentEmployee?.department}
        employeeCode={currentEmployee?.id ?? '—'}
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

      {/* Leave balance + my requests */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel
          title="Leave balance"
          subtitle="Days remaining by type"
          glow="hrx-glow-indigo"
          className="lg:col-span-3"
          action={<PanelLink to="/employee/leave">Apply leave</PanelLink>}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {leaveBalanceCards.map((card) => (
              <LeaveBalanceTile
                key={card.key}
                shortLabel={card.shortLabel}
                remaining={card.remaining}
                total={card.total}
                used={card.used}
                unit={card.unit}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="My requests"
          subtitle="Recent leave history"
          glow="hrx-glow-violet"
          className="lg:col-span-2"
          action={myLeaves.length > 0 ? <PanelLink to="/employee/leave">View all</PanelLink> : null}
        >
          {recentLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/4 px-6 py-10 text-center">
              <span className="hrx-icon-tile h-12 w-12 text-indigo-300">
                <CalendarOff className="h-6 w-6" />
              </span>
              <p className="mt-4 text-base font-semibold text-white">No requests yet</p>
              <p className="mt-1 max-w-[220px] text-sm text-white/50">
                Apply for leave when you need time off.
              </p>
              <Link
                to="/employee/leave"
                className="mt-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400"
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
                    className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-4 transition-colors hover:border-white/15 hover:bg-white/6"
                  >
                    <span className="hrx-icon-tile h-11 w-11 text-indigo-300">
                      <Clock className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{leave.type}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/45">
                        {formatLeaveDateRange(leave)}
                      </p>
                    </div>
                    <StatusPill status={leave.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Activity + holidays */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Recent activity"
          subtitle="Leave, payslips and updates"
          glow="hrx-glow-cyan"
          className="h-full"
          action={recentActivities.length > 0 ? <PanelLink to="/employee/leave">View all</PanelLink> : null}
        >
          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/4 px-6 py-12 text-center">
              <Clock className="h-10 w-10 text-white/25" />
              <p className="mt-3 text-sm font-medium text-white">No recent activity</p>
              <p className="mt-1 text-sm text-white/45">
                Leave, reimbursements, and updates will show here.
              </p>
            </div>
          ) : (
            <RecentActivityTimeline items={recentActivities} />
          )}
        </Panel>

        <Panel
          title="Upcoming holidays"
          subtitle={
            upcomingHolidays.length
              ? `${upcomingHolidays.length} on your calendar · showing next ${Math.min(
                  DASHBOARD_HOLIDAY_PREVIEW,
                  upcomingHolidays.length,
                )}`
              : 'Company holiday calendar'
          }
          glow="hrx-glow-violet"
          className="h-full"
          action={upcomingHolidays.length > 0 ? <PanelLink to="/employee/leave">Full calendar</PanelLink> : null}
        >
          {upcomingHolidays.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/4 px-6 py-12 text-center">
              <span className="hrx-icon-tile h-12 w-12 text-violet-300">
                <CalendarDays className="h-6 w-6" />
              </span>
              <p className="mt-4 text-base font-semibold text-white">No upcoming holidays</p>
            </div>
          ) : (
            <div className="space-y-5">
              {nextHoliday ? <UpcomingHolidayHero holiday={nextHoliday} /> : null}

              {followingHolidays.length > 0 ? (
                <ul className="divide-y divide-white/8">
                  {followingHolidays.map((holiday) => (
                    <UpcomingHolidayRow key={holiday.id} holiday={holiday} />
                  ))}
                </ul>
              ) : null}

              {moreHolidayCount > 0 ? (
                <Link
                  to="/employee/leave"
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/4 px-4 py-3.5 text-sm font-semibold text-indigo-300 transition-colors hover:border-white/20 hover:bg-white/6"
                >
                  View {moreHolidayCount} more holiday{moreHolidayCount === 1 ? '' : 's'}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              ) : null}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
