import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import analytics from '../../data/analytics.json'
import { useHrms } from '../../hooks/useHrms'

export default function DepartmentChart() {
  const { departmentChartData } = useHrms()
  const data = departmentChartData.length ? departmentChartData : analytics.departmentHeadcount

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: '#fff4eb' }}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={1500} animationEasing="ease-out">
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
