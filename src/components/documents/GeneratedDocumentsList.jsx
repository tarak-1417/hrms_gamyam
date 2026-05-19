import { FileCheck } from 'lucide-react'

export default function GeneratedDocumentsList({ items }) {
  if (!items?.length) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-neutral-50/50 px-4 py-6 text-center text-sm text-muted">
        No documents generated this session yet.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-white">
      {items.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
            <FileCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{doc.templateTitle}</p>
            <p className="text-xs text-muted">
              {doc.employeeName} · {doc.generatedAt}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
