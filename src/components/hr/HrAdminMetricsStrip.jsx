import { ClipboardList, UserPlus, Users, Wallet } from 'lucide-react'
import KpiCard from './KpiCard'

export default function HrAdminMetricsStrip({
  headcount,
  pendingApprovals,
  newHires,
  monthlyPayrollLabel,
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Headcount"
        value={headcount}
        sub="Active employees"
        icon={Users}
        to="/admin/employees"
      />
      <KpiCard
        label="Pending approvals"
        value={pendingApprovals}
        sub="Leave & reimbursements"
        icon={ClipboardList}
        to="/admin/leave"
      />
      <KpiCard
        label="New hires"
        value={newHires}
        sub="Joined recently"
        icon={UserPlus}
        to="/admin/employees"
      />
      <KpiCard
        label="Monthly payroll"
        value={monthlyPayrollLabel}
        sub="Estimated net total"
        icon={Wallet}
        to="/admin/payroll"
      />
    </div>
  )
}
