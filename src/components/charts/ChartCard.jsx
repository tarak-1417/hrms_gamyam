export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm sm:p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="h-[200px] w-full min-w-0 sm:h-[240px]">{children}</div>
    </div>
  )
}
