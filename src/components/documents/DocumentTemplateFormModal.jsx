import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import TemplateFieldBuilder from './TemplateFieldBuilder'
import DocumentPreview from './DocumentPreview'
import {
  TEMPLATE_CATEGORIES,
  EMPTY_TEMPLATE_FORM,
  normalizeTemplate,
  renderTemplate,
  buildMergeData,
  extractPlaceholdersFromBody,
} from '../../utils/documentTemplateUtils'

const OFFER_LETTER_STARTER = `GAMYAM TECHNOLOGIES PVT. LTD.
{{work_location}}

Date: {{letter_date}}

Dear {{employee_name}},

We are pleased to offer you the position of {{role}} in our {{department}} department.

Date of joining: {{join_date}}
Annual CTC: {{annual_ctc}}
Probation period: {{probation_period}}
Notice period: {{notice_period}}
Offer valid until: {{offer_validity}}
Reporting to: {{reporting_manager}}

We look forward to welcoming you.

Sincerely,
{{hr_signatory}}
Human Resources`

export default function DocumentTemplateFormModal({
  open,
  onClose,
  template,
  onSave,
  sampleEmployee,
  orgContext,
}) {
  const isEdit = Boolean(template?.id)
  const [form, setForm] = useState(EMPTY_TEMPLATE_FORM)
  const [tab, setTab] = useState('details')

  useEffect(() => {
    if (!open) return
    if (template) {
      const normalized = normalizeTemplate(template)
      setForm({
        title: normalized.title,
        category: normalized.category,
        description: normalized.description,
        body: normalized.body,
        fields: normalized.fields ?? [],
      })
    } else {
      setForm({
        ...EMPTY_TEMPLATE_FORM,
        title: 'Offer Letter',
        description: 'Job offer with compensation and joining details.',
        body: OFFER_LETTER_STARTER,
        fields: [
          { key: 'employee_name', label: 'Employee name', type: 'text', source: 'employee' },
          { key: 'role', label: 'Job title / role', type: 'text', source: 'employee' },
          { key: 'department', label: 'Department', type: 'text', source: 'employee' },
          { key: 'join_date', label: 'Joining date', type: 'date', source: 'employee' },
          { key: 'annual_ctc', label: 'Annual CTC', type: 'text', source: 'employee' },
          { key: 'probation_period', label: 'Probation period', type: 'text', source: 'custom', defaultValue: '3 months' },
          { key: 'notice_period', label: 'Notice period', type: 'text', source: 'custom', defaultValue: '30 days' },
          { key: 'offer_validity', label: 'Offer validity', type: 'text', source: 'custom', defaultValue: '7 days' },
        ],
      })
    }
    setTab('details')
  }, [open, template])

  const previewContent = useMemo(() => {
    const data = buildMergeData(sampleEmployee, {}, orgContext)
    form.fields.forEach((f) => {
      if (f.defaultValue && !data[f.key]) data[f.key] = f.defaultValue
    })
    return renderTemplate(form.body, data)
  }, [form.body, form.fields, sampleEmployee, orgContext])

  const insertPlaceholder = (key) => {
    const token = `{{${key}}}`
    setForm((prev) => ({
      ...prev,
      body: prev.body ? `${prev.body}\n${token}` : token,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const keysInBody = extractPlaceholdersFromBody(form.body)
    const fieldKeys = form.fields.map((f) => f.key)
    const missing = keysInBody.filter((k) => !fieldKeys.includes(k))
    const fields =
      missing.length > 0
        ? [
            ...form.fields,
            ...missing.map((key) => ({
              key,
              label: key.replace(/_/g, ' '),
              type: 'text',
              source: 'custom',
            })),
          ]
        : form.fields

    onSave({
      ...(isEdit ? { id: template.id } : {}),
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      body: form.body,
      fields,
    })
    onClose()
  }

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'fields', label: 'Fields' },
    { id: 'body', label: 'Letter body' },
    { id: 'preview', label: 'Preview' },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${template?.title}` : 'Create document template'}
      xl
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                tab === t.id ? 'bg-primary text-white' : 'text-muted hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'details' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Template name</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Offer Letter"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {TEMPLATE_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="When to use this template…"
              />
            </div>
          </div>
        )}

        {tab === 'fields' && (
          <TemplateFieldBuilder
            fields={form.fields}
            body={form.body}
            onChange={(fields) => setForm({ ...form, fields })}
          />
        )}

        {tab === 'body' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Insert placeholder:</span>
              {form.fields.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => insertPlaceholder(f.key)}
                  className="rounded-full bg-primary-light px-2 py-0.5 font-mono text-[10px] text-primary-dark hover:bg-primary/20"
                >
                  {`{{${f.key}}}`}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={14}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 font-mono text-sm leading-relaxed"
              placeholder="Letter content with {{placeholders}}…"
            />
          </div>
        )}

        {tab === 'preview' && (
          <DocumentPreview content={previewContent} title={form.title || 'Preview'} />
        )}

        <div className="flex gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {isEdit ? 'Save template' : 'Create template'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
