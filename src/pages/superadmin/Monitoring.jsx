export default function Monitoring() {
  const metrics = [
    { label: 'API latency', value: '42ms', status: 'healthy' },
    { label: 'Error rate', value: '0.02%', status: 'healthy' },
    { label: 'Queue depth', value: '12', status: 'healthy' },
    { label: 'DB connections', value: '84%', status: 'warning' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Global System Monitoring</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-muted">{m.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{m.value}</p>
            <p className={`mt-1 text-xs font-medium capitalize ${m.status === 'healthy' ? 'text-primary' : 'text-amber-600'}`}>
              {m.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
