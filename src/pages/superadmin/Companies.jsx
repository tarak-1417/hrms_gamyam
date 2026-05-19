import { useState } from 'react'
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { usePlatform } from '../../hooks/usePlatform'
import { ORGANIZATION_PLANS, ORGANIZATION_STATUSES } from '../../config/superAdminPermissions'

const emptyOrg = {
  name: '',
  slug: '',
  plan: 'Professional',
  adminEmail: '',
  employeeCount: 0,
  status: 'active',
}

export default function Companies() {
  const {
    organizations,
    saveOrganization,
    removeOrganization,
    activateOrganization,
  } = usePlatform()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyOrg)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyOrg)
    setModalOpen(true)
  }

  const openEdit = (org) => {
    setEditingId(org.id)
    setForm({
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      adminEmail: org.adminEmail || '',
      employeeCount: org.employeeCount ?? 0,
      status: org.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveOrganization({ ...form, id: editingId ?? undefined })
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Organizations</h1>
          <p className="page-subtitle">
            Create and manage tenant companies on the platform (activate, deactivate, plans)
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Create organization
        </button>
      </div>

      <Card title="All organizations" subtitle={`${organizations?.length ?? 0} on platform`}>
        <div className="table-scroll">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-neutral-50 text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Organization</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Employees</th>
                <th className="px-4 py-3 text-left font-medium">HR admin</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(organizations || []).map((org) => (
                <tr key={org.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{org.name}</p>
                    <p className="text-xs text-muted">{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">{org.plan}</td>
                  <td className="px-4 py-3">{org.employeeCount ?? 0}</td>
                  <td className="px-4 py-3 text-muted">{org.adminEmail || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge status={org.status === 'inactive' ? 'inactive' : org.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(org)}
                        className="rounded-lg p-2 text-muted hover:bg-neutral-100"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {org.status === 'inactive' ? (
                        <button
                          type="button"
                          onClick={() => activateOrganization(org.id, true)}
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                          title="Activate"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => activateOrganization(org.id, false)}
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                          title="Deactivate"
                        >
                          <PowerOff className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Move ${org.name} to the recycle bin? Super Admin can restore it later.`,
                            )
                          ) {
                            removeOrganization(org.id)
                          }
                        }}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit organization' : 'Create organization'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Organization name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="acme-corp"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Plan</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {ORGANIZATION_PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {ORGANIZATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Primary HR admin email</label>
            <input
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Employee count</label>
            <input
              type="number"
              min="0"
              value={form.employeeCount}
              onChange={(e) => setForm({ ...form, employeeCount: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
          >
            {editingId ? 'Save changes' : 'Create organization'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
