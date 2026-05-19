import { Bell, Menu } from 'lucide-react'
import GlobalSearch from './GlobalSearch'

export default function Header({ title, description, onMenuClick }) {
  return (
    <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <button
            type="button"
            onClick={onMenuClick}
            className="mt-0.5 shrink-0 rounded-lg border border-border p-2 text-foreground hover:bg-primary-light lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-foreground sm:text-lg">{title}</h2>
            {description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted sm:line-clamp-none">{description}</p>
            )}
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
          <GlobalSearch variant="employee" className="min-w-0 flex-1 sm:max-w-xs" />
          <button
            type="button"
            className="relative shrink-0 rounded-lg border border-border p-2 text-foreground hover:bg-primary-light"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </div>
    </header>
  )
}
