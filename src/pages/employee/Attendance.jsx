import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import TodayAttendanceCard from '../../components/employee/TodayAttendanceCard'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { formatDisplayDate } from '../../utils/timeUtils'

export default function EmployeeAttendance() {
  const { user } = useAuth()
  const { getTimeLogsForEmployee } = useHrms()
  const history = getTimeLogsForEmployee(user?.employeeId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">
          Check in with GPS when you are at the office, then check out with your daily summary
        </p>
      </div>

      <TodayAttendanceCard showTitle />

      <Card title="Daily history" subtitle="Portal session, work times, and summaries">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Check in</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Check out</th>
                <th className="pb-3 font-medium">Hours</th>
                <th className="pb-3 font-medium">Summary</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No records yet. Sign in to the portal to start tracking.
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 font-medium">{formatDisplayDate(row.date)}</td>
                    <td className="py-3">{row.checkIn || '—'}</td>
                    <td className="py-3 text-xs text-muted">
                      {row.checkInOfficeName ? (
                        <span title={`${row.checkInLatitude}, ${row.checkInLongitude}`}>
                          {row.checkInOfficeName}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3">{row.checkOut || '—'}</td>
                    <td className="py-3">{row.workHours || '—'}</td>
                    <td className="max-w-xs py-3 text-muted">
                      {row.daySummary ? (
                        <span className="line-clamp-2">{row.daySummary}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3">
                      <Badge status={row.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
