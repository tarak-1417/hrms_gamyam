import { Users, UserCheck, CalendarOff, UserPlus } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useHrms } from '../../hooks/useHrms'

export default function AdminDashboard() {
  const { adminStats, leaveRequests, employees } = useHrms()
  const pending = leaveRequests.filter((l) => l.status === 'pending')

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Employees" value={adminStats.totalEmployees} change="+5 this month" />
        <StatCard icon={UserCheck} label="Present Today" value={adminStats.presentToday} change="94% attendance" />
        <StatCard icon={CalendarOff} label="On Leave" value={adminStats.onLeave} changeType="negative" change="4 employees" />
        <StatCard icon={UserPlus} label="Pending Leaves" value={adminStats.pendingLeaves} change="Needs review" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Pending Leave Requests" subtitle="Requires your approval">
          {pending.length === 0 ? (
            <p className="text-sm text-muted">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {pending.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">{leave.employeeName}</p>
                    <p className="text-sm text-muted">
                      {leave.type} · {leave.from} to {leave.to}
                    </p>
                  </div>
                  <Badge status="pending" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent Employees" subtitle="Latest team members">
          <div className="space-y-3">
            {employees.slice(0, 5).map((emp) => (
              <div key={emp.id} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary-dark">
                  {emp.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{emp.name}</p>
                  <p className="text-sm text-muted">{emp.role} · {emp.department}</p>
                </div>
                <Badge status={emp.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
