/**
 * Builds a live snapshot of Gamyam HRMS data and answers questions from it.
 */

import analytics from '../data/analytics.json'
import { findNavActions, getBrowseMenuActions, getQuickNavActions } from './aiNavigation'

const POLICY = {
  workHours: '9:00 AM – 6:00 PM, Monday–Friday',
  casualLeave: '12 days per year',
  sickLeave: '12 days per year',
  earnedLeave: '15 days per year',
  latePolicy: 'Check-in after 9:15 AM is marked late',
}

const PLATFORM_COMPANIES = [
  { name: 'Gamyam Tech', plan: 'Enterprise', employees: 72, status: 'active' },
  { name: 'Acme Corp', plan: 'Professional', employees: 45, status: 'active' },
  { name: 'StartUp Inc', plan: 'Starter', employees: 12, status: 'trial' },
]

function pick(text) {
  return text.trim().toLowerCase()
}

function formatInr(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function scopeEmployees(employees, portalRole, user) {
  if (portalRole === 'manager') {
    return employees.filter((e) => e.department === 'Engineering')
  }
  if (portalRole === 'employee' && user?.employeeId) {
    return employees.filter((e) => e.id === user.employeeId)
  }
  return employees
}

function findEmployeeByName(employees, query) {
  const q = pick(query)
  return employees.find(
    (e) =>
      q.includes(e.name.toLowerCase()) ||
      q.includes(e.id.toLowerCase()) ||
      e.name.toLowerCase().split(' ').some((part) => part.length > 2 && q.includes(part)),
  )
}

function deptCounts(employees) {
  const map = {}
  employees.forEach((e) => {
    map[e.department] = (map[e.department] || 0) + 1
  })
  return map
}

export function buildAppKnowledge({ hrms, user, portalRole, adminStats, managerKpis }) {
  const employees = scopeEmployees(hrms.employees || [], portalRole, user)
  const employeeIds = new Set(employees.map((e) => e.id))
  const today = todayIso()

  const leaveRequests = (hrms.leaveRequests || []).filter((l) => employeeIds.has(l.employeeId))
  const attendanceRecords = (hrms.attendanceRecords || []).filter((a) => employeeIds.has(a.employeeId))
  const payrollRecords = (hrms.payrollRecords || []).filter((p) => employeeIds.has(p.employeeId))
  const timeLogs = (hrms.timeLogs || []).filter((t) => employeeIds.has(t.employeeId))
  const jobPostings = hrms.jobPostings || []
  const holidays = hrms.holidays || []
  const tasks = hrms.employeeTasks || []
  const activityFeed = hrms.activityFeed || []
  const documentTemplates = hrms.documentTemplates || []
  const departments = hrms.departments || []

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending')
  const approvedLeaves = leaveRequests.filter((l) => l.status === 'approved')
  const todayAttendance = attendanceRecords.filter((a) => a.date === today)
  const presentToday = todayAttendance.filter((a) => a.status === 'present').length
  const lateToday = todayAttendance.filter((a) => a.status === 'late').length
  const onLeaveToday = todayAttendance.filter((a) => a.status === 'on-leave').length

  const payrollTotal = payrollRecords.reduce((s, p) => s + (p.net || 0), 0)
  const activeJobs = jobPostings.filter((j) => j.status === 'active')

  const myEmployee =
    portalRole === 'employee' ? employees.find((e) => e.id === user?.employeeId) : null
  const myPayroll = myEmployee
    ? payrollRecords.find((p) => p.employeeId === myEmployee.id)
    : null
  const myTodayAttendance = myEmployee
    ? todayAttendance.find((a) => a.employeeId === myEmployee.id)
    : null
  const myTodayLog = myEmployee
    ? timeLogs.find((t) => t.employeeId === myEmployee.id && t.date === today)
    : null
  const myLeaves = myEmployee
    ? leaveRequests.filter((l) => l.employeeId === myEmployee.id)
    : []
  const myTasks = tasks.filter((t) => !t.done)

  return {
    portalRole,
    userName: user?.name,
    today,
    employees,
    departments,
    leaveRequests,
    pendingLeaves,
    approvedLeaves,
    attendanceRecords,
    todayAttendance,
    presentToday,
    lateToday,
    onLeaveToday,
    payrollRecords,
    payrollTotal,
    timeLogs,
    jobPostings,
    activeJobs,
    holidays,
    tasks,
    activityFeed,
    documentTemplates,
    leavePolicy: hrms.leavePolicy || {},
    attendancePolicy: hrms.attendancePolicy || {},
    employeeStats: hrms.employeeStats,
    adminStats,
    managerKpis,
    platformKpis: analytics.superAdminKpis,
    platformCompanies: PLATFORM_COMPANIES,
    deptCounts: deptCounts(employees),
    myEmployee,
    myPayroll,
    myTodayAttendance,
    myTodayLog,
    myLeaves,
    myTasks,
  }
}

function withNav(text, message, role, extraPaths = []) {
  const nav = [
    ...findNavActions(message, role, 2),
    ...getQuickNavActions(role, extraPaths),
  ]
  const unique = []
  const seen = new Set()
  for (const a of nav) {
    if (!seen.has(a.path)) {
      seen.add(a.path)
      unique.push(a)
    }
  }
  return { text, actions: unique.length ? unique.slice(0, 3) : undefined }
}

/** Primary Q&A from live application data */
export function queryAppKnowledge(message, k) {
  const q = pick(message)
  const role = k.portalRole

  if (/^help$|what can you|what do you know|capabilities/.test(q)) {
    return withNav(
      `I have live access to your Gamyam HRMS data:\n• ${k.employees.length} employee(s) in scope\n• ${k.pendingLeaves.length} pending leave(s)\n• ${k.presentToday} present today, ${k.lateToday} late, ${k.onLeaveToday} on leave\n• ${k.payrollRecords.length} payroll record(s), ${k.activeJobs.length} active job(s)\n• ${k.documentTemplates.length} document template(s)\n\nAsk about anyone by name, departments, salary, attendance, or say "open payroll".`,
      message,
      role,
    )
  }

  // —— Employee-specific (self) ——
  if (role === 'employee' && k.myEmployee) {
    if (/my salary|my pay|my net|how much (do i|am i) (earn|paid)/.test(q)) {
      const p = k.myPayroll
      return withNav(
        p
          ? `Your April 2026 payslip:\n• Basic: ${formatInr(p.basic)}\n• Allowances: ${formatInr(p.allowances)}\n• Deductions: ${formatInr(p.deductions)}\n• Net: ${formatInr(p.net)}`
          : 'No payroll record on file yet.',
        message,
        role,
        ['/employee/payslips'],
      )
    }
    if (/my task|todo|assigned/.test(q)) {
      const open = k.myTasks
      return withNav(
        open.length === 0
          ? 'You have no open tasks.'
          : `Open tasks:\n${open.map((t) => `• ${t.title} (due ${t.due}, ${t.priority})`).join('\n')}`,
        message,
        role,
        ['/employee/tasks'],
      )
    }
  }

  // —— Find person by name ——
  const named = findEmployeeByName(k.employees, message)
  if (named) {
    const att = k.todayAttendance.find((a) => a.employeeId === named.id)
    const pay = k.payrollRecords.find((p) => p.employeeId === named.id)
    const leaves = k.leaveRequests.filter((l) => l.employeeId === named.id)
    const pending = leaves.filter((l) => l.status === 'pending')

    if (/salary|pay|payroll|earn|ctc|net/.test(q)) {
      return withNav(
        pay
          ? `${named.name} (${named.id}) — April 2026 net pay: ${formatInr(pay.net)} (basic ${formatInr(pay.basic)}, allowances ${formatInr(pay.allowances)}).`
          : `${named.name} has no payroll row on file.`,
        message,
        role,
        role === 'admin' ? ['/admin/payroll'] : [],
      )
    }
    if (/attendance|check in|present|late|today/.test(q)) {
      return withNav(
        att
          ? `${named.name} today (${att.date}): ${att.status}, check-in ${att.checkIn}, check-out ${att.checkOut}.`
          : `${named.name} has no attendance row for today.`,
        message,
        role,
        role === 'admin' ? ['/admin/attendance'] : role === 'manager' ? ['/manager/attendance'] : [],
      )
    }
    if (/leave/.test(q)) {
      if (leaves.length === 0) {
        return withNav(`${named.name} has no leave requests on file.`, message, role)
      }
      const list = leaves
        .map((l) => `• ${l.type}: ${l.from}–${l.to} (${l.status})`)
        .join('\n')
      return withNav(`${named.name} — leave history:\n${list}`, message, role, [
        role === 'admin' ? '/admin/leave' : role === 'manager' ? '/manager/leave' : '/employee/leave',
      ])
    }
    if (/email|phone|contact|profile|department|role|who is/.test(q)) {
      return withNav(
        `${named.name} (${named.id})\n• Department: ${named.department}\n• Role: ${named.role}\n• Status: ${named.status}\n• Email: ${named.email}\n• Phone: ${named.phone || '—'}\n• Joined: ${named.joinDate}`,
        message,
        role,
        role === 'admin' ? ['/admin/employees'] : role === 'manager' ? ['/manager/team'] : [],
      )
    }
    // Generic person lookup
    return withNav(
      `${named.name} — ${named.role} in ${named.department}, status: ${named.status}.${att ? ` Today: ${att.status}.` : ''}${pay ? ` Net pay: ${formatInr(pay.net)}.` : ''}${pending.length ? ` ${pending.length} pending leave(s).` : ''}`,
      message,
      role,
    )
  }

  // —— Department ——
  if (/engineering|sales|marketing|finance|human resources|hr department|how many in/.test(q)) {
    const deptMatch = Object.keys(k.deptCounts).find((d) => q.includes(d.toLowerCase()))
    if (deptMatch) {
      return withNav(
        `${deptMatch}: ${k.deptCounts[deptMatch]} employee(s) in your view — ${k.employees
          .filter((e) => e.department === deptMatch)
          .map((e) => e.name)
          .join(', ')}.`,
        message,
        role,
        role === 'admin' ? ['/admin/departments'] : role === 'manager' ? ['/manager/departments'] : [],
      )
    }
    const lines = Object.entries(k.deptCounts)
      .map(([d, c]) => `• ${d}: ${c}`)
      .join('\n')
    return withNav(`Headcount by department:\n${lines}`, message, role, [
      role === 'admin' ? '/admin/departments' : '/manager/departments',
    ])
  }

  // —— Who is on leave / late / present ——
  if (/who (is |are )?(on leave|absent|away)/.test(q) || /on leave today/.test(q)) {
    const list = k.todayAttendance.filter((a) => a.status === 'on-leave')
    const names = list
      .map((a) => k.employees.find((e) => e.id === a.employeeId)?.name || a.employeeId)
      .join(', ')
    return withNav(
      list.length ? `On leave today: ${names}.` : 'No one marked on leave today in your view.',
      message,
      role,
      [role === 'admin' ? '/admin/attendance' : '/manager/attendance'],
    )
  }
  if (/who (is |are )?late|late today/.test(q)) {
    const list = k.todayAttendance.filter((a) => a.status === 'late')
    const names = list
      .map((a) => {
        const e = k.employees.find((emp) => emp.id === a.employeeId)
        return e ? `${e.name} (${a.checkIn})` : a.employeeId
      })
      .join(', ')
    return withNav(
      list.length ? `Late today: ${names}.` : 'No late check-ins today.',
      message,
      role,
      [role === 'admin' ? '/admin/attendance' : '/manager/attendance'],
    )
  }
  if (/who (is |are )?present|present today|checked in/.test(q)) {
    const list = k.todayAttendance.filter((a) => a.status === 'present')
    const names = list
      .map((a) => k.employees.find((e) => e.id === a.employeeId)?.name || a.employeeId)
      .join(', ')
    return withNav(
      list.length
        ? `Present today (${list.length}): ${names}.`
        : 'No present attendance records for today.',
      message,
      role,
      [role === 'admin' ? '/admin/attendance' : '/manager/attendance'],
    )
  }

  // —— Leave ——
  if (/pending leave|leave approval|awaiting approval/.test(q)) {
    if (k.pendingLeaves.length === 0) {
      return withNav('No pending leave requests.', message, role, [
        role === 'admin' ? '/admin/leave' : role === 'manager' ? '/manager/leave' : '/employee/leave',
      ])
    }
    const list = k.pendingLeaves
      .map((l) => `• ${l.employeeName}: ${l.type} ${l.from}–${l.to} (${l.days} days) — ${l.reason || '—'}`)
      .join('\n')
    return withNav(`Pending leave (${k.pendingLeaves.length}):\n${list}`, message, role, [
      role === 'admin' ? '/admin/leave' : role === 'manager' ? '/manager/leave' : '/employee/leave',
    ])
  }
  if (/approved leave|recent leave/.test(q)) {
    const list = k.approvedLeaves.slice(0, 5)
    if (!list.length) return withNav('No approved leaves on file.', message, role)
    return withNav(
      `Recent approved:\n${list.map((l) => `• ${l.employeeName}: ${l.type} ${l.from}–${l.to}`).join('\n')}`,
      message,
      role,
    )
  }
  if (/leave balance|casual|sick|earned/.test(q) && role === 'employee' && k.employeeStats?.leaveBalance) {
    const b = k.employeeStats.leaveBalance
    return withNav(
      `Your balance: Casual ${b.casual}, Sick ${b.sick}, Earned ${b.earned} days.`,
      message,
      role,
      ['/employee/leave'],
    )
  }

  // —— Payroll org-wide ——
  if (/total payroll|payroll cost|payroll sum|monthly payroll/.test(q)) {
    return withNav(
      `April 2026 payroll total (in scope): ${formatInr(k.payrollTotal)} across ${k.payrollRecords.length} employees.`,
      message,
      role,
      [role === 'admin' ? '/admin/payroll' : '/employee/payslips'],
    )
  }
  if (/highest paid|top salary|maximum salary/.test(q)) {
    const top = [...k.payrollRecords].sort((a, b) => b.net - a.net)[0]
    if (!top) return null
    const emp = k.employees.find((e) => e.id === top.employeeId)
    return withNav(
      `Highest net pay: ${emp?.name || top.employeeId} at ${formatInr(top.net)}.`,
      message,
      role,
      ['/admin/payroll'],
    )
  }

  // —— Jobs / recruitment ——
  if (/job|recruit|hiring|posting|vacancy|opening/.test(q)) {
    if (k.activeJobs.length === 0) {
      return withNav('No active job postings.', message, role, ['/admin/recruitment'])
    }
    const list = k.jobPostings
      .map(
        (j) =>
          `• ${j.title} (${j.department}, ${j.status}) — ${j.applicants} applicants, ${j.location}`,
      )
      .join('\n')
    return withNav(`Job postings:\n${list}`, message, role, ['/admin/recruitment'])
  }

  // —— Documents ——
  if (/document|template|offer letter|appointment|nda|relieving/.test(q)) {
    const list = k.documentTemplates
      .slice(0, 6)
      .map((t) => `• ${t.title} (${t.category})`)
      .join('\n')
    return withNav(
      `${k.documentTemplates.length} HR document templates available:\n${list}${k.documentTemplates.length > 6 ? '\n…and more' : ''}`,
      message,
      role,
      [
        role === 'admin'
          ? '/admin/documents'
          : role === 'superadmin'
            ? '/superadmin/documents'
            : '/employee/documents',
      ],
    )
  }

  // —— Holidays ——
  if (/holiday|festival|diwali|republic|calendar/.test(q)) {
    const upcoming = k.holidays
      .filter((h) => h.date >= k.today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
    return withNav(
      upcoming.length
        ? `Upcoming holidays:\n${upcoming.map((h) => `• ${h.name} — ${h.date} (${h.type})`).join('\n')}`
        : 'No upcoming holidays listed.',
      message,
      role,
      ['/employee/leave'],
    )
  }

  // —— Activity ——
  if (/activity|recent update|what happened|feed|announcement/.test(q)) {
    const list = k.activityFeed
      .slice(0, 5)
      .map((a) => `• ${a.user}: ${a.action} (${a.time})`)
      .join('\n')
    return withNav(`Recent activity:\n${list}`, message, role, [role === 'admin' ? '/admin' : '/manager'])
  }

  // —— Policy / geo ——
  if (/policy|work hour|late policy|timing|office location|geo|check.?in radius/.test(q)) {
    const geo = k.attendancePolicy
    const office = geo?.officeLocations?.[0]
    return withNav(
      `Policies:\n• Hours: ${POLICY.workHours}\n• Late: ${POLICY.latePolicy}\n• Leave: CL ${POLICY.casualLeave}, SL ${POLICY.sickLeave}, EL ${POLICY.earnedLeave}${
        geo?.geoCheckInEnabled && office
          ? `\n• Geo check-in: ${office.name} (${office.radiusMeters || geo.radiusMeters}m radius)`
          : ''
      }`,
      message,
      role,
      [role === 'admin' ? '/admin/settings' : '/employee/attendance'],
    )
  }

  // —— Super admin platform ——
  if (role === 'superadmin') {
    if (/compan|tenant|client/.test(q)) {
      const list = k.platformCompanies.map((c) => `• ${c.name}: ${c.plan}, ${c.employees} users (${c.status})`).join('\n')
      return withNav(
        `Platform: ${k.platformKpis.totalCompanies} companies on file. Sample tenants:\n${list}`,
        message,
        role,
        ['/superadmin/companies'],
      )
    }
    if (/revenue|mrr|billing/.test(q)) {
      return withNav(
        `MRR ~$${k.platformKpis.monthlyRevenue}M · Uptime ${k.platformKpis.systemUptime}% · ${k.platformKpis.activeUsers} active users.`,
        message,
        role,
        ['/superadmin/billing'],
      )
    }
    if (/subscription|plan/.test(q)) {
      return withNav(
        `${k.platformKpis.activeSubscriptions} active subscriptions of ${k.platformKpis.totalCompanies} companies.`,
        message,
        role,
        ['/superadmin/subscriptions'],
      )
    }
    if (/uptime|monitor|health/.test(q)) {
      return withNav(
        `System uptime: ${k.platformKpis.systemUptime}% (${k.platformKpis.supportTickets} support tickets open).`,
        message,
        role,
        ['/superadmin/monitoring'],
      )
    }
  }

  // —— Admin stats ——
  if (role === 'admin' && k.adminStats) {
    const s = k.adminStats
    if (/employee|headcount|staff count|how many employee/.test(q)) {
      return withNav(
        `${s.totalEmployees} employees · ${s.newHires} new since Jan 2026 · ${s.pendingLeaves} pending leaves.`,
        message,
        role,
        ['/admin/employees'],
      )
    }
    if (/dashboard|summary|overview|stats/.test(q)) {
      const rate = s.totalEmployees ? Math.round((s.presentToday / s.totalEmployees) * 100) : 0
      return withNav(
        `HR snapshot:\n• Employees: ${s.totalEmployees}\n• Present today: ${s.presentToday} (${rate}%)\n• On leave: ${s.onLeave}\n• Pending leaves: ${s.pendingLeaves}\n• Payroll total: ${formatInr(k.payrollTotal)}\n• Active jobs: ${k.activeJobs.length}`,
        message,
        role,
        ['/admin'],
      )
    }
  }

  // —— Manager ——
  if (role === 'manager' && k.managerKpis) {
    const m = k.managerKpis
    if (/team|engineering|member/.test(q)) {
      const names = k.employees.map((e) => e.name).join(', ')
      return withNav(
        `Engineering team (${m.teamSize}): ${names}.\nPresent today: ${m.presentToday}/${m.teamSize} (${m.avgAttendance}%).`,
        message,
        role,
        ['/manager/team'],
      )
    }
    if (/summary|overview|dashboard/.test(q)) {
      return withNav(
        `Manager snapshot:\n• Team size: ${m.teamSize}\n• Present: ${m.presentToday}\n• Pending approvals: ${m.pendingApprovals}\n• Avg attendance: ${m.avgAttendance}%`,
        message,
        role,
        ['/manager'],
      )
    }
  }

  // —— List all employees ——
  if (/list employee|all employee|who works|employee list|show staff/.test(q)) {
    const list = k.employees
      .map((e) => `• ${e.name} — ${e.department}, ${e.role} (${e.status})`)
      .join('\n')
    return withNav(`Employees (${k.employees.length}):\n${list}`, message, role, [
      role === 'admin' ? '/admin/employees' : role === 'manager' ? '/manager/team' : [],
    ])
  }

  // —— Employee attendance self ——
  if (role === 'employee' && /attendance|check in|today|sign in/.test(q)) {
    const t = k.myTodayLog
    const a = k.myTodayAttendance
    if (!t && !a) {
      return withNav('No attendance for today yet.', message, role, ['/employee/attendance'])
    }
    return withNav(
      `Today:\n• Portal: ${t?.portalLogin || '—'} – ${t?.portalLogout || 'active'}\n• Work: ${t?.checkIn || a?.checkIn || '—'} – ${t?.checkOut || a?.checkOut || '—'}\n• Hours: ${t?.workHours || '—'}\n• Status: ${a?.status || t?.status || '—'}`,
      message,
      role,
      ['/employee/attendance'],
    )
  }

  return null
}

export function buildKnowledgeSummaryForPrompt(k) {
  return JSON.stringify(
    {
      role: k.portalRole,
      user: k.userName,
      date: k.today,
      employeeCount: k.employees.length,
      employees: k.employees.map((e) => ({
        id: e.id,
        name: e.name,
        department: e.department,
        role: e.role,
        status: e.status,
        email: e.email,
      })),
      presentToday: k.presentToday,
      lateToday: k.lateToday,
      onLeaveToday: k.onLeaveToday,
      pendingLeaves: k.pendingLeaves.map((l) => ({
        employee: l.employeeName,
        type: l.type,
        from: l.from,
        to: l.to,
        status: l.status,
      })),
      payrollTotal: k.payrollTotal,
      payroll: k.payrollRecords.map((p) => ({
        employeeId: p.employeeId,
        net: p.net,
        month: p.month,
      })),
      todayAttendance: k.todayAttendance,
      jobs: k.jobPostings.map((j) => ({
        title: j.title,
        department: j.department,
        status: j.status,
        applicants: j.applicants,
      })),
      holidaysUpcoming: k.holidays.filter((h) => h.date >= k.today).slice(0, 5),
      tasks: k.tasks,
      activity: k.activityFeed.slice(0, 5),
      documentTemplates: k.documentTemplates.map((t) => t.title),
      adminStats: k.adminStats,
      managerKpis: k.managerKpis,
      platformKpis: k.platformKpis,
      policies: POLICY,
    },
    null,
    0,
  )
}

export function getFallbackFromKnowledge(k, message, role) {
  const nav = findNavActions(message, role, 2)
  if (nav.length) {
    return { text: 'I can take you to the right page:', actions: nav }
  }
  return {
    text: `I have access to ${k.employees.length} employees, ${k.pendingLeaves.length} pending leaves, attendance, payroll, jobs, and documents. Try:\n• "Who is on leave today?"\n• "Tell me about Arjun Mehta"\n• "Total payroll"\n• "Open employees"`,
    actions: getBrowseMenuActions(role, 5),
  }
}
