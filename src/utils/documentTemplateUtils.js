import { estimatePayroll } from '../store/hrmsHelpers'
import { getCompanyMergeDefaults, getBranchById, getEmployeeManagerName } from './organizationHelpers'

const FALLBACK_COMPANY = {
  name: 'Gamyam Technologies Pvt. Ltd.',
  location: 'Hyderabad, Telangana',
  hrSignatory: 'Sneha Reddy',
}

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All templates' },
  { id: 'hiring', label: 'Hiring' },
  { id: 'employment', label: 'Employment' },
  { id: 'exit', label: 'Exit' },
  { id: 'compliance', label: 'Compliance' },
]

export const FIELD_TYPES = [
  { id: 'text', label: 'Text' },
  { id: 'date', label: 'Date' },
  { id: 'textarea', label: 'Long text' },
  { id: 'number', label: 'Number' },
]

export const FIELD_SOURCES = [
  { id: 'employee', label: 'From employee record', hint: 'Auto-filled when generating' },
  { id: 'company', label: 'Company default', hint: 'Filled from company settings' },
  { id: 'custom', label: 'HR fills each time', hint: 'Shown when generating document' },
]

/** Standard placeholders HR can add to any template */
export const STANDARD_FIELD_LIBRARY = [
  { key: 'letter_date', label: 'Letter date', type: 'date', source: 'company' },
  { key: 'company_name', label: 'Company name', type: 'text', source: 'company' },
  { key: 'employee_name', label: 'Employee name', type: 'text', source: 'employee' },
  { key: 'employee_email', label: 'Employee email', type: 'text', source: 'employee' },
  { key: 'employee_id', label: 'Employee ID', type: 'text', source: 'employee' },
  { key: 'department', label: 'Department', type: 'text', source: 'employee' },
  { key: 'role', label: 'Job title / role', type: 'text', source: 'employee' },
  { key: 'join_date', label: 'Joining date', type: 'date', source: 'employee' },
  { key: 'phone', label: 'Phone', type: 'text', source: 'employee' },
  { key: 'address', label: 'Address', type: 'text', source: 'employee' },
  { key: 'annual_ctc', label: 'Annual CTC', type: 'text', source: 'employee' },
  { key: 'monthly_net', label: 'Monthly net salary', type: 'text', source: 'employee' },
  { key: 'work_location', label: 'Work location', type: 'text', source: 'company' },
  { key: 'reporting_manager', label: 'Reporting manager', type: 'text', source: 'company' },
  { key: 'hr_signatory', label: 'HR signatory name', type: 'text', source: 'company' },
  { key: 'probation_period', label: 'Probation period', type: 'text', source: 'custom', defaultValue: '3 months' },
  { key: 'notice_period', label: 'Notice period', type: 'text', source: 'custom', defaultValue: '30 days' },
  { key: 'offer_validity', label: 'Offer validity', type: 'text', source: 'custom', defaultValue: '7 days' },
  { key: 'relieving_date', label: 'Relieving date', type: 'date', source: 'custom' },
  { key: 'revision_effective_date', label: 'Salary revision date', type: 'date', source: 'custom' },
  { key: 'warning_reason', label: 'Warning reason', type: 'textarea', source: 'custom' },
  { key: 'bond_period', label: 'Bond / commitment period', type: 'text', source: 'custom' },
  { key: 'designation', label: 'Designation', type: 'text', source: 'custom' },
]

const LIBRARY_BY_KEY = Object.fromEntries(STANDARD_FIELD_LIBRARY.map((f) => [f.key, f]))

export function slugifyFieldKey(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
}

