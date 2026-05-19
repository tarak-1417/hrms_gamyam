import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import FilterBar, { FilterSelect } from '../../components/ui/FilterBar'
import EmployeeDetailModal from '../../components/hr/EmployeeDetailModal'
import { useHrms } from '../../hooks/useHrms'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'on-leave', label: 'On leave' },
]

export default function HrAttendance() {
  const { attendanceRecords, employees, getEmployeeDetails } = useHrms()
  const [detailId, setDetailId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const employeeDetails = detailId ? getEmployeeDetails(detailId) : null

  const getEmployee = (id) => employees.find((e) => e.id === id)

  const departmentOptions = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [employees])

  const rows = useMemo(() => {
    return attendanceRecords
      .map((record) => ({
        record,
        emp: getEmployee(record.employeeId),
      }))
      .filter(({ record, emp }) => {
        if (statusFilter !== 'all' && record.status !== statusFilter) return false
        if (departmentFilter !== 'all' && emp?.department !== departmentFilter) return false
        return true
      })
  }, [attendanceRecords, employees, statusFilter, departmentFilter])

  const statusCounts = useMemo(() => {
    const counts = { all: attendanceRecords.length, present: 0, late: 0, 'on-leave': 0 }
    attendanceRecords.forEach((r) => {
      if (counts[r.status] != null) counts[r.status] += 1
    })
    return counts
  }, [attendanceRecords])

  const statusOptionsWithCounts = STATUS_OPTIONS.map((opt) => ({
    ...opt,
    count: statusCounts[opt.value],
  }))

  const departmentOptionsFormatted = departmentOptions.map((dept) => ({
    value: dept,
    label: dept === 'all' ? 'All depts' : dept,
    count:
      dept === 'all'
        ? attendanceRecords.length
        : attendanceRecords.filter((r) => getEmployee(r.employeeId)?.department === dept).length,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Monitoring</h1>
        <p className="mt-1 text-muted">Click an employee for payroll, leave, and daily summaries</p>
      </div>

      <Card
        title="Today's attendance"
        subtitle="Filter by status or department"
        toolbar={
          <FilterBar
            showing={rows.length}
            total={attendanceRecords.length}
            hasActiveFilters={statusFilter !== 'all' || departmentFilter !== 'all'}
            onClear={() => {
              setStatusFilter('all')
              setDepartmentFilter('all')
            }}
          >
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptionsWithCounts}
            />
            <FilterSelect
              label="Department"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={departmentOptionsFormatted}
            />
          </FilterBar>
        }
      >
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No attendance records match your filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Check In</th>
                  <th className="pb-3 font-medium">Check Out</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ record, emp }) => (
                  <tr key={record.id} className="hover:bg-surface/50">
                    <td className="py-4 font-medium text-foreground">{emp?.name ?? record.employeeId}</td>
                    <td className="py-4">{emp?.department}</td>
                    <td className="py-4">{record.checkIn}</td>
                    <td className="py-4">{record.checkOut}</td>
                    <td className="py-4">
                      <Badge status={record.status} />
                    </td>
                    <td className="py-4">
                      <button
                        type="button"
                        onClick={() => setDetailId(record.employeeId)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
                      >
                        <Eye className="h-4 w-4" />
                        Details
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
