import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import DepartmentCard from '../../components/hr/DepartmentCard'
import { getDepartmentsPageMeta, getVisibleDepartments } from '../../utils/departmentAccess'

export default function Departments() {
  const { user } = useAuth()
  const { departments, employees } = useHrms()
  const [expandedId, setExpandedId] = useState(null)

  const visibleDepartments = useMemo(
    () =>
      getVisibleDepartments({
        role: user?.role,
        user,
        departments,
        employees,
      }),
    [user, departments, employees],
  )

  const { title, subtitle } = getDepartmentsPageMeta(user?.role)

  const toggleExpand = (deptId) => {
    setExpandedId((current) => (current === deptId ? null : deptId))
  }

  if (visibleDepartments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
        <p className="text-sm font-medium text-foreground">No departments to show</p>
        <p className="mt-1 text-sm text-muted">Your account does not have a department assigned.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
        {user?.role === 'manager' && visibleDepartments.length === 1 && (
          <p className="mt-2 inline-flex rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
            Manager view — {visibleDepartments[0].name} only
          </p>
        )}
        {user?.role === 'admin' && (
          <p className="mt-2 text-xs text-muted">
            Hover a card and use the expand icon to see employees. Click the minimize icon to
            collapse.
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleDepartments.map((dept) => (
          <DepartmentCard
            key={dept.id}
            department={dept}
            expanded={expandedId === dept.id}
            onToggleExpand={() => toggleExpand(dept.id)}
          />
        ))}
      </div>
    </div>
  )
}
