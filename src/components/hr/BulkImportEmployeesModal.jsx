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

  const emailSet = useMemo(
    () => new Set(existingEmails.map((e) => String(e).toLowerCase())),
    [existingEmails],
  )

  const reset = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    setParsing(false)
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
    } catch (err) {
      setError(err.message)
      setPreview(null)
    } finally {
      setParsing(false)
    }
  }

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
            and payroll, in the same order as your sheet. No manual entry.
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
              <div className="max-h-52 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-neutral-50">
                    <tr className="text-muted">
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium">Department</th>
                      <th className="px-3 py-2 font-medium">Join</th>
                      <th className="px-3 py-2 font-medium">Net pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.valid.map((row) => (
                      <tr key={row.row}>
                        <td className="px-3 py-2 font-medium">{row.employee.name}</td>
                        <td className="px-3 py-2">{row.employee.role}</td>
                        <td className="px-3 py-2">{row.employee.department}</td>
                        <td className="px-3 py-2">{row.employee.joinDate}</td>
                        <td className="px-3 py-2">
                          ₹{row.employee.payroll.net.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
