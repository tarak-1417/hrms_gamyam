import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Upload,
  Users,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import FilterBar, { FilterSelect } from '../../components/ui/FilterBar'
import EmployeeAvatar from '../../components/employee/EmployeeAvatar'
import EmployeeDetailModal from '../../components/hr/EmployeeDetailModal'
import EmployeeFormModal from '../../components/hr/EmployeeFormModal'
import BulkImportEmployeesModal from '../../components/hr/BulkImportEmployeesModal'
import { useHrms } from '../../hooks/useHrms'
import {
  calculatePayrollBreakdown,
  estimatePayrollByProfile,
  normalizePayrollRecord,
} from '../../store/hrmsHelpers'
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
  payrollMonth: '',
  annualCtc: '',
  basic: '',
  hra: '',
  lta: '',
  bonus: '',
  specialAllowance: '',
  professionalTax: '',
  healthInsurance: '',
  tds: '',
  otherDeductions: '',
}

const PAYROLL_INPUT_KEYS = [
  'annualCtc',
  'basic',
  'hra',
  'lta',
  'bonus',
  'specialAllowance',
  'professionalTax',
  'healthInsurance',
  'tds',
  'otherDeductions',
]

function buildEmployeePayload(form, payrollPreview) {
  const hasPayrollInput =
    form.payrollMonth || PAYROLL_INPUT_KEYS.some((key) => form[key] !== '' && form[key] != null)
  const payrollInput = hasPayrollInput
    ? {
        month: payrollPreview?.month || form.payrollMonth,
        annualCtc: payrollPreview?.yearlyCtc ?? form.annualCtc,
        monthlyCtc: payrollPreview?.monthlyCtc,
        basic: payrollPreview?.basic ?? form.basic,
        hra: payrollPreview?.hra ?? form.hra,
        lta: payrollPreview?.lta ?? form.lta,
        bonus: payrollPreview?.bonus ?? form.bonus,
        specialAllowance: payrollPreview?.specialAllowance ?? form.specialAllowance,
        professionalTax: payrollPreview?.professionalTax ?? form.professionalTax,
        healthInsurance: payrollPreview?.healthInsurance ?? form.healthInsurance,
        tds: payrollPreview?.tds ?? form.tds,
        otherDeductions: payrollPreview?.otherDeductions ?? form.otherDeductions,
      }
    : undefined

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
    payrollInput,
  }
}

function SummaryCard({ icon: Icon, label, value, note, tone = 'default' }) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary/15 bg-primary-light/40'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50/80'
        : tone === 'warning'
          ? 'border-amber-200 bg-amber-50/80'
          : 'border-border bg-white'

  const iconClass =
    tone === 'primary'
      ? 'bg-primary !text-white'
      : tone === 'success'
        ? 'bg-emerald-500 !text-white'
        : tone === 'warning'
          ? 'bg-amber-500 !text-white'
          : 'bg-neutral-900 !text-white'

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
          <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-sm text-muted">{note}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

const STATUS_TONES = {
  active: { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'border-emerald-400/25 bg-emerald-500/12', accent: 'from-emerald-400/60' },
  present: { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'border-emerald-400/25 bg-emerald-500/12', accent: 'from-emerald-400/60' },
  'on-leave': { dot: 'bg-amber-400', text: 'text-amber-300', ring: 'border-amber-400/25 bg-amber-500/12', accent: 'from-amber-400/60' },
  probation: { dot: 'bg-amber-400', text: 'text-amber-300', ring: 'border-amber-400/25 bg-amber-500/12', accent: 'from-amber-400/60' },
  remote: { dot: 'bg-violet-400', text: 'text-violet-300', ring: 'border-violet-400/25 bg-violet-500/12', accent: 'from-violet-400/60' },
  inactive: { dot: 'bg-slate-400', text: 'text-slate-300', ring: 'border-slate-400/25 bg-slate-500/12', accent: 'from-slate-400/50' },
  resigned: { dot: 'bg-rose-400', text: 'text-rose-300', ring: 'border-rose-400/25 bg-rose-500/12', accent: 'from-rose-400/60' },
  rejected: { dot: 'bg-rose-400', text: 'text-rose-300', ring: 'border-rose-400/25 bg-rose-500/12', accent: 'from-rose-400/60' },
}

