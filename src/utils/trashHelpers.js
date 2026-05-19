import { syncOfficeLocationsFromBranches } from './organizationHelpers'

export const TRASH_ENTITY_TYPES = [
  { id: 'all', label: 'All types' },
  { id: 'employee', label: 'Employee' },
  { id: 'payroll', label: 'Payroll record' },
  { id: 'leave', label: 'Leave request' },
  { id: 'department', label: 'Department' },
  { id: 'designation', label: 'Designation' },
  { id: 'branch', label: 'Branch / location' },
  { id: 'documentTemplate', label: 'Document template' },
  { id: 'jobPosting', label: 'Job posting' },
  { id: 'platformOrganization', label: 'Platform organization' },
  { id: 'platformUser', label: 'Platform user' },
]

export function trashEntityLabel(type) {
  return TRASH_ENTITY_TYPES.find((t) => t.id === type)?.label ?? type
}

export function deletedByFromAudit(audit) {
  if (!audit) return { name: 'System', role: 'system', email: '' }
  return {
    name: audit.actorName || 'System',
    role: audit.actorRole || 'system',
    email: audit.actorEmail || '',
  }
}

export function pushTrashEntry(state, entry) {
  const id = state.trashNextId ?? 500
  state.trashNextId = id + 1
  if (!state.trash) state.trash = []
  state.trash.unshift({
    id,
    entityType: entry.entityType,
    entityId: String(entry.entityId ?? ''),
    label: entry.label || entry.entityType,
    scope: entry.scope || 'hr',
    deletedAt: new Date().toISOString(),
    deletedBy: entry.deletedBy || { name: 'System', role: 'system', email: '' },
    data: entry.data || {},
  })
}

function restoreEmployee(state, data) {
  const { employee, payrollRecords = [] } = data
  if (!employee) return false
  if (state.employees.some((e) => e.id === employee.id)) return false
  state.employees.push(employee)
  payrollRecords.forEach((p) => {
    if (!state.payrollRecords.some((r) => r.id === p.id)) {
      state.payrollRecords.push(p)
    }
  })
  return true
}

function restorePayroll(state, data) {
  const { record } = data
  if (!record) return false
  if (state.payrollRecords.some((p) => p.id === record.id)) return false
  state.payrollRecords.push(record)
  return true
}

function restoreLeave(state, data) {
  const { leave } = data
  if (!leave) return false
  if (state.leaveRequests.some((l) => l.id === leave.id)) return false
  state.leaveRequests.push(leave)
  return true
}

function restoreDepartment(state, data) {
  const { department } = data
  if (!department) return false
  if (state.departments.some((d) => d.id === department.id)) return false
  state.departments.push(department)
  return true
}

function restoreDesignation(state, data) {
  const { designation } = data
  if (!designation) return false
  if (state.designations.some((d) => d.id === designation.id)) return false
  state.designations.push(designation)
  return true
}

function restoreBranch(state, data) {
  const { branch } = data
  if (!branch) return false
  if (state.branches.some((b) => b.id === branch.id)) return false
  state.branches.push(branch)
  if (state.attendancePolicy) {
    state.attendancePolicy.officeLocations = syncOfficeLocationsFromBranches(
      state.branches,
      state.attendancePolicy.radiusMeters,
    )
  }
  return true
}

function restoreDocumentTemplate(state, data) {
  const { template } = data
  if (!template) return false
  if ((state.documentTemplates || []).some((t) => t.id === template.id)) return false
  if (!state.documentTemplates) state.documentTemplates = []
  state.documentTemplates.push(template)
  return true
}

function restoreJobPosting(state, data) {
  const { job } = data
  if (!job) return false
  if ((state.jobPostings || []).some((j) => j.id === job.id)) return false
  if (!state.jobPostings) state.jobPostings = []
  state.jobPostings.push(job)
  return true
}

/** Restore HR trash item into hrms state */
export function restoreTrashItemToHrms(state, item) {
  switch (item.entityType) {
    case 'employee':
      return restoreEmployee(state, item.data)
    case 'payroll':
      return restorePayroll(state, item.data)
    case 'leave':
      return restoreLeave(state, item.data)
    case 'department':
      return restoreDepartment(state, item.data)
    case 'designation':
      return restoreDesignation(state, item.data)
    case 'branch':
      return restoreBranch(state, item.data)
    case 'documentTemplate':
      return restoreDocumentTemplate(state, item.data)
    case 'jobPosting':
      return restoreJobPosting(state, item.data)
    default:
      return false
  }
}

export function formatTrashDeletedAt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
