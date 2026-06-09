import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Plus,
  Upload,
  Wallet,
  XCircle,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { formatINR } from '../../utils/currency'

const EXPENSE_TYPES = [
  'Travel',
  'Food & Beverages',
  'Office Supplies',
  'Training',
  'Accommodation',
  'Internet',
  'Medical',
  'Meals',
  'Other',
]

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function emptyForm(userName) {
  return {
    requestFor: userName || '',
    amount: '',
    expenseType: EXPENSE_TYPES[0],
    expenseDate: '',
    supportingDocuments: [],
    comments: '',
  }
}

export default function Reimbursements() {
  const { user } = useAuth()
  const { reimbursementRequests = [], submitReimbursement, updateReimbursementStatus } = useHrms()
  const canApprove = ['admin', 'superadmin'].includes(user?.role)
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState(() => emptyForm(user?.name))
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailRequestId, setDetailRequestId] = useState(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewingRequest, setReviewingRequest] = useState(null)
  const [reviewStatus, setReviewStatus] = useState('approved')
  const [reviewerComment, setReviewerComment] = useState('')

  const scopedRequests = useMemo(() => {
    const list = canApprove
      ? reimbursementRequests
      : reimbursementRequests.filter((item) => item.employeeId === user?.employeeId)

    return [...list].sort((a, b) => {
      const left = `${b.submittedAt || ''}-${b.id}`
      const right = `${a.submittedAt || ''}-${a.id}`
      return left.localeCompare(right)
    })
  }, [canApprove, reimbursementRequests, user?.employeeId])

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return scopedRequests
    return scopedRequests.filter((item) => item.status === statusFilter)
  }, [scopedRequests, statusFilter])

  const counts = useMemo(
    () => ({
      pending: scopedRequests.filter((item) => item.status === 'pending').length,
      approved: scopedRequests.filter((item) => item.status === 'approved').length,
      rejected: scopedRequests.filter((item) => item.status === 'rejected').length,
      totalAmount: scopedRequests.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      approvedAmount: scopedRequests
        .filter((item) => item.status === 'approved')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }),
    [scopedRequests],
  )

  const detailRequest =
    scopedRequests.find((item) => String(item.id) === String(detailRequestId)) || null

  const openDetails = (request) => {
    setDetailRequestId(request.id)
    setDetailModalOpen(true)
  }

  const openReview = (
    request,
    nextStatus = request.status === 'pending' ? 'approved' : request.status,
  ) => {
    setDetailModalOpen(false)
    setReviewingRequest(request)
    setReviewStatus(nextStatus)
    setReviewerComment(request.reviewerComment || '')
    setReviewModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submitReimbursement({
      employeeId: user?.employeeId,
      employeeName: user?.name,
      requestFor: form.requestFor.trim() || user?.name,
      amount: Number(form.amount),
      expenseType: form.expenseType,
      expenseDate: form.expenseDate,
      supportingDocuments: form.supportingDocuments,
      comments: form.comments.trim(),
    })
    setForm(emptyForm(user?.name))
    setCreateModalOpen(false)
  }

  const handleDocumentChange = (event) => {
    const files = Array.from(event.target.files || []).map((file) => file.name)
    setForm((current) => ({ ...current, supportingDocuments: files }))
  }

  const handleReviewSave = (e) => {
    e.preventDefault()
    if (!reviewingRequest) return
    updateReimbursementStatus(reviewingRequest.id, reviewStatus, reviewerComment.trim())
    setReviewModalOpen(false)
    setReviewingRequest(null)
    setReviewerComment('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="page-title">{canApprove ? 'Reimbursement Requests' : 'Reimbursements'}</h1>
        <p className="page-subtitle">
          {canApprove
              ? 'Review, decide, and track employee expense reimbursements in one place.'
              : 'Create reimbursement requests, attach proofs, and track approval progress.'}
          </p>
        </div>

        {!canApprove && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Clock3}
          label="Pending"
          value={counts.pending}
          note="Waiting for review"
          tone="border-amber-200 bg-amber-50/70 text-amber-800"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Approved"
          value={counts.approved}
          note={formatINR(counts.approvedAmount)}
          tone="border-primary/20 bg-primary-light/40 text-primary-dark"
        />
        <SummaryCard
          icon={XCircle}
          label="Rejected"
          value={counts.rejected}
          note="Not approved"
          tone="border-red-200 bg-red-50 text-red-700"
        />
        <SummaryCard
          icon={Wallet}
          label="Total Amount"
          value={formatINR(counts.totalAmount)}
          note={`${scopedRequests.length} request(s)`}
          tone="border-border bg-white text-foreground"
        />
      </div>

      {!canApprove && (
        <Card
          title="Create Reimbursement Request"
          subtitle="Submit expenses with amount, date, proof, and a short note."
          action={
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" />
              Create Request
            </button>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary-light/30 via-white to-white p-5">
              <p className="text-sm font-semibold text-foreground">What to include</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniInfo icon={Wallet} label="Expense amount" value="Enter the claim value in INR." />
                <MiniInfo icon={CalendarDays} label="Expense date" value="Use the actual date of spend." />
                <MiniInfo icon={FileText} label="Documents" value="Attach bills, receipts, or invoices." />
                <MiniInfo icon={AlertCircle} label="Comments" value="Add a short explanation for HR." />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-neutral-50/70 p-5">
              <p className="text-sm font-semibold text-foreground">Quick tip</p>
              <p className="mt-2 text-sm text-muted">
                Upload your receipt names from the form. Once submitted, you can open each request
                to check status, review notes, and approval decisions.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card
        title={canApprove ? 'Request Queue' : 'My Requests'}
        subtitle={
          canApprove
            ? 'Review requests in the table below — open details or use quick actions on each row.'
            : 'Track your reimbursement requests and open any row for full details.'
        }
        toolbar={
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                aria-pressed={statusFilter === filter.id}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === filter.id
                    ? 'bg-primary text-white'
                    : 'border border-border bg-white text-muted hover:border-primary/20 hover:text-foreground'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      >
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-neutral-50/70 px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No reimbursement requests found.</p>
            <p className="mt-1 text-xs text-muted">
              {statusFilter === 'all'
                ? 'Nothing is available right now.'
                : `No requests are in the ${statusFilter} state.`}
            </p>
          </div>
        ) : (
          <ReimbursementsTable
            requests={filteredRequests}
            canApprove={canApprove}
            onView={openDetails}
            onApprove={(request) => openReview(request, 'approved')}
            onReject={(request) => openReview(request, 'rejected')}
            onUpdate={openReview}
          />
        )}
      </Card>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Reimbursement Request"
        subtitle="Fill in the request details and attach the supporting proof."
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Request for">
              <input
                required
                value={form.requestFor}
                onChange={(e) => setForm({ ...form, requestFor: e.target.value })}
                className={inputClass}
              />
            </FormField>

            <FormField label="Amount">
              <input
                required
                min="1"
                step="0.01"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Enter amount"
                className={inputClass}
              />
            </FormField>

            <FormField label="Expense Type">
              <select
                value={form.expenseType}
                onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
                className={inputClass}
              >
                {EXPENSE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Expense Date">
              <input
                required
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Supporting document(s)">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-neutral-50/80 px-4 py-7 text-center transition hover:border-primary/30 hover:bg-primary-light/20">
              <Upload className="h-8 w-8 text-primary" />
              <span className="mt-2 text-sm font-medium text-foreground">
                Upload bills, receipts, or invoices
              </span>
              <span className="mt-1 text-xs text-muted">
                Multiple files allowed. File names will be stored in the request.
              </span>
              <input type="file" multiple onChange={handleDocumentChange} className="sr-only" />
            </label>

            {form.supportingDocuments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.supportingDocuments.map((doc) => (
                  <span
                    key={doc}
                    className="inline-flex rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            )}
          </FormField>

          <FormField label="Comments">
            <textarea
              rows={4}
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              placeholder="Add a short note about the expense"
              className={inputClass}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              <Upload className="h-4 w-4" />
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailModalOpen && Boolean(detailRequest)}
        onClose={() => setDetailModalOpen(false)}
        title="Reimbursement Details"
        subtitle="Full submitted information, proofs, and review notes."
        wide
      >
        {detailRequest && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Status" value={statusLabel(detailRequest.status)} badgeStatus={detailRequest.status} />
              <MetricTile label="Amount" value={formatINR(detailRequest.amount)} accent />
              <MetricTile label="Expense Date" value={formatDate(detailRequest.expenseDate)} />
              <MetricTile label="Submitted" value={formatDate(detailRequest.submittedAt)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionBox title="Request Info">
            <div className="grid gap-3 sm:grid-cols-2">
              {canApprove && <SimpleInfo label="Employee" value={detailRequest.employeeName} />}
              <SimpleInfo label="Request For" value={detailRequest.requestFor || detailRequest.employeeName} />
              <SimpleInfo label="Expense Type" value={detailRequest.expenseType} />
              <SimpleInfo label="Amount" value={formatINR(detailRequest.amount)} />
            </div>
              </SectionBox>

              <SectionBox title="Supporting Documents">
              {(detailRequest.supportingDocuments || []).length > 0 ? (
                  <div className="space-y-2">
                  {detailRequest.supportingDocuments.map((doc) => (
                    <div
                      key={doc}
                        className="rounded-xl border border-border bg-neutral-50 px-3 py-2 text-sm text-foreground"
                    >
                      {doc}
                    </div>
                  ))}
                </div>
              ) : (
                  <p className="text-sm text-muted">No supporting documents attached.</p>
              )}
              </SectionBox>
            </div>

            <SectionBox title="Comments">
              <p className="text-sm text-foreground">{detailRequest.comments || 'No comments added.'}</p>
            </SectionBox>

            {(detailRequest.reviewedBy || detailRequest.reviewerComment) && (
              <SectionBox title="HR Review" muted>
                <p className="text-sm text-foreground">
                  {detailRequest.reviewedBy ? `Reviewed by ${detailRequest.reviewedBy}` : 'Reviewed by HR'}
                  {detailRequest.reviewedAt ? ` on ${formatDate(detailRequest.reviewedAt)}` : ''}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {detailRequest.reviewerComment || 'No review comment added.'}
                </p>
              </SectionBox>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-neutral-50"
              >
                Close
              </button>
              {canApprove && (
                <button
                  type="button"
                  onClick={() => openReview(detailRequest)}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Review Request
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Reimbursement"
        subtitle="Choose a decision and add an HR comment."
        wide
      >
        {reviewingRequest && (
          <form onSubmit={handleReviewSave} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Employee" value={reviewingRequest.employeeName} />
              <MetricTile label="Amount" value={formatINR(reviewingRequest.amount)} accent />
              <MetricTile label="Expense Type" value={reviewingRequest.expenseType} />
              <MetricTile label="Expense Date" value={formatDate(reviewingRequest.expenseDate)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Decision</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {['approved', 'rejected', 'pending'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReviewStatus(status)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                      reviewStatus === status
                        ? 'bg-primary text-white'
                        : 'border border-border bg-white text-foreground hover:bg-neutral-50'
                    }`}
                  >
                    {statusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">HR Comment</label>
              <textarea
                rows={4}
                value={reviewerComment}
                onChange={(e) => setReviewerComment(e.target.value)}
                placeholder="Add approval note or rejection reason"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Save Decision
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function ReimbursementsTable({ requests, canApprove, onView, onApprove, onReject, onUpdate }) {
  return (
    <div className="table-scroll -mx-4 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-muted">
            {canApprove ? <th className="px-4 py-3 sm:px-6">Employee</th> : null}
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Expense date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 sm:pr-6">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {requests.map((request) => (
            <tr key={request.id} className="align-top transition-colors hover:bg-neutral-50/80">
              {canApprove ? (
                <td className="px-4 py-4 sm:px-6">
                  <p className="font-semibold text-foreground">{request.employeeName}</p>
                  <p className="mt-0.5 text-xs text-muted">{request.requestFor || request.employeeName}</p>
                </td>
              ) : null}
              <td className="px-4 py-4 text-foreground">{request.expenseType}</td>
              <td className="px-4 py-4 font-semibold text-primary">{formatINR(request.amount)}</td>
              <td className="px-4 py-4 text-muted">{formatDate(request.expenseDate)}</td>
              <td className="px-4 py-4">
                <Badge status={request.status}>{statusLabel(request.status)}</Badge>
              </td>
              <td className="px-4 py-4 sm:pr-6">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onView(request)}
                    className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-neutral-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                  {canApprove && request.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onApprove(request)}
                        className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(request)}
                        className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {canApprove && request.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => onUpdate(request)}
                      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-neutral-50"
                    >
                      Update
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, note, tone }) {
  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-1 text-xl font-bold">{value}</p>
          {note && <p className="mt-1 text-xs opacity-80">{note}</p>}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function MiniInfo({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/80 p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 text-sm text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

function SectionBox({ title, children, muted = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${muted ? 'border-border bg-neutral-50/70' : 'border-border bg-white'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function MetricTile({ label, value, badgeStatus, accent = false }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2">
        {badgeStatus ? (
          <Badge status={badgeStatus}>{value}</Badge>
        ) : (
          <p className={`text-lg font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
        )}
      </div>
    </div>
  )
}

function SimpleInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-neutral-50/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function statusLabel(status) {
  if (!status) return 'Unknown'
  return status.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const inputClass =
  'w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15'
