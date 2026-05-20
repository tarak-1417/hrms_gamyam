import { useState, useEffect } from 'react'
import {
  Pencil,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  BadgeCheck,
  Calendar,
  User,
  GitBranch,
  Hash,
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { formatDisplayDate } from '../../utils/timeUtils'

function InfoTile({ icon: Icon, label, value, className = '' }) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border border-neutral-100 bg-gradient-to-b from-white to-neutral-50/60 p-4 ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

export default function Profile() {
  const { user, updateSession } = useAuth()
  const { getEmployeeById, updateEmployeeProfile, branches } = useHrms()
  const profile = getEmployeeById(user?.employeeId)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        address: profile.address || '',
      })
    }
  }, [profile])

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-16 text-center">
        <User className="h-12 w-12 text-neutral-300" />
        <p className="mt-4 text-sm font-medium text-foreground">Profile not found</p>
        <p className="mt-1 text-xs text-muted">Your account may not be linked to an employee record.</p>
      </div>
    )
  }

  const branch = branches?.find((b) => b.id === profile.branchId)
  const manager = profile.managerId ? getEmployeeById(profile.managerId) : null

  const handleSave = (e) => {
    e.preventDefault()
    updateEmployeeProfile(user.employeeId, form)
    updateSession({ name: form.name, email: form.email })
    setEditing(false)
  }

  const handleCancel = () => {
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      address: profile.address || '',
    })
    setEditing(false)
  }

  const workFields = [
    { icon: Hash, label: 'Employee ID', value: profile.id },
    { icon: Building2, label: 'Department', value: profile.department },
    { icon: Briefcase, label: 'Job title', value: profile.role },
    { icon: Calendar, label: 'Join date', value: formatDisplayDate(profile.joinDate) },
    { icon: GitBranch, label: 'Branch', value: branch?.name ?? '—' },
    {
      icon: User,
      label: 'Reporting manager',
      value: manager ? manager.name : '—',
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-4">
      {/* Profile hero */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-br from-primary via-primary to-primary-dark sm:h-32" />
        <div className="pointer-events-none absolute right-6 top-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute left-1/3 top-4 h-16 w-16 rounded-full bg-black/5" />

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-primary shadow-lg ring-4 ring-white sm:h-28 sm:w-28 sm:text-3xl">
                {profile.avatar}
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{profile.name}</h2>
                  <Badge status={profile.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {profile.role} · {profile.department}
                </p>
                {branch && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {branch.name}
                    {branch.city ? `, ${branch.city}` : ''}
                  </p>
                )}
              </div>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark sm:w-auto"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </button>
            )}
          </div>
        </div>
      </section>

      {editing ? (
        <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground">Edit personal details</h3>
              <p className="text-xs text-muted">Update contact information visible to HR</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={inputClass}
                  placeholder="Street, city, state"
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark"
              >
                <Save className="h-4 w-4" />
                Save changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Contact */}
          <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                <BadgeCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Contact</h3>
                <p className="text-xs text-muted">How HR can reach you</p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoTile icon={Mail} label="Email" value={profile.email} />
              <InfoTile icon={Phone} label="Phone" value={profile.phone} />
              <InfoTile icon={MapPin} label="Address" value={profile.address} />
            </div>
          </section>

          {/* Work info */}
          <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Briefcase className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Work information</h3>
                <p className="text-xs text-muted">Managed by your organization</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workFields.map(({ icon, label, value }) => (
                <InfoTile key={label} icon={icon} label={label} value={value} />
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-primary-light/50 px-3 py-2 text-xs text-muted">
              Department, role, and reporting line are updated by HR. Contact your manager if something looks
              incorrect.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
