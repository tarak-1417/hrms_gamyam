const companies = [
  { name: 'Gamyam Tech', plan: 'Enterprise', employees: 72, status: 'active' },
  { name: 'Acme Corp', plan: 'Professional', employees: 45, status: 'active' },
  { name: 'StartUp Inc', plan: 'Starter', employees: 12, status: 'trial' },
]

export default function Companies() {
  return (
    <div className="space-y-6">
      <h1 className="page-title">Multi-Company Management</h1>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="table-scroll">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="bg-neutral-50 text-muted">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Company</th>
              <th className="px-5 py-3 text-left font-medium">Plan</th>
              <th className="px-5 py-3 text-left font-medium">Employees</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {companies.map((c) => (
              <tr key={c.name}>
                <td className="px-5 py-4 font-medium">{c.name}</td>
                <td className="px-5 py-4">{c.plan}</td>
                <td className="px-5 py-4">{c.employees}</td>
                <td className="px-5 py-4 capitalize text-primary">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
