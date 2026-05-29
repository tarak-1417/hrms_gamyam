import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  CloudUpload,
  Coins,
  Eye,
  History,
  Trash2,
  XCircle,
} from 'lucide-react'
import ClaimDetailsModal, { ClaimStatusBadge } from '../../components/employee/ClaimDetailsModal'
import { readFilesAsDocuments } from '../../utils/receiptDocuments'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { formatINR } from '../../utils/currency'
import { todayDate } from '../../utils/timeUtils'

const EXPENSE_CATEGORIES = [
  'Travel',
  'Food & Beverages',
  'Office Supplies',
  'Training',
  'Accommodation',
  'Internet',
  'Medical',
  'Other',
]

function formatClaimDate(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function emptyClaimForm() {
  return {
    expenseType: '',
    amount: '',
    comments: '',
    supportingDocuments: [],
  }
}

function sumByStatus(requests, status) {
  return requests
    .filter((item) => item.status === status)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
}

export default function EmployeeReimbursements() {
  const { user } = useAuth()
  const { reimbursementRequests = [], submitReimbursement, deleteReimbursement } = useHrms()
  const [form, setForm] = useState(emptyClaimForm)
  const [detailRequest, setDetailRequest] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const myClaims = useMemo(() => {
    return reimbursementRequests
      .filter((item) => item.employeeId === user?.employeeId)
      .sort((a, b) => `${b.submittedAt || ''}-${b.id}`.localeCompare(`${a.submittedAt || ''}-${a.id}`))
  }, [reimbursementRequests, user?.employeeId])

  const totals = useMemo(
    () => ({
      pending: sumByStatus(myClaims, 'pending'),
      approved: sumByStatus(myClaims, 'approved'),
      rejected: sumByStatus(myClaims, 'rejected'),
    }),
    [myClaims],
  )

  const handleDocumentChange = async (event) => {
    const files = event.target.files
    if (!files?.length) return
    try {
      const documents = await readFilesAsDocuments(files)
      setForm((current) => ({ ...current, supportingDocuments: documents }))
    } catch {
      setForm((current) => ({
        ...current,
        supportingDocuments: Array.from(files).map((file) => ({ name: file.name, url: null })),
      }))
    }
    event.target.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.expenseType || !form.amount) return

    setSubmitting(true)
    submitReimbursement({
      employeeId: user?.employeeId,
      employeeName: user?.name,
      requestFor: user?.name,
      amount: Number(form.amount),
      expenseType: form.expenseType,
      expenseDate: todayDate(),
      supportingDocuments: form.supportingDocuments,
      comments: form.comments.trim(),
    })
    setForm(emptyClaimForm())
    setSubmitting(false)
  }

  const handleDelete = (request) => {
    if (request.status !== 'pending') return
    if (!window.confirm('Remove this pending claim?')) return
    deleteReimbursement(request.id, user?.employeeId)
  }

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Expenses &amp; Claims
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          Submit receipts and track the status of your reimbursements.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <AmountSummaryCard
          label="Pending"
          amount={totals.pending}
          icon={Clock3}
          tone="border-neutral-200/90 border-l-4 border-l-amber-400 bg-white"
          iconTone="bg-amber-100 text-amber-700"
        />
        <AmountSummaryCard
          label="Approved"
          amount={totals.approved}
          icon={CheckCircle2}
          tone="border-neutral-200/90 border-l-4 border-l-primary bg-white"
          iconTone="bg-primary-light text-primary-dark"
        />
        <AmountSummaryCard
          label="Rejected"
          amount={totals.rejected}
          icon={XCircle}
          tone="border-neutral-200/90 border-l-4 border-l-red-400 bg-white"
          iconTone="bg-red-50 text-red-500"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,380px)_1fr]">
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Coins className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="text-lg font-bold text-foreground">New Claim</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Expense Category">
              <select
                required
                value={form.expenseType}
                onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
                className={inputClass}
              >
                <option value="" disabled>
                  Choose category
                </option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Amount (₹)">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                  ₹
                </span>
                <input
                  required
                  min="1"
                  step="0.01"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </Field>

            <Field label="Description">
              <textarea
                rows={4}
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                placeholder="Briefly describe the expense..."
                className={inputClass}
              />
            </Field>

            <Field label="Receipt Document">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center transition hover:border-primary/40 hover:bg-primary-light/20">
                <CloudUpload className="h-8 w-8 text-neutral-400" strokeWidth={1.75} />
                <span className="mt-3 text-sm font-medium text-foreground">
                  Click or drag file here
                </span>
                <span className="mt-1 text-xs text-neutral-500">PDF, JPG, PNG up to 5MB</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentChange}
                  className="sr-only"
                />
              </label>
              {form.supportingDocuments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {form.supportingDocuments.map((doc) => (
                    <li key={doc.name} className="truncate text-xs text-neutral-600">
                      {doc.name}
                      {doc.url ? ' · ready to preview' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
            >
              Submit Claim
            </button>
          </form>
        </section>

        <section className="min-w-0 rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <History className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="text-lg font-bold text-foreground">Recent Claims</h2>
          </div>

          {myClaims.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">No claims yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                Submit your first expense using the form on the left.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/80 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <th className="px-6 py-3.5">Details</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {myClaims.map((claim) => (
                    <tr key={claim.id} className="transition hover:bg-neutral-50/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{claim.expenseType}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {formatClaimDate(claim.expenseDate || claim.submittedAt)}
                        </p>
                        {claim.comments ? (
                          <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{claim.comments}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 font-semibold tabular-nums text-foreground">
                        {formatINR(claim.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <ClaimStatusBadge status={claim.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailRequest(claim)}
                            className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-foreground"
                            aria-label="View claim"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {claim.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(claim)}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                              aria-label="Delete claim"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ClaimDetailsModal
        claim={detailRequest}
        open={Boolean(detailRequest)}
        onClose={() => setDetailRequest(null)}
      />
    </div>
  )
}

function AmountSummaryCard({ label, amount, icon: Icon, tone, iconTone }) {
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground sm:text-[1.75rem]">
            {formatINR(amount)}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15'
