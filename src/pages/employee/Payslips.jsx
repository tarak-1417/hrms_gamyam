import { useEffect, useMemo, useState } from 'react'
import { Download, Eye } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { formatINR } from '../../utils/currency'

function parsePayrollMonth(month) {
  const parsed = new Date(`${month} 01`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getFinancialYear(month) {
  const date = parsePayrollMonth(month)
  if (!date) return 'FY'
  const year = date.getFullYear()
  const startYear = date.getMonth() >= 3 ? year : year - 1
  return `FY ${startYear} - ${startYear + 1}`
}

function getPayslipStatus(record, latestMonth) {
  if (record.month === latestMonth) return { tone: 'active', label: 'Latest Payslip' }
  return { tone: 'approved', label: 'Available' }
}

function sanitizeFilenamePart(value) {
  return String(value || 'payslip')
    .trim()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function buildPayslipHtml(record, employeeName) {
  const grossPay = (record.basic ?? 0) + (record.allowances ?? 0)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payslip - ${record.month}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
      .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; max-width: 760px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
      .brand { font-size: 24px; font-weight: 700; color: #14532d; }
      .muted { color: #6b7280; font-size: 14px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
      .metric { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background: #f9fafb; }
      .metric strong { display: block; margin-top: 8px; font-size: 20px; }
      .total { background: #eefbf2; border-color: #bbf7d0; }
      @media print { body { margin: 0; } .card { border: none; padding: 0; max-width: none; } }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div>
          <div class="brand">Payslip</div>
          <div class="muted">Employee: ${employeeName}</div>
          <div class="muted">Payroll Month: ${record.month}</div>
        </div>
        <div>
          <div class="muted">Generated from HRMS</div>
        </div>
      </div>
      <div class="grid">
        <div class="metric">
          <div class="muted">Basic Salary</div>
          <strong>${formatINR(record.basic)}</strong>
        </div>
        <div class="metric">
          <div class="muted">Allowances</div>
          <strong>${formatINR(record.allowances)}</strong>
        </div>
        <div class="metric">
          <div class="muted">Deductions</div>
          <strong>${formatINR(record.deductions)}</strong>
        </div>
        <div class="metric">
          <div class="muted">Gross Pay</div>
          <strong>${formatINR(grossPay)}</strong>
        </div>
        <div class="metric total">
          <div class="muted">Net Pay</div>
          <strong>${formatINR(record.net)}</strong>
        </div>
      </div>
    </div>
  </body>
</html>`
}

export default function Payslips() {
  const { user } = useAuth()
  const { payrollRecords, showToast, getEmployeeDetails } = useHrms()
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedPayslipId, setSelectedPayslipId] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const allPayslips = useMemo(() => {
    const employeeRecords = payrollRecords.filter((p) => p.employeeId === user?.employeeId)
    const fallback =
      (user?.employeeId && getEmployeeDetails(user.employeeId)?.payroll) ||
      payrollRecords[0] ||
      null
    const source = employeeRecords.length > 0 ? employeeRecords : fallback ? [fallback] : []

    return [...source].sort((a, b) => {
      const aDate = parsePayrollMonth(a.month)
      const bDate = parsePayrollMonth(b.month)
      return (bDate?.getTime() || 0) - (aDate?.getTime() || 0)
    })
  }, [getEmployeeDetails, payrollRecords, user?.employeeId])

  const financialYears = useMemo(
    () => Array.from(new Set(allPayslips.map((record) => getFinancialYear(record.month)))),
    [allPayslips],
  )

  useEffect(() => {
    if (!selectedYear && financialYears.length > 0) {
      setSelectedYear(financialYears[0])
    }
  }, [financialYears, selectedYear])

  const filteredPayslips = useMemo(() => {
    if (!selectedYear) return allPayslips
    return allPayslips.filter((record) => getFinancialYear(record.month) === selectedYear)
  }, [allPayslips, selectedYear])

  useEffect(() => {
    if (filteredPayslips.length === 0) {
      setSelectedPayslipId(null)
      return
    }
    if (!filteredPayslips.some((record) => String(record.id) === String(selectedPayslipId))) {
      setSelectedPayslipId(filteredPayslips[0].id)
    }
  }, [filteredPayslips, selectedPayslipId])

  const selectedPayslip =
    filteredPayslips.find((record) => String(record.id) === String(selectedPayslipId)) ||
    filteredPayslips[0] ||
    null

  const handleDownload = (record) => {
    if (!record) return
    const html = buildPayslipHtml(record, user?.name || 'Employee')
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sanitizeFilenamePart(user?.name)}-${sanitizeFilenamePart(record.month)}-payslip.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`Payslip downloaded for ${record.month}`)
  }

  if (!selectedPayslip && allPayslips.length === 0) {
    return <p className="text-muted">No payslip data in JSON.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Payslips</h1>
        <p className="page-subtitle">View your monthly salary summary using the payroll data already in the system.</p>
      </div>

      <Card
        title="Payslips"
        subtitle={`${filteredPayslips.length} ${filteredPayslips.length === 1 ? 'record' : 'records'} in ${selectedYear || 'selected year'}`}
      >
        <div className="space-y-5">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-foreground">Select Financial Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              {financialYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {filteredPayslips.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
              No payslips found for this financial year.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50/80">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-semibold text-foreground">Payroll Month</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Net Pay</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Gross Pay</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredPayslips.map((record, index) => {
                    const status = getPayslipStatus(record, filteredPayslips[0]?.month)
                    const gross = (record.basic ?? 0) + (record.allowances ?? 0)
                    const isSelected = String(record.id) === String(selectedPayslipId)

                    return (
                      <tr key={`${record.employeeId || 'demo'}-${record.id || record.month}`}>
                        <td className="px-4 py-4 font-medium text-foreground">{record.month}</td>
                        <td className="px-4 py-4 text-foreground">{formatINR(record.net)}</td>
                        <td className="px-4 py-4 text-foreground">{formatINR(gross)}</td>
                        <td className="px-4 py-4">
                          <Badge status={status.tone}>{index === 0 ? status.label : 'Available'}</Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayslipId(record.id)
                              setPreviewOpen(true)
                            }}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                              isSelected
                                ? 'bg-primary-light text-primary-dark'
                                : 'text-primary hover:bg-primary-light/60 hover:text-primary-dark'
                            }`}
                          >
                            <Eye className="h-4 w-4" />
                            View Payslip
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={previewOpen && Boolean(selectedPayslip)}
        onClose={() => setPreviewOpen(false)}
        title={selectedPayslip ? `Payslip - ${selectedPayslip.month}` : 'Payslip'}
        subtitle="Review the payslip details and download the selected payslip."
        wide
      >
        {selectedPayslip && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-neutral-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.name || 'Employee'}</p>
                <p className="mt-1 text-xs text-muted">Payroll month: {selectedPayslip.month}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={getPayslipStatus(selectedPayslip, filteredPayslips[0]?.month).tone}>
                  {getPayslipStatus(selectedPayslip, filteredPayslips[0]?.month).label}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl border border-border bg-neutral-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Basic Salary</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatINR(selectedPayslip.basic)}</p>
              </div>
              <div className="rounded-xl border border-border bg-neutral-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Allowances</p>
                <p className="mt-2 text-lg font-semibold text-primary-dark">{formatINR(selectedPayslip.allowances)}</p>
              </div>
              <div className="rounded-xl border border-border bg-neutral-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Deductions</p>
                <p className="mt-2 text-lg font-semibold text-red-600">{formatINR(selectedPayslip.deductions)}</p>
              </div>
              <div className="rounded-xl border border-border bg-neutral-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Gross Pay</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatINR((selectedPayslip.basic ?? 0) + (selectedPayslip.allowances ?? 0))}
                </p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary-light/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark/75">Net Pay</p>
                <p className="mt-2 text-xl font-bold text-primary">{formatINR(selectedPayslip.net)}</p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-neutral-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownload(selectedPayslip)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                <Download className="h-4 w-4" />
                Download Payslip
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
