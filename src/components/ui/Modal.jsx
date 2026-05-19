import { X } from 'lucide-react'

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
  xl = false,
  xl2 = false,
}) {
  if (!open) return null

  const widthClass = xl2
    ? 'max-w-5xl'
    : xl
      ? 'max-w-4xl'
      : wide
        ? 'max-w-2xl'
        : 'max-w-lg'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-neutral-900/10 ring-1 ring-neutral-200/80 ${widthClass}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 bg-gradient-to-r from-primary-light/50 via-white to-white px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="min-w-0 pr-2">
            <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h3>
            {subtitle && <p className="mt-1 max-w-xl text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-muted transition hover:bg-neutral-100 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>
  )
}
