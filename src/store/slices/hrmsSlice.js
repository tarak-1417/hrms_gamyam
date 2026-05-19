import { createSlice } from '@reduxjs/toolkit'
import { getInitialHrmsState } from '../../data/dataService'
import {
  avatarFromName,
  getOrCreateTodayLog,
  syncAttendanceRecord,
  timeAgo,
  todayDate,
  nowTime,
  calcWorkHours,
  attendanceStatus,
  resolvePayroll,
} from '../hrmsHelpers'
import { calculateLeaveDays } from '../../utils/timeUtils'

function prependActivity(state, type, user, action) {
  state.activityFeed = [
    { id: Date.now(), type, user, action, time: timeAgo() },
    ...state.activityFeed.slice(0, 9),
  ]
}

const hrmsSlice = createSlice({
  name: 'hrms',
  initialState: getInitialHrmsState(),
  reducers: {
    resetHrms(state) {
      return getInitialHrmsState()
    },
    addActivity(state, action) {
      const { type, user, action: activityAction } = action.payload
      prependActivity(state, type, user, activityAction)
    },
    updateLeaveStatus(state, action) {
      const { id, status, actorName } = action.payload
      const leave = state.leaveRequests.find((l) => l.id === id)
      if (leave) {
        prependActivity(state, 'leave', actorName, `${status} ${leave.employeeName}'s ${leave.type}`)
      }
      state.leaveRequests = state.leaveRequests.map((l) =>
        l.id === id ? { ...l, status } : l,
      )
    },
    submitLeave(state, action) {
      const {
        type,
        from,
        to,
        reason,
        employeeId,
        employeeName,
        durationType = 'full',
        halfDayPeriod = 'first_half',
      } = action.payload

      const isHalfDay = durationType === 'half'
      const leaveFrom = from
      const leaveTo = isHalfDay ? from : to
      const days = calculateLeaveDays({
        from: leaveFrom,
        to: leaveTo,
        durationType,
      })

      const id = state.nextId
      state.nextId += 1
      state.leaveRequests.push({
        id,
        employeeId,
        employeeName,
        type,
        from: leaveFrom,
        to: leaveTo,
        days,
        durationType: isHalfDay ? 'half' : 'full',
        ...(isHalfDay ? { halfDayPeriod } : {}),
        status: 'pending',
        reason,
      })

      const durationNote = isHalfDay
        ? `half day (${halfDayPeriod === 'second_half' ? 'afternoon' : 'morning'})`
        : `${days} day(s)`
      prependActivity(state, 'leave', employeeName, `requested ${durationNote} ${type}`)
    },
    addEmployee(state, action) {
      const form = action.payload
      const id = `EMP${String(state.nextId).padStart(3, '0')}`
      state.nextId += 1
      const employee = {
        id,
        name: form.name,
        email: form.email,
        department: form.department,
        role: form.role,
        status: form.status || 'active',
        joinDate: form.joinDate || todayDate(),
        phone: form.phone || '—',
        address: form.address || '',
        legacyEmployeeId: form.legacyEmployeeId || '',
        avatar: avatarFromName(form.name),
      }
      state.employees.push(employee)

      const payroll = resolvePayroll(employee, form.payrollInput ?? form.payroll)
      const payrollId = state.nextId
      state.nextId += 1
      if (!state.payrollRecords) state.payrollRecords = []
      state.payrollRecords.push({
        id: payrollId,
        employeeId: id,
        month: payroll.month,
        basic: payroll.basic,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        net: payroll.net,
      })

      prependActivity(state, 'hire', form.name, `joined ${form.department}`)
    },
    bulkImportEmployees(state, action) {
      const rows = action.payload
      if (!Array.isArray(rows) || !rows.length) return

      const importedEmployees = []
      const importedPayroll = []

      rows.forEach((form) => {
        const id = `EMP${String(state.nextId).padStart(3, '0')}`
        state.nextId += 1
        const employee = {
          id,
          name: form.name,
          email: form.email,
          department: form.department || 'Engineering',
          role: form.role,
          status: form.status || 'active',
          joinDate: form.joinDate || todayDate(),
          phone: form.phone || '—',
          address: form.address || '',
          legacyEmployeeId: form.legacyEmployeeId || '',
          avatar: avatarFromName(form.name),
        }
        importedEmployees.push(employee)

        const payroll = resolvePayroll(
          employee,
          form.payroll
            ? {
                basic: form.payroll.basic,
                allowances: form.payroll.allowances,
                deductions: form.payroll.deductions,
                net: form.payroll.net,
              }
            : null,
        )
        const payrollId = state.nextId
        state.nextId += 1
        importedPayroll.push({
          id: payrollId,
          employeeId: id,
          month: payroll.month,
          basic: payroll.basic,
          allowances: payroll.allowances,
          deductions: payroll.deductions,
          net: payroll.net,
        })
      })

      state.employees = [...importedEmployees, ...state.employees]
      if (!state.payrollRecords) state.payrollRecords = []
      state.payrollRecords = [...importedPayroll, ...state.payrollRecords]

      prependActivity(
        state,
        'hire',
        'HR Team',
        `bulk imported ${importedEmployees.length} employee(s) from spreadsheet`,
      )
    },
    patchEmployee(state, action) {
      const { employeeId, updates } = action.payload
      state.employees = state.employees.map((e) => {
        if (e.id !== employeeId) return e
        const name = updates.name ?? e.name
        return { ...e, ...updates, avatar: avatarFromName(name) }
      })
    },
    updateEmployeePayroll(state, action) {
      const { employeeId, payrollInput } = action.payload
      const employee = state.employees.find((e) => e.id === employeeId)
      if (!employee) return

      const payroll = resolvePayroll(employee, payrollInput)
      if (!state.payrollRecords) state.payrollRecords = []

      const existing = state.payrollRecords.find((p) => p.employeeId === employeeId)
      if (existing) {
        state.payrollRecords = state.payrollRecords.map((p) =>
          p.employeeId === employeeId
            ? {
                ...p,
                month: payroll.month,
                basic: payroll.basic,
                allowances: payroll.allowances,
                deductions: payroll.deductions,
                net: payroll.net,
              }
            : p,
        )
      } else {
        const payrollId = state.nextId
        state.nextId += 1
        state.payrollRecords.push({
          id: payrollId,
          employeeId,
          month: payroll.month,
          basic: payroll.basic,
          allowances: payroll.allowances,
          deductions: payroll.deductions,
          net: payroll.net,
        })
      }
    },
    toggleEmployeeTask(state, action) {
      const id = action.payload
      state.employeeTasks = state.employeeTasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      )
    },
    recordPortalLogin(state, action) {
      const employeeId = action.payload
      const logs = state.timeLogs || []
      const { logs: nextLogs, log } = getOrCreateTodayLog(employeeId, logs)
      if (log.portalLogin) return
      const updated = { ...log, portalLogin: nowTime() }
      state.timeLogs = nextLogs.map((t) => (t.id === log.id ? updated : t))
    },
    recordPortalLogout(state, action) {
      const employeeId = action.payload
      const date = todayDate()
      const log = (state.timeLogs || []).find(
        (t) => t.employeeId === employeeId && t.date === date,
      )
      if (!log) return
      const updated = { ...log, portalLogout: nowTime() }
      state.timeLogs = state.timeLogs.map((t) => (t.id === log.id ? updated : t))
    },
    recordCheckIn(state, action) {
      const payload =
        typeof action.payload === 'string'
          ? { employeeId: action.payload, geo: null }
          : action.payload
      const { employeeId, geo } = payload
      const logs = state.timeLogs || []
      const { logs: nextLogs, log } = getOrCreateTodayLog(employeeId, logs)
      if (log.checkIn) return
      const checkIn = nowTime()
      const checkInAt = new Date().toISOString()
      const status = attendanceStatus(checkIn)
      const updated = {
        ...log,
        checkIn,
        checkInAt,
        status,
        ...(geo
          ? {
              checkInLatitude: geo.latitude,
              checkInLongitude: geo.longitude,
              checkInAccuracy: geo.accuracy,
              checkInOfficeId: geo.officeId,
              checkInOfficeName: geo.officeName,
              checkInDistanceM: geo.distanceMeters,
            }
          : {}),
      }
      state.timeLogs = nextLogs.map((t) => (t.id === log.id ? updated : t))
      const att = syncAttendanceRecord(employeeId, updated, state.employees)
      state.attendanceRecords = state.attendanceRecords.filter(
        (a) => !(a.employeeId === employeeId && a.date === log.date),
      )
      if (att) state.attendanceRecords.push(att)
    },
    recordCheckOut(state, action) {
      const { employeeId, daySummary = '', tasksCompleted = [] } = action.payload
      const date = todayDate()
      const log = (state.timeLogs || []).find(
        (t) => t.employeeId === employeeId && t.date === date,
      )
      if (!log || !log.checkIn || log.checkOut) return
      const checkOut = nowTime()
      const checkOutAt = new Date().toISOString()
      const workHours = calcWorkHours(log.checkIn, checkOut)
      const updated = {
        ...log,
        checkOut,
        checkOutAt,
        workHours,
        daySummary: daySummary || log.daySummary,
        tasksCompleted: tasksCompleted.length ? tasksCompleted : log.tasksCompleted || [],
      }
      state.timeLogs = state.timeLogs.map((t) => (t.id === log.id ? updated : t))
      state.attendanceRecords = state.attendanceRecords.map((a) =>
        a.employeeId === employeeId && a.date === date
          ? { ...a, checkOut, status: updated.status }
          : a,
      )
      const emp = state.employees.find((e) => e.id === employeeId)
      if (emp) {
        prependActivity(state, 'attendance', emp.name, 'checked out with daily summary')
      }
    },
    addJobPosting(state, action) {
      const form = action.payload
      const id = state.nextId
      state.nextId += 1
      state.jobPostings = [
        {
          id,
          title: form.title,
          department: form.department,
          location: form.location || 'Hyderabad',
          employmentType: form.employmentType || 'Full-time',
          salaryRange: form.salaryRange || '—',
          description: form.description,
          applicants: 0,
          status: 'active',
          postedAt: todayDate(),
        },
        ...(state.jobPostings || []),
      ]
      prependActivity(state, 'hire', 'HR Team', `posted job: ${form.title}`)
    },
    bulkImportJobPostings(state, action) {
      const jobs = action.payload
      if (!Array.isArray(jobs) || !jobs.length) return
      const newPostings = []
      jobs.forEach((form) => {
        const id = state.nextId
        state.nextId += 1
        newPostings.push({
          id,
          title: form.title,
          department: form.department,
          location: form.location || 'Razole, Andhra Pradesh',
          employmentType: form.employmentType || 'Full-time',
          salaryRange: form.salaryRange || '—',
          description: form.description,
          applicants: 0,
          status: 'active',
          postedAt: todayDate(),
        })
      })
      state.jobPostings = [...newPostings, ...(state.jobPostings || [])]
      prependActivity(
        state,
        'hire',
        'HR Team',
        `bulk imported ${jobs.length} job posting(s)`,
      )
    },
    updateJobStatus(state, action) {
      const { id, status } = action.payload
      state.jobPostings = (state.jobPostings || []).map((j) =>
        j.id === id ? { ...j, status } : j,
      )
    },
    addDocumentTemplate(state, action) {
      const form = action.payload
      const id = state.nextId
      state.nextId += 1
      if (!state.documentTemplates) state.documentTemplates = []
      state.documentTemplates.push({
        id,
        title: form.title,
        category: form.category,
        description: form.description,
        body: form.body,
        fields: form.fields ?? [],
        updatedAt: todayDate(),
      })
      prependActivity(state, 'announcement', 'HR Team', `added template: ${form.title}`)
    },
    updateDocumentTemplate(state, action) {
      const { id, ...updates } = action.payload
      state.documentTemplates = (state.documentTemplates || []).map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              fields: updates.fields ?? t.fields,
              updatedAt: todayDate(),
            }
          : t,
      )
      if (updates.title) {
        prependActivity(state, 'announcement', 'HR Team', `updated template: ${updates.title}`)
      }
    },
    deleteDocumentTemplate(state, action) {
      const id = action.payload
      const removed = (state.documentTemplates || []).find((t) => t.id === id)
      state.documentTemplates = (state.documentTemplates || []).filter((t) => t.id !== id)
      if (removed) {
        prependActivity(state, 'announcement', 'HR Team', `removed template: ${removed.title}`)
      }
    },
    recordGeneratedDocument(state, action) {
      const { templateId, templateTitle, employeeId, employeeName } = action.payload
      const id = state.nextId
      state.nextId += 1
      if (!state.generatedDocuments) state.generatedDocuments = []
      state.generatedDocuments.unshift({
        id,
        templateId,
        templateTitle,
        employeeId,
        employeeName,
        generatedAt: todayDate(),
      })
      prependActivity(
        state,
        'announcement',
        employeeName,
        `generated ${templateTitle}`,
      )
    },
  },
})

export const {
  resetHrms,
  addActivity,
  updateLeaveStatus,
  submitLeave,
  addEmployee,
  bulkImportEmployees,
  patchEmployee,
  updateEmployeePayroll,
  toggleEmployeeTask,
  recordPortalLogin,
  recordPortalLogout,
  recordCheckIn,
  recordCheckOut,
  addJobPosting,
  bulkImportJobPostings,
  updateJobStatus,
  recordGeneratedDocument,
  addDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
} = hrmsSlice.actions

export default hrmsSlice.reducer
