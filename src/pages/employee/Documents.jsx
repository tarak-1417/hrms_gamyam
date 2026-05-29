import { useMemo, useState } from 'react'
import { CalendarDays, Download, Eye, FileText, FolderOpen, ShieldCheck } from 'lucide-react'
import PortalDocumentPreviewModal from '../../components/employee/PortalDocumentPreviewModal'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import {
  buildEmployeePortalDocuments,
  downloadPortalDocument,
} from '../../utils/employeePortalDocuments'
import { formatDisplayDate } from '../../utils/timeUtils'

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="dashboard-section-eyebrow text-[11px] uppercase">{label}</p>
          <p className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{note}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
    </div>
  )
}

export default function Documents() {
  const { user } = useAuth()
  const { employeeDocuments = [], generatedDocuments = [] } = useHrms()
  const [previewDoc, setPreviewDoc] = useState(null)

  const docs = useMemo(
    () =>
      buildEmployeePortalDocuments({
        employeeId: user?.employeeId,
        employeeDocuments,
        generatedDocuments,
      }),
    [user?.employeeId, employeeDocuments, generatedDocuments],
  )

  const latestDate = docs.map((doc) => doc.date).sort((a, b) => b.localeCompare(a))[0]

  return (
    <div className="space-y-8 pb-8">
      <section className="dashboard-welcome-hero relative overflow-hidden rounded-3xl border border-primary/12 shadow-sm shadow-primary/5">
        <div className="dashboard-welcome-dots pointer-events-none absolute inset-0 opacity-35" aria-hidden />
        <div className="dashboard-welcome-shine pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative flex flex-col gap-6 px-6 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-dark">
              Document center
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-[2rem]">
              My documents
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
              A cleaner place to access offer letters, contracts, and finance documents from your
              employee portal.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-primary/20 bg-white/95 px-5 py-4 shadow-sm">
            <p className="text-base font-bold text-foreground">{docs.length} files available</p>
            <p className="mt-0.5 text-sm text-neutral-600">
              Latest update {latestDate ? formatDisplayDate(latestDate) : '—'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FolderOpen} label="Total files" value={docs.length} note="Ready in one place" />
        <StatCard
          icon={CalendarDays}
          label="Latest upload"
          value={latestDate ? formatDisplayDate(latestDate) : '—'}
          note="Most recent document in your portal"
        />
        <StatCard
          icon={ShieldCheck}
          label="Access"
          value="Secure"
          note="Employee-only documents from HR"
        />
      </section>

      {docs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-neutral-400" />
          <p className="mt-4 text-lg font-semibold text-foreground">No documents yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            HR-issued and generated letters will appear here when available.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {docs.map((doc) => (
            <article
              key={doc.id}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <FileText className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-foreground">{doc.name}</p>
                  <p className="mt-0.5 text-sm text-neutral-500">{doc.category}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Uploaded
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDisplayDate(doc.date)}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    File size
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{doc.size}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark sm:flex-none"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => downloadPortalDocument(doc)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary-light/30 sm:flex-none"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <PortalDocumentPreviewModal
        document={previewDoc}
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        onDownload={downloadPortalDocument}
      />
    </div>
  )
}
