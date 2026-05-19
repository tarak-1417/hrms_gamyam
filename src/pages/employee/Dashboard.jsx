import { CalendarCheck, CalendarOff, Wallet } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import TodayAttendanceCard from '../../components/employee/TodayAttendanceCard'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { getTimeGreeting } from '../../utils/timeUtils'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const { leaveRequests, employeeStats } = useHrms()
  const myLeaves = leaveRequests.filter((l) => l.employeeId === user?.employeeId)
  const stats = employeeStats

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary-dark p-5 text-white shadow-md">
        <h3 className="text-sm font-medium text-white/80">{getTimeGreeting()},</h3>
        <p className="text-xl font-bold">{user?.name}</p>
        <p className="mt-1 text-white/80">Have a productive day!</p>
      </div>

      <TodayAttendanceCard showTitle />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          label="Attendance This Month"
          value={`${stats.attendanceThisMonth}/${stats.workingDays}`}
          change="82% present"
        />
        <StatCard
          icon={CalendarOff}
          label="Leave Balance"
          value={stats.leaveBalance.casual + stats.leaveBalance.sick + stats.leaveBalance.earned}
          change="CL + SL + EL combined"
        />
        <StatCard
          icon={Wallet}
          label="Last Payslip"
          value={stats.lastPayslip}
          change="View in Payslips"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Leave Balance">
          <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3 sm:gap-4">
            <div className="rounded-lg bg-surface p-4">
              <p className="text-xl font-bold text-primary">{stats.leaveBalance.casual}</p>
              <p className="text-sm text-muted">Casual</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-xl font-bold text-primary">{stats.leaveBalance.sick}</p>
              <p className="text-sm text-muted">Sick</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-xl font-bold text-primary">{stats.leaveBalance.earned}</p>
              <p className="text-sm text-muted">Earned</p>
            </div>
          </div>
        </Card>

        <Card title="My Leave Requests">
          {myLeaves.length === 0 ? (
            <p className="text-sm text-muted">No leave requests yet.</p>
          ) : (
            <div className="space-y-3">
              {myLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{leave.type}</p>
                    <p className="text-sm text-muted">
                      {leave.from} – {leave.to}
                    </p>
                  </div>
                  <Badge status={leave.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
