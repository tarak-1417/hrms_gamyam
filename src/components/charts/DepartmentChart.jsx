import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import analytics from '../../data/analytics.json'
import { useHrms } from '../../hooks/useHrms'

export default function DepartmentChart() {
  const { departmentChartData } = useHrms()
  const data = departmentChartData.length ? departmentChartData : analytics.departmentHeadcount

  const yMax = useMemo(() => {
    const peak = Math.max(...data.map((d) => d.count), 0)
    return Math.max(peak, 1)
  }, [data])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 2, right: 4, left: -8, bottom: 0 }}
        barCategoryGap="18%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={36}
          tickMargin={4}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={28}
          domain={[0, yMax]}
          tickCount={yMax + 1}
        />
        <Tooltip
          cursor={{ fill: '#fff4eb' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 25px rgba(17,24,39,0.08)',
          }}
        />
        <Bar
          dataKey="count"
          radius={[8, 8, 0, 0]}
          maxBarSize={40}
          animationDuration={900}
          animationEasing="ease-out"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
