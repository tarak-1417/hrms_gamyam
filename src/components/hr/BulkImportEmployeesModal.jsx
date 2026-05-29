import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import Modal from '../ui/Modal'
import {
  parseEmployeeImportFile,
  downloadEmployeeImportTemplate,
  EMPLOYEE_IMPORT_COLUMNS,
} from '../../utils/employeeImportUtils'

export default function BulkImportEmployeesModal({
  open,
  onClose,
  onImport,
  existingEmails = [],
}) {
  const [file, setFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [selectedPreviewRow, setSelectedPreviewRow] = useState(null)

  const emailSet = useMemo(
    () => new Set(existingEmails.map((e) => String(e).toLowerCase())),
    [existingEmails],
  )

  const reset = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    setParsing(false)
    setSelectedPreviewRow(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    setParsing(true)
    try {
      const result = await parseEmployeeImportFile(f, new Set(emailSet))
      setPreview(result)
      setSelectedPreviewRow(result.valid[0]?.row ?? null)
    } catch (err) {
      setError(err.message)
      setPreview(null)
      setSelectedPreviewRow(null)
    } finally {
      setParsing(false)
    }
  }

  const selectedPayrollPreview =
    preview?.valid?.find((row) => row.row === selectedPreviewRow) || preview?.valid?.[0] || null

  const handleImport = () => {
    if (!preview?.valid?.length) return
    onImport(preview.valid.map((v) => v.employee))
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Bulk import employees" xl>
      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary-light/40 p-4 text-sm">
          <p className="font-medium text-foreground">Import your whole organization from Excel</p>
          <p className="mt-1 text-xs text-muted">
            Download the template (includes 6 sample rows like demo data). Replace with your staff
            list — one row per person. Upload here and every row is added automatically with profile
            and payroll, in the same order as your sheet. You can upload just{' '}
            <code className="rounded bg-white/70 px-1 py-0.5 text-[11px] text-foreground">annual_ctc</code>{' '}
            and the app will calculate the full salary breakup automatically.
          </p>
          <button
            type="button"
            onClick={downloadEmployeeImportTemplate}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Download Excel template
          </button>
          <p className="mt-2 text-[11px] text-muted">
            File: <strong className="text-foreground">gamyam-employees-import.xlsx</strong>
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted">Expected columns</p>
          <div className="flex flex-wrap gap-1.5">
            {EMPLOYEE_IMPORT_COLUMNS.map((c) => (
              <code
                key={c.key}
                className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] text-foreground"
              >
                {c.aliases[0]}
                {['name', 'email', 'role'].includes(c.key) ? ' *' : ''}
              </code>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-neutral-50/80 px-4 py-8 transition hover:border-primary/40 hover:bg-primary-light/30">
          <FileSpreadsheet className="h-10 w-10 text-primary" />
          <span className="mt-2 text-sm font-medium text-foreground">
            {file ? file.name : 'Choose .xlsx, .xls, or .csv file'}
          </span>
          <span className="mt-1 text-xs text-muted">Click to browse</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="sr-only"
            onChange={handleFile}
          />
        </label>

        {parsing && <p className="text-center text-sm text-muted">Reading file…</p>}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {preview && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {preview.valid.length} ready to import
              </span>
              {preview.invalid.length > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  {preview.invalid.length} skipped
                </span>
              )}
            </div>

            {preview.invalid.length > 0 && (
              <ul className="max-h-24 overflow-auto rounded-lg border border-amber-200 bg-amber-50/80 p-2 text-xs text-amber-900">
                {preview.invalid.slice(0, 8).map((row) => (
                  <li key={row.row}>
                    Row {row.row}: {row.error}
                  </li>
                ))}
                {preview.invalid.length > 8 && (
                  <li>…and {preview.invalid.length - 8} more</li>
                )}
              </ul>
            )}

            {preview.valid.length > 0 && (
              <div className="space-y-4">
                <div className="max-h-56 overflow-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-neutral-50">
                      <tr className="text-muted">
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="px-3 py-2 font-medium">Department</th>
                        <th className="px-3 py-2 font-medium">Annual CTC</th>
                        <th className="px-3 py-2 font-medium">Gross</th>
                        <th className="px-3 py-2 font-medium">Deductions</th>
                        <th className="px-3 py-2 font-medium">Net pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.valid.map((row) => {
                        const payroll = row.employee.payroll
                        const isSelected = row.row === (selectedPreviewRow ?? preview.valid[0]?.row)
                        return (
                          <tr
                            key={row.row}
                            onClick={() => setSelectedPreviewRow(row.row)}
                            className={`cursor-pointer transition ${
                              isSelected ? 'bg-primary-light/40' : 'hover:bg-neutral-50'
                            }`}
                          >
                            <td className="px-3 py-2 font-medium">{row.employee.name}</td>
                            <td className="px-3 py-2">{row.employee.role}</td>
                            <td className="px-3 py-2">{row.employee.department}</td>
                            <td className="px-3 py-2">₹{payroll.yearlyCtc.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2">₹{payroll.grossSalary.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2 text-red-600">
                              ₹{payroll.deductions.toLocaleString('en-IN')}
                            </td>
                            <td className="px-3 py-2 font-semibold text-primary-dark">
                              ₹{payroll.net.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedPayrollPreview?.employee?.payroll && (
                  <div className="rounded-xl border border-primary/15 bg-primary-light/20 p-4">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-foreground">
                        Salary breakup preview: {selectedPayrollPreview.employee.name}
                      </p>
                      <p className="text-xs text-muted">
                        This breakup is calculated from the uploaded payroll values or annual CTC.
                      </p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <PreviewBreakupGroup
                        title="Earnings"
                        items={[
                          ['Basic', selectedPayrollPreview.employee.payroll.basic],
                          ['HRA', selectedPayrollPreview.employee.payroll.hra],
                          ['LTA', selectedPayrollPreview.employee.payroll.lta],
                          ['Bonus', selectedPayrollPreview.employee.payroll.bonus],
                          ['Special allowance', selectedPayrollPreview.employee.payroll.specialAllowance],
                          ['Gross salary', selectedPayrollPreview.employee.payroll.grossSalary],
                        ]}
                        positive
                      />
                      <PreviewBreakupGroup
                        title="Deductions"
                        items={[
                          ['EPF (employee)', selectedPayrollPreview.employee.payroll.epfEmployee],
                          ['ESI (employee)', selectedPayrollPreview.employee.payroll.esiEmployee],
                          ['Professional tax', selectedPayrollPreview.employee.payroll.professionalTax],
                          ['Health insurance', selectedPayrollPreview.employee.payroll.healthInsurance],
                          ['TDS', selectedPayrollPreview.employee.payroll.tds],
                          ['Other deductions', selectedPayrollPreview.employee.payroll.otherDeductions],
                          ['Total deductions', selectedPayrollPreview.employee.payroll.deductions],
                        ]}
                        negative
                      />
                      <PreviewBreakupGroup
                        title="Employer contributions"
                        items={[
                          ['EPF (employer)', selectedPayrollPreview.employee.payroll.employerEpf],
                          ['ESI (employer)', selectedPayrollPreview.employee.payroll.employerEsi],
                          ['Gratuity', selectedPayrollPreview.employee.payroll.gratuity],
                          ['Company cost', selectedPayrollPreview.employee.payroll.companyCostMonthly],
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!preview?.valid?.length}
            onClick={handleImport}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Import {preview?.valid?.length ?? 0} employees
          </button>
        </div>
      </div>
    </Modal>
  )
}

function PreviewBreakupGroup({ title, items, positive, negative }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="space-y-2 text-sm">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-muted">{label}</span>
            <span
              className={`font-semibold ${
                negative ? 'text-red-600' : positive ? 'text-primary-dark' : 'text-foreground'
              }`}
            >
              ₹{Number(value || 0).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
