import { createSelector } from '@reduxjs/toolkit'
import { todayDate } from '../hrmsHelpers'
import { estimatePayroll } from '../hrmsHelpers'

const selectHrms = (state) => state.hrms

export const selectEmployees = createSelector(selectHrms, (hrms) => hrms.employees)
export const selectLeaveRequests = createSelector(selectHrms, (hrms) => hrms.leaveRequests)
export const selectTimeLogs = createSelector(selectHrms, (hrms) => hrms.timeLogs || [])

export const selectAdminStats = createSelector(selectHrms, (hrms) => {
  const total = hrms.employees.length
  const present = hrms.attendanceRecords.filter((a) => a.status === 'present').length
  const onLeave = hrms.attendanceRecords.filter((a) => a.status === 'on-leave').length
  const pendingLeaves = hrms.leaveRequests.filter((l) => l.status === 'pending').length
  return {
    totalEmployees: total,
    presentToday: present,
    onLeave,
    pendingLeaves,
    newHires: hrms.employees.filter((e) => e.joinDate >= '2026-01-01').length,
  }
})

export const selectManagerKpis = createSelector(selectHrms, (hrms) => {
  const team = hrms.employees.filter((e) => e.department === 'Engineering')
  const present = hrms.attendanceRecords.filter(
    (a) => team.some((t) => t.id === a.employeeId) && a.status === 'present',
  ).length
  return {
    teamSize: team.length,
    presentToday: present,
    pendingApprovals: hrms.leaveRequests.filter((l) => l.status === 'pending').length,
    openPositions: 3,
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
      hrms.payrollRecords.find((p) => p.employeeId === employeeId) ||
      estimatePayroll(employee)
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
