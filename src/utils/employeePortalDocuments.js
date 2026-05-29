import { DEMO_RECEIPT_PDF_URL, getPreviewSource, guessMimeType } from './receiptDocuments'

export function formatDocumentSize(bytesOrLabel) {
  if (typeof bytesOrLabel === 'string') return bytesOrLabel
  if (!bytesOrLabel || bytesOrLabel < 1024) return `${bytesOrLabel || 0} B`
  if (bytesOrLabel < 1024 * 1024) return `${Math.max(1, Math.round(bytesOrLabel / 1024))} KB`
  return `${(bytesOrLabel / (1024 * 1024)).toFixed(1)} MB`
}

export function buildEmployeePortalDocuments({
  employeeId,
  employeeDocuments = [],
  generatedDocuments = [],
}) {
  if (!employeeId) return []

  const issued = (employeeDocuments || [])
    .filter((doc) => doc.employeeId === employeeId)
    .map((doc) => ({
      id: doc.id,
      name: doc.name,
      date: doc.date,
      size: doc.size || '—',
      category: doc.category || 'General',
      type: 'pdf',
      content: null,
      url: doc.url || null,
      mimeType: guessMimeType(doc.name),
    }))

  const generated = (generatedDocuments || [])
    .filter((doc) => doc.employeeId === employeeId)
    .map((doc) => ({
      id: `generated-${doc.id}`,
      name: doc.templateTitle ? `${doc.templateTitle}.txt` : 'Generated document.txt',
      date: doc.generatedAt,
      size: formatDocumentSize(doc.content?.length || 0),
      category: 'HR generated',
      type: 'text',
      content: doc.content || '',
      url: null,
      mimeType: 'text/plain',
    }))

  return [...issued, ...generated].sort((a, b) => `${b.date || ''}`.localeCompare(`${a.date || ''}`))
}

export function getPortalDocumentPreview(doc) {
  if (!doc) return null
  if (doc.type === 'text' && doc.content) {
    return { mode: 'text', name: doc.name, content: doc.content }
  }
  const source = getPreviewSource({
    name: doc.name,
    url: doc.url,
    mimeType: doc.mimeType || guessMimeType(doc.name),
  })
  if (!source?.url) return { mode: 'unavailable', name: doc.name }
  return {
    mode: source.mimeType?.startsWith('image/') ? 'image' : 'pdf',
    name: source.name,
    url: source.url,
    isDemo: source.isDemo,
  }
}

function triggerBrowserDownload(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** Download portal document (text content or PDF URL). */
export function downloadPortalDocument(doc) {
  if (!doc) return

  if (doc.type === 'text' && doc.content) {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    triggerBrowserDownload(objectUrl, doc.name.endsWith('.txt') ? doc.name : `${doc.name}.txt`)
    URL.revokeObjectURL(objectUrl)
    return
  }

  const preview = getPreviewSource({
    name: doc.name,
    url: doc.url,
    mimeType: doc.mimeType || guessMimeType(doc.name),
  })

  if (preview?.url) {
    if (doc.url && !preview.isDemo) {
      triggerBrowserDownload(preview.url, doc.name)
    } else {
      window.open(preview.url, '_blank', 'noopener,noreferrer')
    }
  }
}

export const DEFAULT_EMPLOYEE_PDF_PREVIEW = DEMO_RECEIPT_PDF_URL
