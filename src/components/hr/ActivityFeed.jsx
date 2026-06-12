import { Link } from 'react-router-dom'
import { useHrms } from '../../hooks/useHrms'

function formatTitle(action) {
  if (!action) return 'Activity updated'
  const text = String(action).trim()
  if (!text) return 'Activity updated'
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function ActivityTimeline({ items }) {
  const timelineItems = items.slice(0, 5)

  return (
    <div className="relative px-3 py-3 sm:px-5">
      <div
        className="pointer-events-none absolute bottom-8 left-1/2 top-8 w-px -translate-x-1/2 bg-neutral-200"
        aria-hidden
      />

      <ol className="space-y-10 sm:space-y-12">
        {timelineItems.map((item, index) => {
          const onRight = index % 2 === 0
          const isLatest = index === 0

          return (
            <li key={item.id} className="relative min-h-[5rem]">
              <span
                className={`absolute left-1/2 top-6 z-10 h-9 w-9 -translate-x-1/2 rounded-full border border-neutral-200 bg-white shadow-sm ${
                  isLatest ? 'shadow-md' : ''
                }`}
                aria-hidden
              >
                <span
                  className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    isLatest ? 'bg-primary' : 'bg-neutral-300'
                  }`}
                  aria-hidden
                />
              </span>

              <div
                className={`absolute top-0 w-[calc(50%-2rem)] max-w-[11.5rem] sm:max-w-[12.5rem] ${
                  onRight ? 'right-0 text-left' : 'left-0 text-left'
                }`}
              >
                <div
                  className={`rounded-xl px-3.5 py-3 shadow-sm transition sm:px-4 sm:py-3.5 ${
                    isLatest
                      ? 'border-2 border-primary/35 bg-primary-light/25'
                      : 'border border-neutral-200/80 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-[13px] font-semibold leading-snug text-foreground">
                        {item.user ? (
                          <>
                            <span className="font-bold">{item.user}</span>{' '}
                            <span className="font-semibold">{formatTitle(item.action)}</span>
                          </>
                        ) : (
                          formatTitle(item.action)
                        )}
                      </p>
                      {isLatest ? (
                        <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          Latest
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted">{item.time || 'Recently'}</p>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function ActivityFeed({
  className = '',
  viewAllTo = '/admin/audit-logs',
  subtitle = 'Latest updates from your organization',
  bare = false,
}) {
  const { activityFeed } = useHrms()
  const items = activityFeed.filter((item) => item.type !== 'attendance')

  // `bare` renders just the timeline (no card chrome / header) for embedding
  // inside an existing glass panel.
  if (bare) {
    return items.length === 0 ? (
      <p className="text-sm text-muted">No recent activity</p>
    ) : (
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <ActivityTimeline items={items} />
      </div>
    )
  }

  return (
    <div
      className={`flex h-full min-h-0 min-w-0 flex-col rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {viewAllTo ? (
          <Link to={viewAllTo} className="shrink-0 text-sm font-semibold text-primary hover:underline">
            View All
          </Link>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No recent activity</p>
      ) : (
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          <ActivityTimeline items={items} />
        </div>
      )}
    </div>
  )
}
