import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useHrms } from '../../hooks/useHrms'

export default function Attendance() {
  const { attendanceRecords, employees } = useHrms()
  const getEmployee = (id) => employees.find((e) => e.id === id)

  return (
    <Card title="Today's Attendance" subtitle="Live from session data (JSON seed)">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="pb-3 font-medium">Employee</th>
              <th className="pb-3 font-medium">Department</th>
              <th className="pb-3 font-medium">Check In</th>
              <th className="pb-3 font-medium">Check Out</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attendanceRecords.map((record) => {
              const emp = getEmployee(record.employeeId)
              return (
                <tr key={record.id}>
                  <td className="py-4 font-medium text-foreground">{emp?.name ?? record.employeeId}</td>
                  <td className="py-4">{emp?.department}</td>
                  <td className="py-4">{record.checkIn}</td>
                  <td className="py-4">{record.checkOut}</td>
                  <td className="py-4">
                    <Badge status={record.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
