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

function parsePayrollNumber(val) {
  if (val == null || val === '') return null
  const n = Number(String(val).replace(/[,₹\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n) : null
}

/** Estimate monthly pay from department/role (used before employee ID exists). */
export function estimatePayrollByProfile({ department, role, id }) {
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
  const allowances = Math.round(base * 0.18)
  const deductions = Math.round(base * 0.12)
  return {
    month: 'April 2026',
    basic: base,
    allowances,
    deductions,
    net: base + allowances - deductions,
  }
}

export function estimatePayroll(employee) {
  return {
    employeeId: employee.id,
    ...estimatePayrollByProfile({
      department: employee.department,
      role: employee.role,
      id: employee.id,
    }),
  }
}

/**
 * Use payroll form fields when provided; otherwise auto-estimate from employee profile.
 * payrollInput: { basic?, allowances?, deductions?, net? } (strings or numbers)
 */
export function resolvePayroll(employee, payrollInput) {
  const basic = parsePayrollNumber(payrollInput?.basic)
  const hasManual =
    basic != null ||
    parsePayrollNumber(payrollInput?.allowances) != null ||
    parsePayrollNumber(payrollInput?.deductions) != null ||
    parsePayrollNumber(payrollInput?.net) != null

  if (!hasManual) {
    return estimatePayrollByProfile({
      department: employee.department,
      role: employee.role,
      id: employee.id,
    })
  }

  const base = basic ?? estimatePayrollByProfile(employee).basic
  const allowances =
    parsePayrollNumber(payrollInput?.allowances) ?? Math.round(base * 0.18)
  const deductions =
    parsePayrollNumber(payrollInput?.deductions) ?? Math.round(base * 0.12)
  const net =
    parsePayrollNumber(payrollInput?.net) ?? base + allowances - deductions

  return {
    month: payrollInput?.month || 'April 2026',
    basic: base,
    allowances,
    deductions,
    net,
  }
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
