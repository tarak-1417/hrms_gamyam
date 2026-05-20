import { useState } from 'react'
import { FileCheck, Eye, Download, Share2 } from 'lucide-react'
import { useHrms } from '../../hooks/useHrms'
import {
  downloadGeneratedDocument,
  shareGeneratedDocument,
} from '../../utils/documentTemplateUtils'
import GeneratedDocumentDetailModal from './GeneratedDocumentDetailModal'

export default function GeneratedDocumentsList({ items }) {
  const { showToast } = useHrms()
  const [detailDoc, setDetailDoc] = useState(null)

  const handleShare = async (doc) => {
    const result = await shareGeneratedDocument(doc)
    if (result === 'shared') showToast('Document shared')
    else if (result === 'copied') showToast('Document text copied to clipboard')
    else if (result === 'cancelled') return
    else showToast('Sharing is not supported in this browser')
  }

  const handleDownload = (doc) => {
    downloadGeneratedDocument(doc)
    showToast('Download started')
  }

  if (!items?.length) {
    return (
      <p className="max-w-xl rounded-xl border border-dashed border-border bg-neutral-50/50 px-4 py-6 text-center text-sm text-muted">
        No documents generated this session yet.
      </p>
    )
  }

  return (
    <>
      <ul className="grid max-w-3xl grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {items.map((doc) => (
          <li
            key={doc.id}
            className="flex flex-col rounded-xl border border-border bg-white p-3 shadow-sm transition hover:border-primary/25 hover:shadow-md"
          >
            <div className="flex gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {doc.templateTitle}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {doc.employeeName}
                </p>
                <p className="text-[11px] text-muted">{doc.generatedAt}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/80 pt-3">
              <ActionChip label="Details" icon={Eye} onClick={() => setDetailDoc(doc)} />
              <ActionChip
                label="Download"
                icon={Download}
                onClick={() => handleDownload(doc)}
              />
              <ActionChip label="Share" icon={Share2} onClick={() => handleShare(doc)} />
            </div>
          </li>
        ))}
      </ul>

      <GeneratedDocumentDetailModal
        open={Boolean(detailDoc)}
        onClose={() => setDetailDoc(null)}
        document={detailDoc}
        onShareResult={(result) => {
          if (result === 'shared') showToast('Document shared')
          else if (result === 'copied') showToast('Document text copied to clipboard')
        }}
      />
    </>
  )
}

function ActionChip({ label, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary-light hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      {label}
    </button>
  )
}
