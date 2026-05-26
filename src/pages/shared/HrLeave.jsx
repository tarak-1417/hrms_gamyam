import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import DatePicker from '../../components/ui/DatePicker'
import { useHrms } from '../../hooks/useHrms'
import { useAuth } from '../../hooks/useAuth'
import { usePlatform } from '../../hooks/usePlatform'
import { HALF_DAY_PERIODS, formatLeaveDateRange, formatLeaveDuration } from '../../utils/timeUtils'
import {
  CORE_HOLIDAY_TYPES,
  countHolidaysByType,
  formatHolidayTypeSummary,
  getHolidayTypeMeta,
  isCoreHolidayType,
  normalizeHolidayType,
  listHolidayTypes,
} from '../../utils/holidayTypes'

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Optional Holiday']
const HOLIDAY_TYPES = CORE_HOLIDAY_TYPES

const HOLIDAY_LIBRARY = [
  { id: 1, date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { id: 2, date: '2026-03-14', name: 'Holi', type: 'festival' },
  { id: 3, date: '2026-03-31', name: 'Ugadi', type: 'festival' },
  { id: 4, date: '2026-04-06', name: 'Ram Navami', type: 'festival' },
  { id: 5, date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', type: 'national' },
  { id: 6, date: '2026-05-01', name: 'May Day', type: 'national' },
  { id: 7, date: '2026-06-07', name: 'Eid-ul-Adha', type: 'festival' },
  { id: 8, date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { id: 9, date: '2026-08-26', name: 'Janmashtami', type: 'festival' },
  { id: 10, date: '2026-09-05', name: 'Milad-un-Nabi', type: 'festival' },
  { id: 11, date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { id: 12, date: '2026-10-20', name: 'Dussehra', type: 'festival' },
  { id: 13, date: '2026-11-08', name: 'Diwali', type: 'festival' },
  { id: 14, date: '2026-11-09', name: 'Diwali (Day 2)', type: 'festival' },
  { id: 15, date: '2026-11-27', name: 'Guru Nanak Jayanti', type: 'festival' },
  { id: 16, date: '2026-12-25', name: 'Christmas', type: 'national' },
  { id: 17, date: '2026-01-01', name: "New Year's Day", type: 'optional' },
  { id: 18, date: '2026-04-01', name: 'Bank Holiday', type: 'optional' },
  { id: 19, date: '2026-07-06', name: 'Muharram', type: 'optional' },
  { id: 20, date: '2026-12-31', name: 'Year-end Optional Off', type: 'optional' },
]

const PLAN_PRESETS = {
  Starter: {
    leaveBalance: { casual: 6, sick: 4, earned: 8 },
    leavePolicy: {
      planName: 'Starter',
      optionalHolidayLimit: 1,
      optionalHolidayNote: 'Starter plan employees can avail 1 optional holiday per year.',
      restrictedHolidayNote: 'National holidays are company-wide offs. Festival holidays follow the starter plan calendar.',
    },
    holidayIds: [1, 3, 5, 6, 8, 11, 13, 16, 17],
  },
  Professional: {
    leaveBalance: { casual: 8, sick: 6, earned: 12 },
    leavePolicy: {
      planName: 'Professional',
      optionalHolidayLimit: 2,
      optionalHolidayNote: 'Professional plan employees can avail up to 2 optional holidays per year.',
      restrictedHolidayNote: 'National and major festival holidays are company-wide offs.',
    },
    holidayIds: [1, 2, 3, 5, 6, 8, 9, 11, 12, 13, 16, 17, 18],
  },
  Enterprise: {
    leaveBalance: { casual: 12, sick: 8, earned: 15 },
    leavePolicy: {
      planName: 'Enterprise',
      optionalHolidayLimit: 4,
      optionalHolidayNote: 'Enterprise plan employees can avail up to 4 optional holidays per year.',
      restrictedHolidayNote: 'National and festival holidays are company-wide offs. Optional holidays are available by policy.',
    },
    holidayIds: HOLIDAY_LIBRARY.map((holiday) => holiday.id),
  },
}

function emptyHoliday() {
  return { id: null, name: '', date: '', type: 'festival' }
}

function sortHolidays(list = []) {
  return [...list].sort((a, b) => a.date.localeCompare(b.date))
}

function buildPlanHolidays(planName) {
  const preset = PLAN_PRESETS[planName]
  if (!preset) return []
  return HOLIDAY_LIBRARY.filter((holiday) => preset.holidayIds.includes(holiday.id))
}

function formatHolidayDate(iso) {
  if (!iso) return 'Select a date'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatHolidayDateTile(iso) {
  if (!iso) {
    return { day: '--', month: 'Date', year: '----' }
  }
  const date = new Date(`${iso}T12:00:00`)
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    year: String(date.getFullYear()),
  }
}

export default function HrLeave() {
  const {
    leaveRequests,
    holidays = [],
    leavePolicy = {},
    employeeStats = {},
    updateLeaveStatus,
    updateLeaveRequest,
    saveLeaveConfiguration,
    upsertHoliday,
    deleteHoliday,
  } = useHrms()
  const { user } = useAuth()
  const { organizations } = usePlatform()

  const canManage = ['admin', 'superadmin'].includes(user?.role)
  const pendingCount = leaveRequests.filter((leave) => leave.status === 'pending').length
  const companyPlan =
    organizations?.find((org) => org.id === user?.organizationId)?.plan ||
    leavePolicy.planName ||
    'Professional'

  const [activeTab, setActiveTab] = useState('requests')
  const [editLeaveId, setEditLeaveId] = useState(null)
  const [leaveForm, setLeaveForm] = useState({
    type: 'Casual Leave',
    durationType: 'full',
    halfDayPeriod: 'first_half',
    from: '',
    to: '',
    reason: '',
    status: 'pending',
  })
  const [policyForm, setPolicyForm] = useState({
    planName: companyPlan,
    casual: 0,
    sick: 0,
    earned: 0,
    optionalHolidayLimit: 0,
    optionalHolidayNote: '',
    restrictedHolidayNote: '',
  })
  const [holidayModalOpen, setHolidayModalOpen] = useState(false)
  const [holidayForm, setHolidayForm] = useState(emptyHoliday())

  const sortedHolidays = useMemo(() => sortHolidays(holidays), [holidays])
  const holidayCounts = useMemo(() => countHolidaysByType(sortedHolidays), [sortedHolidays])
  const holidayTypes = useMemo(() => listHolidayTypes(sortedHolidays), [sortedHolidays])
  const holidaySummary = useMemo(() => formatHolidayTypeSummary(sortedHolidays), [sortedHolidays])
  const isCustomHolidayType = !isCoreHolidayType(holidayForm.type)

  useEffect(() => {
    setPolicyForm({
      planName: leavePolicy.planName || companyPlan,
      casual: employeeStats?.leaveBalance?.casual ?? 0,
      sick: employeeStats?.leaveBalance?.sick ?? 0,
      earned: employeeStats?.leaveBalance?.earned ?? 0,
      optionalHolidayLimit: leavePolicy.optionalHolidayLimit ?? 0,
      optionalHolidayNote: leavePolicy.optionalHolidayNote || '',
      restrictedHolidayNote: leavePolicy.restrictedHolidayNote || '',
    })
  }, [leavePolicy, employeeStats, companyPlan])

  const openEditLeave = (leave) => {
    setEditLeaveId(leave.id)
    setLeaveForm({
      type: leave.type,
      durationType: leave.durationType || 'full',
      halfDayPeriod: leave.halfDayPeriod || 'first_half',
      from: leave.from,
      to: leave.to,
      reason: leave.reason || '',
      status: leave.status || 'pending',
    })
  }

  const handleLeaveSave = (e) => {
    e.preventDefault()
    updateLeaveRequest(editLeaveId, {
      type: leaveForm.type,
      durationType: leaveForm.durationType,
      halfDayPeriod: leaveForm.durationType === 'half' ? leaveForm.halfDayPeriod : undefined,
      from: leaveForm.from,
      to: leaveForm.durationType === 'half' ? leaveForm.from : leaveForm.to,
      reason: leaveForm.reason,
      status: leaveForm.status,
    })
    setEditLeaveId(null)
  }

  const handlePolicySave = (e) => {
    e.preventDefault()
    saveLeaveConfiguration({
      leavePolicy: {
        planName: policyForm.planName,
        optionalHolidayLimit: Number(policyForm.optionalHolidayLimit),
        optionalHolidayNote: policyForm.optionalHolidayNote,
        restrictedHolidayNote: policyForm.restrictedHolidayNote,
      },
      leaveBalance: {
        casual: Number(policyForm.casual),
        sick: Number(policyForm.sick),
        earned: Number(policyForm.earned),
      },
    })
  }

  const applyPlanDefaults = (planName) => {
    const preset = PLAN_PRESETS[planName]
    if (!preset) return
    setPolicyForm({
      planName,
      casual: preset.leaveBalance.casual,
      sick: preset.leaveBalance.sick,
      earned: preset.leaveBalance.earned,
      optionalHolidayLimit: preset.leavePolicy.optionalHolidayLimit,
      optionalHolidayNote: preset.leavePolicy.optionalHolidayNote,
      restrictedHolidayNote: preset.leavePolicy.restrictedHolidayNote,
    })
    saveLeaveConfiguration({
      leavePolicy: preset.leavePolicy,
      leaveBalance: preset.leaveBalance,
      holidays: buildPlanHolidays(planName),
    })
  }

  const openHolidayModal = (holiday = null) => {
    setHolidayForm(
      holiday
        ? { id: holiday.id, name: holiday.name, date: holiday.date, type: holiday.type }
        : emptyHoliday(),
    )
    setHolidayModalOpen(true)
  }

  const handleHolidaySave = (e) => {
    e.preventDefault()
    upsertHoliday({
      id: holidayForm.id || undefined,
      name: holidayForm.name.trim(),
      date: holidayForm.date,
      type: normalizeHolidayType(holidayForm.type) || 'festival',
    })
    setHolidayModalOpen(false)
  }

  const tabs = canManage
    ? [
        { id: 'requests', label: 'Leave requests' },
        { id: 'policy', label: 'Leave policy' },
        { id: 'holidays', label: 'Holiday calendar' },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Leave Approval</h1>
        <p className="mt-1 text-muted">
          {canManage
            ? 'Review requests, correct leave dates, and manage company leave policy'
            : 'Review and approve team leave requests'}
        </p>
      </div>

      {canManage && (
        <div className="flex flex-wrap gap-2 border-b border-border pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-neutral-100 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {(!canManage || activeTab === 'requests') && (
        <Card
          title="All Leave Requests"
          subtitle={`${leaveRequests.length} requests · ${pendingCount} pending review`}
        >
          <div className="space-y-4">
            {leaveRequests.length === 0 ? (
              <p className="text-sm text-muted">No leave requests</p>
            ) : (
              leaveRequests.map((leave) => (
                <div
                  key={leave.id}
                  className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{leave.employeeName}</p>
                    <p className="mt-1 text-sm text-muted">
                      {leave.type} · {formatLeaveDateRange(leave)} · {formatLeaveDuration(leave)}
                    </p>
                    {leave.reason && <p className="mt-2 text-sm text-muted">{leave.reason}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Badge status={leave.status} />
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openEditLeave(leave)}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                    {leave.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateLeaveStatus(leave.id, 'approved', user?.name)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLeaveStatus(leave.id, 'rejected', user?.name)}
                          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {canManage && activeTab === 'policy' && (
        <Card
          title="Company Leave Policy"
          subtitle={`Current company plan: ${companyPlan}`}
          action={
            PLAN_PRESETS[companyPlan] ? (
              <button
                type="button"
                onClick={() => applyPlanDefaults(companyPlan)}
                className="rounded-lg border border-primary/30 bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
              >
                Apply {companyPlan} defaults
              </button>
            ) : null
          }
        >
          <form onSubmit={handlePolicySave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Leave plan</label>
                <select
                  value={policyForm.planName}
                  onChange={(e) => setPolicyForm({ ...policyForm, planName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  {Object.keys(PLAN_PRESETS).map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Casual leave</label>
                <input
                  type="number"
                  min="0"
                  value={policyForm.casual}
                  onChange={(e) => setPolicyForm({ ...policyForm, casual: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Sick leave</label>
                <input
                  type="number"
                  min="0"
                  value={policyForm.sick}
                  onChange={(e) => setPolicyForm({ ...policyForm, sick: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Earned leave</label>
                <input
                  type="number"
                  min="0"
                  value={policyForm.earned}
                  onChange={(e) => setPolicyForm({ ...policyForm, earned: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Optional holiday limit</label>
              <input
                type="number"
                min="0"
                value={policyForm.optionalHolidayLimit}
                onChange={(e) => setPolicyForm({ ...policyForm, optionalHolidayLimit: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm sm:max-w-xs"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Optional holiday note</label>
                <textarea
                  rows={4}
                  value={policyForm.optionalHolidayNote}
                  onChange={(e) => setPolicyForm({ ...policyForm, optionalHolidayNote: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Restricted holiday note</label>
                <textarea
                  rows={4}
                  value={policyForm.restrictedHolidayNote}
                  onChange={(e) => setPolicyForm({ ...policyForm, restrictedHolidayNote: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <Save className="h-4 w-4" />
              Save leave policy
            </button>
          </form>
        </Card>
      )}

      {canManage && activeTab === 'holidays' && (
        <Card
          title="Company Holiday Calendar"
          subtitle={`${sortedHolidays.length} holidays${holidaySummary ? ` · ${holidaySummary}` : ''}`}
          action={
            <div className="flex flex-wrap gap-2">
              {PLAN_PRESETS[companyPlan] && (
                <button
                  type="button"
                  onClick={() => applyPlanDefaults(companyPlan)}
                  className="rounded-lg border border-primary/30 bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
                >
                  Sync {companyPlan} holidays
                </button>
              )}
              <button
                type="button"
                onClick={() => openHolidayModal()}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
              >
                <Plus className="h-3.5 w-3.5" />
                Add holiday
              </button>
            </div>
          }
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            {holidayTypes.map((type) => {
              const meta = getHolidayTypeMeta(type)
              return (
                <div key={type} className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{meta.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-2xl font-bold text-foreground">{holidayCounts[type] ?? 0}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.chipClass}`}>
                      {meta.shortLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-3">
            {sortedHolidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-primary/20 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-neutral-950 text-white">
                    <span className="text-lg font-bold leading-none">{formatHolidayDateTile(holiday.date).day}</span>
                    <span className="mt-1 text-[10px] font-semibold tracking-wide text-white/70">
                      {formatHolidayDateTile(holiday.date).month}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{holiday.name}</p>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          getHolidayTypeMeta(holiday.type).chipClass
                        }`}
                      >
                        {getHolidayTypeMeta(holiday.type).label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {formatHolidayDate(holiday.date)} · {formatHolidayDateTile(holiday.date).year}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => openHolidayModal(holiday)}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteHoliday(holiday.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(editLeaveId)}
        onClose={() => setEditLeaveId(null)}
        title="Edit leave request"
        subtitle="HR can correct dates, leave type, reason, and status before final approval."
        wide
      >
        <form onSubmit={handleLeaveSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Leave type</label>
              <select
                value={leaveForm.type}
                onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Status</label>
              <select
                value={leaveForm.status}
                onChange={(e) => setLeaveForm({ ...leaveForm, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Duration</label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLeaveForm({ ...leaveForm, durationType: 'full' })}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  leaveForm.durationType === 'full'
                    ? 'bg-primary text-white'
                    : 'border border-border hover:bg-neutral-50'
                }`}
              >
                Full day
              </button>
              <button
                type="button"
                onClick={() =>
                  setLeaveForm({
                    ...leaveForm,
                    durationType: 'half',
                    to: leaveForm.from,
                  })
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  leaveForm.durationType === 'half'
                    ? 'bg-primary text-white'
                    : 'border border-border hover:bg-neutral-50'
                }`}
              >
                Half day
              </button>
            </div>
          </div>

          {leaveForm.durationType === 'half' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <DatePicker
                label="Date"
                required
                value={leaveForm.from}
                onChange={(from) => setLeaveForm({ ...leaveForm, from, to: from })}
                holidays={sortedHolidays}
              />
              <div>
                <label className="block text-sm font-medium text-foreground">Half-day session</label>
                <select
                  value={leaveForm.halfDayPeriod}
                  onChange={(e) => setLeaveForm({ ...leaveForm, halfDayPeriod: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  {Object.values(HALF_DAY_PERIODS).map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <DatePicker
                label="From"
                required
                value={leaveForm.from}
                onChange={(from) => setLeaveForm({ ...leaveForm, from })}
                holidays={sortedHolidays}
                max={leaveForm.to || undefined}
              />
              <DatePicker
                label="To"
                required
                value={leaveForm.to}
                onChange={(to) => setLeaveForm({ ...leaveForm, to })}
                holidays={sortedHolidays}
                min={leaveForm.from || undefined}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground">Reason</label>
            <textarea
              rows={3}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </form>
      </Modal>

      <Modal
        open={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title={holidayForm.id ? 'Edit holiday' : 'Add holiday'}
        subtitle="Create company-wide, optional, or custom holidays for employee, manager, and HR leave calendars."
        wide
      >
        <form onSubmit={handleHolidaySave} className="space-y-5">
          <div className="rounded-xl border border-primary/10 bg-primary-light/30 px-4 py-3 text-sm text-muted">
            Save holidays here to keep the company leave calendar up to date for all users.
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <label className="block text-sm font-medium text-foreground">Holiday name</label>
              <input
                required
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                placeholder="e.g. Founders Day"
                className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <DatePicker
              label="Date"
              required
              value={holidayForm.date}
              onChange={(date) => setHolidayForm({ ...holidayForm, date })}
              holidays={sortedHolidays}
              placeholder="Select holiday date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Holiday type</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {HOLIDAY_TYPES.map((type) => {
                const isActive = holidayForm.type === type
                const meta = getHolidayTypeMeta(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setHolidayForm({ ...holidayForm, type })}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? `${meta.chipClass} shadow-sm ring-1 ring-current/10`
                        : 'border-border bg-white hover:border-primary/25 hover:bg-primary-light/20'
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{meta.shortLabel}</p>
                    <p className="mt-1 text-xs text-muted">{meta.label}</p>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() =>
                  setHolidayForm((current) => ({
                    ...current,
                    type: isCoreHolidayType(current.type) ? '' : current.type,
                  }))
                }
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  isCustomHolidayType
                    ? `${getHolidayTypeMeta(holidayForm.type).chipClass} shadow-sm ring-1 ring-current/10`
                    : 'border-border bg-white hover:border-primary/25 hover:bg-primary-light/20'
                }`}
              >
                <p className="text-sm font-semibold text-foreground">Custom</p>
                <p className="mt-1 text-xs text-muted">Add another holiday type for this company.</p>
              </button>
            </div>
            {isCustomHolidayType && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground">Custom type name</label>
                <input
                  required
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                  placeholder="e.g. Company Event"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {holidayForm.name.trim() || 'Holiday name'}
                </p>
                <p className="mt-1 text-xs text-muted">{formatHolidayDate(holidayForm.date)}</p>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  getHolidayTypeMeta(holidayForm.type).chipClass
                }`}
              >
                {getHolidayTypeMeta(holidayForm.type).label}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setHolidayModalOpen(false)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <Save className="h-4 w-4" />
              {holidayForm.id ? 'Update holiday' : 'Add holiday'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
