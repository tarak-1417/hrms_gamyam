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
import { syncOfficeLocationsFromBranches } from '../../utils/organizationHelpers'
import { normalizeLeaveBalance } from '../../utils/leaveBalance'
import { pushTrashEntry, restoreTrashItemToHrms, deletedByFromAudit } from '../../utils/trashHelpers'

function prependActivity(state, type, user, action) {
  state.activityFeed = [
    { id: Date.now(), type, user, action, time: timeAgo() },
    ...state.activityFeed.slice(0, 9),
  ]
}

function appendAuditLogEntry(state, entry) {
  const id = state.auditNextId ?? 5000
  state.auditNextId = id + 1
  if (!state.auditLogs) state.auditLogs = []
  state.auditLogs.unshift({
    id,
    timestamp: new Date().toISOString(),
    actorName: entry.actorName || 'System',
    actorRole: entry.actorRole || 'system',
    actorEmail: entry.actorEmail || '',
    action: entry.action || 'Action',
    category: entry.category || 'settings',
    scope: entry.scope || 'hr',
    targetType: entry.targetType || '',
    targetId: entry.targetId != null ? String(entry.targetId) : '',
    targetLabel: entry.targetLabel || '',
    details: entry.details || '',
  })
  if (state.auditLogs.length > 500) {
    state.auditLogs = state.auditLogs.slice(0, 500)
  }
}

