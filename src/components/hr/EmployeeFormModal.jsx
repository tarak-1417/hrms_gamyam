import { User, Wallet, Sparkles } from 'lucide-react'
import Modal from '../ui/Modal'
import DatePicker from '../ui/DatePicker'
import { estimatePayrollByProfile } from '../../store/hrmsHelpers'

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

export default function EmployeeFormModal({
  open,
  onClose,
  isEditing,
  editingId,
  form,
  setForm,
  departments,
  onSubmit,
  autoPayrollPreview,
}) {
  const preview =
    autoPayrollPreview ??
    (form.department && form.role && !form.basic && !form.net
      ? estimatePayrollByProfile({ department: form.department, role: form.role, id: editingId })
      : null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit employee' : 'Add new employee'}
      subtitle={
        isEditing
          ? 'Update profile and monthly payroll for this team member.'
          : 'Create a profile — payroll is calculated automatically if you leave salary blank.'
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
            <Field label="Job role">
              <input
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Senior Developer"
                className={inputClass}
              />
            </Field>
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
                <h4 className="text-sm font-semibold text-foreground">Monthly payroll</h4>
                <p className="text-xs text-muted">Optional — leave blank for smart defaults</p>
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
                { label: 'Basic', value: preview.basic },
                { label: 'Allowances', value: preview.allowances },
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: 'basic', label: 'Basic' },
              { key: 'allowances', label: 'Allowances' },
              { key: 'deductions', label: 'Deductions' },
              { key: 'net', label: 'Net' },
            ].map(({ key, label }) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  min="0"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="Auto"
                  className={inputClass}
                />
              </Field>
            ))}
          </div>
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
