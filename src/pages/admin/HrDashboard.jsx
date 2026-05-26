import { useState } from 'react'
import { Users, CalendarOff, Plus, Briefcase, Upload, Receipt } from 'lucide-react'
import { useHrms } from '../../hooks/useHrms'
import KpiCard from '../../components/hr/KpiCard'
import ActivityFeed from '../../components/hr/ActivityFeed'
import PostJobModal from '../../components/hr/PostJobModal'
import BulkImportJobsModal from '../../components/hr/BulkImportJobsModal'
import ChartCard from '../../components/charts/ChartCard'
import DepartmentChart from '../../components/charts/DepartmentChart'
import LeaveDistributionChart from '../../components/charts/LeaveDistributionChart'
import HiringPipelineChart from '../../components/charts/HiringPipelineChart'

export default function HrDashboard() {
  const { adminStats, jobPostings, addJobPosting, bulkImportJobPostings } = useHrms()
  const [postJobOpen, setPostJobOpen] = useState(false)
  const [importJobsOpen, setImportJobsOpen] = useState(false)

  const activeJobs = (jobPostings || []).filter((j) => j.status === 'active')

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">HR Dashboard</h1>
          <p className="page-subtitle">Organization-wide analytics and operations</p>
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
      </div>

      {/* <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Open positions</h2>
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark">
              {activeJobs.length} active
            </span>
          </div>
          <Link to="/admin/recruitment" className="text-xs font-medium text-primary hover:text-primary-dark">
            View all →
          </Link>
        </div>
        {activeJobs.length === 0 ? (
          <p className="text-xs text-muted">No active jobs. Post one to start hiring.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="rounded-xl border border-border bg-surface/50 p-3">
                <p className="text-sm font-semibold text-foreground">{job.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {job.department} · {job.location}
                </p>
                <p className="mt-2 text-lg font-bold text-primary">{job.applicants}</p>
                <p className="text-[10px] text-muted">applicants</p>
              </div>
            ))}
          </div>
        )}
      </div> */}

      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard icon={Users} label="Total employees" value={adminStats.totalEmployees} to="/admin/employees" />
        <KpiCard icon={CalendarOff} label="Pending leaves" value={adminStats.pendingLeaves} to="/admin/leave" />
        <KpiCard
          icon={Receipt}
          label="Pending reimbursements"
          value={adminStats.pendingReimbursements}
          to="/admin/reimbursements"
        />
      </div>

      <ChartCard title="Leave by type" subtitle="Live from leave requests">
        <LeaveDistributionChart />
      </ChartCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Department headcount" subtitle="Live employee data" className="lg:col-span-2">
          <DepartmentChart />
        </ChartCard>
        <ActivityFeed />
      </div>

      {/* <div className="grid gap-5">
        <ChartCard title="Recruitment pipeline">
          <HiringPipelineChart />
        </ChartCard>
      </div> */}

      {/* <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">All job postings</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Department</th>
                <th className="pb-2 font-medium">Salary</th>
                <th className="pb-2 font-medium">Applicants</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(jobPostings || []).map((job) => (
                <tr key={job.id}>
                  <td className="py-2 font-medium text-foreground">{job.title}</td>
                  <td className="py-2">{job.department}</td>
                  <td className="py-2">{job.salaryRange}</td>
                  <td className="py-2">{job.applicants}</td>
                  <td className="py-2">
                    <Badge status={job.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> */}

      <PostJobModal
        open={postJobOpen}
        onClose={() => setPostJobOpen(false)}
        onSubmit={addJobPosting}
      />

      <BulkImportJobsModal
        open={importJobsOpen}
        onClose={() => setImportJobsOpen(false)}
        onImport={bulkImportJobPostings}
      />
    </div>
  )
}
