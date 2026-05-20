import { motion, AnimatePresence } from 'framer-motion'
import {
  HiMail,
  HiPhone,
  HiUser,
  HiOfficeBuilding,
  HiBriefcase,
  HiUsers,
  HiUserAdd,
  HiSwitchHorizontal,
  HiX,
} from 'react-icons/hi'
import Badge from '../ui/Badge'
import { getAssignableEmployees } from '../../utils/reportingTreeUtils'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-lg bg-neutral-50 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function ReportingEmployeePanel({
  employee,
  managerName,
  directReports,
  employees = [],
  canManage = false,
  onClose,
  onSelectEmployee,
  onAssignReports,
  onMoveEmployee,
  onRemoveFromManager,
  onRemoveReportFromTeam,
}) {
  const assignableCount = employee
    ? getAssignableEmployees(employees, employee.id).length
    : 0

  return (
    <AnimatePresence mode="wait">
      {employee ? (
        <motion.aside
          key={employee.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.2 }}
          className="flex w-full shrink-0 flex-col border-l border-neutral-200 bg-white lg:w-[360px]"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Employee details</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-neutral-100"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-lg font-bold text-white">
                {employee.avatar || employee.name?.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{employee.name}</p>
                <p className="font-mono text-xs text-muted">{employee.id}</p>
                <div className="mt-1">
                  <Badge status={employee.status === 'on-leave' ? 'on-leave' : employee.status} />
                </div>
              </div>
            </div>

            {canManage && (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onAssignReports?.(employee)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
                >
                  <HiUserAdd className="h-4 w-4" />
                  Manage team ({assignableCount} available)
                </button>
                <button
                  type="button"
                  onClick={() => onMoveEmployee?.(employee)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-light"
                >
                  <HiSwitchHorizontal className="h-4 w-4" />
                  Change / move manager
                </button>
                {employee.managerId && (
                  <button
                    type="button"
                    onClick={() => onRemoveFromManager?.(employee)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <HiX className="h-4 w-4" />
                    Remove reporting manager
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 space-y-2">
              <DetailRow icon={HiBriefcase} label="Designation" value={employee.role} />
              <DetailRow icon={HiOfficeBuilding} label="Department" value={employee.department} />
              <DetailRow icon={HiUser} label="Reporting manager" value={managerName} />
              <DetailRow icon={HiMail} label="Email" value={employee.email} />
              <DetailRow icon={HiPhone} label="Phone" value={employee.phone} />
            </div>

            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <HiUsers className="h-4 w-4" />
                Direct reports ({directReports?.length || 0})
              </p>
              {directReports?.length ? (
                <ul className="space-y-1.5">
                  {directReports.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-1 rounded-lg border border-neutral-100 pr-1"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectEmployee?.(r.id)}
                        className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary-light/30"
                      >
                        <span className="font-medium text-foreground">{r.name}</span>
                        <span className="ml-2 text-xs text-muted">{r.role}</span>
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          title="Remove from my team"
                          onClick={() => onRemoveReportFromTeam?.(r)}
                          className="shrink-0 rounded-md p-2 text-red-600 hover:bg-red-50"
                        >
                          <HiX className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No direct reports</p>
              )}
            </div>
          </div>
        </motion.aside>
      ) : (
        <motion.aside
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden w-[360px] shrink-0 flex-col items-center justify-center border-l border-neutral-200 bg-neutral-50/80 p-8 text-center lg:flex"
        >
          <HiUser className="h-12 w-12 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-foreground">Select an employee</p>
          <p className="mt-1 text-xs text-muted">
            Assign, reassign, or remove reporting lines — employees are not deleted.
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
