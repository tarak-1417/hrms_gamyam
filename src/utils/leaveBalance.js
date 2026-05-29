import {
  buildEarnedLeaveAccrualSummary,
  getEffectiveEarnedBalance,
  validateLeaveAgainstPolicy,
} from './earnedLeavePolicy'

export const EMPTY_LEAVE_BALANCE = Object.freeze({
  casual: 0,
  sick: 0,
  earned: 0,
})

export const LEAVE_TYPE_TO_KEY = Object.freeze({
  'Casual Leave': 'casual',
  'Sick Leave': 'sick',
  'Earned Leave': 'earned',
  'Optional Holiday': 'optional',
})

export function normalizeLeaveBalance(balance = {}) {
  return {
    casual: Number(balance.casual ?? 0),
    sick: Number(balance.sick ?? 0),
    earned: Number(balance.earned ?? 0),
  }
}

export function getLeaveTypeKey(type) {
  return LEAVE_TYPE_TO_KEY[type] ?? null
}

/** Metrics for dashboard / leave balance cards (remaining, pool, consumed). */
export function buildLeaveBalanceCardItems(leaveSummary) {
  if (!leaveSummary) return []

  const { allocation, approved, pending, remaining, earnedAccrual } = leaveSummary

  const buildDayCard = (key, shortLabel) => {
    const approvedDays = Math.max(0, Number(approved[key] ?? 0))
    const pendingDays = Math.max(0, Number(pending[key] ?? 0))
    const rem = Math.max(0, Number(remaining[key] ?? 0))
    const used = approvedDays + pendingDays

    let total =
      key === 'earned'
        ? Math.round(earnedAccrual?.effectiveBalance ?? allocation.earned ?? 0)
        : Math.max(0, Number(allocation[key] ?? 0))

    total = Math.max(total, rem + used)

    return {
      key,
      shortLabel,
      remaining: rem,
      total,
      used,
      unit: 'days',
    }
  }

  const cards = [
    buildDayCard('casual', 'CASUAL'),
    buildDayCard('sick', 'SICK'),
    buildDayCard('earned', 'EARNED'),
  ]

  const optionalLimit = Math.max(0, Number(leaveSummary.optionalLimit ?? 0))
  if (optionalLimit > 0) {
    const optionalRemaining = Math.max(0, Number(leaveSummary.optionalRemaining ?? 0))
    const optionalUsed = Math.max(0, optionalLimit - optionalRemaining)

    cards.push({
      key: 'optional',
      shortLabel: 'OPTIONAL',
      remaining: optionalRemaining,
      total: optionalLimit,
      used: optionalUsed,
      unit: 'holidays',
    })
  }

  return cards
}

export function getEmployeeLeaveAllocation({
  employeeId,
  leaveBalancesByEmployee = {},
  fallbackBalance = EMPTY_LEAVE_BALANCE,
}) {
  const stored = employeeId ? leaveBalancesByEmployee?.[employeeId] : null
  return normalizeLeaveBalance(stored || fallbackBalance)
}

export function buildEmployeeLeaveSummary({
  employee = null,
  employeeId,
  leaveRequests = [],
  leaveBalancesByEmployee = {},
  fallbackBalance = EMPTY_LEAVE_BALANCE,
  optionalHolidayClaims = [],
  leavePolicy = {},
  excludeLeaveId = null,
  asOfDate,
}) {
  const allocation = getEmployeeLeaveAllocation({
    employeeId,
    leaveBalancesByEmployee,
    fallbackBalance,
  })
  const earnedAccrual = buildEarnedLeaveAccrualSummary({
    employee,
    openingBalance: allocation.earned,
    leavePolicy,
    asOfDate,
  })

  const approved = { ...EMPTY_LEAVE_BALANCE }
  const pending = { ...EMPTY_LEAVE_BALANCE }
  let approvedOptional = 0
  let pendingOptional = 0

  leaveRequests.forEach((leave) => {
    if (!leave || leave.employeeId !== employeeId || leave.id === excludeLeaveId) return
    if (leave.status === 'rejected') return

    const key = getLeaveTypeKey(leave.type)
    if (!key) return

    const days = Number(leave.days ?? 0)
    if (key === 'optional') {
      if (leave.status === 'approved') approvedOptional += days
      if (leave.status === 'pending') pendingOptional += days
      return
    }

    if (leave.status === 'approved') approved[key] += days
    if (leave.status === 'pending') pending[key] += days
  })

  const remaining = {
    casual: Math.max(0, allocation.casual - approved.casual - pending.casual),
    sick: Math.max(0, allocation.sick - approved.sick - pending.sick),
    earned: getEffectiveEarnedBalance(
      Math.max(0, earnedAccrual.effectiveBalance - approved.earned - pending.earned),
      leavePolicy,
    ),
  }

  const optionalLimit = Number(leavePolicy.optionalHolidayLimit ?? 0)
  const claimedOptional = optionalHolidayClaims.filter(
    (claim) => claim.employeeId === employeeId && claim.status === 'availed',
  ).length
  const optionalUsed = Math.max(claimedOptional, approvedOptional)
  const optionalRemaining = Math.max(0, optionalLimit - optionalUsed - pendingOptional)

  return {
    allocation,
    approved,
    pending,
    remaining,
    earnedAccrual,
    optionalLimit,
    optionalUsed,
    optionalPending: pendingOptional,
    optionalRemaining,
  }
}

export function getLeaveRequestValidation(request, summary, leavePolicy = {}) {
  if (!request || !summary) {
    return {
      isValid: false,
      availableBeforeApproval: 0,
      balanceAfterApproval: 0,
      balanceKey: null,
      reasons: [],
      policy: null,
    }
  }

  const balanceKey = getLeaveTypeKey(request.type)
  const requestedDays = Number(request.days ?? 0)

  if (balanceKey === 'optional') {
    const availableBeforeApproval = summary.optionalRemaining
    const balanceAfterApproval = availableBeforeApproval - requestedDays
    return {
      isValid: balanceAfterApproval >= 0,
      availableBeforeApproval,
      balanceAfterApproval,
      balanceKey,
      reasons:
        balanceAfterApproval >= 0
          ? []
          : [availableBeforeApproval <= 0 ? 'No optional holiday balance is available.' : `Only ${availableBeforeApproval} optional holiday(s) are available.`],
      policy: null,
    }
  }

  const availableBeforeApproval = summary.remaining[balanceKey] ?? 0
  const balanceAfterApproval = availableBeforeApproval - requestedDays
  const policyValidation = validateLeaveAgainstPolicy({
    leaveType: request.type,
    from: request.from,
    daysRequested: requestedDays,
    availableBeforeApproval,
    leavePolicy,
  })
  const balanceReasons =
    balanceAfterApproval >= 0 || request.type === 'Earned Leave'
      ? []
      : [availableBeforeApproval <= 0 ? `No ${request.type.toLowerCase()} balance is available.` : `Only ${availableBeforeApproval} ${balanceKey} day(s) are available.`]
  const reasons = [...policyValidation.reasons, ...balanceReasons]

  return {
    isValid: reasons.length === 0,
    availableBeforeApproval,
    balanceAfterApproval,
    balanceKey,
    reasons,
    policy: policyValidation.policy,
  }
}
