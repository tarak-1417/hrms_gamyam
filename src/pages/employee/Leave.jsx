import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, PartyPopper, Flag, Star, Info } from 'lucide-react'
import LeaveBalanceCard from '../../components/employee/LeaveBalanceCard'
import Card from '../../components/ui/Card'
import DatePicker from '../../components/ui/DatePicker'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { getEarnedLeavePolicy } from '../../utils/earnedLeavePolicy'
import {
  buildEmployeeLeaveSummary,
  buildLeaveBalanceCardItems,
  getLeaveRequestValidation,
} from '../../utils/leaveBalance'
import {
  countHolidaysByType,
  getHolidayTypeMeta,
  isOptionalHolidayType,
  listHolidayTypes,
  normalizeHolidayType,
} from '../../utils/holidayTypes'
import {
  calculateLeaveDays,
  formatLeaveDateRange,
  formatLeaveDuration,
  HALF_DAY_PERIODS,
} from '../../utils/timeUtils'

const LEAVE_TYPE_OPTIONS = [
  { value: 'Casual Leave', balanceKey: 'casual' },
  { value: 'Sick Leave', balanceKey: 'sick' },
  { value: 'Earned Leave', balanceKey: 'earned' },
  { value: 'Optional Holiday', balanceKey: null, isOptional: true },
]

function getLeaveTypeRemaining(type, balance, optionalRemaining) {
  const opt = LEAVE_TYPE_OPTIONS.find((o) => o.value === type)
  if (!opt) return 0
  if (opt.isOptional) return optionalRemaining
  return balance[opt.balanceKey] ?? 0
}

function formatBalanceLabel(remaining, isOptional, optionalLimit) {
  if (isOptional) {
    return `${remaining} of ${optionalLimit} left`
  }
  const n = Number(remaining)
  if (n === 0) return '0 days left'
  if (n === 0.5) return '0.5 day left'
  return `${n} ${n === 1 ? 'day' : 'days'} left`
}

function getHolidayTypeIcon(type) {
  if (normalizeHolidayType(type) === 'national') return Flag
  if (normalizeHolidayType(type) === 'festival') return PartyPopper
  if (normalizeHolidayType(type) === 'optional') return Star
  return CalendarDays
}

