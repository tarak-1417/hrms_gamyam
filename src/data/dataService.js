import hrmsData from './hrmsData.json'
import platformData from './platformData.json'
import { syncOfficeLocationsFromBranches } from '../utils/organizationHelpers'
import { normalizeLeaveBalance } from '../utils/leaveBalance'
import { normalizePayrollRecord } from '../store/hrmsHelpers'

/** Deep clone JSON so in-app edits never mutate source files */
export function cloneJson(data) {
  return JSON.parse(JSON.stringify(data))
}

/** Initial HRMS state loaded from src/data/hrmsData.json */
export function getInitialHrmsState() {
  const state = cloneJson(hrmsData)
  if (state.branches?.length && state.attendancePolicy) {
    state.attendancePolicy.officeLocations = syncOfficeLocationsFromBranches(
      state.branches,
      state.attendancePolicy.radiusMeters,
    )
  }
  const defaultLeaveBalance = normalizeLeaveBalance(state.employeeStats?.leaveBalance)
  if (!state.leaveBalancesByEmployee) state.leaveBalancesByEmployee = {}
  ;(state.employees || []).forEach((employee) => {
    state.leaveBalancesByEmployee[employee.id] = normalizeLeaveBalance(
      state.leaveBalancesByEmployee[employee.id] || defaultLeaveBalance,
    )
  })
  if (Array.isArray(state.payrollRecords)) {
    state.payrollRecords = state.payrollRecords.map((record) => {
      const employee = state.employees?.find((item) => item.id === record.employeeId) || null
      return normalizePayrollRecord(record, employee)
    })
  }
  return state
}

/** Initial platform state (organizations, users, settings) */
export function getInitialPlatformState() {
  return cloneJson(platformData)
}

/** Demo login accounts (from platform data) */
export function getUsers() {
  return getInitialPlatformState().users
}

export function findUserByCredentials(email, password, usersList) {
  const list = usersList ?? getUsers()
  return (
    list.find(
      (u) =>
        u.email?.toLowerCase() === email?.toLowerCase() &&
        u.password === password &&
        !u.blocked,
    ) ?? null
  )
}

/** Strip password before storing in auth session */
export function toAuthUser(account) {
  if (!account) return null
  const { password, ...safe } = account
  return safe
}
