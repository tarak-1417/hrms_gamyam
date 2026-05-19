import { useState, useEffect } from 'react'
import { Pencil, Save, X } from 'lucide-react'
import Card from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'

export default function Profile() {
  const { user, updateSession } = useAuth()
  const { getEmployeeById, updateEmployeeProfile } = useHrms()
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
    return <p className="text-muted">Profile not found.</p>
  }

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

  const readOnlyFields = [
    { label: 'Employee ID', value: profile.id },
    { label: 'Department', value: profile.department },
    { label: 'Role', value: profile.role },
    { label: 'Join Date', value: profile.joinDate },
    { label: 'Status', value: profile.status },
  ]

  return (
    <div className="max-w-3xl space-y-6">
      <Card
        title="Personal details"
        action={
          !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <Pencil className="h-4 w-4" />
              Edit profile
            </button>
          ) : null
        }
      >
        <div className="mb-8 flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-2xl font-bold text-primary-dark">
            {profile.avatar}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>
            <p className="text-muted">
              {profile.role} · {profile.department}
            </p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Full name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground">Address</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="City, state"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Save className="h-4 w-4" />
                Save changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-surface p-4 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Phone</dt>
              <dd className="mt-1 font-medium text-foreground">{profile.phone || '—'}</dd>
            </div>
            {profile.address ? (
              <div className="rounded-lg bg-surface p-4 sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Address</dt>
                <dd className="mt-1 font-medium text-foreground">{profile.address}</dd>
              </div>
            ) : null}
            <div className="rounded-lg bg-surface p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
              <dd className="mt-1 font-medium text-foreground">{profile.email}</dd>
            </div>
            {readOnlyFields.map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-surface p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
                <dd className="mt-1 font-medium capitalize text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>
    </div>
  )
}
