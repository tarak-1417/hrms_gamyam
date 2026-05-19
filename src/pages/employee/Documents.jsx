import { FileText, Download } from 'lucide-react'

const docs = [
  { name: 'Employment Contract.pdf', date: '2022-03-15', size: '245 KB' },
  { name: 'Offer Letter.pdf', date: '2022-03-10', size: '128 KB' },
  { name: 'Tax Declaration 2026.pdf', date: '2026-04-01', size: '89 KB' },
]

export default function Documents() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Documents</h1>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface-elevated">
        {docs.map((doc) => (
          <li key={doc.name} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">{doc.name}</p>
                <p className="text-xs text-muted">{doc.date} · {doc.size}</p>
              </div>
            </div>
            <button type="button" className="rounded-lg p-2 text-primary hover:bg-primary-light">
              <Download className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