export default function EmployeeLeave({ embedded = false }) {
  const { user } = useAuth()
  const {
    employees = [],
    leaveRequests,
    submitLeave,
    showToast,
    employeeStats,
    leaveBalancesByEmployee = {},
    holidays = [],
    leavePolicy = {},
    optionalHolidayClaims = [],
  } = useHrms()

  const [form, setForm] = useState({
    type: 'Casual Leave',
    durationType: 'full',
    halfDayPeriod: 'first_half',
    from: '',
    to: '',
    reason: '',
  })
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)

  const isHalfDay = form.durationType === 'half'
  const [holidayFilter, setHolidayFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('calendar')

  const myLeaves = leaveRequests.filter((l) => l.employeeId === user?.employeeId)
  const currentEmployee = useMemo(
    () => employees.find((employee) => employee.id === user?.employeeId) ?? null,
    [employees, user?.employeeId],
  )
  const myOptionalClaims = optionalHolidayClaims.filter(
    (c) => c.employeeId === user?.employeeId && c.year === (leavePolicy.year ?? 2026),
  )
  const leaveSummary = useMemo(
    () =>
      buildEmployeeLeaveSummary({
        employee: currentEmployee,
        employeeId: user?.employeeId,
        leaveRequests,
        leaveBalancesByEmployee,
        fallbackBalance: employeeStats?.leaveBalance,
        optionalHolidayClaims,
        leavePolicy,
      }),
    [
      currentEmployee,
      user?.employeeId,
      leaveRequests,
      leaveBalancesByEmployee,
      employeeStats?.leaveBalance,
      optionalHolidayClaims,
      leavePolicy,
    ],
  )
  const balance = leaveSummary.remaining
  const leaveBalanceCards = useMemo(
    () => buildLeaveBalanceCardItems(leaveSummary),
    [leaveSummary],
  )
  const optionalUsed = leaveSummary.optionalUsed
  const optionalLimit = leaveSummary.optionalLimit
  const optionalRemaining = leaveSummary.optionalRemaining
  const earnedLeavePolicy = useMemo(() => getEarnedLeavePolicy(leavePolicy), [leavePolicy])

  const leaveTypeOptions = useMemo(
    () =>
      LEAVE_TYPE_OPTIONS.map((opt) => {
        const remaining = opt.isOptional
          ? optionalRemaining
          : (balance[opt.balanceKey] ?? 0)
        return {
          ...opt,
          remaining,
          label: `${opt.value} (${formatBalanceLabel(remaining, opt.isOptional, optionalLimit)})`,
          disabled: remaining <= 0,
        }
      }),
    [balance, optionalRemaining, optionalLimit],
  )

  const selectedLeaveMeta = leaveTypeOptions.find((o) => o.value === form.type)
  const selectedRemaining = selectedLeaveMeta?.remaining ?? 0

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays],
  )
  const holidayTypes = useMemo(() => listHolidayTypes(sortedHolidays), [sortedHolidays])
  const counts = useMemo(() => countHolidaysByType(sortedHolidays), [sortedHolidays])
  const holidayFilters = useMemo(
    () => [
      { id: 'all', label: 'All' },
      ...holidayTypes.map((type) => ({
        id: type,
        label: getHolidayTypeMeta(type).shortLabel,
        icon: getHolidayTypeIcon(type),
      })),
    ],
    [holidayTypes],
  )

  const filteredHolidays = useMemo(() => {
    if (holidayFilter === 'all') return sortedHolidays
    return sortedHolidays.filter((h) => normalizeHolidayType(h.type) === holidayFilter)
  }, [sortedHolidays, holidayFilter])

  useEffect(() => {
    if (holidayFilter !== 'all' && !holidayTypes.includes(holidayFilter)) {
      setHolidayFilter('all')
    }
  }, [holidayFilter, holidayTypes])

  const isOptionalClaimed = (holidayId) =>
    myOptionalClaims.some((c) => c.holidayId === holidayId && c.status === 'availed')

  const handleSubmit = (e) => {
    e.preventDefault()
    const from = form.from
    const to = isHalfDay ? form.from : form.to
    const daysRequested = calculateLeaveDays({
      from,
      to,
      durationType: form.durationType,
    })
    const remaining = getLeaveTypeRemaining(form.type, balance, optionalRemaining)
    const requestSummary = buildEmployeeLeaveSummary({
      employee: currentEmployee,
      employeeId: user?.employeeId,
      leaveRequests,
      leaveBalancesByEmployee,
      fallbackBalance: employeeStats?.leaveBalance,
      optionalHolidayClaims,
      leavePolicy,
      asOfDate: from,
    })
    const validation = getLeaveRequestValidation(
      {
        type: form.type,
        from,
        to,
        days: daysRequested,
      },
      requestSummary,
      leavePolicy,
    )

    if (validation.reasons?.length) {
      showToast(validation.reasons[0])
      return
    }

    if (remaining <= 0) {
      showToast(`No ${form.type.toLowerCase()} balance remaining`)
      return
    }
    if (daysRequested > remaining) {
      const unit =
        form.type === 'Optional Holiday'
          ? `${remaining} optional holiday(s)`
          : `${remaining} ${remaining === 1 ? 'day' : 'days'}`
      showToast(`Insufficient balance — only ${unit} available for ${form.type}`)
      return
    }

    submitLeave({
      type: form.type,
      from,
      to,
      reason: form.reason,
      durationType: form.durationType,
      halfDayPeriod: isHalfDay ? form.halfDayPeriod : undefined,
      employeeId: user.employeeId,
      employeeName: user.name,
    })
    setForm({
      type: 'Casual Leave',
      durationType: 'full',
      halfDayPeriod: 'first_half',
      from: '',
      to: '',
      reason: '',
    })
    setLeaveModalOpen(false)
    setActiveTab('requests')
  }

  const setDurationType = (durationType) => {
    setForm((prev) => ({
      ...prev,
      durationType,
      to: durationType === 'half' ? prev.from : prev.to,
    }))
  }

  const tabs = [
    { id: 'calendar', label: 'Holiday calendar' },
    { id: 'apply', label: 'Apply leave' },
    { id: 'requests', label: 'My requests' },
  ]

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="page-title">Leave & Holidays</h1>
          <p className="page-subtitle">Balances, company holidays, optional offs, and leave applications</p>
        </div>
      )}

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

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {holidayTypes.map((type) => (
              <SummaryChip
                key={type}
                type={type}
                icon={getHolidayTypeIcon(type)}
                label={getHolidayTypeMeta(type).shortLabel}
                count={counts[type] ?? 0}
                hint={isOptionalHolidayType(type) ? `${optionalUsed}/${optionalLimit} used` : undefined}
              />
            ))}
          </div>

          <Card
            title="Company holiday list"
            subtitle={`${leavePolicy.year ?? 2026} holiday calendar · ${filteredHolidays.length} shown`}
            className="overflow-hidden"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {holidayFilters.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setHolidayFilter(id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      holidayFilter === id
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-border bg-white text-muted hover:border-primary/20 hover:text-foreground'
                    }`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {label}
                    {id !== 'all' && <span className="opacity-75">({counts[id] ?? 0})</span>}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted">
                {filteredHolidays.length === sortedHolidays.length
                  ? `${sortedHolidays.length} holidays this year`
                  : `${filteredHolidays.length} matching holidays`}
              </span>
            </div>

            <HolidayListPanel
              holidays={filteredHolidays}
              isOptionalClaimed={isOptionalClaimed}
            />
          </Card>

          <Card title="Holiday policy">
            <div className="space-y-4 text-sm">
              <PolicyRow
                icon={Flag}
                title="National & festival holidays"
                text={leavePolicy.restrictedHolidayNote ?? 'These are company-wide holidays. You do not need to apply leave.'}
              />
              <PolicyRow
                icon={Star}
                title="Optional holidays"
                text={
                  leavePolicy.optionalHolidayNote ??
                  `Choose up to ${optionalLimit} optional holidays per year.`
                }
              />
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary-light/40 p-3 text-xs text-muted">
                <Info className="mr-1 inline h-4 w-4 text-primary" />
                To use an optional holiday, apply leave with type <strong>Optional Holiday</strong> on the
                Apply tab, or contact HR to record your selection.
              </div>
              <PolicyRow
                icon={Info}
                title="Earned leave policy"
                text={`${
                  earnedLeavePolicy.isPaid ? 'Paid' : 'Unpaid'
                } leave that accrues ${earnedLeavePolicy.accrualDaysPerMonth} day(s) every month, carries forward up to ${
                  earnedLeavePolicy.carryForwardCapDays
                } day(s), and ${
                  earnedLeavePolicy.retroactiveAllowed ? 'allows' : 'does not allow'
                } retroactive requests.`}
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'apply' && (
        <Card
          title="Apply for Leave"
          subtitle="Open the popup to submit a new leave request."
          action={
            <button
              type="button"
              onClick={() => setLeaveModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Apply Leave
            </button>
          }
        >
          <div className="rounded-xl border border-dashed border-border bg-neutral-50/70 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Click the button above to apply for leave.</p>
            <p className="mt-1 text-xs text-muted">The leave form will open in a popup.</p>
          </div>
        </Card>
      )}

      {activeTab === 'requests' && (
        <Card title="My leave history">
          <div className="space-y-3">
            {myLeaves.length === 0 ? (
              <p className="text-sm text-muted">No leave requests yet</p>
            ) : (
              myLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{leave.type}</p>
                    <p className="text-sm text-muted">
                      {formatLeaveDateRange(leave)} · {formatLeaveDuration(leave)}
                    </p>
                    {leave.reason && (
                      <p className="mt-1 text-xs text-muted">{leave.reason}</p>
                    )}
                  </div>
                  <Badge status={leave.status} />
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      <Modal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Apply for Leave"
        subtitle="Fill the details below and submit your leave request."
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Duration</label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDurationType('full')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  !isHalfDay
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-border bg-white text-muted hover:border-primary hover:text-primary'
                }`}
              >
                Full day
              </button>
              <button
                type="button"
                onClick={() => setDurationType('half')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isHalfDay
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-border bg-white text-muted hover:border-primary hover:text-primary'
                }`}
              >
                Half day
              </button>
            </div>
            {isHalfDay && (
              <p className="mt-2 text-xs text-muted">
                Half-day leave counts as 0.5 day against your balance.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Leave type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2 text-sm"
            >
              {leaveTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted">
              {selectedRemaining > 0 ? (
                <>
                  Available:{' '}
                  <span className="font-semibold text-primary">
                    {formatBalanceLabel(
                      selectedRemaining,
                      form.type === 'Optional Holiday',
                      optionalLimit,
                    )}
                  </span>
                  {form.type !== 'Optional Holiday' && isHalfDay && (
                    <span> · half-day uses 0.5 day</span>
                  )}
                </>
              ) : (
                <span className="text-amber-700">No balance left for this leave type</span>
              )}
            </p>
            {form.type === 'Earned Leave' && (
              <p className="mt-2 text-xs text-muted">
                Policy: {earnedLeavePolicy.accrualDaysPerMonth} day(s) accrue each month, carry forward up to{' '}
                {earnedLeavePolicy.carryForwardCapDays} day(s), and{' '}
                {earnedLeavePolicy.retroactiveAllowed ? 'retroactive requests are allowed' : 'retroactive requests are blocked'}.
              </p>
            )}
          </div>
          {isHalfDay ? (
            <>
              <DatePicker
                label="Date"
                required
                value={form.from}
                onChange={(from) => setForm({ ...form, from, to: from })}
                holidays={sortedHolidays}
              />
              <div>
                <label className="block text-sm font-medium text-foreground">Half-day session</label>
                <select
                  value={form.halfDayPeriod}
                  onChange={(e) => setForm({ ...form, halfDayPeriod: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-4 py-2 text-sm"
                >
                  {Object.values(HALF_DAY_PERIODS).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker
                label="From"
                required
                value={form.from}
                onChange={(from) => setForm({ ...form, from })}
                holidays={sortedHolidays}
                max={form.to || undefined}
              />
              <DatePicker
                label="To"
                required
                value={form.to}
                onChange={(to) => setForm({ ...form, to })}
                holidays={sortedHolidays}
                min={form.from || undefined}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground">Reason</label>
            <textarea
              rows={3}
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2 text-sm"
              placeholder="Brief reason for leave"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setLeaveModalOpen(false)}
              className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Submit request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function SummaryChip({ type, icon: Icon, label, count, hint }) {
  const meta = getHolidayTypeMeta(type)
  return (
    <div className="min-w-[10rem] rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.chipClass}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            {hint ? (
              <p className="mt-0.5 text-xs text-muted">{hint}</p>
            ) : (
              <p className="mt-0.5 text-xs text-muted">Company holidays</p>
            )}
          </div>
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-bold tabular-nums text-foreground">
          {count}
        </span>
      </div>
    </div>
  )
}

function groupHolidaysByMonth(holidays) {
  const groups = []
  let currentKey = null
  for (const h of holidays) {
    const d = new Date(h.date + 'T12:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const monthLabel = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    if (key !== currentKey) {
      currentKey = key
      groups.push({ monthLabel, items: [] })
    }
    groups[groups.length - 1].items.push(h)
  }
  return groups
}

function HolidayListPanel({ holidays, isOptionalClaimed }) {
  const groups = useMemo(() => groupHolidaysByMonth(holidays), [holidays])

  if (holidays.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-neutral-50/60 py-10 text-center text-sm text-muted">
        No holidays in this category
      </p>
    )
  }

  return (
    <div className="holiday-list-scroll max-h-[min(26rem,60vh)] space-y-4 overflow-y-auto pr-1">
      {groups.map(({ monthLabel, items }) => (
        <section key={monthLabel} className="rounded-2xl border border-border bg-white shadow-sm">
          <div className="sticky top-0 z-10 rounded-t-2xl border-b border-border bg-neutral-50/95 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{monthLabel}</p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-muted shadow-sm">
                {items.length} {items.length === 1 ? 'holiday' : 'holidays'}
              </span>
            </div>
          </div>
          <ul className="divide-y divide-border/70">
            {items.map((h) => {
              const meta = getHolidayTypeMeta(h.type)
              const claimed = isOptionalHolidayType(h.type) && isOptionalClaimed(h.id)
              const d = new Date(h.date + 'T12:00:00')
              const dayNumber = d.toLocaleDateString('en-IN', { day: 'numeric' })
              const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' })
              const fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              return (
                <li
                  key={h.id}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-primary-light/15"
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-neutral-50">
                    <span className="text-lg font-bold leading-none text-foreground">{dayNumber}</span>
                    <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {dayLabel}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground" title={h.name}>
                      {h.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{fullDate}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.color}`}
                      title={meta.label}
                    >
                      {meta.shortLabel}
                    </span>
                    {claimed && (
                      <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                        Used
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function PolicyRow({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-muted">{text}</p>
      </div>
    </div>
  )
}
