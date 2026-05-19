/** Sidebar destinations per portal role — used by AI for “go to …” actions */

export const NAV_BY_ROLE = {
  admin: [
    { label: 'Dashboard', path: '/admin', keywords: ['dashboard', 'home', 'overview', 'hr dashboard'] },
    { label: 'Employees', path: '/admin/employees', keywords: ['employee', 'staff', 'people', 'hire', 'bulk import'] },
    { label: 'Attendance', path: '/admin/attendance', keywords: ['attendance', 'check in', 'check out', 'present', 'late'] },
    { label: 'Leave', path: '/admin/leave', keywords: ['leave', 'approval', 'pending leave', 'vacation'] },
    { label: 'Payroll', path: '/admin/payroll', keywords: ['payroll', 'salary', 'payslip', 'net pay'] },
    { label: 'Recruitment', path: '/admin/recruitment', keywords: ['recruitment', 'job', 'hiring', 'posting'] },
    { label: 'Documents', path: '/admin/documents', keywords: ['document', 'template', 'letter'] },
    { label: 'Departments', path: '/admin/departments', keywords: ['department', 'team', 'org'] },
    { label: 'Reports', path: '/admin/reports', keywords: ['report', 'analytics', 'chart'] },
    { label: 'Roles', path: '/admin/roles', keywords: ['role', 'permission', 'access'] },
    { label: 'Settings', path: '/admin/settings', keywords: ['setting', 'company', 'policy', 'geo'] },
  ],
  manager: [
    { label: 'Home', path: '/manager', keywords: ['dashboard', 'home', 'overview'] },
    { label: 'My Team', path: '/manager/team', keywords: ['team', 'member', 'engineering'] },
    { label: 'Department', path: '/manager/departments', keywords: ['department', 'org'] },
    { label: 'Attendance', path: '/manager/attendance', keywords: ['attendance', 'present', 'late'] },
    { label: 'Leave', path: '/manager/leave', keywords: ['leave', 'approval', 'pending'] },
    { label: 'Reports', path: '/manager/reports', keywords: ['report', 'analytics'] },
  ],
  superadmin: [
    { label: 'Overview', path: '/superadmin', keywords: ['overview', 'dashboard', 'home', 'platform'] },
    { label: 'Organizations', path: '/superadmin/companies', keywords: ['compan', 'tenant', 'client', 'organization'] },
    { label: 'Users', path: '/superadmin/users', keywords: ['user', 'admin', 'password', 'role'] },
    { label: 'Org setup', path: '/superadmin/organization', keywords: ['department', 'branch', 'designation'] },
    { label: 'Permissions', path: '/superadmin/permissions', keywords: ['permission', 'access'] },
    { label: 'Global settings', path: '/superadmin/settings', keywords: ['settings', 'global', 'platform'] },
    { label: 'Audit logs', path: '/superadmin/audit-logs', keywords: ['audit', 'log', 'security', 'monitor'] },
    { label: 'Recycle bin', path: '/superadmin/trash', keywords: ['trash', 'delete', 'restore', 'recovery', 'recycle'] },
    { label: 'HR employees', path: '/superadmin/hr/employees', keywords: ['employee', 'hr', 'staff'] },
    { label: 'Documents', path: '/superadmin/documents', keywords: ['document', 'template'] },
    { label: 'Subscriptions', path: '/superadmin/subscriptions', keywords: ['subscription', 'plan'] },
    { label: 'Monitoring', path: '/superadmin/monitoring', keywords: ['monitor', 'uptime', 'health'] },
    { label: 'Analytics', path: '/superadmin/analytics', keywords: ['analytics', 'growth', 'metric'] },
    { label: 'Billing', path: '/superadmin/billing', keywords: ['billing', 'invoice', 'security'] },
  ],
  employee: [
    { label: 'Dashboard', path: '/employee', keywords: ['dashboard', 'home'] },
    { label: 'Profile', path: '/employee/profile', keywords: ['profile', 'personal'] },
    { label: 'Attendance', path: '/employee/attendance', keywords: ['attendance', 'check in', 'check out'] },
    { label: 'Leave', path: '/employee/leave', keywords: ['leave', 'holiday', 'balance'] },
    { label: 'Payslips', path: '/employee/payslips', keywords: ['payslip', 'salary', 'payroll'] },
    { label: 'Tasks', path: '/employee/tasks', keywords: ['task', 'todo'] },
    { label: 'Documents', path: '/employee/documents', keywords: ['document'] },
    { label: 'Performance', path: '/employee/performance', keywords: ['performance', 'review'] },
    { label: 'Messages', path: '/employee/communication', keywords: ['message', 'communication'] },
  ],
}

export const CHAT_STARTERS = {
  admin: ['HR summary', 'Who is on leave?', 'Pending leaves', 'Arjun Mehta salary'],
  manager: ['Team summary', 'Who is late?', 'Pending approvals', 'List my team'],
  superadmin: ['Platform summary', 'List companies', 'MRR & uptime', 'Open monitoring'],
  employee: ['My salary', 'Attendance today', 'Leave balance', 'My open tasks'],
}

export function findNavActions(query, role, limit = 2) {
  const items = NAV_BY_ROLE[role] || []
  const q = query.toLowerCase()
  const matched = items.filter(
    (item) =>
      item.keywords.some((kw) => q.includes(kw)) ||
      q.includes(item.label.toLowerCase()) ||
      q.includes('go to') && q.includes(item.label.toLowerCase().split(' ')[0]),
  )
  return matched.slice(0, limit).map((item) => ({
    label: `Open ${item.label}`,
    path: item.path,
  }))
}

export function getQuickNavActions(role, ids) {
  const items = NAV_BY_ROLE[role] || []
  const byPath = Object.fromEntries(items.map((i) => [i.path, i]))
  return ids
    .map((path) => byPath[path])
    .filter(Boolean)
    .map((item) => ({ label: `Open ${item.label}`, path: item.path }))
}

export function getBrowseMenuActions(role, limit = 5) {
  return (NAV_BY_ROLE[role] || []).slice(0, limit).map((item) => ({
    label: item.label,
    path: item.path,
  }))
}
