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

function StatCard({ icon: Icon, label, value, note, glow, iconTint }) {
  return (
    <div className="hrx-card relative overflow-hidden p-5 sm:p-6">
      <span className={`hrx-glow ${glow} -right-6 -top-8 h-28 w-28`} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">{label}</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">{value}</p>
          <p className="mt-1 text-sm text-white/45">{note}</p>
        </div>
        <span className={`hrx-icon-tile h-11 w-11 ${iconTint}`}>
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
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <header className="hrx-card hrx-rise relative overflow-hidden p-6 sm:p-8">
        <span className="hrx-glow hrx-glow-indigo -left-10 -top-16 h-56 w-56 hrx-float" aria-hidden />
        <span className="hrx-glow hrx-glow-violet right-10 -top-20 h-48 w-48" aria-hidden />
        <span className="hrx-glow hrx-glow-cyan -bottom-24 right-1/3 h-52 w-52" aria-hidden />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-300/80">
              Document center
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-[2.4rem]">
              My{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                documents
              </span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
              A cleaner place to access offer letters, contracts, and finance documents from your
              employee portal.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
            <p className="text-base font-bold text-white">{docs.length} files available</p>
            <p className="mt-0.5 text-sm text-white/50">
              Latest update {latestDate ? formatDisplayDate(latestDate) : '—'}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FolderOpen}
          label="Total files"
          value={docs.length}
          note="Ready in one place"
          glow="hrx-glow-indigo"
          iconTint="text-indigo-300"
        />
        <StatCard
          icon={CalendarDays}
          label="Latest upload"
          value={latestDate ? formatDisplayDate(latestDate) : '—'}
          note="Most recent document in your portal"
          glow="hrx-glow-violet"
          iconTint="text-violet-300"
        />
        <StatCard
          icon={ShieldCheck}
          label="Access"
          value="Secure"
          note="Employee-only documents from HR"
          glow="hrx-glow-emerald"
          iconTint="text-emerald-300"
        />
      </section>

      {docs.length === 0 ? (
        <div className="hrx-card flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="hrx-icon-tile h-12 w-12 text-indigo-300">
            <FileText className="h-6 w-6" />
          </span>
          <p className="mt-4 text-lg font-semibold text-white">No documents yet</p>
          <p className="mt-1 text-sm text-white/45">
            HR-issued and generated letters will appear here when available.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {docs.map((doc) => (
            <article key={doc.id} className="hrx-card hrx-card-hover relative overflow-hidden p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="hrx-icon-tile h-12 w-12 text-indigo-300">
                  <FileText className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">{doc.name}</p>
                  <p className="mt-0.5 text-sm text-white/45">{doc.category}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    Uploaded
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatDisplayDate(doc.date)}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    File size
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{doc.size}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400 sm:flex-none"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => downloadPortalDocument(doc)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:flex-none"
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
