import { useEffect, useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import Modal from '../ui/Modal'
import DocumentPreview from './DocumentPreview'
import {
  normalizeTemplate,
  getDefaultFieldValues,
  renderTemplate,
  sourceLabel,
} from '../../utils/documentTemplateUtils'

export default function GenerateDocumentModal({
  open,
  onClose,
  template,
  employees,
  orgContext,
  onGenerated,
}) {
  const [employeeId, setEmployeeId] = useState('')
  const [fieldValues, setFieldValues] = useState({})

  const normalized = template ? normalizeTemplate(template) : null
  const selected = employees.find((e) => e.id === employeeId)
  const fields = normalized?.fields ?? []

  useEffect(() => {
    if (!open || !template) return
    const emp = employees[0]
    setEmployeeId(emp?.id ?? '')
    setFieldValues(getDefaultFieldValues(template, emp, orgContext))
  }, [open, template, employees, orgContext])

  useEffect(() => {
    if (!selected || !template) return
    setFieldValues(getDefaultFieldValues(template, selected, orgContext))
  }, [employeeId, selected, template, orgContext])

  const mergeData = useMemo(() => fieldValues, [fieldValues])
  const content = template ? renderTemplate(template.body, mergeData) : ''

  const setField = (key, value) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }))
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(
      `<html><head><title>${template?.title ?? 'Document'}</title></head><body style="font-family:system-ui;padding:2rem;white-space:pre-wrap;line-height:1.6">${content.replace(/</g, '&lt;')}</body></html>`,
    )
    win.document.close()
    win.print()
  }

  const handleSave = () => {
    if (!template || !selected) return
    onGenerated?.({
      templateId: template.id,
      templateTitle: template.title,
      employeeId: selected.id,
      employeeName: selected.name,
    })
    onClose()
  }

  if (!template) return null

  return (
    <Modal open={open} onClose={onClose} title={`Generate — ${template.title}`} wide>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Employee</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} · {emp.id} · {emp.department}
              </option>
            ))}
          </select>
        </div>

        {fields.length > 0 && (
          <div className="rounded-xl border border-border bg-neutral-50/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Document fields
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="flex items-baseline justify-between gap-2 text-sm font-medium text-foreground">
                    <span>{field.label}</span>
                    <span className="text-[10px] font-normal text-muted">
                      {sourceLabel(field.source)}
                    </span>
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={fieldValues[field.key] ?? ''}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                      value={fieldValues[field.key] ?? ''}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DocumentPreview content={content} title={template.title} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!employeeId}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!employeeId}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Save to records
          </button>
        </div>
      </div>
    </Modal>
  )
}
