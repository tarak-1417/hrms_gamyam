import { Plus, Trash2, GripVertical } from 'lucide-react'
import {
  STANDARD_FIELD_LIBRARY,
  FIELD_TYPES,
  FIELD_SOURCES,
  slugifyFieldKey,
  extractPlaceholdersFromBody,
  fieldFromKey,
} from '../../utils/documentTemplateUtils'

export default function TemplateFieldBuilder({ fields, body, onChange }) {
  const addFromLibrary = (libField) => {
    if (fields.some((f) => f.key === libField.key)) return
    onChange([...fields, { ...libField }])
  }

  const addCustomField = () => {
    const label = 'New field'
    const key = slugifyFieldKey(`${label}_${fields.length + 1}`)
    onChange([
      ...fields,
      { key, label, type: 'text', source: 'custom', defaultValue: '', required: false },
    ])
  }

  const syncFromBody = () => {
    const keys = extractPlaceholdersFromBody(body)
    const merged = [...fields]
    keys.forEach((key) => {
      if (!merged.some((f) => f.key === key)) {
        merged.push(fieldFromKey(key))
      }
    })
    onChange(merged)
  }

  const updateField = (index, patch) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f))
    if (patch.label && patch.key === undefined) {
      const autoKey = slugifyFieldKey(patch.label)
      if (autoKey && !fields.some((f, j) => j !== index && f.key === autoKey)) {
        next[index].key = autoKey
      }
    }
    onChange(next)
  }

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Template fields</p>
        <p className="mt-0.5 text-xs text-muted">
          Define placeholders for this letter. Use{' '}
          <code className="rounded bg-neutral-100 px-1">{'{{field_key}}'}</code> in the body text.
        </p>
        <button
          type="button"
          onClick={syncFromBody}
          className="mt-2 text-xs font-medium text-primary hover:text-primary-dark"
        >
          Sync fields from letter body
        </button>
      </div>

      <div className="rounded-lg border border-border bg-neutral-50/50 p-3">
        <p className="mb-2 text-xs font-medium text-muted">Quick add (standard fields)</p>
        <div className="flex flex-wrap gap-1.5">
          {STANDARD_FIELD_LIBRARY.map((lib) => {
            const added = fields.some((f) => f.key === lib.key)
            return (
              <button
                key={lib.key}
                type="button"
                disabled={added}
                onClick={() => addFromLibrary(lib)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  added
                    ? 'cursor-not-allowed bg-neutral-200 text-neutral-500'
                    : 'bg-white text-foreground ring-1 ring-border hover:bg-primary-light hover:text-primary-dark'
                }`}
              >
                {lib.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted">
            No fields yet. Add from the list above or create a custom field.
          </p>
        ) : (
          fields.map((field, index) => (
            <div
              key={`${field.key}-${index}`}
              className="rounded-xl border border-border bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <GripVertical className="h-3.5 w-3.5" />
                  <code className="rounded bg-primary-light px-1.5 py-0.5 font-mono text-[10px] text-primary-dark">
                    {`{{${field.key}}}`}
                  </code>
                </span>
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove field"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-medium uppercase text-muted">Label</label>
                  <input
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-muted">Field key</label>
                  <input
                    value={field.key}
                    onChange={(e) =>
                      updateField(index, { key: slugifyFieldKey(e.target.value) || field.key })
                    }
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-muted">Input type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-muted">Fill from</label>
                  <select
                    value={field.source}
                    onChange={(e) => updateField(index, { source: e.target.value })}
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                  >
                    {FIELD_SOURCES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(field.source === 'custom' || field.defaultValue) && (
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-medium uppercase text-muted">
                      Default value (optional)
                    </label>
                    <input
                      value={field.defaultValue ?? ''}
                      onChange={(e) => updateField(index, { defaultValue: e.target.value })}
                      placeholder="e.g. 3 months, 30 days"
                      className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={addCustomField}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 py-2.5 text-sm font-medium text-primary hover:bg-primary-light/50"
      >
        <Plus className="h-4 w-4" />
        Add custom field
      </button>
    </div>
  )
}
