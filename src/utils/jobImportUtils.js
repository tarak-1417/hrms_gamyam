import * as XLSX from 'xlsx'

/** Column headers accepted in import file (first row). Case-insensitive, spaces → underscores */
export const JOB_IMPORT_COLUMNS = [
  { key: 'title', aliases: ['title', 'job_title', 'position', 'role_title', 'job'] },
  { key: 'department', aliases: ['department', 'dept', 'team'] },
  { key: 'location', aliases: ['location', 'city', 'office', 'work_location'] },
  {
    key: 'employmentType',
    aliases: ['employment_type', 'employmenttype', 'type', 'employment', 'job_type'],
  },
  { key: 'salaryRange', aliases: ['salary_range', 'salary', 'ctc', 'package', 'compensation'] },
  { key: 'description', aliases: ['description', 'desc', 'job_description', 'details', 'summary'] },
]

const DEFAULT_LOCATION = 'Razole, Andhra Pradesh'

export const JOB_IMPORT_TEMPLATE_CSV = [
  'title,department,location,employment_type,salary_range,description',
  'Senior Developer,Engineering,Razole Andhra Pradesh,Full-time,12-18 LPA,Build and scale HRMS with React',
  'HR Executive,Human Resources,Razole Andhra Pradesh,Full-time,4-6 LPA,Recruitment and employee relations',
].join('\n')

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function mapRowToJob(rawRow) {
  const normalized = {}
  Object.entries(rawRow).forEach(([k, v]) => {
    normalized[normalizeHeader(k)] = v
  })

  const get = (key) => {
    const col = JOB_IMPORT_COLUMNS.find((c) => c.key === key)
    if (!col) return ''
    for (const alias of col.aliases) {
      const val = normalized[alias]
      if (val != null && String(val).trim() !== '') return String(val).trim()
    }
    return ''
  }

  const title = get('title')
  if (!title) return { error: 'Missing job title' }

  return {
    ok: true,
    job: {
      title,
      department: get('department') || 'Engineering',
      location: get('location') || DEFAULT_LOCATION,
      employmentType: get('employmentType') || 'Full-time',
      salaryRange: get('salaryRange') || '—',
      description: get('description') || `${title} — imported opening at Gamyam Technologies.`,
    },
  }
}

export function parseJobImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        let rows = []

        if (file.name.endsWith('.csv') || file.type === 'text/csv') {
          const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
          const wb = XLSX.read(text, { type: 'string' })
          const sheet = wb.Sheets[wb.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        } else {
          const wb = XLSX.read(data, { type: 'array' })
          const sheet = wb.Sheets[wb.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        }

        const parsed = rows.map((row, index) => {
          const result = mapRowToJob(row)
          return {
            row: index + 2,
            ...result,
          }
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

export function downloadJobImportTemplate() {
  const blob = new Blob([JOB_IMPORT_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'gamyam-job-postings-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}
