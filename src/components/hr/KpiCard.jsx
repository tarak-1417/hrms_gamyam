import { Link } from 'react-router-dom'

const cardClass =
  'block rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'

export default function KpiCard({ label, value, sub, icon: Icon, trend, to }) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${trend.positive ? 'text-primary-dark' : 'text-red-600'}`}
            >
              {trend.text}
            </p>
          )}
        </div>
        {Icon && (
          <span className="rounded-xl bg-primary-light p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {to && (
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-primary opacity-0 transition group-hover:opacity-100">
          View details →
        </p>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={`group ${cardClass}`} aria-label={`${label}: ${value}`}>
        {content}
      </Link>
    )
  }

  return <div className={cardClass}>{content}</div>
}
