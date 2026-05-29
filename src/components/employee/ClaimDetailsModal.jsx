import { useState } from 'react'
import { CheckCircle2, Clock3, Eye, FileText, X, XCircle } from 'lucide-react'
import { formatINR } from '../../utils/currency'
import { normalizeSupportingDocuments } from '../../utils/receiptDocuments'
import DocumentPreviewModal from './DocumentPreviewModal'

function formatClaimDate(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_CONFIG = {
  pending: {
    label: 'PENDING',
    bannerClass: 'border-l-4 border-l-amber-400 bg-amber-50/90',
    iconWrap: 'bg-amber-100 text-amber-700',
    titleClass: 'text-amber-900',
    textClass: 'text-amber-800/90',
    valueClass: 'text-amber-800',
    reviewClass: 'border border-amber-200/90 bg-amber-50/80',
    reviewLabelClass: 'text-amber-800',
    Icon: Clock3,
    headline: 'Pending approval',
    defaultNote: 'Your claim is waiting for HR review. You will be notified once a decision is made.',
  },
  approved: {
    label: 'APPROVED',
    bannerClass: 'border-l-4 border-l-primary bg-primary-light/50',
    iconWrap: 'bg-primary-light text-primary-dark',
    titleClass: 'text-primary-dark',
    textClass: 'text-neutral-700',
    valueClass: 'text-primary-dark',
    reviewClass: 'border border-primary/25 bg-primary-light/40',
    reviewLabelClass: 'text-primary',
    Icon: CheckCircle2,
    headline: 'Claim approved',
    defaultNote: 'This reimbursement has been approved by HR.',
  },
  rejected: {
    label: 'REJECTED',
    bannerClass: 'border-l-4 border-l-red-400 bg-red-50/90',
    iconWrap: 'bg-red-100 text-red-600',
    titleClass: 'text-red-900',
    textClass: 'text-red-800/90',
    valueClass: 'text-red-700',
    reviewClass: 'border border-red-200/90 bg-red-50/80',
    reviewLabelClass: 'text-red-700',
    Icon: XCircle,
    headline: 'Claim rejected',
    defaultNote: 'This claim was not approved. See HR notes below for details.',
  },
}

function DetailField({ label, value, valueClassName = 'text-foreground' }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</p>
      <p className={`mt-1.5 text-sm font-medium leading-snug ${valueClassName}`}>{value}</p>
    </div>
  )
}

function StatusBanner({ status, amount }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = config.Icon

  return (
    <div className={`rounded-xl px-4 py-4 sm:px-5 ${config.bannerClass}`}>
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.iconWrap}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-bold uppercase tracking-wide ${config.titleClass}`}>
              {config.label}
            </p>
            <span className="text-sm font-semibold text-neutral-600">·</span>
            <p className="text-sm font-bold text-foreground">{formatINR(amount)}</p>
          </div>
          <p className={`mt-1 text-sm font-semibold ${config.titleClass}`}>{config.headline}</p>
          <p className={`mt-1 text-sm leading-relaxed ${config.textClass}`}>{config.defaultNote}</p>
        </div>
      </div>
    </div>
  )
}

function ReceiptRow({ document, onView }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
          <FileText className="h-4 w-4" />
        </span>
        <p className="truncate text-sm font-medium text-foreground">{document.name}</p>
      </div>
      <button
        type="button"
        onClick={() => onView(document)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </button>
    </li>
  )
}

export default function ClaimDetailsModal({ claim, open, onClose }) {
  const [previewDocument, setPreviewDocument] = useState(null)

  if (!open || !claim) return null

  const status = claim.status || 'pending'
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const documents = normalizeSupportingDocuments(claim.supportingDocuments)
  const reviewNote =
    claim.reviewerComment?.trim() ||
    (status === 'pending' ? null : config.defaultNote)

  const closeAll = () => {
    setPreviewDocument(null)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-neutral-900/45 backdrop-blur-[2px]"
          onClick={closeAll}
          aria-label="Close dialog backdrop"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-details-title"
          className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-neutral-900/10 ring-1 ring-neutral-200/80"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
            <div className="min-w-0 pr-2">
              <h2 id="claim-details-title" className="text-xl font-bold tracking-tight text-foreground">
                Claim details
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Submitted expense information and review status.
              </p>
            </div>
            <button
              type="button"
              onClick={closeAll}
              className="shrink-0 rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <StatusBanner status={status} amount={claim.amount} />

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <DetailField label="Category" value={claim.expenseType || '—'} />
              <DetailField
                label="Amount"
                value={formatINR(claim.amount)}
                valueClassName="text-base font-semibold text-primary"
              />
              <DetailField label="Expense date" value={formatClaimDate(claim.expenseDate)} />
              <DetailField label="Submitted" value={formatClaimDate(claim.submittedAt)} />
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-6">
              <DetailField
                label="Status"
                value={config.label}
                valueClassName={`text-sm font-bold uppercase tracking-wide ${config.valueClass}`}
              />
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-6">
              <DetailField label="Description" value={claim.comments?.trim() || '—'} />
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Receipts
              </p>
              {documents.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {documents.map((doc) => (
                    <ReceiptRow key={doc.name} document={doc} onView={setPreviewDocument} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-500">
                  No documents attached.
                </p>
              )}
            </div>

            <div className={`mt-6 rounded-xl px-4 py-4 ${config.reviewClass}`}>
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.16em] ${config.reviewLabelClass}`}
              >
                HR review
              </p>
              {claim.reviewedBy ? (
                <p className="mt-1 text-xs text-neutral-600">
                  Reviewed by {claim.reviewedBy}
                  {claim.reviewedAt ? ` · ${formatClaimDate(claim.reviewedAt)}` : ''}
                </p>
              ) : status === 'pending' ? (
                <p className="mt-1 text-xs text-neutral-600">Awaiting reviewer</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {reviewNote || config.defaultNote}
              </p>
            </div>
          </div>

          <footer className="flex shrink-0 justify-end border-t border-neutral-100 bg-neutral-50/40 px-6 py-4">
            <button
              type="button"
              onClick={closeAll}
              className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-neutral-50"
            >
              Close
            </button>
          </footer>
        </div>
      </div>

      <DocumentPreviewModal
        document={previewDocument}
        open={Boolean(previewDocument)}
        onClose={() => setPreviewDocument(null)}
      />
    </>
  )
}

/** Status pill for tables — matches summary card accents */
export function ClaimStatusBadge({ status }) {
  const normalized = status || 'pending'
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.pending

  const pillClass = {
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    approved: 'border-primary/25 bg-primary-light text-primary-dark',
    rejected: 'border-red-200 bg-red-50 text-red-700',
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pillClass[normalized] || pillClass.pending}`}
    >
      {config.label}
    </span>
  )
}
