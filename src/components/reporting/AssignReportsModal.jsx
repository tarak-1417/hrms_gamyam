import { useEffect, useMemo, useState } from 'react'
import { HiSearch, HiUserAdd } from 'react-icons/hi'
import Modal from '../ui/Modal'
import { getAssignableEmployees } from '../../utils/reportingTreeUtils'
import { getEmployeeManagerName } from '../../utils/organizationHelpers'

export default function AssignReportsModal({
  open,
  onClose,
  manager,
  employees,
  onSyncTeam,
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())

  const assignable = useMemo(
    () => (manager ? getAssignableEmployees(employees, manager.id) : []),
    [employees, manager],
  )

  const currentTeamIds = useMemo(() => {
    if (!manager) return []
    return employees
      .filter((e) => e.managerId === manager.id && e.status !== 'inactive')
      .map((e) => e.id)
  }, [employees, manager])

  useEffect(() => {
    if (open && manager) {
      setSelected(new Set(currentTeamIds))
    }
  }, [open, manager?.id, currentTeamIds])

  const filtered = useMemo(() => {
    if (!search.trim()) return assignable
    const q = search.trim().toLowerCase()
    return assignable.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q),
    )
  }, [assignable, search])

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelected(new Set(filtered.map((e) => e.id)))
  }

  const clearAll = () => setSelected(new Set())

  const changesCount = useMemo(() => {
    const added = [...selected].filter((id) => !currentTeamIds.includes(id)).length
    const removed = currentTeamIds.filter((id) => !selected.has(id)).length
    return { added, removed }
  }, [selected, currentTeamIds])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!manager) return
    const ok = onSyncTeam(manager.id, [...selected])
    if (ok) {
      setSearch('')
      onClose()
    }
  }

  const handleClose = () => {
    setSelected(new Set())
    setSearch('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Manage team assignments"
      subtitle={
        manager
          ? `Add, reassign, or remove who reports to ${manager.name}. Uncheck to remove from this manager only.`
          : 'Select a manager from the list first'
      }
      wide
    >
      {manager ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary-light/30 px-3 py-2 text-sm">
            <p className="font-medium text-foreground">{manager.name}</p>
            <p className="text-xs text-muted">
              {manager.role} · {manager.department} · {currentTeamIds.length} current report(s)
            </p>
          </div>

          <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-muted">
            Checked = reports to this manager. Employees on another team can be checked to{' '}
            <strong className="text-foreground">move them here</strong>. Uncheck someone on this
            team to <strong className="text-foreground">remove their reporting line</strong> (they
            are not deleted).
          </p>

          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees…"
              className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">
              {selected.size} selected
              {(changesCount.added > 0 || changesCount.removed > 0) && (
                <span className="ml-1 text-primary">
                  (+{changesCount.added} / −{changesCount.removed})
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={selectAllVisible} className="font-medium text-primary hover:underline">
                Select all
              </button>
              <button type="button" onClick={clearAll} className="font-medium text-muted hover:underline">
                Clear all
              </button>
            </div>
          </div>

          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {filtered.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted">No employees available</li>
            ) : (
              filtered.map((emp) => {
                const checked = selected.has(emp.id)
                const onThisTeam = emp.managerId === manager.id
                const currentManager = getEmployeeManagerName(employees, emp.managerId)
                return (
                  <li key={emp.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors ${
                        checked ? 'bg-primary-light/50 ring-1 ring-primary/30' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(emp.id)}
                        className="mt-1 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                          {emp.name}
                          {onThisTeam && (
                            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              On this team
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted">
                          {emp.id} · {emp.role}
                        </p>
                        <p className="text-[10px] text-muted">
                          {onThisTeam
                            ? 'Currently reports here'
                            : `Reports to: ${currentManager}`}
                        </p>
                      </div>
                    </label>
                  </li>
                )
              })
            )}
          </ul>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <HiUserAdd className="h-4 w-4" />
              Save team
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">Select a manager, then use Manage team or Assign reports.</p>
      )}
    </Modal>
  )
}
