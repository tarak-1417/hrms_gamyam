import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Plus, Receipt, Upload, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import ActivityFeed from '../../components/hr/ActivityFeed'
import PostJobModal from '../../components/hr/PostJobModal'
import BulkImportJobsModal from '../../components/hr/BulkImportJobsModal'
import ChartCard from '../../components/charts/ChartCard'
import DepartmentChart from '../../components/charts/DepartmentChart'
import { formatWelcomeDateParts, getFirstName, getTimeGreeting } from '../../utils/timeUtils'

function HrDashboardWelcome({ greeting, firstName, roleLabel, employeeCode }) {
  const { weekday, dateLine } = formatWelcomeDateParts()

  return (
    <header className="dashboard-welcome-hero relative overflow-hidden rounded-3xl border border-primary/12 shadow-sm shadow-primary/5">
      <div className="dashboard-welcome-dots pointer-events-none absolute inset-0 opacity-35" aria-hidden />
      <div className="dashboard-welcome-shine pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-dark">
            {weekday} · {dateLine}
          </p>
          <h1 className="mt-4 text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-[2rem]">
            {greeting},{' '}
            <span className="text-primary">{firstName}</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-600 sm:text-base">
            Here&apos;s what&apos;s happening across people operations today.
          </p>
          <span className="mt-4 inline-flex rounded-full border border-primary/20 bg-white/90 px-3 py-1 text-xs font-semibold text-primary-dark">
            HR Dashboard
          </span>
        </div>

        <div className="hidden shrink-0 items-stretch gap-6 sm:flex">
          <div className={`${employeeCode && employeeCode !== '—' ? 'border-r border-neutral-200/90 pr-6' : ''} min-w-[7rem]`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Role</p>
            <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{roleLabel}</p>
          </div>
          {employeeCode && employeeCode !== '—' ? (
            <div className="min-w-[5.5rem]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Employee ID</p>
              <p className="mt-1.5 text-sm font-bold tracking-wide text-foreground">{employeeCode}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative flex flex-wrap gap-6 border-t border-neutral-200/80 bg-white/70 px-6 py-3.5 sm:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Role</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{roleLabel}</p>
        </div>
        {employeeCode && employeeCode !== '—' ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Employee ID</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">{employeeCode}</p>
          </div>
        ) : null}
      </div>
    </header>
  )
}

function QuickAccessCard({ to, title, value, footer, icon: Icon, tone = 'accent' }) {
  return (
    <Link
      to={to}
      className="dashboard-quick-card group flex min-h-[170px] flex-col rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:min-h-[185px] sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-[3.25rem] sm:w-[3.25rem] ${
            tone === 'dark' ? 'bg-neutral-900 text-white' : 'bg-primary-light text-primary'
          }`}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <span className="text-neutral-300 transition group-hover:text-primary" aria-hidden>
          ↗
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-neutral-500 sm:text-base">{title}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>

      {footer ? (
        <p className="mt-auto pt-5 text-xs text-neutral-500 sm:text-sm">
          <span>{footer}</span>
        </p>
      ) : null}
    </Link>
  )
}

export default function HrDashboard() {
  const { user } = useAuth()
  const { adminStats, addJobPosting, bulkImportJobPostings, employees = [] } = useHrms()
  const [postJobOpen, setPostJobOpen] = useState(false)
  const [importJobsOpen, setImportJobsOpen] = useState(false)
  const currentEmployee =
    user?.employeeId ? employees.find((e) => e.id === user.employeeId) ?? null : null
  const firstName = getFirstName(user?.name || currentEmployee?.name || 'HR')
  const roleLabel = currentEmployee?.role || (user?.role ? user.role.toUpperCase() : 'HR')
  const employeeCode = currentEmployee?.id || user?.employeeId || '—'

  const quickAccess = useMemo(
    () => [
      {
        to: '/admin/leave',
        title: 'Pending approvals',
        value: String(adminStats.pendingApprovals ?? 0),
        footer: `${adminStats.pendingLeaves ?? 0} leaves · ${adminStats.pendingReimbursements ?? 0} reimbursements`,
        icon: ClipboardList,
      },
      {
        to: '/admin/employees',
        title: 'All employees',
        value: String(adminStats.totalEmployees ?? 0),
        footer: `${adminStats.newHires ?? 0} joined recently`,
        icon: Users,
      },
      {
        to: '/admin/reimbursements',
        title: 'Reimbursement queue',
        value: String(adminStats.pendingReimbursements ?? 0),
        footer: 'Pending review',
        icon: Receipt,
      },
    ],
    [adminStats],
  )

  return (
    <div className="space-y-10 pb-8">
      <HrDashboardWelcome
        greeting={getTimeGreeting()}
        firstName={firstName}
        roleLabel={roleLabel}
        employeeCode={employeeCode}
      />

      <section className="pt-2">
        <p className="dashboard-section-eyebrow text-[11px] uppercase">Quick access</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Everything in one tap
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {quickAccess.map((card) => (
            <QuickAccessCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="min-w-0">
          <ChartCard
            title="Department headcount"
            subtitle="Live employee data"
            compact
            chartAtBottom
            className="h-full w-full"
          >
            <DepartmentChart />
          </ChartCard>
        </div>
        <div className="min-w-0">
          <ActivityFeed className="h-full w-full" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 hidden">
        <button
          type="button"
          onClick={() => setImportJobsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light"
        >
          <Upload className="h-4 w-4" />
          Bulk import
        </button>
        <button
          type="button"
          onClick={() => setPostJobOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Post job
        </button>
      </div>

      <PostJobModal open={postJobOpen} onClose={() => setPostJobOpen(false)} onSubmit={addJobPosting} />

      <BulkImportJobsModal
        open={importJobsOpen}
        onClose={() => setImportJobsOpen(false)}
        onImport={bulkImportJobPostings}
      />
    </div>
  )
}
