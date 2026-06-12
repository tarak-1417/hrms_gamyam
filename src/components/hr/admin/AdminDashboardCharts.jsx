import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import analytics from '../../../data/analytics.json'
import { useHrms } from '../../../hooks/useHrms'

const AXIS_TICK = { fontSize: 11, fill: '#94a3b8' }

const tooltipStyle = {
  borderRadius: 14,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.92)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 18px 40px -18px rgba(2,6,23,0.9)',
  color: '#f8fafc',
}
const tooltipLabelStyle = { color: '#cbd5e1', fontWeight: 600 }
const tooltipItemStyle = { color: '#e2e8f0' }

/* ---- Attendance trend (area) ---- */
export function AttendanceAreaChart() {
  const data = analytics.attendanceTrend
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="hrxPresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="hrxLate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} tickMargin={8} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={34} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          cursor={{ stroke: 'rgba(148,163,184,0.3)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="present"
          stroke="#34d399"
          strokeWidth={2.5}
          fill="url(#hrxPresent)"
          animationDuration={900}
        />
        <Area
          type="monotone"
          dataKey="late"
          stroke="#fbbf24"
          strokeWidth={2.5}
          fill="url(#hrxLate)"
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ---- Leave distribution (donut) ---- */
const LEAVE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

export function LeaveDonut() {
  const { leaveChartData } = useHrms()
  const data = useMemo(() => {
    const live = leaveChartData?.length ? leaveChartData : analytics.leaveByType
    return live.map((d, i) => ({ ...d, fill: LEAVE_COLORS[i % LEAVE_COLORS.length] }))
  }, [leaveChartData])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="62%"
          outerRadius="92%"
          paddingAngle={3}
          stroke="none"
          animationDuration={900}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

export function LeaveLegend() {
  const { leaveChartData } = useHrms()
  const data = leaveChartData?.length ? leaveChartData : analytics.leaveByType
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2.5 text-white/75">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: LEAVE_COLORS[i % LEAVE_COLORS.length] }}
            />
            {d.name}
          </span>
          <span className="font-semibold text-white">{Math.round((d.value / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  )
}

/* ---- Department headcount (bars) ---- */
export function DepartmentBars() {
  const { departmentChartData } = useHrms()
  const data = departmentChartData?.length ? departmentChartData : analytics.departmentHeadcount

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
        <defs>
          <linearGradient id="hrxBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={40}
          tickMargin={6}
        />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={tooltipLabelStyle}
          itemStyle={tooltipItemStyle}
          cursor={{ fill: 'rgba(129,140,248,0.08)' }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={42} fill="url(#hrxBar)" animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  )
}
