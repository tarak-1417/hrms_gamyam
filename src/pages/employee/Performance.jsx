const reviews = [
  { period: 'Q1 2026', rating: 4.2, status: 'completed', manager: 'Priya Sharma' },
  { period: 'Q4 2025', rating: 4.0, status: 'completed', manager: 'Priya Sharma' },
]

export default function Performance() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Performance Reviews</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.period} className="rounded-xl border border-border bg-surface-elevated p-6 shadow-sm">
            <p className="text-sm font-medium text-primary">{r.period}</p>
            <p className="mt-2 text-4xl font-bold text-foreground">{r.rating}<span className="text-lg text-muted">/5</span></p>
            <p className="mt-2 text-sm text-muted">Reviewer: {r.manager}</p>
            <span className="mt-3 inline-block rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary-dark capitalize">
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
