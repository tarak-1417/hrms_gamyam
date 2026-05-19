import { useMemo, useState } from 'react'
import { Plus, Search, Eye, Pencil, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Card from '../../components/ui/Card'
import FilterBar, { FilterSelect } from '../../components/ui/FilterBar'
import Badge from '../../components/ui/Badge'
import EmployeeDetailModal from '../../components/hr/EmployeeDetailModal'
import EmployeeFormModal from '../../components/hr/EmployeeFormModal'
import BulkImportEmployeesModal from '../../components/hr/BulkImportEmployeesModal'
import { useHrms } from '../../hooks/useHrms'
import { estimatePayrollByProfile } from '../../store/hrmsHelpers'
import { getDepartmentNames, getDesignationTitles } from '../../utils/organizationHelpers'

const emptyForm = {
  name: '',
  email: '',
  department: 'Engineering',
  role: '',
  phone: '',
  address: '',
  joinDate: '',
  status: 'active',
  branchId: '',
  managerId: '',
  basic: '',
  allowances: '',
  deductions: '',
  net: '',
}

function buildEmployeePayload(form) {
  return {
    name: form.name,
    email: form.email,
    department: form.department,
    role: form.role,
    phone: form.phone,
    address: form.address,
    joinDate: form.joinDate || undefined,
    status: form.status,
    branchId: form.branchId || null,
    managerId: form.managerId || null,
    payrollInput: {
      basic: form.basic,
      allowances: form.allowances,
      deductions: form.deductions,
      net: form.net,
    },
  }
}


export default function Employees() {
  const {
    searchQuery,
    setSearchQuery,
    filterEmployees,
    employees: allEmployees,
    payrollRecords,
    departments: deptRecords,
    designations,
    branches,
    addEmployee,
    bulkImportEmployees,
    updateEmployee,
    getEmployeeDetails,
    softDeleteEmployee,
  } = useHrms()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'

  const departmentNames = useMemo(() => {
    const fromOrg = getDepartmentNames(deptRecords)
    if (fromOrg.length) return fromOrg
    return ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance']
  }, [deptRecords])

  const designationTitles = useMemo(() => getDesignationTitles(designations), [designations])
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const employeeDetails = detailId ? getEmployeeDetails(detailId) : null
  const [form, setForm] = useState(emptyForm)

  const departmentOptions = useMemo(() => {
    const set = new Set(allEmployees.map((e) => e.department))
    departmentNames.forEach((d) => set.add(d))
    return ['all', ...Array.from(set).sort()]
  }, [allEmployees, departmentNames])

  const roleOptions = useMemo(() => {
    const set = new Set(allEmployees.map((e) => e.role).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [allEmployees])

  const employees = useMemo(() => {
    let list = filterEmployees(
      searchQuery,
      departmentFilter === 'all' ? undefined : departmentFilter,
      roleFilter === 'all' ? undefined : roleFilter,
    )
    if (statusFilter !== 'all') {
      list = list.filter((e) => e.status === statusFilter)
    }
    return list
  }, [filterEmployees, searchQuery, departmentFilter, roleFilter, statusFilter])

  const hasFilters =
    departmentFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all'

  const departmentOptionsFormatted = useMemo(
    () =>
      departmentOptions.map((dept) => ({
        value: dept,
        label: dept === 'all' ? 'All depts' : dept,
        count:
          dept === 'all'
            ? allEmployees.length
            : allEmployees.filter((e) => e.department === dept).length,
      })),
    [departmentOptions, allEmployees],
  )

  const roleOptionsFormatted = useMemo(
    () =>
      roleOptions.map((role) => ({
        value: role,
        label: role === 'all' ? 'All roles' : role,
        count:
          role === 'all'
            ? allEmployees.length
            : allEmployees.filter((e) => e.role === role).length,
      })),
    [roleOptions, allEmployees],
  )

  const statusOptionsFormatted = useMemo(
    () => [
      { value: 'all', label: 'All status', count: allEmployees.length },
      { value: 'active', label: 'Active', count: allEmployees.filter((e) => e.status === 'active').length },
      { value: 'on-leave', label: 'On leave', count: allEmployees.filter((e) => e.status === 'on-leave').length },
      { value: 'inactive', label: 'Inactive', count: allEmployees.filter((e) => e.status === 'inactive').length },
    ],
    [allEmployees],
  )

  const isEditing = Boolean(editingId)

  const autoPayrollPreview = useMemo(() => {
    if (!form.department || !form.role) return null
    const hasManual = form.basic || form.allowances || form.deductions || form.net
    if (hasManual) return null
    return estimatePayrollByProfile({
      department: form.department,
      role: form.role,
      id: editingId || undefined,
    })
  }, [form.department, form.role, form.basic, form.allowances, form.deductions, form.net, editingId])

  const openAddModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEditModal = (emp) => {
    const pay = payrollRecords.find((p) => p.employeeId === emp.id)
    setEditingId(emp.id)
    setForm({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      phone: emp.phone === '—' ? '' : emp.phone ?? '',
      address: emp.address || '',
      joinDate: emp.joinDate || '',
      status: emp.status,
      branchId: emp.branchId || '',
      managerId: emp.managerId || '',
      basic: pay?.basic != null ? String(pay.basic) : '',
      allowances: pay?.allowances != null ? String(pay.allowances) : '',
      deductions: pay?.deductions != null ? String(pay.deductions) : '',
      net: pay?.net != null ? String(pay.net) : '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = buildEmployeePayload(form)
    if (isEditing) {
      updateEmployee(editingId, payload)
    } else {
      addEmployee(payload)
    }
    closeModal()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees..."
            className="w-full rounded-lg border border-border py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light"
          >
            <Upload className="h-4 w-4" />
            Bulk import
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-primary/25 bg-primary-light/20 px-4 py-3 text-sm text-muted">
        <span className="font-medium text-foreground">Onboarding a full company?</span>{' '}
        Use <strong className="text-primary">Bulk import</strong> with an Excel sheet — same columns
        as demo employees (name, email, department, role, pay, join date). Rows are added in your
        sheet order.
      </div>

      <Card
        title="All employees"
        subtitle="Search above, then filter by department, role, or status"
        toolbar={
          <FilterBar
            showing={employees.length}
            total={allEmployees.length}
            hasActiveFilters={hasFilters}
            onClear={() => {
              setDepartmentFilter('all')
              setRoleFilter('all')
              setStatusFilter('all')
            }}
          >
            <FilterSelect
              label="Department"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={departmentOptionsFormatted}
            />
            <FilterSelect
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptionsFormatted}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptionsFormatted}
            />
          </FilterBar>
        }
      >
        {employees.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No employees match your filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Join Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp) => (
                  <tr key={emp.id} className="text-foreground hover:bg-surface/80">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary-dark">
                          {emp.avatar}
                        </div>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{emp.id}</td>
                    <td className="py-4">{emp.department}</td>
                    <td className="py-4">{emp.role}</td>
                    <td className="py-4">{emp.joinDate}</td>
                    <td className="py-4">
                      <Badge status={emp.status} />
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end">
                        <div
                          className="inline-flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 shadow-sm"
                          role="group"
                          aria-label={`Actions for ${emp.name}`}
                        >
                          <button
                            type="button"
                            onClick={() => setDetailId(emp.id)}
                            title="View profile"
                            className="rounded-md p-2 text-primary transition-colors hover:bg-primary-light"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            title="Edit employee"
                            className="rounded-md p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                          {isSuperAdmin && (
                            <>
                              <span className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden />
                              <button
                                type="button"
                                title="Move to recycle bin"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Move ${emp.name} to the recycle bin? Restore from Super Admin → Recycle bin.`,
                                    )
                                  ) {
                                    softDeleteEmployee(emp.id)
                                  }
                                }}
                                className="rounded-md p-2 text-red-600 transition-colors hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <EmployeeDetailModal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        details={employeeDetails}
      />

      <BulkImportEmployeesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={bulkImportEmployees}
        existingEmails={allEmployees.map((e) => e.email)}
      />

      <EmployeeFormModal
        open={modalOpen}
        onClose={closeModal}
        isEditing={isEditing}
        editingId={editingId}
        form={form}
        setForm={setForm}
        departments={departmentNames}
        designations={designationTitles}
        branches={branches || []}
        managers={allEmployees.filter((e) => e.status === 'active')}
        onSubmit={handleSubmit}
        autoPayrollPreview={autoPayrollPreview}
      />
    </div>
  )
}