export function extractPlaceholdersFromBody(body) {
  if (!body) return []
  const matches = body.matchAll(/\{\{(\w+)\}\}/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

export function fieldFromKey(key) {
  if (LIBRARY_BY_KEY[key]) return { ...LIBRARY_BY_KEY[key] }
  return {
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    type: 'text',
    source: 'custom',
  }
}

export function normalizeTemplate(template) {
  if (!template) return template
  if (template.fields?.length) {
    return {
      ...template,
      fields: template.fields.map((f) => ({
        ...fieldFromKey(f.key),
        ...f,
        key: f.key,
      })),
    }
  }
  const keys = extractPlaceholdersFromBody(template.body)
  return {
    ...template,
    fields: keys.map((key) => fieldFromKey(key)),
  }
}

export function formatInr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function buildMergeData(employee, overrides = {}, orgContext = null) {
  const today = new Date().toISOString().slice(0, 10)
  const organization = orgContext?.organization
  const employees = orgContext?.employees || []
  const branches = orgContext?.branches || []
  const companyDefaults = organization
    ? getCompanyMergeDefaults(organization, employees, branches)
    : {
        company_name: FALLBACK_COMPANY.name,
        work_location: FALLBACK_COMPANY.location,
        hr_signatory: FALLBACK_COMPANY.hrSignatory,
        reporting_manager: 'Priya Sharma',
      }

  const branch = employee?.branchId ? getBranchById(branches, employee.branchId) : null
  const workLocation = branch
    ? `${branch.name}${branch.city ? `, ${branch.city}` : ''}`
    : companyDefaults.work_location

  const reportingManager = employee?.managerId
    ? getEmployeeManagerName(employees, employee.managerId)
    : companyDefaults.reporting_manager

  const base = {
    letter_date: today,
    company_name: companyDefaults.company_name,
    work_location: workLocation,
    hr_signatory: companyDefaults.hr_signatory,
    reporting_manager: reportingManager,
    relieving_date: today,
    revision_effective_date: today,
    warning_reason: '',
    probation_period: '3 months',
    notice_period: '30 days',
    offer_validity: '7 days',
    bond_period: '',
    designation: '',
    ...overrides,
  }

  if (!employee) return base

  const payroll = estimatePayroll(employee)
  const annualCtc = payroll.net * 12

  return {
    ...base,
    employee_name: employee.name,
    employee_email: employee.email,
    employee_id: employee.id,
    department: employee.department,
    role: employee.role,
    join_date: employee.joinDate,
    phone: employee.phone || '—',
    address: employee.address || workLocation,
    annual_ctc: formatInr(annualCtc),
    monthly_net: formatInr(payroll.net),
    designation: employee.role,
  }
}

export function getDefaultFieldValues(template, employee, orgContext = null) {
  const merge = buildMergeData(employee, {}, orgContext)
  const values = { ...merge }
  const fields = normalizeTemplate(template).fields ?? []
  fields.forEach((f) => {
    if (f.source === 'custom' && f.defaultValue != null && values[f.key] === '') {
      values[f.key] = f.defaultValue
    }
    if (f.defaultValue != null && (values[f.key] == null || values[f.key] === '')) {
      values[f.key] = f.defaultValue
    }
  })
  return values
}

export function renderTemplate(body, mergeData) {
  if (!body) return ''
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = mergeData[key]
    if (val == null || val === '') return `{{${key}}}`
    return String(val)
  })
}

export function categoryLabel(category) {
  return TEMPLATE_CATEGORIES.find((c) => c.id === category)?.label ?? category
}

export function sourceLabel(source) {
  return FIELD_SOURCES.find((s) => s.id === source)?.label ?? source
}

export const EMPTY_TEMPLATE_FORM = {
  title: '',
  category: 'hiring',
  description: '',
  body: '',
  fields: [],
}

/** Safe filename for downloads */
export function generatedDocumentFilename(doc) {
  const base = [doc.templateTitle, doc.employeeName, doc.generatedAt]
    .filter(Boolean)
    .join('-')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
  return `${base || 'document'}.txt`
}

export function downloadGeneratedDocument(doc) {
  const text =
    doc.content?.trim() ||
    `${doc.templateTitle}\nEmployee: ${doc.employeeName}\nDate: ${doc.generatedAt}\n`
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = generatedDocumentFilename(doc)
  a.click()
  URL.revokeObjectURL(url)
}

/** Web Share API or clipboard fallback; returns mode for toast messaging */
export async function shareGeneratedDocument(doc) {
  const text =
    doc.content?.trim() ||
    `${doc.templateTitle} — ${doc.employeeName} (${doc.generatedAt})`
  const title = `${doc.templateTitle} — ${doc.employeeName}`
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return 'copied'
  }
  return 'unsupported'
}
