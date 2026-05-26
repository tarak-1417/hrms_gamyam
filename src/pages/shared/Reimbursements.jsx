import { useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { formatINR } from '../../utils/currency'

const EXPENSE_TYPES = [
  'Travel',
  'Meals',
  'Accommodation',
  'Internet',
  'Medical',
  'Office Supplies',
  'Training',
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

function getDocumentSummary(documents = []) {
  if (documents.length === 0) return 'No documents attached'
  if (documents.length === 1) return `1 document: ${documents[0]}`
  return `${documents.length} documents attached`
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
    }),
    [scopedRequests],
  )

  const detailRequest =
    scopedRequests.find((item) => String(item.id) === String(detailRequestId)) || null

  const openDetails = (request) => {
    setDetailRequestId(request.id)
    setDetailModalOpen(true)
  }

  const openReview = (request, nextStatus = request.status === 'pending' ? 'approved' : request.status) => {
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
      <div>
        <h1 className="page-title">{canApprove ? 'Reimbursement Requests' : 'Reimbursements'}</h1>
        <p className="page-subtitle">
          {canApprove
            ? 'Review employee expense requests.'
            : 'Create a reimbursement request and track the approval status.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SimpleStat label="Pending" value={counts.pending} tone="border-amber-200 bg-amber-50 text-amber-800" />
        <SimpleStat
          label="Approved"
          value={counts.approved}
          tone="border-primary/20 bg-primary-light text-primary-dark"
        />
        <SimpleStat label="Rejected" value={counts.rejected} tone="border-red-200 bg-red-50 text-red-700" />
        <SimpleStat label="Total Amount" value={formatINR(counts.totalAmount)} tone="border-border bg-white text-foreground" />
      </div>

      {!canApprove && (
        <Card
          title="Create Request"
          subtitle="Click the button to apply for reimbursement."
          action={
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Create Request
            </button>
          }
        >
          <div className="rounded-xl border border-dashed border-border bg-neutral-50/70 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Apply for a reimbursement using the create button.</p>
            <p className="mt-1 text-xs text-muted">Your form will open in a popup.</p>
          </div>
        </Card>
      )}

      <Card
        title={canApprove ? 'Requests' : 'My Requests'}
        subtitle={canApprove ? 'Approve or reject employee submissions.' : 'See the latest status of your requests.'}
        toolbar={
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
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
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Nothing is available.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="divide-y divide-border">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(request)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openDetails(request)
                    }
                  }}
                  className="cursor-pointer p-4 transition hover:bg-neutral-50/70 focus:outline-none focus-visible:bg-neutral-50/70"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {canApprove ? request.employeeName : request.expenseType}
                        </p>
                        <Badge status={request.status} />
                        <span className="text-sm font-semibold text-primary">{formatINR(request.amount)}</span>
                      </div>

                      <p className="mt-1 text-sm text-muted">
                        {canApprove ? `${request.expenseType} · ` : ''}
                        {request.requestFor || request.employeeName} · {formatDate(request.expenseDate)} · Submitted{' '}
                        {formatDate(request.submittedAt)}
                      </p>

                      {request.comments && <p className="mt-2 text-sm text-foreground">{request.comments}</p>}

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span>{getDocumentSummary(request.supportingDocuments)}</span>
                        {(request.reviewedBy || request.reviewerComment) && (
                          <span>
                            {request.reviewedBy ? `Reviewed by ${request.reviewedBy}` : 'Reviewed by HR'}
                            {request.reviewedAt ? ` on ${formatDate(request.reviewedAt)}` : ''}
                            {request.reviewerComment ? ` · ${request.reviewerComment}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {canApprove && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openReview(request, 'approved')
                          }}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openReview(request, 'rejected')
                          }}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openReview(request)
                          }}
                          className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-neutral-50"
                        >
                          Update
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Reimbursement Request"
        subtitle="Fill the details below to apply for reimbursement."
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Request for">
              <input
                required
                value={form.requestFor}
                onChange={(e) => setForm({ ...form, requestFor: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
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
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </FormField>

            <FormField label="Expense Type">
              <select
                value={form.expenseType}
                onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
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
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </FormField>
          </div>

          <FormField label="Supporting Document(s)">
            <input
              type="file"
              multiple
              onChange={handleDocumentChange}
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-dark"
            />
            {form.supportingDocuments.length > 0 && (
              <p className="mt-2 text-xs text-muted">Attached: {form.supportingDocuments.join(', ')}</p>
            )}
          </FormField>

          <FormField label="Comments">
            <textarea
              rows={3}
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              placeholder="Add a short note"
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
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
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailModalOpen && Boolean(detailRequest)}
        onClose={() => setDetailModalOpen(false)}
        title="Reimbursement Details"
        subtitle="Full submitted information and attached documents."
        wide
      >
        {detailRequest && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={detailRequest.status} />
              <span className="text-base font-semibold text-primary">{formatINR(detailRequest.amount)}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {canApprove && <SimpleInfo label="Employee" value={detailRequest.employeeName} />}
              <SimpleInfo label="Request For" value={detailRequest.requestFor || detailRequest.employeeName} />
              <SimpleInfo label="Expense Type" value={detailRequest.expenseType} />
              <SimpleInfo label="Expense Date" value={formatDate(detailRequest.expenseDate)} />
              <SimpleInfo label="Submitted On" value={formatDate(detailRequest.submittedAt)} />
              <SimpleInfo label="Amount" value={formatINR(detailRequest.amount)} />
            </div>

            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Comments</p>
              <p className="mt-2 text-sm text-foreground">
                {detailRequest.comments || 'No comments added.'}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Supporting Documents</p>
              {(detailRequest.supportingDocuments || []).length > 0 ? (
                <div className="mt-3 space-y-2">
                  {detailRequest.supportingDocuments.map((doc) => (
                    <div
                      key={doc}
                      className="rounded-lg border border-border bg-neutral-50 px-3 py-2 text-sm text-foreground"
                    >
                      {doc}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">No supporting documents attached.</p>
              )}
            </div>

            {(detailRequest.reviewedBy || detailRequest.reviewerComment) && (
              <div className="rounded-xl border border-border bg-neutral-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">HR Review</p>
                <p className="mt-2 text-sm text-foreground">
                  {detailRequest.reviewedBy ? `Reviewed by ${detailRequest.reviewedBy}` : 'Reviewed by HR'}
                  {detailRequest.reviewedAt ? ` on ${formatDate(detailRequest.reviewedAt)}` : ''}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {detailRequest.reviewerComment || 'No review comment added.'}
                </p>
              </div>
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
        subtitle="Update the request status and add an HR comment."
        wide
      >
        {reviewingRequest && (
          <form onSubmit={handleReviewSave} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SimpleInfo label="Employee" value={reviewingRequest.employeeName} />
              <SimpleInfo label="Amount" value={formatINR(reviewingRequest.amount)} />
              <SimpleInfo label="Expense Type" value={reviewingRequest.expenseType} />
              <SimpleInfo label="Expense Date" value={formatDate(reviewingRequest.expenseDate)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Decision</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {['approved', 'rejected', 'pending'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReviewStatus(status)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      reviewStatus === status
                        ? 'bg-primary text-white'
                        : 'border border-border bg-white text-foreground hover:bg-neutral-50'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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
                className="mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
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

function SimpleStat({ label, value, tone }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

function SimpleInfo({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-neutral-50/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
