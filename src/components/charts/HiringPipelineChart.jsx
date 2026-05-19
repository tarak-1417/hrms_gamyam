import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import analytics from '../../data/analytics.json'

export default function HiringPipelineChart() {
  const data = analytics.hiringPipeline

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={data} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fontSize: 12, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
        <Bar
          dataKey="count"
          fill="#f58220"
          radius={[0, 8, 8, 0]}
          animationDuration={1600}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
