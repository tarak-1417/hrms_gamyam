/** Sync branches with geo coordinates into attendance office locations */
export function syncOfficeLocationsFromBranches(branches, radiusMeters = 500) {
  return (branches || [])
    .filter((b) => b.status !== 'inactive' && b.latitude != null && b.longitude != null)
    .map((b) => ({
      id: b.id,
      name: `${b.name} Office`,
      address: b.address || `${b.city}, ${b.country}`,
      latitude: b.latitude,
      longitude: b.longitude,
      radiusMeters: b.radiusMeters ?? radiusMeters,
    }))
}

export function getDepartmentNames(departments) {
  return (departments || []).filter((d) => d.status !== 'inactive').map((d) => d.name)
}

export function getDesignationTitles(designations) {
  return (designations || []).filter((d) => d.status !== 'inactive').map((d) => d.title)
}

export function getBranchById(branches, branchId) {
  return (branches || []).find((b) => b.id === branchId)
}

export function getEmployeeManagerName(employees, managerId) {
  if (!managerId) return '—'
  return employees.find((e) => e.id === managerId)?.name ?? '—'
}

export function getDirectReports(employees, managerId) {
  if (!managerId) return []
  return employees.filter((e) => e.managerId === managerId && e.status !== 'inactive')
}

export function resolveManagerEmployee(user, employees) {
  if (!user) return null
  if (user.employeeId) {
    return employees.find((e) => e.id === user.employeeId) ?? null
  }
  return employees.find((e) => e.name === user.name) ?? null
}

export function getManagerTeamEmployees({ user, employees, departments }) {
  const managerEmp = resolveManagerEmployee(user, employees)
  if (managerEmp) {
    const reports = getDirectReports(employees, managerEmp.id)
    if (reports.length) return reports
    return employees.filter(
      (e) => e.department === managerEmp.department && e.id !== managerEmp.id && e.status !== 'inactive',
    )
  }

  const dept = departments?.find((d) => d.head === user?.name)
  if (dept) {
    return employees.filter((e) => e.department === dept.name && e.status !== 'inactive')
  }

  return employees.filter((e) => e.department === 'Engineering' && e.status !== 'inactive')
}

export function formatOrganizationAddress(org) {
  if (!org?.address) return ''
  const a = org.address
  return [a.line1, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')
}

export function getCompanyMergeDefaults(organization, employees, branches) {
  const org = organization || {}
  const headBranch = (branches || []).find((b) => b.isHeadOffice) || branches?.[0]
  const hrName = org.hrSignatory || 'HR Team'
  const hrEmp = employees?.find((e) => e.name === hrName)

  return {
    company_name: org.legalName || org.displayName || 'Company',
    work_location: headBranch
      ? `${headBranch.name}${headBranch.city ? `, ${headBranch.city}` : ''}`
      : formatOrganizationAddress(org),
    hr_signatory: hrName,
    reporting_manager: hrEmp?.name || hrName,
  }
}
