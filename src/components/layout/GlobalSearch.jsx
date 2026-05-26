import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, User, FileText, CalendarOff, Briefcase, LayoutGrid } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { runGlobalSearch, SEARCH_TYPE_LABELS } from '../../utils/globalSearch'

const TYPE_ICONS = {
  page: LayoutGrid,
  employee: User,
  leave: CalendarOff,
  job: Briefcase,
  document: FileText,
}

export default function GlobalSearch({
  variant = 'hr',
  placeholder,
  className = '',
  inputClassName = '',
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    searchQuery,
    setSearchQuery,
    employees,
    leaveRequests,
    jobPostings,
    documentTemplates,
  } = useHrms()

  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const role = user?.role || 'employee'
  const defaultPlaceholder =
    role === 'employee'
      ? 'Search pages, reimbursements, payslips, leave…'
      : role === 'superadmin'
        ? 'Search platform, companies…'
        : role === 'manager'
          ? 'Search team, profile, leave…'
          : 'Search employees, reimbursements, pages, leave…'

  const results = useMemo(
    () =>
      runGlobalSearch(searchQuery, {
        role,
        user,
        employees,
        leaveRequests,
        jobPostings,
        documentTemplates,
      }),
    [searchQuery, role, user, employees, leaveRequests, jobPostings, documentTemplates],
  )

  const orderedResults = useMemo(() => {
    const map = {}
    results.forEach((r) => {
      if (!map[r.type]) map[r.type] = []
      map[r.type].push(r)
    })
    const ordered = []
    Object.entries(map).forEach(([type, items]) => {
      items.forEach((item) => ordered.push({ ...item, groupType: type }))
    })
    return ordered
  }, [results])

  const selectResult = useCallback(
    (item) => {
      if (item.searchHint) {
        setSearchQuery(item.searchHint)
      } else if (item.type === 'employee') {
        setSearchQuery(item.title)
      } else {
        setSearchQuery('')
      }
      navigate(item.path)
      setOpen(false)
      inputRef.current?.blur()
    },
    [navigate, setSearchQuery],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [searchQuery])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter') && searchQuery.trim()) {
      setOpen(true)
      return
    }
    if (!open || orderedResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % orderedResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + orderedResults.length) % orderedResults.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectResult(orderedResults[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const isHr = variant === 'hr'

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
          isHr ? 'text-neutral-400' : 'text-muted'
        }`}
      />
      <input
        ref={inputRef}
        type="search"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => searchQuery.trim() && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? defaultPlaceholder}
        className={
          inputClassName ||
          (isHr
            ? 'w-full max-w-sm rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15'
            : 'w-64 rounded-lg border border-border py-2 pl-10 pr-4 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20')
        }
        aria-label="Global search"
        aria-expanded={open}
        aria-autocomplete="list"
        role="combobox"
      />

      {open && searchQuery.trim() && (
        <div className="global-search-panel absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border bg-white shadow-xl shadow-primary/10 sm:w-96">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted">
              No results for &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <div className="max-h-[min(60vh,20rem)] overflow-y-auto p-2">
              <ul>
                {orderedResults.map((item, idx) => {
                  const showHeader =
                    idx === 0 || orderedResults[idx - 1].groupType !== item.groupType
                  const Icon = TYPE_ICONS[item.type] || LayoutGrid
                  const isActive = idx === activeIndex
                  return (
                    <li key={item.id}>
                      {showHeader && (
                        <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted first:pt-0">
                          {SEARCH_TYPE_LABELS[item.groupType] || item.groupType}
                        </p>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => selectResult(item)}
                        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition ${
                          isActive ? 'bg-primary-light text-primary-dark' : 'hover:bg-surface'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isActive ? 'bg-primary text-white' : 'bg-primary-light text-primary'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-muted">{item.subtitle}</span>
                        </span>
                        <ArrowRight
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted/50'}`}
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          <div className="border-t border-border bg-surface/80 px-3 py-2 text-[10px] text-muted">
            <span className="text-foreground font-medium">{results.length}</span> result
            {results.length !== 1 ? 's' : ''} · ↑↓ navigate · Enter to open
          </div>
        </div>
      )}
    </div>
  )
}
