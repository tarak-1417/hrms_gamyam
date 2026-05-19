import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import analytics from '../../data/analytics.json'
import { useHrms } from '../../hooks/useHrms'

export default function LeaveDistributionChart() {
  const { leaveChartData } = useHrms()
  const data = leaveChartData.length ? leaveChartData : analytics.leaveByType

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          animationDuration={1200}
          animationEasing="ease-out"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
