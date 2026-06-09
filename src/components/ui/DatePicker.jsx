import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { todayDate } from '../../utils/timeUtils'
import { getHolidayTypeMeta, listHolidayTypes, normalizeHolidayType } from '../../utils/holidayTypes'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseIso(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toIso(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateDisplay(iso) {
  const d = parseIso(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells = []

  for (let i = startPad - 1; i >= 0; i -= 1) {
    const day = prevDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    cells.push({ iso: toIso(new Date(y, m, day)), outside: true })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ iso: toIso(new Date(year, month, day)), outside: false })
  }

  let nextDay = 1
  while (cells.length < 42) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    cells.push({ iso: toIso(new Date(y, m, nextDay)), outside: true })
    nextDay += 1
  }

  return cells
}

export default function DatePicker({
  label,
  value = '',
  onChange,
  required = false,
  min,
  max,
  disabled = false,
  placeholder = 'dd/mm/yyyy',
  holidays = [],
  className = '',
  id: idProp,
}) {
  const autoId = useId()
  const id = idProp || autoId
  const rootRef = useRef(null)
  const hiddenRef = useRef(null)

  const today = todayDate()
  const selected = parseIso(value)
  const initialView = selected || parseIso(today) || new Date()

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(initialView.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialView.getMonth())
  const [direction, setDirection] = useState(0)
  const [openMenu, setOpenMenu] = useState(null)
  const monthMenuRef = useRef(null)
  const yearMenuRef = useRef(null)

  const holidayMap = useMemo(() => {
    const map = {}
    holidays.forEach((h) => {
      map[h.date] = h
    })
    return map
  }, [holidays])
  const legendTypes = useMemo(
    () =>
      listHolidayTypes(holidays).filter((type) =>
        holidays.some((holiday) => normalizeHolidayType(holiday.type) === type),
      ),
    [holidays],
  )

  const yearOptions = useMemo(
    () => Array.from({ length: 25 }, (_, index) => viewYear - 12 + index),
    [viewYear],
  )

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (openMenu) {
          setOpenMenu(null)
        } else {
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, openMenu])

  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear())
      setViewMonth(selected.getMonth())
    }
  }, [value])

  useEffect(() => {
    if (hiddenRef.current) {
      hiddenRef.current.value = value || ''
      if (required && !value) {
        hiddenRef.current.setCustomValidity('Please select a date')
      } else {
        hiddenRef.current.setCustomValidity('')
      }
    }
  }, [value, required])

  useEffect(() => {
    if (direction === 0) return undefined
    const t = setTimeout(() => setDirection(0), 280)
    return () => clearTimeout(t)
  }, [viewYear, viewMonth, direction])

  useEffect(() => {
    const menuRef = openMenu === 'month' ? monthMenuRef.current : yearMenuRef.current
    if (!menuRef) return
    const selectedItem = menuRef.querySelector('[data-selected="true"]')
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [openMenu])

  const shiftMonth = (delta) => {
    setDirection(delta)
    setViewMonth((m) => {
      let next = m + delta
      let y = viewYear
      if (next > 11) {
        next = 0
        y += 1
      } else if (next < 0) {
        next = 11
        y -= 1
      }
      setViewYear(y)
      return next
    })
  }

  const updateViewMonth = (nextMonth) => {
    setDirection(0)
    setViewMonth(Number(nextMonth))
    setOpenMenu(null)
  }

  const updateViewYear = (nextYear) => {
    setDirection(0)
    setViewYear(Number(nextYear))
    setOpenMenu(null)
  }

  const isDisabledDate = (iso) => {
    if (min && iso < min) return true
    if (max && iso > max) return true
    return false
  }

  const pickDate = (iso) => {
    if (isDisabledDate(iso)) return
    onChange?.(iso)
    setOpen(false)
  }

  const display = formatDateDisplay(value)

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        ref={hiddenRef}
        type="text"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        value={value}
        required={required}
        onChange={() => {}}
      />
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`cal-trigger ${label ? 'mt-1' : ''} flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-left text-sm shadow-sm transition-all duration-200 ${
          open
            ? 'border-primary ring-2 ring-primary/25'
            : 'border-border hover:border-primary/40'
        } ${required && !value ? 'border-red-300' : ''} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className={display ? 'font-medium text-foreground' : 'text-muted'}>
          {display || placeholder}
        </span>
        <Calendar className={`h-4 w-4 shrink-0 transition-colors ${open ? 'text-primary' : 'text-muted'}`} />
      </button>

      {open && (
        <div className="cal-popover absolute left-0 z-50 mt-2 w-[min(100%,20rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-xl shadow-primary/10">
          <div className="cal-header bg-gradient-to-r from-primary to-primary-dark px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="cal-nav-btn flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25 active:scale-95"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div
                className={`cal-month-label min-w-0 flex-1 px-3 text-center transition-transform duration-300 ${
                  direction !== 0 ? 'cal-month-shift' : ''
                }`}
              >
                <p className="text-sm font-bold">{MONTHS[viewMonth]}</p>
                <p className="text-xs text-white/85">{viewYear}</p>
              </div>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="cal-nav-btn flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25 active:scale-95"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mt-3 grid grid-cols-[1fr_6.5rem] gap-2">
              <button
                type="button"
                onClick={() => setOpenMenu((menu) => (menu === 'month' ? null : 'month'))}
                className="flex items-center justify-between rounded-lg border border-white/15 bg-white/15 px-3 py-2 text-sm font-medium text-white outline-none transition hover:bg-white/20 focus:bg-white/20"
                aria-label="Select month"
                aria-expanded={openMenu === 'month'}
              >
                <span>{MONTHS[viewMonth]}</span>
                <ChevronDown className={`h-4 w-4 transition ${openMenu === 'month' ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setOpenMenu((menu) => (menu === 'year' ? null : 'year'))}
                className="flex items-center justify-between rounded-lg border border-white/15 bg-white/15 px-3 py-2 text-sm font-medium text-white outline-none transition hover:bg-white/20 focus:bg-white/20"
                aria-label="Select year"
                aria-expanded={openMenu === 'year'}
              >
                <span>{viewYear}</span>
                <ChevronDown className={`h-4 w-4 transition ${openMenu === 'year' ? 'rotate-180' : ''}`} />
              </button>

              {openMenu === 'month' && (
                <div className="absolute left-0 top-full z-20 mt-2 w-[calc(100%-7rem)] overflow-hidden rounded-xl border border-border bg-white shadow-xl shadow-neutral-900/10">
                  <div
                    ref={monthMenuRef}
                    className="max-h-56 overflow-y-auto p-2 scroll-smooth"
                  >
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        type="button"
                        data-selected={viewMonth === index ? 'true' : 'false'}
                        onClick={() => updateViewMonth(index)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                          viewMonth === index
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-foreground hover:bg-primary-light hover:text-primary-dark'
                        }`}
                      >
                        <span>{month}</span>
                        {viewMonth === index && <span className="text-xs font-semibold text-white/90">Current</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {openMenu === 'year' && (
                <div className="absolute right-0 top-full z-20 mt-2 w-28 overflow-hidden rounded-xl border border-border bg-white shadow-xl shadow-neutral-900/10">
                  <div
                    ref={yearMenuRef}
                    className="max-h-56 overflow-y-auto p-2 scroll-smooth"
                  >
                    {yearOptions.map((year) => (
                      <button
                        key={year}
                        type="button"
                        data-selected={viewYear === year ? 'true' : 'false'}
                        onClick={() => updateViewYear(year)}
                        className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                          viewYear === year
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-foreground hover:bg-primary-light hover:text-primary-dark'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {d}
                </div>
              ))}
            </div>

            <div
              key={`${viewYear}-${viewMonth}`}
              className={`cal-grid grid grid-cols-7 gap-1 ${direction > 0 ? 'cal-slide-next' : direction < 0 ? 'cal-slide-prev' : ''}`}
            >
              {cells.map((cell) => {
                const isSelected = value === cell.iso
                const isToday = cell.iso === today
                const holiday = holidayMap[cell.iso]
                const off = isDisabledDate(cell.iso)

                return (
                  <button
                    key={cell.iso + (cell.outside ? '-o' : '')}
                    type="button"
                    disabled={off}
                    onClick={() => pickDate(cell.iso)}
                    className={`cal-day relative flex h-9 flex-col items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${
                      isSelected
                        ? 'cal-day-selected bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/40 scale-105'
                        : isToday
                          ? 'ring-2 ring-primary/50 ring-offset-1 text-primary-dark'
                          : cell.outside
                            ? 'text-muted/40'
                            : off
                              ? 'cursor-not-allowed text-muted/30'
                              : 'text-foreground hover:bg-primary-light hover:text-primary-dark hover:scale-105'
                    }`}
                  >
                    {parseIso(cell.iso)?.getDate()}
                    {holiday && !cell.outside && (
                      <span
                        className={`absolute bottom-0.5 h-1 w-1 rounded-full ${getHolidayTypeMeta(holiday.type).dotClass}`}
                        title={holiday.name}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {legendTypes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-2 text-[10px] text-muted">
                {legendTypes.map((type) => (
                  <span key={type} className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${getHolidayTypeMeta(type).dotClass}`} />
                    {getHolidayTypeMeta(type).shortLabel}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => {
                  onChange?.('')
                  setOpen(false)
                }}
                className="text-xs font-medium text-muted transition hover:text-primary"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => pickDate(today)}
                className="rounded-lg bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary-dark transition hover:bg-primary hover:text-white"
              >
                Today
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