function sortHolidaysByDate(list = []) {
  return [...list].sort((a, b) => a.date.localeCompare(b.date))
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
    appendAuditLog(state, action) {
      appendAuditLogEntry(state, action.payload)
    },
    updateLeaveStatus(state, action) {
      const { id, status, actorName, audit } = action.payload
      const leave = state.leaveRequests.find((l) => l.id === id)
      if (leave) {
        prependActivity(state, 'leave', actorName, `${status} ${leave.employeeName}'s ${leave.type}`)
        appendAuditLogEntry(state, {
          ...(audit || { actorName, actorRole: 'admin' }),
          action: `${status} leave request`,
          category: 'leave',
          scope: 'hr',
          targetType: 'leave',
          targetId: id,
          targetLabel: leave.employeeName,
          details: `${leave.type} · ${leave.days} day(s)`,
        })
      }
      state.leaveRequests = state.leaveRequests.map((l) =>
        l.id === id ? { ...l, status } : l,
      )
    },
    updateLeaveRequest(state, action) {
      const { id, updates, audit } = action.payload
      const leave = state.leaveRequests.find((l) => l.id === id)
      if (!leave) return

      const durationType = updates.durationType ?? leave.durationType ?? 'full'
      const from = updates.from ?? leave.from
      const to = durationType === 'half' ? from : updates.to ?? leave.to
      const days = calculateLeaveDays({ from, to, durationType })

      state.leaveRequests = state.leaveRequests.map((l) => {
        if (l.id !== id) return l
        const next = {
          ...l,
          ...updates,
          from,
          to,
          days,
          durationType,
        }
        if (durationType === 'half') {
          next.halfDayPeriod = updates.halfDayPeriod ?? l.halfDayPeriod ?? 'first_half'
        } else {
          delete next.halfDayPeriod
        }
        return next
      })

      prependActivity(state, 'leave', leave.employeeName, `leave request updated`)
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Updated leave request',
          category: 'leave',
          scope: 'hr',
          targetType: 'leave',
          targetId: id,
          targetLabel: leave.employeeName,
          details: `${updates.type ?? leave.type} · ${days} day(s)`,
        })
      }
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
        submittedAt: todayDate(),
      })

      const durationNote = isHalfDay
        ? `half day (${halfDayPeriod === 'second_half' ? 'afternoon' : 'morning'})`
        : `${days} day(s)`
      prependActivity(state, 'leave', employeeName, `requested ${durationNote} ${type}`)
    },
    submitReimbursement(state, action) {
      const {
        employeeId,
        employeeName,
        requestFor,
        amount,
        expenseType,
        expenseDate,
        supportingDocuments = [],
        comments = '',
      } = action.payload

      if (!employeeId || !employeeName || !amount || !expenseType) return

      const resolvedExpenseDate = expenseDate || todayDate()

      if (!state.reimbursementRequests) state.reimbursementRequests = []

      const id = state.nextId
      state.nextId += 1

      const request = {
        id,
        employeeId,
        employeeName,
        requestFor: requestFor || employeeName,
        amount: Number(amount),
        expenseType,
        expenseDate: resolvedExpenseDate,
        supportingDocuments,
        comments,
        status: 'pending',
        submittedAt: todayDate(),
      }

      state.reimbursementRequests.unshift(request)
      prependActivity(state, 'announcement', employeeName, `submitted reimbursement for ${expenseType}`)
    },
    deleteReimbursement(state, action) {
      const { id, employeeId } = action.payload
      const request = (state.reimbursementRequests || []).find((item) => item.id === id)
      if (!request || request.employeeId !== employeeId || request.status !== 'pending') return

      state.reimbursementRequests = state.reimbursementRequests.filter((item) => item.id !== id)
      prependActivity(
        state,
        'announcement',
        request.employeeName,
        `withdrew reimbursement for ${request.expenseType}`,
      )
    },
    updateReimbursementStatus(state, action) {
      const { id, status, reviewerComment = '', actorName, audit } = action.payload
      const request = (state.reimbursementRequests || []).find((item) => item.id === id)
      if (!request) return

      state.reimbursementRequests = state.reimbursementRequests.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              reviewerComment,
              reviewedAt: todayDate(),
              reviewedBy: actorName || audit?.actorName || 'HR Team',
            }
          : item,
      )

      prependActivity(state, 'announcement', actorName || 'HR Team', `${status} reimbursement for ${request.employeeName}`)
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: `${status} reimbursement request`,
          category: 'finance',
          scope: 'hr',
          targetType: 'reimbursement',
          targetId: id,
          targetLabel: request.employeeName,
          details: `${request.expenseType} · ₹${Number(request.amount).toLocaleString('en-IN')}`,
        })
      }
    },
    saveLeaveConfiguration(state, action) {
      const { leavePolicy, leaveBalance, holidays, audit } = action.payload

      if (leavePolicy) {
        state.leavePolicy = { ...(state.leavePolicy || {}), ...leavePolicy }
      }

      if (leaveBalance) {
        const normalizedBalance = normalizeLeaveBalance(leaveBalance)
        state.employeeStats = {
          ...(state.employeeStats || {}),
          leaveBalance: normalizedBalance,
        }
        if (!state.leaveBalancesByEmployee) state.leaveBalancesByEmployee = {}
        ;(state.employees || []).forEach((employee) => {
          state.leaveBalancesByEmployee[employee.id] = { ...normalizedBalance }
        })
      }

      if (Array.isArray(holidays)) {
        state.holidays = sortHolidaysByDate(holidays)
      }

      prependActivity(state, 'announcement', 'HR Team', 'updated leave policy and holiday calendar')
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Updated leave policy',
          category: 'settings',
          scope: 'hr',
          targetType: 'leavePolicy',
          targetId: 'leave-policy',
          targetLabel: leavePolicy?.planName || state.leavePolicy?.planName || 'Leave policy',
          details: `Balances updated${Array.isArray(holidays) ? ' · holidays synced' : ''}`,
        })
      }
    },
    upsertHoliday(state, action) {
      const { holiday, audit } = action.payload
      if (!holiday?.name || !holiday?.date || !holiday?.type) return

      if (!state.holidays) state.holidays = []

      if (holiday.id && state.holidays.some((h) => h.id === holiday.id)) {
        state.holidays = sortHolidaysByDate(
          state.holidays.map((h) => (h.id === holiday.id ? { ...h, ...holiday } : h)),
        )
      } else {
        const id = holiday.id || state.nextId
        if (!holiday.id) state.nextId += 1
        state.holidays = sortHolidaysByDate([...state.holidays, { ...holiday, id }])
      }

      prependActivity(state, 'announcement', 'HR Team', `saved holiday: ${holiday.name}`)
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: holiday.id ? 'Updated holiday' : 'Created holiday',
          category: 'settings',
          scope: 'hr',
          targetType: 'holiday',
          targetId: holiday.id,
          targetLabel: holiday.name,
          details: `${holiday.date} · ${holiday.type}`,
        })
      }
    },
    deleteHoliday(state, action) {
      const { id, audit } =
        typeof action.payload === 'object' ? action.payload : { id: action.payload, audit: null }
      const holiday = (state.holidays || []).find((h) => h.id === id)
      if (!holiday) return

      state.holidays = (state.holidays || []).filter((h) => h.id !== id)
      state.optionalHolidayClaims = (state.optionalHolidayClaims || []).filter((c) => c.holidayId !== id)
      prependActivity(state, 'announcement', 'HR Team', `removed holiday: ${holiday.name}`)
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Deleted holiday',
          category: 'settings',
          scope: 'hr',
          targetType: 'holiday',
          targetId: id,
          targetLabel: holiday.name,
          details: `${holiday.date} · ${holiday.type}`,
        })
      }
    },
    addEmployee(state, action) {
      const { audit, ...form } = action.payload
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
        branchId: form.branchId || null,
        managerId: form.managerId || null,
      }
      state.employees.push(employee)
      if (!state.leaveBalancesByEmployee) state.leaveBalancesByEmployee = {}
      state.leaveBalancesByEmployee[id] = normalizeLeaveBalance(state.employeeStats?.leaveBalance)

      const payroll = resolvePayroll(employee, form.payrollInput ?? form.payroll)
      const payrollId = state.nextId
      state.nextId += 1
      if (!state.payrollRecords) state.payrollRecords = []
      state.payrollRecords.push({
        id: payrollId,
        employeeId: id,
        ...payroll,
      })

      prependActivity(state, 'hire', form.name, `joined ${form.department}`)
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Created employee',
          category: 'employee',
          scope: 'hr',
          targetType: 'employee',
          targetId: id,
          targetLabel: form.name,
          details: `${form.department} · ${form.role}`,
        })
      }
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
          branchId: form.branchId || null,
          managerId: form.managerId || null,
        }
        importedEmployees.push(employee)
        if (!state.leaveBalancesByEmployee) state.leaveBalancesByEmployee = {}
        state.leaveBalancesByEmployee[id] = normalizeLeaveBalance(state.employeeStats?.leaveBalance)

        const payroll = resolvePayroll(
          employee,
          form.payroll
            ? { ...form.payroll }
            : null,
        )
        const payrollId = state.nextId
        state.nextId += 1
        importedPayroll.push({
          id: payrollId,
          employeeId: id,
          ...payroll,
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
    updateEmployeeProfileImage(state, action) {
      const { employeeId, profileImage } = action.payload
      state.employees = state.employees.map((e) =>
        e.id === employeeId ? { ...e, profileImage: profileImage ?? null } : e,
      )
    },
    patchEmployee(state, action) {
      const { employeeId, updates, audit } = action.payload
      state.employees = state.employees.map((e) => {
        if (e.id !== employeeId) return e
        const name = updates.name ?? e.name
        const next = { ...e, ...updates, avatar: avatarFromName(name) }
        if (Object.prototype.hasOwnProperty.call(updates, 'profileImage')) {
          next.profileImage = updates.profileImage ?? null
        }
        return next
      })
      if (audit) {
        const emp = state.employees.find((e) => e.id === employeeId)
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Updated employee record',
          category: 'employee',
          scope: 'hr',
          targetType: 'employee',
          targetId: employeeId,
          targetLabel: updates.name || emp?.name || employeeId,
          details: [updates.department, updates.role, updates.status].filter(Boolean).join(' · '),
        })
      }
    },
    updateEmployeePayroll(state, action) {
      const { employeeId, payrollInput, audit } = action.payload
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
              ...payroll,
            }
            : p,
        )
      } else {
        const payrollId = state.nextId
        state.nextId += 1
        state.payrollRecords.push({
          id: payrollId,
          employeeId,
          ...payroll,
        })
      }
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Updated payroll record',
          category: 'payroll',
          scope: 'hr',
          targetType: 'employee',
          targetId: employeeId,
          targetLabel: employee.name,
          details: `Net: ₹${payroll.net?.toLocaleString('en-IN')}`,
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
      const emp = state.employees.find((e) => e.id === employeeId)
      if (payload.audit && emp) {
        appendAuditLogEntry(state, {
          ...payload.audit,
          action: 'Checked in',
          category: 'attendance',
          scope: 'hr',
          targetType: 'employee',
          targetId: employeeId,
          targetLabel: emp.name,
          details: geo?.officeName ? `At ${geo.officeName}` : 'Manual check-in',
        })
      }
    },
    recordCheckOut(state, action) {
      const { employeeId, daySummary = '', tasksCompleted = [], audit } = action.payload
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
        if (audit) {
          appendAuditLogEntry(state, {
            ...audit,
            action: 'Checked out',
            category: 'attendance',
            scope: 'hr',
            targetType: 'employee',
            targetId: employeeId,
            targetLabel: emp.name,
            details: workHours ? `Work: ${workHours}` : 'End of day',
          })
        }
      }
    },
    addJobPosting(state, action) {
      const { audit, ...form } = action.payload
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
      if (form.audit) {
        appendAuditLogEntry(state, {
          ...form.audit,
          action: 'Posted job',
          category: 'recruitment',
          scope: 'hr',
          targetType: 'job',
          targetId: id,
          targetLabel: form.title,
          details: `${form.department} · ${form.location || 'Hyderabad'}`,
        })
      }
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
      const { id, status, audit } = action.payload
      const job = (state.jobPostings || []).find((j) => j.id === id)
      state.jobPostings = (state.jobPostings || []).map((j) =>
        j.id === id ? { ...j, status } : j,
      )
      if (audit && job) {
        appendAuditLogEntry(state, {
          ...audit,
          action: `Job marked ${status}`,
          category: 'recruitment',
          scope: 'hr',
          targetType: 'job',
          targetId: id,
          targetLabel: job.title,
          details: job.department,
        })
      }
    },
    addDocumentTemplate(state, action) {
      const { audit, ...form } = action.payload
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
      if (form.audit) {
        appendAuditLogEntry(state, {
          ...form.audit,
          action: 'Created document template',
          category: 'document',
          scope: 'hr',
          targetType: 'template',
          targetId: id,
          targetLabel: form.title,
          details: form.category,
        })
      }
    },
    updateDocumentTemplate(state, action) {
      const { id, audit, ...updates } = action.payload
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
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Updated document template',
          category: 'document',
          scope: 'hr',
          targetType: 'template',
          targetId: id,
          targetLabel: updates.title || 'Template',
          details: updates.category,
        })
      }
    },
    deleteDocumentTemplate(state, action) {
      const { id, audit } =
        typeof action.payload === 'object' ? action.payload : { id: action.payload, audit: null }
      const removed = (state.documentTemplates || []).find((t) => t.id === id)
      if (!removed) return
      state.documentTemplates = (state.documentTemplates || []).filter((t) => t.id !== id)
      pushTrashEntry(state, {
        entityType: 'documentTemplate',
        entityId: id,
        label: removed.title,
        scope: 'hr',
        data: { template: removed },
        deletedBy: deletedByFromAudit(audit),
      })
      prependActivity(state, 'announcement', 'HR Team', `moved template to recycle bin: ${removed.title}`)
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Moved document template to recycle bin',
          category: 'document',
          scope: 'hr',
          targetType: 'template',
          targetId: id,
          targetLabel: removed.title,
          details: 'Soft delete — recoverable by Super Admin',
        })
      }
    },
    softDeleteEmployee(state, action) {
      const { employeeId, audit } = action.payload
      const employee = state.employees.find((e) => e.id === employeeId)
      if (!employee) return
      const payrollRecords = (state.payrollRecords || []).filter((p) => p.employeeId === employeeId)
      state.employees = state.employees.filter((e) => e.id !== employeeId)
      state.payrollRecords = (state.payrollRecords || []).filter((p) => p.employeeId !== employeeId)
      pushTrashEntry(state, {
        entityType: 'employee',
        entityId: employeeId,
        label: employee.name,
        scope: 'hr',
        data: { employee, payrollRecords },
        deletedBy: deletedByFromAudit(audit),
      })
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Moved employee to recycle bin',
          category: 'employee',
          scope: 'hr',
          targetType: 'employee',
          targetId: employeeId,
          targetLabel: employee.name,
          details: 'Includes linked payroll records',
        })
      }
    },
    softDeleteLeaveRequest(state, action) {
      const { id, audit } = action.payload
      const leave = state.leaveRequests.find((l) => l.id === id)
      if (!leave) return
      state.leaveRequests = state.leaveRequests.filter((l) => l.id !== id)
      pushTrashEntry(state, {
        entityType: 'leave',
        entityId: id,
        label: `${leave.employeeName} — ${leave.type}`,
        scope: 'hr',
        data: { leave },
        deletedBy: deletedByFromAudit(audit),
      })
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Moved leave request to recycle bin',
          category: 'leave',
          scope: 'hr',
          targetType: 'leave',
          targetId: id,
          targetLabel: leave.employeeName,
          details: `${leave.type} · ${leave.days} day(s)`,
        })
      }
    },
    softDeletePayrollRecord(state, action) {
      const { id, audit } = action.payload
      const record = (state.payrollRecords || []).find((p) => p.id === id)
      if (!record) return
      const employee = state.employees.find((e) => e.id === record.employeeId)
      state.payrollRecords = state.payrollRecords.filter((p) => p.id !== id)
      pushTrashEntry(state, {
        entityType: 'payroll',
        entityId: id,
        label: `${employee?.name || record.employeeId} — ${record.month}`,
        scope: 'hr',
        data: { record, employeeId: record.employeeId },
        deletedBy: deletedByFromAudit(audit),
      })
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Moved payroll record to recycle bin',
          category: 'payroll',
          scope: 'hr',
          targetType: 'payroll',
          targetId: id,
          targetLabel: employee?.name || record.employeeId,
          details: record.month,
        })
      }
    },
    softDeleteJobPosting(state, action) {
      const { id, audit } = action.payload
      const job = (state.jobPostings || []).find((j) => j.id === id)
      if (!job) return
      state.jobPostings = (state.jobPostings || []).filter((j) => j.id !== id)
      pushTrashEntry(state, {
        entityType: 'jobPosting',
        entityId: id,
        label: job.title,
        scope: 'hr',
        data: { job },
        deletedBy: deletedByFromAudit(audit),
      })
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Moved job posting to recycle bin',
          category: 'recruitment',
          scope: 'hr',
          targetType: 'job',
          targetId: id,
          targetLabel: job.title,
          details: job.department,
        })
      }
    },
    softDeleteToTrash(state, action) {
      pushTrashEntry(state, action.payload)
    },
    restoreFromTrash(state, action) {
      const { trashId, audit } =
        typeof action.payload === 'object' ? action.payload : { trashId: action.payload, audit: null }
      const item = (state.trash || []).find((t) => t.id === trashId)
      if (!item) return
      if (item.entityType === 'platformOrganization' || item.entityType === 'platformUser') {
        return
      }
      const ok = restoreTrashItemToHrms(state, item)
      if (ok) {
        state.trash = state.trash.filter((t) => t.id !== trashId)
        if (audit) {
          appendAuditLogEntry(state, {
            ...audit,
            action: 'Restored from recycle bin',
            category: 'security',
            scope: 'platform',
            targetType: item.entityType,
            targetId: item.entityId,
            targetLabel: item.label,
            details: 'Record recovered',
          })
        }
      }
    },
    removeTrashEntry(state, action) {
      const trashId = action.payload
      state.trash = (state.trash || []).filter((t) => t.id !== trashId)
    },
    purgeFromTrash(state, action) {
      const { trashId, audit } = action.payload
      const item = (state.trash || []).find((t) => t.id === trashId)
      if (!item) return
      state.trash = state.trash.filter((t) => t.id !== trashId)
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Permanently deleted from recycle bin',
          category: 'security',
          scope: 'platform',
          targetType: item.entityType,
          targetId: item.entityId,
          targetLabel: item.label,
          details: 'Cannot be recovered',
        })
      }
    },
    updateOrganization(state, action) {
      const { audit, ...orgPatch } = action.payload
      state.organization = { ...state.organization, ...orgPatch }
      prependActivity(state, 'announcement', 'Super Admin', 'updated company profile')
      if (audit) {
        appendAuditLogEntry(state, {
          ...audit,
          action: 'Updated company profile',
          category: audit.scope === 'platform' ? 'organization' : 'settings',
          scope: audit.scope || 'hr',
          targetType: 'organization',
          targetId: 'tenant',
          targetLabel: orgPatch.displayName || state.organization?.displayName || 'Company',
          details: 'Company settings',
        })
      }
    },
    upsertDepartment(state, action) {
      const payload = action.payload
      if (!state.departments) state.departments = []
      if (payload.id) {
        state.departments = state.departments.map((d) =>
          d.id === payload.id ? { ...d, ...payload } : d,
        )
      } else {
        const id = state.nextId
        state.nextId += 1
        state.departments.push({
          status: 'active',
          headEmployeeId: null,
          ...payload,
          id,
        })
      }
      prependActivity(state, 'announcement', 'Super Admin', `saved department: ${payload.name}`)
      if (payload.audit) {
        appendAuditLogEntry(state, {
          ...payload.audit,
          action: payload.id ? 'Updated department' : 'Created department',
          category: 'organization',
          scope: 'platform',
          targetType: 'department',
          targetId: payload.id,
          targetLabel: payload.name,
          details: payload.code || '',
        })
      }
    },
    deleteDepartment(state, action) {
      const payload =
        typeof action.payload === 'object' ? action.payload : { id: action.payload, audit: null }
      const { id, audit } = payload
      const dept = state.departments?.find((d) => d.id === id)
      if (!dept) return
      state.departments = (state.departments || []).filter((d) => d.id !== id)
      pushTrashEntry(state, {
        entityType: 'department',
        entityId: id,
        label: dept.name,
        scope: 'platform',
        data: { department: dept },
        deletedBy: deletedByFromAudit(audit),
      })
      prependActivity(state, 'announcement', 'Super Admin', `moved department to recycle bin: ${dept.name}`)
    },
    upsertDesignation(state, action) {
      const payload = action.payload
      if (!state.designations) state.designations = []
      if (payload.id) {
        state.designations = state.designations.map((d) =>
          d.id === payload.id ? { ...d, ...payload } : d,
        )
      } else {
        const id = state.nextId
        state.nextId += 1
        state.designations.push({ status: 'active', ...payload, id })
      }
      prependActivity(state, 'announcement', 'Super Admin', `saved designation: ${payload.title}`)
    },
    deleteDesignation(state, action) {
      const payload =
        typeof action.payload === 'object' ? action.payload : { id: action.payload, audit: null }
      const { id, audit } = payload
      const item = state.designations?.find((d) => d.id === id)
      if (!item) return
      state.designations = (state.designations || []).filter((d) => d.id !== id)
      pushTrashEntry(state, {
        entityType: 'designation',
        entityId: id,
        label: item.title,
        scope: 'platform',
        data: { designation: item },
        deletedBy: deletedByFromAudit(audit),
      })
      prependActivity(state, 'announcement', 'Super Admin', `moved designation to recycle bin: ${item.title}`)
    },
    upsertBranch(state, action) {
      const payload = action.payload
      if (!state.branches) state.branches = []
      if (payload.id && state.branches.some((b) => b.id === payload.id)) {
        state.branches = state.branches.map((b) => (b.id === payload.id ? { ...b, ...payload } : b))
      } else {
        const id = payload.id || `br-${state.nextId}`
        if (!payload.id) state.nextId += 1
        state.branches.push({ status: 'active', isHeadOffice: false, ...payload, id })
      }
      if (state.attendancePolicy) {
        state.attendancePolicy.officeLocations = syncOfficeLocationsFromBranches(
          state.branches,
          state.attendancePolicy.radiusMeters,
        )
      }
      prependActivity(state, 'announcement', 'Super Admin', `saved branch: ${payload.name}`)
    },
    deleteBranch(state, action) {
      const payload =
        typeof action.payload === 'object' ? action.payload : { id: action.payload, audit: null }
      const { id, audit } = payload
      const branch = state.branches?.find((b) => b.id === id)
      if (!branch) return
      state.branches = (state.branches || []).filter((b) => b.id !== id)
      if (state.attendancePolicy) {
        state.attendancePolicy.officeLocations = syncOfficeLocationsFromBranches(
          state.branches,
          state.attendancePolicy.radiusMeters,
        )
      }
      pushTrashEntry(state, {
        entityType: 'branch',
        entityId: id,
        label: branch.name,
        scope: 'platform',
        data: { branch },
        deletedBy: deletedByFromAudit(audit),
      })
      prependActivity(state, 'announcement', 'Super Admin', `moved branch to recycle bin: ${branch.name}`)
    },
    setEmployeeManager(state, action) {
      const { employeeId, managerId } = action.payload
      state.employees = state.employees.map((e) =>
        e.id === employeeId ? { ...e, managerId: managerId || null } : e,
      )
    },
    setReportingStructure(state, action) {
      const assignments = action.payload
      if (!Array.isArray(assignments)) return
      assignments.forEach(({ employeeId, managerId }) => {
        const emp = state.employees.find((e) => e.id === employeeId)
        if (emp) emp.managerId = managerId || null
      })
      prependActivity(state, 'announcement', 'Super Admin', 'updated reporting structure')
    },
    recordGeneratedDocument(state, action) {
      const { templateId, templateTitle, employeeId, employeeName, content } = action.payload
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
        content: content ?? '',
      })
      prependActivity(
        state,
        'announcement',
        employeeName,
        `generated ${templateTitle}`,
      )
      if (action.payload.audit) {
        appendAuditLogEntry(state, {
          ...action.payload.audit,
          action: 'Generated document',
          category: 'document',
          scope: 'hr',
          targetType: 'document',
          targetId: id,
          targetLabel: `${templateTitle} — ${employeeName}`,
          details: `Employee ${employeeId}`,
        })
      }
    },
  },
})

export const {
  resetHrms,
  addActivity,
  appendAuditLog,
  updateLeaveStatus,
  updateLeaveRequest,
  submitLeave,
  submitReimbursement,
  deleteReimbursement,
  updateReimbursementStatus,
  saveLeaveConfiguration,
  upsertHoliday,
  deleteHoliday,
  addEmployee,
  bulkImportEmployees,
  patchEmployee,
  updateEmployeeProfileImage,
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
  updateOrganization,
  upsertDepartment,
  deleteDepartment,
  upsertDesignation,
  deleteDesignation,
  upsertBranch,
  deleteBranch,
  setEmployeeManager,
  setReportingStructure,
  softDeleteEmployee,
  softDeleteLeaveRequest,
  softDeletePayrollRecord,
  softDeleteJobPosting,
  softDeleteToTrash,
  restoreFromTrash,
  purgeFromTrash,
  removeTrashEntry,
} = hrmsSlice.actions

export default hrmsSlice.reducer
