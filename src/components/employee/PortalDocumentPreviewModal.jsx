import { Download, ExternalLink, FileText, X } from 'lucide-react'
import DocumentPreview from '../documents/DocumentPreview'
import { getPortalDocumentPreview } from '../../utils/employeePortalDocuments'

export default function PortalDocumentPreviewModal({ document, open, onClose, onDownload }) {
  if (!open || !document) return null

  const preview = getPortalDocumentPreview(document)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close preview"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200/80"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-foreground">{document.name}</h2>
              <p className="text-xs text-neutral-500">{document.category}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onDownload ? (
              <button
                type="button"
                onClick={() => onDownload(document)}
                className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100"
                aria-label="Download"
              >
                <Download className="h-5 w-5" />
              </button>
            ) : null}
            {preview?.mode === 'pdf' && preview.url ? (
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100"
                aria-label="Open in new tab"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50/50 p-4 sm:p-5">
          {preview?.mode === 'text' ? (
            <DocumentPreview content={preview.content} title={document.name} />
          ) : preview?.mode === 'pdf' ? (
            <>
              {preview.isDemo ? (
                <p className="mb-3 rounded-lg border border-primary/20 bg-primary-light/40 px-3 py-2 text-xs text-primary-dark">
                  Sample PDF preview. Download saves/opens the document file.
                </p>
              ) : null}
              <iframe
                title={preview.name}
                src={preview.url}
                className="h-[min(65vh,520px)] w-full rounded-xl border border-neutral-200 bg-white"
              />
            </>
          ) : preview?.mode === 'image' ? (
            <div className="flex justify-center">
              <img
                src={preview.url}
                alt={preview.name}
                className="max-h-[min(65vh,520px)] rounded-xl object-contain shadow-md"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">Preview not available</p>
              <p className="mt-1 text-sm text-neutral-500">Use download to access this file.</p>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-neutral-100 bg-white px-5 py-3 sm:px-6">
          {onDownload ? (
            <button
              type="button"
              onClick={() => onDownload(document)}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-neutral-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-neutral-50"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
