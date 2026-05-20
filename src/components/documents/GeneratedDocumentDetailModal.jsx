import { Download, Share2 } from 'lucide-react'
import Modal from '../ui/Modal'
import DocumentPreview from './DocumentPreview'
import { downloadGeneratedDocument, shareGeneratedDocument } from '../../utils/documentTemplateUtils'
import { formatDisplayDate } from '../../utils/timeUtils'

export default function GeneratedDocumentDetailModal({
  open,
  onClose,
  document: doc,
  onShareResult,
}) {
  if (!doc) return null

  const handleDownload = () => {
    downloadGeneratedDocument(doc)
  }

  const handleShare = async () => {
    const result = await shareGeneratedDocument(doc)
    onShareResult?.(result)
  }

  return (
    <Modal open={open} onClose={onClose} title={doc.templateTitle} wide>
      <div className="space-y-4">
        <dl className="grid gap-3 rounded-xl border border-border bg-neutral-50/50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Employee</dt>
            <dd className="mt-0.5 font-medium text-foreground">{doc.employeeName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Employee ID</dt>
            <dd className="mt-0.5 font-medium text-foreground">{doc.employeeId}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Generated on</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatDisplayDate(doc.generatedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Template ID</dt>
            <dd className="mt-0.5 font-medium text-foreground">#{doc.templateId}</dd>
          </div>
        </dl>

        {doc.content ? (
          <DocumentPreview content={doc.content} title={doc.templateTitle} />
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Document body was not stored for this record. Generate again to capture full content.
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark sm:flex-none"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50 sm:flex-none"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </Modal>
  )
}
