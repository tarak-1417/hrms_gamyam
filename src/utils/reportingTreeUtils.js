import { getDirectReports, getEmployeeManagerName } from './organizationHelpers'

export const NODE_WIDTH = 260
export const NODE_HEIGHT = 118
const GAP_X = 48
const GAP_Y = 100

export function filterEmployeesForTree(employees, { search = '', department = 'all', designation = 'all' }) {
  let list = employees.filter((e) => e.status !== 'inactive')
  if (department !== 'all') {
    list = list.filter((e) => e.department === department)
  }
  if (designation !== 'all') {
    list = list.filter((e) => e.role === designation)
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    list = list.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q),
    )
  }
  return list
}

export function getTreeRoots(employees) {
  const ids = new Set(employees.map((e) => e.id))
  return employees.filter((e) => !e.managerId || !ids.has(e.managerId))
}

export function buildChildrenMap(employees) {
  const map = new Map()
  employees.forEach((e) => map.set(e.id, []))
  employees.forEach((e) => {
    if (e.managerId && map.has(e.managerId)) {
      map.get(e.managerId).push(e)
    }
  })
  map.forEach((kids) => kids.sort((a, b) => a.name.localeCompare(b.name)))
  return map
}

export function getDescendantIds(employeeId, childrenMap) {
  const ids = []
  const walk = (id) => {
    const kids = childrenMap.get(id) || []
    kids.forEach((c) => {
      ids.push(c.id)
      walk(c.id)
    })
  }
  walk(employeeId)
  return ids
}

export function getAncestorIds(employeeId, employees) {
  const byId = new Map(employees.map((e) => [e.id, e]))
  const ids = []
  let current = byId.get(employeeId)
  while (current?.managerId && byId.has(current.managerId)) {
    ids.push(current.managerId)
    current = byId.get(current.managerId)
  }
  return ids
}

function subtreeUnits(id, childrenMap, collapsed) {
  if (collapsed.has(id)) return 1
  const kids = childrenMap.get(id) || []
  if (!kids.length) return 1
  return kids.reduce((sum, c) => sum + subtreeUnits(c.id, childrenMap, collapsed), 0)
}

function layoutSubtree(id, childrenMap, collapsed, depth, leftUnit, positions) {
  const units = subtreeUnits(id, childrenMap, collapsed)
  const centerUnit = leftUnit + units / 2
  const x = centerUnit * (NODE_WIDTH + GAP_X)
  const y = depth * (NODE_HEIGHT + GAP_Y)
  positions.set(id, { x, y })

  if (collapsed.has(id)) return leftUnit + units

  const kids = childrenMap.get(id) || []
  let cursor = leftUnit
  kids.forEach((child) => {
    cursor = layoutSubtree(child.id, childrenMap, collapsed, depth + 1, cursor, positions)
  })
  return leftUnit + units
}

export function computeTreeLayout(roots, childrenMap, collapsed = new Set()) {
  const positions = new Map()
  let cursor = 0
  roots.forEach((root) => {
    cursor = layoutSubtree(root.id, childrenMap, collapsed, 0, cursor, positions)
    cursor += 0.5
  })
  return positions
}

export function getVisibleEmployeeIds(employees, collapsed, childrenMap) {
  const roots = getTreeRoots(employees)
  const visible = new Set()
  const walk = (id) => {
    visible.add(id)
    if (collapsed.has(id)) return
    ;(childrenMap.get(id) || []).forEach((c) => walk(c.id))
  }
  roots.forEach((r) => walk(r.id))
  return visible
}

export function buildReportingFlowGraph({
  employees,
  collapsed = new Set(),
  selectedId = null,
  highlightedChain = null,
}) {
  const childrenMap = buildChildrenMap(employees)
  const roots = getTreeRoots(employees)
  const visibleIds = getVisibleEmployeeIds(employees, collapsed, childrenMap)
  const visibleEmployees = employees.filter((e) => visibleIds.has(e.id))
  const positions = computeTreeLayout(roots, childrenMap, collapsed)

  const chainSet = highlightedChain
    ? new Set(highlightedChain)
    : selectedId
      ? new Set([selectedId, ...getAncestorIds(selectedId, employees), ...getDescendantIds(selectedId, childrenMap)])
      : new Set()

  const nodes = visibleEmployees.map((emp) => {
    const pos = positions.get(emp.id) || { x: 0, y: 0 }
    const directCount = getDirectReports(employees, emp.id).length
    const hasChildren = (childrenMap.get(emp.id) || []).length > 0
    return {
      id: emp.id,
      type: 'reportingEmployee',
      position: { x: pos.x, y: pos.y },
      data: {
        employee: emp,
        teamCount: directCount,
        hasChildren,
        collapsed: collapsed.has(emp.id),
        selected: emp.id === selectedId,
        highlighted: chainSet.has(emp.id),
        managerName: getEmployeeManagerName(employees, emp.managerId),
        directReports: getDirectReports(employees, emp.id),
      },
    }
  })

  const edges = []
  visibleEmployees.forEach((emp) => {
    if (!emp.managerId || !visibleIds.has(emp.managerId)) return
    const highlighted = chainSet.has(emp.id) && chainSet.has(emp.managerId)
    edges.push({
      id: `${emp.managerId}-${emp.id}`,
      source: emp.managerId,
      target: emp.id,
      type: 'smoothstep',
      animated: highlighted,
      style: {
        stroke: highlighted ? '#f97316' : '#cbd5e1',
        strokeWidth: highlighted ? 2.5 : 1.5,
      },
    })
  })

  const offsetX = NODE_WIDTH / 2
  const offsetY = NODE_HEIGHT / 2
  nodes.forEach((n) => {
    n.position = { x: n.position.x - offsetX, y: n.position.y - offsetY }
  })

  return { nodes, edges, childrenMap }
}

