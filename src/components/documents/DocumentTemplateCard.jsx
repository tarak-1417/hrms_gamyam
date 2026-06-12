import { FileText, Eye, PenLine, Pencil, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge'
import { categoryLabel, normalizeTemplate } from '../../utils/documentTemplateUtils'

// All templates share the offer-letter (hiring) accent for a consistent look.
const ACCENT = 'border-l-primary bg-primary-light/30'

export default function DocumentTemplateCard({
  template,
  onPreview,
  onGenerate,
  onEdit,
  onDelete,
  canManage = false,
}) {
  const accent = ACCENT
  const fieldCount = normalizeTemplate(template).fields?.length ?? 0

  return (
    <article
      className={`flex flex-col rounded-2xl border border-neutral-200 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${accent}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge status="active">{categoryLabel(template.category)}</Badge>
          <span className="text-[10px] text-muted">{fieldCount} fields</span>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-foreground">{template.title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{template.description}</p>
      <p className="mt-2 text-[10px] text-muted">Updated {template.updatedAt}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPreview(template)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-neutral-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => onGenerate(template)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          <PenLine className="h-3.5 w-3.5" />
          Generate
        </button>
      </div>

      {canManage && (
        <div className="mt-2 flex gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => onEdit?.(template)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-muted hover:bg-neutral-50 hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit fields
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(template)}
            className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </article>
  )
}
