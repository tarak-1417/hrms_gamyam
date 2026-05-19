import { Building2, Maximize2, Minimize2, Mail, Briefcase } from 'lucide-react'
import Badge from '../ui/Badge'

export default function DepartmentCard({ department, expanded, onToggleExpand, canExpand = true }) {
  const { name, head, employees, employeeList } = department

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
        expanded
          ? 'col-span-full border-primary/30 ring-2 ring-primary/15 shadow-md'
          : 'border-neutral-100 hover:border-primary/20 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              expanded ? 'bg-primary text-white' : 'bg-primary-light text-primary'
            }`}
          >
            <Building2 className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground">{name}</h3>
            <p className="mt-0.5 text-sm text-muted">Head: {head}</p>
            <p className="mt-3 text-3xl font-bold text-primary">{employees}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">employees</p>
          </div>
        </div>

        {canExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
              expanded
                ? 'bg-primary text-white opacity-100 shadow-md shadow-primary/20 hover:bg-primary-dark'
                : 'border border-neutral-200 bg-white text-neutral-600 opacity-0 hover:border-primary/40 hover:bg-primary-light hover:text-primary group-hover:opacity-100'
            }`}
            aria-expanded={expanded}
            aria-label={expanded ? `Minimize ${name}` : `View ${name} employees`}
            title={expanded ? 'Minimize' : 'View employees'}
          >
            {expanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 bg-gradient-to-b from-neutral-50/80 to-white px-5 pb-5 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Employees in {name}
          </p>
          {employeeList.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-200 bg-white py-8 text-center text-sm text-muted">
              No employees in this department yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/80 text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3 font-semibold">Employee</th>
                      <th className="px-4 py-3 font-semibold">ID</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {employeeList.map((emp) => (
                      <tr key={emp.id} className="hover:bg-primary-light/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary-dark">
                              {emp.avatar}
                            </span>
                            <div>
                              <p className="font-medium text-foreground">{emp.name}</p>
                              <p className="flex items-center gap-1 text-xs text-muted">
                                <Mail className="h-3 w-3" />
                                {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{emp.id}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <Briefcase className="h-3.5 w-3.5 text-muted" />
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={emp.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
