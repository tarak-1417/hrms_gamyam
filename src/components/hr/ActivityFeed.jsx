import { UserPlus, CalendarOff, Megaphone, Clock, Wallet } from 'lucide-react'
import { useHrms } from '../../hooks/useHrms'

const icons = {
  hire: UserPlus,
  leave: CalendarOff,
  announcement: Megaphone,
  attendance: Clock,
  payroll: Wallet,
}

export default function ActivityFeed() {
  const { activityFeed } = useHrms()
  const items = activityFeed.filter((item) => item.type !== 'attendance')

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">What&apos;s happening</h3>
      <p className="mt-0.5 text-sm text-muted">Live updates from your organization</p>
      <ul className="mt-4 max-h-[280px] space-y-4 overflow-y-auto">
        {items.length === 0 ? (
          <li className="text-sm text-muted">No recent activity</li>
        ) : (
          items.map((item) => {
            const Icon = icons[item.type] ?? Megaphone
            return (
              <li key={item.id} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{item.user}</span> {item.action}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{item.time}</p>
                </div>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
