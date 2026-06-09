import * as XLSX from 'xlsx'
import { resolvePayroll, DEFAULT_PAYROLL_MONTH } from '../store/hrmsHelpers'

/**
 * Excel columns match Gamyam employee records (same as demo data in hrmsData.json).
 * Row order in the sheet = order employees appear after import.
 */
export const EMPLOYEE_IMPORT_COLUMNS = [
  { key: 'name', aliases: ['name', 'full_name', 'employee_name', 'employee'] },
  { key: 'email', aliases: ['email', 'email_address', 'work_email', 'company_email'] },
  { key: 'department', aliases: ['department', 'dept', 'team', 'division'] },
  { key: 'role', aliases: ['role', 'job_title', 'designation', 'position', 'title'] },
  { key: 'status', aliases: ['status', 'employment_status', 'employee_status'] },
  { key: 'joinDate', aliases: ['join_date', 'joining_date', 'date_of_joining', 'doj', 'start_date'] },
  { key: 'phone', aliases: ['phone', 'mobile', 'contact', 'phone_number'] },
  { key: 'address', aliases: ['address', 'location', 'city', 'work_location'] },
  {
    key: 'payrollMonth',
    aliases: ['payroll_month', 'salary_month', 'month', 'pay_month'],
  },
  {
    key: 'annualCtc',
    aliases: ['annual_ctc', 'ctc', 'annual_salary', 'yearly_ctc', 'package'],
  },
  { key: 'basic', aliases: ['basic', 'basic_salary', 'basic_pay', 'monthly_basic'] },
  { key: 'hra', aliases: ['hra', 'house_rent_allowance'] },
  { key: 'lta', aliases: ['lta', 'leave_travel_allowance'] },
  { key: 'bonus', aliases: ['bonus', 'monthly_bonus'] },
  {
    key: 'specialAllowance',
    aliases: ['special_allowance', 'specialallowance', 'special', 'residual_allowance'],
  },
  { key: 'allowances', aliases: ['allowances', 'allowance', 'monthly_allowances'] },
  { key: 'professionalTax', aliases: ['professional_tax', 'pt', 'prof_tax'] },
  {
    key: 'healthInsurance',
    aliases: ['health_insurance', 'insurance', 'medical_insurance'],
  },
  { key: 'tds', aliases: ['tds', 'income_tax'] },
  { key: 'otherDeductions', aliases: ['other_deductions', 'other_deduction'] },
  { key: 'deductions', aliases: ['deductions', 'deduction', 'monthly_deductions', 'pf_etc'] },
  { key: 'net', aliases: ['net', 'net_salary', 'take_home', 'monthly_net'] },
  {
    key: 'legacyEmployeeId',
    aliases: ['legacy_id', 'previous_id', 'old_employee_id', 'external_id', 'source_id'],
  },
]

/** Header row — same fields as demo employees + monthly payroll */
export const EXCEL_HEADERS = [
  'name',
  'email',
  'department',
  'role',
  'status',
  'join_date',
  'phone',
  'address',
  'payroll_month',
  'annual_ctc',
  'basic',
  'hra',
  'lta',
  'bonus',
  'special_allowance',
  'professional_tax',
  'health_insurance',
  'tds',
  'other_deductions',
]

