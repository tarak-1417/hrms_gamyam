import { NAV_BY_ROLE } from './aiNavigation'

function matchesQuery(text, q) {
  if (!text) return false
  return text.toLowerCase().includes(q)
}

function scoreMatch(text, q) {
  const t = text.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 50
  return 0
}

/**
 * @returns {{ id: string, type: string, title: string, subtitle: string, path: string, score: number }[]}
 */
export function runGlobalSearch(query, { role, user, employees = [], leaveRequests = [], jobPostings = [], documentTemplates = [] }) {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 1) return []

  const results = []

  const navItems = NAV_BY_ROLE[role] || []
  navItems.forEach((item) => {
    const haystack = [item.label, ...(item.keywords || [])].join(' ')
    const score = Math.max(scoreMatch(item.label, q), ...item.keywords.map((k) => scoreMatch(k, q)))
    if (matchesQuery(haystack, q) || score > 0) {
      results.push({
        id: `page-${item.path}`,
        type: 'page',
        title: item.label,
        subtitle: 'Page',
        path: item.path,
        score: score + 30,
      })
    }
  })

  let scopedEmployees = employees
  if (role === 'manager') {
    scopedEmployees = employees.filter((e) => e.department === 'Engineering')
  } else if (role === 'employee') {
    scopedEmployees = employees.filter((e) => e.id === user?.employeeId)
  }

  const employeePath =
    role === 'admin'
      ? '/admin/employees'
      : role === 'manager'
        ? '/manager/team'
        : '/employee/profile'

  scopedEmployees.forEach((emp) => {
    const haystack = [emp.name, emp.email, emp.id, emp.department, emp.role, emp.status].join(' ')
    if (!matchesQuery(haystack, q)) return
    const score =
      Math.max(
        scoreMatch(emp.name, q),
        scoreMatch(emp.email, q),
        scoreMatch(emp.id, q),
        scoreMatch(emp.department, q),
      ) + 20
    results.push({
      id: `emp-${emp.id}`,
      type: 'employee',
      title: emp.name,
      subtitle: `${emp.department} · ${emp.role}`,
      path: employeePath,
      searchHint: emp.name,
      score,
    })
  })

  if (role !== 'employee') {
    leaveRequests.forEach((leave) => {
      const haystack = [leave.employeeName, leave.type, leave.status, leave.reason].join(' ')
      if (!matchesQuery(haystack, q)) return
      const leavePath = role === 'manager' ? '/manager/leave' : '/admin/leave'
      results.push({
        id: `leave-${leave.id}`,
        type: 'leave',
        title: `${leave.employeeName} — ${leave.type}`,
        subtitle: `${leave.from} to ${leave.to} · ${leave.status}`,
        path: leavePath,
        score: scoreMatch(leave.employeeName, q) + 15,
      })
    })
  } else {
    leaveRequests
      .filter((l) => l.employeeId === user?.employeeId)
      .forEach((leave) => {
        const haystack = [leave.type, leave.status, leave.reason].join(' ')
        if (!matchesQuery(haystack, q)) return
        results.push({
          id: `leave-${leave.id}`,
          type: 'leave',
          title: leave.type,
          subtitle: `${leave.from} to ${leave.to} · ${leave.status}`,
          path: '/employee/leave',
          score: 40,
        })
      })
  }

  if (role === 'admin' || role === 'superadmin') {
    jobPostings.forEach((job) => {
      const haystack = [job.title, job.department, job.location, job.status].join(' ')
      if (!matchesQuery(haystack, q)) return
      results.push({
        id: `job-${job.id}`,
        type: 'job',
        title: job.title,
        subtitle: `${job.department} · ${job.status}`,
        path: role === 'admin' ? '/admin/recruitment' : '/superadmin',
        score: scoreMatch(job.title, q) + 10,
      })
    })
  }

  documentTemplates.forEach((doc) => {
    const haystack = [doc.title, doc.category, doc.description].join(' ')
    if (!matchesQuery(haystack, q)) return
    const docPath =
      role === 'admin'
        ? '/admin/documents'
        : role === 'superadmin'
          ? '/superadmin/documents'
          : '/employee/documents'
    results.push({
      id: `doc-${doc.id}`,
      type: 'document',
      title: doc.title,
      subtitle: doc.category,
      path: docPath,
      score: scoreMatch(doc.title, q) + 8,
    })
  })

  if (role === 'superadmin') {
    const platformTerms = [
      { title: 'Companies', path: '/superadmin/companies', keys: ['company', 'tenant', 'gamyam', 'acme'] },
      { title: 'Subscriptions', path: '/superadmin/subscriptions', keys: ['subscription', 'plan'] },
      { title: 'Monitoring', path: '/superadmin/monitoring', keys: ['monitor', 'uptime', 'health'] },
      { title: 'Analytics', path: '/superadmin/analytics', keys: ['analytics', 'growth'] },
      { title: 'Billing', path: '/superadmin/billing', keys: ['billing', 'revenue', 'mrr'] },
    ]
    platformTerms.forEach((p) => {
      if (p.keys.some((k) => matchesQuery(k, q)) || matchesQuery(p.title, q)) {
        results.push({
          id: `sa-${p.path}`,
          type: 'page',
          title: p.title,
          subtitle: 'Platform',
          path: p.path,
          score: 25,
        })
      }
    })
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

export const SEARCH_TYPE_LABELS = {
  page: 'Pages',
  employee: 'People',
  leave: 'Leave',
  job: 'Jobs',
  document: 'Documents',
}
