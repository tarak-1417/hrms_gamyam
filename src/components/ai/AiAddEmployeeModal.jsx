import { useMemo, useState } from 'react'
import EmployeeFormModal from '../hr/EmployeeFormModal'
import { useHrms } from '../../hooks/useHrms'
import { calculatePayrollBreakdown, estimatePayrollByProfile } from '../../store/hrmsHelpers'
import { getDepartmentNames, getDesignationTitles } from '../../utils/organizationHelpers'

const PAYROLL_INPUT_KEYS = [
  'annualCtc',
  'basic',
  'hra',
  'lta',
  'bonus',
  'specialAllowance',
  'professionalTax',
  'healthInsurance',
  'tds',
  'otherDeductions',
]

const emptyForm = {
  name: '',
  email: '',
  department: 'Engineering',
  role: '',
  phone: '',
  address: '',
  joinDate: '',
  status: 'active',
  branchId: '',
  managerId: '',
  payrollMonth: '',
  annualCtc: '',
  basic: '',
  hra: '',
  lta: '',
  bonus: '',
  specialAllowance: '',
  professionalTax: '',
  healthInsurance: '',
  tds: '',
  otherDeductions: '',
}

function buildPayload(form, payrollPreview) {
  const hasPayrollInput =
    form.payrollMonth || PAYROLL_INPUT_KEYS.some((key) => form[key] !== '' && form[key] != null)
  const payrollInput = hasPayrollInput
    ? {
        month: payrollPreview?.month || form.payrollMonth,
        annualCtc: payrollPreview?.yearlyCtc ?? form.annualCtc,
        monthlyCtc: payrollPreview?.monthlyCtc,
        basic: payrollPreview?.basic ?? form.basic,
        hra: payrollPreview?.hra ?? form.hra,
        lta: payrollPreview?.lta ?? form.lta,
        bonus: payrollPreview?.bonus ?? form.bonus,
        specialAllowance: payrollPreview?.specialAllowance ?? form.specialAllowance,
        professionalTax: payrollPreview?.professionalTax ?? form.professionalTax,
        healthInsurance: payrollPreview?.healthInsurance ?? form.healthInsurance,
        tds: payrollPreview?.tds ?? form.tds,
        otherDeductions: payrollPreview?.otherDeductions ?? form.otherDeductions,
      }
    : undefined

  return {
    name: form.name,
    email: form.email,
    department: form.department,
    role: form.role,
    phone: form.phone,
    address: form.address,
    joinDate: form.joinDate || undefined,
    status: form.status,
    branchId: form.branchId || null,
    managerId: form.managerId || null,
    payrollInput,
  }
}

/**
 * Opens the app's real "Add employee" form (EmployeeFormModal) as an overlay
 * straight from the AI chat — prefilled with what the assistant parsed. Mounted
 * only while open, so its state initialises cleanly from `prefill`.
 */
export default function AiAddEmployeeModal({ prefill = {}, onClose, onAdded }) {
  const { addEmployee, employees = [], departments: deptRecords, designations, branches } = useHrms()

  const departmentNames = useMemo(() => {
    const fromOrg = getDepartmentNames(deptRecords)
    if (fromOrg.length) return fromOrg
    return ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance']
  }, [deptRecords])

  const designationTitles = useMemo(() => getDesignationTitles(designations), [designations])

  const [form, setForm] = useState(() => ({
    ...emptyForm,
    name: prefill.name || '',
    email: prefill.email || '',
    role: prefill.role || '',
    department: prefill.department || emptyForm.department,
    managerId: prefill.managerId || '',
    status: prefill.status || 'active',
  }))

  const autoPayrollPreview = useMemo(() => {
    if (!form.department || !form.role) return null
    const hasManual = PAYROLL_INPUT_KEYS.some((key) => form[key])
    if (!hasManual) {
      return estimatePayrollByProfile({ department: form.department, role: form.role })
    }
    return calculatePayrollBreakdown({
      month: form.payrollMonth,
      annualCtc: form.annualCtc,
      basic: form.basic,
      hra: form.hra,
      lta: form.lta,
      bonus: form.bonus,
      specialAllowance: form.specialAllowance,
      professionalTax: form.professionalTax,
      healthInsurance: form.healthInsurance,
      tds: form.tds,
      otherDeductions: form.otherDeductions,
    })
  }, [form])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = buildPayload(form, autoPayrollPreview)
    addEmployee(payload)
    onAdded?.(payload)
    onClose?.()
  }

  return (
    <EmployeeFormModal
      open
      onClose={onClose}
      isEditing={false}
      editingId={null}
      form={form}
      setForm={setForm}
      departments={departmentNames}
      designations={designationTitles}
      branches={branches || []}
      managers={employees.filter((e) => e.status === 'active')}
      onSubmit={handleSubmit}
      autoPayrollPreview={autoPayrollPreview}
    />
  )
}
