const plans = [
  { name: 'Starter', price: '$49/mo', companies: 8 },
  { name: 'Professional', price: '$149/mo', companies: 9 },
  { name: 'Enterprise', price: 'Custom', companies: 5 },
]

export default function Subscriptions() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Subscription Management</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className="rounded-2xl border-2 border-primary/20 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-primary">{p.name}</h3>
            <p className="mt-2 text-2xl font-bold text-foreground">{p.price}</p>
            <p className="mt-4 text-sm text-muted">{p.companies} active companies</p>
          </div>
        ))}
      </div>
    </div>
  )
}
