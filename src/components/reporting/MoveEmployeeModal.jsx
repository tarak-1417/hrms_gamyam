import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { getEligibleManagersForEmployee } from '../../utils/reportingTreeUtils'
import { getEmployeeManagerName } from '../../utils/organizationHelpers'

export default function MoveEmployeeModal({
  open,
  onClose,
  employee,
  employees,
  onUpdateManager,
}) {
  const [managerId, setManagerId] = useState('')

  const options = employee
    ? getEligibleManagersForEmployee(employee.id, employees).filter((e) => e.id !== employee.id)
    : []

  useEffect(() => {
    setManagerId(employee?.managerId || '')
  }, [employee?.id, employee?.managerId, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!employee) return
    const ok = onUpdateManager(employee.id, managerId || null)
    if (ok) onClose()
  }

  const handleRemove = () => {
    if (!employee) return
    if (!window.confirm(`Remove reporting line for ${employee.name}? They will have no manager.`)) return
    const ok = onUpdateManager(employee.id, null)
    if (ok) onClose()
  }

  if (!employee) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change reporting manager"
      subtitle={`Reassign ${employee.name} to a different manager`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Current manager:{' '}
          <strong className="text-foreground">
            {getEmployeeManagerName(employees, employee.managerId)}
          </strong>
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            New reporting manager
          </label>
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">— No manager (top level) —</option>
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.role} ({m.department})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remove reporting manager
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
