import { useState } from 'react'
import { Plus, Pencil, Trash2, Ban, KeyRound } from 'lucide-react'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { usePlatform } from '../../hooks/usePlatform'
import { PLATFORM_ROLES } from '../../config/superAdminPermissions'

const emptyUser = {
  name: '',
  email: '',
  password: '',
  role: 'admin',
  organizationId: '',
}

export default function PlatformUsers() {
  const {
    users,
    organizations,
    saveUser,
    removeUser,
    blockUser,
    resetPassword,
  } = usePlatform()
  const [modalOpen, setModalOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyUser)

  const orgName = (id) => organizations?.find((o) => o.id === id)?.name ?? '—'

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyUser)
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setEditingId(u.id)
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      organizationId: u.organizationId || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, id: editingId ?? undefined }
    if (!payload.password && editingId) delete payload.password
    saveUser(payload)
    setModalOpen(false)
  }

  const handleReset = (e) => {
    e.preventDefault()
    if (!newPassword.trim()) return
    resetPassword(resetOpen, newPassword)
    setResetOpen(null)
    setNewPassword('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">User management</h1>
          <p className="page-subtitle">
            Create HR admins, assign roles, reset passwords, and block users
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Create user
        </button>
      </div>

      <Card title="Platform users" subtitle={`${users?.length ?? 0} accounts`}>
        <div className="table-scroll">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-neutral-50 text-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Organization</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(users || []).map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3 text-muted">{orgName(u.organizationId)}</td>
                  <td className="px-4 py-3">
                    <Badge status={u.blocked ? 'inactive' : 'active'}>
                      {u.blocked ? 'blocked' : 'active'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="rounded-lg p-2 text-muted hover:bg-neutral-100"
                        title="Edit / assign role"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetOpen(u.id)
                          setNewPassword('')
                        }}
                        className="rounded-lg p-2 text-muted hover:bg-neutral-100"
                        title="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      {u.role !== 'superadmin' && (
                        <>
                          <button
                            type="button"
                            onClick={() => blockUser(u.id, !u.blocked)}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            title={u.blocked ? 'Unblock' : 'Block'}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Move ${u.name} to the recycle bin? Restore from Recycle bin.`,
                                )
                              ) {
                                removeUser(u.id)
                              }
                            }}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
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
        title={editingId ? 'Edit user' : 'Create admin user'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              {editingId ? 'New password (leave blank to keep)' : 'Password *'}
            </label>
            <input
              type="text"
              required={!editingId}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={editingId && users?.find((u) => u.id === editingId)?.role === 'superadmin'}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm disabled:bg-neutral-50"
            >
              {PLATFORM_ROLES.filter((r) => {
                const editing = users?.find((u) => u.id === editingId)
                if (editing?.role === 'superadmin') return r.id === 'superadmin'
                return r.id !== 'superadmin'
              }).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Organization</label>
            <select
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">— Platform (none) —</option>
              {(organizations || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
          >
            {editingId ? 'Save user' : 'Create user'}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(resetOpen)} onClose={() => setResetOpen(null)} title="Reset password">
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">New password *</label>
            <input
              required
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
          >
            Reset password
          </button>
        </form>
      </Modal>
    </div>
  )
}
