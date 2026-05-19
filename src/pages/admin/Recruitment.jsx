import { useState } from 'react'
import { Plus, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import ChartCard from '../../components/charts/ChartCard'
import HiringPipelineChart from '../../components/charts/HiringPipelineChart'
import Badge from '../../components/ui/Badge'
import PostJobModal from '../../components/hr/PostJobModal'
import BulkImportJobsModal from '../../components/hr/BulkImportJobsModal'
import { useHrms } from '../../hooks/useHrms'

export default function Recruitment() {
  const { jobPostings, addJobPosting, bulkImportJobPostings, updateJobStatus, softDeleteJobPosting } =
    useHrms()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'
  const [postJobOpen, setPostJobOpen] = useState(false)
  const [importJobsOpen, setImportJobsOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Recruitment</h1>
          <p className="page-subtitle">Manage hiring pipeline and job openings</p>
        </div>
        <div className="flex flex-wrap gap-2">
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

      <ChartCard title="Hiring funnel" subtitle="Candidates by stage">
        <HiringPipelineChart />
      </ChartCard>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(jobPostings || []).map((job) => (
          <div key={job.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
            <p className="mt-1 text-xs text-muted">
              {job.department} · {job.location}
            </p>
            <p className="mt-0.5 text-xs text-muted">{job.salaryRange}</p>
            <p className="mt-2 text-lg font-bold text-primary">{job.applicants}</p>
            <p className="text-[10px] text-muted">applicants</p>
            <p className="mt-2 line-clamp-2 text-xs text-muted">{job.description}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Badge status={job.status === 'active' ? 'active' : 'inactive'} />
              <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <button
                  type="button"
                  title="Move to recycle bin"
                  onClick={() => {
                    if (window.confirm(`Move "${job.title}" to the recycle bin?`)) {
                      softDeleteJobPosting(job.id)
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {job.status === 'active' && (
                <button
                  type="button"
                  onClick={() => updateJobStatus(job.id, 'paused')}
                  className="text-xs font-medium text-muted hover:text-foreground"
                >
                  Pause
                </button>
              )}
              {job.status === 'paused' && (
                <button
                  type="button"
                  onClick={() => updateJobStatus(job.id, 'active')}
                  className="text-xs font-medium text-primary hover:text-primary-dark"
                >
                  Resume
                </button>
              )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