/** Example rows copied from app demo data (hrmsData.json employees + payroll) */
export const EXCEL_SAMPLE_ROWS = [
  [
    'Arjun Mehta',
    'arjun@company.com',
    'Engineering',
    'Senior Developer',
    'active',
    '2022-03-15',
    '+91 98765 43210',
    'Hyderabad, Telangana',
    'April 2026',
    924000,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'Sneha Reddy',
    'sneha@company.com',
    'Human Resources',
    'HR Manager',
    'active',
    '2021-08-01',
    '+91 98765 43211',
    '',
    'April 2026',
    1080000,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'Rahul Verma',
    'rahul@company.com',
    'Sales',
    'Sales Executive',
    'active',
    '2023-01-10',
    '+91 98765 43212',
    '',
    'April 2026',
    636000,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'Kavya Nair',
    'kavya@company.com',
    'Marketing',
    'Marketing Lead',
    'on-leave',
    '2020-11-20',
    '+91 98765 43213',
    '',
    'April 2026',
    1032000,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'Dev Patel',
    'dev@company.com',
    'Finance',
    'Accountant',
    'active',
    '2022-07-05',
    '+91 98765 43214',
    '',
    'April 2026',
    732000,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  [
    'Isha Gupta',
    'isha@company.com',
    'Engineering',
    'UI Designer',
    'active',
    '2023-06-12',
    '+91 98765 43215',
    '',
    'April 2026',
    678000,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
]

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function parseDate(val) {
  if (val == null || val === '') return null

  if (typeof val === 'number' && val > 20000 && val < 60000) {
    const parsed = XLSX.SSF.parse_date_code(val)
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
    }
  }

  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10)
  }

  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (dmy) {
    const [, day, month, year] = dmy
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

function normalizeStatus(val) {
  const s = String(val || 'active')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
  if (['active', 'on-leave', 'inactive'].includes(s)) return s
  if (s === 'onleave' || s === 'leave') return 'on-leave'
  return 'active'
}

function rowHasData(rawRow) {
  return Object.values(rawRow).some((v) => v != null && String(v).trim() !== '')
}

function mapRowToEmployee(rawRow, existingEmails) {
  const normalized = {}
  Object.entries(rawRow).forEach(([k, v]) => {
    normalized[normalizeHeader(k)] = v
  })

  const get = (key) => {
    const col = EMPLOYEE_IMPORT_COLUMNS.find((c) => c.key === key)
    if (!col) return ''
    for (const alias of col.aliases) {
      const val = normalized[alias]
      if (val != null && String(val).trim() !== '') return String(val).trim()
    }
    return ''
  }

  const name = get('name')
  const email = get('email').toLowerCase()
  const role = get('role')

  if (!name) return { error: 'Missing name' }
  if (!email) return { error: 'Missing email' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Invalid email' }
  if (!role) return { error: 'Missing role' }
  if (existingEmails.has(email)) return { error: 'Email already in system' }

  const joinDate = parseDate(get('joinDate') || normalized.join_date) || todayIso()

  const department = get('department') || 'Engineering'
  const payrollInput = {
    month: get('payrollMonth') || DEFAULT_PAYROLL_MONTH,
    annualCtc: get('annualCtc'),
    basic: get('basic'),
    hra: get('hra'),
    lta: get('lta'),
    bonus: get('bonus'),
    specialAllowance: get('specialAllowance'),
    professionalTax: get('professionalTax'),
    healthInsurance: get('healthInsurance'),
    tds: get('tds'),
    otherDeductions: get('otherDeductions'),
    allowances: get('allowances'),
    deductions: get('deductions'),
    net: get('net'),
  }
  const payroll = resolvePayroll(
    {
      id: '',
      department,
      role,
    },
    payrollInput,
  )

  return {
    ok: true,
    employee: {
      name,
      email,
      department,
      role,
      phone: get('phone') || '—',
      address: get('address') || '',
      joinDate,
      status: normalizeStatus(get('status')),
      legacyEmployeeId: get('legacyEmployeeId') || '',
      payroll,
    },
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function readWorkbookRows(file, data) {
  let rows
  if (file.name.endsWith('.csv') || file.type === 'text/csv') {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
    const wb = XLSX.read(text, { type: 'string' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
  } else {
    const wb = XLSX.read(data, { type: 'array', cellDates: true })
    const sheetName =
      wb.SheetNames.find((n) => /employee|staff|people|import|sheet1/i.test(n)) ||
      wb.SheetNames[0]
    const sheet = wb.Sheets[sheetName]
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
  }
  return rows.filter(rowHasData)
}

export function parseEmployeeImportFile(file, existingEmails = new Set()) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const rows = readWorkbookRows(file, data)
        const emailsInFile = new Set()
        const checkEmails = new Set(existingEmails)

        const parsed = rows.map((row, index) => {
          const result = mapRowToEmployee(row, checkEmails)
          if (result.ok) {
            if (emailsInFile.has(result.employee.email)) {
              return { row: index + 2, error: 'Duplicate email in file' }
            }
            emailsInFile.add(result.employee.email)
            checkEmails.add(result.employee.email)
          }
          return { row: index + 2, ...result }
        })

        const valid = parsed.filter((p) => p.ok)
        const invalid = parsed.filter((p) => !p.ok)
        resolve({ valid, invalid, total: parsed.length })
      } catch (err) {
        reject(new Error(err.message || 'Could not read file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))

    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

export function buildEmployeeImportWorkbook() {
  const wb = XLSX.utils.book_new()
  const dataSheet = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...EXCEL_SAMPLE_ROWS])
  dataSheet['!cols'] = [
    { wch: 20 },
    { wch: 28 },
    { wch: 20 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
  ]
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Employees')

  const instructions = [
    ['Gamyam HRMS — Import your whole organization'],
    [''],
    ['1. Keep row 1 as headers. Add one employee per row (row 2 downward).'],
    ['2. Order matters: employees appear in the same order as your Excel rows.'],
    ['3. Required columns: name, email, role.'],
    ['4. Fill department, status, join_date, phone, and address like the sample rows.'],
    ['5. Payroll option A: provide only annual_ctc and let the app calculate the full salary breakup.'],
    ['6. Payroll option B: override any breakup values like basic, hra, lta, bonus, special_allowance, tds, or other_deductions.'],
    ['7. The app will calculate EPF, ESI, gratuity, deductions, gross salary, net pay, and company cost automatically.'],
    ['8. status must be: active | on-leave | inactive'],
    ['9. Save file → Admin → Employees → Bulk import → upload.'],
    [''],
    ['You can delete the 6 sample rows and paste your real staff list instead.'],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructions), 'Instructions')

  const payrollGuide = [
    ['Payroll breakup guide'],
    [''],
    ['Formula defaults used by HRMS'],
    ['Basic', '50% of annual CTC / 12'],
    ['HRA', '40% of basic'],
    ['LTA', 'If basic is above ₹15,000, then 8.33% of basic; otherwise 0'],
    ['Bonus', 'Fixed at ₹2,750 per month'],
    ['Special allowance', 'Adjustment figure so final cost to company matches monthly CTC'],
    ['EPF employee/employer', '12% of basic, capped at ₹1,800 monthly'],
    ['ESI', 'Applied only when gross salary is within ESI limit'],
    ['Professional tax', 'Slab based: 0 / ₹150 / ₹200 depending on gross salary'],
    ['Gratuity', '4.81% of basic'],
    [''],
    ['Tip'],
    ['If you fill annual_ctc only, HRMS will auto-calculate the whole breakup and show it in preview before import.'],
  ]
  const guideSheet = XLSX.utils.aoa_to_sheet(payrollGuide)
  guideSheet['!cols'] = [{ wch: 28 }, { wch: 52 }]
  XLSX.utils.book_append_sheet(wb, guideSheet, 'Payroll Guide')
  return wb
}

function triggerFileDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 200)
}

export function downloadEmployeeImportTemplate() {
  const wb = buildEmployeeImportWorkbook()
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  triggerFileDownload(blob, 'gamyam-employees-import.xlsx')
}
