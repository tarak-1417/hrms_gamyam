import ChartCard from '../../components/charts/ChartCard'
import PlatformGrowthChart from '../../components/charts/PlatformGrowthChart'
import PayrollTrendChart from '../../components/charts/PayrollTrendChart'

export default function SuperAdminAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Growth across tenants">
          <PlatformGrowthChart />
        </ChartCard>
        <ChartCard title="Aggregate payroll volume">
          <PayrollTrendChart />
        </ChartCard>
      </div>
    </div>
  )
}