function statusTone(status) {
  return STATUS_TONES[status] || STATUS_TONES.inactive
}

function formatHiredDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function EmployeeCard({ employee, onView, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const tone = statusTone(employee.status)
  const label = (employee.status || 'active').replace('-', ' ')

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  return (
    <div className="hrx-card hrx-card-hover relative flex flex-col overflow-hidden p-5">
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tone.accent} via-transparent to-transparent`}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${tone.ring} ${tone.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          {label}
        </span>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label={`Actions for ${employee.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="hrx-pop absolute right-0 top-[calc(100%+0.4rem)] z-20 w-36 overflow-hidden rounded-xl py-1"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onView(employee.id)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
              >
                <Eye className="h-4 w-4 text-white/45" />
                View
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onEdit(employee)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
              >
                <Pencil className="h-4 w-4 text-white/45" />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center text-center">
        <EmployeeAvatar employee={employee} size="lg" className="!ring-white/10" />
        <h3 className="mt-3 text-lg font-bold tracking-tight text-white">{employee.name}</h3>
        <p className="mt-0.5 text-sm font-semibold text-indigo-300">{employee.role}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-white/8 bg-white/5 p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">Department</p>
          <p className="mt-1 text-sm font-semibold text-white">{employee.department}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">Hired date</p>
          <p className="mt-1 text-sm font-semibold text-white">{formatHiredDate(employee.joinDate)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-white/8 pt-4">
        <a
          href={`mailto:${employee.email}`}
          className="flex items-center gap-2.5 text-sm text-white/70 transition hover:text-white"
        >
          <Mail className="h-4 w-4 shrink-0 text-indigo-300" strokeWidth={2} />
          <span className="truncate">{employee.email}</span>
        </a>
        {employee.phone && employee.phone !== '—' ? (
          <a
            href={`tel:${employee.phone}`}
            className="flex items-center gap-2.5 text-sm text-white/70 transition hover:text-white"
          >
            <Phone className="h-4 w-4 shrink-0 text-indigo-300" strokeWidth={2} />
            <span className="truncate">{employee.phone}</span>
          </a>
        ) : (
          <p className="flex items-center gap-2.5 text-sm text-white/35">
            <Phone className="h-4 w-4 shrink-0" strokeWidth={2} />
            No phone on file
          </p>
        )}
      </div>
    </div>
  )
}

function EmployeesGrid({ employees, onView, onEdit }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} onView={onView} onEdit={onEdit} />
      ))}
    </div>
  )
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
  } = useHrms()

  const PAGE_SIZE = 6

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
  const [page, setPage] = useState(1)
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

  useEffect(() => {
    setPage(1)
  }, [searchQuery, departmentFilter, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageEmployees = useMemo(
    () => employees.slice(pageStart, pageStart + PAGE_SIZE),
    [employees, pageStart],
  )

  const hasFilters =
    departmentFilter !== 'all' ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    Boolean(searchQuery?.trim())

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

  const summaryCards = useMemo(() => {
    const activeCount = allEmployees.filter((employee) => employee.status === 'active').length
    const onLeaveCount = allEmployees.filter((employee) => employee.status === 'on-leave').length
    const recentJoiners = allEmployees.filter((employee) => {
      if (!employee.joinDate) return false
      const joinDate = new Date(employee.joinDate)
      if (Number.isNaN(joinDate.getTime())) return false
      const diffDays = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 90
    }).length

    return [
      {
        icon: Users,
        label: 'Team size',
        value: allEmployees.length,
        note: 'All employees across the organization',
        tone: 'primary',
      },
      {
        icon: UserCheck,
        label: 'Active employees',
        value: activeCount,
        note: `${onLeaveCount} currently marked on leave`,
        tone: 'success',
      },
      {
        icon: UserPlus,
        label: 'Joined recently',
        value: recentJoiners,
        note: 'New hires added in the last 90 days',
        tone: 'warning',
      },
    ]
  }, [allEmployees])

  const autoPayrollPreview = useMemo(() => {
    if (!form.department || !form.role) return null
    const hasManual = PAYROLL_INPUT_KEYS.some((key) => form[key])
    if (!hasManual) {
    return estimatePayrollByProfile({
      department: form.department,
      role: form.role,
      id: editingId || undefined,
    })
    }
    return calculatePayrollBreakdown({
      month: form.payrollMonth,
      annualCtc: form.annualCtc,
      basic: form.basic,
      hra: form.hra,
      lta: form.lta,
      bonus: form.bonus,
      specialAllowance: form.specialAllowance,
      professionalTax: form.professionalTax,
      healthInsurance: form.healthInsurance,
      tds: form.tds,
      otherDeductions: form.otherDeductions,
    })
  }, [
    form.department,
    form.role,
    form.payrollMonth,
    form.annualCtc,
    form.basic,
    form.hra,
    form.lta,
    form.bonus,
    form.specialAllowance,
    form.professionalTax,
    form.healthInsurance,
    form.tds,
    form.otherDeductions,
    editingId,
  ])

  const openAddModal = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEditModal = (emp) => {
    const pay = normalizePayrollRecord(
      payrollRecords.find((p) => p.employeeId === emp.id),
      emp,
    )
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
      payrollMonth: pay?.month || '',
      annualCtc: pay?.yearlyCtc != null ? String(pay.yearlyCtc) : '',
      basic: pay?.basic != null ? String(pay.basic) : '',
      hra: pay?.hra != null ? String(pay.hra) : '',
      lta: pay?.lta != null ? String(pay.lta) : '',
      bonus: pay?.bonus != null ? String(pay.bonus) : '',
      specialAllowance: pay?.specialAllowance != null ? String(pay.specialAllowance) : '',
      professionalTax: pay?.professionalTax != null ? String(pay.professionalTax) : '',
      healthInsurance: pay?.healthInsurance != null ? String(pay.healthInsurance) : '',
      tds: pay?.tds != null ? String(pay.tds) : '',
      otherDeductions: pay?.otherDeductions != null ? String(pay.otherDeductions) : '',
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
    const payload = buildEmployeePayload(form, autoPayrollPreview)
    if (isEditing) {
      updateEmployee(editingId, payload)
    } else {
      addEmployee(payload)
    }
    closeModal()
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-gradient-to-br from-primary-light/55 via-white to-sky-50 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">People hub</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Employee directory</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Manage headcount, open complete employee profiles, and review salary details from one
              cleaner workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary-light"
            >
              <Upload className="h-4 w-4" />
              Bulk import
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold !text-white shadow-sm hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" />
              Add employee
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            note={card.note}
            tone={card.tone}
          />
        ))}
      </section>

      <Card
        title="All employees"
        subtitle="Search and filter by department, role, or status."
        toolbar={
          <div className="flex w-full flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
            <div className="relative min-w-[11rem] flex-1 sm:max-w-[15rem] lg:flex-none">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees…"
                className={`h-9 w-full rounded-lg border bg-white py-0 pl-9 pr-3 text-xs font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  searchQuery.trim()
                    ? 'border-primary/50 text-foreground'
                    : 'border-border text-foreground hover:border-primary/30'
                }`}
                aria-label="Search employees"
              />
            </div>
            <FilterBar
              className="w-full sm:w-auto lg:min-w-0"
              showing={employees.length}
              total={allEmployees.length}
              hasActiveFilters={hasFilters}
              onClear={() => {
                setDepartmentFilter('all')
                setRoleFilter('all')
                setStatusFilter('all')
                setSearchQuery('')
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
          </div>
        }
      >
        {employees.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
            <p className="text-base font-semibold text-foreground">No employees match your filters</p>
            <p className="mt-2 text-sm text-muted">
              Try clearing filters or search terms to bring more people back into the view.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <EmployeesGrid employees={pageEmployees} onView={setDetailId} onEdit={openEditModal} />

            {totalPages > 1 ? (
              <div className="hrx-ui flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/50">
                  Showing <span className="font-semibold text-white">{pageStart + 1}</span>–
                  <span className="font-semibold text-white">
                    {Math.min(pageStart + PAGE_SIZE, employees.length)}
                  </span>{' '}
                  of <span className="font-semibold text-white">{employees.length}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      aria-current={n === currentPage ? 'page' : undefined}
                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                        n === currentPage
                          ? 'border border-indigo-400/50 bg-gradient-to-br from-indigo-500 to-violet-500 !text-white shadow-lg shadow-indigo-500/30'
                          : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/5"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
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
