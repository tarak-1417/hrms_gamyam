import { formatDisplayDate, formatLeaveDateRange, formatLeaveDuration } from './timeUtils'

function toSortableDate(value) {
  if (!value) return ''
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T12:00:00`
  return raw
}

export function formatActivityWhen(value) {
  if (!value) return 'Recently'
  const date = new Date(toSortableDate(value))
  if (Number.isNaN(date.getTime())) return 'Recently'

  const now = new Date()
  const hasTime = String(value).includes('T') || /\d{1,2}:\d{2}/.test(String(value))
  if (hasTime) {
    const diffHours = Math.floor((now - date) / 3600000)
    if (diffHours < 1) return 'Just now'
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
  }

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const compare = new Date(date)
  compare.setHours(12, 0, 0, 0)
  const diffDays = Math.round((today - compare) / 86400000)

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatLeaveActivityDetail(leave) {
  const type = leave.type || 'Leave'
  const range = formatLeaveDateRange(leave)
  const duration = formatLeaveDuration(leave)
  return `${type} · ${range} · ${duration}`
}

function leaveActivityCopy(leave) {
  const detail = formatLeaveActivityDetail(leave)
  if (leave.status === 'approved') {
    return { title: 'Leave request approved', description: detail }
  }
  if (leave.status === 'rejected') {
    return { title: 'Leave request declined', description: detail }
  }
  return { title: 'Leave request submitted', description: detail }
}

function reimbursementActivityCopy(request) {
  const amount = Number(request.amount)
  const amountLabel = Number.isFinite(amount)
    ? `₹${amount.toLocaleString('en-IN')}`
    : 'Expense'
  const expenseDate = request.expenseDate ? formatDisplayDate(request.expenseDate) : null
  const detail = [request.expenseType || 'Reimbursement', amountLabel, expenseDate]
    .filter(Boolean)
    .join(' · ')

  if (request.status === 'approved') {
    return { title: 'Reimbursement claim approved', description: detail }
  }
  if (request.status === 'rejected') {
    return { title: 'Reimbursement claim declined', description: detail }
  }
  return { title: 'Reimbursement claim submitted', description: detail }
}

/**
 * Build a merged recent-activity list for the employee dashboard.
 */
export function buildEmployeeRecentActivities({
  employeeId,
  leaveRequests = [],
  reimbursementRequests = [],
  payrollRecords = [],
  activityFeed = [],
  limit = 8,
}) {
  if (!employeeId) return []

  const items = []

  leaveRequests
    .filter((leave) => leave.employeeId === employeeId)
    .forEach((leave) => {
      const sortKey = toSortableDate(leave.submittedAt || leave.from)
      const copy = leaveActivityCopy(leave)
      items.push({
        id: `leave-${leave.id}`,
        type: 'leave',
        category: 'personal',
        title: copy.title,
        description: copy.description,
        time: formatActivityWhen(leave.submittedAt || leave.from),
        sortKey,
        link: '/employee/leave',
        status: leave.status,
      })
    })

  reimbursementRequests
    .filter((request) => request.employeeId === employeeId)
    .forEach((request) => {
      const sortKey = toSortableDate(request.reviewedAt || request.submittedAt || request.expenseDate)
      const copy = reimbursementActivityCopy(request)
      items.push({
        id: `reimbursement-${request.id}`,
        type: 'reimbursement',
        category: 'personal',
        title: copy.title,
        description: copy.description,
        time: formatActivityWhen(
          request.status === 'pending'
            ? request.submittedAt || request.expenseDate
            : request.reviewedAt || request.submittedAt || request.expenseDate,
        ),
        sortKey,
        link: '/employee/reimbursements',
        status: request.status,
      })
    })

  payrollRecords
    .filter((record) => record.employeeId === employeeId)
    .forEach((record) => {
      const monthParsed = record.month ? new Date(`${record.month} 1`) : null
      const monthKey =
        monthParsed && !Number.isNaN(monthParsed.getTime()) ? monthParsed.toISOString() : ''
      const sortKey = toSortableDate(record.generatedAt) || monthKey || `payroll-${record.id}`
      items.push({
        id: `payroll-${record.id}`,
        type: 'payroll',
        category: 'personal',
        title: record.month ? `${record.month} payslip generated` : 'Payslip generated',
        description: record.net
          ? `Net pay ₹${Number(record.net).toLocaleString('en-IN')}`
          : 'Salary slip available',
        time: record.month || formatActivityWhen(record.generatedAt) || 'Recently',
        sortKey,
        link: '/employee/payslips',
        status: 'available',
      })
    })

  activityFeed
    .filter((item) => item.type !== 'attendance')
    .forEach((item, index) => {
      items.push({
        id: `company-${item.id}`,
        type: item.type,
        category: 'company',
        title: item.user,
        description: item.action,
        time: item.time,
        sortKey: `company-${String(1000 - index).padStart(4, '0')}`,
        link: null,
        status: null,
      })
    })

  const personal = items
    .filter((item) => item.category === 'personal')
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))

  const company = items.filter((item) => item.category === 'company')

  return [...personal, ...company].slice(0, limit)
}
