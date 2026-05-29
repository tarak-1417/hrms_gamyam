import { Download, ExternalLink, FileText, X } from 'lucide-react'
import { getPreviewSource, isImageMime, isPdfMime } from '../../utils/receiptDocuments'

export default function DocumentPreviewModal({ document, open, onClose }) {
  if (!open || !document) return null

  const preview = getPreviewSource(document)
  if (!preview) return null

  const showImage = Boolean(preview.url && isImageMime(preview.mimeType))
  const showPdf = Boolean(preview.url && isPdfMime(preview.mimeType, preview.name))
  const canDownload = Boolean(document.url && !preview.isDemo)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close preview"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-preview-title"
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200/80"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="document-preview-title" className="truncate text-base font-bold text-foreground">
                {preview.name}
              </h2>
              {preview.isDemo ? (
                <p className="text-xs text-neutral-500">Sample preview — upload on new claims for your file</p>
              ) : (
                <p className="text-xs text-neutral-500">Receipt preview</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canDownload ? (
              <a
                href={document.url}
                download={preview.name}
                className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100"
                aria-label="Download"
              >
                <Download className="h-5 w-5" />
              </a>
            ) : null}
            {preview.url ? (
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

        <div className="min-h-0 flex-1 overflow-hidden bg-neutral-100">
          {!preview.url ? (
            <div className="flex h-[min(70vh,520px)] flex-col items-center justify-center px-6 text-center">
              <FileText className="h-12 w-12 text-neutral-400" />
              <p className="mt-4 text-sm font-medium text-foreground">Preview not available</p>
              <p className="mt-1 max-w-sm text-sm text-neutral-500">
                This file was saved by name only. Re-upload the receipt on a new claim to preview it here.
              </p>
            </div>
          ) : showImage ? (
            <div className="flex h-[min(70vh,520px)] items-center justify-center overflow-auto p-4">
              <img
                src={preview.url}
                alt={preview.name}
                className="max-h-full max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          ) : showPdf ? (
            <iframe
              title={preview.name}
              src={preview.url}
              className="h-[min(70vh,520px)] w-full bg-white"
            />
          ) : (
            <div className="flex h-[min(70vh,520px)] flex-col items-center justify-center px-6 text-center">
              <p className="text-sm text-neutral-600">This file type cannot be previewed in the browser.</p>
              {preview.url ? (
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open file
                </a>
              ) : null}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 justify-end border-t border-neutral-100 bg-white px-5 py-3 sm:px-6">
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
