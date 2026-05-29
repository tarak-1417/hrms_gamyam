import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import Card from '../../components/ui/Card'
import FilterBar, { FilterSelect } from '../../components/ui/FilterBar'
import EmployeeDetailModal from '../../components/hr/EmployeeDetailModal'
import { useHrms } from '../../hooks/useHrms'
import { normalizePayrollRecord } from '../../store/hrmsHelpers'
import { formatINR } from '../../utils/currency'

const NET_BANDS = [
  { value: 'all', label: 'All pay' },
  { value: 'under50', label: '< ₹50k' },
  { value: '50to70', label: '₹50–70k' },
  { value: 'above70', label: '> ₹70k' },
]

const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'on-leave', label: 'On leave' },
  { value: 'inactive', label: 'Inactive' },
]

function matchesNetBand(net, band) {
  if (band === 'all') return true
  if (band === 'under50') return net < 50000
  if (band === '50to70') return net >= 50000 && net <= 70000
  if (band === 'above70') return net > 70000
  return true
}

export default function Payroll() {
  const { payrollRecords, employees, getEmployeeDetails } = useHrms()
  const [detailId, setDetailId] = useState(null)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [netFilter, setNetFilter] = useState('all')

  const employeeDetails = detailId ? getEmployeeDetails(detailId) : null

  const payrollRows = useMemo(() => {
    return employees
      .map((emp) => {
        const row = normalizePayrollRecord(
          payrollRecords.find((p) => p.employeeId === emp.id) || getEmployeeDetails(emp.id)?.payroll,
          emp,
        )
        if (!row) return null
        return { emp, row }
      })
      .filter(Boolean)
  }, [employees, payrollRecords, getEmployeeDetails])

  const departmentOptions = useMemo(() => {
    const set = new Set(payrollRows.map(({ emp }) => emp.department))
    return ['all', ...Array.from(set).sort()]
  }, [payrollRows])

  const filteredRows = useMemo(() => {
    return payrollRows.filter(({ emp, row }) => {
      if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false
      if (statusFilter !== 'all' && emp.status !== statusFilter) return false
      if (!matchesNetBand(row.net, netFilter)) return false
      return true
    })
  }, [payrollRows, departmentFilter, statusFilter, netFilter])

  const departmentOptionsFormatted = departmentOptions.map((dept) => ({
    value: dept,
    label: dept === 'all' ? 'All depts' : dept,
    count:
      dept === 'all'
        ? payrollRows.length
        : payrollRows.filter(({ emp }) => emp.department === dept).length,
  }))

  const statusOptionsFormatted = EMPLOYEE_STATUS_OPTIONS.map((opt) => ({
    ...opt,
    count:
      opt.value === 'all'
        ? payrollRows.length
        : payrollRows.filter(({ emp }) => emp.status === opt.value).length,
  }))

  const netOptionsFormatted = NET_BANDS.map((opt) => ({
    ...opt,
    count:
      opt.value === 'all'
        ? payrollRows.length
        : payrollRows.filter(({ row }) => matchesNetBand(row.net, opt.value)).length,
  }))

  const hasFilters =
    departmentFilter !== 'all' || statusFilter !== 'all' || netFilter !== 'all'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Payroll</h1>
        <p className="page-subtitle">April 2026 salary breakup with earnings, deductions, and net pay</p>
      </div>

      <Card
        title="Payroll — April 2026"
        subtitle="Click View for the full salary breakup and employee profile"
        toolbar={
          <FilterBar
            showing={filteredRows.length}
            total={payrollRows.length}
            hasActiveFilters={hasFilters}
            onClear={() => {
              setDepartmentFilter('all')
              setStatusFilter('all')
              setNetFilter('all')
            }}
          >
            <FilterSelect
              label="Department"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={departmentOptionsFormatted}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptionsFormatted}
            />
            <FilterSelect
              label="Net pay"
              value={netFilter}
              onChange={setNetFilter}
              options={netOptionsFormatted}
            />
          </FilterBar>
        }
      >
        {filteredRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No payroll rows match your filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Annual CTC</th>
                  <th className="pb-3 font-medium">Gross</th>
                  <th className="pb-3 font-medium">Deductions</th>
                  <th className="pb-3 font-medium">Net Pay</th>
                  <th className="pb-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map(({ emp, row }) => (
                  <tr key={emp.id} className="hover:bg-surface/50">
                    <td className="py-4 font-medium text-foreground">{emp.name}</td>
                    <td className="py-4 text-muted">{emp.department}</td>
                    <td className="py-4 capitalize text-muted">{emp.status?.replace('-', ' ')}</td>
                    <td className="py-4">{formatINR(row.yearlyCtc)}</td>
                    <td className="py-4 text-primary">{formatINR(row.grossSalary)}</td>
                    <td className="py-4 text-red-600">{formatINR(row.deductions)}</td>
                    <td className="py-4 font-semibold">{formatINR(row.net)}</td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailId(emp.id)}
                        title="View employee"
                        className="inline-flex rounded-md p-2 text-primary transition-colors hover:bg-primary-light"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </button>
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
    </div>
  )
}
