import {
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Hash,
  GitBranch,
  Users,
} from 'lucide-react'
import Badge from '../ui/Badge'
import { formatINR } from '../../utils/currency'
import { formatDisplayDate, formatLeaveDateRange } from '../../utils/timeUtils'

export default function EmployeeDetailModal({ open, onClose, details }) {
  if (!open || !details?.employee) return null

  const {
    employee,
    payroll,
    leaves = [],
    timeLogs = [],
    todayAttendance,
    latestAttendance,
    latestTimeLog,
    branch,
    manager,
    directReports = [],
    leaveSummary,
  } = details

  const currentAttendance = todayAttendance || latestAttendance
  const currentLog = latestTimeLog || timeLogs[0] || null
  const pendingLeaves = leaves.filter((leave) => leave.status === 'pending').length
  const approvedLeaves = leaves.filter((leave) => leave.status === 'approved').length
  const earnings = payroll
    ? [
        ['Basic salary', payroll.basic],
        ['HRA', payroll.hra],
        ['LTA', payroll.lta],
        ['Bonus', payroll.bonus],
        ['Special allowance', payroll.specialAllowance],
        ['Gross salary', payroll.grossSalary],
      ]
    : []
  const deductions = payroll
    ? [
        ['EPF (employee)', payroll.epfEmployee],
        ['ESI (employee)', payroll.esiEmployee],
        ['Professional tax', payroll.professionalTax],
        ['Health insurance', payroll.healthInsurance],
        ['TDS', payroll.tds],
        ['Other deductions', payroll.otherDeductions],
      ]
    : []
  const employerContributions = payroll
    ? [
        ['EPF (employer)', payroll.employerEpf],
        ['ESI (employer)', payroll.employerEsi],
        ['Gratuity', payroll.gratuity],
      ]
    : []
  const profileFields = [
    { icon: Hash, label: 'Employee ID', value: employee.id },
    { icon: Mail, label: 'Email', value: employee.email },
    { icon: Phone, label: 'Phone', value: employee.phone || '—' },
    { icon: MapPin, label: 'Address', value: employee.address || '—' },
    { icon: Building2, label: 'Department', value: employee.department },
    { icon: Briefcase, label: 'Role', value: employee.role },
    { icon: Calendar, label: 'Join date', value: formatDate(employee.joinDate) },
    { icon: GitBranch, label: 'Branch', value: branch?.name || '—' },
    {
      icon: Users,
      label: 'Reporting manager',
      value: manager ? `${manager.name} · ${manager.role}` : '—',
    },
    {
      icon: Users,
      label: 'Direct reports',
      value: directReports.length ? `${directReports.length} team member(s)` : 'No direct reports',
    },
  ]
  const topMetrics = [
    {
      label: 'Branch',
      value: branch?.name || '—',
      subvalue: branch?.city ? `${branch.city}${branch.country ? `, ${branch.country}` : ''}` : branch?.address || 'Not assigned',
    },
    {
      label: 'Manager',
      value: manager?.name || '—',
      subvalue: manager?.role || 'No manager assigned',
    },
    {
      label: 'Team',
      value: String(directReports.length),
      subvalue: directReports.length ? 'Direct reports' : 'No direct reports',
    },
    {
      label: 'Pending leaves',
      value: String(pendingLeaves),
      subvalue: `${approvedLeaves} approved request(s)`,
      tone: pendingLeaves ? 'warning' : 'default',
    },
    {
      label: 'Attendance',
      value: currentAttendance ? statusLabel(currentAttendance.status) : 'No record',
      subvalue: currentAttendance?.date ? formatDate(currentAttendance.date) : 'No attendance on file',
      tone: currentAttendance?.status === 'late' ? 'warning' : currentAttendance?.status === 'present' ? 'success' : 'default',
    },
  ]
  const leaveMetrics = leaveSummary
    ? [
        { label: 'Casual left', value: `${leaveSummary.remaining.casual} day(s)` },
        { label: 'Sick left', value: `${leaveSummary.remaining.sick} day(s)` },
        { label: 'Earned left', value: `${leaveSummary.remaining.earned} day(s)` },
        { label: 'Optional left', value: `${leaveSummary.optionalRemaining} day(s)` },
      ]
    : []
  const recentLogs = timeLogs.slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-border bg-gradient-to-r from-primary-light/30 via-white to-white px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-xl font-bold text-white shadow-lg shadow-primary/20">
                {employee.avatar}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">{employee.name}</h2>
                  <Badge status={employee.status}>{statusLabel(employee.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {employee.id} · {employee.role} · {employee.department}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <MetaPill label="Branch" value={branch?.name || '—'} />
                  <MetaPill label="Manager" value={manager?.name || '—'} />
                  <MetaPill label="Joined" value={formatDate(employee.joinDate)} />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="self-end rounded-xl p-2 text-muted transition hover:bg-neutral-100 hover:text-foreground lg:self-start"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {topMetrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                subvalue={metric.subvalue}
                tone={metric.tone}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <SectionCard title="Employee Profile" subtitle="Personal, work, and reporting information">
                <div className="grid gap-4 md:grid-cols-2">
                  {profileFields.map((field) => (
                    <InfoTile key={field.label} icon={field.icon} label={field.label} value={field.value} />
                  ))}
                </div>

                <div className="mt-5 border-t border-border/70 pt-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoTile
                      icon={MapPin}
                      label="Branch address"
                      value={branch?.address || 'No branch address available'}
                    />
                    <InfoTile
                      icon={Users}
                      label="Team members"
                      value={
                        directReports.length
                          ? directReports.map((report) => report.name).join(', ')
                          : 'No direct reports assigned'
                      }
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Attendance & Work Log" subtitle="Latest attendance details and recent daily logs">
                <div className="grid gap-3 md:grid-cols-5">
                  <MetricCard
                    label="Status"
                    value={currentAttendance ? statusLabel(currentAttendance.status) : 'No record'}
                    subvalue={currentAttendance?.date ? formatDate(currentAttendance.date) : 'No attendance yet'}
                    tone={
                      currentAttendance?.status === 'late'
                        ? 'warning'
                        : currentAttendance?.status === 'present'
                          ? 'success'
                          : 'default'
                    }
                  />
                  <MetricCard label="Portal login" value={currentLog?.portalLogin || '—'} subvalue="Last recorded login" />
                  <MetricCard label="Check-in" value={currentAttendance?.checkIn || currentLog?.checkIn || '—'} />
                  <MetricCard label="Check-out" value={currentAttendance?.checkOut || currentLog?.checkOut || '—'} />
                  <MetricCard label="Work hours" value={currentLog?.workHours || '—'} subvalue="Latest logged hours" />
                </div>

                {recentLogs.length > 0 ? (
                  <div className="mt-5 overflow-x-auto rounded-2xl border border-border/80">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-neutral-50/80 text-muted">
                        <tr>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Portal</th>
                          <th className="px-4 py-3 font-medium">Attendance</th>
                          <th className="px-4 py-3 font-medium">Hours</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {recentLogs.map((log) => (
                          <tr key={`${log.employeeId}-${log.date}`}>
                            <td className="px-4 py-3 font-medium text-foreground">{formatDate(log.date)}</td>
                            <td className="px-4 py-3 text-muted">
                              <div className="flex flex-col">
                                <span>{log.portalLogin || '—'} in</span>
                                <span>{log.portalLogout || '—'} out</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted">
                              <div className="flex flex-col">
                                <span>{log.checkIn || '—'} in</span>
                                <span>{log.checkOut || '—'} out</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-foreground">{log.workHours || '—'}</td>
                            <td className="px-4 py-3">
                              <Badge status={log.status}>{statusLabel(log.status)}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted">No attendance or work logs are available for this employee yet.</p>
                )}
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard title="Payroll Breakdown" subtitle={payroll ? `Latest payroll month: ${payroll.month}` : 'No payroll record on file'}>
                {payroll ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <PayCell label="Annual CTC" value={formatINR(payroll.yearlyCtc)} />
                      <PayCell label="Monthly gross" value={formatINR(payroll.grossSalary)} highlight />
                      <PayCell label="Total deductions" value={formatINR(payroll.deductions)} danger />
                      <PayCell label="Company cost" value={formatINR(payroll.companyCostMonthly)} />
                    </div>
                    <div className="mt-4 grid gap-4 2xl:grid-cols-3">
                      <PayrollColumn title="Earnings" items={earnings} positive />
                      <PayrollColumn title="Deductions" items={deductions} negative />
                      <PayrollColumn title="Employer Contributions" items={employerContributions} />
                    </div>
                    <div className="mt-4 rounded-2xl border border-primary/15 bg-primary-light/40 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark/70">Net pay</p>
                      <p className="mt-1 text-3xl font-bold text-primary">{formatINR(payroll.net)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">No payroll record on file.</p>
                )}
              </SectionCard>

              <SectionCard title="Leave Snapshot" subtitle="Current balances and leave request summary">
                {leaveSummary ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {leaveMetrics.map((metric) => (
                        <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                      ))}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <MetricCard label="Pending requests" value={String(pendingLeaves)} subvalue="Awaiting review" tone={pendingLeaves ? 'warning' : 'default'} />
                      <MetricCard label="Approved requests" value={String(approvedLeaves)} subvalue="All-time approved" tone={approvedLeaves ? 'success' : 'default'} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">Leave balances are not available.</p>
                )}
              </SectionCard>
            </div>
          </div>

          <SectionCard title="Leave History" subtitle="Complete leave request history for this employee" className="mt-6">
            {leaves.length === 0 ? (
              <p className="text-sm text-muted">No leave requests.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-neutral-50/80 text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Date range</th>
                      <th className="px-4 py-3 font-medium">Days</th>
                      <th className="px-4 py-3 font-medium">Reason</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td className="px-4 py-3 font-medium text-foreground">{leave.type}</td>
                        <td className="px-4 py-3 text-muted">{formatLeaveDateRange(leave)}</td>
                        <td className="px-4 py-3 text-foreground">{leave.days}</td>
                        <td className="px-4 py-3 text-muted">{leave.reason || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge status={leave.status}>{statusLabel(leave.status)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-border/80 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function MetaPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white/90 px-3 py-1 text-xs font-medium text-muted">
      <span className="font-semibold text-foreground">{label}:</span> {value}
    </span>
  )
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/80 bg-neutral-50/60 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, subvalue, tone = 'default' }) {
  const toneClasses =
    tone === 'success'
      ? 'border-primary/20 bg-primary-light/30'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : 'border-border/80 bg-white'

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
      {subvalue && <p className="mt-1 text-xs text-muted">{subvalue}</p>}
    </div>
  )
}

function PayCell({ label, value, highlight, danger }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-2 text-lg font-semibold ${
          danger ? 'text-red-600' : highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function PayrollColumn({ title, items, positive, negative }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{label}</span>
            <span
              className={`font-semibold ${
                negative ? 'text-red-600' : positive ? 'text-primary-dark' : 'text-foreground'
              }`}
            >
              {formatINR(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDate(value) {
  return value ? formatDisplayDate(value) : '—'
}

function statusLabel(value) {
  return String(value || '—').replace(/-/g, ' ')
}

