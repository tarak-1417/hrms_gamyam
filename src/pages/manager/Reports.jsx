import ChartCard from '../../components/charts/ChartCard'
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart'
import DepartmentChart from '../../components/charts/DepartmentChart'
import LeaveDistributionChart from '../../components/charts/LeaveDistributionChart'
import HiringPipelineChart from '../../components/charts/HiringPipelineChart'

export default function ManagerReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="mt-1 text-muted">Interactive charts powered by organization data</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Attendance trend">
          <AttendanceTrendChart />
        </ChartCard>
        <ChartCard title="Leave distribution">
          <LeaveDistributionChart />
        </ChartCard>
        <ChartCard title="Department headcount" className="lg:col-span-2">
          <DepartmentChart />
        </ChartCard>
        {/* <ChartCard title="Hiring pipeline">
          <HiringPipelineChart />
        </ChartCard> */}
      </div>
    </div>
  )
}
