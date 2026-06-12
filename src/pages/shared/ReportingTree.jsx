import { useCallback, useEffect, useMemo, useState } from 'react'
import { HiSearch, HiRefresh, HiUserAdd } from 'react-icons/hi'
import { GitBranch } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { resolveManagerEmployee } from '../../utils/organizationHelpers'
import ReportingTreeCanvas from '../../components/reporting/ReportingTreeCanvas'
import ReportingListView from '../../components/reporting/ReportingListView'
import ReportingDepartmentView from '../../components/reporting/ReportingDepartmentView'
import ReportingEmployeePanel from '../../components/reporting/ReportingEmployeePanel'
import AssignReportsModal from '../../components/reporting/AssignReportsModal'
import MoveEmployeeModal from '../../components/reporting/MoveEmployeeModal'
import {
  buildReportingFlowGraph,
  buildHierarchyRows,
  filterEmployeesForTree,
  filterEmployeesToFocusBranch,
  getDepartmentOptions,
  getDesignationOptions,
  getEmployeesForViewMode,
  groupEmployeesByDepartment,
  getOrganizationRoots,
  suggestLayoutPattern,
  TREE_DISPLAY_LIMIT,
  VIEW_MODE_LABELS,
  VIEW_MODE_DESCRIPTIONS,
  LAYOUT_PATTERN_LABELS,
  LAYOUT_PATTERN_HINTS,
} from '../../utils/reportingTreeUtils'
import {
  getEmployeeManagerName,
  getDirectReports,
} from '../../utils/organizationHelpers'

function viewsForRole(role) {
  if (role === 'employee') return ['employee']
  if (role === 'manager') return ['manager', 'employee']
  return ['organization', 'manager', 'employee']
}

