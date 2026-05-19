import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import analytics from '../../data/analytics.json'

const PRIMARY = '#f58220'

export default function PayrollTrendChart() {
  const data = analytics.payrollMonthly

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v}L`}
        />
        <Tooltip
          formatter={(v) => [`₹${v} Lakhs`, 'Payroll']}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke={PRIMARY}
          strokeWidth={3}
          dot={{ fill: PRIMARY, strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, fill: PRIMARY }}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
