const roles = [
  { name: 'Super Admin', users: 2, permissions: 'Full platform access' },
  { name: 'HR Admin', users: 5, permissions: 'Employees, payroll, reports' },
  { name: 'Manager', users: 12, permissions: 'Team, leave approval, attendance' },
  { name: 'Employee', users: 53, permissions: 'Self-service portal' },
]

export default function Roles() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
        <p className="mt-1 text-muted">Configure access levels across the platform</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <div key={role.name} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-foreground">{role.name}</h3>
            <p className="mt-2 text-sm text-muted">{role.permissions}</p>
            <p className="mt-4 text-sm">
              <span className="font-bold text-primary">{role.users}</span> users assigned
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
