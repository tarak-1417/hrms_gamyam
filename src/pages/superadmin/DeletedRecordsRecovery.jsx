import { useMemo, useState } from 'react'
import { ArchiveRestore, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useHrms } from '../../hooks/useHrms'
import { TRASH_ENTITY_TYPES, trashEntityLabel, formatTrashDeletedAt } from '../../utils/trashHelpers'

export default function DeletedRecordsRecovery() {
  const { trash, restoreTrashItem, purgeTrashItem, showToast } = useHrms()
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = [...(trash || [])]
    if (typeFilter !== 'all') {
      list = list.filter((t) => t.entityType === typeFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.label?.toLowerCase().includes(q) ||
          t.entityType?.toLowerCase().includes(q) ||
          t.deletedBy?.name?.toLowerCase().includes(q),
      )
    }
    return list
  }, [trash, typeFilter, search])

  const handleRestore = (item) => {
    const ok = restoreTrashItem(item.id)
    if (ok) showToast(`Restored: ${item.label}`)
    else showToast('Could not restore — item may already exist or is a platform record')
  }

  const handlePurge = (item) => {
    if (
      !window.confirm(
        `Permanently delete "${item.label}"? This cannot be undone.`,
      )
    ) {
      return
    }
    purgeTrashItem(item.id)
    showToast('Permanently removed from recycle bin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <ArchiveRestore className="h-7 w-7 text-primary" />
          Deleted records recovery
        </h1>
        <p className="page-subtitle">
          Soft-deleted data (recycle bin) — restore accidental removals instead of losing them
          permanently
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-light/25 px-4 py-3 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground">Super Admin only</p>
          <p className="mt-0.5 text-muted">
            Deletes across the system move records here first (employees, payroll, leave,
            departments, templates, platform orgs, and more). Use <strong>Restore</strong> to
            recover or <strong>Delete forever</strong> to purge permanently.
          </p>
        </div>
      </div>

      <Card
        title="Recycle bin"
        subtitle={`${filtered.length} item(s) waiting for restore or permanent deletion`}
        toolbar={
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search label or user…"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm sm:max-w-xs"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {TRASH_ENTITY_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ArchiveRestore className="mx-auto h-12 w-12 text-muted/40" />
            <p className="mt-3 text-sm font-medium text-foreground">Recycle bin is empty</p>
            <p className="mt-1 text-sm text-muted">
              Deleted employees, payroll, leave, and other records will appear here.
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-neutral-50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Deleted</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Record</th>
                  <th className="px-4 py-3 text-left font-medium">Deleted by</th>
                  <th className="px-4 py-3 text-left font-medium">Scope</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/60">
                    <td className="px-4 py-3 text-muted">{formatTrashDeletedAt(item.deletedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge status="on-leave">{trashEntityLabel(item.entityType)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="font-mono text-[10px] text-muted">
                        {item.entityType}/{item.entityId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{item.deletedBy?.name}</p>
                      <p className="text-xs capitalize text-muted">{item.deletedBy?.role}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">{item.scope}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePurge(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete forever
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
