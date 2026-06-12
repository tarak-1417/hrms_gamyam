import { useMemo, useState } from 'react'
import { CalendarDays, Send } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { buildEmployeeLeaveSummary, getLeaveRequestValidation } from '../../utils/leaveBalance'
import { calculateLeaveDays, HALF_DAY_PERIODS } from '../../utils/timeUtils'

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
  if (isOptional) return `${remaining} of ${optionalLimit} left`
  const n = Number(remaining)
  if (n === 0) return '0 days left'
  if (n === 0.5) return '0.5 day left'
  return `${n} ${n === 1 ? 'day' : 'days'} left`
}

const fieldClass =
  'mt-1 w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

/**
 * Compact leave-application form rendered INLINE inside the AI chat. Uses the
 * same balance + policy validation as the Leave page so a chat-driven request
 * is held to the same rules, then submits via useHrms().submitLeave().
 */
export default function AiLeaveFormCard({ prefill = {}, onSubmitted, onCancel }) {
  const { user } = useAuth()
  const {
    employees = [],
    leaveRequests,
    submitLeave,
    showToast,
    employeeStats,
    leaveBalancesByEmployee = {},
    leavePolicy = {},
    optionalHolidayClaims = [],
  } = useHrms()

  const currentEmployee = useMemo(
    () => employees.find((e) => e.id === user?.employeeId) ?? null,
    [employees, user?.employeeId],
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
  const optionalLimit = leaveSummary.optionalLimit
  const optionalRemaining = leaveSummary.optionalRemaining

  const leaveTypeOptions = useMemo(
    () =>
      LEAVE_TYPE_OPTIONS.map((opt) => {
        const remaining = opt.isOptional ? optionalRemaining : (balance[opt.balanceKey] ?? 0)
        return {
          ...opt,
          remaining,
          label: `${opt.value} · ${formatBalanceLabel(remaining, opt.isOptional, optionalLimit)}`,
          disabled: remaining <= 0,
        }
      }),
    [balance, optionalRemaining, optionalLimit],
  )

  const validPrefillType = LEAVE_TYPE_OPTIONS.some((o) => o.value === prefill.type)
    ? prefill.type
    : 'Casual Leave'

  const [form, setForm] = useState({
    type: validPrefillType,
    durationType: prefill.durationType === 'half' ? 'half' : 'full',
    halfDayPeriod: prefill.halfDayPeriod || 'first_half',
    from: prefill.from || '',
    to: prefill.to || prefill.from || '',
    reason: prefill.reason || '',
  })
  const [submitting, setSubmitting] = useState(false)

  const isHalfDay = form.durationType === 'half'
  const selectedRemaining = leaveTypeOptions.find((o) => o.value === form.type)?.remaining ?? 0

  const setDurationType = (durationType) =>
    setForm((prev) => ({ ...prev, durationType, to: durationType === 'half' ? prev.from : prev.to }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (submitting) return
    const from = form.from
    const to = isHalfDay ? form.from : form.to

    if (!from || (!isHalfDay && !to)) {
      showToast('Please choose the leave dates')
      return
    }
    if (!form.reason.trim()) {
      showToast('Please add a brief reason')
      return
    }

    const daysRequested = calculateLeaveDays({ from, to, durationType: form.durationType })
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
      { type: form.type, from, to, days: daysRequested },
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

    const payload = {
      type: form.type,
      from,
      to,
      reason: form.reason,
      durationType: form.durationType,
      halfDayPeriod: isHalfDay ? form.halfDayPeriod : undefined,
      employeeId: user.employeeId,
      employeeName: user.name,
    }
    setSubmitting(true)
    submitLeave(payload)
    onSubmitted?.({ ...payload, days: daysRequested })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-border bg-white p-3 text-xs shadow-sm ring-1 ring-border"
    >
      <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
        <CalendarDays className="h-3.5 w-3.5 text-primary" />
        Apply for leave
      </div>

      <label className="block font-medium text-muted">Leave type</label>
      <select
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
        className={fieldClass}
      >
        {leaveTypeOptions.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {selectedRemaining <= 0 && (
        <p className="mt-1 text-[11px] text-amber-700">No balance left for this type</p>
      )}

      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => setDurationType('full')}
          className={`flex-1 rounded-lg px-2 py-1.5 font-medium transition ${
            !isHalfDay ? 'bg-primary text-white' : 'border border-border bg-white text-muted'
          }`}
        >
          Full day
        </button>
        <button
          type="button"
          onClick={() => setDurationType('half')}
          className={`flex-1 rounded-lg px-2 py-1.5 font-medium transition ${
            isHalfDay ? 'bg-primary text-white' : 'border border-border bg-white text-muted'
          }`}
        >
          Half day
        </button>
      </div>

      {isHalfDay ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium text-muted">Date</label>
            <input
              type="date"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value, to: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block font-medium text-muted">Session</label>
            <select
              value={form.halfDayPeriod}
              onChange={(e) => setForm({ ...form, halfDayPeriod: e.target.value })}
              className={fieldClass}
            >
              {Object.values(HALF_DAY_PERIODS).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium text-muted">From</label>
            <input
              type="date"
              value={form.from}
              max={form.to || undefined}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block font-medium text-muted">To</label>
            <input
              type="date"
              value={form.to}
              min={form.from || undefined}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
      )}

      <label className="mt-2 block font-medium text-muted">Reason</label>
      <textarea
        rows={2}
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
        placeholder="Brief reason for leave"
        className={fieldClass}
      />

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Submitting…' : 'Submit request'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border bg-white px-3 py-2 font-semibold text-muted transition hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
