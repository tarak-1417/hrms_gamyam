import Modal from '../ui/Modal'
import DocumentPreview from './DocumentPreview'
import { getDefaultFieldValues, renderTemplate } from '../../utils/documentTemplateUtils'

export default function DocumentPreviewModal({
  open,
  onClose,
  template,
  sampleEmployee,
  orgContext,
}) {
  if (!template) return null

  const content = renderTemplate(
    template.body,
    getDefaultFieldValues(template, sampleEmployee, orgContext),
  )

  return (
    <Modal open={open} onClose={onClose} title={template.title} wide>
      <p className="mb-3 text-xs text-muted">
        Sample preview using {sampleEmployee ? sampleEmployee.name : 'placeholder'} data. Use
        Generate to fill for a specific employee.
      </p>
      <DocumentPreview content={content} />
    </Modal>
  )
}
