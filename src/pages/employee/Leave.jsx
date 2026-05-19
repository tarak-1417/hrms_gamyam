import { useMemo, useState } from 'react'
import { CalendarDays, PartyPopper, Flag, Star, Info } from 'lucide-react'
import Card from '../../components/ui/Card'
import DatePicker from '../../components/ui/DatePicker'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import {
  formatDisplayDate,
  formatLeaveDateRange,
  formatLeaveDuration,
  HALF_DAY_PERIODS,
} from '../../utils/timeUtils'

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
          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryTile
              icon={Flag}
              title="National holidays"
              count={counts.national}
              desc="Fixed public holidays"
            />
            <SummaryTile
              icon={PartyPopper}
              title="Festivals"
              count={counts.festival}
              desc="Regional & cultural offs"
            />
            <SummaryTile
              icon={Star}
              title="Optional holidays"
              count={counts.optional}
              desc={`${optionalUsed} / ${optionalLimit} availed in ${leavePolicy.year ?? 2026}`}
            />
          </div>

          <Card
            title="Company holiday list"
            subtitle={`${leavePolicy.year ?? 2026} · ${sortedHolidays.length} holidays on record`}
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {HOLIDAY_FILTERS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setHolidayFilter(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    holidayFilter === id
                      ? 'bg-primary text-white'
                      : 'border border-border bg-white text-muted hover:border-primary hover:text-primary'
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {label}
                  {id !== 'all' && (
                    <span className="opacity-80">({counts[id] ?? sortedHolidays.length})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredHolidays.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No holidays in this category</p>
              ) : (
                filteredHolidays.map((h) => {
                  const meta = TYPE_META[h.type] ?? TYPE_META.national
                  const claimed = h.type === 'optional' && isOptionalClaimed(h.id)
                  return (
                    <div
                      key={h.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-white text-center shadow-sm ring-1 ring-border">
                          <span className="text-[10px] font-medium uppercase text-muted">
                            {new Date(h.date + 'T12:00:00').toLocaleDateString('en-IN', { month: 'short' })}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {new Date(h.date + 'T12:00:00').getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{h.name}</p>
                          <p className="text-xs text-muted">{formatDisplayDate(h.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                        {claimed && (
                          <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark">
                            Availed
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
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
                <option>Casual Leave</option>
                <option>Sick Leave</option>
                <option>Earned Leave</option>
                <option>Optional Holiday</option>
              </select>
              {form.type === 'Optional Holiday' && (
                <p className="mt-2 text-xs text-muted">
                  Remaining optional holidays: {Math.max(0, optionalLimit - optionalUsed)} of {optionalLimit}
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

function SummaryTile({ icon: Icon, title, count, desc }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{count}</p>
      <p className="mt-1 text-xs text-muted">{desc}</p>
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
