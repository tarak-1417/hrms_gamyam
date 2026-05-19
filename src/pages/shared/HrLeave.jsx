import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useHrms } from '../../hooks/useHrms'
import { useAuth } from '../../hooks/useAuth'

export default function HrLeave() {
  const { leaveRequests, updateLeaveStatus } = useHrms()
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Leave Approval</h1>
        <p className="mt-1 text-muted">Review and approve team leave requests</p>
      </div>
      <Card>
        <div className="space-y-4">
          {leaveRequests.length === 0 ? (
            <p className="text-sm text-muted">No leave requests</p>
          ) : (
            leaveRequests.map((leave) => (
              <div
                key={leave.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">{leave.employeeName}</p>
                  <p className="text-sm text-muted">
                    {leave.type} · {leave.from} to {leave.to} · {leave.days} days
                  </p>
                  <p className="mt-1 text-sm text-muted">{leave.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={leave.status} />
                  {leave.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateLeaveStatus(leave.id, 'approved', user?.name)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLeaveStatus(leave.id, 'rejected', user?.name)}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
