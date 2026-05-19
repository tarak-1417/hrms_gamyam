import { SlidersHorizontal, X } from 'lucide-react'

export function FilterSelect({ label, value, onChange, options }) {
  const isActive = value !== 'all'

  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="hidden text-xs text-muted sm:inline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`h-8 min-w-0 max-w-[11rem] cursor-pointer truncate rounded-lg border px-2.5 pr-7 text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 sm:max-w-[9.5rem] ${
          isActive
            ? 'border-primary/50 bg-primary/5 text-primary'
            : 'border-border bg-white text-foreground hover:border-primary/30'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.4rem center',
          appearance: 'none',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
            {opt.count != null ? ` (${opt.count})` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function FilterBar({
  children,
  showing,
  total,
  onClear,
  hasActiveFilters,
  className = '',
}) {
  return (
    <div
      className={`flex w-full flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-surface/60 px-2.5 py-1.5 sm:gap-2.5 lg:w-auto lg:min-w-[18rem] ${className}`}
    >
      <SlidersHorizontal className="hidden h-3.5 w-3.5 shrink-0 text-muted sm:block" aria-hidden />
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <span className="shrink-0 text-[11px] text-muted sm:text-xs">
        <span className="font-medium text-foreground">{showing}</span>
        <span className="text-muted"> / {total}</span>
      </span>
      {hasActiveFilters && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 sm:text-xs"
          title="Clear filters"
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      )}
    </div>
  )
}
