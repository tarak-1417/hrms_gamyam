export default function StatCard({ icon: Icon, label, value, change, changeType = 'positive' }) {
  const changeColor = changeType === 'positive' ? 'text-primary-dark' : 'text-red-600'

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-1.5 text-xl font-bold text-foreground">{value}</p>
          {change && <p className={`mt-0.5 text-xs ${changeColor}`}>{change}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary-light p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
    </div>
  )
}
