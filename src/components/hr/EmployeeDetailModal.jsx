import { X, Mail, Phone, MapPin, Building2, Briefcase, Calendar, Wallet } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatINR } from '../../utils/currency'
export default function EmployeeDetailModal({ open, onClose, details }) {
  if (!open || !details?.employee) return null

  const { employee, payroll, leaves } = details
  const gross = (payroll?.basic ?? 0) + (payroll?.allowances ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-border bg-surface/50 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
              {employee.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{employee.name}</h2>
              <p className="text-sm text-muted">
                {employee.id} · {employee.role}
              </p>
              <div className="mt-2">
                <Badge status={employee.status} />
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Contact & profile">
              <DetailRow icon={Mail} label="Email" value={employee.email} />
              <DetailRow icon={Phone} label="Phone" value={employee.phone || '—'} />
              <DetailRow icon={MapPin} label="Address" value={employee.address || '—'} />
              <DetailRow icon={Building2} label="Department" value={employee.department} />
              <DetailRow icon={Briefcase} label="Role" value={employee.role} />
              <DetailRow icon={Calendar} label="Join date" value={employee.joinDate} />
            </Section>

            <Section title="Payroll" icon={Wallet}>
              {payroll ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted">Latest: {payroll.month}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <PayCell label="Basic salary" value={formatINR(payroll.basic)} />
                    <PayCell label="Allowances" value={formatINR(payroll.allowances)} highlight />
                    <PayCell label="Deductions" value={formatINR(payroll.deductions)} danger />
                    <PayCell label="Gross" value={formatINR(gross)} />
                  </div>
                  <div className="rounded-xl bg-primary-light/50 px-4 py-3">
                    <p className="text-xs font-medium uppercase text-muted">Net pay</p>
                    <p className="text-2xl font-bold text-primary">{formatINR(payroll.net)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">No payroll record on file.</p>
              )}
            </Section>
          </div>

          <Section title="Leave requests" className="mt-6">
            {leaves.length === 0 ? (
              <p className="text-sm text-muted">No leave requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Dates</th>
                      <th className="pb-2 font-medium">Days</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaves.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2">{l.type}</td>
                        <td className="py-2 text-muted">
                          {l.from} – {l.to}
                        </td>
                        <td className="py-2">{l.days}</td>
                        <td className="py-2">
                          <Badge status={l.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children, className = '' }) {
  return (
    <section className={className}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </h3>
      {children}
    </section>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 border-b border-border/60 py-2.5 last:border-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function PayCell({ label, value, highlight, danger }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          danger ? 'text-red-600' : highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

