export default function ChartCard({
  title,
  subtitle,
  children,
  className = '',
  chartClassName = '',
  compact = false,
  chartAtBottom = false,
}) {
  const chartHeight = compact ? 'h-[190px] sm:h-[220px]' : 'h-[180px] sm:h-[220px]'

  return (
    <div
      className={`min-w-0 rounded-2xl border border-neutral-200/80 bg-white shadow-sm ${
        compact ? 'p-4 sm:p-5' : 'p-3 sm:p-4'
      } ${chartAtBottom ? 'flex h-full flex-col' : ''} ${className}`}
    >
      <div className={`shrink-0 ${chartAtBottom ? '' : compact ? 'mb-3' : 'mb-2 sm:mb-3'}`}>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      <div
        className={`w-full min-w-0 ${chartHeight} ${chartAtBottom ? 'mt-auto' : ''} ${chartClassName}`}
      >
        {children}
      </div>
    </div>
  )
}
