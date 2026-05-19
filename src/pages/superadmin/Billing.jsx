export default function Billing() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Billing & Security</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">Billing overview</h3>
          <p className="mt-4 text-3xl font-bold text-primary">$4.8M</p>
          <p className="text-sm text-muted">Monthly recurring revenue</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">Security</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>✓ SSO enabled for 18 companies</li>
            <li>✓ 2FA enforced for admins</li>
            <li>✓ Last security audit: Apr 2026</li>
            <li>✓ 0 critical vulnerabilities</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
