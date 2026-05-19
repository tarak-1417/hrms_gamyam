import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import analytics from '../../data/analytics.json'

export default function PlatformGrowthChart() {
  const data = analytics.platformGrowth

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          yAxisId="left"
          dataKey="companies"
          fill="#f58220"
          radius={[6, 6, 0, 0]}
          animationDuration={1200}
          name="Companies"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="users"
          stroke="#171717"
          strokeWidth={2}
          dot={{ fill: '#171717', r: 4 }}
          animationDuration={1500}
          name="Users"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
