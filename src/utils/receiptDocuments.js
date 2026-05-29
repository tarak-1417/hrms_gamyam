/** Demo PDF used when only a filename was stored (seed / legacy claims). */
export const DEMO_RECEIPT_PDF_URL =
  'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

export function getFileExtension(name = '') {
  const parts = String(name).toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() : ''
}

export function guessMimeType(name = '', mimeType = '') {
  if (mimeType) return mimeType
  const ext = getFileExtension(name)
  if (ext === 'pdf') return 'application/pdf'
  if (IMAGE_EXT.has(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`
  return 'application/octet-stream'
}

export function normalizeSupportingDocument(doc) {
  if (!doc) return null
  if (typeof doc === 'string') {
    const name = doc.trim()
    if (!name) return null
    return { name, url: null, mimeType: guessMimeType(name) }
  }
  const name = doc.name?.trim() || 'Document'
  return {
    name,
    url: doc.url || null,
    mimeType: guessMimeType(name, doc.mimeType),
  }
}

export function normalizeSupportingDocuments(documents = []) {
  return (documents || []).map(normalizeSupportingDocument).filter(Boolean)
}

export function isImageMime(mimeType) {
  return String(mimeType || '').startsWith('image/')
}

export function isPdfMime(mimeType, name = '') {
  return mimeType === 'application/pdf' || getFileExtension(name) === 'pdf'
}

export function getPreviewSource(document) {
  const normalized = normalizeSupportingDocument(document)
  if (!normalized) return null
  if (normalized.url) return { ...normalized, isDemo: false }
  if (isPdfMime(normalized.mimeType, normalized.name)) {
    return { ...normalized, url: DEMO_RECEIPT_PDF_URL, isDemo: true }
  }
  return { ...normalized, url: null, isDemo: true }
}

export async function readFilesAsDocuments(fileList) {
  const files = Array.from(fileList || [])
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () =>
            resolve({
              name: file.name,
              url: reader.result,
              mimeType: file.type || guessMimeType(file.name),
            })
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        }),
    ),
  )
}
