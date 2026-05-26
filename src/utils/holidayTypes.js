const CORE_HOLIDAY_TYPES = ['national', 'festival', 'optional']

const CORE_HOLIDAY_TYPE_META = {
  national: {
    label: 'National holiday',
    shortLabel: 'National',
    chipClass: 'border-blue-200 bg-blue-50 text-blue-700',
    color: 'text-blue-700 bg-blue-50',
    dotClass: 'bg-blue-500',
  },
  festival: {
    label: 'Festival holiday',
    shortLabel: 'Festival',
    chipClass: 'border-primary/20 bg-primary-light text-primary-dark',
    color: 'text-primary-darker bg-primary-light',
    dotClass: 'bg-primary',
  },
  optional: {
    label: 'Optional holiday',
    shortLabel: 'Optional',
    chipClass: 'border-amber-200 bg-amber-50 text-amber-800',
    color: 'text-amber-800 bg-amber-50',
    dotClass: 'bg-amber-500',
  },
}

const CUSTOM_HOLIDAY_TYPE_META = {
  chipClass: 'border-violet-200 bg-violet-50 text-violet-700',
  color: 'text-violet-700 bg-violet-50',
  dotClass: 'bg-violet-500',
}

export { CORE_HOLIDAY_TYPES }

export function normalizeHolidayType(type = '') {
  return String(type)
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function toTitleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatHolidayTypeName(type) {
  const normalized = normalizeHolidayType(type)
  if (!normalized) return 'Holiday'
  return toTitleCase(normalized)
}

export function isCoreHolidayType(type) {
  return CORE_HOLIDAY_TYPES.includes(normalizeHolidayType(type))
}

export function isOptionalHolidayType(type) {
  return normalizeHolidayType(type) === 'optional'
}

export function getHolidayTypeMeta(type) {
  const normalized = normalizeHolidayType(type)
  const coreMeta = CORE_HOLIDAY_TYPE_META[normalized]
  if (coreMeta) return { id: normalized, ...coreMeta }

  const shortLabel = formatHolidayTypeName(normalized)
  const hasHolidaySuffix = /holiday$/i.test(shortLabel)

  return {
    id: normalized || 'custom',
    label: shortLabel === 'Holiday' ? 'Custom holiday' : hasHolidaySuffix ? shortLabel : `${shortLabel} holiday`,
    shortLabel: shortLabel === 'Holiday' ? 'Custom' : shortLabel,
    ...CUSTOM_HOLIDAY_TYPE_META,
  }
}

export function listHolidayTypes(holidays = [], options = {}) {
  const { includeCore = true } = options
  const seen = new Set()
  const ordered = []

  if (includeCore) {
    CORE_HOLIDAY_TYPES.forEach((type) => {
      seen.add(type)
      ordered.push(type)
    })
  }

  holidays.forEach((holiday) => {
    const normalized = normalizeHolidayType(holiday?.type)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    ordered.push(normalized)
  })

  return ordered
}

export function countHolidaysByType(holidays = [], options = {}) {
  const { includeCore = true } = options
  const counts = {}

  if (includeCore) {
    CORE_HOLIDAY_TYPES.forEach((type) => {
      counts[type] = 0
    })
  }

  holidays.forEach((holiday) => {
    const normalized = normalizeHolidayType(holiday?.type)
    if (!normalized) return
    counts[normalized] = (counts[normalized] || 0) + 1
  })

  return counts
}

export function formatHolidayTypeSummary(holidays = [], options = {}) {
  const counts = countHolidaysByType(holidays, options)
  return listHolidayTypes(holidays, options)
    .map((type) => `${counts[type] ?? 0} ${getHolidayTypeMeta(type).shortLabel.toLowerCase()}`)
    .join(' · ')
}
