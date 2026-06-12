import { useState } from 'react'
import { HiChevronDown, HiChevronRight } from 'react-icons/hi'
import Badge from '../ui/Badge'
import { getEmployeeManagerName } from '../../utils/organizationHelpers'

export default function ReportingDepartmentView({
  groups,
  employees,
  selectedId,
  onSelect,
}) {
  const [openDepts, setOpenDepts] = useState(() => new Set(groups.map((g) => g.department)))

  const toggleDept = (dept) => {
    setOpenDepts((prev) => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
      return next
    })
  }

  return (
    <div className="h-full overflow-y-auto p-2 sm:p-3">
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {groups.length} departments · {employees.length} employees
      </p>
      <div className="space-y-2">
        {groups.map(({ department, employees: deptEmps }) => {
          const open = openDepts.has(department)
          return (
            <section
              key={department}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/50"
            >
              <button
                type="button"
                onClick={() => toggleDept(department)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-neutral-100/80"
              >
                <span className="flex items-center gap-2">
                  {open ? (
                    <HiChevronDown className="h-4 w-4 text-muted" />
                  ) : (
                    <HiChevronRight className="h-4 w-4 text-muted" />
                  )}
                  <span className="font-semibold text-foreground">{department}</span>
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-neutral-200">
                  {deptEmps.length}
                </span>
              </button>
              {open && (
                <ul className="divide-y divide-neutral-100 border-t border-neutral-200 bg-white">
                  {deptEmps.map((emp) => {
                    const selected = emp.id === selectedId
                    return (
                      <li key={emp.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(emp.id)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selected ? 'bg-primary-light/60' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              selected ? 'bg-primary text-white' : 'bg-primary-light text-primary'
                            }`}
                          >
                            {emp.avatar || emp.name?.charAt(0)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{emp.name}</span>
                              <span className="font-mono text-[10px] text-muted">{emp.id}</span>
                            </span>
                            <span className="mt-0.5 block text-xs text-muted">
                              {emp.role}
                              {emp.managerId && (
                                <> · {getEmployeeManagerName(employees, emp.managerId)}</>
                              )}
                            </span>
                          </span>
                          <Badge status={emp.status === 'on-leave' ? 'on-leave' : emp.status} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
