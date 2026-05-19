import * as XLSX from 'xlsx'

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
  { key: 'basic', aliases: ['basic', 'basic_salary', 'basic_pay', 'monthly_basic'] },
  { key: 'allowances', aliases: ['allowances', 'hra', 'allowance', 'monthly_allowances'] },
  { key: 'deductions', aliases: ['deductions', 'deduction', 'monthly_deductions', 'pf_etc'] },
  { key: 'net', aliases: ['net', 'net_salary', 'take_home', 'monthly_net'] },
  {
    key: 'annualCtc',
    aliases: ['annual_ctc', 'ctc', 'annual_salary', 'yearly_ctc', 'package'],
  },
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
  'basic',
  'allowances',
  'deductions',
  'net',
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
    65000,
    12000,
    8500,
    68500,
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
    75000,
    15000,
    10200,
    79800,
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
    45000,
    8000,
    5200,
    47800,
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
    72000,
    14000,
    9800,
    76200,
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
    52000,
    9000,
    6100,
    54900,
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
    48000,
    8500,
    5500,
    51000,
  ],
]

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function parseNumber(val) {
  if (val == null || val === '') return null
  const n = Number(String(val).replace(/[,₹\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n) : null
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

  const basicRaw = get('basic')
  const allowancesRaw = get('allowances')
  const deductionsRaw = get('deductions')
  const netRaw = get('net')
  const annualCtc = parseNumber(get('annualCtc'))

  const hasPayrollInput =
    basicRaw || allowancesRaw || deductionsRaw || netRaw || annualCtc != null

  let payroll
  if (hasPayrollInput) {
    let basic = parseNumber(basicRaw)
    const allowances = parseNumber(allowancesRaw) ?? 0
    const deductions = parseNumber(deductionsRaw) ?? 0
    let net = parseNumber(netRaw)

    if (basic == null && annualCtc != null) {
      basic = Math.round(annualCtc / 12 / 1.18)
    }
    if (basic == null) basic = 45000
    if (net == null) net = basic + allowances - deductions

    payroll = {
      basic,
      allowances,
      deductions,
      net,
      month: 'April 2026',
    }
  }

  return {
    ok: true,
    employee: {
      name,
      email,
      department: get('department') || 'Engineering',
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
  let rows = []
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
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Employees')

  const instructions = [
    ['Gamyam HRMS — Import your whole organization'],
    [''],
    ['1. Keep row 1 as headers. Add one employee per row (row 2 downward).'],
    ['2. Order matters: employees appear in the same order as your Excel rows.'],
    ['3. Required columns: name, email, role.'],
    ['4. Fill department, status, join_date, phone, address like the sample rows.'],
    ['5. Payroll: basic, allowances, deductions, net (same as Payslips in the app).'],
    ['6. status must be: active | on-leave | inactive'],
    ['7. Save file → Admin → Employees → Bulk import → upload.'],
    [''],
    ['You can delete the 6 sample rows and paste your real staff list instead.'],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructions), 'Instructions')
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
