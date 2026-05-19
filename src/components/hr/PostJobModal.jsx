import { useState } from 'react'
import { Briefcase, MapPin, FileText } from 'lucide-react'
import Modal from '../ui/Modal'

const DEPARTMENTS = ['Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance']
const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']

const inputClass =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition placeholder:text-neutral-400 hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-500'

const empty = {
  title: '',
  department: 'Engineering',
  location: 'Razole, Andhra Pradesh',
  employmentType: 'Full-time',
  salaryRange: '',
  description: '',
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  )
}

export default function PostJobModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(empty)

  const handleClose = () => {
    setForm(empty)
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
    setForm(empty)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Post a new job"
      subtitle="Create an opening for candidates. It will appear on Recruitment and the HR dashboard."
      xl
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-neutral-100 bg-gradient-to-b from-neutral-50/80 to-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Role overview</h4>
              <p className="text-xs text-muted">Title, team, and how the role is classified</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Job title">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
                placeholder="e.g. Senior Developer, HR Executive"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department">
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={inputClass}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Employment type">
                <select
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                  className={inputClass}
                >
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary-light/25 via-white to-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Compensation & location</h4>
              <p className="text-xs text-muted">Where the role is based and expected pay band</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Work location">
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={inputClass}
                placeholder="e.g. Razole, Andhra Pradesh"
              />
            </Field>
            <Field label="Salary range">
              <input
                value={form.salaryRange}
                onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                className={inputClass}
                placeholder="e.g. 6–10 LPA"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Job description</h4>
              <p className="text-xs text-muted">Responsibilities, skills, and requirements</p>
            </div>
          </div>

          <Field label="Description">
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} min-h-[120px] resize-y`}
              placeholder="Describe the role, day-to-day work, and what you're looking for in candidates…"
            />
          </Field>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark hover:shadow-primary/30"
          >
            Publish job
          </button>
        </div>
      </form>
    </Modal>
  )
}
