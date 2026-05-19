import { Download } from 'lucide-react'
import Card from '../../components/ui/Card'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'

export default function Payslips() {
  const { user } = useAuth()
  const { payrollRecords, showToast } = useHrms()
  const payslip = payrollRecords.find((p) => p.employeeId === user?.employeeId) ?? payrollRecords[0]

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  if (!payslip) {
    return <p className="text-muted">No payslip data in JSON.</p>
  }

  return (
    <div className="max-w-lg">
      <Card
        title={`Payslip — ${payslip.month}`}
        action={
          <button
            type="button"
            onClick={() => showToast('PDF download — demo only')}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        }
      >
        <dl className="space-y-4">
          <div className="flex justify-between border-b border-border pb-3">
            <dt className="text-muted">Basic Salary</dt>
            <dd className="font-medium">{formatCurrency(payslip.basic)}</dd>
          </div>
          <div className="flex justify-between border-b border-border pb-3">
            <dt className="text-muted">Allowances</dt>
            <dd className="font-medium text-primary-dark">+{formatCurrency(payslip.allowances)}</dd>
          </div>
          <div className="flex justify-between border-b border-border pb-3">
            <dt className="text-muted">Deductions</dt>
            <dd className="font-medium text-red-600">-{formatCurrency(payslip.deductions)}</dd>
          </div>
          <div className="flex justify-between pt-2">
            <dt className="text-lg font-semibold text-foreground">Net Pay</dt>
            <dd className="text-lg font-bold text-primary">{formatCurrency(payslip.net)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
