import { Building2, Users, DollarSign, Activity } from 'lucide-react'
import analytics from '../../data/analytics.json'
import KpiCard from '../../components/hr/KpiCard'
import ChartCard from '../../components/charts/ChartCard'
import PlatformGrowthChart from '../../components/charts/PlatformGrowthChart'
import ActivityFeed from '../../components/hr/ActivityFeed'

const kpi = analytics.superAdminKpis

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="mt-1 text-muted">Global system monitoring & analytics</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Building2} label="Companies" value={kpi.totalCompanies} />
        <KpiCard icon={Users} label="Active users" value={kpi.activeUsers} />
        <KpiCard icon={DollarSign} label="MRR" value={`$${kpi.monthlyRevenue}M`} />
        <KpiCard icon={Activity} label="Uptime" value={`${kpi.systemUptime}%`} trend={{ positive: true, text: 'Last 30 days' }} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Platform growth" subtitle="Companies & users" className="lg:col-span-2">
          <PlatformGrowthChart />
        </ChartCard>
        <ActivityFeed />
      </div>
    </div>
  )
}
