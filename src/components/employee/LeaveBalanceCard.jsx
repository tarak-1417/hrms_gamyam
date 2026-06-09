import { CalendarDays } from 'lucide-react'

export default function LeaveBalanceCard({
  shortLabel,
  remaining,
  total,
  used,
  unit = 'days',
  className = '',
}) {
  const safeTotal = Math.max(0, Number(total) || 0)
  const safeUsed = Math.max(0, Number(used) || 0)
  const safeRemaining = Math.max(0, Number(remaining) || 0)
  const usedForBar = safeTotal > 0 ? Math.min(safeUsed, safeTotal) : 0
  const usedPct =
    safeTotal > 0 ? Math.min(100, Math.round((usedForBar / safeTotal) * 100)) : 0
  const showProgress = usedForBar > 0

  return (
    <div
      className={`flex min-h-[148px] flex-col rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:min-h-[156px] ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          {shortLabel}
        </p>
        <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden />
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[2rem] font-semibold leading-none tabular-nums text-foreground sm:text-[2.125rem]">
          {safeRemaining}
        </span>
        <span className="text-lg font-normal tabular-nums text-neutral-400 sm:text-xl">/ {safeTotal}</span>
      </div>

      <p className="mt-2 text-sm text-neutral-500">
        {safeUsed}{' '}
        {unit === 'holidays'
          ? safeUsed === 1
            ? 'holiday used'
            : 'holidays used'
          : safeUsed === 1
            ? 'day used'
            : 'days used'}
      </p>

      <div className="mt-auto pt-4" role="presentation" aria-hidden={!showProgress}>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full min-w-0 rounded-full bg-primary transition-[width] duration-500"
            style={{
              width: showProgress ? `${usedPct}%` : '0%',
              minWidth: showProgress && usedPct > 0 && usedPct < 8 ? '0.375rem' : undefined,
            }}
          />
        </div>
      </div>
    </div>
  )
}
