import { useMemo, useState } from 'react'
import { CalendarDays, PartyPopper, Flag, Star, Info } from 'lucide-react'
import Card from '../../components/ui/Card'
import DatePicker from '../../components/ui/DatePicker'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import {
  calculateLeaveDays,
  formatDisplayDate,
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

const HOLIDAY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'national', label: 'National', icon: Flag },
  { id: 'festival', label: 'Festivals', icon: PartyPopper },
  { id: 'optional', label: 'Optional', icon: Star },
]

const TYPE_META = {
  national: { label: 'National holiday', badge: 'active', color: 'text-blue-700 bg-blue-50' },
  festival: { label: 'Festival', badge: 'approved', color: 'text-primary-darker bg-primary-light' },
  optional: { label: 'Optional holiday', badge: 'pending', color: 'text-amber-800 bg-amber-50' },
}

export default function EmployeeLeave() {
  const { user } = useAuth()
  const {
    leaveRequests,
    submitLeave,
    showToast,
    employeeStats,
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

  const isHalfDay = form.durationType === 'half'
  const [holidayFilter, setHolidayFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('calendar')

  const myLeaves = leaveRequests.filter((l) => l.employeeId === user?.employeeId)
  const balance = employeeStats?.leaveBalance ?? { casual: 0, sick: 0, earned: 0 }

  const myOptionalClaims = optionalHolidayClaims.filter(
    (c) => c.employeeId === user?.employeeId && c.year === (leavePolicy.year ?? 2026),
  )
  const optionalUsed = myOptionalClaims.filter((c) => c.status === 'availed').length
  const optionalLimit = leavePolicy.optionalHolidayLimit ?? 2
  const optionalRemaining = Math.max(0, optionalLimit - optionalUsed)

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

  const filteredHolidays = useMemo(() => {
    if (holidayFilter === 'all') return sortedHolidays
    return sortedHolidays.filter((h) => h.type === holidayFilter)
  }, [sortedHolidays, holidayFilter])

  const counts = useMemo(
    () => ({
      national: sortedHolidays.filter((h) => h.type === 'national').length,
      festival: sortedHolidays.filter((h) => h.type === 'festival').length,
      optional: sortedHolidays.filter((h) => h.type === 'optional').length,
    }),
    [sortedHolidays],
  )

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
      <div>
        <h1 className="page-title">Leave & Holidays</h1>
        <p className="page-subtitle">Balances, company holidays, optional offs, and leave applications</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <BalanceCard label="Casual Leave" value={balance.casual} />
        <BalanceCard label="Sick Leave" value={balance.sick} />
        <BalanceCard label="Earned Leave" value={balance.earned} />
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
            <SummaryChip icon={Flag} label="National" count={counts.national} />
            <SummaryChip icon={PartyPopper} label="Festivals" count={counts.festival} />
            <SummaryChip
              icon={Star}
              label="Optional"
              count={counts.optional}
              hint={`${optionalUsed}/${optionalLimit} used`}
            />
          </div>

          <Card
            title="Company holiday list"
            subtitle={`${leavePolicy.year ?? 2026} · ${filteredHolidays.length} shown · ${sortedHolidays.length} total`}
            className="overflow-hidden"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {HOLIDAY_FILTERS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setHolidayFilter(id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      holidayFilter === id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-neutral-100 text-muted hover:bg-neutral-200 hover:text-foreground'
                    }`}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {label}
                    {id !== 'all' && <span className="opacity-75">({counts[id] ?? 0})</span>}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-muted">Scroll list for all dates</span>
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
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'apply' && (
        <Card title="Apply for Leave">
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
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Submit request
            </button>
          </form>
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
    </div>
  )
}

function BalanceCard({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted">days left</p>
    </div>
  )
}

function SummaryChip({ icon: Icon, label, count, hint }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 shadow-sm">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="rounded-md bg-primary-light px-1.5 py-0.5 text-xs font-bold tabular-nums text-primary">
        {count}
      </span>
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
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
      <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted">
        No holidays in this category
      </p>
    )
  }

  return (
    <div className="max-h-[min(22rem,55vh)] overflow-hidden rounded-xl border border-border bg-neutral-50/80">
      <div className="grid grid-cols-[4.5rem_1fr_auto] gap-x-2 border-b border-border bg-white/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        <span>Date</span>
        <span>Holiday</span>
        <span className="text-right">Type</span>
      </div>
      <div className="holiday-list-scroll max-h-[min(20rem,50vh)] overflow-y-auto overscroll-contain">
        {groups.map(({ monthLabel, items }) => (
          <div key={monthLabel}>
            <div className="sticky top-0 z-10 border-b border-border bg-neutral-100/95 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{monthLabel}</p>
            </div>
            <ul className="divide-y divide-border/60 bg-white">
              {items.map((h) => {
                const meta = TYPE_META[h.type] ?? TYPE_META.national
                const claimed = h.type === 'optional' && isOptionalClaimed(h.id)
                const d = new Date(h.date + 'T12:00:00')
                const shortDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                return (
                  <li
                    key={h.id}
                    className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-2 px-3 py-2 text-sm transition hover:bg-primary-light/20"
                  >
                    <span className="text-xs font-medium tabular-nums text-muted">{shortDate}</span>
                    <span className="min-w-0 truncate font-medium text-foreground" title={h.name}>
                      {h.name}
                    </span>
                    <div className="flex shrink-0 items-center justify-end gap-1">
                      <span
                        className={`max-w-[5.5rem] truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${meta.color}`}
                        title={meta.label}
                      >
                        {h.type === 'national' ? 'National' : h.type === 'festival' ? 'Festival' : 'Optional'}
                      </span>
                      {claimed && (
                        <span className="rounded bg-primary px-1 py-0.5 text-[10px] font-semibold text-white">
                          ✓
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-border bg-white px-3 py-1.5 text-center text-[10px] text-muted">
        {holidays.length} {holidays.length === 1 ? 'holiday' : 'holidays'}
      </p>
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
