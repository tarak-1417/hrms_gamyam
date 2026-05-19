import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useHrms } from '../../hooks/useHrms'
import { useAuth } from '../../hooks/useAuth'

export default function Leave() {
  const { leaveRequests, updateLeaveStatus } = useHrms()
  const { user } = useAuth()

  return (
    <Card title="All Leave Requests">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="pb-3 font-medium">Employee</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Duration</th>
              <th className="pb-3 font-medium">Days</th>
              <th className="pb-3 font-medium">Reason</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leaveRequests.map((leave) => (
              <tr key={leave.id}>
                <td className="py-4 font-medium text-foreground">{leave.employeeName}</td>
                <td className="py-4">{leave.type}</td>
                <td className="py-4">
                  {leave.from} – {leave.to}
                </td>
                <td className="py-4">{leave.days}</td>
                <td className="py-4 text-muted">{leave.reason}</td>
                <td className="py-4">
                  <Badge status={leave.status} />
                </td>
                <td className="py-4">
                  {leave.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateLeaveStatus(leave.id, 'approved', user?.name)}
                        className="rounded bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary-dark"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLeaveStatus(leave.id, 'rejected', user?.name)}
                        className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
