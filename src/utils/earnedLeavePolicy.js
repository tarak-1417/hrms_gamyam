import { todayDate } from './timeUtils'

export const DEFAULT_EARNED_LEAVE_POLICY = Object.freeze({
  isPaid: true,
  isLimited: true,
  retroactiveAllowed: true,
  balanceExpiry: '',
  accrualDaysPerMonth: 0.5,
  proratedInitialBalance: false,
  proratedNextAccrual: true,
  carryForwardText: 'The entire balance will be carried over but not more than 30 days',
  carryForwardCapDays: 30,
  maxBalanceCapEnabled: true,
  maxBalanceCapDays: 30,
  negativeBalanceAllowed: false,
  sandwichEnabled: false,
  maxUsagePerPeriodEnabled: false,
  maxUsagePerPeriodDays: 0,
})

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function roundLeave(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function parseIsoDate(iso) {
  if (!iso) return null
  const date = new Date(`${iso}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function getMonthStart(year, monthIndex) {
  return new Date(year, monthIndex, 1, 12, 0, 0, 0)
}

function getMonthEnd(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0, 12, 0, 0, 0)
}

function getPolicyYear(leavePolicy = {}, fallbackDate = todayDate()) {
  const parsed = parseIsoDate(fallbackDate)
  return Number(leavePolicy?.year ?? parsed?.getFullYear?.() ?? new Date().getFullYear())
}

export function getPolicyEvaluationDate(targetDate, leavePolicy = {}) {
  const policyYear = getPolicyYear(leavePolicy, targetDate)
  const parsed = parseIsoDate(targetDate || todayDate()) || parseIsoDate(todayDate())
  if (parsed.getFullYear() < policyYear) return `${policyYear}-01-01`
  if (parsed.getFullYear() > policyYear) return `${policyYear}-12-31`
  return parsed.toISOString().slice(0, 10)
}

export function getEarnedLeavePolicy(leavePolicy = {}) {
  const policy = leavePolicy?.earnedLeavePolicy || {}
  return {
    ...DEFAULT_EARNED_LEAVE_POLICY,
    ...policy,
    accrualDaysPerMonth: toNumber(policy.accrualDaysPerMonth, DEFAULT_EARNED_LEAVE_POLICY.accrualDaysPerMonth),
    carryForwardCapDays: toNumber(policy.carryForwardCapDays, DEFAULT_EARNED_LEAVE_POLICY.carryForwardCapDays),
    maxBalanceCapDays: toNumber(policy.maxBalanceCapDays, DEFAULT_EARNED_LEAVE_POLICY.maxBalanceCapDays),
    maxUsagePerPeriodDays: toNumber(policy.maxUsagePerPeriodDays, DEFAULT_EARNED_LEAVE_POLICY.maxUsagePerPeriodDays),
  }
}

export function getEffectiveEarnedBalance(balance, leavePolicy = {}) {
  const policy = getEarnedLeavePolicy(leavePolicy)
  const value = toNumber(balance, 0)
  if (!policy.maxBalanceCapEnabled || policy.maxBalanceCapDays <= 0) return value
  return Math.min(value, policy.maxBalanceCapDays)
}

export function buildEarnedLeaveAccrualSummary({
  employee = null,
  openingBalance = 0,
  leavePolicy = {},
  asOfDate = todayDate(),
}) {
  const policy = getEarnedLeavePolicy(leavePolicy)
  const policyYear = getPolicyYear(leavePolicy, asOfDate)
  const evaluationIso = getPolicyEvaluationDate(asOfDate, leavePolicy)
  const evaluationDate = parseIsoDate(evaluationIso)
  const joinDate = parseIsoDate(employee?.joinDate)
  const yearStart = parseIsoDate(`${policyYear}-01-01`)
  const monthlyAccrual = toNumber(policy.accrualDaysPerMonth, 0)

  if (!evaluationDate || !employee) {
    const effectiveBalance = getEffectiveEarnedBalance(openingBalance, leavePolicy)
    return {
      policy,
      policyYear,
      asOfDate: evaluationIso,
      openingBalance: roundLeave(openingBalance),
      carryForwardBalance: roundLeave(openingBalance),
      accruedBalance: 0,
      totalBeforeUsage: roundLeave(openingBalance),
      effectiveBalance: roundLeave(effectiveBalance),
      expiryReached: false,
    }
  }

  const expiryDate = parseIsoDate(policy.balanceExpiry)
  if (expiryDate && evaluationDate > expiryDate) {
    return {
      policy,
      policyYear,
      asOfDate: evaluationIso,
      openingBalance: 0,
      carryForwardBalance: 0,
      accruedBalance: 0,
      totalBeforeUsage: 0,
      effectiveBalance: 0,
      expiryReached: true,
    }
  }

  let opening = toNumber(openingBalance, 0)
  if (joinDate && joinDate.getFullYear() === policyYear) {
    if (policy.proratedInitialBalance) {
      const monthEnd = getMonthEnd(policyYear, joinDate.getMonth())
      const remainingDays = monthEnd.getDate() - joinDate.getDate() + 1
      opening = monthlyAccrual * (remainingDays / monthEnd.getDate())
    } else {
      opening = 0
    }
  } else if (joinDate && joinDate.getFullYear() < policyYear) {
    opening =
      policy.carryForwardCapDays > 0
        ? Math.min(opening, policy.carryForwardCapDays)
        : opening
  } else if (joinDate && joinDate.getFullYear() > policyYear) {
    opening = 0
  }

  let accrued = 0
  const accrualStartDate =
    joinDate && joinDate > yearStart ? joinDate : yearStart

  for (let month = 0; month < 12; month += 1) {
    const monthStart = getMonthStart(policyYear, month)
    const monthEnd = getMonthEnd(policyYear, month)
    if (monthEnd > evaluationDate) break
    if (monthEnd < accrualStartDate) continue

    let factor = 1
    if (
      joinDate &&
      joinDate.getFullYear() === policyYear &&
      joinDate.getMonth() === month &&
      joinDate > monthStart
    ) {
      if (policy.proratedNextAccrual) {
        factor = (monthEnd.getDate() - joinDate.getDate() + 1) / monthEnd.getDate()
      } else {
        factor = 0
      }
    }

    accrued += monthlyAccrual * factor
  }

  const totalBeforeUsage = roundLeave(opening + accrued)
  const effectiveBalance = roundLeave(getEffectiveEarnedBalance(totalBeforeUsage, leavePolicy))
  return {
    policy,
    policyYear,
    asOfDate: evaluationIso,
    openingBalance: roundLeave(opening),
    carryForwardBalance: roundLeave(opening),
    accruedBalance: roundLeave(accrued),
    totalBeforeUsage,
    effectiveBalance,
    expiryReached: false,
  }
}

export function getEarnedLeavePolicyFacts(leavePolicy = {}) {
  const policy = getEarnedLeavePolicy(leavePolicy)
  return [
    { label: 'Paid or unpaid', value: policy.isPaid ? 'Paid' : 'Unpaid' },
    { label: 'Limited or unlimited', value: policy.isLimited ? 'Limited Leaves' : 'Unlimited Leaves' },
    { label: 'Retroactive requests', value: policy.retroactiveAllowed ? 'Yes' : 'No' },
    { label: 'Balance expiry', value: policy.balanceExpiry || '-' },
    { label: 'Accrual', value: `${policy.accrualDaysPerMonth} days every month` },
    { label: 'Prorated initial balance', value: policy.proratedInitialBalance ? 'Yes' : 'No' },
    { label: 'Prorated next accrual', value: policy.proratedNextAccrual ? 'Yes' : 'No' },
    { label: 'Carry forward rule', value: policy.carryForwardText || '-' },
    {
      label: 'Maximum balance cap',
      value: policy.maxBalanceCapEnabled ? `${policy.maxBalanceCapDays} days` : 'No cap',
    },
    { label: 'Negative balance allowed', value: policy.negativeBalanceAllowed ? 'Yes' : 'No' },
    { label: 'Sandwich leave enabled', value: policy.sandwichEnabled ? 'Yes' : 'No' },
    {
      label: 'Max usage per period',
      value:
        policy.maxUsagePerPeriodEnabled && policy.maxUsagePerPeriodDays > 0
          ? `${policy.maxUsagePerPeriodDays} days`
          : 'No',
    },
  ]
}

export function validateLeaveAgainstPolicy({
  leaveType,
  from,
  daysRequested,
  availableBeforeApproval = 0,
  leavePolicy = {},
}) {
  if (leaveType !== 'Earned Leave') {
    return { policy: null, reasons: [] }
  }

  const policy = getEarnedLeavePolicy(leavePolicy)
  const reasons = []
  const today = todayDate()

  if (!policy.retroactiveAllowed && from && from < today) {
    reasons.push('Retroactive earned leave is not allowed by policy.')
  }

  if (policy.balanceExpiry && from && from > policy.balanceExpiry) {
    reasons.push(`Earned leave balance expires on ${policy.balanceExpiry}.`)
  }

  if (
    policy.maxUsagePerPeriodEnabled &&
    policy.maxUsagePerPeriodDays > 0 &&
    Number(daysRequested) > policy.maxUsagePerPeriodDays
  ) {
    reasons.push(`Earned leave is limited to ${policy.maxUsagePerPeriodDays} day(s) per request.`)
  }

  if (
    policy.isLimited &&
    !policy.negativeBalanceAllowed &&
    Number(daysRequested) > Number(availableBeforeApproval)
  ) {
    if (Number(availableBeforeApproval) <= 0) {
      reasons.push('No earned leave balance is available.')
    } else {
      reasons.push(`Only ${availableBeforeApproval} earned leave day(s) are available.`)
    }
  }

  return { policy, reasons }
}
