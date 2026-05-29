export default function Card({ title, subtitle, action, toolbar, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-surface-elevated shadow-sm ${className}`}>
      {(title || action || toolbar) && (
        <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>
            {(toolbar || action) && (
              <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:min-w-0 lg:flex-1 lg:justify-end">
                {toolbar}
                {action}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}
