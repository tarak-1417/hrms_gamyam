import { useMemo, useState } from 'react'
import { FileStack, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import DocumentTemplateCard from '../../components/documents/DocumentTemplateCard'
import DocumentPreviewModal from '../../components/documents/DocumentPreviewModal'
import GenerateDocumentModal from '../../components/documents/GenerateDocumentModal'
import DocumentTemplateFormModal from '../../components/documents/DocumentTemplateFormModal'
import GeneratedDocumentsList from '../../components/documents/GeneratedDocumentsList'
import { TEMPLATE_CATEGORIES, normalizeTemplate } from '../../utils/documentTemplateUtils'

export default function DocumentTemplates() {
  const { user } = useAuth()
  const {
    documentTemplates = [],
    generatedDocuments = [],
    employees,
    recordGeneratedDocument,
    addDocumentTemplate,
    updateDocumentTemplate,
    deleteDocumentTemplate,
    orgContext,
  } = useHrms()

  const canManage = user?.role === 'admin' || user?.role === 'superadmin'
  const isSuperAdmin = user?.role === 'superadmin'

  const [category, setCategory] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [generateTemplate, setGenerateTemplate] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const sampleEmployee = employees[0]

  const normalizedTemplates = useMemo(
    () => documentTemplates.map(normalizeTemplate),
    [documentTemplates],
  )

  const filtered = useMemo(() => {
    if (category === 'all') return normalizedTemplates
    return normalizedTemplates.filter((t) => t.category === category)
  }, [normalizedTemplates, category])

  const openCreate = () => {
    setEditingTemplate(null)
    setFormOpen(true)
  }

  const openEdit = (template) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  const handleSaveTemplate = (payload) => {
    if (payload.id) {
      updateDocumentTemplate(payload)
    } else {
      addDocumentTemplate(payload)
    }
  }

  const handleDelete = (template) => {
    if (window.confirm(`Remove template "${template.title}"?`)) {
      deleteDocumentTemplate(template.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileStack className="h-7 w-7 text-primary" />
            <h1 className="page-title">Document Templates</h1>
          </div>
          <p className="page-subtitle mt-1">
            {canManage
              ? 'Create templates, define fields (CTC, joining date, probation, etc.), and generate letters for employees.'
              : 'View and generate HR documents from approved templates.'}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            New template
          </button>
        )}
      </div>

      {canManage && (
        <div className="rounded-xl border border-primary/20 bg-primary-light/40 px-4 py-3 text-sm text-foreground">
          <strong className="text-primary-dark">How it works:</strong> Add fields like{' '}
          <em>Annual CTC</em>, <em>Probation period</em>, or <em>Joining date</em> — use{' '}
          <code className="rounded bg-white/80 px-1 text-xs">{'{{field_key}}'}</code> in the letter
          body. When generating, HR fills custom fields; employee data auto-fills from records.
          {isSuperAdmin && ' Super Admin templates apply across all companies.'}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              category === cat.id
                ? 'bg-primary text-white'
                : 'bg-white text-muted ring-1 ring-border hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full py-12 text-center text-sm text-muted">
            No templates in this category.
            {canManage && ' Click “New template” to create an offer letter or other document.'}
          </p>
        ) : (
          filtered.map((template) => (
            <DocumentTemplateCard
              key={template.id}
              template={template}
              canManage={canManage}
              onPreview={setPreviewTemplate}
              onGenerate={setGenerateTemplate}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Generated this session</h2>
        <GeneratedDocumentsList items={generatedDocuments} />
      </section>

      <DocumentPreviewModal
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        template={previewTemplate ? normalizeTemplate(previewTemplate) : null}
        sampleEmployee={sampleEmployee}
        orgContext={orgContext}
      />

      <GenerateDocumentModal
        open={Boolean(generateTemplate)}
        onClose={() => setGenerateTemplate(null)}
        template={generateTemplate ? normalizeTemplate(generateTemplate) : null}
        employees={employees}
        orgContext={orgContext}
        onGenerated={recordGeneratedDocument}
      />

      <DocumentTemplateFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        template={editingTemplate}
        sampleEmployee={sampleEmployee}
        orgContext={orgContext}
        onSave={handleSaveTemplate}
      />
    </div>
  )
}
