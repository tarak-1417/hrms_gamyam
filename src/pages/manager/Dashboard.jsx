import { Users, ClipboardList, Briefcase, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import KpiCard from '../../components/hr/KpiCard'
import ActivityFeed from '../../components/hr/ActivityFeed'
import ChartCard from '../../components/charts/ChartCard'
import DepartmentChart from '../../components/charts/DepartmentChart'
import LeaveDistributionChart from '../../components/charts/LeaveDistributionChart'
import PayrollTrendChart from '../../components/charts/PayrollTrendChart'
import HiringPipelineChart from '../../components/charts/HiringPipelineChart'

export default function ManagerDashboard() {
  const { user } = useAuth()
  const { managerKpis, showToast } = useHrms()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white sm:h-16 sm:w-16 sm:text-2xl">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
              Hi, <span className="text-primary">{firstName}</span>
            </h1>
            <p className="mt-1 text-muted">Here&apos;s your team overview</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => showToast('Quick action saved')}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard icon={Users} label="Team size" value={managerKpis.teamSize} sub="Engineering" to="/manager/team" />
        <KpiCard icon={ClipboardList} label="Pending approvals" value={managerKpis.pendingApprovals} to="/manager/leave" />
        <KpiCard icon={Briefcase} label="Open positions" value={managerKpis.openPositions} to="/manager/reports" />
      </div>

      <ChartCard title="Leave distribution">
        <LeaveDistributionChart />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Department headcount" className="lg:col-span-2">
          <DepartmentChart />
        </ChartCard>
        <ActivityFeed />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Payroll trend">
          <PayrollTrendChart />
        </ChartCard>
        <ChartCard title="Hiring pipeline">
          <HiringPipelineChart />
        </ChartCard>
      </div>
    </div>
  )
}
