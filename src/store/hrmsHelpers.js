import { todayDate, nowTime, calcWorkHours, attendanceStatus } from '../utils/timeUtils'

export function timeAgo() {
  return 'Just now'
}

export function avatarFromName(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const DEPARTMENT_BASE_SALARY = {
  Engineering: 55000,
  'Human Resources': 50000,
  Sales: 48000,
  Marketing: 52000,
  Finance: 50000,
}

export const DEFAULT_PAYROLL_MONTH = 'April 2026'

export const PAYROLL_FORMULA_DEFAULTS = {
  basicRatio: 0.5,
  hraRatioOfBasic: 0.4,
  ltaRatioOfBasic: 0.0833,
  ltaBasicThreshold: 15000,
  bonusFixedMonthly: 2750,
  epfRate: 0.12,
  epfMonthlyCap: 1800,
  esiEmployeeRate: 0.0075,
  esiEmployerRate: 0.0325,
  esiGrossLimit: 21000,
  gratuityRate: 0.0481,
  professionalTaxLowerLimit: 15000,
  professionalTaxUpperLimit: 20000,
  professionalTaxLowerAmount: 150,
  professionalTaxUpperAmount: 200,
}

const DETAILED_PAYROLL_KEYS = [
  'annualCtc',
  'yearlyCtc',
  'monthlyCtc',
  'hra',
  'lta',
  'bonus',
  'specialAllowance',
  'grossSalary',
  'epfEmployee',
  'esiEmployee',
  'professionalTax',
  'healthInsurance',
  'tds',
  'otherDeductions',
  'employerEpf',
  'epfEmployer',
  'employerEsi',
  'esiEmployer',
  'gratuity',
]

function roundPayrollAmount(val) {
  const n = Number(val)
  return Number.isFinite(n) ? Math.round(n) : 0
}

export function parsePayrollNumber(val) {
  if (val == null || val === '') return null
  const n = Number(String(val).replace(/[,₹\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n) : null
}

function hasPayrollValue(record, key) {
  return record?.[key] != null && record[key] !== ''
}

function calculateProfessionalTax(grossSalary, formula = PAYROLL_FORMULA_DEFAULTS) {
  if (grossSalary == null || grossSalary <= 0) return 0
  if (grossSalary < formula.professionalTaxLowerLimit) return 0
  if (grossSalary <= formula.professionalTaxUpperLimit) {
    return formula.professionalTaxLowerAmount
  }
  return formula.professionalTaxUpperAmount
}

function estimateMonthlyGrossByProfile({ department, role, id }) {
  let base = DEPARTMENT_BASE_SALARY[department] ?? 45000
  if (id) {
    base = 40000 + id.charCodeAt(id.length - 1) * 1000
  }
  const roleText = String(role || '')
  if (/senior|lead|manager|head/i.test(roleText)) {
    base = Math.round(base * 1.2)
  } else if (/intern|trainee/i.test(roleText)) {
    base = Math.round(base * 0.55)
  }
  return Math.round(base * 1.18)
}

export function calculatePayrollBreakdown(payrollInput = {}) {
  const formula = PAYROLL_FORMULA_DEFAULTS
  const inputYearlyCtc =
    parsePayrollNumber(payrollInput.yearlyCtc) ?? parsePayrollNumber(payrollInput.annualCtc)
  const inputMonthlyCtc = parsePayrollNumber(payrollInput.monthlyCtc)

  const inputBasic = parsePayrollNumber(payrollInput.basic)
  const inputHra = parsePayrollNumber(payrollInput.hra)
  const inputLta = parsePayrollNumber(payrollInput.lta)
  const inputBonus = parsePayrollNumber(payrollInput.bonus)
  const inputSpecialAllowance = parsePayrollNumber(payrollInput.specialAllowance)

  let targetMonthlyCtc = inputMonthlyCtc
  if (targetMonthlyCtc == null && inputYearlyCtc != null) {
    targetMonthlyCtc = roundPayrollAmount(inputYearlyCtc / 12)
  }

  const basic = inputBasic ?? roundPayrollAmount((targetMonthlyCtc ?? 0) * formula.basicRatio)
  const hra = inputHra ?? roundPayrollAmount(basic * formula.hraRatioOfBasic)
  const lta =
    inputLta ??
    (basic > formula.ltaBasicThreshold
      ? roundPayrollAmount(basic * formula.ltaRatioOfBasic)
      : 0)
  const bonus = inputBonus ?? formula.bonusFixedMonthly

  const epfEmployee = roundPayrollAmount(Math.min(basic * formula.epfRate, formula.epfMonthlyCap))
  const epfEmployer = roundPayrollAmount(Math.min(basic * formula.epfRate, formula.epfMonthlyCap))
  const gratuity = roundPayrollAmount(basic * formula.gratuityRate)
  const fixedEarnings = basic + hra + lta + bonus

  let grossSalary
  let specialAllowance
  let esiEmployee = 0
  let esiEmployer = 0

  if (inputSpecialAllowance != null) {
    specialAllowance = inputSpecialAllowance
    grossSalary = fixedEarnings + specialAllowance
    if (grossSalary <= formula.esiGrossLimit) {
      esiEmployee = roundPayrollAmount(grossSalary * formula.esiEmployeeRate)
      esiEmployer = roundPayrollAmount(grossSalary * formula.esiEmployerRate)
    }
  } else if (targetMonthlyCtc != null) {
    const fixedCompanyCost = epfEmployer + gratuity
    const grossWithEsi = (targetMonthlyCtc - fixedCompanyCost) / (1 + formula.esiEmployerRate)
    const eligibleForEsi = grossWithEsi > 0 && grossWithEsi <= formula.esiGrossLimit

    if (eligibleForEsi) {
      grossSalary = roundPayrollAmount(grossWithEsi)
      esiEmployee = roundPayrollAmount(grossSalary * formula.esiEmployeeRate)
      esiEmployer = roundPayrollAmount(grossSalary * formula.esiEmployerRate)
    } else {
      grossSalary = roundPayrollAmount(targetMonthlyCtc - fixedCompanyCost)
    }

    specialAllowance = roundPayrollAmount(
      Math.max(0, grossSalary - fixedEarnings),
    )
    grossSalary = fixedEarnings + specialAllowance
  } else {
    specialAllowance = 0
    grossSalary = fixedEarnings
    if (grossSalary <= formula.esiGrossLimit) {
      esiEmployee = roundPayrollAmount(grossSalary * formula.esiEmployeeRate)
      esiEmployer = roundPayrollAmount(grossSalary * formula.esiEmployerRate)
    }
  }

  const monthlyCtc = roundPayrollAmount(grossSalary + epfEmployer + esiEmployer + gratuity)
  const yearlyCtc = inputYearlyCtc ?? monthlyCtc * 12

  const professionalTax =
    parsePayrollNumber(payrollInput.professionalTax) ?? calculateProfessionalTax(grossSalary, formula)
  const healthInsurance = parsePayrollNumber(payrollInput.healthInsurance) ?? 0
  const tds = parsePayrollNumber(payrollInput.tds) ?? 0
  const otherDeductions = parsePayrollNumber(payrollInput.otherDeductions) ?? 0
  const deductions = epfEmployee + esiEmployee + professionalTax + healthInsurance + tds + otherDeductions

  const employerContributions = epfEmployer + esiEmployer + gratuity
  const companyCostMonthly = grossSalary + employerContributions
  const companyCostAnnual = companyCostMonthly * 12

  return {
    month: payrollInput?.month || DEFAULT_PAYROLL_MONTH,
    yearlyCtc,
    monthlyCtc,
    annualCtc: yearlyCtc,
    basic,
    hra,
    lta,
    bonus,
    specialAllowance,
    grossSalary,
    allowances: grossSalary - basic,
    epfEmployee,
    esiEmployee,
    professionalTax,
    healthInsurance,
    tds,
    otherDeductions,
    deductions,
    employerEpf: epfEmployer,
    epfEmployer,
    employerEsi: esiEmployer,
    esiEmployer,
    gratuity,
    employerContributions,
    companyCostMonthly,
    companyCostAnnual,
    net: grossSalary - deductions,
    formulaVersion: 'v2',
  }
}

function normalizeLegacyPayrollRecord(record = {}) {
  const basic = parsePayrollNumber(record.basic) ?? 0
  const allowances = parsePayrollNumber(record.allowances) ?? 0
  const grossSalary = parsePayrollNumber(record.grossSalary) ?? basic + allowances
  const deductions = parsePayrollNumber(record.deductions) ?? 0
  const net = parsePayrollNumber(record.net) ?? grossSalary - deductions

  return {
    ...record,
    month: record.month || DEFAULT_PAYROLL_MONTH,
    yearlyCtc: parsePayrollNumber(record.yearlyCtc) ?? grossSalary * 12,
    monthlyCtc: parsePayrollNumber(record.monthlyCtc) ?? grossSalary,
    annualCtc: parsePayrollNumber(record.annualCtc) ?? grossSalary * 12,
    basic,
    hra: parsePayrollNumber(record.hra) ?? 0,
    lta: parsePayrollNumber(record.lta) ?? 0,
    bonus: parsePayrollNumber(record.bonus) ?? 0,
    specialAllowance: parsePayrollNumber(record.specialAllowance) ?? allowances,
    grossSalary,
    allowances,
    epfEmployee: parsePayrollNumber(record.epfEmployee) ?? 0,
    esiEmployee: parsePayrollNumber(record.esiEmployee) ?? 0,
    professionalTax: parsePayrollNumber(record.professionalTax) ?? 0,
    healthInsurance: parsePayrollNumber(record.healthInsurance) ?? 0,
    tds: parsePayrollNumber(record.tds) ?? 0,
    otherDeductions: parsePayrollNumber(record.otherDeductions) ?? deductions,
    deductions,
    employerEpf:
      parsePayrollNumber(record.employerEpf) ?? parsePayrollNumber(record.epfEmployer) ?? 0,
    epfEmployer:
      parsePayrollNumber(record.epfEmployer) ?? parsePayrollNumber(record.employerEpf) ?? 0,
    employerEsi:
      parsePayrollNumber(record.employerEsi) ?? parsePayrollNumber(record.esiEmployer) ?? 0,
    esiEmployer:
      parsePayrollNumber(record.esiEmployer) ?? parsePayrollNumber(record.employerEsi) ?? 0,
    gratuity: parsePayrollNumber(record.gratuity) ?? 0,
    employerContributions:
      parsePayrollNumber(record.employerContributions) ??
      (parsePayrollNumber(record.employerEpf) ?? parsePayrollNumber(record.epfEmployer) ?? 0) +
        (parsePayrollNumber(record.employerEsi) ?? parsePayrollNumber(record.esiEmployer) ?? 0) +
        (parsePayrollNumber(record.gratuity) ?? 0),
    companyCostMonthly:
      parsePayrollNumber(record.companyCostMonthly) ??
      grossSalary +
        (parsePayrollNumber(record.employerContributions) ??
          (parsePayrollNumber(record.employerEpf) ?? parsePayrollNumber(record.epfEmployer) ?? 0) +
            (parsePayrollNumber(record.employerEsi) ?? parsePayrollNumber(record.esiEmployer) ?? 0) +
            (parsePayrollNumber(record.gratuity) ?? 0)),
    companyCostAnnual:
      parsePayrollNumber(record.companyCostAnnual) ??
      (parsePayrollNumber(record.companyCostMonthly) ??
        grossSalary +
          (parsePayrollNumber(record.employerContributions) ??
            (parsePayrollNumber(record.employerEpf) ?? parsePayrollNumber(record.epfEmployer) ?? 0) +
              (parsePayrollNumber(record.employerEsi) ?? parsePayrollNumber(record.esiEmployer) ?? 0) +
              (parsePayrollNumber(record.gratuity) ?? 0))) *
        12,
    net,
    formulaVersion: record.formulaVersion || 'legacy',
  }
}

export function normalizePayrollRecord(record, employee = null) {
  if (!record) {
    return employee ? estimatePayroll(employee) : null
  }

  const fallbackId = `${record.employeeId ?? employee?.id ?? 'payroll'}-${record.month || DEFAULT_PAYROLL_MONTH}`
  const hasDetailedFields = DETAILED_PAYROLL_KEYS.some((key) => hasPayrollValue(record, key))
  const isLegacySummaryShape =
    !hasDetailedFields &&
    (hasPayrollValue(record, 'allowances') ||
      hasPayrollValue(record, 'deductions') ||
      hasPayrollValue(record, 'net'))

  if (isLegacySummaryShape) {
    return {
      ...normalizeLegacyPayrollRecord(record),
      employeeId: record.employeeId ?? employee?.id ?? null,
      id: record.id ?? fallbackId,
    }
  }

  return {
    ...record,
    ...calculatePayrollBreakdown(record),
    employeeId: record.employeeId ?? employee?.id ?? null,
    id: record.id ?? fallbackId,
  }
}

/** Estimate monthly pay from department/role (used before employee ID exists). */
export function estimatePayrollByProfile({ department, role, id }) {
  const monthlyCtc = estimateMonthlyGrossByProfile({ department, role, id })
  return calculatePayrollBreakdown({
    month: DEFAULT_PAYROLL_MONTH,
    monthlyCtc,
  })
}

export function estimatePayroll(employee) {
  return normalizePayrollRecord(
    {
      employeeId: employee.id,
      ...estimatePayrollByProfile({
        department: employee.department,
        role: employee.role,
        id: employee.id,
      }),
    },
    employee,
  )
}

function hasDetailedPayrollInput(payrollInput) {
  return DETAILED_PAYROLL_KEYS.some((key) => parsePayrollNumber(payrollInput?.[key]) != null)
}

function hasLegacyPayrollInput(payrollInput) {
  return (
    parsePayrollNumber(payrollInput?.allowances) != null ||
    parsePayrollNumber(payrollInput?.deductions) != null ||
    parsePayrollNumber(payrollInput?.net) != null
  )
}

/**
 * Use payroll form fields when provided; otherwise auto-estimate from employee profile.
 * Supports both legacy summary inputs and detailed salary-breakup inputs.
 */
export function resolvePayroll(employee, payrollInput) {
  const basic = parsePayrollNumber(payrollInput?.basic)
  const hasManual = basic != null || hasDetailedPayrollInput(payrollInput) || hasLegacyPayrollInput(payrollInput)

  if (!hasManual) {
    return estimatePayrollByProfile({
      department: employee.department,
      role: employee.role,
      id: employee.id,
    })
  }

  if (hasLegacyPayrollInput(payrollInput) && !hasDetailedPayrollInput(payrollInput)) {
    return normalizeLegacyPayrollRecord({
      month: payrollInput?.month || DEFAULT_PAYROLL_MONTH,
      basic: basic ?? estimatePayrollByProfile(employee).basic,
      allowances: parsePayrollNumber(payrollInput?.allowances) ?? 0,
      deductions: parsePayrollNumber(payrollInput?.deductions) ?? 0,
      net: parsePayrollNumber(payrollInput?.net),
    })
  }

  return calculatePayrollBreakdown({
    ...payrollInput,
    month: payrollInput?.month || DEFAULT_PAYROLL_MONTH,
    basic: basic ?? payrollInput?.basic,
  })
}

export function getOrCreateTodayLog(employeeId, logs) {
  const date = todayDate()
  const existing = logs.find((t) => t.employeeId === employeeId && t.date === date)
  if (existing) return { logs, log: existing }
  const log = {
    id: Date.now(),
    employeeId,
    date,
    portalLogin: null,
    portalLogout: null,
    checkIn: null,
    checkOut: null,
    workHours: '—',
    status: 'present',
    daySummary: null,
    tasksCompleted: [],
  }
  return { logs: [...logs, log], log }
}

export function syncAttendanceRecord(employeeId, log, employees) {
  const emp = employees.find((e) => e.id === employeeId)
  if (!emp) return null
  return {
    id: Date.now(),
    employeeId,
    date: log.date,
    checkIn: log.checkIn || '-',
    checkOut: log.checkOut || '-',
    status: log.status,
    employeeName: emp.name,
  }
}

export { todayDate, nowTime, calcWorkHours, attendanceStatus }