export function getDepartmentOptions(employees) {
  return [...new Set(employees.map((e) => e.department).filter(Boolean))].sort()
}

export function getDesignationOptions(employees) {
  return [...new Set(employees.map((e) => e.role).filter(Boolean))].sort()
}

/** Assigning `managerId` as manager of `employeeId` would create a cycle */
export function wouldCreateReportingCycle(employeeId, managerId, employees) {
  if (!managerId) return false
  if (employeeId === managerId) return true
  const childrenMap = buildChildrenMap(employees)
  return getDescendantIds(employeeId, childrenMap).includes(managerId)
}

export function getManagerSubtreeIds(focalEmployeeId, employees) {
  const childrenMap = buildChildrenMap(employees)
  return new Set([focalEmployeeId, ...getDescendantIds(focalEmployeeId, childrenMap)])
}

export function getEmployeeViewIds(focalEmployeeId, employees) {
  const ancestors = getAncestorIds(focalEmployeeId, employees)
  const direct = getDirectReports(employees, focalEmployeeId).map((e) => e.id)
  return new Set([focalEmployeeId, ...ancestors, ...direct])
}

export function getEmployeesForViewMode(employees, viewMode, focalEmployeeId) {
  const active = employees.filter((e) => e.status !== 'inactive')
  if (viewMode === 'organization' || !focalEmployeeId) return active
  if (viewMode === 'manager') {
    const ids = getManagerSubtreeIds(focalEmployeeId, active)
    return active.filter((e) => ids.has(e.id))
  }
  if (viewMode === 'employee') {
    const ids = getEmployeeViewIds(focalEmployeeId, active)
    return active.filter((e) => ids.has(e.id))
  }
  return active
}

/**
 * Employees who can be assigned to report to `managerId`.
 * Includes current direct reports (so you can keep or remove them).
 * Excludes only the manager and their upstream chain (prevents cycles).
 */
export function getAssignableEmployees(employees, managerId) {
  if (!managerId) {
    return employees.filter((e) => e.status !== 'inactive')
  }
  const ancestorIds = new Set(getAncestorIds(managerId, employees))
  return employees.filter((e) => {
    if (e.status === 'inactive') return false
    if (e.id === managerId) return false
    if (ancestorIds.has(e.id)) return false
    return true
  })
}

export function getDirectReportIds(employees, managerId) {
  return employees.filter((e) => e.managerId === managerId && e.status !== 'inactive').map((e) => e.id)
}

/** Employees who can be set as manager of `employeeId` (no cycles) */
export function getEligibleManagersForEmployee(employeeId, employees) {
  if (!employeeId) return employees.filter((e) => e.status !== 'inactive')
  const blocked = getManagerSubtreeIds(employeeId, employees)
  return employees.filter((e) => e.status !== 'inactive' && !blocked.has(e.id))
}

export const VIEW_MODE_LABELS = {
  organization: 'Organization',
  manager: 'Manager',
  employee: 'Employee',
}

export const VIEW_MODE_DESCRIPTIONS = {
  organization: 'Full company reporting hierarchy — assign and edit reporting lines',
  manager: 'Your team subtree — direct and indirect reports under you',
  employee: 'Your reporting chain — manager, peers context, and direct reports',
}

/** Above this count, visual tree uses branch focus or list/department layouts */
export const TREE_DISPLAY_LIMIT = 18

export const LAYOUT_PATTERN_LABELS = {
  list: 'Hierarchy list',
  departments: 'By department',
  tree: 'Visual tree',
}

export const LAYOUT_PATTERN_HINTS = {
  list: 'Best for large teams — expandable indented rows, fast scroll',
  departments: 'Grouped by department — scan hundreds of employees easily',
  tree: 'Interactive diagram — best for small teams or one branch at a time',
}

export function getFocusBranchEmployeeIds(focusEmployeeId, employees) {
  if (!focusEmployeeId) return null
  const childrenMap = buildChildrenMap(employees)
  const ancestors = getAncestorIds(focusEmployeeId, employees)
  const descendants = getDescendantIds(focusEmployeeId, childrenMap)
  return new Set([focusEmployeeId, ...ancestors, ...descendants])
}

export function filterEmployeesToFocusBranch(employees, focusEmployeeId) {
  const ids = getFocusBranchEmployeeIds(focusEmployeeId, employees)
  if (!ids) return employees
  return employees.filter((e) => ids.has(e.id))
}

export function buildHierarchyRows(employees, collapsed = new Set()) {
  const childrenMap = buildChildrenMap(employees)
  const roots = getTreeRoots(employees)
  const rows = []

  const walk = (emp, depth) => {
    const kids = childrenMap.get(emp.id) || []
    const isCollapsed = collapsed.has(emp.id)
    rows.push({
      employee: emp,
      depth,
      childCount: kids.length,
      hasChildren: kids.length > 0,
      collapsed: isCollapsed,
    })
    if (!isCollapsed) {
      kids.forEach((child) => walk(child, depth + 1))
    }
  }

  roots.forEach((root) => walk(root, 0))
  return rows
}

export function groupEmployeesByDepartment(employees) {
  const byDept = new Map()
  employees.forEach((emp) => {
    const dept = emp.department || 'Unassigned'
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept).push(emp)
  })
  return [...byDept.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([department, list]) => ({
      department,
      employees: list.sort((a, b) => a.name.localeCompare(b.name)),
    }))
}

export function suggestLayoutPattern(employeeCount) {
  return employeeCount > TREE_DISPLAY_LIMIT ? 'list' : 'tree'
}

export function getOrganizationRoots(employees) {
  return getTreeRoots(employees).sort((a, b) => a.name.localeCompare(b.name))
}
