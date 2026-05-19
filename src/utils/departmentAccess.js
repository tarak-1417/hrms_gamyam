/** Which departments a user can see, with live employee counts */
export function enrichDepartments(departments, employees) {
  return departments.map((dept) => {
    const employeeList = employees.filter((e) => e.department === dept.name)
    return {
      ...dept,
      employees: employeeList.length,
      employeeList,
    }
  })
}

function managerDepartmentName(user, departments, employees = []) {
  const emp = user?.employeeId
    ? employees.find((e) => e.id === user.employeeId)
    : employees.find((e) => e.name === user?.name)
  if (emp?.department) return emp.department
  const byHead = departments.find(
    (d) => d.headEmployeeId === user?.employeeId || d.head === user?.name,
  )
  if (byHead) return byHead.name
  return 'Engineering'
}

export function getVisibleDepartments({ role, user, departments, employees }) {
  const enriched = enrichDepartments(departments, employees)

  if (role === 'admin' || role === 'superadmin') {
    return enriched
  }

  if (role === 'manager') {
    const deptName = managerDepartmentName(user, departments, employees)
    return enriched.filter((d) => d.name === deptName)
  }

  if (role === 'employee') {
    const emp = employees.find((e) => e.id === user?.employeeId)
    if (!emp?.department) return []
    return enriched.filter((d) => d.name === emp.department)
  }

  return []
}

export function getDepartmentsPageMeta(role) {
  if (role === 'manager') {
    return {
      title: 'My department',
      subtitle: 'Your team structure and members',
    }
  }
  if (role === 'employee') {
    return {
      title: 'My department',
      subtitle: 'Colleagues in your department',
    }
  }
  return {
    title: 'Departments',
    subtitle: 'Organizational units — expand a card to view all employees',
  }
}
