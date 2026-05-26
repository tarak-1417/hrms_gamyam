import { Link } from 'react-router-dom'
import { Users, ClipboardList, Briefcase, User, FileText, FolderOpen, CalendarOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import KpiCard from '../../components/hr/KpiCard'
import ActivityFeed from '../../components/hr/ActivityFeed'
import ChartCard from '../../components/charts/ChartCard'
import DepartmentChart from '../../components/charts/DepartmentChart'
import LeaveDistributionChart from '../../components/charts/LeaveDistributionChart'
import HiringPipelineChart from '../../components/charts/HiringPipelineChart'

export default function ManagerDashboard() {
  const { user } = useAuth()
  const { managerKpis } = useHrms()
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const personalActions = [
    { to: '/manager/profile', icon: User, label: 'My profile', desc: 'Personal details' },
    { to: '/manager/my-leave', icon: CalendarOff, label: 'Apply leave', desc: 'Request time off' },
    { to: '/manager/payslips', icon: FileText, label: 'Payslips', desc: 'Salary details' },
    { to: '/manager/documents', icon: FolderOpen, label: 'My documents', desc: 'Personal files' },
  ]

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
        <Link
          to="/manager/profile"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
        >
          <User className="h-4 w-4" />
          My profile
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard icon={Users} label="Team size" value={managerKpis.teamSize} sub="Engineering" to="/manager/team" />
        <KpiCard icon={ClipboardList} label="Pending approvals" value={managerKpis.pendingApprovals} to="/manager/leave" />
        <KpiCard icon={Briefcase} label="Open positions" value={managerKpis.openPositions} to="/manager/reports" />
      </div>

      <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground">My workspace</h2>
          <p className="text-xs text-muted">Personal tools for your own account</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {personalActions.map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl border border-border bg-surface/40 p-4 transition hover:border-primary/20 hover:bg-primary-light/20"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
              <p className="mt-1 text-xs text-muted">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <ChartCard title="Leave distribution">
        <LeaveDistributionChart />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Department headcount" className="lg:col-span-2">
          <DepartmentChart />
        </ChartCard>
        <ActivityFeed />
      </div>

      <div className="grid gap-6">
        {/* <ChartCard title="Hiring pipeline">
          <HiringPipelineChart />
        </ChartCard> */}
      </div>
    </div>
  )
}
