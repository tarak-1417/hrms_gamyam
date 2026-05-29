import { User, Wallet, Sparkles } from 'lucide-react'
import Modal from '../ui/Modal'
import DatePicker from '../ui/DatePicker'
import { calculatePayrollBreakdown, estimatePayrollByProfile } from '../../store/hrmsHelpers'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition placeholder:text-neutral-400 hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-500'

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  )
}

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function buildPayrollPreviewGroups(preview) {
  if (!preview) return { earnings: [], deductions: [], employerContributions: [] }
  return {
    earnings: [
      ['Basic', preview.basic],
      ['HRA', preview.hra],
      ['LTA', preview.lta],
      ['Bonus', preview.bonus],
      ['Special allowance', preview.specialAllowance],
      ['Gross salary', preview.grossSalary],
    ],
    deductions: [
      ['EPF (employee)', preview.epfEmployee],
      ['ESI (employee)', preview.esiEmployee],
      ['Professional tax', preview.professionalTax],
      ['Health insurance', preview.healthInsurance],
      ['TDS', preview.tds],
      ['Other deductions', preview.otherDeductions],
      ['Total deductions', preview.deductions],
    ],
    employerContributions: [
      ['EPF (employer)', preview.employerEpf],
      ['ESI (employer)', preview.employerEsi],
      ['Gratuity', preview.gratuity],
      ['Company cost', preview.companyCostMonthly],
    ],
  }
}

function getCalculatedFieldValue(form, key, preview) {
  if (form[key] !== '' && form[key] != null) return form[key]
  if (!preview) return form[key]

  const previewValues = {
    payrollMonth: preview.month,
    annualCtc: preview.yearlyCtc,
    basic: preview.basic,
    hra: preview.hra,
    lta: preview.lta,
    bonus: preview.bonus,
    specialAllowance: preview.specialAllowance,
    professionalTax: preview.professionalTax,
    healthInsurance: preview.healthInsurance,
    tds: preview.tds,
    otherDeductions: preview.otherDeductions,
  }

  const value = previewValues[key]
  return value == null ? form[key] : String(value)
}

export default function EmployeeFormModal({
  open,
  onClose,
  isEditing,
  editingId,
  form,
  setForm,
  departments,
  designations = [],
  branches = [],
  managers = [],
  onSubmit,
  autoPayrollPreview,
}) {
  const hasManualPayroll =
    form.annualCtc ||
    form.basic ||
    form.hra ||
    form.lta ||
    form.bonus ||
    form.specialAllowance ||
    form.professionalTax ||
    form.healthInsurance ||
    form.tds ||
    form.otherDeductions

  const preview =
    autoPayrollPreview ??
    (form.department && form.role
      ? hasManualPayroll
        ? calculatePayrollBreakdown({
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
        : estimatePayrollByProfile({ department: form.department, role: form.role, id: editingId })
      : null)
  const previewGroups = buildPayrollPreviewGroups(preview)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit employee' : 'Add new employee'}
      subtitle={
        isEditing
          ? 'Update profile and salary breakup for this team member.'
          : 'Create a profile — payroll can be calculated automatically from annual CTC or role defaults.'
      }
      xl2
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {isEditing && (
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600">
            <span className="text-neutral-400">ID</span>
            {editingId}
          </div>
        )}

        <section className="rounded-2xl border border-neutral-100 bg-gradient-to-b from-neutral-50/80 to-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Employee details</h4>
              <p className="text-xs text-muted">Basic information for the directory</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Arjun Mehta"
                className={inputClass}
              />
            </Field>
            <Field label="Work email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@company.com"
                className={inputClass}
              />
            </Field>
            <Field label="Department">
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className={inputClass}
              >
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Designation / job role">
              {designations.length > 0 ? (
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select designation</option>
                  {designations.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Senior Developer"
                  className={inputClass}
                />
              )}
            </Field>
            {branches.length > 0 && (
              <Field label="Branch / location">
                <select
                  value={form.branchId || ''}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— Default —</option>
                  {branches
                    .filter((b) => b.status !== 'inactive')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </Field>
            )}
            {managers.length > 0 && (
              <Field label="Reporting manager">
                <select
                  value={form.managerId || ''}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— No manager —</option>
                  {managers
                    .filter((m) => m.id !== editingId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} · {m.role}
                      </option>
                    ))}
                </select>
              </Field>
            )}
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </Field>
            <Field label="Join date">
              <DatePicker
                value={form.joinDate}
                onChange={(joinDate) => setForm({ ...form, joinDate })}
                max={new Date().toISOString().slice(0, 10)}
                className="mt-0"
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="City, state"
                className={inputClass}
              />
            </Field>
            {isEditing && (
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={`${inputClass} capitalize`}
                >
                  <option value="active">Active</option>
                  <option value="on-leave">On leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary-light/30 via-white to-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Salary breakup</h4>
                <p className="text-xs text-muted">
                  Enter annual CTC or override the monthly breakup fields below. The system will
                  auto-calculate the full salary breakup.
                </p>
              </div>
            </div>
            {preview && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" />
                Auto-calculated
              </span>
            )}
          </div>

          {preview && (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Annual CTC', value: preview.yearlyCtc },
                { label: 'Gross Salary', value: preview.grossSalary },
                { label: 'Deductions', value: preview.deductions },
                { label: 'Net pay', value: preview.net, highlight: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl px-3 py-2.5 ${
                    item.highlight
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white/80 ring-1 ring-primary/10'
                  }`}
                >
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      item.highlight ? 'text-white/80' : 'text-muted'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className={`mt-0.5 text-sm font-bold ${item.highlight ? 'text-white' : 'text-foreground'}`}>
                    {formatInr(item.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { key: 'payrollMonth', label: 'Payroll month', placeholder: 'April 2026', type: 'text' },
              { key: 'annualCtc', label: 'Annual CTC' },
              { key: 'basic', label: 'Basic' },
              { key: 'hra', label: 'HRA' },
              { key: 'lta', label: 'LTA' },
              { key: 'bonus', label: 'Bonus' },
              { key: 'specialAllowance', label: 'Special allowance' },
              { key: 'professionalTax', label: 'Professional tax' },
              { key: 'healthInsurance', label: 'Health insurance' },
              { key: 'tds', label: 'TDS' },
              { key: 'otherDeductions', label: 'Other deductions' },
            ].map(({ key, label, placeholder = 'Auto', type = 'number' }) => (
              <Field key={key} label={label}>
                <input
                  type={type}
                  min={type === 'number' ? '0' : undefined}
                  value={getCalculatedFieldValue(form, key, hasManualPayroll ? preview : null)}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>

          <p className="mt-3 text-xs text-muted">
            Formula defaults: basic 50% of CTC, HRA 40% of basic, LTA only when basic is above
            ₹15,000, bonus fixed at ₹2,750, EPF capped at ₹1,800, professional tax at slab rates,
            and gratuity at 4.81%.
          </p>

          {preview && (
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <PreviewGroup title="Earnings" items={previewGroups.earnings} positive />
              <PreviewGroup title="Deductions" items={previewGroups.deductions} negative />
              <PreviewGroup title="Employer contributions" items={previewGroups.employerContributions} />
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark hover:shadow-primary/30"
          >
            {isEditing ? 'Save changes' : 'Save employee'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function PreviewGroup({ title, items, positive, negative }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white/85 p-4 shadow-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">{label}</span>
            <span
              className={`font-semibold ${
                negative ? 'text-red-600' : positive ? 'text-primary-dark' : 'text-foreground'
              }`}
            >
              {formatInr(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
