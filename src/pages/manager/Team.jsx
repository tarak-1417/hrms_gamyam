import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { useHrms } from '../../hooks/useHrms'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmployeeDetailModal from '../../components/hr/EmployeeDetailModal'

export default function ManagerTeam() {
  const { filterEmployees, searchQuery, addEmployee, getEmployeeDetails } = useHrms()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const employeeDetails = detailId ? getEmployeeDetails(detailId) : null
  const [form, setForm] = useState({ name: '', email: '', role: '', phone: '' })

  const team = filterEmployees(searchQuery, 'Engineering')

  const handleCreate = (e) => {
    e.preventDefault()
    addEmployee({
      ...form,
      department: 'Engineering',
    })
    setForm({ name: '', email: '', role: '', phone: '' })
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">My Team</h1>
          <p className="mt-1 text-muted">Engineering department — {team.length} members</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Add team member
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {team.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No team members yet. Add your first hire.</p>
        ) : (
          <div className="table-scroll">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50/80">
              <tr className="text-muted">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {team.map((emp) => (
                <tr key={emp.id} className="hover:bg-neutral-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary-dark">
                        {emp.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{emp.role}</td>
                  <td className="px-5 py-4">
                    <Badge status={emp.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setDetailId(emp.id)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      <Eye className="h-4 w-4" />
                      Full details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <EmployeeDetailModal
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        details={employeeDetails}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add team member">
        <p className="mb-4 text-sm text-muted">New hires are added to the Engineering team.</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <input
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Software Engineer"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
            Create employee
          </button>
        </form>
      </Modal>
    </div>
  )
}
