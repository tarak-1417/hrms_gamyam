import { HiChevronDown, HiChevronRight, HiUsers } from 'react-icons/hi'
import Badge from '../ui/Badge'
import { getEmployeeManagerName } from '../../utils/organizationHelpers'

export default function ReportingListView({
  rows,
  employees = [],
  selectedId,
  onSelect,
  onToggleCollapse,
}) {
  return (
    <div className="h-full overflow-y-auto p-2 sm:p-3">
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {rows.length} visible · expand rows to drill down
      </p>
      <ul className="space-y-0.5">
        {rows.map(({ employee: emp, depth, childCount, hasChildren, collapsed }) => {
          const selected = emp.id === selectedId
          return (
            <li key={emp.id}>
              <button
                type="button"
                onClick={() => onSelect(emp.id)}
                className={`flex w-full items-center gap-2 rounded-lg py-2 pr-3 text-left transition-colors ${
                  selected
                    ? 'bg-primary-light ring-1 ring-primary/30'
                    : 'hover:bg-neutral-50'
                }`}
                style={{ paddingLeft: `${12 + depth * 20}px` }}
              >
                {hasChildren ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleCollapse(emp.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        onToggleCollapse(emp.id)
                      }
                    }}
                    className="shrink-0 rounded p-0.5 text-muted hover:bg-neutral-200"
                  >
                    {collapsed ? (
                      <HiChevronRight className="h-4 w-4" />
                    ) : (
                      <HiChevronDown className="h-4 w-4" />
                    )}
                  </span>
                ) : (
                  <span className="w-5 shrink-0" />
                )}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    selected ? 'bg-primary text-white' : 'bg-primary-light text-primary'
                  }`}
                >
                  {emp.avatar || emp.name?.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{emp.name}</span>
                    <span className="font-mono text-[10px] text-muted">{emp.id}</span>
                    <Badge status={emp.status === 'on-leave' ? 'on-leave' : emp.status} />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {emp.role} · {emp.department}
                    {emp.managerId && (
                      <> · Reports to {getEmployeeManagerName(employees, emp.managerId)}</>
                    )}
                  </span>
                </span>
                {childCount > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-muted">
                    <HiUsers className="h-3 w-3" />
                    {childCount}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
