import { useMemo, useState } from 'react'
import { Download, ScrollText, Shield, Eye } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import {
  AUDIT_CATEGORIES,
  filterAuditLogs,
  filterAuditLogsForRole,
  formatAuditTimestamp,
  formatAuditRelative,
  categoryLabel,
  exportAuditLogsCsv,
} from '../../utils/auditLogUtils'

const ROLE_FILTER_OPTIONS = [
  { id: 'all', label: 'All roles' },
  { id: 'superadmin', label: 'Super Admin' },
  { id: 'admin', label: 'HR Admin' },
  { id: 'manager', label: 'Manager' },
  { id: 'employee', label: 'Employee' },
]

export default function AuditLogs() {
  const { user } = useAuth()
  const { auditLogs, showToast } = useHrms()
  const isSuperAdmin = user?.role === 'superadmin'
  const isHrAdmin = user?.role === 'admin'

  const [category, setCategory] = useState('all')
  const [actorRole, setActorRole] = useState('all')
  const [search, setSearch] = useState('')

  const scopedLogs = useMemo(
    () => filterAuditLogsForRole(auditLogs, user?.role),
    [auditLogs, user?.role],
  )

  const visibleCategories = useMemo(() => {
    if (isSuperAdmin) return AUDIT_CATEGORIES
    return AUDIT_CATEGORIES.filter(
      (c) => c.id === 'all' || !['platform', 'user', 'security', 'subscription'].includes(c.id),
    )
  }, [isSuperAdmin])

  const filtered = useMemo(
    () =>
      filterAuditLogs(scopedLogs, {
        category,
        search,
        actorRole: isSuperAdmin ? actorRole : 'all',
      }),
    [scopedLogs, category, search, actorRole, isSuperAdmin],
  )

  const handleExport = () => {
    if (!isSuperAdmin) return
    const csv = exportAuditLogsCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${filtered.length} log entries`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ScrollText className="h-7 w-7 text-primary" />
            Audit logs
          </h1>
          <p className="page-subtitle">
            Who did what, when, and which data was affected — for monitoring and security
          </p>
        </div>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleExport}
            disabled={!filtered.length}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {isHrAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          <Eye className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">View only — HR scope</p>
            <p className="mt-0.5 text-amber-800/90">
              You can review HR-related activity for your organization. Platform, user, and
              security logs are visible to Super Admin only.
            </p>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-light/30 px-4 py-3 text-sm">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-foreground">
            <span className="font-semibold">Full access</span> — all platform and HR actions,
            export, and filters.
          </p>
        </div>
      )}

      <Card
        title="Activity log"
        subtitle={`Showing ${filtered.length} of ${scopedLogs.length} entries you can access`}
        toolbar={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, user, target…"
              className="w-full min-w-[12rem] flex-1 rounded-lg border border-border px-3 py-2 text-sm sm:max-w-xs"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {visibleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {isSuperAdmin && (
              <select
                value={actorRole}
                onChange={(e) => setActorRole(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                {ROLE_FILTER_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      >
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">No audit entries match your filters.</p>
        ) : (
          <div className="table-scroll">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-neutral-50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Who</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Data affected</th>
                  {isSuperAdmin && (
                    <th className="px-4 py-3 text-left font-medium">Scope</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-foreground">{formatAuditRelative(log.timestamp)}</p>
                      <p className="text-xs text-muted">{formatAuditTimestamp(log.timestamp)}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-foreground">{log.actorName}</p>
                      <p className="text-xs capitalize text-muted">{log.actorRole}</p>
                      {isSuperAdmin && log.actorEmail && (
                        <p className="text-xs text-muted">{log.actorEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-medium text-foreground">{log.action}</td>
                    <td className="px-4 py-3 align-top">
                      <Badge status="active">{categoryLabel(log.category)}</Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-foreground">{log.targetLabel || '—'}</p>
                      {log.details && <p className="mt-0.5 text-xs text-muted">{log.details}</p>}
                      {log.targetId && (
                        <p className="mt-0.5 font-mono text-[10px] text-muted">
                          {log.targetType}/{log.targetId}
                        </p>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 align-top capitalize text-muted">{log.scope}</td>
                    )}
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
