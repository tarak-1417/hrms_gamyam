/** Platform-only categories — hidden from HR Admin (view-only, HR scope) */
export const PLATFORM_AUDIT_CATEGORIES = new Set([
  'platform',
  'user',
  'security',
  'subscription',
])

export const AUDIT_CATEGORIES = [
  { id: 'all', label: 'All categories' },
  { id: 'employee', label: 'Employees' },
  { id: 'leave', label: 'Leave' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'recruitment', label: 'Recruitment' },
  { id: 'document', label: 'Documents' },
  { id: 'organization', label: 'Organization' },
  { id: 'settings', label: 'Settings' },
  { id: 'platform', label: 'Platform' },
  { id: 'user', label: 'Users' },
  { id: 'security', label: 'Security' },
]

export function auditActorFromUser(user) {
  if (!user) {
    return { actorName: 'System', actorRole: 'system', actorEmail: '' }
  }
  return {
    actorName: user.name || user.email || 'User',
    actorRole: user.role || 'unknown',
    actorEmail: user.email || '',
  }
}

export function filterAuditLogsForRole(logs, role) {
  const list = logs ?? []
  if (role === 'superadmin') return list
  if (role === 'admin') {
    return list.filter(
      (log) =>
        log.scope === 'hr' &&
        !PLATFORM_AUDIT_CATEGORIES.has(log.category),
    )
  }
  return []
}

export function filterAuditLogs(logs, { category, search, actorRole }) {
  let list = logs ?? []
  if (category && category !== 'all') {
    list = list.filter((l) => l.category === category)
  }
  if (actorRole && actorRole !== 'all') {
    list = list.filter((l) => l.actorRole === actorRole)
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    list = list.filter(
      (l) =>
        l.action?.toLowerCase().includes(q) ||
        l.actorName?.toLowerCase().includes(q) ||
        l.targetLabel?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q),
    )
  }
  return list
}

export function formatAuditTimestamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatAuditRelative(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatAuditTimestamp(iso)
}

export function categoryLabel(category) {
  return AUDIT_CATEGORIES.find((c) => c.id === category)?.label ?? category
}

export function exportAuditLogsCsv(logs) {
  const headers = [
    'Timestamp',
    'Actor',
    'Role',
    'Action',
    'Category',
    'Target',
    'Details',
    'Scope',
  ]
  const rows = logs.map((l) => [
    l.timestamp,
    l.actorName,
    l.actorRole,
    l.action,
    l.category,
    l.targetLabel,
    l.details,
    l.scope,
  ])
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
}