export default function ReportingTree() {
  const { user } = useAuth()
  const {
    employees: allEmployees,
    syncManagerTeam,
    updateEmployeeManager,
    unassignEmployeesFromManager,
  } = useHrms()

  const availableViews = useMemo(() => viewsForRole(user?.role), [user?.role])
  const [viewMode, setViewMode] = useState(availableViews[0])
  const [previewAsId, setPreviewAsId] = useState('')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [designation, setDesignation] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [collapsed, setCollapsed] = useState(new Set())
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState(null)
  const [layoutPattern, setLayoutPattern] = useState('list')
  const [branchFocusId, setBranchFocusId] = useState(null)
  const [layoutTouched, setLayoutTouched] = useState(false)

  useEffect(() => {
    if (!availableViews.includes(viewMode)) {
      setViewMode(availableViews[0])
    }
  }, [availableViews, viewMode])

  const canManage = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager'

  const linkedEmployee = useMemo(() => {
    if (user?.employeeId) {
      return (allEmployees || []).find((e) => e.id === user.employeeId) ?? null
    }
    return resolveManagerEmployee(user, allEmployees || [])
  }, [user, allEmployees])

  const focalEmployeeId = useMemo(() => {
    if (viewMode === 'organization') return null
    if (linkedEmployee?.id) return linkedEmployee.id
    return previewAsId || null
  }, [viewMode, linkedEmployee, previewAsId])

  const viewEmployees = useMemo(
    () => getEmployeesForViewMode(allEmployees || [], viewMode, focalEmployeeId),
    [allEmployees, viewMode, focalEmployeeId],
  )

  const filteredEmployees = useMemo(
    () => filterEmployeesForTree(viewEmployees, { search, department, designation }),
    [viewEmployees, search, department, designation],
  )

  const employeeCount = filteredEmployees.length
  const isLargeOrg = employeeCount > TREE_DISPLAY_LIMIT

  useEffect(() => {
    if (!layoutTouched && employeeCount > 0) {
      setLayoutPattern(suggestLayoutPattern(employeeCount))
    }
  }, [employeeCount, layoutTouched])

  useEffect(() => {
    if (layoutPattern === 'tree' && isLargeOrg) {
      const roots = getOrganizationRoots(filteredEmployees)
      if (!branchFocusId && roots[0]) {
        setBranchFocusId(roots[0].id)
      }
    }
  }, [layoutPattern, isLargeOrg, filteredEmployees, branchFocusId])

  const treeEmployees = useMemo(() => {
    if (layoutPattern !== 'tree') return filteredEmployees
    if (!isLargeOrg) return filteredEmployees
    const focusId = branchFocusId || getOrganizationRoots(filteredEmployees)[0]?.id
    if (!focusId) return filteredEmployees
    return filterEmployeesToFocusBranch(filteredEmployees, focusId)
  }, [layoutPattern, filteredEmployees, isLargeOrg, branchFocusId])

  const departments = useMemo(() => getDepartmentOptions(viewEmployees), [viewEmployees])
  const designations = useMemo(() => getDesignationOptions(viewEmployees), [viewEmployees])
  const orgRoots = useMemo(() => getOrganizationRoots(filteredEmployees), [filteredEmployees])

  const listRows = useMemo(() => {
    if (search.trim()) {
      return filteredEmployees.map((employee) => ({
        employee,
        depth: 0,
        childCount: 0,
        hasChildren: false,
        collapsed: false,
      }))
    }
    return buildHierarchyRows(filteredEmployees, collapsed)
  }, [filteredEmployees, collapsed, search])

  const departmentGroups = useMemo(
    () => groupEmployeesByDepartment(filteredEmployees),
    [filteredEmployees],
  )

  const { nodes, edges } = useMemo(
    () =>
      buildReportingFlowGraph({
        employees: treeEmployees,
        collapsed,
        selectedId,
      }),
    [treeEmployees, collapsed, selectedId],
  )

  const branchFocusEmployee = useMemo(
    () => (allEmployees || []).find((e) => e.id === branchFocusId) ?? null,
    [allEmployees, branchFocusId],
  )

  const selectedEmployee = useMemo(
    () => (allEmployees || []).find((e) => e.id === selectedId) ?? null,
    [allEmployees, selectedId],
  )

  const managerName = selectedEmployee
    ? getEmployeeManagerName(allEmployees, selectedEmployee.managerId)
    : '—'

  const directReports = selectedEmployee
    ? getDirectReports(allEmployees, selectedEmployee.id)
    : []

  const previewOptions = useMemo(
    () => (allEmployees || []).filter((e) => e.status !== 'inactive'),
    [allEmployees],
  )

  const handleToggleCollapse = useCallback((id) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelect = useCallback((id) => {
    setSelectedId(id)
    if (layoutPattern === 'tree' && isLargeOrg) {
      setBranchFocusId(id)
    }
  }, [layoutPattern, isLargeOrg])

  const openAssignModal = useCallback((emp) => {
    setAssignTarget(emp)
    setAssignModalOpen(true)
  }, [])

  const handleSyncTeam = useCallback(
    (managerId, employeeIds) => syncManagerTeam(managerId, employeeIds),
    [syncManagerTeam],
  )

  const handleUpdateManager = useCallback(
    (employeeId, managerId) => updateEmployeeManager(employeeId, managerId),
    [updateEmployeeManager],
  )

  const handleRemoveFromManager = useCallback(
    (emp) => {
      if (!emp?.id) return
      if (!window.confirm(`Remove reporting manager for ${emp.name}?`)) return
      updateEmployeeManager(emp.id, null)
    },
    [updateEmployeeManager],
  )

  const handleRemoveReportFromTeam = useCallback(
    (report) => {
      if (!report?.id || !selectedEmployee) return
      if (
        !window.confirm(
          `Remove ${report.name} from ${selectedEmployee.name}'s team? They will have no reporting manager.`,
        )
      ) {
        return
      }
      unassignEmployeesFromManager([report.id])
    },
    [selectedEmployee, unassignEmployeesFromManager],
  )

  const openMoveModal = useCallback((emp) => {
    setMoveTarget(emp)
    setMoveModalOpen(true)
  }, [])

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => {
    const withChildren = filteredEmployees.filter((e) =>
      filteredEmployees.some((x) => x.managerId === e.id),
    )
    setCollapsed(new Set(withChildren.map((e) => e.id)))
  }

  const needsPreviewPicker =
    viewMode !== 'organization' && !linkedEmployee?.id && ['admin', 'superadmin'].includes(user?.role)

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <GitBranch className="h-7 w-7 text-primary" />
            Reporting hierarchy
          </h1>
          <p className="page-subtitle">{VIEW_MODE_DESCRIPTIONS[viewMode]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {availableViews.length > 1 && (
            <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5 shadow-sm">
              {availableViews.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === mode
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted hover:bg-neutral-50 hover:text-foreground'
                  }`}
                >
                  {VIEW_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          )}
          {canManage && viewMode !== 'employee' && (
            <button
              type="button"
              onClick={() => openAssignModal(selectedEmployee || assignTarget)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              <HiUserAdd className="h-4 w-4" />
              Manage team
            </button>
          )}
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-neutral-50"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-neutral-50"
          >
            Collapse all
          </button>
        </div>
      </div>

      {needsPreviewPicker && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Preview as:</span>
          <select
            value={previewAsId}
            onChange={(e) => setPreviewAsId(e.target.value)}
            className="min-w-[200px] rounded-lg border border-border bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Select employee…</option>
            {previewOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.role}
              </option>
            ))}
          </select>
          {!previewAsId && (
            <span className="text-xs text-muted">Choose someone to preview {VIEW_MODE_LABELS[viewMode]} view</span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap rounded-lg border border-neutral-200 bg-white p-0.5 shadow-sm">
          {(['list', 'departments', 'tree']).map((pattern) => (
            <button
              key={pattern}
              type="button"
              onClick={() => {
                setLayoutTouched(true)
                setLayoutPattern(pattern)
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                layoutPattern === pattern
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-neutral-50 hover:text-foreground'
              }`}
              title={LAYOUT_PATTERN_HINTS[pattern]}
            >
              {LAYOUT_PATTERN_LABELS[pattern]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{LAYOUT_PATTERN_HINTS[layoutPattern]}</p>
      </div>

      {isLargeOrg && layoutPattern === 'list' && (
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/80 px-4 py-2.5 text-sm text-blue-900">
          <strong>{employeeCount} employees</strong> — hierarchy list handles large orgs better than a
          single diagram. Switch to <strong>Visual tree</strong> to explore one branch at a time.
        </div>
      )}

      {layoutPattern === 'tree' && isLargeOrg && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-2.5 text-sm">
          <span className="text-amber-950">
            Branch focus: showing <strong>{treeEmployees.length}</strong> of {employeeCount} people
            {branchFocusEmployee ? ` under ${branchFocusEmployee.name}` : ''}.
          </span>
          <select
            value={branchFocusId || ''}
            onChange={(e) => setBranchFocusId(e.target.value || null)}
            className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs font-medium"
          >
            {orgRoots.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.role})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setLayoutTouched(true)
              setLayoutPattern('list')
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View full list
          </button>
        </div>
      )}

      {viewMode !== 'organization' && focalEmployeeId && (
        <div className="rounded-xl border border-primary/20 bg-primary-light/25 px-4 py-2 text-sm">
          <span className="font-medium text-foreground">
            {VIEW_MODE_LABELS[viewMode]} view
          </span>
          <span className="text-muted">
            {' '}
            — showing{' '}
            {viewMode === 'manager'
              ? 'your higher authorities above and your full team below'
              : 'your reporting chain (managers above, direct reports below)'}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, role…"
            className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="all">All designations</option>
          {designations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setSearch('')
            setDepartment('all')
            setDesignation('all')
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-muted hover:bg-neutral-100"
        >
          <HiRefresh className="h-4 w-4" />
          Reset
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="relative min-h-0 min-w-0 flex-1">
          {needsPreviewPicker && !previewAsId ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <GitBranch className="h-12 w-12 text-neutral-300" />
              <p className="mt-3 font-medium text-foreground">Select an employee to preview</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Use the preview dropdown above to see the {VIEW_MODE_LABELS[viewMode].toLowerCase()} reporting
                tree.
              </p>
            </div>
          ) : employeeCount === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <GitBranch className="h-12 w-12 text-neutral-300" />
              <p className="mt-3 font-medium text-foreground">No employees match your filters</p>
              <p className="mt-1 text-sm text-muted">Adjust search or filters to see the reporting tree.</p>
            </div>
          ) : layoutPattern === 'list' ? (
            <ReportingListView
              rows={listRows}
              employees={filteredEmployees}
              selectedId={selectedId}
              onSelect={handleSelect}
              onToggleCollapse={handleToggleCollapse}
            />
          ) : layoutPattern === 'departments' ? (
            <ReportingDepartmentView
              groups={departmentGroups}
              employees={filteredEmployees}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          ) : (
            <ReportingTreeCanvas
              initialNodes={nodes}
              initialEdges={edges}
              onNodeSelect={handleSelect}
              onToggleCollapse={handleToggleCollapse}
            />
          )}
        </div>
        <ReportingEmployeePanel
          employee={selectedEmployee}
          managerName={managerName}
          directReports={directReports}
          employees={allEmployees}
          canManage={canManage && viewMode !== 'employee'}
          onClose={() => setSelectedId(null)}
          onSelectEmployee={handleSelect}
          onAssignReports={openAssignModal}
          onMoveEmployee={openMoveModal}
          onRemoveFromManager={handleRemoveFromManager}
          onRemoveReportFromTeam={handleRemoveReportFromTeam}
        />
      </div>

      <AssignReportsModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false)
          setAssignTarget(null)
        }}
        manager={assignTarget}
        employees={allEmployees}
        onSyncTeam={handleSyncTeam}
      />

      <MoveEmployeeModal
        open={moveModalOpen}
        onClose={() => {
          setMoveModalOpen(false)
          setMoveTarget(null)
        }}
        employee={moveTarget}
        employees={allEmployees}
        onUpdateManager={handleUpdateManager}
      />
    </div>
  )
}
