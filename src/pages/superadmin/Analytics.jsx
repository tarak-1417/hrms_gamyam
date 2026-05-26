import ChartCard from '../../components/charts/ChartCard'
import PlatformGrowthChart from '../../components/charts/PlatformGrowthChart'

export default function SuperAdminAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
      <div className="grid gap-6">
        <ChartCard title="Growth across tenants">
          <PlatformGrowthChart />
        </ChartCard>
      </div>
    </div>
  )
}
