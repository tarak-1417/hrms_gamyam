import { createSelector } from '@reduxjs/toolkit'
import { todayDate } from '../hrmsHelpers'
import { estimatePayroll, normalizePayrollRecord } from '../hrmsHelpers'
import { getDirectReports } from '../../utils/organizationHelpers'

const selectHrms = (state) => state.hrms
const selectAuthUser = (state) => state.auth?.user

export const selectEmployees = createSelector(selectHrms, (hrms) => hrms.employees)
export const selectLeaveRequests = createSelector(selectHrms, (hrms) => hrms.leaveRequests)
export const selectTimeLogs = createSelector(selectHrms, (hrms) => hrms.timeLogs || [])

export const selectAdminStats = createSelector(selectHrms, (hrms) => {
  const total = hrms.employees.length
  const present = hrms.attendanceRecords.filter((a) => a.status === 'present').length
  const onLeave = hrms.attendanceRecords.filter((a) => a.status === 'on-leave').length
  const pendingLeaves = hrms.leaveRequests.filter((l) => l.status === 'pending').length
  const pendingReimbursements = (hrms.reimbursementRequests || []).filter((r) => r.status === 'pending').length
  const monthlyPayrollTotal = (hrms.payrollRecords || []).reduce((sum, record) => {
    const employee = hrms.employees.find((e) => e.id === record.employeeId)
    const payroll = normalizePayrollRecord(record, employee)
    const net = payroll?.net ?? (Number(record.net) || 0)
    return sum + net
  }, 0)

  return {
    totalEmployees: total,
    presentToday: present,
    onLeave,
    pendingLeaves,
    pendingReimbursements,
    pendingApprovals: pendingLeaves + pendingReimbursements,
    openRoles: (hrms.jobPostings || []).filter((j) => j.status === 'active').length,
    monthlyPayrollTotal,
    newHires: hrms.employees.filter((e) => e.joinDate >= '2026-01-01').length,
  }
})

export const selectManagerKpis = createSelector([selectHrms, selectAuthUser], (hrms, user) => {
  const managerId = user?.employeeId || null
  const team = managerId ? getDirectReports(hrms.employees, managerId) : []
  const teamIds = new Set(team.map((e) => e.id))

  const present = (hrms.attendanceRecords || []).filter(
    (a) => teamIds.has(a.employeeId) && a.status === 'present',
  ).length

  const pendingLeaves = hrms.leaveRequests.filter(
    (l) => l.status === 'pending' && teamIds.has(l.employeeId),
  ).length
  const pendingReimbursements = (hrms.reimbursementRequests || []).filter(
    (r) => r.status === 'pending' && teamIds.has(r.employeeId),
  ).length

  return {
    teamSize: team.length,
    presentToday: present,
    pendingApprovals: pendingLeaves + pendingReimbursements,
    openPositions: (hrms.jobPostings || []).filter((j) => j.status === 'active').length,
    avgAttendance: team.length ? Math.round((present / team.length) * 100) : 0,
  }
})

export const selectDepartmentChartData = createSelector(selectEmployees, (employees) => {
  const counts = {}
  employees.forEach((e) => {
    counts[e.department] = (counts[e.department] || 0) + 1
  })
  const colors = ['#f58220', '#d96d12', '#f5a623', '#ffb366', '#b85a0e', '#e07310']
  return Object.entries(counts).map(([name, count], i) => ({
    name,
    count,
    fill: colors[i % colors.length],
  }))
})

export const selectLeaveChartData = createSelector(selectLeaveRequests, (leaveRequests) => {
  const counts = {}
  leaveRequests.forEach((l) => {
    const key = l.type.replace(' Leave', '')
    counts[key] = (counts[key] || 0) + l.days
  })
  const colors = ['#f58220', '#d96d12', '#f5a623', '#e0e0e0']
  return Object.entries(counts).map(([name, value], i) => ({
    name,
    value,
    fill: colors[i % colors.length],
  }))
})

export const makeSelectEmployeeById = (id) =>
  createSelector(selectEmployees, (employees) => employees.find((e) => e.id === id))

export const makeSelectEmployeeDetails = (employeeId) =>
  createSelector(selectHrms, (hrms) => {
    const employee = hrms.employees.find((e) => e.id === employeeId)
    if (!employee) return null
    const date = todayDate()
    const payroll =
      normalizePayrollRecord(
        hrms.payrollRecords.find((p) => p.employeeId === employeeId),
        employee,
      ) || estimatePayroll(employee)
    return {
      employee,
      payroll,
      leaves: hrms.leaveRequests.filter((l) => l.employeeId === employeeId),
      timeLogs: (hrms.timeLogs || [])
        .filter((t) => t.employeeId === employeeId)
        .sort((a, b) => b.date.localeCompare(a.date)),
      todayAttendance: hrms.attendanceRecords.find(
        (a) => a.employeeId === employeeId && a.date === date,
      ),
      todayLog: (hrms.timeLogs || []).find(
        (t) => t.employeeId === employeeId && t.date === date,
      ),
    }
  })

export const makeSelectTodayTimeLog = (employeeId) =>
  createSelector(selectTimeLogs, (timeLogs) => {
    const date = todayDate()
    return timeLogs.find((t) => t.employeeId === employeeId && t.date === date)
  })

export const makeSelectTimeLogsForEmployee = (employeeId) =>
  createSelector(selectTimeLogs, (timeLogs) =>
    timeLogs
      .filter((t) => t.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date)),
  )

export function filterEmployeesList(employees, query, department, role) {
  let list = employees
  if (department && department !== 'all') {
    list = list.filter((e) => e.department === department)
  }
  if (role && role !== 'all') {
    list = list.filter((e) => e.role === role)
  }
  if (!query?.trim()) return list
  const q = query.toLowerCase()
  return list.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q),
  )
}
